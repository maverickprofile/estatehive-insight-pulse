import { useState, useEffect, lazy, Suspense } from "react";
import { supabase } from "./lib/supabaseClient";
import { Session } from '@supabase/supabase-js';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { OrganizationProvider } from "./contexts/OrganizationContext";
import { Loader2 } from "lucide-react";

// Loading component
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Lazy load all pages for better performance
const Index = lazy(() => import("./pages/Index"));
const PropertiesLayout = lazy(() => import("./pages/PropertiesLayout"));
const AddPropertyLayout = lazy(() => import("./pages/AddPropertyLayout"));
const PropertyDetailsLayout = lazy(() => import("./pages/PropertyDetailsLayout"));
const LeadsLayout = lazy(() => import("./pages/LeadsLayout"));
const CreateLeadLayout = lazy(() => import("./pages/CreateLeadLayout"));
const ClientsLayout = lazy(() => import("./pages/ClientsLayout"));
const CreateClientLayout = lazy(() => import("./pages/CreateClientLayout"));
const ClientDetailsLayout = lazy(() => import("./pages/ClientDetailsLayout"));
const EditClientLayout = lazy(() => import("./pages/EditClientLayout"));
const ClientCommunicationsLayout = lazy(() => import("./pages/ClientCommunicationsLayout"));
const ClientDocumentsLayout = lazy(() => import("./pages/ClientDocumentsLayout"));
const ClientTransactionsLayout = lazy(() => import("./pages/ClientTransactionsLayout"));
const AgentsLayout = lazy(() => import("./pages/AgentsLayout"));
const CreateAgentLayout = lazy(() => import("./pages/CreateAgentLayout"));
const AgentDetailsLayout = lazy(() => import("./pages/AgentDetailsLayout"));
const CreateAppointmentLayout = lazy(() => import("./pages/CreateAppointmentLayout"));
const AnalyticsLayout = lazy(() => import("./pages/AnalyticsLayout"));
const SettingsLayout = lazy(() => import("./pages/SettingsLayout"));
const CalendarLayout = lazy(() => import("./pages/CalendarLayout"));
const AiToolsLayout = lazy(() => import("./pages/AiToolsLayout"));
const WhatsAppQAI = lazy(() => import("./pages/ai-tools/WhatsAppQAI"));
const VoiceToCRM = lazy(() => import("./pages/ai-tools/VoiceToCRM"));
const TestTranscription = lazy(() => import("./pages/ai-tools/TestTranscription"));
const MessagesLayout = lazy(() => import("./pages/MessagesLayout"));
const ProfileLayout = lazy(() => import("./pages/ProfileLayout"));
const InvoicesLayout = lazy(() => import("./pages/InvoicesLayout"));
const InvoicesPage = lazy(() => import("./pages/Invoices"));
const CreateInvoicePage = lazy(() => import("./pages/CreateInvoice"));
const InvoiceDetailsPage = lazy(() => import("./pages/InvoiceDetails"));
const TestWhatsApp = lazy(() => import("./pages/TestWhatsApp"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));

// Optimized QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Optimize initial session check
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Suspense fallback={<PageLoader />}>
            {!session ? (
              <Routes>
                <Route path="*" element={<Auth />} />
              </Routes>
            ) : (
              <OrganizationProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/properties" element={<PropertiesLayout />} />
                  <Route path="/properties/new" element={<AddPropertyLayout />} />
                  <Route path="/properties/:id" element={<PropertyDetailsLayout />} />
                  <Route path="/leads" element={<LeadsLayout />} />
                  <Route path="/leads/new" element={<CreateLeadLayout />} />
                  
                  {/* Client Routes */}
                  <Route path="/clients" element={<ClientsLayout />} />
                  <Route path="/clients/new" element={<CreateClientLayout />} />
                  <Route path="/clients/:id" element={<ClientDetailsLayout />} />
                  <Route path="/clients/:id/edit" element={<EditClientLayout />} />
                  <Route path="/clients/:id/communications" element={<ClientCommunicationsLayout />} />
                  <Route path="/clients/:id/documents" element={<ClientDocumentsLayout />} />
                  <Route path="/clients/:id/transactions" element={<ClientTransactionsLayout />} />
                  
                  {/* Agent Routes */}
                  <Route path="/agents" element={<AgentsLayout />} />
                  <Route path="/agents/new" element={<CreateAgentLayout />} />
                  <Route path="/agents/:id" element={<AgentDetailsLayout />} />

                  {/* Appointment Routes */}
                  <Route path="/appointments/new" element={<CreateAppointmentLayout />} />

                  <Route path="/analytics" element={<AnalyticsLayout />} />
                  <Route path="/reports" element={<AnalyticsLayout />} />
                  <Route path="/settings" element={<SettingsLayout />} />
                  <Route path="/calendar" element={<CalendarLayout />} />
                  <Route path="/ai-tools" element={<AiToolsLayout />} />
                  <Route path="/ai-tools/whatsapp-qai" element={<WhatsAppQAI />} />
                  <Route path="/ai-tools/voice-to-crm" element={<VoiceToCRM />} />
                  <Route path="/ai-tools/test-transcription" element={<TestTranscription />} />
                  <Route path="/messages" element={<MessagesLayout />} />
                  <Route path="/test-whatsapp" element={<TestWhatsApp />} />
                  <Route path="/profile" element={<ProfileLayout />} />
                  
                  <Route path="/invoices" element={<InvoicesLayout />}>
                    <Route index element={<InvoicesPage />} />
                    <Route path="new" element={<CreateInvoicePage />} />
                    <Route path=":id" element={<InvoiceDetailsPage />} />
                  </Route>

                  <Route path="/auth" element={<Navigate to="/" />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </OrganizationProvider>
            )}
          </Suspense>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;