"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

export default function SettingsPage() {
    const { data: session } = useSession();
    const utils = api.useUtils();
    
    const { data: globalSettings, isLoading } = api.user.getSettings.useQuery();
    
    const [apiKey, setApiKey] = useState("");
    const [baseUrl, setBaseUrl] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");

    useEffect(() => {
        if (globalSettings) {
            setApiKey(globalSettings.apiKey || "");
            setBaseUrl(globalSettings.baseUrl || "");
            setSystemPrompt(globalSettings.systemPrompt || "");
        }
    }, [globalSettings]);

    const updateSettingsMutation = api.user.updateSettings.useMutation({
        onSuccess: () => {
            utils.user.getSettings.invalidate();
            toast.success("Settings saved successfully.");
        },
        onError: (e) => toast.error(e.message),
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateSettingsMutation.mutate({
            apiKey,
            baseUrl,
            systemPrompt
        });
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            
            <Card>
                <CardHeader>
                    <CardTitle>User Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                         <Label>Username</Label>
                         <Input disabled value={session?.user?.name || session?.user?.email || ""} />
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Global API Configuration</CardTitle>
                    <CardDescription>Configure your LLM provider details.</CardDescription>
                </CardHeader>
                <CardContent>
                     <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Base URL (Optional)</Label>
                            <Input 
                                placeholder="https://api.openai.com/v1" 
                                value={baseUrl}
                                onChange={e => setBaseUrl(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Defaults to NVIDIA NIM if empty.</p>
                        </div>
                        <div className="space-y-2">
                            <Label>API Key</Label>
                            <Input 
                                type="password" 
                                placeholder="sk-..." 
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Leave empty to use system environment variable.</p>
                        </div>
                         <div className="space-y-2">
                            <Label>Global System Prompt</Label>
                            <Textarea 
                                className="min-h-[100px]"
                                placeholder="Instructions applied to all chats..."
                                value={systemPrompt}
                                onChange={e => setSystemPrompt(e.target.value)}
                            />
                        </div>
                        <Button type="submit" disabled={updateSettingsMutation.isPending}>
                            {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                     </form>
                </CardContent>
            </Card>
        </div>
    )
}
