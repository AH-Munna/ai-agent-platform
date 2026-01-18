"use client";

import { Bot, Edit, RefreshCw, Send, Trash2, User } from "lucide-react";
import { use, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

// Types
type Message = {
    role: "user" | "assistant" | "system";
    content: string;
    id?: string;
    character?: { name: string; avatar?: string | null } | null;
    userPersona?: { name: string; avatar?: string | null } | null;
};

export default function ChatPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  
  const utils = api.useUtils();
  const { data: session, isLoading } = api.session.getById.useQuery({ id: sessionId });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync with DB
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const deleteMessageMutation = api.message.delete.useMutation({
      onSuccess: () => utils.session.getById.invalidate({ id: sessionId })
  });

  const updateMessageMutation = api.message.update.useMutation({
      onSuccess: () => {
          utils.session.getById.invalidate({ id: sessionId });
          setEditingMessageId(null);
      }
  });

  const startEditing = (msg: Message) => {
      if (!msg.id) return;
      setEditingMessageId(msg.id);
      setEditContent(msg.content);
  };

  const handleUpdateMessage = async (id: string) => {
      await updateMessageMutation.mutateAsync({ id, content: editContent });
  };
  
  useEffect(() => {
    if (session?.messages) {
        const uiMessages = session.messages.map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content,
            id: m.id,
            character: m.character,
            userPersona: m.userPersona
        }));
        setMessages(uiMessages);
    }
  }, [session]);

  useEffect(() => {
     if (scrollRef.current) {
         scrollRef.current.scrollIntoView({ behavior: "smooth" });
     }
  }, [messages, isStreaming]);

  const saveMessageMutation = api.message.create.useMutation();

  const character = session?.participants[0];

// ...

  // Helper to replace variables in UI
  const renderContent = (content: string, role: string) => {
      let userName = "User";
      // Prioritize Session Persona, then History
      if (session?.userPersona) {
          userName = session.userPersona.name;
      } else {
           const lastUserMsg = [...messages].reverse().find(m => m.role === "user" && m.userPersona);
           if (lastUserMsg?.userPersona) userName = lastUserMsg.userPersona.name;
      }

      const charName = character?.name || "Character";
      
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
                    p: ({node, ...props}) => <p className="mb-2" {...props} /> // Add margin to paragraphs
                }}
            >
                {replaced}
            </ReactMarkdown>
          </div>
      );
  };


  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;

    const content = input;
    setInput("");
    
    // 1. Optimistic Update
    const userMsg: Message = { role: "user", content };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    try {
        // 2. Persist User Message
        await saveMessageMutation.mutateAsync({
            content,
            role: "user",
            sessionId,
            // TODO: userPersonaId if selected
        });

        // 3. Trigger LLM
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sessionId,
                messages: [
                    ...messages.map(m => ({ role: m.role, content: m.content })),
                    { role: "user", content }
                ]
            })
        });

        if (!response.body) throw new Error("No response body");

        setMessages(prev => [...prev, { role: "assistant", content: "" }]);
        
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
                    const newMsgs = [...prev];
                    const lastMsg = newMsgs[newMsgs.length - 1];
                    if (lastMsg && lastMsg.role === "assistant") {
                        lastMsg.content = accumulatedResponse;
                    }
                    return newMsgs;
                });
            }
        }
        
        // 4. Invalidate to fetch robust data (Ids, timestamps etc)
        // Note: This might cause a slight flicker if optimistic state differs, 
        // but persistent state is source of truth.
        utils.session.getById.invalidate({ id: sessionId });

    } catch (e: any) {
        console.error("Chat error:", e);
        toast.error("Failed to send message: " + e.message);
        setMessages(prev => [...prev, { role: "system", content: "Error: " + e.message }]);
    } finally {
        setIsStreaming(false);
    }
  };

  if (isLoading) return <div className="p-10">Loading chat...</div>;
  if (!session) return <div className="p-10">Session not found</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]"> 
      <div className="flex-none p-4 border-b flex items-center gap-4">
         <Avatar>
            <AvatarImage src={character?.avatar || ""} />
            <AvatarFallback>{character?.name?.[0] || "?"}</AvatarFallback>
         </Avatar>
         <div>
            <h2 className="text-xl font-bold">{character?.name || "Chat"}</h2>
            <p className="text-xs text-muted-foreground line-clamp-1">{session.scenario || character?.bio}</p>
         </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6 pb-4">

             {messages.map((msg, idx) => (
                <div key={idx} className={cn("group flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                    {msg.role === "assistant" && (
                        <Avatar className="h-8 w-8 mt-1 flex-none">
                             <AvatarImage src={msg.character?.avatar || character?.avatar || ""} />
                             <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                    )}

                    <div className={cn("flex flex-col max-w-[85%]", msg.role === "user" ? "items-end" : "items-start")}>
                        <div className={cn(
                            "rounded-lg px-4 py-2 text-sm shadow-sm w-full",
                            msg.role === "user" 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-secondary/50 border"
                        )}>
                            {editingMessageId === msg.id ? (
                                <div className="space-y-2">
                                    <textarea 
                                        className="w-full bg-transparent border rounded p-1 text-inherit focus:outline-none"
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        rows={3}
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <Button size="sm" variant="ghost" onClick={() => setEditingMessageId(null)}>Cancel</Button>
                                        <Button size="sm" onClick={() => handleUpdateMessage(msg.id!)}>Save</Button>
                                    </div>
                                </div>
                            ) : (
                                renderContent(msg.content, msg.role)
                            )}
                        </div>

                        {/* Actions (visible on hover) */}
                        {msg.id && !isStreaming && (
                            <div className={cn(
                                "opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mt-1 text-muted-foreground",
                                msg.role === "user" ? "justify-end" : "justify-start"
                            )}>
                                <button onClick={() => startEditing(msg)} className="hover:text-foreground p-1"><Edit className="h-3 w-3" /></button>
                                <button onClick={() => deleteMessageMutation.mutate({ id: msg.id! })} className="hover:text-destructive p-1"><Trash2 className="h-3 w-3" /></button>
                            </div>
                        )}
                    </div>

                    {msg.role === "user" && (
                        <Avatar className="h-8 w-8 mt-1 flex-none">
                             <AvatarImage src={msg.userPersona?.avatar || ""} />
                             <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                    )}
                </div>
             ))}
             <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="flex-none p-4 border-t bg-background">
        <form onSubmit={handleSend} className="flex gap-2">
             <Input 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                placeholder={`Message ${character?.name || "AI"}...`}
                disabled={isStreaming}
                className="flex-1"
             />
             <Button type="submit" disabled={isStreaming}>
                 {isStreaming ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
             </Button>
        </form>
      </div>
    </div>
  );
}
