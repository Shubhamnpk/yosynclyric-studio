import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Optional legacy admin password (used only to migrate old users without hashes)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Generate a secure random token
const generateToken = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

const PASSWORD_ITERATIONS = 100_000;
const PASSWORD_SALT_BYTES = 16;
const PASSWORD_HASH_BITS = 256;
const textEncoder = new TextEncoder();

const bytesToBase64 = (bytes: Uint8Array): string =>
    btoa(String.fromCharCode(...bytes));

const base64ToBytes = (b64: string): Uint8Array => {
    const binary = atob(b64);
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
};

const generateSalt = (): string => {
    const salt = new Uint8Array(PASSWORD_SALT_BYTES);
    crypto.getRandomValues(salt);
    return bytesToBase64(salt);
};

const hashPassword = async (password: string, saltB64: string): Promise<string> => {
    const key = await crypto.subtle.importKey(
        "raw",
        textEncoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: base64ToBytes(saltB64) as any,
            iterations: PASSWORD_ITERATIONS,
            hash: "SHA-256",
        },
        key,
        PASSWORD_HASH_BITS
    );
    return bytesToBase64(new Uint8Array(bits));
};

const verifyPassword = async (password: string, saltB64: string, expectedHash: string): Promise<boolean> => {
    const computed = await hashPassword(password, saltB64);
    return computed === expectedHash;
};


// User types
export type UserRole = "admin" | "user" | "guest";

// Get current user from session token (query - read only)
export const getCurrentUser = query({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        if (!args.token) return null;

        const session = await ctx.db
            .query("sessions")
            .withIndex("by_token", (q: any) => q.eq("token", args.token))
            .unique();

        if (!session) return null;

        // Check if token has expired
        if (Date.now() > session.expiresAt) {
            return null; // Don't delete in query, just return null
        }

        // Get user details
        const user = await ctx.db.get(session.userId);
        if (!user) return null;

        return {
            _id: user._id,
            email: user.email,
            name: user.name,
            role: user.role as UserRole,
        };
    },
});

// Find guest user by name
export const getGuestUserByName = query({
    args: { name: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_name", (q: any) => q.eq("name", args.name))
            .filter((q) => q.eq(q.field("role"), "guest"))
            .unique();
        return user?._id || null;
    },
});

// Create or get guest user by anonymous name
export const ensureGuestUser = mutation({
    args: { name: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("users")
            .withIndex("by_name", (q: any) => q.eq("name", args.name))
            .unique();

        if (existing) {
            // If it exists but is a real user, we shouldn't use it as guest
            // but for guest_XXXX names it's fine.
            return existing._id;
        }

        const userId = await ctx.db.insert("users", {
            name: args.name,
            role: "guest",
            createdAt: Date.now(),
        });
        return userId;
    },
});

// Register - creates a new user
export const register = mutation({
    args: { 
        email: v.string(),
        password: v.string(),
        name: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const email = args.email.trim().toLowerCase();
        
        const existing = await ctx.db
            .query("users")
            .withIndex("by_email", (q: any) => q.eq("email", email))
            .unique();
            
        if (existing) {
            return { success: false, error: "User with this email already exists" };
        }

        const role: UserRole = "user";
        const passwordSalt = generateSalt();
        const passwordHash = await hashPassword(args.password, passwordSalt);

        const userId = await ctx.db.insert("users", {
            email,
            name: args.name || email.split("@")[0],
            role,
            passwordHash,
            passwordSalt,
            createdAt: Date.now(),
        });

        // Auto-login after registration
        const token = generateToken();
        const expiresAt = Date.now() + SESSION_DURATION_MS;

        await ctx.db.insert("sessions", {
            token,
            userId,
            createdAt: Date.now(),
            expiresAt,
        });

        const user = await ctx.db.get(userId);
        return {
            success: true,
            token,
            user: {
                _id: user?._id,
                email: user?.email,
                name: user?.name,
                role: user?.role as UserRole,
            }
        };
    },
});

// Login - verifies password and creates session
export const login = mutation({
    args: { 
        email: v.string(),
        password: v.string() 
    },
    handler: async (ctx, args) => {
        const email = args.email.trim().toLowerCase();

        // Find user by email
        let user = await ctx.db
            .query("users")
            .withIndex("by_email", (q: any) => q.eq("email", email))
            .unique();

        if (!user) return { success: false, error: "User not found" };

        // Migrate legacy users without stored password hashes
        if (!user.passwordHash || !user.passwordSalt) {
            if (!ADMIN_PASSWORD || args.password !== ADMIN_PASSWORD) {
                return { success: false, error: "Invalid credentials" };
            }
            const passwordSalt = generateSalt();
            const passwordHash = await hashPassword(args.password, passwordSalt);
            await ctx.db.patch(user._id, { passwordHash, passwordSalt });
        } else {
            const ok = await verifyPassword(args.password, user.passwordSalt, user.passwordHash);
            if (!ok) return { success: false, error: "Invalid credentials" };
        }

        // Ensure we use the role from the database
        const role = user.role as UserRole;

        // Generate session token
        const token = generateToken();
        const expiresAt = Date.now() + SESSION_DURATION_MS;

        // Store session in database
        await ctx.db.insert("sessions", {
            token,
            userId: user._id,
            createdAt: Date.now(),
            expiresAt,
        });

        return {
            success: true,
            token,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                role,
            }
        };
    },
});

// Logout - invalidates session
export const logout = mutation({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const session = await ctx.db
            .query("sessions")
            .withIndex("by_token", (q: any) => q.eq("token", args.token))
            .unique();

        if (session) {
            await ctx.db.delete(session._id);
        }
        return true;
    },
});

// Update user profile (name and email)
export const updateProfile = mutation({
    args: { userId: v.id("users"), name: v.optional(v.string()), email: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const updates: any = {};
        if (args.name !== undefined) updates.name = args.name;
        if (args.email !== undefined) {
             const email = args.email.trim().toLowerCase();
             // Check if email is already used by someone else
             const existing = await ctx.db
                 .query("users")
                 .withIndex("by_email", (q: any) => q.eq("email", email))
                 .unique();
             if (existing && existing._id !== args.userId) {
                 return { success: false, error: "Email already in use" };
             }
             updates.email = email;
        }
        await ctx.db.patch(args.userId, updates);
        return { success: true };
    },
});

// Update user password
export const updatePassword = mutation({
    args: { userId: v.id("users"), currentPassword: v.string(), newPassword: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.passwordHash || !user.passwordSalt) return { success: false, error: "User not found or not an account holder" };

        const ok = await verifyPassword(args.currentPassword, user.passwordSalt, user.passwordHash);
        if (!ok) return { success: false, error: "Current password incorrect" };

        const newSalt = generateSalt();
        const newHash = await hashPassword(args.newPassword, newSalt);
        
        await ctx.db.patch(args.userId, {
            passwordHash: newHash,
            passwordSalt: newSalt
        });
        return { success: true };
    },
});

// Upgrade guest to full account
export const upgradeToAccount = mutation({
    args: { userId: v.id("users"), email: v.string(), password: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return { success: false, error: "Profile not found" };
        if (user.role !== "guest") return { success: false, error: "Only guest profiles can be upgraded" };

        const email = args.email.trim().toLowerCase();
        const existing = await ctx.db
            .query("users")
            .withIndex("by_email", (q: any) => q.eq("email", email))
            .unique();
        
        if (existing) return { success: false, error: "Email already in use" };

        const salt = generateSalt();
        const hash = await hashPassword(args.password, salt);

        await ctx.db.patch(args.userId, {
            email,
            passwordHash: hash,
            passwordSalt: salt,
            role: "user"
        });

        // Generate session token after upgrade
        const token = generateToken();
        const expiresAt = Date.now() + SESSION_DURATION_MS;

        await ctx.db.insert("sessions", {
            token,
            userId: args.userId,
            createdAt: Date.now(),
            expiresAt,
        });

        return { success: true, token };
    },
});

// Clean up expired sessions (can be called periodically)
export const cleanupExpiredSessions = mutation({
    handler: async (ctx) => {
        const now = Date.now();
        const sessions = await ctx.db.query("sessions").collect();
        
        for (const session of sessions) {
            if (session.expiresAt < now) {
                await ctx.db.delete(session._id);
            }
        }
        
        return { cleaned: sessions.filter(s => s.expiresAt < now).length };
    },
});
