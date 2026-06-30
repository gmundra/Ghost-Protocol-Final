import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { formatINR } from "@/store/cart";
import type { Drop, SiteConfig } from "@/lib/types";
import { GlitchText } from "@/components/GlitchText";
import { isAdminAuthed, setAdminAuthed, setAdminCode, getAdminCode } from "@/lib/admin-auth";
import { adminApi } from "@/lib/admin-api";
import { uploadToMedia, signedUrl, listMedia, removeMedia, MEDIA_BUCKET } from "@/lib/storage";
import { SignedImage } from "@/components/SignedImage";
import { PrintAreaEditor } from "@/components/PrintAreaEditor";
import { HeroVideoUploader } from "@/components/HeroVideoUploader";
import { Upload, Trash2, Copy, ExternalLink, Image as ImageIcon, RefreshCw } from "lucide-react";

type Tab = "drops" | "orders" | "media" | "configurator" | "config" | "settings" | "signups";

const PRODUCTION_STATUSES = ["pending_review", "approved", "rejected", "in_production", "shipped"] as const;
type ProductionStatus = typeof PRODUCTION_STATUSES[number];

export default function Admin() {
  const [authed, setAuthed] = useState(isAdminAuthed());
  const [tab, setTab] = useState<Tab>("drops");

  if (!authed) return <AdminLogin onPass={() => setAuthed(true)} />;

  const tabs: { k: Tab; label: string }[] = [
    { k: "drops", label: "DROPS" },
    { k: "orders", label: "ORDERS" },
    { k: "media", label: "MEDIA" },
    { k: "configurator", label: "CONFIGURATOR" },
    { k: "config", label: "SITE" },
    { k: "settings", label: "SETTINGS" },
    { k: "signups", label: "SIGNUPS" },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-64 md:min-h-screen md:border-r border-border md:p-6 flex md:flex-col items-center md:items-stretch justify-between md:justify-start p-4 border-b border-border bg-background md:bg-secondary">
        <Link to="/" className="font-display text-lg tracking-[0.25em] hover:text-primary md:mb-12">
          GHOST/ADMIN
        </Link>
        <nav className="flex md:flex-col gap-1 md:gap-0 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`text-xs md:text-sm tracking-[0.3em] md:py-3 px-3 md:px-0 md:text-left whitespace-nowrap transition-colors ${
                tab === t.k ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <button
          onClick={() => { setAdminAuthed(false); setAuthed(false); }}
          className="hidden md:block mt-auto text-xs tracking-[0.3em] text-muted-foreground hover:text-primary text-left"
        >
          SIGN OUT
        </button>
      </aside>
      <main className="flex-1 p-6 md:p-10">
        {tab === "drops" && <DropsAdmin />}
        {tab === "orders" && <OrdersAdmin />}
        {tab === "media" && <MediaAdmin />}
        {tab === "configurator" && <ConfiguratorAdmin />}
        {tab === "config" && <ConfigAdmin />}
        {tab === "settings" && <SettingsAdmin onSignOut={() => { setAdminAuthed(false); setAuthed(false); }} />}
        {tab === "signups" && <SignupsAdmin />}
      </main>
    </div>
  );
}

// ------------------------------------------------------------------ LOGIN
function AdminLogin({ onPass }: { onPass: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErr(false);
    const res = await adminApi("verify", undefined, pw);
    if (res.ok) {
      setAdminCode(pw);
      setAdminAuthed(true);
      toast.success("CLEARANCE GRANTED");
      onPass();
    } else {
      setErr(true);
      toast.error("ACCESS DENIED");
    }
    setPending(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-sm">
        <div className="text-xs tracking-[0.4em] text-primary mb-3 animate-flicker">// RESTRICTED ACCESS</div>
        <h1 className="font-display text-4xl mb-8"><GlitchText>GHOST/ADMIN</GlitchText></h1>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="password" required placeholder="ENTER ACCESS CODE"
            value={pw} onChange={(e) => { setPw(e.target.value); setErr(false); }}
            autoFocus
            className={`w-full bg-transparent border px-4 py-3 tracking-widest focus:outline-none ${err ? "border-primary text-primary animate-flicker" : "border-border focus:border-primary"}`}
          />
          <button disabled={pending} className="w-full bg-primary text-primary-foreground py-3 font-display tracking-[0.25em] hover:bg-foreground hover:text-background transition-colors disabled:opacity-50">
            {pending ? "VERIFYING..." : "AUTHENTICATE"}
          </button>
        </form>
        <Link to="/" className="block mt-8 text-xs tracking-[0.3em] text-muted-foreground hover:text-primary text-center">← RETURN TO BASE</Link>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ DROPS
function DropsAdmin() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [editing, setEditing] = useState<Partial<Drop> & { size_chart_url?: string | null; tags?: any; category?: string; sort_order?: number } | null>(null);

  async function load() {
    const { data } = await supabase.from("drops").select("*").order("sort_order", { ascending: true }).order("drop_number", { ascending: false });
    setDrops((data ?? []) as unknown as Drop[]);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    const payload: any = { ...editing };
    if (typeof payload.sizes === "string") payload.sizes = payload.sizes.split(",").map((s: string) => s.trim()).filter(Boolean);
    if (typeof payload.tags === "string") payload.tags = payload.tags.split(",").map((s: string) => s.trim()).filter(Boolean);
    if (!payload.slug || !payload.name) return toast.error("SLUG + NAME REQUIRED");
    const res = await adminApi("upsert_drop", { drop: payload });
    if (res.error) toast.error(res.error);
    else { toast.success("SAVED"); setEditing(null); load(); }
  }

  async function del(id: string) {
    if (!confirm("Delete this drop?")) return;
    const res = await adminApi("delete_drop", { id });
    if (res.error) toast.error(res.error); else { toast.success("DELETED"); load(); }
  }

  async function uploadField(field: "cover_image" | "size_chart_url", file: File) {
    const path = await uploadToMedia(file, `drops/${field}`, file.name);
    setEditing((e) => e ? { ...e, [field]: path } as any : e);
    toast.success("UPLOADED");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-display text-4xl tracking-widest">DROPS</h2>
        <button onClick={() => setEditing({ status: "draft", currency: "INR", sizes: [], gallery: [], stock: 0, price: 0, sort_order: 0, tags: [] } as any)}
          className="border border-foreground px-4 py-2 font-display tracking-[0.25em] hover:bg-primary hover:border-primary hover:text-primary-foreground">
          + NEW DROP
        </button>
      </div>
      <div className="border border-border divide-y divide-border">
        {drops.map((d) => (
          <div key={d.id} className="flex items-center justify-between p-4 gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {d.cover_image && <SignedImage path={d.cover_image} className="w-12 h-14 object-cover grayscale" />}
              <div className="min-w-0">
                <div className="font-display tracking-widest truncate">{d.name}</div>
                <div className="text-xs text-muted-foreground tracking-widest">{d.slug} · {d.status} · {formatINR(d.price)}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing({ ...(d as any), sizes: (d as any).sizes ?? [] })} className="text-xs tracking-[0.3em] hover:text-primary">EDIT</button>
              <button onClick={() => del(d.id)} className="text-xs tracking-[0.3em] text-muted-foreground hover:text-primary">DELETE</button>
            </div>
          </div>
        ))}
        {drops.length === 0 && <div className="p-6 text-muted-foreground tracking-widest">// NO DROPS</div>}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border border-border w-full max-w-2xl p-6 my-8">
            <h3 className="font-display text-2xl mb-6 tracking-widest">{editing.id ? "EDIT DROP" : "NEW DROP"}</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["slug", "SLUG"],
                ["name", "NAME"],
                ["tagline", "TAGLINE"],
                ["category", "CATEGORY"],
                ["price", "PRICE (PAISE)"],
                ["stock", "STOCK"],
                ["drop_number", "DROP NUMBER"],
                ["sort_order", "SORT ORDER"],
              ].map(([k, l]) => (
                <div key={k} className={k === "tagline" ? "col-span-2" : ""}>
                  <label className="text-xs tracking-[0.3em] text-muted-foreground">{l}</label>
                  <input
                    value={(editing as any)[k] ?? ""}
                    onChange={(e) => setEditing({ ...editing, [k]: ["price","stock","drop_number","sort_order"].includes(k as string) ? Number(e.target.value) : e.target.value })}
                    className="w-full bg-transparent border border-border px-3 py-2 tracking-widest focus:outline-none focus:border-primary"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="text-xs tracking-[0.3em] text-muted-foreground">DESCRIPTION</label>
                <textarea
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={3}
                  className="w-full bg-transparent border border-border px-3 py-2 tracking-widest focus:outline-none focus:border-primary"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs tracking-[0.3em] text-muted-foreground">SIZES (comma-separated)</label>
                <input
                  value={Array.isArray(editing.sizes) ? editing.sizes.join(",") : (editing.sizes ?? "") as any}
                  onChange={(e) => setEditing({ ...editing, sizes: e.target.value as any })}
                  className="w-full bg-transparent border border-border px-3 py-2 tracking-widest focus:outline-none focus:border-primary"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs tracking-[0.3em] text-muted-foreground">TAGS (comma-separated)</label>
                <input
                  value={Array.isArray((editing as any).tags) ? (editing as any).tags.join(",") : ((editing as any).tags ?? "")}
                  onChange={(e) => setEditing({ ...editing, tags: e.target.value as any })}
                  className="w-full bg-transparent border border-border px-3 py-2 tracking-widest focus:outline-none focus:border-primary"
                />
              </div>
              <FileField label="COVER IMAGE" path={editing.cover_image ?? null} onUpload={(f) => uploadField("cover_image", f)} onClear={() => setEditing({ ...editing, cover_image: null as any })} />
              <FileField label="SIZE CHART" path={(editing as any).size_chart_url ?? null} onUpload={(f) => uploadField("size_chart_url", f)} onClear={() => setEditing({ ...editing, size_chart_url: null } as any)} />
              <div>
                <label className="text-xs tracking-[0.3em] text-muted-foreground">STATUS</label>
                <select value={editing.status ?? "draft"} onChange={(e) => setEditing({ ...editing, status: e.target.value as any })}
                  className="w-full bg-background border border-border px-3 py-2 tracking-widest focus:outline-none focus:border-primary">
                  {["draft","live","sold_out","archived"].map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <label className="text-xs tracking-[0.3em] flex items-center gap-2">
                  <input type="checkbox" checked={!!editing.is_featured} onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })} />
                  FEATURED
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={save} className="flex-1 bg-primary text-primary-foreground py-3 font-display tracking-[0.25em] hover:bg-foreground hover:text-background">SAVE</button>
              <button onClick={() => setEditing(null)} className="px-6 border border-border tracking-[0.3em] text-xs hover:border-foreground">CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FileField({ label, path, onUpload, onClear }: { label: string; path: string | null; onUpload: (f: File) => void; onClear: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="col-span-2">
      <label className="text-xs tracking-[0.3em] text-muted-foreground">{label}</label>
      <div className="flex items-center gap-3 border border-border p-2">
        {path ? <SignedImage path={path} className="w-16 h-16 object-cover grayscale" /> : <div className="w-16 h-16 bg-secondary flex items-center justify-center"><ImageIcon size={16} className="text-muted-foreground" /></div>}
        <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
        <button type="button" onClick={() => ref.current?.click()} className="text-xs tracking-[0.3em] hover:text-primary">UPLOAD</button>
        {path && <button type="button" onClick={onClear} className="text-xs tracking-[0.3em] text-muted-foreground hover:text-primary">CLEAR</button>}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ ORDERS
function OrdersAdmin() {
  const [orders, setOrders] = useState<any[]>([]);
  const [open, setOpen] = useState<any | null>(null);
  const [filter, setFilter] = useState<"all" | ProductionStatus>("all");

  async function load() {
    const res = await adminApi<any[]>("list_orders");
    if (res.error) { toast.error(res.error); return; }
    setOrders(res.data ?? []);
  }
  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.production_status === filter);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <h2 className="font-display text-4xl tracking-widest">ORDERS</h2>
        <button onClick={load} className="text-xs tracking-[0.3em] hover:text-primary flex items-center gap-1"><RefreshCw size={12} /> REFRESH</button>
      </div>
      <div className="flex flex-wrap gap-1 mb-4 text-xs tracking-[0.3em]">
        {(["all", ...PRODUCTION_STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s as any)}
            className={`px-3 py-1.5 border ${filter === s ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {s.replace("_", " ").toUpperCase()}
          </button>
        ))}
      </div>
      <div className="border border-border divide-y divide-border">
        {filtered.map((o) => (
          <button key={o.id} onClick={() => setOpen(o)} className="w-full text-left p-4 grid grid-cols-1 md:grid-cols-6 gap-2 text-sm tracking-widest hover:bg-secondary/50 transition-colors">
            <div className="font-display">{o.order_number}</div>
            <div>{o.customer_name}</div>
            <div className="text-muted-foreground truncate">{o.customer_email}</div>
            <div className="text-primary">{formatINR(o.total)}</div>
            <div className="text-xs uppercase">{o.kind ?? "standard"}</div>
            <div className="text-xs uppercase text-primary">{(o.production_status ?? "—").replace("_", " ")}</div>
          </button>
        ))}
        {filtered.length === 0 && <div className="p-6 text-muted-foreground tracking-widest">// NO ORDERS</div>}
      </div>

      {open && <OrderReview order={open} onClose={() => setOpen(null)} onChanged={(updated) => { setOpen(updated); load(); }} />}
    </div>
  );
}

function OrderReview({ order, onClose, onChanged }: { order: any; onClose: () => void; onChanged: (o: any) => void }) {
  const [notes, setNotes] = useState<string>(order.admin_notes ?? "");
  const [status, setStatus] = useState<string>(order.production_status ?? "pending_review");
  const [art, setArt] = useState<string | null>(null);
  const [mock, setMock] = useState<string | null>(null);

  useEffect(() => {
    if (!order.assets_deleted) {
      signedUrl(order.artwork_url).then(setArt);
      signedUrl(order.mockup_url).then(setMock);
    }
  }, [order.id]);

  async function save() {
    const res = await adminApi("update_order", {
      id: order.id,
      patch: { production_status: status, admin_notes: notes },
    });
    if (res.error) return toast.error(res.error);
    toast.success("UPDATED");
    onChanged(res.data);
  }

  function copyLink(url: string | null) {
    if (!url) return toast.error("NO LINK");
    navigator.clipboard.writeText(url);
    toast.success("COPIED");
  }

  const cfg = order.config_json ?? {};
  const addr = order.shipping_address ?? {};

  return (
    <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto p-4 md:p-10">
      <div className="max-w-6xl mx-auto bg-background border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <div className="text-[10px] tracking-[0.4em] text-primary">// ORDER REVIEW</div>
            <h3 className="font-display text-2xl tracking-widest">{order.order_number}</h3>
          </div>
          <button onClick={onClose} className="text-xs tracking-[0.3em] hover:text-primary">CLOSE ×</button>
        </div>

        <div className="grid md:grid-cols-2 border-b border-border">
          <div className="p-6 border-r border-border">
            <div className="text-[10px] tracking-[0.4em] text-muted-foreground mb-3">ORIGINAL ARTWORK</div>
            <div className="aspect-square bg-secondary flex items-center justify-center overflow-hidden">
              {order.assets_deleted ? <span className="text-muted-foreground tracking-widest">// CLEANED UP {order.assets_deleted_at ? new Date(order.assets_deleted_at).toLocaleDateString("en-IN") : ""}</span> : art ? <img src={art} alt="artwork" className="max-w-full max-h-full object-contain" /> : <span className="text-muted-foreground tracking-widest">// NO ARTWORK</span>}
            </div>
            <div className="flex gap-2 mt-3">
              {art && <a href={art} target="_blank" rel="noopener noreferrer" className="text-xs tracking-[0.3em] hover:text-primary flex items-center gap-1"><ExternalLink size={12} /> OPEN</a>}
              {art && <button onClick={() => copyLink(art)} className="text-xs tracking-[0.3em] hover:text-primary flex items-center gap-1"><Copy size={12} /> COPY LINK</button>}
            </div>
          </div>
          <div className="p-6">
            <div className="text-[10px] tracking-[0.4em] text-muted-foreground mb-3">GENERATED MOCKUP</div>
            <div className="aspect-square bg-secondary flex items-center justify-center overflow-hidden">
              {order.assets_deleted ? <span className="text-muted-foreground tracking-widest">// CLEANED UP</span> : mock ? <img src={mock} alt="mockup" className="max-w-full max-h-full object-contain" /> : <span className="text-muted-foreground tracking-widest">// NO MOCKUP</span>}
            </div>
            <div className="flex gap-2 mt-3">
              {mock && <a href={mock} target="_blank" rel="noopener noreferrer" className="text-xs tracking-[0.3em] hover:text-primary flex items-center gap-1"><ExternalLink size={12} /> OPEN</a>}
              {mock && <button onClick={() => copyLink(mock)} className="text-xs tracking-[0.3em] hover:text-primary flex items-center gap-1"><Copy size={12} /> COPY LINK</button>}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 p-6 border-b border-border text-sm">
          <div>
            <div className="text-[10px] tracking-[0.4em] text-primary mb-2">CUSTOMER</div>
            <div className="tracking-widest">{order.customer_name}</div>
            <div className="text-muted-foreground">{order.customer_email}</div>
            <div className="text-muted-foreground">{order.customer_phone ?? "—"}</div>
            <div className="text-muted-foreground mt-2">{addr.line1}<br />{addr.city}, {addr.state} — {addr.pincode}</div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.4em] text-primary mb-2">DETAILS</div>
            <div>Product: {cfg.product ?? "—"}</div>
            <div>Color: {cfg.colorName ?? cfg.color ?? "—"}</div>
            <div>Size: {cfg.size ?? "—"}</div>
            <div className="text-muted-foreground mt-2">Total: <span className="text-primary">{formatINR(order.total)}</span></div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.4em] text-primary mb-2">CONFIGURATION</div>
            <div>Scale: {cfg.scale ?? "—"}</div>
            <div>Rotation: {cfg.rotation ?? "—"}°</div>
            <div>Position: X {cfg.x ?? "—"} / Y {cfg.y ?? "—"}</div>
          </div>
        </div>

        <div className="p-6 grid md:grid-cols-[1fr_240px] gap-6">
          <div>
            <div className="text-[10px] tracking-[0.4em] text-muted-foreground mb-2">ADMIN NOTES</div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
              className="w-full bg-transparent border border-border px-3 py-2 tracking-widest focus:outline-none focus:border-primary" />
          </div>
          <div>
            <div className="text-[10px] tracking-[0.4em] text-muted-foreground mb-2">PRODUCTION STATUS</div>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-background border border-border px-3 py-2 tracking-widest focus:outline-none focus:border-primary">
              {PRODUCTION_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ").toUpperCase()}</option>)}
            </select>
            <button onClick={save} className="mt-3 w-full bg-primary text-primary-foreground py-3 font-display tracking-[0.25em] hover:bg-foreground hover:text-background">SAVE</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ MEDIA
function MediaAdmin() {
  const [folder, setFolder] = useState("library");
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  async function load() {
    try { setItems(await listMedia(folder)); } catch (e: any) { toast.error(e.message); }
  }
  useEffect(() => { load(); }, [folder]);

  async function onUpload(file: File) {
    try { await uploadToMedia(file, folder, file.name); toast.success("UPLOADED"); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  async function copy(item: any) {
    const url = await signedUrl(`${folder}/${item.name}`);
    if (!url) return toast.error("FAILED");
    navigator.clipboard.writeText(url);
    toast.success("LINK COPIED");
  }

  async function del(item: any) {
    if (!confirm("Delete this asset?")) return;
    const res = await adminApi("delete_media", { path: `${folder}/${item.name}` });
    if (res.error) toast.error(res.error);
    else { toast.success("DELETED"); load(); }
  }

  const visible = items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()));
  const folders = ["library", "drops/cover_image", "drops/size_chart_url", "configurator/artwork", "configurator/mockup", "hero", "configurator"];

  return (
    <div>
      <h2 className="font-display text-4xl tracking-widest mb-8">MEDIA LIBRARY</h2>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select value={folder} onChange={(e) => setFolder(e.target.value)} className="bg-background border border-border px-3 py-2 tracking-widest text-xs">
          {folders.map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="SEARCH..." className="bg-transparent border border-border px-3 py-2 tracking-widest text-xs focus:outline-none focus:border-primary" />
        <input ref={ref} type="file" accept="image/*,application/pdf" hidden onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
        <button onClick={() => ref.current?.click()} className="border border-foreground px-4 py-2 font-display tracking-[0.25em] text-xs hover:bg-primary hover:border-primary hover:text-primary-foreground flex items-center gap-2">
          <Upload size={14} /> UPLOAD
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {visible.filter((i) => !i.id || i.id !== null).map((item) => (
          <div key={item.name} className="border border-border bg-secondary/30 group">
            <div className="aspect-square overflow-hidden">
              <SignedImage path={`${folder}/${item.name}`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
            </div>
            <div className="p-2">
              <div className="text-[10px] tracking-widest truncate" title={item.name}>{item.name}</div>
              <div className="text-[9px] tracking-widest text-muted-foreground">{item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}</div>
              <div className="flex gap-1 mt-1">
                <button onClick={() => copy(item)} title="Copy link" className="text-[9px] tracking-widest hover:text-primary"><Copy size={10} /></button>
                <button onClick={() => del(item)} title="Delete" className="text-[9px] tracking-widest text-muted-foreground hover:text-primary ml-auto"><Trash2 size={10} /></button>
              </div>
            </div>
          </div>
        ))}
        {visible.length === 0 && <div className="col-span-full text-muted-foreground tracking-widest p-6">// NO ASSETS IN FOLDER</div>}
      </div>
      <p className="text-[10px] tracking-[0.3em] text-muted-foreground mt-6">// BUCKET: {MEDIA_BUCKET} · LINKS ARE SIGNED · 7-DAY EXPIRY ON COPY</p>
    </div>
  );
}

// ------------------------------------------------------------------ CONFIGURATOR
function ConfiguratorAdmin() {
  const [cfg, setCfg] = useState<any>(null);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("site_config").select("configurator_colors, configurator_sizes, configurator_size_chart_url").eq("id", 1).maybeSingle()
      .then(({ data }) => setCfg(data ?? { configurator_colors: [], configurator_sizes: ["S","M","L","XL","XXL"], configurator_size_chart_url: null }));
  }, []);

  if (!cfg) return <div className="text-muted-foreground tracking-widest">// LOADING...</div>;

  const colors: any[] = cfg.configurator_colors ?? [];
  const sizes: string[] = cfg.configurator_sizes ?? [];

  function setColors(next: any[]) { setCfg({ ...cfg, configurator_colors: next }); }

  async function save() {
    const res = await adminApi("update_site_config", { patch: {
      configurator_colors: cfg.configurator_colors,
      configurator_sizes: cfg.configurator_sizes,
      configurator_size_chart_url: cfg.configurator_size_chart_url,
    }});
    if (res.error) toast.error(res.error); else toast.success("CONFIGURATOR UPDATED");
  }

  async function uploadChart(file: File) {
    const path = await uploadToMedia(file, "configurator", file.name);
    setCfg({ ...cfg, configurator_size_chart_url: path });
    toast.success("UPLOADED");
  }

  return (
    <div>
      <h2 className="font-display text-4xl tracking-widest mb-8">CONFIGURATOR</h2>

      <div className="space-y-8 max-w-3xl">
        <div>
          <div className="text-[10px] tracking-[0.5em] text-primary mb-3 border-b border-border pb-2">AVAILABLE COLORS</div>
          <div className="space-y-2">
            {colors.map((c, i) => (
              <div key={i} className="grid grid-cols-[60px_1fr_1fr_1fr_40px] gap-2 items-center">
                <input type="color" value={c.hex ?? "#000000"} onChange={(e) => { const n = [...colors]; n[i] = { ...n[i], hex: e.target.value }; setColors(n); }} className="w-full h-10 bg-transparent border border-border" />
                <input placeholder="id" value={c.id ?? ""} onChange={(e) => { const n = [...colors]; n[i] = { ...n[i], id: e.target.value }; setColors(n); }} className="bg-transparent border border-border px-2 py-2 tracking-widest text-xs" />
                <input placeholder="name" value={c.name ?? ""} onChange={(e) => { const n = [...colors]; n[i] = { ...n[i], name: e.target.value }; setColors(n); }} className="bg-transparent border border-border px-2 py-2 tracking-widest text-xs" />
                <input placeholder="fabric" value={c.fabric ?? ""} onChange={(e) => { const n = [...colors]; n[i] = { ...n[i], fabric: e.target.value }; setColors(n); }} className="bg-transparent border border-border px-2 py-2 tracking-widest text-xs" />
                <button onClick={() => setColors(colors.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-primary"><Trash2 size={14} /></button>
              </div>
            ))}
            <button onClick={() => setColors([...colors, { id: "new", name: "NEW COLOR", hex: "#000000", fabric: "#111111" }])} className="text-xs tracking-[0.3em] hover:text-primary">+ ADD COLOR</button>
            {colors.length === 0 && <div className="text-xs text-muted-foreground tracking-widest">// USING DEFAULT 5 COLORS — ADD HERE TO OVERRIDE</div>}
          </div>
        </div>

        <div>
          <div className="text-[10px] tracking-[0.5em] text-primary mb-3 border-b border-border pb-2">AVAILABLE SIZES</div>
          <input value={sizes.join(",")} onChange={(e) => setCfg({ ...cfg, configurator_sizes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            className="w-full bg-transparent border border-border px-3 py-2 tracking-widest focus:outline-none focus:border-primary" />
        </div>

        <div>
          <div className="text-[10px] tracking-[0.5em] text-primary mb-3 border-b border-border pb-2">MASTER SIZE CHART</div>
          <div className="flex items-center gap-4">
            {cfg.configurator_size_chart_url
              ? <SignedImage path={cfg.configurator_size_chart_url} className="w-32 h-32 object-cover grayscale" />
              : <div className="w-32 h-32 bg-secondary flex items-center justify-center"><ImageIcon size={20} className="text-muted-foreground" /></div>}
            <div className="space-y-2">
              <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadChart(e.target.files[0])} />
              <button onClick={() => ref.current?.click()} className="border border-foreground px-3 py-1.5 text-xs tracking-[0.3em] hover:bg-primary hover:border-primary hover:text-primary-foreground">UPLOAD CHART</button>
              {cfg.configurator_size_chart_url && <button onClick={() => setCfg({ ...cfg, configurator_size_chart_url: null })} className="block text-xs tracking-[0.3em] text-muted-foreground hover:text-primary">CLEAR</button>}
            </div>
          </div>
        </div>

        <button onClick={save} className="bg-primary text-primary-foreground px-8 py-3 font-display tracking-[0.25em] hover:bg-foreground hover:text-background">SAVE CONFIGURATOR</button>
      </div>

      <ConfiguratorAssetsAdmin />
    </div>
  );
}

// --------------------------------------------- CONFIGURATOR ASSETS (garment previews)
type GarmentAsset = {
  id?: string;
  garment_name: string;
  garment_color: string;
  color_hex: string | null;
  front_preview_url: string | null;
  back_preview_url: string | null;
  active_status: boolean;
  sort_order: number;
  print_area_x: number;
  print_area_y: number;
  print_area_width: number;
  print_area_height: number;
  base_price: number;
  artwork_fee: number;
  total_display_price?: number; // generated column, read-only
};

function ConfiguratorAssetsAdmin() {
  const [assets, setAssets] = useState<GarmentAsset[]>([]);
  const [editing, setEditing] = useState<GarmentAsset | null>(null);

  async function load() {
    const res = await adminApi<GarmentAsset[]>("list_configurator_assets");
    if (res.error) return toast.error(res.error);
    setAssets(res.data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    if (!editing.garment_name || !editing.garment_color) return toast.error("NAME + COLOR REQUIRED");
    // Final safety net: every integer column on this table gets explicitly
    // rounded right before sending, regardless of which UI interaction
    // (drag, resize, or typing) produced the value. This is what actually
    // fixed "Edge Function returned a non-2xx status code" on Save — the
    // print-area drag handler produces fractional percentages, and this
    // table's columns are `integer`, so a fractional value sent through
    // the generic update/insert in admin-api gets rejected by Postgres.
    const payload: GarmentAsset = {
      ...editing,
      sort_order: Math.round(editing.sort_order),
      print_area_x: Math.round(editing.print_area_x),
      print_area_y: Math.round(editing.print_area_y),
      print_area_width: Math.round(editing.print_area_width),
      print_area_height: Math.round(editing.print_area_height),
      base_price: Math.round(editing.base_price),
      artwork_fee: Math.round(editing.artwork_fee),
    };
    // Calls the upsert_garment_asset() Postgres function directly via RPC —
    // not through admin-api. This is what actually fixed "Edge Function
    // returned a non-2xx status code" on Save: the print-area drag handler
    // produces fractional percentages, and this table's columns are
    // `integer`. The RPC function explicitly rounds/casts every numeric
    // field server-side, so this is correct regardless of what the
    // frontend sends — and like the cleanup fix, it works without any
    // Edge Function deployment, which is currently blocked.
    const { data, error } = await supabase.rpc("upsert_garment_asset", {
      code: getAdminCode(),
      asset: payload,
    });
    if (error) return toast.error(error.message);
    if ((data as any)?.error) return toast.error((data as any).error);
    toast.success("ASSET SAVED");
    setEditing(null);
    load();
  }

  async function del(id?: string) {
    if (!id || !confirm("Delete this asset?")) return;
    const res = await adminApi("delete_configurator_asset", { id });
    if (res.error) return toast.error(res.error);
    toast.success("DELETED");
    load();
  }

  async function uploadField(field: "front_preview_url" | "back_preview_url", file: File) {
    const path = await uploadToMedia(file, `configurator/garments/${field}`, file.name);
    setEditing((e) => e ? { ...e, [field]: path } : e);
    toast.success("UPLOADED");
  }

  return (
    <div className="mt-16 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="text-[10px] tracking-[0.5em] text-primary border-b border-border pb-2 flex-1">GARMENT PREVIEW ASSETS</div>
        <button
          onClick={() => setEditing({ garment_name: "TEE", garment_color: "", color_hex: "#000000", front_preview_url: null, back_preview_url: null, active_status: true, sort_order: assets.length, print_area_x: 30, print_area_y: 26, print_area_width: 40, print_area_height: 42, base_price: 249900, artwork_fee: 60000 })}
          className="ml-4 border border-foreground px-3 py-1.5 text-xs tracking-[0.3em] hover:bg-primary hover:border-primary hover:text-primary-foreground"
        >
          + NEW ASSET
        </button>
      </div>

      <div className="border border-border divide-y divide-border">
        {assets.map((a) => (
          <div key={a.id} className="flex items-center gap-4 p-3">
            <SignedImage
              path={a.front_preview_url}
              debugLabel={`AdminAsset:${a.id}:front`}
              className="w-14 h-16 object-cover bg-secondary"
              fallback={<div className="w-14 h-16 bg-secondary flex items-center justify-center"><ImageIcon size={14} className="text-muted-foreground" /></div>}
            />
            <div className="flex-1 min-w-0">
              <div className="font-display tracking-widest text-sm">{a.garment_name} · {a.garment_color}</div>
              <div className="text-[10px] tracking-[0.3em] text-muted-foreground">
                {a.active_status ? "● ACTIVE" : "○ INACTIVE"} · ORDER {a.sort_order} · ₹{(a.base_price / 100).toLocaleString("en-IN")}
              </div>
            </div>
            {a.color_hex && <div className="w-6 h-6 border border-border" style={{ background: a.color_hex }} />}
            <button onClick={() => setEditing(a)} className="text-xs tracking-[0.3em] hover:text-primary">EDIT</button>
            <button onClick={() => del(a.id)} className="text-xs tracking-[0.3em] text-muted-foreground hover:text-primary">DELETE</button>
          </div>
        ))}
        {assets.length === 0 && <div className="p-6 text-xs text-muted-foreground tracking-widest">// NO GARMENT ASSETS — ADD ONE TO REPLACE THE DEFAULT SVG PREVIEW</div>}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border border-border w-full max-w-2xl p-6 my-8">
            <h3 className="font-display text-2xl mb-6 tracking-widest">{editing.id ? "EDIT ASSET" : "NEW ASSET"}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs tracking-[0.3em] text-muted-foreground">GARMENT NAME</label>
                <input value={editing.garment_name} onChange={(e) => setEditing({ ...editing, garment_name: e.target.value })} className="w-full bg-transparent border border-border px-3 py-2 tracking-widest focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs tracking-[0.3em] text-muted-foreground">GARMENT COLOR (id)</label>
                <input value={editing.garment_color} onChange={(e) => setEditing({ ...editing, garment_color: e.target.value })} className="w-full bg-transparent border border-border px-3 py-2 tracking-widest focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs tracking-[0.3em] text-muted-foreground">COLOR HEX</label>
                <input type="color" value={editing.color_hex ?? "#000000"} onChange={(e) => setEditing({ ...editing, color_hex: e.target.value })} className="w-full h-10 bg-transparent border border-border" />
              </div>
              <div>
                <label className="text-xs tracking-[0.3em] text-muted-foreground">SORT ORDER</label>
                <input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Math.round(Number(e.target.value)) })} className="w-full bg-transparent border border-border px-3 py-2 tracking-widest focus:outline-none focus:border-primary" />
              </div>
              <FileField label="FRONT PREVIEW" path={editing.front_preview_url} onUpload={(f) => uploadField("front_preview_url", f)} onClear={() => setEditing({ ...editing, front_preview_url: null })} />
              <FileField label="BACK PREVIEW" path={editing.back_preview_url} onUpload={(f) => uploadField("back_preview_url", f)} onClear={() => setEditing({ ...editing, back_preview_url: null })} />
              <PrintAreaEditor
                imagePath={editing.front_preview_url}
                value={{
                  print_area_x: editing.print_area_x,
                  print_area_y: editing.print_area_y,
                  print_area_width: editing.print_area_width,
                  print_area_height: editing.print_area_height,
                }}
                onChange={(next) => setEditing({ ...editing, ...next })}
              />
              <div className="col-span-2">
                <div className="text-[10px] tracking-[0.5em] text-primary mb-2 border-b border-border pb-2">PRICING</div>
              </div>
              <div>
                <label className="text-xs tracking-[0.3em] text-muted-foreground">BASE PRICE (PAISE)</label>
                <input
                  type="number"
                  min={0}
                  value={editing.base_price}
                  onChange={(e) => setEditing({ ...editing, base_price: Math.round(Number(e.target.value)) })}
                  className="w-full bg-transparent border border-border px-3 py-2 tracking-widest focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs tracking-[0.3em] text-muted-foreground">ARTWORK FEE (PAISE)</label>
                <input
                  type="number"
                  min={0}
                  value={editing.artwork_fee}
                  onChange={(e) => setEditing({ ...editing, artwork_fee: Math.round(Number(e.target.value)) })}
                  className="w-full bg-transparent border border-border px-3 py-2 tracking-widest focus:outline-none focus:border-primary"
                />
              </div>
              <div className="col-span-2 text-xs tracking-[0.2em] text-muted-foreground bg-secondary/50 border border-border px-3 py-2">
                PREVIEW — without artwork: <span className="text-foreground font-display">₹{((editing.base_price ?? 0) / 100).toLocaleString("en-IN")}</span>
                {"  ·  "}with artwork: <span className="text-foreground font-display">₹{(((editing.base_price ?? 0) + (editing.artwork_fee ?? 0)) / 100).toLocaleString("en-IN")}</span>
              </div>
              <label className="col-span-2 flex items-center gap-2 text-xs tracking-[0.3em]">
                <input type="checkbox" checked={editing.active_status} onChange={(e) => setEditing({ ...editing, active_status: e.target.checked })} />
                ACTIVE
              </label>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={save} className="flex-1 bg-primary text-primary-foreground py-3 font-display tracking-[0.25em] hover:bg-foreground hover:text-background">SAVE</button>
              <button onClick={() => setEditing(null)} className="px-6 border border-border tracking-[0.3em] text-xs hover:border-foreground">CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ SITE CONFIG
function ConfigAdmin() {
  const [cfg, setCfg] = useState<any>(null);
  useEffect(() => {
    supabase.from("site_config").select("*").eq("id", 1).maybeSingle().then(({ data }) => setCfg(data));
  }, []);
  async function save() {
    if (!cfg) return;
    const { id, updated_at, ...rest } = cfg;
    const res = await adminApi("update_site_config", { patch: rest });
    if (res.error) toast.error(res.error); else toast.success("SITE UPDATED");
  }
  if (!cfg) return <div className="text-muted-foreground tracking-widest">// LOADING...</div>;
  const fields: [string, string, string?][] = [
    ["hero_headline", "HERO HEADLINE"],
    ["hero_subtext", "HERO SUBTEXT", "textarea"],
    ["hero_cta_label", "HERO CTA LABEL"],
    ["hero_cta_href", "HERO CTA HREF"],
    ["next_drop_date", "NEXT DROP DATE (ISO)"],
    ["manifesto", "MANIFESTO", "textarea"],
    ["accent_color", "ACCENT COLOR (#hex)"],
    ["background_color", "BACKGROUND COLOR (#hex)"],
    ["instagram_url", "INSTAGRAM URL"],
    ["behold_widget_id", "INSTAGRAM FEED (BEHOLD WIDGET ID)"],
    ["whatsapp_number", "WHATSAPP NUMBER"],
    ["support_email", "SUPPORT EMAIL"],
  ];
  return (
    <div>
      <h2 className="font-display text-4xl tracking-widest mb-8">SITE CONFIG</h2>
      <div className="space-y-4 max-w-2xl">
        <label className="flex items-center gap-2 text-xs tracking-[0.3em] text-muted-foreground">
          <input type="checkbox" checked={!!cfg.hero_visible} onChange={(e) => setCfg({ ...cfg, hero_visible: e.target.checked })} />
          HERO VISIBLE
        </label>
        <HeroVideoUploader
          current={{
            hero_video_url: cfg.hero_video_url,
            hero_video_filename: cfg.hero_video_filename,
            hero_video_size: cfg.hero_video_size,
            hero_video_updated_at: cfg.hero_video_updated_at,
          }}
          onPublished={(next) => setCfg({ ...cfg, ...next })}
        />
        {fields.map(([k, l, t]) => (
          <div key={k}>
            <label className="text-xs tracking-[0.3em] text-muted-foreground">{l}</label>
            {t === "textarea" ? (
              <textarea value={cfg[k] ?? ""} onChange={(e) => setCfg({ ...cfg, [k]: e.target.value })}
                rows={4} className="w-full bg-transparent border border-border px-3 py-2 tracking-widest focus:outline-none focus:border-primary" />
            ) : (
              <input value={cfg[k] ?? ""} onChange={(e) => setCfg({ ...cfg, [k]: e.target.value })}
                className="w-full bg-transparent border border-border px-3 py-2 tracking-widest focus:outline-none focus:border-primary" />
            )}
          </div>
        ))}
        <button onClick={save} className="bg-primary text-primary-foreground px-8 py-3 font-display tracking-[0.25em] hover:bg-foreground hover:text-background">SAVE CONFIG</button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ SETTINGS
function SettingsAdmin({ onSignOut }: { onSignOut: () => void }) {
  const [productionEmail, setProductionEmail] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [accent, setAccent] = useState("#e31313");
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(true);
  const [shippingMessage, setShippingMessage] = useState("FREE SHIPPING PAN-INDIA");
  const [autoCleanupEnabled, setAutoCleanupEnabled] = useState(true);
  const [cleanupDelayDays, setCleanupDelayDays] = useState(30);
  const [runningCleanup, setRunningCleanup] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  useEffect(() => {
    supabase.from("site_config")
      .select("production_email, support_email, whatsapp_number, instagram_url, accent_color, free_shipping_enabled, shipping_message, auto_cleanup_enabled, cleanup_delay_days")
      .eq("id", 1).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setProductionEmail((data as any).production_email ?? "");
        setSupportEmail((data as any).support_email ?? "");
        setWhatsapp((data as any).whatsapp_number ?? "");
        setInstagram((data as any).instagram_url ?? "");
        setAccent((data as any).accent_color ?? "#e31313");
        setFreeShippingEnabled((data as any).free_shipping_enabled ?? true);
        setShippingMessage((data as any).shipping_message ?? "FREE SHIPPING PAN-INDIA");
        setAutoCleanupEnabled((data as any).auto_cleanup_enabled ?? true);
        setCleanupDelayDays((data as any).cleanup_delay_days ?? 30);
      });
  }, []);

  async function saveOps() {
    const res = await adminApi("update_site_config", { patch: {
      production_email: productionEmail,
      support_email: supportEmail,
      whatsapp_number: whatsapp,
      instagram_url: instagram,
      accent_color: accent,
    }});
    if (res.error) toast.error(res.error); else toast.success("SETTINGS UPDATED");
  }

  async function saveShipping() {
    const res = await adminApi("update_site_config", { patch: {
      free_shipping_enabled: freeShippingEnabled,
      shipping_message: shippingMessage,
    }});
    if (res.error) toast.error(res.error); else toast.success("SHIPPING SETTINGS UPDATED");
  }

  async function saveCleanup() {
    const res = await adminApi("update_site_config", { patch: {
      auto_cleanup_enabled: autoCleanupEnabled,
      cleanup_delay_days: cleanupDelayDays,
    }});
    if (res.error) toast.error(res.error); else toast.success("CLEANUP SETTINGS UPDATED");
  }

  async function runCleanupNow() {
    setRunningCleanup(true);
    try {
      // Calls the run_order_cleanup() Postgres function directly via RPC —
      // not through admin-api. The cleanup logic lives in the database
      // itself (see migration), so this works without any Edge Function
      // deployment, which is currently blocked by the Lovable credit limit.
      const { data, error } = await supabase.rpc("run_order_cleanup", { force: true });
      if (error) return toast.error(error.message);
      const n = data?.processed ?? 0;
      toast.success(n > 0 ? `CLEANED UP ASSETS FOR ${n} ORDER(S)` : "NO ORDERS WERE DUE FOR CLEANUP");
    } catch (e: any) {
      toast.error(e?.message ?? "CLEANUP FAILED");
    } finally {
      setRunningCleanup(false);
    }
  }

  async function changePassword() {
    if (newPw.length < 6) return toast.error("PASSWORD TOO SHORT");
    if (newPw !== confirmPw) return toast.error("PASSWORDS DO NOT MATCH");
    // Verify the current code is valid by attempting rotation with it (the edge function
    // gates on the provided code matching the stored hash).
    const res = await adminApi("rotate_code", { new_code: newPw }, oldPw);
    if (res.error) return toast.error(res.error === "unauthorized" ? "CURRENT PASSWORD INCORRECT" : res.error);
    // refresh stored code so subsequent calls authenticate
    setAdminCode(newPw);
    toast.success("ACCESS CODE ROTATED");
    setOldPw(""); setNewPw(""); setConfirmPw("");
  }

  return (
    <div className="space-y-12 max-w-2xl">
      <div>
        <h2 className="font-display text-4xl tracking-widest mb-6">OPERATIONAL SETTINGS</h2>
        <div className="space-y-4">
          <Field label="PRODUCTION EMAIL (RECEIVES ORDERS)" value={productionEmail} onChange={setProductionEmail} />
          <Field label="SUPPORT EMAIL" value={supportEmail} onChange={setSupportEmail} />
          <Field label="WHATSAPP NUMBER" value={whatsapp} onChange={setWhatsapp} />
          <Field label="INSTAGRAM URL" value={instagram} onChange={setInstagram} />
          <div>
            <label className="text-xs tracking-[0.3em] text-muted-foreground">ACCENT COLOR</label>
            <div className="flex gap-2">
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-12 w-20 bg-transparent border border-border" />
              <input value={accent} onChange={(e) => setAccent(e.target.value)} className="flex-1 bg-transparent border border-border px-3 py-2 tracking-widest focus:outline-none focus:border-primary" />
            </div>
          </div>
          <button onClick={saveOps} className="bg-primary text-primary-foreground px-8 py-3 font-display tracking-[0.25em] hover:bg-foreground hover:text-background">SAVE SETTINGS</button>
        </div>
      </div>

      <div>
        <h3 className="font-display text-2xl tracking-widest mb-6">SHIPPING</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-xs tracking-[0.3em] text-muted-foreground">
            <input type="checkbox" checked={freeShippingEnabled} onChange={(e) => setFreeShippingEnabled(e.target.checked)} />
            FREE SHIPPING ENABLED
          </label>
          <Field label="SHIPPING MESSAGE (shown when free shipping is enabled)" value={shippingMessage} onChange={setShippingMessage} />
          <button onClick={saveShipping} className="bg-primary text-primary-foreground px-8 py-3 font-display tracking-[0.25em] hover:bg-foreground hover:text-background">SAVE SHIPPING</button>
        </div>
      </div>

      <div>
        <h3 className="font-display text-2xl tracking-widest mb-6">STORAGE CLEANUP</h3>
        <p className="text-xs tracking-[0.2em] text-muted-foreground mb-4">
          // WHEN AN ORDER REACHES "SHIPPED", ITS UPLOADED ARTWORK AND GENERATED MOCKUP ARE QUEUED FOR DELETION AFTER THE DELAY BELOW. THE ORDER RECORD, CUSTOMER INFO, AND CONFIGURATION DATA ARE NEVER DELETED — ONLY THE STORAGE FILES.
        </p>
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-xs tracking-[0.3em] text-muted-foreground">
            <input type="checkbox" checked={autoCleanupEnabled} onChange={(e) => setAutoCleanupEnabled(e.target.checked)} />
            AUTO CLEANUP ENABLED
          </label>
          <div>
            <label className="text-xs tracking-[0.3em] text-muted-foreground">CLEANUP DELAY (DAYS)</label>
            <input
              type="number"
              min={1}
              value={cleanupDelayDays}
              onChange={(e) => setCleanupDelayDays(Number(e.target.value))}
              className="w-full bg-transparent border border-border px-3 py-2 tracking-widest focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={saveCleanup} className="bg-primary text-primary-foreground px-8 py-3 font-display tracking-[0.25em] hover:bg-foreground hover:text-background">SAVE CLEANUP SETTINGS</button>
            <button
              onClick={runCleanupNow}
              disabled={runningCleanup}
              className="border border-foreground px-6 py-3 text-xs font-display tracking-[0.25em] hover:bg-primary hover:border-primary hover:text-primary-foreground disabled:opacity-50"
            >
              {runningCleanup ? "RUNNING..." : "RUN CLEANUP NOW"}
            </button>
          </div>
          <p className="text-[10px] tracking-[0.3em] text-muted-foreground/60">
            // "RUN CLEANUP NOW" PROCESSES ANY ORDER ALREADY DUE, REGARDLESS OF THE AUTO CLEANUP TOGGLE ABOVE — IT'S A MANUAL OVERRIDE, NOT GATED BY IT.
          </p>
        </div>
      </div>

      <div>
        <h3 className="font-display text-2xl tracking-widest mb-6">CHANGE ACCESS CODE</h3>
        <div className="space-y-3 max-w-sm">
          <input type="password" placeholder="CURRENT CODE" value={oldPw} onChange={(e) => setOldPw(e.target.value)} className="w-full bg-transparent border border-border px-3 py-2 tracking-widest focus:outline-none focus:border-primary" />
          <input type="password" placeholder="NEW CODE" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="w-full bg-transparent border border-border px-3 py-2 tracking-widest focus:outline-none focus:border-primary" />
          <input type="password" placeholder="CONFIRM NEW CODE" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="w-full bg-transparent border border-border px-3 py-2 tracking-widest focus:outline-none focus:border-primary" />
          <button onClick={changePassword} className="w-full bg-primary text-primary-foreground py-3 font-display tracking-[0.25em] hover:bg-foreground hover:text-background">ROTATE CODE</button>
        </div>
      </div>

      <div>
        <button onClick={onSignOut} className="text-xs tracking-[0.3em] text-muted-foreground hover:text-primary">SIGN OUT →</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs tracking-[0.3em] text-muted-foreground">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent border border-border px-3 py-2 tracking-widest focus:outline-none focus:border-primary" />
    </div>
  );
}

// ------------------------------------------------------------------ SIGNUPS
function SignupsAdmin() {
  const [signups, setSignups] = useState<any[]>([]);
  useEffect(() => {
    adminApi<any[]>("list_signups").then((res) => {
      if (res.error) toast.error(res.error); else setSignups(res.data ?? []);
    });
  }, []);
  return (
    <div>
      <h2 className="font-display text-4xl tracking-widest mb-8">SIGNUPS</h2>
      <div className="border border-border divide-y divide-border">
        {signups.map((s) => (
          <div key={s.id} className="p-4 flex justify-between text-sm tracking-widest">
            <span>{s.email}</span>
            <span className="text-muted-foreground text-xs">{new Date(s.created_at).toLocaleString()}</span>
          </div>
        ))}
        {signups.length === 0 && <div className="p-6 text-muted-foreground tracking-widest">// NO SIGNUPS YET</div>}
      </div>
    </div>
  );
}
