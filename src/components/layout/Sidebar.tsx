"use client";

import { LayoutDashboard, MessageSquare, Plus, Settings, Trash2, User, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter(); 
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  
  const utils = api.useUtils();
  const { data: sessions } = api.session.getAll.useQuery();
  const { data: characters } = api.character.getAll.useQuery(); 
  const { data: personas } = api.persona.getAll.useQuery();
  
  const createSessionMutation = api.session.create.useMutation({
      onSuccess: (newSession) => {
          toast.success("Chat created!");
          setIsNewChatOpen(false);
          router.push(`/chat/${newSession.id}`);
          router.refresh();
      },
      onError: (e) => {
          toast.error(`Failed to create chat: ${e.message}`);
      }
  });

  const deleteSessionMutation = api.session.delete.useMutation({
      onSuccess: () => {
          toast.success("Chat deleted");
          utils.session.getAll.invalidate();
          router.push("/");
          router.refresh();
      },
      onError: (e) => {
          toast.error("Failed to delete chat");
      }
  });

  const handleCreateChat = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const characterId = formData.get("characterId") as string;
      const scenario = formData.get("scenario") as string;
      const name = formData.get("name") as string || "New Chat";
      const userPersonaId = formData.get("userPersonaId") as string;
      
      if (!characterId) return; // Should be handled by required attribute but safe check

      createSessionMutation.mutate({
          name,
          scenario,
          characterId,
          userPersonaId: userPersonaId || undefined,
      });
  };

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/characters", label: "Characters", icon: Users },
    { href: "/personas", label: "My Personas", icon: User },
    { href: "/rooms", label: "Rooms", icon: MessageSquare },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-muted/20">
      <div className="p-6">
        <h2 className="text-xl font-bold tracking-tight mb-6">AI Platform</h2>
        <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
            <DialogTrigger asChild>
                <Button className="w-full justify-start gap-2" variant="default">
                    <Plus className="h-4 w-4" /> New Chat
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Start New Chat</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateChat} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Character</Label>
                        <Select name="characterId" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a character" />
                            </SelectTrigger>
                            <SelectContent>
                                {characters?.map(char => (
                                    <SelectItem key={char.id} value={char.id}>
                                        {char.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Chat Name</Label>
                        <Input name="name" placeholder="E.g. Chat with User" />
                    </div>
                    <div className="space-y-2">
                        <Label>Persona</Label>
                         <Select name="userPersonaId">
                            <SelectTrigger>
                                <SelectValue placeholder="Select your persona" />
                            </SelectTrigger>
                            <SelectContent>
                                {personas?.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Scenario (Optional)</Label>
                        <Input name="scenario" placeholder="Current location, context..." />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={createSessionMutation.isPending}>
                            {createSessionMutation.isPending ? "Starting..." : "Start Chat"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>
      
      {/* ... rest of sidebar ... */}

      
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4">
            <div className="py-2">
                <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground">Navigation</h3>
                <div className="space-y-1">
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href}>
                             <Button 
                                variant={pathname === item.href ? "secondary" : "ghost"} 
                                className={cn("w-full justify-start", pathname === item.href && "bg-secondary")}
                            >
                                <item.icon className="mr-2 h-4 w-4" />
                                {item.label}
                            </Button>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="py-2">
                <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground">Recent Chats</h3>
                <div className="space-y-1">
                    {sessions?.map(session => (
                        <div key={session.id} className="group flex items-center gap-1 pr-2">
                             <Link href={`/chat/${session.id}`} className="flex-1 min-w-0">
                                  <Button 
                                    variant={pathname === `/chat/${session.id}` ? "secondary" : "ghost"} 
                                    className="w-full justify-start text-xs truncate"
                                >
                                    <MessageSquare className="mr-2 h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">{session.name || "Untitled Chat"}</span>
                                </Button>
                            </Link>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="h-3 w-3 text-red-500" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Delete Chat?</DialogTitle>
                                    </DialogHeader>
                                    <p className="text-sm text-muted-foreground">
                                        Are you sure you want to delete "{session.name}"? This cannot be undone.
                                    </p>
                                    <DialogFooter>
                                        <Button variant="destructive" onClick={() => deleteSessionMutation.mutate({ id: session.id })}>
                                            {deleteSessionMutation.isPending ? "Deleting..." : "Yes, Delete"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    ))}
                    {sessions?.length === 0 && (
                        <p className="text-xs text-muted-foreground px-2">No chats yet.</p>
                    )}
                </div>
            </div>
        </div>
      </ScrollArea>
    </div>
  );
}
