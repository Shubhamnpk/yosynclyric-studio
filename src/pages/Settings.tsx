import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, RotateCcw, ShieldCheck, Cpu, Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSettings, saveSettings } from '@/utils/settingsStorage';
import { AppSettings, DEFAULT_SETTINGS } from '@/types/settings';
import { toast } from 'sonner';

export default function SettingsPage() {
    const navigate = useNavigate();
    const [settings, setSettings] = useState<AppSettings>(getSettings());
    const [isDirty, setIsDirty] = useState(false);

    const handleSave = () => {
        saveSettings(settings);
        setIsDirty(false);
        toast.success('Settings saved successfully');
    };

    const handleReset = () => {
        setSettings(DEFAULT_SETTINGS);
        setIsDirty(true);
    };

    const updateSettings = (updates: Partial<AppSettings>) => {
        setSettings(prev => ({ ...prev, ...updates }));
        setIsDirty(true);
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {isDirty && (
                            <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
                                <RotateCcw className="h-4 w-4" />
                                Reset
                            </Button>
                        )}
                        <Button size="sm" onClick={handleSave} disabled={!isDirty} className="gap-2">
                            <Save className="h-4 w-4" />
                            Save Changes
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6">
                    {/* Appearance */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Monitor className="h-5 w-5 text-primary" />
                                Appearance
                            </CardTitle>
                            <CardDescription>Customize how the application looks for you.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Theme</Label>
                                    <p className="text-sm text-muted-foreground">Select your preferred color theme.</p>
                                </div>
                                <Select
                                    value={settings.theme}
                                    onValueChange={(v: any) => updateSettings({ theme: v })}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="light">
                                            <div className="flex items-center gap-2">
                                                <Sun className="h-4 w-4" /> Light
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="dark">
                                            <div className="flex items-center gap-2">
                                                <Moon className="h-4 w-4" /> Dark
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="system">
                                            <div className="flex items-center gap-2">
                                                <Monitor className="h-4 w-4" /> System
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sync Behavior */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Cpu className="h-5 w-5 text-primary" />
                                Sync Editor
                            </CardTitle>
                            <CardDescription>Default behavior for the lyric synchronization process.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Default Sync Mode</Label>
                                    <p className="text-sm text-muted-foreground">Start new projects in this mode.</p>
                                </div>
                                <Select
                                    value={settings.defaultSyncMode}
                                    onValueChange={(v: any) => updateSettings({ defaultSyncMode: v })}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="line">Line-by-Line</SelectItem>
                                        <SelectItem value="word">Word-by-Word</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Auto-split Words</Label>
                                    <p className="text-sm text-muted-foreground">Automatically divide lines into words when entering Word Mode.</p>
                                </div>
                                <Switch
                                    checked={settings.autoSplitWords}
                                    onCheckedChange={(v) => updateSettings({ autoSplitWords: v })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Export Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Save className="h-5 w-5 text-primary" />
                                Exporting
                            </CardTitle>
                            <CardDescription>Configure your default export preferences.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Default Export Format</Label>
                                    <p className="text-sm text-muted-foreground">Preferred file format for downloads.</p>
                                </div>
                                <Select
                                    value={settings.exportFormat}
                                    onValueChange={(v: any) => updateSettings({ exportFormat: v })}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="lrc">LRC (Synchronized Lyrics)</SelectItem>
                                        <SelectItem value="srt">SRT (Subtitles)</SelectItem>
                                        <SelectItem value="vtt">VTT (Web Video)</SelectItem>
                                        <SelectItem value="txt">TXT (Plain Text)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Auto-save Interval</Label>
                                    <p className="text-sm text-muted-foreground">How often to save changes to storage (seconds).</p>
                                </div>
                                <Select
                                    value={settings.autoSaveInterval.toString()}
                                    onValueChange={(v) => updateSettings({ autoSaveInterval: parseInt(v) })}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">Every 5s</SelectItem>
                                        <SelectItem value="15">Every 15s</SelectItem>
                                        <SelectItem value="30">Every 30s</SelectItem>
                                        <SelectItem value="60">Every 1m</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Privacy & Backup */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                Advanced
                            </CardTitle>
                            <CardDescription>System and data management.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Data Storage</Label>
                                    <p className="text-sm text-muted-foreground">All your projects are stored locally in the browser.</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => {
                                    const size = (JSON.stringify(localStorage).length / 1024 / 1024).toFixed(2);
                                    toast.info(`Local storage usage: ${size} MB`);
                                }}>
                                    Check Usage
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="text-center text-xs text-muted-foreground py-4">
                    SyncLyric Studio v1.2.0 • Made with ❤️ by Shubham
                </div>
            </div>
        </div>
    );
}
