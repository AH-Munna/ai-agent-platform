"use client";

import { Edit, Plus, Trash2, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

export default function CharactersPage() {
  const utils = api.useUtils();
  const { data: characters, isLoading } = api.character.getAll.useQuery();
  
  // State for Create/Edit
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<any>(null); // Quick fix for type

  const createMutation = api.character.create.useMutation({
    onSuccess: () => {
      utils.character.getAll.invalidate();
      setIsCreateOpen(false);
      toast.success("Character created");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = api.character.update.useMutation({
    onSuccess: () => {
      utils.character.getAll.invalidate();
        setEditingCharacter(null);
        toast.success("Character updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = api.character.delete.useMutation({
    onSuccess: () => {
      utils.character.getAll.invalidate();
      toast.success("Character deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get("name") as string,
      bio: formData.get("bio") as string,
      greeting: formData.get("greeting") as string,
      avatar: formData.get("avatar") as string,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!editingCharacter) return;
    
    updateMutation.mutate({
      id: editingCharacter.id,
      name: formData.get("name") as string,
      bio: formData.get("bio") as string,
      greeting: formData.get("greeting") as string,
      avatar: formData.get("avatar") as string,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Characters</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Character
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Character</DialogTitle>
              <DialogDescription>Define your character's persona.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required placeholder="e.g. Alice" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio / Persona</Label>
                <Textarea id="bio" name="bio" required placeholder="Personality, appearance, traits..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="greeting">First Message</Label>
                <Textarea id="greeting" name="greeting" placeholder="How they introduce themselves..." />
              </div>
               <div className="space-y-2">
                <Label htmlFor="avatar">Avatar URL (Optional)</Label>
                <Input id="avatar" name="avatar" placeholder="https://..." />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Character"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p>Loading characters...</p>}
        {characters?.map((char) => (
          <Card key={char.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">
                {char.name}
               </CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               <div className="text-xs text-muted-foreground line-clamp-3">
                 {char.bio}
               </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="icon" onClick={() => setEditingCharacter(char)}>
                    <Edit className="h-4 w-4" />
                </Button>
                
                <Dialog>
                    <DialogTrigger asChild>
                         <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Character?</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete {char.name}?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="destructive" onClick={() => deleteMutation.mutate({ id: char.id })}>
                                {deleteMutation.isPending ? "Deleting..." : "Delete"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardFooter>
          </Card>
        ))}
        {characters?.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground">
                No characters found. Create one to get started.
            </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingCharacter} onOpenChange={(open) => !open && setEditingCharacter(null)}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Character</DialogTitle>
            </DialogHeader>
             <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" name="name" defaultValue={editingCharacter?.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-bio">Bio / Persona</Label>
                <Textarea id="edit-bio" name="bio" defaultValue={editingCharacter?.bio} required />
              </div>
               <div className="space-y-2">
                <Label htmlFor="edit-greeting">First Message</Label>
                <Textarea id="edit-greeting" name="greeting" defaultValue={editingCharacter?.greeting || ""} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="edit-avatar">Avatar URL</Label>
                <Input id="edit-avatar" name="avatar" defaultValue={editingCharacter?.avatar || ""} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending}>
                     {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
