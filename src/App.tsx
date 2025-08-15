import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Inventory from "./pages/Inventory";
import Users from "./pages/Users";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes with Layout */}
          <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/projects" element={<AppLayout><Projects /></AppLayout>} />
          <Route path="/inventory" element={<AppLayout><Inventory /></AppLayout>} />
          <Route path="/users" element={<AppLayout><Users /></AppLayout>} />
          <Route path="/vendors" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/bom" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/work-orders" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/purchase-orders" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/gate-pass" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/reports" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><Dashboard /></AppLayout>} />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
