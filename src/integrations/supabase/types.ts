export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_permissions: {
        Row: {
          created_at: string
          id: string
          resource: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resource: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resource?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_export_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error: string | null
          file_path: string | null
          file_url: string | null
          filters: Json
          id: string
          requested_by: string | null
          requested_by_email: string | null
          row_count: number | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          file_path?: string | null
          file_url?: string | null
          filters?: Json
          id?: string
          requested_by?: string | null
          requested_by_email?: string | null
          row_count?: number | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          file_path?: string | null
          file_url?: string | null
          filters?: Json
          id?: string
          requested_by?: string | null
          requested_by_email?: string | null
          row_count?: number | null
          status?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string
          author_role: string
          body: Json
          category: string
          cover: string
          created_at: string
          date: string
          excerpt: string
          featured: boolean
          id: string
          is_published: boolean
          read_minutes: number
          slug: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author?: string
          author_role?: string
          body?: Json
          category?: string
          cover: string
          created_at?: string
          date: string
          excerpt?: string
          featured?: boolean
          id?: string
          is_published?: boolean
          read_minutes?: number
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          author_role?: string
          body?: Json
          category?: string
          cover?: string
          created_at?: string
          date?: string
          excerpt?: string
          featured?: boolean
          id?: string
          is_published?: boolean
          read_minutes?: number
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string
          topic: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string
          topic?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
          topic?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      impersonation_events: {
        Row: {
          actor_email: string | null
          actor_id: string | null
          created_at: string
          id: string
          reason: string | null
          target_email: string | null
          target_id: string | null
        }
        Insert: {
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          target_email?: string | null
          target_id?: string | null
        }
        Update: {
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          target_email?: string | null
          target_id?: string | null
        }
        Relationships: []
      }
      inventory_adjustments: {
        Row: {
          actor_email: string | null
          actor_id: string | null
          created_at: string
          delta: number
          id: string
          product_id: string
          reason: string
          source: string
          stock_after: number
          stock_before: number
          variant: string | null
        }
        Insert: {
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          delta: number
          id?: string
          product_id: string
          reason?: string
          source?: string
          stock_after: number
          stock_before: number
          variant?: string | null
        }
        Update: {
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          delta?: number
          id?: string
          product_id?: string
          reason?: string
          source?: string
          stock_after?: number
          stock_before?: number
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notification_events: {
        Row: {
          body_preview: string | null
          channel: string
          created_at: string
          error: string | null
          from_addr: string | null
          id: string
          kind: string
          ref_id: string | null
          ref_table: string | null
          sent_at: string | null
          status: string
          subject: string | null
          to_addr: string | null
          user_id: string | null
        }
        Insert: {
          body_preview?: string | null
          channel: string
          created_at?: string
          error?: string | null
          from_addr?: string | null
          id?: string
          kind: string
          ref_id?: string | null
          ref_table?: string | null
          sent_at?: string | null
          status: string
          subject?: string | null
          to_addr?: string | null
          user_id?: string | null
        }
        Update: {
          body_preview?: string | null
          channel?: string
          created_at?: string
          error?: string | null
          from_addr?: string | null
          id?: string
          kind?: string
          ref_id?: string | null
          ref_table?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          to_addr?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          cancellations_email: boolean
          cancellations_inapp: boolean
          created_at: string
          marketing_email: boolean
          refunds_email: boolean
          refunds_inapp: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          cancellations_email?: boolean
          cancellations_inapp?: boolean
          created_at?: string
          marketing_email?: boolean
          refunds_email?: boolean
          refunds_inapp?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          cancellations_email?: boolean
          cancellations_inapp?: boolean
          created_at?: string
          marketing_email?: boolean
          refunds_email?: boolean
          refunds_inapp?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          kind: string
          link: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          kind: string
          link?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          link?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          discount: number
          email: string
          id: string
          items: Json
          method: string
          order_number: string
          promo: string | null
          ship: Json
          shipping: number
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          discount?: number
          email: string
          id?: string
          items: Json
          method: string
          order_number?: string
          promo?: string | null
          ship: Json
          shipping?: number
          status?: string
          subtotal: number
          tax?: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          discount?: number
          email?: string
          id?: string
          items?: Json
          method?: string
          order_number?: string
          promo?: string | null
          ship?: Json
          shipping?: number
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          approved: boolean
          body: string
          created_at: string
          email: string | null
          id: string
          name: string
          product_slug: string
          rating: number
          user_id: string | null
        }
        Insert: {
          approved?: boolean
          body: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          product_slug: string
          rating: number
          user_id?: string | null
        }
        Update: {
          approved?: boolean
          body?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          product_slug?: string
          rating?: number
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          colors: Json
          compare_at: number | null
          created_at: string
          description: string
          features: string[]
          id: string
          image: string
          images: string[]
          is_published: boolean
          long_description: string[]
          low_stock_threshold: number
          name: string
          price: number
          rating: number
          reviews: number
          sizes: string[]
          slug: string
          specs: Json
          stock: number
          type: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category: string
          colors?: Json
          compare_at?: number | null
          created_at?: string
          description?: string
          features?: string[]
          id?: string
          image: string
          images?: string[]
          is_published?: boolean
          long_description?: string[]
          low_stock_threshold?: number
          name: string
          price: number
          rating?: number
          reviews?: number
          sizes?: string[]
          slug: string
          specs?: Json
          stock?: number
          type: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category?: string
          colors?: Json
          compare_at?: number | null
          created_at?: string
          description?: string
          features?: string[]
          id?: string
          image?: string
          images?: string[]
          is_published?: boolean
          long_description?: string[]
          low_stock_threshold?: number
          name?: string
          price?: number
          rating?: number
          reviews?: number
          sizes?: string[]
          slug?: string
          specs?: Json
          stock?: number
          type?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          expires_at: string | null
          free_shipping: boolean
          id: string
          label: string
          pct: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          expires_at?: string | null
          free_shipping?: boolean
          id?: string
          label?: string
          pct?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          expires_at?: string | null
          free_shipping?: boolean
          id?: string
          label?: string
          pct?: number
          updated_at?: string
        }
        Relationships: []
      }
      refund_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          created_by_admin: boolean
          id: string
          order_id: string
          reason: string
          request_type: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          created_by_admin?: boolean
          id?: string
          order_id: string
          reason?: string
          request_type: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          created_by_admin?: boolean
          id?: string
          order_id?: string
          reason?: string
          request_type?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_first_admin: { Args: never; Returns: boolean }
      has_admin_permission: {
        Args: { _resource: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_any_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "customer" | "super_admin"
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
    Enums: {
      app_role: ["admin", "customer", "super_admin"],
    },
  },
} as const
