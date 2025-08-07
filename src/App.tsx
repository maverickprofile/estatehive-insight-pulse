import { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import { Session } from '@supabase/supabase-js';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Page Imports
import Index from "./pages/Index";
import PropertiesLayout from "./pages/PropertiesLayout";
import AddPropertyLayout from "./pages/AddPropertyLayout";
import PropertyDetailsLayout from "./pages/PropertyDetailsLayout";
import LeadsLayout from "./pages/LeadsLayout";
import CreateLeadLayout from "./pages/CreateLeadLayout";
import ClientsLayout from "./pages/ClientsLayout";
import CreateClientLayout from "./pages/CreateClientLayout";
import AgentsLayout from "./pages/AgentsLayout"; // New
import CreateAgentLayout from "./pages/CreateAgentLayout"; // New
import AgentDetailsLayout from "./pages/AgentDetailsLayout"; // New
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

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
        <Router>
          {!session ? (
            <Routes>
              <Route path="*" element={<Auth />} />
            </Routes>
          ) : (
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/properties" element={<PropertiesLayout />} />
              <Route path="/properties/new" element={<AddPropertyLayout />} />
              <Route path="/properties/:id" element={<PropertyDetailsLayout />} />
              <Route path="/leads" element={<LeadsLayout />} />
              <Route path="/leads/new" element={<CreateLeadLayout />} />
              <Route path="/clients" element={<ClientsLayout />} />
              <Route path="/clients/new" element={<CreateClientLayout />} />
              
              {/* New Agent Routes */}
              <Route path="/agents" element={<AgentsLayout />} />
              <Route path="/agents/new" element={<CreateAgentLayout />} />
              <Route path="/agents/:id" element={<AgentDetailsLayout />} />

              <Route path="/analytics" element={<AnalyticsLayout />} />
              <Route path="/reports" element={<AnalyticsLayout />} />
              <Route path="/settings" element={<SettingsLayout />} />
              <Route path="/calendar" element={<CalendarLayout />} />
              <Route path="/ai-tools" element={<AiToolsLayout />} />
              <Route path="/messages" element={<MessagesLayout />} />
              <Route path="/profile" element={<ProfileLayout />} />
              
              <Route path="/invoices" element={<InvoicesLayout />}>
                <Route index element={<InvoicesPage />} />
                <Route path="new" element={<CreateInvoicePage />} />
                <Route path=":id" element={<InvoiceDetailsPage />} />
              </Route>

              <Route path="/auth" element={<Navigate to="/" />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          )}
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
