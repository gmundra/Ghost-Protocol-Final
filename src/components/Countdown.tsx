import { useEffect, useState } from "react";

function diff(target: Date) {
  const ms = Math.max(0, target.getTime() - Date.now());
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return { d, h, m, s };
}

export function Countdown({ target }: { target: string | null | undefined }) {
  const date = target ? new Date(target) : null;
  const [t, setT] = useState(() => (date ? diff(date) : null));

  useEffect(() => {
    if (!date) return;
    const id = setInterval(() => setT(diff(date)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!date || !t) return null;

  const Cell = ({ v, l }: { v: number; l: string }) => (
    <div className="flex flex-col items-center border border-border px-4 py-3 md:px-6 md:py-4 min-w-[72px] md:min-w-[100px]">
      <span className="font-display text-4xl md:text-6xl text-foreground tabular-nums">
        {String(v).padStart(2, "0")}
      </span>
      <span className="text-xs tracking-[0.3em] text-muted-foreground mt-1">
        {l}
      </span>
    </div>
  );

  return (
    <div className="flex gap-2 md:gap-3">
      <Cell v={t.d} l="DAYS" />
      <Cell v={t.h} l="HRS" />
      <Cell v={t.m} l="MIN" />
      <Cell v={t.s} l="SEC" />
    </div>
  );
}
