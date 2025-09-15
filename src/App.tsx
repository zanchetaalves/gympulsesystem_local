
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, withAdminAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/use-theme";
import { PrivateRoute } from "@/components/PrivateRoute";
import { MainLayout } from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Clients from "./pages/Clients";
import Subscriptions from "./pages/Subscriptions";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Plans from "./pages/Plans";
import PlanTypes from "./pages/PlanTypes";
import Appointments from "./pages/Appointments";

const queryClient = new QueryClient();

// Component to wrap Users with admin protection
const AdminOnlyUsers = withAdminAuth(Users);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/usuarios"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <AdminOnlyUsers />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/clientes"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <Clients />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/matriculas"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <Subscriptions />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/pagamentos"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <Payments />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/relatorios"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <Reports />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/planos"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <Plans />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/tipos-planos"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <PlanTypes />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/compromissos"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <Appointments />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
