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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      checkin_sessions: {
        Row: {
          created_at: string | null
          device_id: string | null
          event_id: string
          id: string
          last_sync_at: string | null
          offline_scans: Json | null
          operator_id: string
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          event_id: string
          id?: string
          last_sync_at?: string | null
          offline_scans?: Json | null
          operator_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          event_id?: string
          id?: string
          last_sync_at?: string | null
          offline_scans?: Json | null
          operator_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkin_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_sessions_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applicable_tier_ids: string[] | null
          code: string
          created_at: string | null
          discount_type: string
          discount_value: number
          event_id: string
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_value: number | null
          producer_id: string
          uses_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_tier_ids?: string[] | null
          code: string
          created_at?: string | null
          discount_type: string
          discount_value: number
          event_id: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_value?: number | null
          producer_id: string
          uses_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_tier_ids?: string[] | null
          code?: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          event_id?: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_value?: number | null
          producer_id?: string
          uses_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_analytics: {
        Row: {
          conversion_rate: number | null
          event_id: string
          id: string
          page_views: number | null
          platform_revenue: number | null
          producer_revenue: number | null
          tickets_checked_in: number | null
          tickets_sold: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          conversion_rate?: number | null
          event_id: string
          id?: string
          page_views?: number | null
          platform_revenue?: number | null
          producer_revenue?: number | null
          tickets_checked_in?: number | null
          tickets_sold?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          conversion_rate?: number | null
          event_id?: string
          id?: string
          page_views?: number | null
          platform_revenue?: number | null
          producer_revenue?: number | null
          tickets_checked_in?: number | null
          tickets_sold?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_analytics_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_image_url: string | null
          category: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          doors_open_time: string | null
          end_date: string
          has_seat_map: boolean | null
          id: string
          is_featured: boolean | null
          is_online: boolean | null
          max_capacity: number | null
          minimum_age: number | null
          online_url: string | null
          platform_fee_percent: number | null
          producer_id: string
          seat_map_config: Json | null
          slug: string
          start_date: string
          status: string | null
          title: string
          updated_at: string | null
          venue_address: string | null
          venue_city: string | null
          venue_latitude: number | null
          venue_longitude: number | null
          venue_name: string | null
          venue_state: string | null
          venue_zip: string | null
          views_count: number | null
        }
        Insert: {
          banner_image_url?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          doors_open_time?: string | null
          end_date: string
          has_seat_map?: boolean | null
          id?: string
          is_featured?: boolean | null
          is_online?: boolean | null
          max_capacity?: number | null
          minimum_age?: number | null
          online_url?: string | null
          platform_fee_percent?: number | null
          producer_id: string
          seat_map_config?: Json | null
          slug: string
          start_date: string
          status?: string | null
          title: string
          updated_at?: string | null
          venue_address?: string | null
          venue_city?: string | null
          venue_latitude?: number | null
          venue_longitude?: number | null
          venue_name?: string | null
          venue_state?: string | null
          venue_zip?: string | null
          views_count?: number | null
        }
        Update: {
          banner_image_url?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          doors_open_time?: string | null
          end_date?: string
          has_seat_map?: boolean | null
          id?: string
          is_featured?: boolean | null
          is_online?: boolean | null
          max_capacity?: number | null
          minimum_age?: number | null
          online_url?: string | null
          platform_fee_percent?: number | null
          producer_id?: string
          seat_map_config?: Json | null
          slug?: string
          start_date?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          venue_address?: string | null
          venue_city?: string | null
          venue_latitude?: number | null
          venue_longitude?: number | null
          venue_name?: string | null
          venue_state?: string | null
          venue_zip?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_lists: {
        Row: {
          added_by: string
          checked_in: boolean | null
          checked_in_at: string | null
          created_at: string | null
          email: string | null
          event_id: string
          id: string
          name: string | null
          phone: string | null
          tier_id: string | null
        }
        Insert: {
          added_by: string
          checked_in?: boolean | null
          checked_in_at?: string | null
          created_at?: string | null
          email?: string | null
          event_id: string
          id?: string
          name?: string | null
          phone?: string | null
          tier_id?: string | null
        }
        Update: {
          added_by?: string
          checked_in?: boolean | null
          checked_in_at?: string | null
          created_at?: string | null
          email?: string | null
          event_id?: string
          id?: string
          name?: string | null
          phone?: string | null
          tier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_lists_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_lists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_lists_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          title: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          boleto_barcode: string | null
          boleto_url: string | null
          buyer_id: string
          coupon_id: string | null
          created_at: string | null
          discount_amount: number | null
          event_id: string
          expires_at: string | null
          id: string
          payment_external_id: string | null
          payment_gateway: string | null
          payment_gateway_fee: number | null
          payment_method: string | null
          payment_status: string | null
          pix_qr_code: string | null
          pix_qr_code_image: string | null
          platform_fee: number
          status: string | null
          subtotal: number
          total: number
          updated_at: string | null
        }
        Insert: {
          boleto_barcode?: string | null
          boleto_url?: string | null
          buyer_id: string
          coupon_id?: string | null
          created_at?: string | null
          discount_amount?: number | null
          event_id: string
          expires_at?: string | null
          id?: string
          payment_external_id?: string | null
          payment_gateway?: string | null
          payment_gateway_fee?: number | null
          payment_method?: string | null
          payment_status?: string | null
          pix_qr_code?: string | null
          pix_qr_code_image?: string | null
          platform_fee: number
          status?: string | null
          subtotal: number
          total: number
          updated_at?: string | null
        }
        Update: {
          boleto_barcode?: string | null
          boleto_url?: string | null
          buyer_id?: string
          coupon_id?: string | null
          created_at?: string | null
          discount_amount?: number | null
          event_id?: string
          expires_at?: string | null
          id?: string
          payment_external_id?: string | null
          payment_gateway?: string | null
          payment_gateway_fee?: number | null
          payment_method?: string | null
          payment_status?: string | null
          pix_qr_code?: string | null
          pix_qr_code_image?: string | null
          platform_fee?: number
          status?: string | null
          subtotal?: number
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          producer_status: Database["public"]["Enums"]["producer_status"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          producer_status?:
            | Database["public"]["Enums"]["producer_status"]
            | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          producer_status?:
            | Database["public"]["Enums"]["producer_status"]
            | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ticket_tiers: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: string
          id: string
          includes_items: string[] | null
          is_resellable: boolean | null
          is_transferable: boolean | null
          is_visible: boolean | null
          max_per_order: number | null
          min_per_order: number | null
          name: string
          original_price: number | null
          price: number | null
          quantity_reserved: number | null
          quantity_sold: number | null
          quantity_total: number
          sale_end_date: string | null
          sale_start_date: string | null
          sort_order: number | null
          tier_type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id: string
          id?: string
          includes_items?: string[] | null
          is_resellable?: boolean | null
          is_transferable?: boolean | null
          is_visible?: boolean | null
          max_per_order?: number | null
          min_per_order?: number | null
          name: string
          original_price?: number | null
          price?: number | null
          quantity_reserved?: number | null
          quantity_sold?: number | null
          quantity_total: number
          sale_end_date?: string | null
          sale_start_date?: string | null
          sort_order?: number | null
          tier_type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: string
          id?: string
          includes_items?: string[] | null
          is_resellable?: boolean | null
          is_transferable?: boolean | null
          is_visible?: boolean | null
          max_per_order?: number | null
          min_per_order?: number | null
          name?: string
          original_price?: number | null
          price?: number | null
          quantity_reserved?: number | null
          quantity_sold?: number | null
          quantity_total?: number
          sale_end_date?: string | null
          sale_start_date?: string | null
          sort_order?: number | null
          tier_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_tiers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          attendee_cpf: string | null
          attendee_email: string | null
          attendee_name: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string | null
          event_id: string
          id: string
          is_for_resale: boolean | null
          is_offline_synced: boolean | null
          order_id: string
          original_buyer_id: string
          owner_id: string
          qr_code: string
          qr_code_image_url: string | null
          resale_price: number | null
          status: string | null
          tier_id: string
          transfer_history: Json | null
        }
        Insert: {
          attendee_cpf?: string | null
          attendee_email?: string | null
          attendee_name?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          is_for_resale?: boolean | null
          is_offline_synced?: boolean | null
          order_id: string
          original_buyer_id: string
          owner_id: string
          qr_code: string
          qr_code_image_url?: string | null
          resale_price?: number | null
          status?: string | null
          tier_id: string
          transfer_history?: Json | null
        }
        Update: {
          attendee_cpf?: string | null
          attendee_email?: string | null
          attendee_name?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          is_for_resale?: boolean | null
          is_offline_synced?: boolean | null
          order_id?: string
          original_buyer_id?: string
          owner_id?: string
          qr_code?: string
          qr_code_image_url?: string | null
          resale_price?: number | null
          status?: string | null
          tier_id?: string
          transfer_history?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_original_buyer_id_fkey"
            columns: ["original_buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string | null
          email: string
          event_id: string
          id: string
          notified_at: string | null
          phone: string | null
          position: number | null
          status: string | null
          tier_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          event_id: string
          id?: string
          notified_at?: string | null
          phone?: string | null
          position?: number | null
          status?: string | null
          tier_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          event_id?: string
          id?: string
          notified_at?: string | null
          phone?: string | null
          position?: number | null
          status?: string | null
          tier_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "producer" | "buyer"
      producer_status: "pending" | "approved" | "rejected" | "suspended"
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
      app_role: ["admin", "producer", "buyer"],
      producer_status: ["pending", "approved", "rejected", "suspended"],
    },
  },
} as const
