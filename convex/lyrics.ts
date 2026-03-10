import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Server-side admin password (set in convex environment variables)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Helper function to validate admin secret
const validateAdmin = (adminSecret: string): boolean => {
    return adminSecret === ADMIN_PASSWORD;
};

export const verifyAdmin = mutation({
    args: { password: v.string() },
    handler: async (ctx, args) => {
        return args.password === ADMIN_PASSWORD;
    },
});

export const publish = mutation({
    args: {
        trackName: v.string(),
        artistName: v.string(),
        albumName: v.optional(v.string()),
        duration: v.number(),
        plainLyrics: v.string(),
        syncedLyrics: v.string(), // Required
    },
    handler: async (ctx, args) => {
        // Only allow synced lyrics (double check logic)
        if (!args.syncedLyrics || args.syncedLyrics.trim().length === 0) {
            throw new Error("Only synced lyrics are allowed to be published");
        }

        // Check if it already exists
        const existing = await ctx.db
            .query("lyrics")
            .withIndex("by_track_artist", (q) =>
                q.eq("trackName", args.trackName).eq("artistName", args.artistName)
            )
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...args,
                status: "pending", // Re-verify on update
                isApproved: false,
            });
            return existing._id;
        }

        const id = await ctx.db.insert("lyrics", {
            ...args,
            searchHistory: 0,
            status: "pending",
            isApproved: false,
            createdAt: Date.now(),
        });
        return id;
    },
});

// Admin Queries
export const listPending = query({
    args: { adminSecret: v.string() },
    handler: async (ctx, args) => {
        if (!validateAdmin(args.adminSecret)) {
            throw new Error("Unauthorized: Invalid admin secret");
        }
        return await ctx.db
            .query("lyrics")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();
    },
});

export const listAll = query({
    args: { adminSecret: v.string() },
    handler: async (ctx, args) => {
        if (!validateAdmin(args.adminSecret)) {
            throw new Error("Unauthorized: Invalid admin secret");
        }
        return await ctx.db.query("lyrics").order("desc").collect();
    },
});

// Admin Mutations
export const updateStatus = mutation({
    args: {
        id: v.id("lyrics"),
        status: v.string(), // "approved" or "rejected"
        adminSecret: v.string(),
    },
    handler: async (ctx, args) => {
        if (!validateAdmin(args.adminSecret)) {
            throw new Error("Unauthorized: Invalid admin secret");
        }
        const isApproved = args.status === "approved";
        await ctx.db.patch(args.id, {
            status: args.status,
            isApproved: isApproved,
        });
    },
});

// Search (Public) - Only Approved
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

// Search (Public) - Text Search
export const searchByText = query({
    args: {
        query: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("lyrics")
            .withSearchIndex("search_lyrics", (q) =>
                q.search("trackName", args.query).eq("isApproved", true)
            )
            .collect();
    },
});

// Analytics
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

// Admin Mutations & Advanced Management
export const updateLyrics = mutation({
    args: {
        id: v.id("lyrics"),
        trackName: v.string(),
        artistName: v.string(),
        albumName: v.optional(v.string()),
        plainLyrics: v.string(),
        syncedLyrics: v.string(),
        adminSecret: v.string(),
    },
    handler: async (ctx, args) => {
        if (!validateAdmin(args.adminSecret)) {
            throw new Error("Unauthorized: Invalid admin secret");
        }
        const { id, adminSecret, ...data } = args;
        await ctx.db.patch(id, data);
    },
});

export const deleteLyric = mutation({
    args: { id: v.id("lyrics"), adminSecret: v.string() },
    handler: async (ctx, args) => {
        if (!validateAdmin(args.adminSecret)) {
            throw new Error("Unauthorized: Invalid admin secret");
        }
        await ctx.db.delete(args.id);
    },
});

export const getStats = query({
    args: { adminSecret: v.string() },
    handler: async (ctx, args) => {
        if (!validateAdmin(args.adminSecret)) {
            throw new Error("Unauthorized: Invalid admin secret");
        }
        const all = await ctx.db.query("lyrics").collect();
        return {
            total: all.length,
            approved: all.filter(l => l.status === "approved").length,
            pending: all.filter(l => l.status === "pending").length,
            rejected: all.filter(l => l.status === "rejected").length,
            totalSearches: all.reduce((acc, current) => acc + (current.searchHistory || 0), 0)
        };
    }
});

export const getById = query({
    args: { id: v.id("lyrics") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});
