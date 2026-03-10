import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
    path: "/get",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        const url = new URL(request.url);
        const trackName = url.searchParams.get("track_name");
        const artistName = url.searchParams.get("artist_name");
        const duration = url.searchParams.get("duration");

        if (!trackName || !artistName) {
            return new Response(JSON.stringify({ error: "Missing track_name or artist_name" }), {
                status: 400,
                headers: { 
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        }

        const lyrics = await ctx.runQuery(api.lyrics.search, {
            trackName,
            artistName,
            duration: duration ? parseInt(duration) : undefined,
        });

        if (!lyrics) {
            return new Response(JSON.stringify({ error: "Lyrics not found" }), {
                status: 404,
                headers: { 
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        }

        return new Response(JSON.stringify(lyrics), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    }),
});

http.route({
    path: "/search",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        const url = new URL(request.url);
        const query = url.searchParams.get("q");

        if (!query) {
            return new Response(JSON.stringify({ error: "Missing query parameter 'q'" }), {
                status: 400,
                headers: { 
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        }

        const results = await ctx.runQuery(api.lyrics.searchByText, {
            query,
        });

        return new Response(JSON.stringify(results), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    }),
});

// Preflight request support for CORS
http.route({
    path: "/get",
    method: "OPTIONS",
    handler: httpAction(async (ctx, request) => {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
    }),
});

http.route({
    path: "/search",
    method: "OPTIONS",
    handler: httpAction(async (ctx, request) => {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
    }),
});

export default http;
