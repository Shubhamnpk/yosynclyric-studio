import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Music2, Loader2, ArrowRight, UserPlus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";

const RegisterPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAlreadyLoggedIn, setIsAlreadyLoggedIn] = useState(false);
    
    // We use the register mutation directly since it's not in the useAuth hook yet
    const registerMutation = useMutation(api.auth.register);
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            setIsAlreadyLoggedIn(true);
            const timer = setTimeout(() => {
                navigate("/dashboard", { replace: true });
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email || !password) {
            toast.error("Please enter both email and password");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await registerMutation({ email, password, name });
            if (result.success && result.token) {
                toast.success("Account created successfully!");
                localStorage.setItem("auth_token", result.token);
                window.location.href = "/dashboard";
            } else {
                toast.error(result.error || "Registration failed");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isAlreadyLoggedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8 text-center">
                <SEO title="Redirecting... - Yosync Studio" description="You are already logged in to Yosync Studio." />
                <div className="absolute inset-0 overflow-hidden -z-10 bg-grid-white/[0.02] bg-[size:50px_50px]">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
                </div>
                
                <Card className="w-full max-w-md border-none shadow-none bg-transparent space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="mx-auto w-24 h-24 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 relative">
                        <div className="absolute inset-0 bg-emerald-500/20 rounded-[2rem] animate-ping opacity-20" />
                        <ShieldCheck className="h-12 w-12 relative" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-4xl font-black tracking-tight text-foreground">Account Active</h2>
                        <p className="text-muted-foreground text-lg">
                            Hi <span className="text-foreground font-bold">{user?.name || 'there'}</span>, you're already logged in.
                        </p>
                    </div>
                    <div className="flex flex-col items-center gap-5">
                       <div className="h-1.5 w-48 bg-muted rounded-full overflow-hidden relative">
                          <div className="absolute h-full bg-emerald-500 animate-[shimmer_2s_infinite] w-full origin-left" />
                       </div>
                       <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-2 text-emerald-500 font-black text-xs uppercase tracking-[0.2em] animate-pulse">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Jumping to Dashboard
                          </div>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Redirecting in 2 seconds</p>
                       </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
            <SEO 
                title="Register - Yosync Studio" 
                description="Create your account to start syncing lyrics."
            />
            
            <div className="absolute inset-0 overflow-hidden -z-10 bg-grid-white/[0.02] bg-[size:50px_50px]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
            </div>

            <Card className="w-full max-w-md border-muted-foreground/10 shadow-2xl overflow-hidden backdrop-blur-sm bg-card/80">
                <CardHeader className="space-y-3 pb-8 text-center pt-10">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-2">
                        <UserPlus className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight">Create Account</CardTitle>
                    <CardDescription className="text-lg">
                        Join the Yosync community today
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name">Display Name (Optional)</Label>
                            <Input
                                id="name"
                                placeholder="Your artist/sync name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-12 bg-muted/50 border-none rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-12 bg-muted/50 border-none rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-12 bg-muted/50 border-none rounded-xl"
                            />
                        </div>
                        <Button 
                            type="submit" 
                            className="w-full h-12 rounded-xl font-semibold shadow-lg shadow-primary/20" 
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Sign Up
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center pb-10 pt-4 border-t border-muted-foreground/5 bg-muted/20">
                    <p className="text-sm text-muted-foreground">
                        Already have an account? <Link to="/login" className="text-foreground font-bold hover:underline">Sign In</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default RegisterPage;
