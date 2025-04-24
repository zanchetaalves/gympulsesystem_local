
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Clients from "./pages/Clients";
import Subscriptions from "./pages/Subscriptions";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
          <Route path="/usuarios" element={<MainLayout><Users /></MainLayout>} />
          <Route path="/clientes" element={<MainLayout><Clients /></MainLayout>} />
          <Route path="/matriculas" element={<MainLayout><Subscriptions /></MainLayout>} />
          <Route path="/pagamentos" element={<MainLayout><Payments /></MainLayout>} />
          <Route path="/relatorios" element={<MainLayout><Reports /></MainLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
