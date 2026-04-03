import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConvexProvider } from "convex/react";
import { convex } from "./lib/convex";
import { AuthProvider, RequireAuth } from "./hooks/useAuth";
import { lazy, Suspense } from "react";

import { getSettings, saveSettings } from "./utils/settingsStorage";
import { useEffect } from "react";

const queryClient = new QueryClient();

const Dashboard = lazy(() => import("./pages/Dashboard"));
const EditorPage = lazy(() => import("./pages/Editor"));
const AdminPage = lazy(() => import("./pages/Admin"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const AboutPage = lazy(() => import("./pages/About"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LoginPage = lazy(() => import("./pages/Login"));
const RegisterPage = lazy(() => import("./pages/Register"));
const LandingPage = lazy(() => import("./pages/Landing"));
const ProfilePage = lazy(() => import("./pages/Profile"));

const App = () => {
  useEffect(() => {
    // Initialize theme from settings
    const settings = getSettings();
    saveSettings(settings);
  }, []);

  return (
    <ConvexProvider client={convex}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <BrowserRouter>
              <Suspense
                fallback={
                  <div className="flex min-h-screen items-center justify-center bg-background">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                  </div>
                }
              >
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route
                    path="/dashboard"
                    element={
                      <RequireAuth requiredRole="guest">
                        <Dashboard />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/editor/:projectId"
                    element={
                      <RequireAuth requiredRole="guest">
                        <EditorPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <RequireAuth requiredRole="admin">
                        <AdminPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <RequireAuth requiredRole="guest">
                        <SettingsPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <RequireAuth requiredRole="guest">
                        <ProfilePage />
                      </RequireAuth>
                    }
                  />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ConvexProvider>
  );
};

export default App;
