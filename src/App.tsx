import { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import { Session } from '@supabase/supabase-js';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Page Imports
import Index from "./pages/Index";
import Properties from "./pages/PropertiesLayout";
import AddProperty from "./pages/AddPropertyLayout";
import PropertyDetails from "./pages/PropertyDetailsLayout"; // New import
import Leads from "./pages/LeadsLayout";
import Clients from "./pages/ClientsLayout";
import Analytics from "./pages/AnalyticsLayout";
import Settings from "./pages/SettingsLayout";
import Calendar from "./pages/CalendarLayout";
import AiTools from "./pages/AiToolsLayout";
import Messages from "./pages/MessagesLayout";
import Profile from "./pages/ProfileLayout";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for an active session when the app loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for changes in authentication state (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Cleanup subscription on component unmount
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {!session ? (
            // Routes accessible when the user is not logged in
            <Routes>
              <Route path="*" element={<Auth />} />
            </Routes>
          ) : (
            // Routes accessible only when the user is logged in
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/properties/new" element={<AddProperty />} />
              <Route path="/properties/:id" element={<PropertyDetails />} /> {/* New Route */}
              <Route path="/leads" element={<Leads />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/reports" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/ai-tools" element={<AiTools />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/profile" element={<Profile />} />
              {/* If a logged-in user tries to visit /auth, redirect them to the dashboard */}
              <Route path="/auth" element={<Navigate to="/" />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
