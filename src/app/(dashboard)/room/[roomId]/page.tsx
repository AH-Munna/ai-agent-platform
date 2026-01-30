"use client";

import { use, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

type RoomMessage = {
    id: string;
    role: "assistant" | "system"; // In room, all chars are assistants
    content: string;
    character?: { name: string; avatar?: string | null; id: string } | null;
    characterId?: string;
};

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
    const { roomId } = use(params);
    const utils = api.useUtils();
    const { data: room, isLoading } = api.room.getById.useQuery({ id: roomId });
    const restartMutation = api.room.restart.useMutation({
        onSuccess: () => {
            console.log("Restart mutation success");
            utils.room.getById.invalidate({ id: roomId });
            setStatus("idle");
            setTurnsRemaining(0);
            toast.success("Conversation restarted");
        },
        onError: (err) => {
            console.error("Restart mutation error:", err);
            toast.error("Failed to restart: " + err.message);
        }
    });

    type RoomStatus = "idle" | "running" | "stopped" | "error";
    const [messages, setMessages] = useState<RoomMessage[]>([]);
    const [status, setStatus] = useState<RoomStatus>("idle");
    const [turnsRemaining, setTurnsRemaining] = useState(0);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const isStreamingRef = useRef(false);
    const messageCountRef = useRef(0);

    // Sync messages from DB - avoid overwriting streaming state
    useEffect(() => {
        if (room?.messages) {
            // Don't overwrite during active streaming
            if (isStreamingRef.current) return;
            
            const uiMessages: RoomMessage[] = room.messages.map(m => ({
                id: m.id,
                role: "assistant",
                content: m.content,
                character: m.character,
                characterId: m.characterId
            }));
            
            // Sync messageCountRef with DB
            messageCountRef.current = uiMessages.length;
            
            // Preserve streaming placeholder if present
            setMessages(prev => {
                const streamingMsg = prev.find(m => m.id === "streaming");
                if (streamingMsg) {
                    return [...uiMessages, streamingMsg];
                }
                // Only update if messages changed to avoid jitter
                if (prev.length !== uiMessages.length) return uiMessages;
                const lastPrev = prev[prev.length - 1];
                const lastNew = uiMessages[uiMessages.length - 1];
                if (lastPrev?.content !== lastNew?.content) return uiMessages;
                return prev;
            });

            if (room.status) {
                // Keep local running state - DB idle is just the default persistent state
                if (status === "running" && room.status === "idle") {
                    // Keep running
                } else {
                     setStatus(room.status as any);
                }
                
                if (room.status === "error" && room.errorMessage) {
                    setErrorDetails(room.errorMessage);
                }
            }
        }
    }, [room, status]);



    // Format Message Text (Markdown + Styles)
    const renderContent = (content: string, charName: string, userName: string) => {
        // Variable replacement
        let replaced = content
            .replaceAll("{{char}}", charName)
            .replaceAll("{{user}}", userName);

        // Stylize quotes (Orange)
        replaced = replaced.replace(/"([^"]*)"/g, '<span class="text-orange-400">"$1"</span>');
        
        // Stylize asterisks/italics (Gray)
        replaced = replaced.replace(/\*([^*]+)\*/g, '<em class="text-gray-400 inline-block">$1</em>');

        return (
            <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed">
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                        em: ({node, ...props}) => <span className="text-gray-400 italic" {...props} />, 
                        p: ({node, ...props}) => <p className="mb-2" {...props} />
                    }}
                >
                    {replaced}
                </ReactMarkdown>
            </div>
        );
    };

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, status]);

    const runTurn = async () => {
        if (!room) return false;
        
        try {
            const controller = new AbortController();
            abortControllerRef.current = controller;
            isStreamingRef.current = true;
            
            // Use ref for message count - this persists across async calls
            const currentMsgCount = messageCountRef.current;
            const isTurnA = currentMsgCount % 2 === 0;
            const nextSpeaker = isTurnA ? room.characterA : room.characterB;
            
            // Add placeholder with correct characterId for proper positioning
            setMessages(prev => [...prev.filter(m => m.id !== "streaming"), { 
                id: "streaming", 
                role: "assistant", 
                content: "...",
                characterId: nextSpeaker.id,
                character: { name: nextSpeaker.name, avatar: nextSpeaker.avatar, id: nextSpeaker.id }
            }]);

            const response = await fetch(`/api/room/${roomId}/chat`, {
                method: "POST",
                signal: controller.signal,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}) 
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let accumulatedResponse = "";

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value, { stream: true });
                if (chunkValue) {
                    accumulatedResponse += chunkValue;
                    setMessages(prev => {
                        return prev.map(m => {
                            if (m.id === "streaming") {
                                return { ...m, content: accumulatedResponse };
                            }
                            return m;
                        });
                    });
                }
            }

            isStreamingRef.current = false;
            
            // Convert streaming placeholder to a temp message to keep positioning correct
            const tempId = `temp-${Date.now()}`;
            setMessages(prev => prev.map(m => {
                if (m.id === "streaming") {
                    return { ...m, id: tempId, content: accumulatedResponse };
                }
                return m;
            }));
            
            // Increment ref so next turn knows the correct speaker
            messageCountRef.current++;
            
            return true;

        } catch (e: any) {
            isStreamingRef.current = false;
            if (e.name === 'AbortError') {
                setMessages(prev => prev.filter(m => m.id !== "streaming"));
                return false; 
            }
            console.error("Turn error:", e);
            setErrorDetails(e.message || "Unknown error");
            setStatus("error");
            setMessages(prev => prev.filter(m => m.id !== "streaming"));
            return false;
        }
    };

    const startConversation = async (turns = 10) => {
        if (!room || status === "error") return;
        setStatus("running");
        setTurnsRemaining(turns);
        setErrorDetails(null);
        
        let currentTurns = turns;
        let completed = false;
        
        while (currentTurns > 0) {
            if (abortControllerRef.current?.signal.aborted) break;
            
            const success = await runTurn();
            if (!success) break;

            currentTurns--;
            setTurnsRemaining(currentTurns);
            
            if (currentTurns === 0) completed = true;

            // Small delay between turns
            if (currentTurns > 0) await new Promise(r => setTimeout(r, 1000));
        }
        
        // Sync with DB to replace temp messages with real ones
        utils.room.getById.invalidate({ id: roomId });
        
        if (completed) {
            setStatus("idle");
        }
        setTurnsRemaining(0);
        abortControllerRef.current = null;
    };

    const stopConversation = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setStatus("stopped");
        setTurnsRemaining(0);
        // Sync with DB to get persisted messages
        utils.room.getById.invalidate({ id: roomId });
    };

    const [isRestartConfirmOpen, setIsRestartConfirmOpen] = useState(false);

    const handleRestart = async (force: boolean = false) => {
        // Ensure force is a boolean, not an event object
        const shouldForce = force === true;
        
        if (shouldForce) {
             console.log("Triggering forced restart for room:", roomId);
             stopConversation();
             try {
                await restartMutation.mutateAsync({ id: roomId });
             } catch (e) {
                console.error("Restart error catch:", e);
             }
        } else {
            setIsRestartConfirmOpen(true);
        }
    };
    
    const confirmRestart = async () => {
        setIsRestartConfirmOpen(false);
        console.log("Triggering confirm restart for room:", roomId);
        stopConversation();
        try {
            await restartMutation.mutateAsync({ id: roomId });
        } catch (e) {
            console.error("Restart error catch:", e);
        }
    };

    if (isLoading) return <div className="p-10 text-center animate-pulse">Loading Room...</div>;
    if (!room) return <div className="p-10 text-center text-red-500">Room not found</div>;

    const characterA = room.characterA;
    const characterB = room.characterB;

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] bg-background">
            {/* Header */}
            <div className="flex-none p-4 border-b flex items-center justify-between bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-10 w-10 border-2 border-primary/20">
                            <AvatarImage src={characterA.avatar || ""} />
                            <AvatarFallback>{characterA.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold hidden md:inline">{characterA.name}</span>
                    </div>
                    <span className="text-muted-foreground font-bold">and</span>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold hidden md:inline">{characterB.name}</span>
                        <Avatar className="h-10 w-10 border-2 border-primary/20">
                            <AvatarImage src={characterB.avatar || ""} />
                            <AvatarFallback>{characterB.name[0]}</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground font-mono min-w-[120px] text-right">
                        {status === "running" ? (
                            <span className="flex items-center justify-end gap-2 text-primary animate-pulse">
                                ● Running: {turnsRemaining}
                            </span>
                        ) : (
                            <span className={cn("capitalize", status === "error" ? "text-destructive" : "")}>
                                {status}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleRestart(false)} disabled={ status === "running" }>
                            Restart
                        </Button>

                         {status === "running" ? (
                             <Button variant="destructive" onClick={stopConversation}>
                                 ⏹️ Stop
                             </Button>
                         ) : (
                             <>
                                <Button onClick={() => startConversation(10)} variant="default" disabled={status === "error"}>
                                    ▶️ Continue (+10)
                                </Button>
                             </>
                         )}
                    </div>
                </div>
            </div>

            {/* Conversation Area */}
            <ScrollArea className="flex-1 p-4 bg-muted/5">
                <div className="max-w-3xl mx-auto space-y-8 pb-10">
                    {messages.map((msg, idx) => {
                         const isCharB = msg.characterId === characterB.id || (!msg.characterId && idx % 2 !== 0); 
                         const speakerName = isCharB ? characterB.name : characterA.name;
                         const otherName = isCharB ? characterA.name : characterB.name;
                         
                         return (
                            <div key={idx} className={cn("flex gap-4 w-full", isCharB ? "justify-end" : "justify-start")}>
                                {!isCharB && (
                                    <Avatar className="h-8 w-8 mt-1 border border-border shadow-sm flex-none">
                                        <AvatarImage src={msg.character?.avatar || characterA.avatar || ""} />
                                        <AvatarFallback>{characterA.name[0]}</AvatarFallback>
                                    </Avatar>
                                )}

                                <div className={cn("flex flex-col max-w-[85%]", isCharB ? "items-end" : "items-start")}>
                                    <div className="text-xs text-muted-foreground mb-1 px-1">
                                        {msg.character?.name || (isCharB ? characterB.name : characterA.name)}
                                    </div>
                                    <Card className={cn("p-4 shadow-sm", isCharB ? "bg-primary/10 border-primary/20" : "bg-card")}>
                                        {msg.role === "system" ? (
                                            <div className="text-destructive font-mono text-sm">{msg.content}</div>
                                        ) : (
                                            renderContent(msg.content, speakerName, otherName)
                                        )}
                                    </Card>
                                </div>

                                {isCharB && (
                                    <Avatar className="h-8 w-8 mt-1 border border-border shadow-sm flex-none">
                                        <AvatarImage src={msg.character?.avatar || characterB.avatar || ""} />
                                        <AvatarFallback>{characterB.name[0]}</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                         );
                    })}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Restart Confirmation Dialog */}
            <AlertDialog open={isRestartConfirmOpen} onOpenChange={setIsRestartConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restart Conversation?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete all messages and reset the conversation to the beginning. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRestart} className="bg-destructive hover:bg-destructive/90">
                            Yes, Restart
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Error Dialog */}
            <AlertDialog open={!!errorDetails} onOpenChange={(open) => !open && setErrorDetails(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Conversation Error</AlertDialogTitle>
                        <AlertDialogDescription className="text-destructive">
                            {errorDetails}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setErrorDetails(null)}>Close</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { 
                            setErrorDetails(null); 
                            handleRestart(true); // Force restart without second confirm
                        }}>Restart Room</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
