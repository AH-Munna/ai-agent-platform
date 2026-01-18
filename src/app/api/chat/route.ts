import * as fs from "fs";
import OpenAI from "openai";
import * as path from "path";
import { db } from "~/server/db";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Simple file logger for debugging
function logDebug(message: string, data: any) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}: ${JSON.stringify(data, null, 2)}\n`;
    try {
        const logPath = path.join(process.cwd(), 'debug_chat.log');
        fs.appendFileSync(logPath, logEntry);
    } catch (e) {
        console.error("Failed to write to log file", e);
    }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    logDebug("Raw Request Body", body);
    
    // Default to empty array if missing
    let { messages = [], sessionId, modelName } = body;
    // Fallback if client still sends roomId
    if (!sessionId && body.roomId) sessionId = body.roomId;

    logDebug("Incoming Request", { sessionId, modelName, messageCount: messages?.length });

    // 1. Get Session & Participants (for context/identity)
    const session = await db.chatSession.findUnique({
        where: { id: sessionId },
        include: {
            participants: true,
            user: { select: { globalSettings: true } }, 
            userPersona: true,
            messages: { 
                orderBy: { createdAt: 'asc' }, 
                take: 20,
                include: { character: true, userPersona: true }
            } 
        }
    });

    if (!session) {
        return new Response("Session not found", { status: 404 });
    }
    
    // If client sent no messages, use DB history to construct prompt context
    if (messages.length === 0 && session.messages.length > 0) {
        logDebug("Using DB History", { count: session.messages.length });
        messages = session.messages.map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content
        }));
    }

    // 2. Identify Speaker (Assistant Turn)
    const participants = session.participants;
    if (participants.length === 0) {
        return new Response("No characters in session", { status: 400 });
    }

    const character = participants[0]; 
    if (!character) return new Response("Character not found", { status: 500 });
    const characterId = character.id;
    
    // 3. Configure API Key
    const globalSettings: any = session.user.globalSettings || {};
    const apiKey = process.env.NVIDIA_API_KEY; 
    
    if (!apiKey) {
        return new Response("Missing API Key", { status: 500 });
    }

    // 4. Instantiate OpenAI Client
    const openai = new OpenAI({
      baseURL: globalSettings.baseUrl || "https://integrate.api.nvidia.com/v1", // Allow override
      apiKey: apiKey,
    });

    // User Persona Logic:
    let userDisplayName = "User";
    let userPersonaBio = "";
    
    if (session.userPersona) {
        userDisplayName = session.userPersona.name;
        userPersonaBio = session.userPersona.bio;
    } else {
        const userMessages = session.messages.filter(m => m.role === "user");
        if (userMessages.length > 0) {
            const lastMsg = userMessages[userMessages.length - 1];
            if (lastMsg && lastMsg.userPersona) {
                userDisplayName = lastMsg.userPersona.name;
            }
        }
    }
    
    // Helper for variable replacement
    const replaceVars = (text: string) => {
        if (!text) return "";
        return text
            .replaceAll("{{char}}", character.name)
            .replaceAll("{{user}}", userDisplayName);
    };

    // System Prompt Construction (Strict 5-step)
    const mainPrompt = globalSettings.systemPrompt || "You are a roleplay assistant.";
    
    // We construct it exactly as requested
    const systemPromptRaw = `${mainPrompt}

${userPersonaBio ? `User Persona: ${userPersonaBio}` : ""}

Character Persona: ${character.bio}

${session.scenario ? `Scenario: ${session.scenario}` : ""}

[Start a new Chat]
`.trim();

    const systemPrompt = replaceVars(systemPromptRaw);

    const effectiveMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map((m:any) => ({
            role: m.role,
            content: replaceVars(m.content)
        }))
    ];

    // --- LOGGING REQUEST ---
    try {
        const logDir = path.join(process.cwd(), 'testdata');
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        
        const requestLogPath = path.join(logDir, 'api_request.log');
        const logContent = `\n\n--- REQUEST [${new Date().toISOString()}] ---\n` + 
                           JSON.stringify({ model: modelName, messages: effectiveMessages }, null, 2);
        fs.appendFileSync(requestLogPath, logContent);
    } catch (e) { console.error("Log Error", e); }
    // -----------------------

    // 6. Create Completion Stream
    const response = await openai.chat.completions.create({
      model: modelName || "deepseek-ai/deepseek-v3.1-terminus", 
      messages: effectiveMessages as any,
      temperature: 0.9,
      max_tokens: 4096,
      stream: true,
      // @ts-ignore
      chat_template_kwargs: { thinking: true }, 
    } as any) as any;

    // 7. Manual Stream Handling
    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of response) {
                    const content = chunk.choices[0]?.delta?.content || "";
                    if (content) {
                        fullResponse += content;
                        controller.enqueue(encoder.encode(content));
                    }
                }
                
                // --- LOGGING RESPONSE ---
                try {
                    const logDir = path.join(process.cwd(), 'testdata');
                    const responseLogPath = path.join(logDir, 'api_response.log');
                    const logContent = `\n\n--- RESPONSE [${new Date().toISOString()}] ---\n` + fullResponse;
                    fs.appendFileSync(responseLogPath, logContent);
                } catch (e) { console.error("Log Error", e); }
                // ------------------------

                // Save to DB
                if (fullResponse.trim()) {
                     await db.message.create({
                        data: {
                            content: fullResponse,
                            role: "assistant", 
                            sessionId,
                            characterId,
                        },
                    });
                }
                
                controller.close();

            } catch (err) {
                console.error("Stream Error", err);
                controller.error(err);
            }
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
        },
    });

  } catch (error: any) {
    console.error("Error in chat route:", error);
    logDebug("Error", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
