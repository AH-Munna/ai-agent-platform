import * as fs from "fs";
import OpenAI from "openai";
import * as path from "path";
import { db } from "~/server/db";

export const maxDuration = 60; // Longer timeout for AI-AI turns

function logDebug(message: string, data: any) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}: ${JSON.stringify(data, null, 2)}\n`;
    try {
        const logPath = path.join(process.cwd(), 'debug_room.log');
        fs.appendFileSync(logPath, logEntry);
    } catch (e) {
        console.error("Failed to write to log file", e);
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
    try {
        const { roomId } = await params;
        const body = await req.json();
        const { modelName } = body; // Optional model override

        logDebug("Room Chat Request", { roomId, modelName });

        // 1. Get Room & Characters
        const room = await db.room.findUnique({
            where: { id: roomId },
            include: {
                characterA: true,
                characterB: true,
                user: { select: { globalSettings: true } },
                messages: {
                    orderBy: { createdAt: 'desc' }, // Get latest first
                    take: 50, // Limit context window
                    include: { character: true }
                }
            }
        });

        if (!room) {
            return new Response("Room not found", { status: 404 });
        }

        // 2. Determine Speaker (Alternating A -> B -> A)
        // Default to Character A starts, so first response should be from B if A greeted.
        // Logic: Count messages. Even count (0, 2, 4) -> A speaks. Odd count (1, 3) -> B speaks.
        // However, we usually seed A's greeting as msg 0. So msg count 1 -> B speaks.
        const messageCount = room.messages.length;
        const isTurnA = messageCount % 2 === 0;
        const currentSpeaker = isTurnA ? room.characterA : room.characterB;
        const otherCharacter = isTurnA ? room.characterB : room.characterA;

        logDebug("Turn Logic", { msgCount: messageCount, speaker: currentSpeaker.name });

        // 3. Configure API
        const globalSettings: any = room.user.globalSettings || {};
        const apiKey = globalSettings.apiKey || process.env.NVIDIA_API_KEY;
        
        if (!apiKey) return new Response("Missing API Key", { status: 500 });

        const openai = new OpenAI({
            baseURL: globalSettings.baseUrl || "https://integrate.api.nvidia.com/v1",
            apiKey: apiKey,
        });

        // 4. Construct System Prompt & History
        const replaceVars = (text: string) => {
            if (!text) return "";
            return text
                .replaceAll("{{char}}", currentSpeaker.name)
                .replaceAll("{{user}}", otherCharacter.name); // In AI-AI, "user" is the other AI
        };

        const systemPromptRaw = `
You are ${currentSpeaker.name}.
You are in a roleplay with ${otherCharacter.name}.

Your Persona:
${currentSpeaker.bio}

Other Character Persona:
${otherCharacter.bio}

Scenario:
${room.scenario || "A conversation between two characters."}

RULES:
1. Speak ONLY as ${currentSpeaker.name}.
2. Do not speak for ${otherCharacter.name}.
3. Keep responses concise and relevant to the conversation.
4. React to the previous message.
`.trim();

        const messages = room.messages.reverse().map(m => ({
            role: m.characterId === currentSpeaker.id ? "assistant" : "user",
            content: replaceVars(m.content)
        }));

        const effectiveMessages = [
            { role: "system", content: replaceVars(systemPromptRaw) },
            ...messages
        ];

        // 5. Call LLM
        const response = await openai.chat.completions.create({
            model: modelName || "deepseek-ai/deepseek-v3.2",
            messages: effectiveMessages as any,
            temperature: 0.9,
            max_tokens: 4096,
            stream: true,
             // @ts-ignore
             chat_template_kwargs: { thinking: true },
        } as any) as any;

        // 6. Stream & Save
        const encoder = new TextEncoder();
        let fullResponse = "";

        const stream = new ReadableStream({
            async start(controller) {
                let isClosed = false;
                try {
                    for await (const chunk of response) {
                        if (isClosed) break;
                        const content = chunk.choices[0]?.delta?.content || "";
                        if (content) {
                            fullResponse += content;
                            controller.enqueue(encoder.encode(content));
                        }
                    }

                    if (fullResponse.trim()) {
                        await db.roomMessage.create({
                            data: {
                                content: fullResponse,
                                roomId: room.id,
                                characterId: currentSpeaker.id
                            }
                        });
                        
                        await db.room.update({
                            where: { id: room.id },
                            data: { turnCount: { increment: 1 } }
                        });
                    } else {
                        await db.room.update({
                            where: { id: room.id },
                            data: { 
                                status: "error",
                                errorMessage: "AI returned empty response"
                            }
                        });
                        controller.enqueue(encoder.encode("\n[SYSTEM ERROR: AI returned empty response. Conversation stopped.]"));
                    }

                    isClosed = true;
                    controller.close();
                } catch (err: any) {
                    if (isClosed) return;
                    
                    // Check if this is a client abort (connection closed)
                    const isAbort = err.name === 'AbortError' || 
                                    err.code === 'ERR_INVALID_STATE' ||
                                    err.message?.includes('aborted') ||
                                    err.message?.includes('closed');
                    
                    if (isAbort) {
                        // Client aborted - not an error, just close gracefully
                        isClosed = true;
                        try { controller.close(); } catch {}
                        return;
                    }
                    
                    // Real API error - set error state
                    console.error("Stream Error", err);
                    await db.room.update({
                        where: { id: room.id },
                        data: { 
                            status: "error",
                            errorMessage: err.message
                        }
                    });
                    try { controller.error(err); } catch {}
                }
            }
        });

        return new Response(stream, {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        });

    } catch (error: any) {
        console.error("Room API Error", error);
        logDebug("Error", error);
        // Attempt to update room status if possible
        try {
             // We can't easily get roomId here if it failed early, but if we have it:
             // await db.room.update(...) 
        } catch {}
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
