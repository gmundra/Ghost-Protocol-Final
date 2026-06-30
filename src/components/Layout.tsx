import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { GrainOverlay } from "./GrainOverlay";
import { CustomCursor } from "./CustomCursor";
import { WhatsAppButton } from "./WhatsAppButton";
import { useQuery } from "@tanstack/react-query";
import { fetchSiteConfig } from "@/lib/queries";

export default function Layout() {
  const loc = useLocation();
  const { data: config } = useQuery({ queryKey: ["site_config"], queryFn: fetchSiteConfig });
  const onAdmin = loc.pathname.startsWith("/admin");

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <GrainOverlay />
      <CustomCursor />
      <Nav />
      <AnimatePresence mode="wait">
        <motion.main
          key={loc.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35 }}
          className={onAdmin ? "" : "pt-14"}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      {!onAdmin && <Footer />}
      <CartDrawer />
      {!onAdmin && <WhatsAppButton number={config?.whatsapp_number ?? "919799355370"} />}
    </div>
  );
}
