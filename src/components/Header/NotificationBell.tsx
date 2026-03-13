import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from "@/components/ui/button";
import { Bell, Check, Info, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export const NotificationBell = () => {
    const { user, submissionUsername } = useAuth();
    
    // For non-logged in users, we check if a guest user record exists for them in the DB
    const guestUserId = useQuery(api.auth.getGuestUserByName, 
        (!user && submissionUsername) ? { name: submissionUsername } : "skip"
    );
    
    const activeUserId = user?._id || (submissionUsername ? (guestUserId as any) : undefined);
    
    // Fetch notifications only if we have a valid user ID (logged in or persistent guest)
    const notifications = useQuery(api.lyrics.getUserNotifications, 
        activeUserId ? { userId: activeUserId } : "skip"
    );
    
    const markRead = useMutation(api.lyrics.markRead);
    const markAllRead = useMutation(api.lyrics.markAllRead);

    const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

    const handleMarkAllRead = async () => {
        if (activeUserId) {
            await markAllRead({ userId: activeUserId as any });
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-[10px] font-bold text-primary-foreground items-center justify-center">
                                {unreadCount}
                            </span>
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 border-none shadow-2xl bg-card/95 backdrop-blur-xl">
                <DropdownMenuLabel className="p-4 flex items-center justify-between border-b bg-muted/30">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-tight">Notifications</span>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-tight">
                            {user ? user.name : `Guest: ${submissionUsername}`}
                        </span>
                    </div>
                    {unreadCount > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-[10px] uppercase font-bold text-primary hover:bg-primary/10"
                            onClick={handleMarkAllRead}
                        >
                            Mark all read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <ScrollArea className="h-[350px]">
                    {!notifications || notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                <Bell className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No notifications yet</span>
                            <p className="text-[10px] text-muted-foreground/60 mt-1 italic">
                                {activeUserId ? "Updates about your submissions will appear here." : "Submit lyrics to receive status updates!"}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((n) => (
                                <DropdownMenuItem 
                                    key={n._id} 
                                    className={cn(
                                        "p-4 flex flex-col items-start gap-2 border-b border-muted/20 last:border-0 cursor-default focus:bg-primary/5",
                                        !n.isRead && "bg-primary/5"
                                    )}
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        if (!n.isRead) markRead({ id: n._id });
                                    }}
                                >
                                    <div className="flex items-start gap-3 w-full">
                                        <div className={cn(
                                            "mt-0.5 p-1.5 rounded-lg shrink-0",
                                            n.type === "approval" ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
                                        )}>
                                            {n.type === "approval" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                        </div>
                                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[11px] font-bold leading-none truncate">{n.title}</span>
                                                <div className="flex items-center gap-1 shrink-0 text-[10px] text-muted-foreground font-medium">
                                                    <Clock className="h-2.5 w-2.5" />
                                                    {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                                                {n.message}
                                            </p>
                                        </div>
                                    </div>
                                    {!n.isRead && (
                                        <div className="self-end mt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        </div>
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t bg-muted/10">
                    <p className="text-[10px] text-center text-muted-foreground/60 font-medium">
                        {activeUserId ? "Stay tuned for more updates" : "Publish to see notifications"}
                    </p>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
