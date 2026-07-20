import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SmoothScroll } from "./components/SmoothScroll";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import Index from "./pages/Index";
import Drops from "./pages/Drops";
import DropDetail from "./pages/DropDetail";
import Story from "./pages/Story";
import Cart from "./pages/Cart";
import Contact from "./pages/Contact";
import Checkout from "./pages/Checkout";
import OrderConfirmed from "./pages/OrderConfirmed";
import Admin from "./pages/Admin";
import SignalLost from "./pages/SignalLost";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <SmoothScroll>
        <BrowserRouter>
          <Nav />
          <main className="min-h-screen">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/drops" element={<Drops />} />
              <Route path="/drop/:id" element={<DropDetail />} />
              <Route path="/story" element={<Story />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmed/:order" element={<OrderConfirmed />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<SignalLost />} />
            </Routes>
          </main>
          <Footer />
        </BrowserRouter>
      </SmoothScroll>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
