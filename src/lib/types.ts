export interface Drop {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  price: number;
  currency: string;
  cover_image: string | null;
  gallery: string[];
  sizes: string[];
  status: "draft" | "live" | "archived" | "sold_out";
  is_featured: boolean;
  stock: number;
  drop_number: number | null;
  release_date: string | null;
  size_chart_url: string | null;
  created_at: string;
}

export interface SiteConfig {
  id: number;
  hero_video_url: string | null;
  hero_headline: string | null;
  hero_subtext: string | null;
  manifesto: string | null;
  next_drop_date: string | null;
  behold_widget_id: string | null;
  instagram_url: string | null;
  whatsapp_number: string | null;
}
