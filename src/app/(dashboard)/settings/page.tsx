"use client";

import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

interface Model {
    id: string;
    object?: string;
    created?: number;
    owned_by?: string;
}

export default function SettingsPage() {
    const { data: session } = useSession();
    const utils = api.useUtils();
    
    const { data: globalSettings, isLoading } = api.user.getSettings.useQuery();
    
    const [apiKey, setApiKey] = useState("");
    const [baseUrl, setBaseUrl] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [defaultModel, setDefaultModel] = useState("");
    
    const [models, setModels] = useState<Model[]>([]);
    console.log(models);
    const [loadingModels, setLoadingModels] = useState(false);
    const [modelsError, setModelsError] = useState<string | null>(null);

    useEffect(() => {
        if (globalSettings) {
            setApiKey(globalSettings.apiKey || "");
            setBaseUrl(globalSettings.baseUrl || "");
            setSystemPrompt(globalSettings.systemPrompt || "");
            setDefaultModel(globalSettings.defaultModel || "");
        }
    }, [globalSettings]);

    const fetchModels = async () => {
        const url = baseUrl || "https://integrate.api.nvidia.com/v1";
        const key = apiKey || "";
        
        if (!key) {
            setModelsError("API key required to fetch models");
            return;
        }
        
        setLoadingModels(true);
        setModelsError(null);
        
        try {
            const response = await fetch(`${url}/models`, {
                headers: {
                    "Authorization": `Bearer ${key}`,
                    "Content-Type": "application/json"
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.status}`);
            }
            
            const data = await response.json();
            setModels(data.data || []);
        } catch (e: any) {
            setModelsError(e.message);
            setModels([]);
        } finally {
            setLoadingModels(false);
        }
    };

    useEffect(() => {
        if (apiKey) {
            const timer = setTimeout(() => fetchModels(), 500);
            return () => clearTimeout(timer);
        }
    }, [apiKey, baseUrl]);

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
            systemPrompt,
            defaultModel
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
                            <Label>Default Model</Label>
                            <div className="flex gap-2">
                                <Select value={defaultModel} onValueChange={setDefaultModel}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder={loadingModels ? "Loading models..." : "Select a model"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {models.length > 0 ? (
                                            models.map((model) => (
                                                <SelectItem key={model.id} value={model.id}>
                                                    {model.id}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="__none" disabled>
                                                {modelsError || "No models available"}
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={fetchModels}
                                    disabled={loadingModels}
                                >
                                    {loadingModels ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
                                </Button>
                            </div>
                            {modelsError && (
                                <p className="text-xs text-destructive">{modelsError}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Select a default model for chat. Models are fetched from your configured API.
                            </p>
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
