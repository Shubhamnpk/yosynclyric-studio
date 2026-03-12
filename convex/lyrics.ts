import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
// Last update trigger: 2026-03-12T03:30:00Z

// ============ NOTIFICATIONS ============

export const getUserNotifications = query({
    args: { userId: v.optional(v.id("users")) },
    handler: async (ctx, args) => {
        if (!args.userId) return [];
        return await ctx.db
            .query("notifications")
            .withIndex("by_user_id", (q) => q.eq("userId", args.userId!))
            .order("desc")
            .collect();
    },
});

export const markRead = mutation({
    args: { id: v.id("notifications") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { isRead: true });
    },
});

export const markAllRead = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("isRead"), false))
            .collect();

        for (const notification of unread) {
            await ctx.db.patch(notification._id, { isRead: true });
        }
    },
});

// Publish or suggest improvement
export const publish = mutation({
    args: {
        trackName: v.string(),
        artistName: v.string(),
        albumName: v.optional(v.string()),
        duration: v.number(),
        plainLyrics: v.string(),
        syncedLyrics: v.string(),
        submittedBy: v.string(),
        submittedById: v.optional(v.id("users")),
        parentLyricId: v.optional(v.id("lyrics")), // For improvements
    },
    handler: async (ctx, args) => {
        if (!args.syncedLyrics || args.syncedLyrics.trim().length === 0) {
            throw new Error("Only synced lyrics are allowed to be published");
        }

        // 1. Check if an approved version exists
        const approvedVersion = await ctx.db
            .query("lyrics")
            .withIndex("by_track_artist", (q) =>
                q.eq("trackName", args.trackName).eq("artistName", args.artistName)
            )
            .filter((q) => q.eq(q.field("isApproved"), true))
            .unique();

        // 2. Prevent duplicate creation of base tracks
        if (approvedVersion && !args.parentLyricId) {
            return { 
                success: false, 
                duplicate: true, 
                originalId: approvedVersion._id,
                message: "This song already exists. You can suggest an improvement to it instead." 
            };
        }

        const id = await ctx.db.insert("lyrics", {
            ...args,
            searchHistory: 0,
            status: args.parentLyricId ? "improvement_pending" : "pending",
            isApproved: false,
            createdAt: Date.now(),
        });

        return { success: true, id };
    },
});

// Search - Public (only approved)
export const search = query({
    args: {
        trackName: v.string(),
        artistName: v.string(),
        duration: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let results = await ctx.db
            .query("lyrics")
            .withIndex("by_track_artist", (q) =>
                q.eq("trackName", args.trackName).eq("artistName", args.artistName)
            )
            .filter((q) => q.eq(q.field("isApproved"), true))
            .collect();

        if (args.duration && results.length > 0) {
            return results.sort((a, b) =>
                Math.abs(a.duration - (args.duration || 0)) - Math.abs(b.duration - (args.duration || 0))
            )[0];
        }

        return results[0] || null;
    },
});

// Search by text - Public
export const searchByText = query({
    args: { query: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("lyrics")
            .withSearchIndex("search_lyrics", (q) =>
                q.search("trackName", args.query).eq("isApproved", true)
            )
            .collect();
    },
});

// Increment search count
export const incrementSearchCount = mutation({
    args: { id: v.id("lyrics") },
    handler: async (ctx, args) => {
        const lyric = await ctx.db.get(args.id);
        if (lyric) {
            await ctx.db.patch(args.id, {
                searchHistory: (lyric.searchHistory || 0) + 1,
            });
        }
    },
});

export const getById = query({
    args: { id: v.id("lyrics") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// ============ ADMIN FUNCTIONS (require token) ============

const validateToken = async (ctx: any, token?: string): Promise<{ valid: boolean; userId?: string; error?: string }> => {
    if (!token) return { valid: false, error: "No token provided" };

    const session = await ctx.db
        .query("sessions")
        .withIndex("by_token", (q: any) => q.eq("token", token))
        .unique();

    if (!session) return { valid: false, error: "Invalid session" };

    if (Date.now() > session.expiresAt) {
        await ctx.db.delete(session._id);
        return { valid: false, error: "Session expired" };
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.role !== "admin") {
        return { valid: false, error: "Admin access required" };
    }

    return { valid: true, userId: user._id };
};

// Admin: List all lyrics
export const listAll = query({
    args: { token: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const validation = await validateToken(ctx, args.token);
        if (!validation.valid) {
            throw new Error(validation.error || "Unauthorized");
        }
        const lyrics = await ctx.db.query("lyrics").order("desc").collect();
        return lyrics.map(l => ({
            ...l,
            submittedBy: l.submittedBy || "Legacy Contributor"
        }));
    },
});

// Admin: Migrate old data
export const migrateLegacyLyrics = mutation({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const validation = await validateToken(ctx, args.token);
        if (!validation.valid) throw new Error("Unauthorized");

        const all = await ctx.db.query("lyrics").collect();
        let updated = 0;
        for (const lyric of all) {
            if (!lyric.submittedBy) {
                await ctx.db.patch(lyric._id, {
                    submittedBy: "Legacy Contributor",
                    updatedAt: Date.now()
                });
                updated++;
            }
        }
        return { updated };
    }
});

// Admin: Get stats
export const getStats = query({
    args: { token: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const validation = await validateToken(ctx, args.token);
        if (!validation.valid) {
            throw new Error(validation.error || "Unauthorized");
        }
        const all = await ctx.db.query("lyrics").collect();
        return {
            total: all.length,
            approved: all.filter(l => l.status === "approved").length,
            pending: all.filter(l => l.status === "pending").length,
            improvements: all.filter(l => l.status === "improvement_pending").length,
            rejected: all.filter(l => l.status === "rejected").length,
            totalSearches: all.reduce((acc, current) => acc + (current.searchHistory || 0), 0)
        };
    },
});

// Admin: Update status
export const updateStatus = mutation({
    args: {
        id: v.id("lyrics"),
        status: v.string(),
        rejectionReason: v.optional(v.string()),
        token: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const validation = await validateToken(ctx, args.token);
        if (!validation.valid) {
            throw new Error(validation.error || "Unauthorized");
        }

        const lyric = await ctx.db.get(args.id);
        if (!lyric) throw new Error("Lyric not found");

        const isApproved = args.status === "approved";
        
        // Handle Improvement Merging
        if (isApproved && lyric.status === "improvement_pending" && lyric.parentLyricId) {
            // Apply changes to the parent record
            await ctx.db.patch(lyric.parentLyricId, {
                plainLyrics: lyric.plainLyrics,
                syncedLyrics: lyric.syncedLyrics,
                albumName: lyric.albumName || undefined,
                updatedAt: Date.now()
            });
            // Mark the improvement record itself as approved/archived
            await ctx.db.patch(args.id, { 
                status: "approved", 
                isApproved: true,
                updatedAt: Date.now()
            });
        } else {
            // Regular approval/rejection
            await ctx.db.patch(args.id, {
                status: args.status,
                isApproved,
                rejectionReason: args.rejectionReason,
                updatedAt: Date.now()
            });
        }

        // Create notification for submmiter
        if (lyric.submittedById) {
            const type = isApproved ? "approval" : "rejection";
            const isImprovement = lyric.status === "improvement_pending";
            const title = isApproved 
                ? (isImprovement ? "Improvement Approved!" : "Lyrics Approved!") 
                : "Submission Update Needed";
            
            const message = isApproved
                ? `Your ${isImprovement ? "improvement" : "synced lyrics"} for "${lyric.trackName}" been approved and are now live!`
                : `Your submission for "${lyric.trackName}" was not approved. Reason: ${args.rejectionReason || "Please review and resubmit."}`;

            await ctx.db.insert("notifications", {
                userId: lyric.submittedById,
                type,
                title,
                message,
                lyricId: args.id,
                isRead: false,
                createdAt: Date.now(),
            });
        }
    },
});

// Admin: Update lyrics
export const updateLyrics = mutation({
    args: {
        id: v.id("lyrics"),
        trackName: v.string(),
        artistName: v.string(),
        albumName: v.optional(v.string()),
        plainLyrics: v.string(),
        syncedLyrics: v.string(),
        token: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const validation = await validateToken(ctx, args.token);
        if (!validation.valid) {
            throw new Error(validation.error || "Unauthorized");
        }
        const { id, token, ...data } = args;
        await ctx.db.patch(id, data);
    },
});

// Admin: Delete lyric
export const deleteLyric = mutation({
    args: { id: v.id("lyrics"), token: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const validation = await validateToken(ctx, args.token);
        if (!validation.valid) {
            throw new Error(validation.error || "Unauthorized");
        }
        await ctx.db.delete(args.id);
    },
});

// Cleanup old notifications (older than 30 days)
export const cleanupNotifications = mutation({
    args: {},
    handler: async (ctx) => {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const oldNotifications = await ctx.db
            .query("notifications")
            .withIndex("by_created_at", (q) => q.lt("createdAt", thirtyDaysAgo))
            .collect();
        
        for (const notification of oldNotifications) {
            await ctx.db.delete(notification._id);
        }
        return oldNotifications.length;
    },
});
