import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import LeadDetail from "@/pages/lead-detail";
import Login from "@/pages/auth/login";
import Contacts from "@/pages/contacts";
import Settings from "@/pages/settings";
import ApplyPage from "@/pages/apply";
import Quotations from "@/pages/quotations";
import GeneratePIF from "@/pages/generate-pif";
import LandingLeads from "@/pages/landing-leads";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/protected-route";
import LandingPage from "@/pages/landing";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={Login} />
      <Route path="/apply" component={ApplyPage} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/contacts">
        <ProtectedRoute>
          <Contacts />
        </ProtectedRoute>
      </Route>
      <Route path="/landing-leads">
        <ProtectedRoute>
          <LandingLeads />
        </ProtectedRoute>
      </Route>
      <Route path="/quotations">
        <ProtectedRoute>
          <Quotations />
        </ProtectedRoute>
      </Route>
      <Route path="/quotations/handmade">
        <ProtectedRoute>
          <Quotations />
        </ProtectedRoute>
      </Route>
      <Route path="/quotations/ga">
        <ProtectedRoute>
          <Quotations />
        </ProtectedRoute>
      </Route>
      <Route path="/quotations/pif">
        <ProtectedRoute>
          <Quotations />
        </ProtectedRoute>
      </Route>
      <Route path="/quotations/generate-pif">
        <ProtectedRoute>
          <GeneratePIF />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route path="/leads/:id">
        <ProtectedRoute>
          <LeadDetail />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
