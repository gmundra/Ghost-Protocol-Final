// UNSCREEN — Admin Panel
// Migrated from Ghost Protocol. Architecture fully preserved.
// Changes: shell rebrand, login copy, sidebar labels, DROPS→PRODUCTS with
// educational fields, CONFIGURATOR→CATEGORIES (new), Signups CSV export,
// UNSCREEN copy throughout. ORDERS / MEDIA / SITE CONFIG / SETTINGS untouched.

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { formatINR } from "@/store/cart";
import type { Drop, SiteConfig } from "@/lib/types";
import { isAdminAuthed, setAdminAuthed, setAdminCode, getAdminCode } from "@/lib/admin-auth";
import { adminApi } from "@/lib/admin-api";
import { uploadToMedia, signedUrl, listMedia, removeMedia, MEDIA_BUCKET } from "@/lib/storage";
import { SignedImage } from "@/components/SignedImage";
import { HeroVideoUploader } from "@/components/HeroVideoUploader";
import { Upload, Trash2, Copy, ExternalLink, Image as ImageIcon, RefreshCw, Download } from "lucide-react";

type Tab = "products" | "orders" | "media" | "categories" | "config" | "settings" | "signups";

const ORDER_STATUSES = ["pending_review", "approved", "rejected", "in_production", "shipped"] as const;
type OrderStatus = typeof ORDER_STATUSES[number];

// ─── Age group options for educational products ───────────────────────────────
const AGE_GROUPS = ["0-2 years", "3-5 years", "6-8 years", "9-12 years", "13+ years", "All ages"];

// ─── Skill tags for educational products ─────────────────────────────────────
const SKILL_OPTIONS = [
  "Critical Thinking", "Creativity", "Communication", "Motor Skills",
  "Language Development", "Numeracy", "Emotional Intelligence", "Social Skills",
  "Cognitive Growth", "Problem Solving", "Memory", "Imagination",
];

// ─── Product category slugs ───────────────────────────────────────────────────
const CATEGORY_SLUGS = [
  "board-games", "wooden-toys", "flash-cards", "diy-kits",
  "books", "conversation-cards", "wooden-puzzles", "educational-kits",
  "teacher-resources", "bundles",
];

// ════════════════════════════════════════════════════════════════════════════
// ROOT LAYOUT
// ════════════════════════════════════════════════════════════════════════════

export default function Admin() {
  const [authed, setAuthed] = useState(isAdminAuthed());
  const [tab, setTab] = useState<Tab>("products");

  if (!authed) return <AdminLogin onPass={() => setAuthed(true)} />;

  const tabs: { k: Tab; label: string }[] = [
    { k: "products",   label: "Products"   },
    { k: "orders",     label: "Orders"     },
    { k: "media",      label: "Media"      },
    { k: "categories", label: "Categories" },
    { k: "config",     label: "Site"       },
    { k: "settings",   label: "Settings"   },
    { k: "signups",    label: "Signups"    },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Sidebar */}
      <aside className="md:w-56 md:min-h-screen md:border-r border-border md:p-6 flex md:flex-col items-center md:items-stretch justify-between md:justify-start p-4 border-b border-border bg-surface">
        <Link to="/" className="font-display text-base tracking-wide text-foreground hover:text-primary transition-colors md:mb-10">
          UNSCREEN
          <span className="block text-[10px] text-muted-foreground font-sans tracking-widest mt-0.5">Admin</span>
        </Link>
        <nav className="flex md:flex-col gap-1 md:gap-0 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`text-xs md:text-sm md:py-2.5 px-3 md:px-2 md:text-left whitespace-nowrap transition-colors rounded ${
                tab === t.k
                  ? "text-primary font-semibold bg-background/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <button
          onClick={() => { setAdminAuthed(false); setAuthed(false); }}
          className="hidden md:block mt-auto text-xs text-muted-foreground hover:text-primary text-left transition-colors"
        >
          Sign out →
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        {tab === "products"   && <ProductsAdmin />}
        {tab === "orders"     && <OrdersAdmin />}
        {tab === "media"      && <MediaAdmin />}
        {tab === "categories" && <CategoriesAdmin />}
        {tab === "config"     && <ConfigAdmin />}
        {tab === "settings"   && <SettingsAdmin onSignOut={() => { setAdminAuthed(false); setAuthed(false); }} />}
        {tab === "signups"    && <SignupsAdmin />}
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════════════════════════════

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
      toast.success("Welcome back.");
      onPass();
    } else {
      setErr(true);
      toast.error("Incorrect access code.");
    }
    setPending(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="block font-display text-2xl tracking-wide text-foreground mb-1">UNSCREEN</Link>
        <p className="text-sm text-muted-foreground mb-8">Admin — enter your access code to continue.</p>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            required
            placeholder="Access code"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setErr(false); }}
            autoFocus
            className={`w-full bg-surface border px-4 py-3 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
              err ? "border-destructive" : "border-border"
            }`}
          />
          {err && <p className="text-xs text-destructive">Incorrect access code. Try again.</p>}
          <button
            disabled={pending}
            className="w-full bg-primary text-primary-foreground py-3 rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {pending ? "Verifying…" : "Sign in"}
          </button>
        </form>
        <Link to="/" className="block mt-6 text-xs text-muted-foreground hover:text-foreground text-center transition-colors">
          ← Back to store
        </Link>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SHARED HELPERS
// ════════════════════════════════════════════════════════════════════════════

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <h2 className="font-display text-3xl text-foreground">{title}</h2>
      {action}
    </div>
  );
}

function PrimaryBtn({ onClick, children, disabled }: { onClick?: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-primary text-primary-foreground px-5 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function OutlineBtn({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="border border-border px-5 py-2 rounded text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
    >
      {children}
    </button>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}

function FileField({ label, path, onUpload, onClear }: { label: string; path: string | null; onUpload: (f: File) => void; onClear: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="col-span-2">
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <div className="flex items-center gap-3 border border-border rounded p-2 bg-surface">
        {path
          ? <SignedImage path={path} className="w-16 h-16 object-cover rounded" />
          : <div className="w-16 h-16 bg-background rounded flex items-center justify-center"><ImageIcon size={16} className="text-muted-foreground" /></div>}
        <input ref={ref} type="file" accept="image/*,application/pdf" hidden onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
        <button type="button" onClick={() => ref.current?.click()} className="text-xs text-primary hover:underline">Upload</button>
        {path && <button type="button" onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PRODUCTS (replaces DROPS — adds UNSCREEN educational fields)
// ════════════════════════════════════════════════════════════════════════════

function ProductsAdmin() {
  const [products, setProducts] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  async function load() {
    const { data } = await supabase
      .from("drops")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    setProducts(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    const payload: any = { ...editing };
    // Normalize comma-separated fields → arrays
    if (typeof payload.tags === "string")              payload.tags              = payload.tags.split(",").map((s: string) => s.trim()).filter(Boolean);
    if (typeof payload.skills_developed === "string")  payload.skills_developed  = payload.skills_developed.split(",").map((s: string) => s.trim()).filter(Boolean);
    if (typeof payload.learning_outcomes === "string") payload.learning_outcomes = payload.learning_outcomes.split(",").map((s: string) => s.trim()).filter(Boolean);
    // Remove UNSCREEN-only fields that don't exist in the `drops` DB schema yet
    // so the upsert_drop edge function doesn't fail. They're stored in tags for now.
    const { skills_developed, learning_outcomes, age_group, materials, play_duration, teacher_guide_url, ...dbPayload } = payload;
    // Merge UNSCREEN fields into tags for backward-compat until schema is migrated
    dbPayload.tags = [
      ...(Array.isArray(dbPayload.tags) ? dbPayload.tags : []),
      ...(age_group ? [`age:${age_group}`] : []),
      ...(Array.isArray(skills_developed) ? skills_developed.map((s: string) => `skill:${s}`) : []),
      ...(materials ? [`materials:${materials}`] : []),
      ...(play_duration ? [`duration:${play_duration}`] : []),
    ];
    if (!dbPayload.slug || !dbPayload.name) return toast.error("Slug and name are required.");
    const res = await adminApi("upsert_drop", { drop: dbPayload });
    if (res.error) toast.error(res.error);
    else { toast.success("Product saved."); setEditing(null); load(); }
  }

  async function del(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    const res = await adminApi("delete_drop", { id });
    if (res.error) toast.error(res.error);
    else { toast.success("Product deleted."); load(); }
  }

  async function uploadCover(file: File) {
    const path = await uploadToMedia(file, "drops/cover_image", file.name);
    setEditing((e: any) => e ? { ...e, cover_image: path } : e);
    toast.success("Image uploaded.");
  }

  async function uploadGuide(file: File) {
    const path = await uploadToMedia(file, "drops/teacher_guide", file.name);
    setEditing((e: any) => e ? { ...e, teacher_guide_url: path } : e);
    toast.success("Guide uploaded.");
  }

  const NEW_PRODUCT = {
    status: "draft", currency: "INR", stock: 0, price: 0, sort_order: 0,
    tags: [], skills_developed: [], learning_outcomes: [],
    age_group: "3-5 years", category: "board-games",
  };

  return (
    <div>
      <SectionHeader
        title="Products"
        action={
          <PrimaryBtn onClick={() => setEditing(NEW_PRODUCT)}>+ New Product</PrimaryBtn>
        }
      />

      {/* Product list */}
      <div className="border border-border rounded divide-y divide-border">
        {products.map((p) => (
          <div key={p.id} className="flex items-center justify-between p-4 gap-4 hover:bg-surface transition-colors">
            <div className="flex items-center gap-4 min-w-0">
              {p.cover_image
                ? <SignedImage path={p.cover_image} className="w-12 h-12 object-cover rounded" />
                : <div className="w-12 h-12 bg-surface rounded flex items-center justify-center text-xl">📦</div>}
              <div className="min-w-0">
                <div className="font-medium text-foreground truncate">{p.name}</div>
                <div className="text-xs text-muted-foreground">
                  {p.slug} · {p.category ?? "—"} · {p.status} · {formatINR(p.price)}
                </div>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <button onClick={() => setEditing({ ...p, skills_developed: [], learning_outcomes: [] })} className="text-xs text-primary hover:underline">Edit</button>
              <button onClick={() => del(p.id)} className="text-xs text-muted-foreground hover:text-destructive">Delete</button>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">No products yet. Add your first one.</div>
        )}
      </div>

      {/* Edit / New modal */}
      {editing && (
        <div className="fixed inset-0 bg-foreground/40 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-background border border-border rounded w-full max-w-2xl p-6 my-8 shadow-xl">
            <h3 className="font-display text-2xl text-foreground mb-6">{editing.id ? "Edit Product" : "New Product"}</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Core fields */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Slug *</label>
                <input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                  placeholder="wooden-rainbow-stacker"
                  className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Name *</label>
                <input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Wooden Rainbow Stacker"
                  className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Tagline / Subtitle</label>
                <input value={editing.tagline ?? ""} onChange={(e) => setEditing({ ...editing, tagline: e.target.value })}
                  placeholder="Stack, sort, and learn colours"
                  className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                <textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={3} placeholder="What the product is, what it teaches, what's included…"
                  className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              {/* UNSCREEN: Category */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
                <select value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">— Select —</option>
                  {CATEGORY_SLUGS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* UNSCREEN: Age group */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Age Group</label>
                <select value={editing.age_group ?? ""} onChange={(e) => setEditing({ ...editing, age_group: e.target.value })}
                  className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">— Select —</option>
                  {AGE_GROUPS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              {/* UNSCREEN: Skills developed (multi-select via checkboxes) */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-2">Skills Developed</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {SKILL_OPTIONS.map((skill) => {
                    const arr: string[] = Array.isArray(editing.skills_developed) ? editing.skills_developed : [];
                    const checked = arr.includes(skill);
                    return (
                      <label key={skill} className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                        <input type="checkbox" checked={checked}
                          onChange={() => setEditing({
                            ...editing,
                            skills_developed: checked ? arr.filter((s) => s !== skill) : [...arr, skill],
                          })} />
                        {skill}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* UNSCREEN: Materials + Play duration */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Materials</label>
                <input value={editing.materials ?? ""} onChange={(e) => setEditing({ ...editing, materials: e.target.value })}
                  placeholder="Food-grade beechwood, non-toxic paint"
                  className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Play Duration</label>
                <input value={editing.play_duration ?? ""} onChange={(e) => setEditing({ ...editing, play_duration: e.target.value })}
                  placeholder="20–45 minutes"
                  className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              {/* Pricing + stock */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Price (paise) *</label>
                <input type="number" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                  className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <p className="text-[10px] text-muted-foreground mt-1">= ₹{((editing.price ?? 0) / 100).toLocaleString("en-IN")}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Stock</label>
                <input type="number" value={editing.stock ?? 0} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })}
                  className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              {/* Tags */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Tags (comma-separated)</label>
                <input
                  value={Array.isArray(editing.tags) ? editing.tags.join(", ") : (editing.tags ?? "")}
                  onChange={(e) => setEditing({ ...editing, tags: e.target.value })}
                  placeholder="montessori, gift, bestseller"
                  className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              {/* Cover image */}
              <FileField
                label="Cover Image"
                path={editing.cover_image ?? null}
                onUpload={uploadCover}
                onClear={() => setEditing({ ...editing, cover_image: null })}
              />

              {/* Teacher guide PDF */}
              <FileField
                label="Teacher Guide (PDF or image)"
                path={editing.teacher_guide_url ?? null}
                onUpload={uploadGuide}
                onClear={() => setEditing({ ...editing, teacher_guide_url: null })}
              />

              {/* Status + sort */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                <select value={editing.status ?? "draft"} onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                  className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  {["draft", "live", "sold_out", "archived"].map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Sort Order</label>
                <input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                  className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              {/* Featured */}
              <label className="col-span-2 flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={!!editing.is_featured} onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })} />
                Feature on homepage
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <PrimaryBtn onClick={save}>Save Product</PrimaryBtn>
              <OutlineBtn onClick={() => setEditing(null)}>Cancel</OutlineBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ORDERS (fully preserved from Ghost Protocol — only copy changes)
// ════════════════════════════════════════════════════════════════════════════

function OrdersAdmin() {
  const [orders, setOrders] = useState<any[]>([]);
  const [open, setOpen] = useState<any | null>(null);
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");

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
        <h2 className="font-display text-3xl text-foreground">Orders</h2>
        <button onClick={load} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(["all", ...ORDER_STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s as any)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              filter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}>
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="border border-border rounded divide-y divide-border">
        {filtered.map((o) => (
          <button key={o.id} onClick={() => setOpen(o)}
            className="w-full text-left p-4 grid grid-cols-1 md:grid-cols-6 gap-2 text-sm hover:bg-surface transition-colors">
            <div className="font-medium">{o.order_number}</div>
            <div>{o.customer_name}</div>
            <div className="text-muted-foreground truncate">{o.customer_email}</div>
            <div className="text-primary font-medium">{formatINR(o.total)}</div>
            <div className="text-xs text-muted-foreground capitalize">{o.kind ?? "standard"}</div>
            <div className="text-xs text-primary capitalize">{(o.production_status ?? "—").replace(/_/g, " ")}</div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">No orders found.</div>
        )}
      </div>

      {open && <OrderReview order={open} onClose={() => setOpen(null)} onChanged={(updated) => { setOpen(updated); load(); }} />}
    </div>
  );
}

function OrderReview({ order, onClose, onChanged }: { order: any; onClose: () => void; onChanged: (o: any) => void }) {
  const [notes, setNotes]   = useState<string>(order.admin_notes ?? "");
  const [status, setStatus] = useState<string>(order.production_status ?? "pending_review");
  const [art, setArt]   = useState<string | null>(null);
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
    toast.success("Order updated.");
    onChanged(res.data);
  }

  const addr = order.shipping_address ?? {};
  const cfg  = order.config_json ?? {};

  return (
    <div className="fixed inset-0 bg-foreground/40 z-50 overflow-y-auto p-4 md:p-10">
      <div className="max-w-5xl mx-auto bg-background border border-border rounded shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Order Review</p>
            <h3 className="font-display text-xl">{order.order_number}</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm transition-colors">Close ×</button>
        </div>

        {/* Artwork / mockup */}
        <div className="grid md:grid-cols-2 border-b border-border">
          {[{ label: "Original Artwork", url: art }, { label: "Generated Mockup", url: mock }].map(({ label, url }) => (
            <div key={label} className="p-5 border-r border-border last:border-r-0">
              <p className="text-xs text-muted-foreground mb-3">{label}</p>
              <div className="aspect-square bg-surface rounded flex items-center justify-center overflow-hidden">
                {order.assets_deleted
                  ? <span className="text-sm text-muted-foreground">Cleaned up {order.assets_deleted_at ? new Date(order.assets_deleted_at).toLocaleDateString("en-IN") : ""}</span>
                  : url
                    ? <img src={url} alt={label} className="max-w-full max-h-full object-contain" />
                    : <span className="text-sm text-muted-foreground">No file</span>}
              </div>
              {url && (
                <div className="flex gap-3 mt-2">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                    <ExternalLink size={11} /> Open
                  </a>
                  <button onClick={() => { navigator.clipboard.writeText(url); toast.success("Link copied."); }}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                    <Copy size={11} /> Copy link
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Customer / details */}
        <div className="grid md:grid-cols-3 gap-6 p-5 border-b border-border text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Customer</p>
            <p className="font-medium">{order.customer_name}</p>
            <p className="text-muted-foreground">{order.customer_email}</p>
            <p className="text-muted-foreground">{order.customer_phone ?? "—"}</p>
            <p className="text-muted-foreground mt-2">{addr.line1}<br />{addr.city}, {addr.state} — {addr.pincode}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Product Details</p>
            <p>Product: {cfg.product ?? "—"}</p>
            <p>Quantity: {cfg.quantity ?? 1}</p>
            <p className="mt-2 font-medium text-primary">{formatINR(order.total)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Notes</p>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
              className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        {/* Status update */}
        <div className="p-5 flex items-end gap-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-xs text-muted-foreground mb-1">Production Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <PrimaryBtn onClick={save}>Save</PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MEDIA (fully preserved — folder names updated for UNSCREEN)
// ════════════════════════════════════════════════════════════════════════════

function MediaAdmin() {
  const [folder, setFolder] = useState("library");
  const [items, setItems]   = useState<any[]>([]);
  const [q, setQ]           = useState("");
  const ref = useRef<HTMLInputElement>(null);

  async function load() {
    try { setItems(await listMedia(folder)); } catch (e: any) { toast.error(e.message); }
  }
  useEffect(() => { load(); }, [folder]);

  async function onUpload(file: File) {
    try { await uploadToMedia(file, folder, file.name); toast.success("Uploaded."); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  async function copy(item: any) {
    const url = await signedUrl(`${folder}/${item.name}`);
    if (!url) return toast.error("Could not generate link.");
    navigator.clipboard.writeText(url);
    toast.success("Link copied.");
  }

  async function del(item: any) {
    if (!confirm("Delete this asset? This cannot be undone.")) return;
    const res = await adminApi("delete_media", { path: `${folder}/${item.name}` });
    if (res.error) toast.error(res.error);
    else { toast.success("Deleted."); load(); }
  }

  const visible = items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()));
  const folders = [
    "library",
    "drops/cover_image",
    "drops/teacher_guide",
    "hero",
    "categories",
  ];

  return (
    <div>
      <SectionHeader title="Media Library" />
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select value={folder} onChange={(e) => setFolder(e.target.value)}
          className="bg-surface border border-border px-3 py-2 rounded text-sm">
          {folders.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
          className="bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary w-48" />
        <input ref={ref} type="file" accept="image/*,application/pdf" hidden
          onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
        <PrimaryBtn onClick={() => ref.current?.click()}>
          <span className="flex items-center gap-1.5"><Upload size={13} /> Upload</span>
        </PrimaryBtn>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {visible.map((item) => (
          <div key={item.name} className="border border-border rounded bg-surface group overflow-hidden">
            <div className="aspect-square overflow-hidden">
              <SignedImage path={`${folder}/${item.name}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="p-2">
              <p className="text-[10px] truncate text-muted-foreground" title={item.name}>{item.name}</p>
              <div className="flex gap-2 mt-1">
                <button onClick={() => copy(item)} className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                  <Copy size={9} /> Copy
                </button>
                <button onClick={() => del(item)} className="text-[10px] text-muted-foreground hover:text-destructive ml-auto">
                  <Trash2 size={9} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <div className="col-span-full p-8 text-center text-muted-foreground text-sm">No assets in this folder.</div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-4">Bucket: {MEDIA_BUCKET} · Copied links are signed (7-day expiry).</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CATEGORIES (replaces CONFIGURATOR — manage product category taxonomy)
// ════════════════════════════════════════════════════════════════════════════

type Category = {
  id?: string;
  slug: string;
  label: string;
  description: string;
  emoji: string;
  sort_order: number;
  visible: boolean;
  cover_image: string | null;
};

const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  { slug: "board-games",        label: "Board Games",        description: "Strategy and family board games.",           emoji: "♟️",  sort_order: 1,  visible: true, cover_image: null },
  { slug: "wooden-toys",        label: "Wooden Toys",        description: "Natural wood toys for sensory play.",         emoji: "🪵",  sort_order: 2,  visible: true, cover_image: null },
  { slug: "flash-cards",        label: "Flash Cards",        description: "Vocabulary, numbers, phonics cards.",          emoji: "🃏",  sort_order: 3,  visible: true, cover_image: null },
  { slug: "diy-kits",           label: "DIY Kits",           description: "Hands-on creative activity kits.",             emoji: "🎨",  sort_order: 4,  visible: true, cover_image: null },
  { slug: "books",              label: "Books",              description: "Picture books, chapter books, activity books.", emoji: "📚",  sort_order: 5,  visible: true, cover_image: null },
  { slug: "conversation-cards", label: "Conversation Cards", description: "Prompt cards for meaningful dialogue.",        emoji: "💬",  sort_order: 6,  visible: true, cover_image: null },
  { slug: "educational-kits",   label: "Educational Kits",   description: "Curriculum-aligned learning kits.",            emoji: "🧪",  sort_order: 7,  visible: true, cover_image: null },
  { slug: "teacher-resources",  label: "Teacher Resources",  description: "Classroom-ready educator tools.",              emoji: "🏫",  sort_order: 8,  visible: true, cover_image: null },
  { slug: "bundles",            label: "Bundles",            description: "Curated multi-product gift sets.",             emoji: "🎁",  sort_order: 9,  visible: true, cover_image: null },
];

function CategoriesAdmin() {
  // We store categories in site_config as JSON (configurator_colors repurposed)
  // until a dedicated migration adds a categories table. This is backward-compat.
  const [cats, setCats] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from("site_config")
      .select("unscreen_categories")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        const stored = (data as any)?.unscreen_categories;
        setCats(stored && stored.length > 0 ? stored : DEFAULT_CATEGORIES as any);
        setLoaded(true);
      });
  }, []);

  async function persist(next: Category[]) {
    const res = await adminApi("update_site_config", { patch: { unscreen_categories: next } });
    if (res.error) toast.error(res.error);
    else { toast.success("Categories saved."); setCats(next); }
  }

  async function saveEditing() {
    if (!editing) return;
    if (!editing.slug || !editing.label) return toast.error("Slug and label are required.");
    const exists = cats.findIndex((c) => c.id === editing.id);
    const next = exists >= 0
      ? cats.map((c) => c.id === editing.id ? editing : c)
      : [...cats, { ...editing, id: crypto.randomUUID() }];
    next.sort((a, b) => a.sort_order - b.sort_order);
    await persist(next);
    setEditing(null);
  }

  async function del(id: string) {
    if (!confirm("Remove this category?")) return;
    await persist(cats.filter((c) => c.id !== id));
  }

  async function toggle(id: string) {
    await persist(cats.map((c) => c.id === id ? { ...c, visible: !c.visible } : c));
  }

  async function uploadCover(file: File) {
    const path = await uploadToMedia(file, "categories", file.name);
    setEditing((e) => e ? { ...e, cover_image: path } : e);
    toast.success("Image uploaded.");
  }

  if (!loaded) return <div className="text-muted-foreground text-sm">Loading categories…</div>;

  return (
    <div>
      <SectionHeader
        title="Categories"
        action={
          <PrimaryBtn onClick={() => setEditing({ slug: "", label: "", description: "", emoji: "📦", sort_order: cats.length + 1, visible: true, cover_image: null })}>
            + New Category
          </PrimaryBtn>
        }
      />
      <p className="text-sm text-muted-foreground mb-6">
        Manage the product taxonomy shown on the Shop and Homepage. Changes here affect category navigation sitewide.
      </p>

      <div className="border border-border rounded divide-y divide-border">
        {cats.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between p-4 gap-4 hover:bg-surface transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl">{cat.emoji}</span>
              <div className="min-w-0">
                <div className="font-medium text-foreground">{cat.label}</div>
                <div className="text-xs text-muted-foreground">{cat.slug} · order {cat.sort_order} · {cat.description}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => toggle(cat.id!)} className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                cat.visible
                  ? "border-primary/40 text-primary bg-primary/10"
                  : "border-border text-muted-foreground"
              }`}>
                {cat.visible ? "Visible" : "Hidden"}
              </button>
              <button onClick={() => setEditing(cat)} className="text-xs text-primary hover:underline">Edit</button>
              <button onClick={() => del(cat.id!)} className="text-xs text-muted-foreground hover:text-destructive">Delete</button>
            </div>
          </div>
        ))}
        {cats.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">No categories yet.</div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border border-border rounded w-full max-w-lg p-6 shadow-xl">
            <h3 className="font-display text-2xl mb-6">{editing.id ? "Edit Category" : "New Category"}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Slug *</label>
                  <input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                    placeholder="board-games"
                    className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Label *</label>
                  <input value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                    placeholder="Board Games"
                    className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                <input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Emoji</label>
                  <input value={editing.emoji} onChange={(e) => setEditing({ ...editing, emoji: e.target.value })}
                    className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Sort Order</label>
                  <input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                    className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <FileField
                label="Cover Image (optional)"
                path={editing.cover_image}
                onUpload={uploadCover}
                onClear={() => setEditing({ ...editing, cover_image: null })}
              />
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={editing.visible} onChange={(e) => setEditing({ ...editing, visible: e.target.checked })} />
                Visible on site
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <PrimaryBtn onClick={saveEditing}>Save Category</PrimaryBtn>
              <OutlineBtn onClick={() => setEditing(null)}>Cancel</OutlineBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SITE CONFIG (preserved — field labels updated for UNSCREEN)
// ════════════════════════════════════════════════════════════════════════════

function ConfigAdmin() {
  const [cfg, setCfg] = useState<any>(null);

  useEffect(() => {
    supabase.from("site_config").select("*").eq("id", 1).maybeSingle().then(({ data }) => setCfg(data));
  }, []);

  async function save() {
    if (!cfg) return;
    const { id, updated_at, ...rest } = cfg;
    const res = await adminApi("update_site_config", { patch: rest });
    if (res.error) toast.error(res.error); else toast.success("Site config saved.");
  }

  if (!cfg) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const fields: [string, string, string?][] = [
    ["hero_headline",      "Hero Headline"],
    ["hero_subtext",       "Hero Subtext",  "textarea"],
    ["hero_cta_label",     "Hero CTA Label"],
    ["hero_cta_href",      "Hero CTA URL"],
    ["manifesto",          "Brand Mission / Manifesto", "textarea"],
    ["accent_color",       "Accent Colour (#hex)"],
    ["background_color",   "Background Colour (#hex)"],
    ["instagram_url",      "Instagram URL"],
    ["behold_widget_id",   "Instagram Feed (Behold Widget ID)"],
    ["whatsapp_number",    "WhatsApp Number"],
    ["support_email",      "Support Email"],
  ];

  return (
    <div>
      <SectionHeader title="Site Config" />
      <div className="space-y-4 max-w-2xl">
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={!!cfg.hero_visible} onChange={(e) => setCfg({ ...cfg, hero_visible: e.target.checked })} />
          Hero section visible
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
            <label className="block text-xs font-medium text-muted-foreground mb-1">{l}</label>
            {t === "textarea" ? (
              <textarea value={cfg[k] ?? ""} onChange={(e) => setCfg({ ...cfg, [k]: e.target.value })}
                rows={4} className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            ) : (
              <input value={cfg[k] ?? ""} onChange={(e) => setCfg({ ...cfg, [k]: e.target.value })}
                className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            )}
          </div>
        ))}
        <PrimaryBtn onClick={save}>Save Config</PrimaryBtn>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SETTINGS (preserved — UNSCREEN defaults + copy)
// ════════════════════════════════════════════════════════════════════════════

function SettingsAdmin({ onSignOut }: { onSignOut: () => void }) {
  const [productionEmail,      setProductionEmail]      = useState("");
  const [supportEmail,         setSupportEmail]         = useState("");
  const [whatsapp,             setWhatsapp]             = useState("");
  const [instagram,            setInstagram]            = useState("");
  const [accent,               setAccent]               = useState("#6B7A4F"); // UNSCREEN green default
  const [freeShippingEnabled,  setFreeShippingEnabled]  = useState(true);
  const [shippingMessage,      setShippingMessage]      = useState("Free shipping on all orders across India");
  const [autoCleanupEnabled,   setAutoCleanupEnabled]   = useState(true);
  const [cleanupDelayDays,     setCleanupDelayDays]     = useState(30);
  const [runningCleanup,       setRunningCleanup]       = useState(false);
  const [oldPw, setOldPw]     = useState("");
  const [newPw, setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  useEffect(() => {
    supabase.from("site_config")
      .select("production_email,support_email,whatsapp_number,instagram_url,accent_color,free_shipping_enabled,shipping_message,auto_cleanup_enabled,cleanup_delay_days")
      .eq("id", 1).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const d = data as any;
        setProductionEmail(d.production_email ?? "");
        setSupportEmail(d.support_email ?? "");
        setWhatsapp(d.whatsapp_number ?? "");
        setInstagram(d.instagram_url ?? "");
        setAccent(d.accent_color ?? "#6B7A4F");
        setFreeShippingEnabled(d.free_shipping_enabled ?? true);
        setShippingMessage(d.shipping_message ?? "Free shipping on all orders across India");
        setAutoCleanupEnabled(d.auto_cleanup_enabled ?? true);
        setCleanupDelayDays(d.cleanup_delay_days ?? 30);
      });
  }, []);

  async function saveOps() {
    const res = await adminApi("update_site_config", { patch: {
      production_email: productionEmail,
      support_email:    supportEmail,
      whatsapp_number:  whatsapp,
      instagram_url:    instagram,
      accent_color:     accent,
    }});
    if (res.error) toast.error(res.error); else toast.success("Settings saved.");
  }

  async function saveShipping() {
    const res = await adminApi("update_site_config", { patch: {
      free_shipping_enabled: freeShippingEnabled,
      shipping_message:      shippingMessage,
    }});
    if (res.error) toast.error(res.error); else toast.success("Shipping settings saved.");
  }

  async function saveCleanup() {
    const res = await adminApi("update_site_config", { patch: {
      auto_cleanup_enabled: autoCleanupEnabled,
      cleanup_delay_days:   cleanupDelayDays,
    }});
    if (res.error) toast.error(res.error); else toast.success("Cleanup settings saved.");
  }

  async function runCleanupNow() {
    setRunningCleanup(true);
    try {
      const { data, error } = await supabase.rpc("run_order_cleanup", { force: true });
      if (error) return toast.error(error.message);
      const n = (data as any)?.processed ?? 0;
      toast.success(n > 0 ? `Cleaned up ${n} order(s).` : "No orders were due for cleanup.");
    } catch (e: any) {
      toast.error(e?.message ?? "Cleanup failed.");
    } finally {
      setRunningCleanup(false);
    }
  }

  async function changePassword() {
    if (newPw.length < 6) return toast.error("Password must be at least 6 characters.");
    if (newPw !== confirmPw) return toast.error("Passwords do not match.");
    const res = await adminApi("rotate_code", { new_code: newPw }, oldPw);
    if (res.error) return toast.error(res.error === "unauthorized" ? "Current password is incorrect." : res.error);
    setAdminCode(newPw);
    toast.success("Access code updated.");
    setOldPw(""); setNewPw(""); setConfirmPw("");
  }

  return (
    <div className="space-y-12 max-w-2xl">
      {/* Operational */}
      <section>
        <h2 className="font-display text-2xl text-foreground mb-6">Operational Settings</h2>
        <div className="space-y-4">
          <Field label="Order notification email" value={productionEmail} onChange={setProductionEmail} />
          <Field label="Support email (shown publicly)" value={supportEmail} onChange={setSupportEmail} />
          <Field label="WhatsApp number" value={whatsapp} onChange={setWhatsapp} />
          <Field label="Instagram URL" value={instagram} onChange={setInstagram} />
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Brand accent colour</label>
            <div className="flex gap-2">
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)}
                className="h-10 w-16 bg-surface border border-border rounded cursor-pointer" />
              <input value={accent} onChange={(e) => setAccent(e.target.value)}
                className="flex-1 bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <PrimaryBtn onClick={saveOps}>Save Settings</PrimaryBtn>
        </div>
      </section>

      {/* Shipping */}
      <section>
        <h3 className="font-display text-xl text-foreground mb-4">Shipping</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={freeShippingEnabled} onChange={(e) => setFreeShippingEnabled(e.target.checked)} />
            Free shipping enabled
          </label>
          <Field label="Shipping banner message" value={shippingMessage} onChange={setShippingMessage} />
          <PrimaryBtn onClick={saveShipping}>Save Shipping</PrimaryBtn>
        </div>
      </section>

      {/* Storage cleanup */}
      <section>
        <h3 className="font-display text-xl text-foreground mb-2">Storage Cleanup</h3>
        <p className="text-sm text-muted-foreground mb-4">
          When an order is marked Shipped, its uploaded files are queued for deletion after the delay below.
          Order records and customer data are never deleted — only the storage files.
        </p>
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={autoCleanupEnabled} onChange={(e) => setAutoCleanupEnabled(e.target.checked)} />
            Auto cleanup enabled
          </label>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Cleanup delay (days)</label>
            <input type="number" min={1} value={cleanupDelayDays} onChange={(e) => setCleanupDelayDays(Number(e.target.value))}
              className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex gap-3">
            <PrimaryBtn onClick={saveCleanup}>Save Cleanup Settings</PrimaryBtn>
            <OutlineBtn onClick={runCleanupNow}>{runningCleanup ? "Running…" : "Run Now"}</OutlineBtn>
          </div>
        </div>
      </section>

      {/* Change password */}
      <section>
        <h3 className="font-display text-xl text-foreground mb-4">Change Access Code</h3>
        <div className="space-y-3 max-w-sm">
          <input type="password" placeholder="Current code" value={oldPw} onChange={(e) => setOldPw(e.target.value)}
            className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <input type="password" placeholder="New code" value={newPw} onChange={(e) => setNewPw(e.target.value)}
            className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <input type="password" placeholder="Confirm new code" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
            className="w-full bg-surface border border-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <PrimaryBtn onClick={changePassword}>Update Access Code</PrimaryBtn>
        </div>
      </section>

      <button onClick={onSignOut} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        Sign out →
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SIGNUPS (preserved + CSV export added)
// ════════════════════════════════════════════════════════════════════════════

function SignupsAdmin() {
  const [signups, setSignups] = useState<any[]>([]);

  useEffect(() => {
    adminApi<any[]>("list_signups").then((res) => {
      if (res.error) toast.error(res.error); else setSignups(res.data ?? []);
    });
  }, []);

  function exportCSV() {
    if (signups.length === 0) return toast.error("No signups to export.");
    const header = "Email,Signed up at";
    const rows = signups.map((s) => `${s.email},${new Date(s.created_at).toISOString()}`);
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `unscreen-signups-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${signups.length} signup(s).`);
  }

  return (
    <div>
      <SectionHeader
        title="Signups"
        action={
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 border border-border px-4 py-2 rounded text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">
            <Download size={13} /> Export CSV
          </button>
        }
      />
      <p className="text-sm text-muted-foreground mb-6">{signups.length} subscriber{signups.length !== 1 ? "s" : ""}</p>
      <div className="border border-border rounded divide-y divide-border">
        {signups.map((s) => (
          <div key={s.id} className="p-4 flex justify-between items-center text-sm hover:bg-surface transition-colors">
            <span className="text-foreground">{s.email}</span>
            <span className="text-muted-foreground text-xs">{new Date(s.created_at).toLocaleString("en-IN")}</span>
          </div>
        ))}
        {signups.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">No newsletter signups yet.</div>
        )}
      </div>
    </div>
  );
}
