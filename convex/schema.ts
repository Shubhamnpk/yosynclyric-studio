import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    lyrics: defineTable({
        trackName: v.string(),
        artistName: v.string(),
        albumName: v.optional(v.string()),
        duration: v.number(),
        plainLyrics: v.string(),
        syncedLyrics: v.string(), // Now required for publication
        searchHistory: v.optional(v.number()),
        status: v.string(), // "pending", "approved", "rejected"
        isApproved: v.boolean(),
        createdAt: v.number(),
    })
        .index("by_track_artist", ["trackName", "artistName"])
        .index("by_artist", ["artistName"])
        .index("by_status", ["status"])
        .searchIndex("search_lyrics", {
            searchField: "trackName",
            filterFields: ["artistName", "status", "isApproved"],
        }),
});
