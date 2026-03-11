import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    User, 
    Mail, 
    Lock, 
    ShieldCheck, 
    ArrowLeft, 
    Loader2, 
    LogOut, 
    Camera, 
    Sparkles, 
    ArrowUpCircle,
    CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ProfilePage = () => {
    const { user, submissionUsername, logout } = useAuth();
    const navigate = useNavigate();
    
    // Fetch guest profile if not logged in but has a persistent guest record
    const guestUserInDb = useQuery(api.auth.getGuestUserByName, 
        (!user && submissionUsername) ? { name: submissionUsername } : "skip"
    );

    const activeUser = user || (guestUserInDb ? { _id: guestUserInDb as any, name: submissionUsername, role: "guest" as const, email: "" } : null);

    const [editingProfile, setEditingProfile] = useState(false);
    const [newName, setNewName] = useState(activeUser?.name || "");
    const [newEmail, setNewEmail] = useState(user?.email || "");
    const [isSaving, setIsSaving] = useState(false);

    const [isUpgrading, setIsUpgrading] = useState(false);
    const [upgradeEmail, setUpgradeEmail] = useState("");
    const [upgradePassword, setUpgradePassword] = useState("");

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const updateProfileMutation = useMutation(api.auth.updateProfile);
    const upgradeMutation = useMutation(api.auth.upgradeToAccount);
    const updatePasswordMutation = useMutation(api.auth.updatePassword);

    useEffect(() => {
        if (activeUser) {
            setNewName(activeUser.name || "");
            setNewEmail(activeUser.email || "");
        }
    }, [activeUser]);

    const handleUpdateProfile = async () => {
        if (!activeUser || !activeUser._id) return;
        setIsSaving(true);
        try {
            const result = await updateProfileMutation({
                userId: activeUser._id as any,
                name: newName,
                email: user ? newEmail : undefined
            });
            if (result.success) {
                toast.success("Profile updated");
                setEditingProfile(false);
            } else {
                toast.error(result.error || "Update failed");
            }
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpgrade = async () => {
        if (!activeUser || !activeUser._id) return;
        if (!upgradeEmail || !upgradePassword) {
            toast.error("Please provide email and password");
            return;
        }
        setIsSaving(true);
        try {
            const result = await upgradeMutation({
                userId: activeUser._id as any,
                email: upgradeEmail,
                password: upgradePassword
            });
            if (result.success && result.token) {
                localStorage.setItem("auth_token", result.token);
                toast.success("Welcome! Your account is now fully activated.");
                window.location.reload();
            } else {
                toast.error(result.error || "Upgrade failed");
            }
        } catch (error) {
            toast.error("An error occurred during upgrade");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!user || !user._id) return;
        setIsSaving(true);
        try {
            const result = await updatePasswordMutation({
                userId: user._id as any,
                currentPassword,
                newPassword
            });
            if (result.success) {
                toast.success("Password updated successfully");
                setIsChangingPassword(false);
                setCurrentPassword("");
                setNewPassword("");
            } else {
                toast.error(result.error || "Failed to update password");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    if (!activeUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const isGuest = activeUser.role === "guest";

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <SEO title="Profile - Yosync Studio" description="Manage your studio profile and account settings." />

            {/* Glass Background Elements */}
            <div className="fixed inset-0 overflow-hidden -z-10 bg-grid-white/[0.02]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[160px]" />
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header Actions */}
                <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="group gap-2 rounded-full px-4 border-muted-foreground/10 border hover:bg-muted/50">
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Go Back
                    </Button>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className={cn(
                            "px-3 py-1 font-bold uppercase tracking-wider text-[10px] rounded-full",
                            isGuest ? "bg-muted/50 text-muted-foreground border-none" : "bg-primary/10 text-primary border-primary/20"
                        )}>
                            {activeUser.role} Account
                        </Badge>
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => {
                                logout();
                                navigate('/');
                            }}
                            className="rounded-full h-9 px-4 gap-2 shadow-lg shadow-destructive/20"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-bold uppercase tracking-widest">Sign Out</span>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Avatar and Identity */}
                    <div className="lg:col-span-4 space-y-6 animate-in fade-in slide-in-from-left-4 duration-700">
                        <Card className="border-none bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden group">
                            <CardHeader className="relative h-32 bg-gradient-to-br from-primary via-primary/80 to-primary/40 p-0 overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                                <div className="absolute -bottom-1 -left-1 -right-1 h-32 bg-gradient-to-t from-card/40 to-transparent" />
                                <div className="absolute bottom-4 left-6">
                                     <h2 className="text-xl font-black text-white leading-none tracking-tight">Studio Member</h2>
                                     <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">ID: {activeUser._id.substring(0, 8)}</p>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0 relative px-6 pb-8">
                                <div className="flex flex-col items-start -mt-10 mb-6">
                                    <div className="relative group/avatar">
                                        <div className="w-20 h-20 rounded-3xl bg-card border-4 border-card shadow-2xl flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-300">
                                            <User className="h-10 w-10" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-primary text-primary-foreground shadow-lg opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                                            <Camera className="h-3.5 w-3.5" />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <h3 className="text-2xl font-black tracking-tighter text-foreground">{activeUser.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge className="bg-primary/10 text-primary border-none text-[10px] px-2 py-0 h-4 rounded-md">{submissionUsername}</Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-foreground/5">
                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground uppercase tracking-widest font-bold">
                                        <span>Contribution Level</span>
                                        <span className="text-primary">Tier 1</span>
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-1/4 animate-pulse" />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic text-center">Contribute more synced lyrics to unlock advanced studio features.</p>
                                </div>
                            </CardContent>
                        </Card>

                        {isGuest && (
                            <Card className="border-2 border-primary/20 bg-primary/5 shadow-xl animate-pulse-slow">
                                <CardHeader className="p-4">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                                        <Sparkles className="h-4 w-4" />
                                        Limited Access
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground leading-relaxed">
                                    You are currently using the platform as a guest. Upgrade to a full account to unlock global profile visibility, direct messaging, and advanced studio tools.
                                </CardContent>
                                <CardFooter className="p-4 pt-0">
                                    <Button 
                                        onClick={() => setIsUpgrading(true)} 
                                        className="w-full h-8 text-[10px] font-black uppercase tracking-widest rounded-lg transition-transform hover:scale-[1.02]"
                                    >
                                        Upgrade to Full Studio
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}
                    </div>

                    {/* Right Column: Management Sections */}
                    <div className="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
                        {/* Profile Details */}
                        <Card className="border-none bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between p-6 bg-muted/20">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-bold">Identity & Presence</CardTitle>
                                    <CardDescription className="text-xs">Manage how other studio members see you.</CardDescription>
                                </div>
                                {!editingProfile && (
                                    <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)} className="h-8 rounded-lg text-[11px] font-bold uppercase px-4 border-muted-foreground/20">
                                        Edit Profile
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Display Name</Label>
                                        {editingProfile ? (
                                            <Input 
                                               value={newName} 
                                               onChange={e => setNewName(e.target.value)} 
                                               className="bg-muted/30 border-none rounded-xl h-11 focus-visible:ring-primary/30" 
                                               placeholder="Your Public Name"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 group hover:bg-muted/30 transition-colors">
                                                <User className="h-4 w-4 text-primary/60" />
                                                <span className="font-bold text-sm tracking-tight">{activeUser.name}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Email Identity</Label>
                                        {editingProfile && !isGuest ? (
                                            <Input 
                                               value={newEmail} 
                                               onChange={e => setNewEmail(e.target.value)} 
                                               className="bg-muted/30 border-none rounded-xl h-11 focus-visible:ring-primary/30" 
                                               placeholder="email@example.com"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 group hover:bg-muted/30 transition-colors truncate">
                                                <Mail className="h-4 w-4 text-primary/60" />
                                                <span className="font-bold text-sm tracking-tight truncate">{activeUser.email || (isGuest ? "Not linked (Upgrade Required)" : "Loading...")}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {editingProfile && (
                                    <div className="flex gap-2 pt-2">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => setEditingProfile(false)} 
                                            className="text-[11px] font-bold uppercase tracking-widest"
                                            disabled={isSaving}
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            onClick={handleUpdateProfile} 
                                            className="gap-2 h-9 px-6 rounded-xl shadow-lg shadow-primary/20 text-[11px] font-bold uppercase tracking-widest"
                                            disabled={isSaving}
                                        >
                                            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                            Update Profile
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Guest Upgrade / Password Management */}
                        {isGuest ? (
                            <Card className={cn(
                                "border-none bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-xl shadow-2xl transition-all duration-500",
                                isUpgrading ? "ring-2 ring-primary/40 scale-[1.01]" : ""
                            )}>
                                <CardHeader className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                            <ArrowUpCircle className="h-5 w-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <CardTitle className="text-lg font-bold">Claim Full Studio Access</CardTitle>
                                            <CardDescription className="text-xs">Convert this guest identity into a permanent account.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 pt-0 space-y-4">
                                   {!isUpgrading ? (
                                       <div className="p-6 border-2 border-dashed border-primary/20 rounded-2xl bg-primary/5 flex flex-col items-center text-center gap-4 group cursor-pointer hover:bg-primary/10 transition-colors"
                                            onClick={() => setIsUpgrading(true)}
                                       >
                                            <div className="p-4 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                                <Lock className="h-8 w-8" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-bold text-sm">Secure Your Data</p>
                                                <p className="text-[11px] text-muted-foreground max-w-xs">Link an email and password to this profile so you can sign in from any device.</p>
                                            </div>
                                            <Button variant="link" className="text-xs font-black uppercase text-primary">Start Integration Now</Button>
                                       </div>
                                   ) : (
                                       <div className="space-y-5 animate-in slide-in-from-bottom-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Account Email</Label>
                                                <Input 
                                                    type="email" 
                                                    value={upgradeEmail} 
                                                    onChange={e => setUpgradeEmail(e.target.value)} 
                                                    className="bg-background/50 border-none rounded-xl h-12"
                                                    placeholder="your-email@studio.com"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Master Password</Label>
                                                <Input 
                                                    type="password" 
                                                    value={upgradePassword} 
                                                    onChange={e => setUpgradePassword(e.target.value)} 
                                                    className="bg-background/50 border-none rounded-xl h-12"
                                                    placeholder="Minimum 8 characters"
                                                />
                                            </div>
                                            <div className="flex items-center gap-3 pt-2">
                                                <Button 
                                                    variant="ghost" 
                                                    className="flex-1 text-[11px] font-bold uppercase tracking-widest rounded-xl"
                                                    onClick={() => setIsUpgrading(false)}
                                                    disabled={isSaving}
                                                >
                                                    Not Today
                                                </Button>
                                                <Button 
                                                    className="flex-[2] h-12 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                                                    onClick={handleUpgrade}
                                                    disabled={isSaving}
                                                >
                                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                                                    Complete Studio Setup
                                                </Button>
                                            </div>
                                       </div>
                                   )}
                                </CardContent>
                            </Card>
                        ) : (
                             <Card className="border-none bg-card/40 backdrop-blur-xl shadow-2xl">
                                <CardHeader className="flex flex-row items-center justify-between p-6 bg-muted/20">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-bold">Security Settings</CardTitle>
                                        <CardDescription className="text-xs">Update your studio authentication keys.</CardDescription>
                                    </div>
                                    {!isChangingPassword && (
                                        <Button variant="outline" size="sm" onClick={() => setIsChangingPassword(true)} className="h-8 rounded-lg text-[11px] font-bold uppercase px-4 border-muted-foreground/20">
                                            Change Password
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent className="p-6">
                                    {isChangingPassword ? (
                                        <div className="space-y-6 animate-in slide-in-from-top-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Current Password</Label>
                                                    <Input 
                                                        type="password" 
                                                        value={currentPassword} 
                                                        onChange={e => setCurrentPassword(e.target.value)} 
                                                        className="bg-muted/30 border-none rounded-xl h-11"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">New Password</Label>
                                                    <Input 
                                                        type="password" 
                                                        value={newPassword} 
                                                        onChange={e => setNewPassword(e.target.value)} 
                                                        className="bg-muted/30 border-none rounded-xl h-11"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="ghost" className="text-[11px] font-bold uppercase" onClick={() => setIsChangingPassword(false)}>Cancel</Button>
                                                <Button size="sm" onClick={handleUpdatePassword} disabled={isSaving} className="rounded-xl h-9 px-6 text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
                                                    {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Lock className="h-3 w-3 mr-2" />}
                                                    Confirm Secret Key
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/5 border-2 border-emerald-500/10">
                                            <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500">
                                                <CheckCircle2 className="h-6 w-6" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="font-bold text-sm tracking-tight text-emerald-600 dark:text-emerald-400">Account Secured</p>
                                                <p className="text-[11px] text-muted-foreground">Your account is active and protected with master keys.</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                             </Card>
                        )}

                        {/* Stats / Activity Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-6 rounded-3xl bg-card/40 backdrop-blur-xl shadow-xl flex items-center justify-between group cursor-default hover:bg-card/60 transition-colors border border-foreground/5">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em]">Synched Songs</p>
                                    <p className="text-3xl font-black text-primary">--</p>
                                </div>
                                <div className="p-3 rounded-2xl bg-primary/10 text-primary opacity-40 group-hover:opacity-100 transition-opacity">
                                    <Sparkles className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="p-6 rounded-3xl bg-card/40 backdrop-blur-xl shadow-xl flex items-center justify-between group cursor-default hover:bg-card/60 transition-colors border border-foreground/5">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em]">Approvals</p>
                                    <p className="text-3xl font-black text-foreground">0</p>
                                </div>
                                <div className="p-3 rounded-2xl bg-foreground/5 text-foreground opacity-40 group-hover:opacity-100 transition-opacity">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;

// Type helpers
const Save = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
);
