"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner"; // Assuming sonner is used as in other files
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

export default function RoomsPage() {
    const utils = api.useUtils();
    const { data: rooms, isLoading } = api.room.getAll.useQuery();
    const { data: characters } = api.character.getAll.useQuery();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [name, setName] = useState("");
    const [scenario, setScenario] = useState("");
    const [charAId, setCharAId] = useState("");
    const [charBId, setCharBId] = useState("");

    const createRoomMutation = api.room.create.useMutation({
        onSuccess: () => {
            toast.success("Room created successfully!");
            setIsDialogOpen(false);
            setName("");
            setScenario("");
            setCharAId("");
            setCharBId("");
            utils.room.getAll.invalidate();
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });

    const handleCreate = () => {
        if (!name || !charAId || !charBId) {
            toast.error("Please fill in all required fields");
            return;
        }
        if (charAId === charBId) {
            toast.error("Please select two different characters");
            return;
        }

        // Check if Char A has greeting
        const charA = characters?.find(c => c.id === charAId);
        if (!charA?.greeting) {
            toast.error(`Character A (${charA?.name}) must have a greeting message to start the conversation.`);
            return;
        }

        createRoomMutation.mutate({
            name,
            scenario,
            characterAId: charAId,
            characterBId: charBId,
        });
    };
    
    const deleteRoomMutation = api.room.delete.useMutation({
        onSuccess: () => utils.room.getAll.invalidate()
    });

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">AI Conversation Rooms</h1>
                    <p className="text-muted-foreground">Watch two AI characters converse with each other.</p>
                </div>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Create Room</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create New Room</DialogTitle>
                            <DialogDescription>
                                Set up a conversation between two characters. Character A will start with their greeting.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Room Name</Label>
                                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Physics Debate" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Character A (Starts)</Label>
                                    <Select value={charAId} onValueChange={setCharAId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select..." />
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
                                <div className="grid gap-2">
                                    <Label>Character B</Label>
                                    <Select value={charBId} onValueChange={setCharBId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select..." />
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
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="scenario">Scenario (Optional)</Label>
                                <Textarea 
                                    id="scenario" 
                                    value={scenario} 
                                    onChange={e => setScenario(e.target.value)} 
                                    placeholder="Describe the setting and context..." 
                                    rows={3}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={createRoomMutation.isPending}>
                                {createRoomMutation.isPending ? "Creating..." : "Create Room"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rooms?.map(room => (
                    <Card key={room.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-bold truncate pr-6">
                                <Link href={`/room/${room.id}`} className="hover:underline">
                                    {room.name}
                                </Link>
                            </CardTitle>
                             {/* Delete Button */}
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-destructive -mt-1 -mr-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if(confirm("Delete this room?")) deleteRoomMutation.mutate({ id: room.id });
                                }}
                             >
                                <span className="sr-only">Delete</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                             </Button>
                        </CardHeader>
                        <CardContent>
                            <Link href={`/room/${room.id}`}>
                                <div className="flex items-center justify-center space-x-4 py-4 mb-4">
                                    <div className="text-center">
                                        <Avatar className="h-16 w-16 mb-2 mx-auto border-2 border-primary/20">
                                            <AvatarImage src={room.characterA.avatar || ""} />
                                            <AvatarFallback>{room.characterA.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <p className="font-medium text-sm truncate max-w-[100px]">{room.characterA.name}</p>
                                    </div>
                                    <div className="text-muted-foreground font-bold text-lg">VS</div>
                                    <div className="text-center">
                                        <Avatar className="h-16 w-16 mb-2 mx-auto border-2 border-primary/20">
                                            <AvatarImage src={room.characterB.avatar || ""} />
                                            <AvatarFallback>{room.characterB.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <p className="font-medium text-sm truncate max-w-[100px]">{room.characterB.name}</p>
                                    </div>
                                </div>
                                <div className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                                    {room.scenario || "No specific scenario."}
                                </div>
                                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                                    <span className={`capitalize px-2 py-0.5 rounded-full ${
                                        room.status === 'running' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                                        room.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                        'bg-secondary'
                                    }`}>
                                        {room.status}
                                    </span>
                                    <span>{new Date(room.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </Link>
                        </CardContent>
                    </Card>
                ))}

                {!isLoading && rooms?.length === 0 && (
                     <div className="col-span-full text-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
                        <p>No rooms created yet. Start a new conversation!</p>
                     </div>
                )}
            </div>
        </div>
    );
}
