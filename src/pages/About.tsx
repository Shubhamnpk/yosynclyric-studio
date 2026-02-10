import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Info,
    Zap,
    History,
    Sparkles,
    ShieldCheck,
    Cpu,
    Rocket,
    ArrowLeft,
    Terminal,
    Calendar,
    Award,
    CheckCircle2,
    Github,
    Globe,
    Users,
    Code,
    Database,
    Music,
    Video,
    FileText,
    Palette
} from "lucide-react";
import changelogData from "@/config/changelog.json";
import pkg from "../../package.json";

const AboutPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
            {/* Header / Navigation */}
            <div className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <div className="flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-primary" />
                        <span className="font-bold text-lg tracking-tight">Yosync Studio</span>
                    </div>
                    <div className="w-20" /> {/* Spacer */}
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 py-12 space-y-20">
                {/* Hero Section */}
                <section className="text-center space-y-6">
                    <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-primary/10 mb-4 animate-bounce-slow">
                        <Rocket className="h-12 w-12 text-primary shadow-2xl shadow-primary/50" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">
                        All about <span className="text-primary">Yosync</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
                        The ultimate workbench for professional lyrics synchronization and audio artistry.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <Badge variant="secondary" className="px-4 py-1 text-sm font-mono bg-primary/10 text-primary border-none">
                            Version {pkg.version}
                        </Badge>
                        <Badge variant="outline" className="px-4 py-1 text-sm border-primary/20 text-primary uppercase tracking-widest font-bold">
                            Build {changelogData.build}
                        </Badge>
                    </div>
                </section>

                {/* Statistics / Highlights */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: Rocket, label: "Status", value: "Stable" },
                        { icon: Calendar, label: "Released", value: "Feb 2026" },
                        { icon: Terminal, label: "License", value: "MIT" },
                        { icon: Award, label: "Quality", value: "High-Fi" }
                    ].map((stat, i) => (
                        <Card key={i} className="bg-muted/30 border-none shadow-none text-center p-6 rounded-2xl">
                            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center mx-auto mb-3 shadow-sm">
                                <stat.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{stat.label}</div>
                            <div className="text-lg font-black">{stat.value}</div>
                        </Card>
                    ))}
                </div>

                {/* Core Features */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-8 w-1 bg-primary rounded-full" />
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Sparkles className="h-6 w-6 text-primary" />
                            The Feature Rap
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {changelogData.features.map((feature, idx) => (
                            <Card key={idx} className="group overflow-hidden border-none bg-muted/40 hover:bg-muted/60 transition-all duration-300">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    <span className="text-lg font-semibold tracking-tight leading-tight">{feature}</span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Technology Stack */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-8 w-1 bg-primary rounded-full" />
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Cpu className="h-6 w-6 text-primary" />
                            Built with Modern Tech
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { icon: Code, label: "React 18", desc: "Modern UI Framework" },
                            { icon: Database, label: "TypeScript", desc: "Type Safety" },
                            { icon: Palette, label: "Tailwind CSS", desc: "Styling" },
                            { icon: Music, label: "Web Audio API", desc: "Audio Processing" },
                            { icon: Video, label: "HTML5 Canvas", desc: "Video Rendering" },
                            { icon: FileText, label: "FFmpeg.js", desc: "Video Encoding" },
                            { icon: Users, label: "shadcn/ui", desc: "Component Library" },
                            { icon: Globe, label: "Vite", desc: "Build Tool" }
                        ].map((tech, idx) => (
                            <Card key={idx} className="group overflow-hidden border-none bg-muted/40 hover:bg-muted/60 transition-all duration-300">
                                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                                        <tech.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="text-lg font-semibold tracking-tight">{tech.label}</div>
                                        <div className="text-xs text-muted-foreground">{tech.desc}</div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Timeline / Changelog */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <div className="h-8 w-1 bg-primary rounded-full" />
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <History className="h-6 w-6 text-primary" />
                            The Newly Thing (Update Log)
                        </h2>
                    </div>

                    <div className="space-y-12 relative before:absolute before:inset-0 before:ml-[23px] before:w-1 before:bg-muted/50">
                        {changelogData.releases.map((release, rIdx) => (
                            <div key={rIdx} className="relative pl-16">
                                {/* Dot */}
                                <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-background border-4 border-primary shadow-xl flex items-center justify-center z-10 transition-transform hover:scale-110">
                                    <Zap className="h-5 w-5 text-primary fill-primary/20" />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-muted pb-4">
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-black tracking-tight">{release.title}</h3>
                                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-[0.2em]">Version {release.version}</p>
                                        </div>
                                        <Badge variant="outline" className="w-fit border-none bg-muted font-bold px-3 py-1 text-muted-foreground">
                                            {release.date}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {release.changes.map((change, cIdx) => (
                                            <div key={cIdx} className="flex gap-4 p-4 rounded-2xl bg-muted/20 border border-border/50">
                                                <div className="mt-1">
                                                    {change.type === 'feature' && <Rocket className="h-5 w-5 text-green-500" />}
                                                    {change.type === 'improvement' && <Sparkles className="h-5 w-5 text-blue-500" />}
                                                    {change.type === 'security' && <ShieldCheck className="h-5 w-5 text-orange-500" />}
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{change.type}</span>
                                                    <p className="text-base text-foreground/90 font-medium leading-snug">
                                                        {change.text}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Open Source & Community */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-8 w-1 bg-primary rounded-full" />
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Github className="h-6 w-6 text-primary" />
                            Open Source & Community
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-none bg-gradient-to-br from-primary/10 to-primary/5">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Github className="h-8 w-8 text-primary" />
                                    <h3 className="text-xl font-bold">Contribute</h3>
                                </div>
                                <p className="text-muted-foreground">
                                    Yosync Studio is open source and welcomes contributions from developers, designers, and users worldwide.
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="outline" asChild>
                                        <a href="https://github.com/Shubhamnpk/synclyric-studio" target="_blank" rel="noopener noreferrer">
                                            <Github className="mr-2 h-4 w-4" />
                                            View on GitHub
                                        </a>
                                    </Button>
                                    <Button asChild>
                                        <a href="/contributing">
                                            Read Contributing Guide
                                        </a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none bg-gradient-to-br from-green-500/10 to-green-500/5">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="h-8 w-8 text-green-500" />
                                    <h3 className="text-xl font-bold">License</h3>
                                </div>
                                <p className="text-muted-foreground">
                                    Licensed under MIT License with special provisions for commercial use. Personal use and modification are always allowed.
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="outline" asChild>
                                        <a href="/license">
                                            View License
                                        </a>
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <a href="mailto:shubhamnpk@gmail.com">
                                            Request Commercial License
                                        </a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <footer className="pt-20 text-center space-y-12 pb-12">
                    <div className="space-y-4">
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.4em]">
                            Developed with passion by
                        </p>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                            <a
                                href="https://yoguru.odoo.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-2 text-2xl font-black tracking-tighter text-foreground/90 hover:text-primary transition-all underline decoration-primary/20 underline-offset-8"
                            >
                                Yoguru
                            </a>
                            <div className="hidden md:block w-px h-6 bg-border" />
                            <a
                                href="https://bitnepalorg.odoo.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-2 text-2xl font-black tracking-tighter text-foreground/90 hover:text-primary transition-all underline decoration-primary/20 underline-offset-8"
                            >
                                BitNepal Team
                            </a>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-10 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                        <Cpu className="h-7 w-7 text-muted-foreground" />
                        <ShieldCheck className="h-7 w-7 text-muted-foreground" />
                        <Rocket className="h-7 w-7 text-muted-foreground" />
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default AboutPage;
