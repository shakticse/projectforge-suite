// Force rebuild - clearing cache and fixing routing
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Inventory from "./pages/Inventory";
import Users from "./pages/Users";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Vendors from "./pages/Vendors";
import BOM from "./pages/BOM";
import BOMDetails from "./pages/BOMDetails";
import BOMSummary from "./pages/BOMSummary";
import BOMConsolidateDetails from "./pages/BOMConsolidateDetails";
import BOMStatus from "./pages/BOMStatus";
import WorkOrders from "./pages/WorkOrders";
import WorkOrderRequests from "./pages/WorkOrderRequests";
import PurchaseRequest from "./pages/PurchaseRequests";
import GatePass from "./pages/GatePass";
import VehicleRequest from "./pages/VehicleRequest";
import BOMAction from "./pages/BOMAction";
import Reports from "./pages/Reports";
import MaterialRequest from "./pages/MaterialRequest";
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
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Protected Routes with Layout */}
          <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><AppLayout><Projects /></AppLayout></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><AppLayout><Inventory /></AppLayout></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><AppLayout><Users /></AppLayout></ProtectedRoute>} />
          <Route path="/vendors" element={<ProtectedRoute><AppLayout><Vendors /></AppLayout></ProtectedRoute>} />
          <Route path="/bom" element={<ProtectedRoute><AppLayout><BOM /></AppLayout></ProtectedRoute>} />
          <Route path="/bom/:bomId" element={<ProtectedRoute><AppLayout><BOMSummary /></AppLayout></ProtectedRoute>} />
          <Route path="/bom-details/:id" element={<ProtectedRoute><AppLayout><BOMDetails /></AppLayout></ProtectedRoute>} />
          <Route path="/bom-status/:id" element={<ProtectedRoute><AppLayout><BOMStatus /></AppLayout></ProtectedRoute>} />
          <Route path="/bom-consolidate/:bomId" element={<ProtectedRoute><AppLayout><BOMConsolidateDetails /></AppLayout></ProtectedRoute>} />
          <Route path="/work-orders" element={<ProtectedRoute><AppLayout><WorkOrders /></AppLayout></ProtectedRoute>} />
          <Route path="/work-requests" element={<ProtectedRoute><AppLayout><WorkOrderRequests /></AppLayout></ProtectedRoute>} />
          <Route path="/purchase-requests" element={<ProtectedRoute><AppLayout><PurchaseRequest /></AppLayout></ProtectedRoute>} />
          <Route path="/gate-pass" element={<ProtectedRoute><AppLayout><GatePass /></AppLayout></ProtectedRoute>} />
          <Route path="/vehicle-request" element={<ProtectedRoute><AppLayout><VehicleRequest /></AppLayout></ProtectedRoute>} />
          <Route path="/bom-action" element={<ProtectedRoute><AppLayout><BOMAction /></AppLayout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><AppLayout><Reports /></AppLayout></ProtectedRoute>} />
          <Route path="/material-request" element={<ProtectedRoute><AppLayout><MaterialRequest /></AppLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
