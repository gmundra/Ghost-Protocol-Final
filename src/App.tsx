import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SmoothScroll } from "./components/SmoothScroll";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Drops from "./pages/Drops";
import DropDetail from "./pages/DropDetail";
import Checkout from "./pages/Checkout";
import OrderConfirmed from "./pages/OrderConfirmed";
import Admin from "./pages/Admin";
import SignalLost from "./pages/SignalLost";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SmoothScroll>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/drops" element={<Drops />} />
              <Route path="/drop/:id" element={<DropDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmed/:order" element={<OrderConfirmed />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/signal-lost" element={<SignalLost />} />
              <Route path="*" element={<SignalLost />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SmoothScroll>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
