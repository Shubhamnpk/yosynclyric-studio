import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

export type UserRole = "admin" | "user" | "guest";

export interface User {
  _id: string;
  email: string;
  name?: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  submissionUsername: string;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const GUEST_ID_KEY = "guest_username";

const generateGuestName = () => {
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `guest_${randomSuffix}`;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [guestName, setGuestName] = useState<string>("");

  // Query to get current user
  const currentUser = useQuery(
    api.auth.getCurrentUser,
    token ? { token } : "skip"
  );

  // Login mutation
  const loginMutation = useMutation(api.auth.login);
  
  // Logout mutation
  const logoutMutation = useMutation(api.auth.logout);

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      setToken(savedToken);
    }

    let savedGuestName = localStorage.getItem(GUEST_ID_KEY);
    if (!savedGuestName) {
      savedGuestName = generateGuestName();
      localStorage.setItem(GUEST_ID_KEY, savedGuestName);
    }
    setGuestName(savedGuestName);

    setIsLoading(false);
  }, []);

  // Update user when token or currentUser changes
  useEffect(() => {
    if (token && currentUser) {
      setUser(currentUser);
      return;
    }
    if (token && currentUser === null) {
      setUser(null);
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      return;
    }
    if (!token) {
      setUser(null);
    }
  }, [token, currentUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await loginMutation({ email, password });
      
      if (result.success && result.token && result.user) {
        setToken(result.token);
        setUser(result.user as User);
        localStorage.setItem(TOKEN_KEY, result.token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await logoutMutation({ token });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    
    const roleHierarchy: Record<UserRole, number> = {
      admin: 3,
      user: 2,
      guest: 1,
    };
    
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  const isUserLoading = !!token && currentUser === undefined;

  const submissionUsername = user ? `@${user.name || user.email.split("@")[0]}` : guestName;

  const value: AuthContextType = {
    user,
    token,
    isLoading: isLoading || isUserLoading,
    isAuthenticated: !!user && !!token,
    submissionUsername,
    login,
    logout,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Protected route component
export function RequireAuth({ 
  children, 
  requiredRole = "guest" 
}: { 
  children: ReactNode;
  requiredRole?: UserRole;
}) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated && requiredRole !== "guest") {
    // Redirect to login but save the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasRole(requiredRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen font-sans">
        <div className="text-center p-8 max-w-md w-full animate-in fade-in zoom-in duration-300">
           <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
           </div>
          <h1 className="text-3xl font-bold mb-3 tracking-tight">Access Denied</h1>
          <p className="text-muted-foreground text-lg mb-8">
            You don't have the necessary permissions to access this administrative area.
          </p>
          <Button onClick={() => window.history.back()} variant="outline" className="rounded-full px-8">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Hook to check if user has specific role
export function useHasRole(requiredRole: UserRole): boolean {
  const { hasRole, isAuthenticated } = useAuth();
  return isAuthenticated && hasRole(requiredRole);
}

// Hook for admin-only operations
export function useAdmin() {
  const { user, hasRole, isAuthenticated } = useAuth();
  return {
    isAdmin: isAuthenticated && hasRole("admin"),
    user,
  };
}
