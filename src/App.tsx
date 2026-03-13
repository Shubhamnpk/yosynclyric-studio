import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConvexProvider } from "convex/react";
import { convex } from "./lib/convex";
import { AuthProvider, RequireAuth } from "./hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import EditorPage from "./pages/Editor";
import AdminPage from "./pages/Admin";
import SettingsPage from "./pages/Settings";
import AboutPage from "./pages/About";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import LandingPage from "./pages/Landing";
import ProfilePage from "./pages/Profile";

import { getSettings, saveSettings } from "./utils/settingsStorage";
import { useEffect } from "react";

const queryClient = new QueryClient();

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
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ConvexProvider>
  );
};

export default App;
