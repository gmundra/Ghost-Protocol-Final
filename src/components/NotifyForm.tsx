import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({ email: z.string().trim().email().max(255) });

export function NotifyForm({ source = "home" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = schema.safeParse({ email });
    if (!r.success) return toast.error("ENTER A VALID EMAIL");
    setLoading(true);
    const { error } = await supabase.from("notify_signups").insert({ email: r.data.email, source });
    setLoading(false);
    if (error && !error.message.includes("duplicate")) toast.error("SIGNAL LOST. TRY AGAIN.");
    else {
      toast.success("SIGNAL RECEIVED.");
      setEmail("");
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-0 w-full max-w-lg">
      <input
        type="email"
        required
        placeholder="YOUR.EMAIL@VOID.IO"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 bg-transparent border border-border px-4 py-4 text-foreground placeholder:text-muted-foreground tracking-widest focus:outline-none focus:border-primary"
      />
      <button
        disabled={loading}
        className="border border-foreground sm:border-l-0 px-6 py-4 font-display tracking-[0.25em] hover:bg-primary hover:border-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
      >
        {loading ? "..." : "GET NOTIFIED"}
      </button>
    </form>
  );
}
