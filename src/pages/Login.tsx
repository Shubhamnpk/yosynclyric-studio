import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Music2, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlreadyLoggedIn, setIsAlreadyLoggedIn] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from location state, or default to dashboard
  const from = (location.state as any)?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (isAuthenticated) {
      setIsAlreadyLoggedIn(true);
      const timer = setTimeout(() => {
        navigate(from, { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await login(email, password);
      if (success) {
        toast.success("Successfully logged in");
        navigate(from, { replace: true });
      } else {
        toast.error("Invalid credentials or login failed");
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
        <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
          <SEO title="Redirecting... - Yosync Studio" description="You are already logged in to Yosync Studio." />
          <div className="absolute inset-0 overflow-hidden -z-10 bg-grid-white/[0.02] bg-[size:50px_50px]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
          </div>
          
          <Card className="w-full max-w-md border-none shadow-none bg-transparent text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="mx-auto w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary relative">
              <div className="absolute inset-0 bg-primary/20 rounded-[2rem] animate-ping opacity-20" />
              <ShieldCheck className="h-12 w-12 relative" />
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-black tracking-tight leading-none text-foreground">Session Active</h2>
              <p className="text-muted-foreground text-lg">
                Welcome back, <span className="text-foreground font-bold">{user?.name || user?.email?.split('@')[0] || 'Member'}</span>.
              </p>
            </div>
            <div className="flex flex-col items-center gap-5">
               <div className="h-1.5 w-48 bg-muted rounded-full overflow-hidden relative">
                  <div className="absolute h-full bg-primary animate-[shimmer_2s_infinite] w-full origin-left" 
                    style={{ animationDuration: '2s', animationTimingFunction: 'ease-in-out' }} 
                  />
               </div>
               <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-[0.2em] animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Returning to Studio
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
        title="Login - Yosync Studio" 
        description="Login to your account to manage your lyrics projects."
      />
      
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden -z-10 bg-grid-white/[0.02] bg-[size:50px_50px]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
      </div>

      <Card className="w-full max-w-md border-muted-foreground/10 shadow-2xl overflow-hidden backdrop-blur-sm bg-card/80">
        <CardHeader className="space-y-3 pb-8 text-center pt-10">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-2">
            <Music2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Welcome back</CardTitle>
          <CardDescription className="text-lg">
            Sign in to your Yosync Studio account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all rounded-xl"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px] active:translate-y-[0px]" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted-foreground/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-12 rounded-xl border-muted-foreground/20 hover:bg-muted/50 text-sm font-bold uppercase tracking-wider"
            onClick={() => navigate("/dashboard")}
          >
            Continue as Anonymous
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pb-10 pt-4 px-8 border-t border-muted-foreground/5 bg-muted/20">
          <p className="text-sm text-center text-muted-foreground">
            Don't have an account? <Link to="/register" className="text-foreground font-bold hover:underline">Create one here</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
