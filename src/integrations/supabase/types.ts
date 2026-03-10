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
      affiliates: {
        Row: {
          clicks: number | null
          code: string
          commission_type: string | null
          commission_value: number | null
          conversions: number | null
          created_at: string | null
          event_id: string
          id: string
          is_active: boolean | null
          name: string
          producer_id: string
          revenue_generated: number | null
        }
        Insert: {
          clicks?: number | null
          code: string
          commission_type?: string | null
          commission_value?: number | null
          conversions?: number | null
          created_at?: string | null
          event_id: string
          id?: string
          is_active?: boolean | null
          name: string
          producer_id: string
          revenue_generated?: number | null
        }
        Update: {
          clicks?: number | null
          code?: string
          commission_type?: string | null
          commission_value?: number | null
          conversions?: number | null
          created_at?: string | null
          event_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          producer_id?: string
          revenue_generated?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliates_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string | null
          agency: string | null
          bank_name: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          pix_key: string | null
          pix_key_type: string | null
          producer_id: string
          updated_at: string | null
        }
        Insert: {
          account_name: string
          account_number?: string | null
          agency?: string | null
          bank_name?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          pix_key?: string | null
          pix_key_type?: string | null
          producer_id: string
          updated_at?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string | null
          agency?: string | null
          bank_name?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          pix_key?: string | null
          pix_key_type?: string | null
          producer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_messages: {
        Row: {
          body: string
          created_at: string | null
          event_id: string
          id: string
          producer_id: string
          recipient_filter: Json | null
          recipients_count: number | null
          sent_at: string | null
          status: string | null
          subject: string
        }
        Insert: {
          body: string
          created_at?: string | null
          event_id: string
          id?: string
          producer_id: string
          recipient_filter?: Json | null
          recipients_count?: number | null
          sent_at?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          body?: string
          created_at?: string | null
          event_id?: string
          id?: string
          producer_id?: string
          recipient_filter?: Json | null
          recipients_count?: number | null
          sent_at?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_messages_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      capacity_groups: {
        Row: {
          capacity: number
          created_at: string | null
          event_id: string
          id: string
          name: string
          sold_count: number | null
        }
        Insert: {
          capacity: number
          created_at?: string | null
          event_id: string
          id?: string
          name: string
          sold_count?: number | null
        }
        Update: {
          capacity?: number
          created_at?: string | null
          event_id?: string
          id?: string
          name?: string
          sold_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "capacity_groups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          attendee_name: string
          certificate_code: string
          created_at: string | null
          download_url: string | null
          event_id: string
          id: string
          issued_at: string | null
          ticket_id: string
          user_id: string
        }
        Insert: {
          attendee_name: string
          certificate_code: string
          created_at?: string | null
          download_url?: string | null
          event_id: string
          id?: string
          issued_at?: string | null
          ticket_id: string
          user_id: string
        }
        Update: {
          attendee_name?: string
          certificate_code?: string
          created_at?: string | null
          download_url?: string | null
          event_id?: string
          id?: string
          issued_at?: string | null
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_lists: {
        Row: {
          access_code: string | null
          activated_at: string | null
          allowed_tier_ids: string[] | null
          created_at: string | null
          event_id: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          access_code?: string | null
          activated_at?: string | null
          allowed_tier_ids?: string[] | null
          created_at?: string | null
          event_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          access_code?: string | null
          activated_at?: string | null
          allowed_tier_ids?: string[] | null
          created_at?: string | null
          event_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkin_lists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_scan_logs: {
        Row: {
          checkin_list_id: string | null
          device_id: string | null
          id: string
          qr_code_scanned: string
          result: string
          scanned_at: string | null
          scanned_by: string | null
          ticket_id: string | null
        }
        Insert: {
          checkin_list_id?: string | null
          device_id?: string | null
          id?: string
          qr_code_scanned: string
          result: string
          scanned_at?: string | null
          scanned_by?: string | null
          ticket_id?: string | null
        }
        Update: {
          checkin_list_id?: string | null
          device_id?: string | null
          id?: string
          qr_code_scanned?: string
          result?: string
          scanned_at?: string | null
          scanned_by?: string | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkin_scan_logs_checkin_list_id_fkey"
            columns: ["checkin_list_id"]
            isOneToOne: false
            referencedRelation: "checkin_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_scan_logs_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_scan_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
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
      checkout_answers: {
        Row: {
          answer: string | null
          created_at: string | null
          id: string
          order_id: string | null
          question_id: string
          ticket_id: string | null
        }
        Insert: {
          answer?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          question_id: string
          ticket_id?: string | null
        }
        Update: {
          answer?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          question_id?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkout_answers_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "checkout_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_answers_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_questions: {
        Row: {
          applies_to: string | null
          created_at: string | null
          event_id: string
          field_type: string
          id: string
          is_required: boolean | null
          options: Json | null
          question: string
          sort_order: number | null
          tier_ids: string[] | null
        }
        Insert: {
          applies_to?: string | null
          created_at?: string | null
          event_id: string
          field_type: string
          id?: string
          is_required?: boolean | null
          options?: Json | null
          question: string
          sort_order?: number | null
          tier_ids?: string[] | null
        }
        Update: {
          applies_to?: string | null
          created_at?: string | null
          event_id?: string
          field_type?: string
          id?: string
          is_required?: boolean | null
          options?: Json | null
          question?: string
          sort_order?: number | null
          tier_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "checkout_questions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
      event_products: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: string
          id: string
          image_url: string | null
          is_visible: boolean | null
          max_per_order: number | null
          name: string
          price: number
          quantity_available: number | null
          quantity_sold: number | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id: string
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          max_per_order?: number | null
          name: string
          price: number
          quantity_available?: number | null
          quantity_sold?: number | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: string
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          max_per_order?: number | null
          name?: string
          price?: number
          quantity_available?: number | null
          quantity_sold?: number | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_products_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reviews: {
        Row: {
          comment: string | null
          created_at: string
          event_id: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          event_id: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          event_id?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_image_url: string | null
          category: string | null
          certificate_template: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          doors_open_time: string | null
          end_date: string
          has_certificates: boolean | null
          has_insurance_option: boolean | null
          has_seat_map: boolean | null
          has_virtual_queue: boolean | null
          id: string
          insurance_price: number | null
          is_featured: boolean | null
          is_multi_day: boolean | null
          is_online: boolean | null
          max_capacity: number | null
          minimum_age: number | null
          online_url: string | null
          platform_fee_percent: number | null
          producer_id: string
          queue_capacity: number | null
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
          certificate_template?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          doors_open_time?: string | null
          end_date: string
          has_certificates?: boolean | null
          has_insurance_option?: boolean | null
          has_seat_map?: boolean | null
          has_virtual_queue?: boolean | null
          id?: string
          insurance_price?: number | null
          is_featured?: boolean | null
          is_multi_day?: boolean | null
          is_online?: boolean | null
          max_capacity?: number | null
          minimum_age?: number | null
          online_url?: string | null
          platform_fee_percent?: number | null
          producer_id: string
          queue_capacity?: number | null
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
          certificate_template?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          doors_open_time?: string | null
          end_date?: string
          has_certificates?: boolean | null
          has_insurance_option?: boolean | null
          has_seat_map?: boolean | null
          has_virtual_queue?: boolean | null
          id?: string
          insurance_price?: number | null
          is_featured?: boolean | null
          is_multi_day?: boolean | null
          is_online?: boolean | null
          max_capacity?: number | null
          minimum_age?: number | null
          online_url?: string | null
          platform_fee_percent?: number | null
          producer_id?: string
          queue_capacity?: number | null
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
      favorites: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          bank_account_id: string | null
          category: string
          created_at: string | null
          description: string
          due_date: string | null
          event_id: string | null
          id: string
          notes: string | null
          order_id: string | null
          paid_at: string | null
          producer_id: string
          reference_id: string | null
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          amount?: number
          bank_account_id?: string | null
          category: string
          created_at?: string | null
          description: string
          due_date?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          producer_id: string
          reference_id?: string | null
          status?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          category?: string
          created_at?: string | null
          description?: string
          due_date?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          producer_id?: string
          reference_id?: string | null
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_producer_id_fkey"
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
      interest_list_fields: {
        Row: {
          created_at: string | null
          field_name: string
          field_type: string
          id: string
          is_required: boolean | null
          list_id: string
          options: Json | null
          placeholder: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          field_name: string
          field_type?: string
          id?: string
          is_required?: boolean | null
          list_id: string
          options?: Json | null
          placeholder?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          field_name?: string
          field_type?: string
          id?: string
          is_required?: boolean | null
          list_id?: string
          options?: Json | null
          placeholder?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "interest_list_fields_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "interest_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      interest_list_submissions: {
        Row: {
          answers: Json
          created_at: string | null
          id: string
          ip_address: string | null
          list_id: string
          user_id: string | null
        }
        Insert: {
          answers?: Json
          created_at?: string | null
          id?: string
          ip_address?: string | null
          list_id: string
          user_id?: string | null
        }
        Update: {
          answers?: Json
          created_at?: string | null
          id?: string
          ip_address?: string | null
          list_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interest_list_submissions_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "interest_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      interest_lists: {
        Row: {
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          max_submissions: number | null
          name: string
          producer_id: string
          slug: string
          start_date: string | null
          status: string
          submissions_count: number
          updated_at: string | null
          venue_name: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          max_submissions?: number | null
          name: string
          producer_id: string
          slug: string
          start_date?: string | null
          status?: string
          submissions_count?: number
          updated_at?: string | null
          venue_name?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          max_submissions?: number | null
          name?: string
          producer_id?: string
          slug?: string
          start_date?: string | null
          status?: string
          submissions_count?: number
          updated_at?: string | null
          venue_name?: string | null
        }
        Relationships: []
      }
      lgpd_consents: {
        Row: {
          consent_type: string
          created_at: string | null
          granted: boolean
          granted_at: string | null
          id: string
          ip_address: string | null
          revoked_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_type: string
          created_at?: string | null
          granted?: boolean
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          revoked_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_type?: string
          created_at?: string | null
          granted?: boolean
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          revoked_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lgpd_data_requests: {
        Row: {
          completed_at: string | null
          created_at: string | null
          download_url: string | null
          id: string
          notes: string | null
          request_type: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          download_url?: string | null
          id?: string
          notes?: string | null
          request_type: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          download_url?: string | null
          id?: string
          notes?: string | null
          request_type?: string
          status?: string
          user_id?: string
        }
        Relationships: []
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
      order_products: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_products_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "event_products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          asaas_customer_id: string | null
          asaas_payment_id: string | null
          billing_address: string | null
          billing_cnpj: string | null
          billing_company_name: string | null
          boleto_barcode: string | null
          boleto_url: string | null
          buyer_id: string
          chargeback_notified_at: string | null
          chargeback_reason: string | null
          chargeback_status: string | null
          coupon_id: string | null
          created_at: string | null
          discount_amount: number | null
          event_id: string
          expires_at: string | null
          has_insurance: boolean | null
          id: string
          installment_value: number | null
          installments: number | null
          insurance_amount: number | null
          invoice_issued_at: string | null
          invoice_number: string | null
          invoice_pdf_url: string | null
          net_amount: number | null
          payment_external_id: string | null
          payment_gateway: string | null
          payment_gateway_fee: number | null
          payment_method: string | null
          payment_status: string | null
          pix_qr_code: string | null
          pix_qr_code_image: string | null
          platform_fee: number
          platform_fee_amount: number | null
          promoter_event_id: string | null
          refund_reason: string | null
          refunded_amount: number | null
          refunded_at: string | null
          status: string | null
          subtotal: number
          total: number
          updated_at: string | null
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_payment_id?: string | null
          billing_address?: string | null
          billing_cnpj?: string | null
          billing_company_name?: string | null
          boleto_barcode?: string | null
          boleto_url?: string | null
          buyer_id: string
          chargeback_notified_at?: string | null
          chargeback_reason?: string | null
          chargeback_status?: string | null
          coupon_id?: string | null
          created_at?: string | null
          discount_amount?: number | null
          event_id: string
          expires_at?: string | null
          has_insurance?: boolean | null
          id?: string
          installment_value?: number | null
          installments?: number | null
          insurance_amount?: number | null
          invoice_issued_at?: string | null
          invoice_number?: string | null
          invoice_pdf_url?: string | null
          net_amount?: number | null
          payment_external_id?: string | null
          payment_gateway?: string | null
          payment_gateway_fee?: number | null
          payment_method?: string | null
          payment_status?: string | null
          pix_qr_code?: string | null
          pix_qr_code_image?: string | null
          platform_fee: number
          platform_fee_amount?: number | null
          promoter_event_id?: string | null
          refund_reason?: string | null
          refunded_amount?: number | null
          refunded_at?: string | null
          status?: string | null
          subtotal: number
          total: number
          updated_at?: string | null
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_payment_id?: string | null
          billing_address?: string | null
          billing_cnpj?: string | null
          billing_company_name?: string | null
          boleto_barcode?: string | null
          boleto_url?: string | null
          buyer_id?: string
          chargeback_notified_at?: string | null
          chargeback_reason?: string | null
          chargeback_status?: string | null
          coupon_id?: string | null
          created_at?: string | null
          discount_amount?: number | null
          event_id?: string
          expires_at?: string | null
          has_insurance?: boolean | null
          id?: string
          installment_value?: number | null
          installments?: number | null
          insurance_amount?: number | null
          invoice_issued_at?: string | null
          invoice_number?: string | null
          invoice_pdf_url?: string | null
          net_amount?: number | null
          payment_external_id?: string | null
          payment_gateway?: string | null
          payment_gateway_fee?: number | null
          payment_method?: string | null
          payment_status?: string | null
          pix_qr_code?: string | null
          pix_qr_code_image?: string | null
          platform_fee?: number
          platform_fee_amount?: number | null
          promoter_event_id?: string | null
          refund_reason?: string | null
          refunded_amount?: number | null
          refunded_at?: string | null
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
          {
            foreignKeyName: "orders_promoter_event_id_fkey"
            columns: ["promoter_event_id"]
            isOneToOne: false
            referencedRelation: "promoter_events"
            referencedColumns: ["id"]
          },
        ]
      }
      producer_team_members: {
        Row: {
          accepted_at: string | null
          email: string
          id: string
          invite_token: string | null
          invited_at: string | null
          producer_id: string
          role: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          email: string
          id?: string
          invite_token?: string | null
          invited_at?: string | null
          producer_id: string
          role: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          email?: string
          id?: string
          invite_token?: string | null
          invited_at?: string | null
          producer_id?: string
          role?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "producer_team_members_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producer_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          asaas_account_id: string | null
          asaas_account_key: string | null
          asaas_wallet_id: string | null
          avatar_url: string | null
          birth_date: string | null
          city: string | null
          cpf: string | null
          created_at: string | null
          full_name: string | null
          id: string
          organizer_banner_url: string | null
          organizer_bio: string | null
          organizer_facebook: string | null
          organizer_instagram: string | null
          organizer_logo_url: string | null
          organizer_slug: string | null
          organizer_website: string | null
          phone: string | null
          preferred_categories: string[] | null
          producer_status: Database["public"]["Enums"]["producer_status"] | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          asaas_account_id?: string | null
          asaas_account_key?: string | null
          asaas_wallet_id?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          organizer_banner_url?: string | null
          organizer_bio?: string | null
          organizer_facebook?: string | null
          organizer_instagram?: string | null
          organizer_logo_url?: string | null
          organizer_slug?: string | null
          organizer_website?: string | null
          phone?: string | null
          preferred_categories?: string[] | null
          producer_status?:
            | Database["public"]["Enums"]["producer_status"]
            | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          asaas_account_id?: string | null
          asaas_account_key?: string | null
          asaas_wallet_id?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          organizer_banner_url?: string | null
          organizer_bio?: string | null
          organizer_facebook?: string | null
          organizer_instagram?: string | null
          organizer_logo_url?: string | null
          organizer_slug?: string | null
          organizer_website?: string | null
          phone?: string | null
          preferred_categories?: string[] | null
          producer_status?:
            | Database["public"]["Enums"]["producer_status"]
            | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promoter_commissions: {
        Row: {
          commission_amount: number
          created_at: string | null
          event_id: string
          id: string
          order_amount: number
          order_id: string | null
          paid_at: string | null
          producer_id: string
          promoter_event_id: string
          promoter_id: string
          status: string
        }
        Insert: {
          commission_amount?: number
          created_at?: string | null
          event_id: string
          id?: string
          order_amount?: number
          order_id?: string | null
          paid_at?: string | null
          producer_id: string
          promoter_event_id: string
          promoter_id: string
          status?: string
        }
        Update: {
          commission_amount?: number
          created_at?: string | null
          event_id?: string
          id?: string
          order_amount?: number
          order_id?: string | null
          paid_at?: string | null
          producer_id?: string
          promoter_event_id?: string
          promoter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "promoter_commissions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_commissions_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_commissions_promoter_event_id_fkey"
            columns: ["promoter_event_id"]
            isOneToOne: false
            referencedRelation: "promoter_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_commissions_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_events: {
        Row: {
          clicks: number | null
          commission_total: number | null
          commission_type: string
          commission_value: number
          conversions: number | null
          created_at: string | null
          event_id: string
          id: string
          is_active: boolean | null
          producer_id: string
          promoter_id: string
          revenue_generated: number | null
          tracking_code: string
        }
        Insert: {
          clicks?: number | null
          commission_total?: number | null
          commission_type?: string
          commission_value?: number
          conversions?: number | null
          created_at?: string | null
          event_id: string
          id?: string
          is_active?: boolean | null
          producer_id: string
          promoter_id: string
          revenue_generated?: number | null
          tracking_code: string
        }
        Update: {
          clicks?: number | null
          commission_total?: number | null
          commission_type?: string
          commission_value?: number
          conversions?: number | null
          created_at?: string | null
          event_id?: string
          id?: string
          is_active?: boolean | null
          producer_id?: string
          promoter_id?: string
          revenue_generated?: number | null
          tracking_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "promoter_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_events_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_events_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      promoters: {
        Row: {
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          pix_key: string | null
          producer_id: string
          status: string
          total_commission_earned: number | null
          total_commission_paid: number | null
          total_sales: number | null
          updated_at: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          pix_key?: string | null
          producer_id: string
          status?: string
          total_commission_earned?: number | null
          total_commission_paid?: number | null
          total_sales?: number | null
          updated_at?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          pix_key?: string | null
          producer_id?: string
          status?: string
          total_commission_earned?: number | null
          total_commission_paid?: number | null
          total_sales?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promoters_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          count: number
          expires_at: string
          key: string
        }
        Insert: {
          count?: number
          expires_at: string
          key: string
        }
        Update: {
          count?: number
          expires_at?: string
          key?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number
          created_at: string | null
          gateway_refund_id: string | null
          id: string
          initiated_by: string | null
          order_id: string
          platform_fee_refunded: number | null
          reason: string | null
          status: string | null
          ticket_ids: string[] | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          gateway_refund_id?: string | null
          id?: string
          initiated_by?: string | null
          order_id: string
          platform_fee_refunded?: number | null
          reason?: string | null
          status?: string | null
          ticket_ids?: string[] | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          gateway_refund_id?: string | null
          id?: string
          initiated_by?: string | null
          order_id?: string
          platform_fee_refunded?: number | null
          reason?: string | null
          status?: string | null
          ticket_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "refunds_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      resale_listings: {
        Row: {
          asking_price: number
          buyer_id: string | null
          created_at: string | null
          event_id: string
          expires_at: string
          id: string
          original_price: number
          platform_fee_amount: number
          seller_id: string
          seller_receives: number
          sold_at: string | null
          status: string
          ticket_id: string
          tier_id: string
          updated_at: string | null
        }
        Insert: {
          asking_price: number
          buyer_id?: string | null
          created_at?: string | null
          event_id: string
          expires_at: string
          id?: string
          original_price?: number
          platform_fee_amount?: number
          seller_id: string
          seller_receives?: number
          sold_at?: string | null
          status?: string
          ticket_id: string
          tier_id: string
          updated_at?: string | null
        }
        Update: {
          asking_price?: number
          buyer_id?: string | null
          created_at?: string | null
          event_id?: string
          expires_at?: string
          id?: string
          original_price?: number
          platform_fee_amount?: number
          seller_id?: string
          seller_receives?: number
          sold_at?: string | null
          status?: string
          ticket_id?: string
          tier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resale_listings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resale_listings_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resale_listings_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_taxes_fees: {
        Row: {
          amount: number
          created_at: string | null
          event_id: string
          fee_type: string
          id: string
          is_passed_to_buyer: boolean | null
          name: string
          tier_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          event_id: string
          fee_type: string
          id?: string
          is_passed_to_buyer?: boolean | null
          name: string
          tier_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          event_id?: string
          fee_type?: string
          id?: string
          is_passed_to_buyer?: boolean | null
          name?: string
          tier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_taxes_fees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_taxes_fees_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_tiers: {
        Row: {
          capacity_group_id: string | null
          created_at: string | null
          description: string | null
          event_id: string
          id: string
          includes_items: string[] | null
          is_hidden_by_default: boolean | null
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
          unlock_code: string | null
          valid_dates: string[] | null
        }
        Insert: {
          capacity_group_id?: string | null
          created_at?: string | null
          description?: string | null
          event_id: string
          id?: string
          includes_items?: string[] | null
          is_hidden_by_default?: boolean | null
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
          unlock_code?: string | null
          valid_dates?: string[] | null
        }
        Update: {
          capacity_group_id?: string | null
          created_at?: string | null
          description?: string | null
          event_id?: string
          id?: string
          includes_items?: string[] | null
          is_hidden_by_default?: boolean | null
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
          unlock_code?: string | null
          valid_dates?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_tiers_capacity_group_id_fkey"
            columns: ["capacity_group_id"]
            isOneToOne: false
            referencedRelation: "capacity_groups"
            referencedColumns: ["id"]
          },
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
          half_price_doc_number: string | null
          half_price_doc_type: string | null
          id: string
          is_for_resale: boolean | null
          is_half_price: boolean | null
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
          half_price_doc_number?: string | null
          half_price_doc_type?: string | null
          id?: string
          is_for_resale?: boolean | null
          is_half_price?: boolean | null
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
          half_price_doc_number?: string | null
          half_price_doc_type?: string | null
          id?: string
          is_for_resale?: boolean | null
          is_half_price?: boolean | null
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
      virtual_queue: {
        Row: {
          admitted_at: string | null
          created_at: string | null
          event_id: string
          expires_at: string | null
          id: string
          position: number | null
          session_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          admitted_at?: string | null
          created_at?: string | null
          event_id: string
          expires_at?: string | null
          id?: string
          position?: number | null
          session_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          admitted_at?: string | null
          created_at?: string | null
          event_id?: string
          expires_at?: string | null
          id?: string
          position?: number | null
          session_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "virtual_queue_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
      webhook_deliveries: {
        Row: {
          attempts: number | null
          created_at: string | null
          delivered_at: string | null
          event_type: string
          id: string
          next_retry_at: string | null
          payload: Json
          response_body: string | null
          response_status: number | null
          webhook_id: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          delivered_at?: string | null
          event_type: string
          id?: string
          next_retry_at?: string | null
          payload: Json
          response_body?: string | null
          response_status?: number | null
          webhook_id: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          delivered_at?: string | null
          event_type?: string
          id?: string
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string | null
          event_id: string | null
          events: string[]
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          producer_id: string
          secret: string
          url: string
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          events: string[]
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          producer_id: string
          secret: string
          url: string
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          events?: string[]
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          producer_id?: string
          secret?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_producer_id_fkey"
            columns: ["producer_id"]
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
      apply_coupon: {
        Args: { p_coupon_id: string; p_order_id: string }
        Returns: boolean
      }
      cleanup_expired_reservations: { Args: never; Returns: undefined }
      confirm_checkin_analytics: {
        Args: { p_event_id: string }
        Returns: undefined
      }
      confirm_order_payment: {
        Args: {
          p_asaas_payment: string
          p_net_value: number
          p_order_id: string
        }
        Returns: boolean
      }
      create_order_validated: {
        Args: {
          p_buyer_id: string
          p_coupon_code?: string
          p_promoter_event_id?: string
          p_quantities: number[]
          p_tier_ids: string[]
        }
        Returns: Json
      }
      create_resale_listing_atomic: {
        Args: {
          p_asking_price: number
          p_event_id: string
          p_expires_at: string
          p_original_price: number
          p_seller_id: string
          p_ticket_id: string
          p_tier_id: string
        }
        Returns: Json
      }
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
      purchase_resale_atomic: {
        Args: {
          p_buyer_email: string
          p_buyer_id: string
          p_listing_id: string
          p_new_qr_code: string
          p_new_qr_image_url: string
        }
        Returns: Json
      }
      reserve_tickets: {
        Args: { p_order_id: string; p_quantity: number; p_tier_id: string }
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
