export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_secrets: {
        Row: {
          id: number
          password_hash: string
          updated_at: string
        }
        Insert: {
          id?: number
          password_hash: string
          updated_at?: string
        }
        Update: {
          id?: number
          password_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      configurator_assets: {
        Row: {
          active_status: boolean
          back_preview_url: string | null
          color_hex: string | null
          created_at: string
          front_preview_url: string | null
          garment_color: string
          garment_name: string
          id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active_status?: boolean
          back_preview_url?: string | null
          color_hex?: string | null
          created_at?: string
          front_preview_url?: string | null
          garment_color: string
          garment_name: string
          id?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active_status?: boolean
          back_preview_url?: string | null
          color_hex?: string | null
          created_at?: string
          front_preview_url?: string | null
          garment_color?: string
          garment_name?: string
          id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      drops: {
        Row: {
          category: string | null
          cover_image: string | null
          created_at: string
          currency: string
          description: string | null
          drop_number: number | null
          gallery: Json
          id: string
          is_featured: boolean
          name: string
          price: number
          release_date: string | null
          size_chart_url: string | null
          sizes: Json
          slug: string
          sort_order: number
          status: string
          stock: number
          tagline: string | null
          tags: Json
          updated_at: string
        }
        Insert: {
          category?: string | null
          cover_image?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          drop_number?: number | null
          gallery?: Json
          id?: string
          is_featured?: boolean
          name: string
          price?: number
          release_date?: string | null
          size_chart_url?: string | null
          sizes?: Json
          slug: string
          sort_order?: number
          status?: string
          stock?: number
          tagline?: string | null
          tags?: Json
          updated_at?: string
        }
        Update: {
          category?: string | null
          cover_image?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          drop_number?: number | null
          gallery?: Json
          id?: string
          is_featured?: boolean
          name?: string
          price?: number
          release_date?: string | null
          size_chart_url?: string | null
          sizes?: Json
          slug?: string
          sort_order?: number
          status?: string
          stock?: number
          tagline?: string | null
          tags?: Json
          updated_at?: string
        }
        Relationships: []
      }
      notify_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          admin_notes: string | null
          artwork_url: string | null
          config_json: Json | null
          created_at: string
          currency: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          id: string
          items: Json
          kind: string
          mockup_url: string | null
          order_number: string
          paid_at: string | null
          production_status: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          shipping: number
          shipping_address: Json
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          artwork_url?: string | null
          config_json?: Json | null
          created_at?: string
          currency?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          items: Json
          kind?: string
          mockup_url?: string | null
          order_number?: string
          paid_at?: string | null
          production_status?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          shipping?: number
          shipping_address: Json
          status?: string
          subtotal: number
          total: number
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          artwork_url?: string | null
          config_json?: Json | null
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          items?: Json
          kind?: string
          mockup_url?: string | null
          order_number?: string
          paid_at?: string | null
          production_status?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          shipping?: number
          shipping_address?: Json
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_config: {
        Row: {
          accent_color: string
          background_color: string
          behold_widget_id: string | null
          configurator_colors: Json
          configurator_size_chart_url: string | null
          configurator_sizes: Json
          hero_cta_href: string | null
          hero_cta_label: string | null
          hero_headline: string | null
          hero_subtext: string | null
          hero_video_url: string | null
          hero_visible: boolean
          id: number
          instagram_url: string | null
          manifesto: string | null
          next_drop_date: string | null
          production_email: string
          support_email: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          accent_color?: string
          background_color?: string
          behold_widget_id?: string | null
          configurator_colors?: Json
          configurator_size_chart_url?: string | null
          configurator_sizes?: Json
          hero_cta_href?: string | null
          hero_cta_label?: string | null
          hero_headline?: string | null
          hero_subtext?: string | null
          hero_video_url?: string | null
          hero_visible?: boolean
          id?: number
          instagram_url?: string | null
          manifesto?: string | null
          next_drop_date?: string | null
          production_email?: string
          support_email?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          accent_color?: string
          background_color?: string
          behold_widget_id?: string | null
          configurator_colors?: Json
          configurator_size_chart_url?: string | null
          configurator_sizes?: Json
          hero_cta_href?: string | null
          hero_cta_label?: string | null
          hero_headline?: string | null
          hero_subtext?: string | null
          hero_video_url?: string | null
          hero_visible?: boolean
          id?: number
          instagram_url?: string | null
          manifesto?: string | null
          next_drop_date?: string | null
          production_email?: string
          support_email?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
