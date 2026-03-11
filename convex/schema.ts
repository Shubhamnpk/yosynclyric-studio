import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // User profiles with roles
    users: defineTable({
        email: v.optional(v.string()), // Optional for anonymous contributors
        name: v.optional(v.string()),
        role: v.string(), // "admin", "user", "guest"
        passwordHash: v.optional(v.string()),
        passwordSalt: v.optional(v.string()),
        createdAt: v.number(),
    })
        .index("by_email", ["email"])
        .index("by_role", ["role"])
        .index("by_name", ["name"]),

    sessions: defineTable({
        token: v.string(),
        userId: v.id("users"),
        createdAt: v.number(),
        expiresAt: v.number(),
    }).index("by_token", ["token"]),

    lyrics: defineTable({
        trackName: v.string(),
        artistName: v.string(),
        albumName: v.optional(v.string()),
        duration: v.number(),
        plainLyrics: v.string(),
        syncedLyrics: v.string(), // Now required for publication
        searchHistory: v.optional(v.number()),
        submittedBy: v.optional(v.string()), // Display name (e.g. @shubham or guest_xyz)
        submittedById: v.optional(v.id("users")), // Link to user account if they have one
        status: v.string(), // "pending", "approved", "rejected"
        isApproved: v.boolean(),
        rejectionReason: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.optional(v.number()),
    })
        .index("by_track_artist", ["trackName", "artistName"])
        .index("by_artist", ["artistName"])
        .index("by_status", ["status"])
        .index("by_submitter_id", ["submittedById"])
        .searchIndex("search_lyrics", {
            searchField: "trackName",
            filterFields: ["artistName", "status", "isApproved"],
        }),

    notifications: defineTable({
        userId: v.id("users"), // Now always linked to a user record (even guest)
        type: v.string(), // "approval", "rejection"
        title: v.string(),
        message: v.string(),
        lyricId: v.id("lyrics"),
        isRead: v.boolean(),
        createdAt: v.number(),
    }).index("by_user_id", ["userId"]),
});
