import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // User profiles with roles
    users: defineTable({
        email: v.optional(v.string()), // Optional for anonymous contributors
        name: v.optional(v.string()),
        username: v.optional(v.string()),
        role: v.string(), // "admin", "user", "guest"
        passwordHash: v.optional(v.string()),
        passwordSalt: v.optional(v.string()),
        createdAt: v.number(),
    })
        .index("by_email", ["email"])
        .index("by_role", ["role"])
        .index("by_name", ["name"])
        .index("by_username", ["username"]),

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
        syncedLyrics: v.string(),
        searchHistory: v.optional(v.number()),
        submittedBy: v.optional(v.string()), // Display name
        submittedById: v.optional(v.id("users")), 
        status: v.string(), // "pending", "approved", "rejected", "improvement_pending"
        parentLyricId: v.optional(v.id("lyrics")), // For improvements to existing tracks
        isApproved: v.boolean(),
        rejectionReason: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.optional(v.number()),
    })
        .index("by_track_artist", ["trackName", "artistName"])
        .index("by_artist", ["artistName"])
        .index("by_status", ["status"])
        .index("by_submitter_id", ["submittedById"])
        .index("by_parent", ["parentLyricId"])
        .searchIndex("search_lyrics", {
            searchField: "trackName",
            filterFields: ["artistName", "status", "isApproved"],
        }),

    notifications: defineTable({
        userId: v.id("users"),
        type: v.string(), // "approval", "rejection", "improvement_request"
        title: v.string(),
        message: v.string(),
        lyricId: v.id("lyrics"),
        isRead: v.boolean(),
        createdAt: v.number(),
    }).index("by_user_id", ["userId"])
        .index("by_created_at", ["createdAt"]),
});
