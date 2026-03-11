import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Music2, Zap, Globe, Shield, ArrowRight, Play, Download, Layout, Sparkles } from "lucide-react";
import { SEO } from "@/components/SEO";

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            <SEO 
                title="Yosync Studio - Modern Lyrics Synchronization" 
                description="The ultimate tool for creating professional, time-synced lyrics. Export to LRC, SRT, VTT and more."
            />

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                            <Music2 className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-xl tracking-tight uppercase">Yosync</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => navigate("/login")} className="hover:bg-primary/10">
                            Sign In
                        </Button>
                        <Button onClick={() => navigate("/dashboard")} className="rounded-full shadow-lg shadow-primary/20">
                            Start Creating
                        </Button>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 overflow-hidden">
                    <div className="absolute top-0 right-0 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[160px] opacity-50" />
                    <div className="absolute bottom-0 left-0 translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[140px] opacity-30" />
                    
                    <div className="max-w-7xl mx-auto px-6 relative">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                                <Sparkles className="h-3 w-3" />
                                Next Generation Lyrics Editor
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                Sync Your <span className="text-primary italic">Soul</span> <br /> 
                                Into Every <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-blue-500">Beat.</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                                Effortlessly create perfectly timed lyrics for your music. Professional tools, multiple export formats, and a community-driven database.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-12 duration-700">
                                <Button size="lg" onClick={() => navigate("/dashboard")} className="h-16 px-10 rounded-2xl text-lg font-bold shadow-2xl shadow-primary/40 group">
                                    Launch Dashboard
                                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                                <Button size="lg" variant="outline" onClick={() => navigate("/about")} className="h-16 px-10 rounded-2xl text-lg font-bold border-white/10 hover:bg-white/5 backdrop-blur-sm">
                                    Explore Features
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-24 bg-muted/30 relative">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold tracking-tight mb-4">Precision Built For Artists</h2>
                            <p className="text-muted-foreground text-lg">Everything you need to time-stamp your lyrics like a pro.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: <Zap className="h-6 w-6" />,
                                    title: "Real-time Sync",
                                    desc: "Tick away in rhythm. Our intuitive editor makes timing a breeze with sub-millisecond precision."
                                },
                                {
                                    icon: <Layout className="h-6 w-6" />,
                                    title: "Modern UI",
                                    desc: "A sleek, distraction-free environment designed for creators. Focus on what matters: the timing."
                                },
                                {
                                    icon: <Download className="h-6 w-6" />,
                                    title: "Universal Export",
                                    desc: "Export to LRC, SRT, VTT, or plain text. High compatibility with all major players and platforms."
                                },
                                {
                                    icon: <Globe className="h-6 w-6" />,
                                    title: "Cloud Database",
                                    desc: "Contribute to our growing library. Every submission is reviewed for quality."
                                },
                                {
                                    icon: <Shield className="h-6 w-6" />,
                                    title: "Version History",
                                    desc: "Never lose your progress. Local backups and undo/redo support keep your work safe."
                                },
                                {
                                    icon: <Play className="h-6 w-6" />,
                                    title: "Instant Preview",
                                    desc: "See how your lyrics look in real-time with our built-in karaoke-style player."
                                }
                            ].map((feature, i) => (
                                <div key={i} className="group p-8 rounded-3xl bg-card border border-white/5 hover:border-primary/20 transition-all hover:shadow-2xl hover:shadow-primary/5">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 transition-transform group-hover:scale-110">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-32 relative overflow-hidden">
                    <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                        <h2 className="text-5xl font-black tracking-tight mb-8">Ready to sync your first song?</h2>
                        <p className="text-xl text-muted-foreground mb-12">Join hundreds of creators building the world's most accurate lyrics database.</p>
                        <Button 
                            size="lg" 
                            onClick={() => navigate("/dashboard")} 
                            className="h-16 px-12 rounded-2xl text-xl font-black bg-white text-black hover:bg-white/90 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                        >
                            Open Studio Now
                        </Button>
                    </div>
                    {/* Decorative blurred blob */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/30 rounded-full blur-[100px]" />
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 py-12 bg-muted/50 text-muted-foreground">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <Music2 className="h-5 w-5 text-primary" />
                        <span className="font-bold text-lg tracking-tight text-foreground uppercase">Yosync</span>
                    </div>
                    <div className="flex gap-8 text-sm font-medium">
                        <a href="#" className="hover:text-primary transition-colors">Twitter</a>
                        <a href="#" className="hover:text-primary transition-colors">Discord</a>
                        <a href="#" className="hover:text-primary transition-colors">GitHub</a>
                        <a href="#" className="hover:text-primary transition-colors">Terms</a>
                    </div>
                    <p className="text-sm">© 2026 Yosync Studio. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
