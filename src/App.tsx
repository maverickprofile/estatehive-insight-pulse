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
import PropertiesLayout from "./pages/PropertiesLayout";
import AddPropertyLayout from "./pages/AddPropertyLayout";
import PropertyDetailsLayout from "./pages/PropertyDetailsLayout";
import LeadsLayout from "./pages/LeadsLayout";
import CreateLeadLayout from "./pages/CreateLeadLayout"; // New import
import ClientsLayout from "./pages/ClientsLayout";
import AnalyticsLayout from "./pages/AnalyticsLayout";
import SettingsLayout from "./pages/SettingsLayout";
import CalendarLayout from "./pages/CalendarLayout";
import AiToolsLayout from "./pages/AiToolsLayout";
import MessagesLayout from "./pages/MessagesLayout";
import ProfileLayout from "./pages/ProfileLayout";
import InvoicesLayout from "./pages/InvoicesLayout";
import InvoicesPage from "./pages/Invoices";
import CreateInvoicePage from "./pages/CreateInvoice";
import InvoiceDetailsPage from "./pages/InvoiceDetails";
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
              <Route path="/properties" element={<PropertiesLayout />} />
              <Route path="/properties/new" element={<AddPropertyLayout />} />
              <Route path="/properties/:id" element={<PropertyDetailsLayout />} />
              <Route path="/leads" element={<LeadsLayout />} />
              <Route path="/leads/new" element={<CreateLeadLayout />} /> {/* New Route */}
              <Route path="/clients" element={<ClientsLayout />} />
              <Route path="/analytics" element={<AnalyticsLayout />} />
              <Route path="/reports" element={<AnalyticsLayout />} />
              <Route path="/settings" element={<SettingsLayout />} />
              <Route path="/calendar" element={<CalendarLayout />} />
              <Route path="/ai-tools" element={<AiToolsLayout />} />
              <Route path="/messages" element={<MessagesLayout />} />
              <Route path="/profile" element={<ProfileLayout />} />
              
              {/* New Invoice Routes */}
              <Route path="/invoices" element={<InvoicesLayout />}>
                <Route index element={<InvoicesPage />} />
                <Route path="new" element={<CreateInvoicePage />} />
                <Route path=":id" element={<InvoiceDetailsPage />} />
              </Route>

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
