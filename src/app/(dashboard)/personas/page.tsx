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

export default function PersonasPage() {
  const utils = api.useUtils();
  const { data: personas, isLoading } = api.persona.getAll.useQuery();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<any>(null);

  const createMutation = api.persona.create.useMutation({
    onSuccess: () => {
      utils.persona.getAll.invalidate();
      setIsCreateOpen(false);
      toast.success("Persona created");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = api.persona.update.useMutation({
    onSuccess: () => {
      utils.persona.getAll.invalidate();
      setEditingPersona(null);
      toast.success("Persona updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = api.persona.delete.useMutation({
    onSuccess: () => {
      utils.persona.getAll.invalidate();
      toast.success("Persona deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get("name") as string,
      bio: formData.get("bio") as string,
      avatar: formData.get("avatar") as string,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!editingPersona) return;
    
    updateMutation.mutate({
      id: editingPersona.id,
      name: formData.get("name") as string,
      bio: formData.get("bio") as string,
      avatar: formData.get("avatar") as string,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Your Personas</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Persona
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Persona</DialogTitle>
              <DialogDescription>Define your identity in the chat.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required placeholder="e.g. Master, User, John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio / Description</Label>
                <Textarea id="bio" name="bio" required placeholder="Description of your persona..." />
              </div>
               <div className="space-y-2">
                <Label htmlFor="avatar">Avatar URL (Optional)</Label>
                <Input id="avatar" name="avatar" placeholder="https://..." />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Persona"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p>Loading personas...</p>}
{personas?.map((p) => (
          <Card key={p.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">
                {p.name}
               </CardTitle>
               <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               <div className="text-xs text-muted-foreground line-clamp-3">
                 {p.bio}
               </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="icon" onClick={() => setEditingPersona(p)}>
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
                            <DialogTitle>Delete Persona?</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete {p.name}? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="destructive" onClick={() => deleteMutation.mutate({ id: p.id })}>
                                {deleteMutation.isPending ? "Deleting..." : "Delete"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardFooter>
          </Card>
        ))}
         {personas?.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground">
                No personas found. Create one to represent yourself in chats.
            </div>
        )}
      </div>

      <Dialog open={!!editingPersona} onOpenChange={(open) => !open && setEditingPersona(null)}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Persona</DialogTitle>
            </DialogHeader>
             <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" name="name" defaultValue={editingPersona?.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-bio">Bio</Label>
                <Textarea id="edit-bio" name="bio" defaultValue={editingPersona?.bio} required />
              </div>
               <div className="space-y-2">
                <Label htmlFor="edit-avatar">Avatar URL</Label>
                <Input id="edit-avatar" name="avatar" defaultValue={editingPersona?.avatar || ""} />
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
