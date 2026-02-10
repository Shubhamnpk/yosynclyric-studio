import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import {
    Info,
    Zap,
    History,
    Sparkles,
    Github,
    Globe,
    ShieldCheck,
    Cpu,
    CheckCircle2,
    Bug,
    Wrench,
    Rocket
} from "lucide-react";
import changelogData from "@/config/changelog.json";
import pkg from "../../../package.json";
import { cn } from "@/lib/utils";

interface AboutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const AboutDialog = ({ open, onOpenChange }: AboutDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[640px] max-h-[85vh] p-0 overflow-hidden border-none bg-background/80 backdrop-blur-xl shadow-2xl">
                {/* Visual Header */}
                <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent flex items-center px-8 border-b border-white/10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(124,58,237,0.1),transparent_50%)]" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
                            <Rocket className="h-9 w-9 text-primary-foreground" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold tracking-tight">Yosync Studio</DialogTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-mono text-xs">
                                    v{pkg.version}
                                </Badge>
                                <Badge variant="outline" className="border-white/10 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                                    Build {changelogData.build}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1 p-6 max-h-[calc(85vh-128px)]">
                    <div className="space-y-8">
                        {/* Summary Section */}
                        <section>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                About Platform
                            </h3>
                            <p className="text-base text-foreground/80 leading-relaxed">
                                Yosync Studio is a professional-grade lyrics synchronization and audio processing suite.
                                Designed for creators, it bridges the gap between raw audio and synchronized visual content for social media and music platforms.
                            </p>
                        </section>

                        {/* Features Grid */}
                        <section>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                Core Capabilities
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {changelogData.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-white/5 shadow-sm group hover:bg-muted/50 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                                            <Zap className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm font-medium">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Recent Updates (Timeline) */}
                        <section className="pb-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
                                <History className="h-4 w-4" />
                                Release Timeline
                            </h3>
                            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[15px] before:w-0.5 before:bg-gradient-to-b before:from-primary/20 before:via-muted before:to-transparent">
                                {changelogData.releases.map((release, rIdx) => (
                                    <div key={rIdx} className="relative pl-10">
                                        {/* Timeline Dot */}
                                        <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center z-10 shadow-sm">
                                            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <h4 className="text-lg font-bold leading-none">{release.title}</h4>
                                                <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                    {release.date} • v{release.version}
                                                </span>
                                            </div>

                                            <Card className="p-4 bg-muted/20 border-white/5 space-y-2.5">
                                                {release.changes.map((change, cIdx) => (
                                                    <div key={cIdx} className="flex gap-3">
                                                        <div className="mt-1">
                                                            {change.type === 'feature' && <Rocket className="h-3.5 w-3.5 text-green-500" />}
                                                            {change.type === 'bugfix' && <Bug className="h-3.5 w-3.5 text-red-500" />}
                                                            {change.type === 'improvement' && <Sparkles className="h-3.5 w-3.5 text-blue-500" />}
                                                            {change.type === 'security' && <ShieldCheck className="h-3.5 w-3.5 text-orange-500" />}
                                                        </div>
                                                        <span className="text-sm text-muted-foreground leading-snug">
                                                            {change.text}
                                                        </span>
                                                    </div>
                                                ))}
                                            </Card>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* System Status / Footer info */}
                        <section className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4 pb-4">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Cpu className="h-3.5 w-3.5" />
                                <span>Engine: React 18 / Vite 7</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end">
                                <Globe className="h-3.5 w-3.5" />
                                <span>Global Build • Stable Release</span>
                            </div>
                        </section>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
