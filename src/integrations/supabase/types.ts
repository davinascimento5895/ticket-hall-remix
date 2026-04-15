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
      certificate_participant_prefs: {
        Row: {
          consent_cpf: boolean | null
          created_at: string | null
          event_id: string
          id: string
          opt_out: boolean | null
          preferred_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          consent_cpf?: boolean | null
          created_at?: string | null
          event_id: string
          id?: string
          opt_out?: boolean | null
          preferred_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          consent_cpf?: boolean | null
          created_at?: string | null
          event_id?: string
          id?: string
          opt_out?: boolean | null
          preferred_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_participant_prefs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_signers: {
        Row: {
          created_at: string | null
          display_order: number | null
          event_id: string
          id: string
          name: string
          role: string | null
          signature_url: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          event_id: string
          id?: string
          name: string
          role?: string | null
          signature_url?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          event_id?: string
          id?: string
          name?: string
          role?: string | null
          signature_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificate_signers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_templates: {
        Row: {
          created_at: string | null
          default_config: Json | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          default_config?: Json | null
          description?: string | null
          id: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          default_config?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
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
          linkedin_url: string | null
          previous_version_id: string | null
          qr_code_url: string | null
          revoked_at: string | null
          revoked_by: string | null
          revoked_reason: string | null
          ticket_id: string
          user_id: string
          version: number | null
          workload_hours: number | null
        }
        Insert: {
          attendee_name: string
          certificate_code: string
          created_at?: string | null
          download_url?: string | null
          event_id: string
          id?: string
          issued_at?: string | null
          linkedin_url?: string | null
          previous_version_id?: string | null
          qr_code_url?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          ticket_id: string
          user_id: string
          version?: number | null
          workload_hours?: number | null
        }
        Update: {
          attendee_name?: string
          certificate_code?: string
          created_at?: string | null
          download_url?: string | null
          event_id?: string
          id?: string
          issued_at?: string | null
          linkedin_url?: string | null
          previous_version_id?: string | null
          qr_code_url?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          ticket_id?: string
          user_id?: string
          version?: number | null
          workload_hours?: number | null
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
            foreignKeyName: "certificates_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "certificates_with_event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "valid_certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "checkin_details"
            referencedColumns: ["ticket_id"]
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
          checkin_list_name: string | null
          device_id: string | null
          half_price_doc_number: string | null
          half_price_doc_verified: boolean | null
          id: string
          operator_email: string | null
          operator_name: string | null
          qr_code_scanned: string
          result: string
          scanned_at: string | null
          scanned_by: string | null
          ticket_id: string | null
          verification_method: string | null
        }
        Insert: {
          checkin_list_id?: string | null
          checkin_list_name?: string | null
          device_id?: string | null
          half_price_doc_number?: string | null
          half_price_doc_verified?: boolean | null
          id?: string
          operator_email?: string | null
          operator_name?: string | null
          qr_code_scanned: string
          result: string
          scanned_at?: string | null
          scanned_by?: string | null
          ticket_id?: string | null
          verification_method?: string | null
        }
        Update: {
          checkin_list_id?: string | null
          checkin_list_name?: string | null
          device_id?: string | null
          half_price_doc_number?: string | null
          half_price_doc_verified?: boolean | null
          id?: string
          operator_email?: string | null
          operator_name?: string | null
          qr_code_scanned?: string
          result?: string
          scanned_at?: string | null
          scanned_by?: string | null
          ticket_id?: string | null
          verification_method?: string | null
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
            referencedRelation: "checkin_details"
            referencedColumns: ["ticket_id"]
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
            referencedRelation: "checkin_details"
            referencedColumns: ["ticket_id"]
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
      event_staff: {
        Row: {
          assigned_at: string | null
          checkin_list_id: string | null
          event_id: string
          id: string
          producer_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          checkin_list_id?: string | null
          event_id: string
          id?: string
          producer_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          checkin_list_id?: string | null
          event_id?: string
          id?: string
          producer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_staff_checkin_list_id_fkey"
            columns: ["checkin_list_id"]
            isOneToOne: false
            referencedRelation: "checkin_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_staff_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          allow_resale: boolean | null
          banner_image_url: string | null
          category: string | null
          certificate_colors: Json | null
          certificate_config: Json | null
          certificate_fields: Json | null
          certificate_template: string | null
          certificate_text_config: Json | null
          cover_image_url: string | null
          created_at: string | null
          custom_background_url: string | null
          description: string | null
          doors_open_time: string | null
          end_date: string
          half_price_accepted_documents: string[] | null
          half_price_enabled: boolean | null
          half_price_require_document: boolean | null
          half_price_show_badge_checkin: boolean | null
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
          online_platform: string | null
          online_url: string | null
          platform_fee_percent: number | null
          producer_id: string
          queue_capacity: number | null
          resale_end_date: string | null
          resale_max_price_percent: number | null
          resale_min_price_percent: number | null
          resale_start_date: string | null
          seat_map_config: Json | null
          selected_template_id: string | null
          slug: string
          staff_access_code: string | null
          staff_link_expires_at: string | null
          staff_link_max_uses: number | null
          staff_link_uses: number | null
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
          visibility: string | null
        }
        Insert: {
          allow_resale?: boolean | null
          banner_image_url?: string | null
          category?: string | null
          certificate_colors?: Json | null
          certificate_config?: Json | null
          certificate_fields?: Json | null
          certificate_template?: string | null
          certificate_text_config?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          custom_background_url?: string | null
          description?: string | null
          doors_open_time?: string | null
          end_date: string
          half_price_accepted_documents?: string[] | null
          half_price_enabled?: boolean | null
          half_price_require_document?: boolean | null
          half_price_show_badge_checkin?: boolean | null
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
          online_platform?: string | null
          online_url?: string | null
          platform_fee_percent?: number | null
          producer_id: string
          queue_capacity?: number | null
          resale_end_date?: string | null
          resale_max_price_percent?: number | null
          resale_min_price_percent?: number | null
          resale_start_date?: string | null
          seat_map_config?: Json | null
          selected_template_id?: string | null
          slug: string
          staff_access_code?: string | null
          staff_link_expires_at?: string | null
          staff_link_max_uses?: number | null
          staff_link_uses?: number | null
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
          visibility?: string | null
        }
        Update: {
          allow_resale?: boolean | null
          banner_image_url?: string | null
          category?: string | null
          certificate_colors?: Json | null
          certificate_config?: Json | null
          certificate_fields?: Json | null
          certificate_template?: string | null
          certificate_text_config?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          custom_background_url?: string | null
          description?: string | null
          doors_open_time?: string | null
          end_date?: string
          half_price_accepted_documents?: string[] | null
          half_price_enabled?: boolean | null
          half_price_require_document?: boolean | null
          half_price_show_badge_checkin?: boolean | null
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
          online_platform?: string | null
          online_url?: string | null
          platform_fee_percent?: number | null
          producer_id?: string
          queue_capacity?: number | null
          resale_end_date?: string | null
          resale_max_price_percent?: number | null
          resale_min_price_percent?: number | null
          resale_start_date?: string | null
          seat_map_config?: Json | null
          selected_template_id?: string | null
          slug?: string
          staff_access_code?: string | null
          staff_link_expires_at?: string | null
          staff_link_max_uses?: number | null
          staff_link_uses?: number | null
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
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_selected_template_id_fkey"
            columns: ["selected_template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
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
      financial_categories: {
        Row: {
          created_at: string | null
          id: string
          label: string
          producer_id: string
          type: string
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          label: string
          producer_id: string
          type: string
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          label?: string
          producer_id?: string
          type?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_categories_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      half_price_reports: {
        Row: {
          by_disability_id: number | null
          by_id_jovem: number | null
          by_senior_id: number | null
          by_student_id: number | null
          created_at: string | null
          details: Json | null
          event_id: string
          id: string
          producer_id: string
          report_date: string | null
          total_half_price_checked_in: number | null
          total_half_price_sold: number | null
          total_half_price_verified: number | null
          updated_at: string | null
        }
        Insert: {
          by_disability_id?: number | null
          by_id_jovem?: number | null
          by_senior_id?: number | null
          by_student_id?: number | null
          created_at?: string | null
          details?: Json | null
          event_id: string
          id?: string
          producer_id: string
          report_date?: string | null
          total_half_price_checked_in?: number | null
          total_half_price_sold?: number | null
          total_half_price_verified?: number | null
          updated_at?: string | null
        }
        Update: {
          by_disability_id?: number | null
          by_id_jovem?: number | null
          by_senior_id?: number | null
          by_student_id?: number | null
          created_at?: string | null
          details?: Json | null
          event_id?: string
          id?: string
          producer_id?: string
          report_date?: string | null
          total_half_price_checked_in?: number | null
          total_half_price_sold?: number | null
          total_half_price_verified?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "half_price_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
      notification_preferences: {
        Row: {
          category: string
          created_at: string | null
          email: boolean
          id: string
          push: boolean
          sms: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          email?: boolean
          id?: string
          push?: boolean
          sms?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          email?: boolean
          id?: string
          push?: boolean
          sms?: boolean
          updated_at?: string | null
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
      participant_certificate_prefs: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          opt_out: boolean | null
          preferred_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          opt_out?: boolean | null
          preferred_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          opt_out?: boolean | null
          preferred_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participant_certificate_prefs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_events: {
        Row: {
          attempt_count: number
          created_at: string
          event_type: string
          external_reference: string | null
          failure_reason: string | null
          first_received_at: string
          id: string
          last_received_at: string
          payload: Json
          payment_id: string
          processed_at: string | null
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          event_type: string
          external_reference?: string | null
          failure_reason?: string | null
          first_received_at?: string
          id?: string
          last_received_at?: string
          payload?: Json
          payment_id: string
          processed_at?: string | null
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          event_type?: string
          external_reference?: string | null
          failure_reason?: string | null
          first_received_at?: string
          id?: string
          last_received_at?: string
          payload?: Json
          payment_id?: string
          processed_at?: string | null
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      producer_balance_history: {
        Row: {
          amount: number
          balance_available_after: number | null
          balance_locked_after: number | null
          created_at: string | null
          description: string
          direction: string
          event_id: string | null
          id: string
          metadata: Json | null
          movement_type: string
          producer_id: string
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          amount: number
          balance_available_after?: number | null
          balance_locked_after?: number | null
          created_at?: string | null
          description: string
          direction: string
          event_id?: string | null
          id?: string
          metadata?: Json | null
          movement_type: string
          producer_id: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          amount?: number
          balance_available_after?: number | null
          balance_locked_after?: number | null
          created_at?: string | null
          description?: string
          direction?: string
          event_id?: string | null
          id?: string
          metadata?: Json | null
          movement_type?: string
          producer_id?: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "producer_balance_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      producer_balances: {
        Row: {
          available_before_event: number | null
          created_at: string | null
          event_id: string | null
          id: string
          locked_after_event: number | null
          other_deductions: number | null
          pending_withdrawal: number | null
          producer_id: string
          total_chargebacks: number | null
          total_gateway_fees: number | null
          total_platform_fees: number | null
          total_revenue: number | null
          total_withdrawn: number | null
          updated_at: string | null
        }
        Insert: {
          available_before_event?: number | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          locked_after_event?: number | null
          other_deductions?: number | null
          pending_withdrawal?: number | null
          producer_id: string
          total_chargebacks?: number | null
          total_gateway_fees?: number | null
          total_platform_fees?: number | null
          total_revenue?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
        }
        Update: {
          available_before_event?: number | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          locked_after_event?: number | null
          other_deductions?: number | null
          pending_withdrawal?: number | null
          producer_id?: string
          total_chargebacks?: number | null
          total_gateway_fees?: number | null
          total_platform_fees?: number | null
          total_revenue?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "producer_balances_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      producer_follows: {
        Row: {
          created_at: string
          id: string
          producer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          producer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          producer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "producer_follows_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      producer_messages: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          is_read: boolean
          is_urgent: boolean
          message: string
          producer_id: string
          replied_at: string | null
          sender_email: string
          sender_id: string
          sender_name: string
          subject: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          is_read?: boolean
          is_urgent?: boolean
          message: string
          producer_id: string
          replied_at?: string | null
          sender_email: string
          sender_id: string
          sender_name: string
          subject: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          is_read?: boolean
          is_urgent?: boolean
          message?: string
          producer_id?: string
          replied_at?: string | null
          sender_email?: string
          sender_id?: string
          sender_name?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "producer_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producer_messages_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      producer_withdrawals: {
        Row: {
          account_name: string | null
          account_number: string | null
          admin_notes: string | null
          agency: string | null
          amount: number
          balance_snapshot: Json | null
          bank_account_id: string | null
          bank_name: string | null
          event_id: string | null
          expected_payment_date: string | null
          id: string
          paid_at: string | null
          pix_key: string | null
          pix_key_type: string | null
          processed_at: string | null
          processed_by: string | null
          producer_id: string
          producer_notes: string | null
          receipt_url: string | null
          rejection_reason: string | null
          requested_at: string | null
          status: string | null
          withdrawal_type: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          admin_notes?: string | null
          agency?: string | null
          amount: number
          balance_snapshot?: Json | null
          bank_account_id?: string | null
          bank_name?: string | null
          event_id?: string | null
          expected_payment_date?: string | null
          id?: string
          paid_at?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          processed_at?: string | null
          processed_by?: string | null
          producer_id: string
          producer_notes?: string | null
          receipt_url?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          status?: string | null
          withdrawal_type: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          admin_notes?: string | null
          agency?: string | null
          amount?: number
          balance_snapshot?: Json | null
          bank_account_id?: string | null
          bank_name?: string | null
          event_id?: string | null
          expected_payment_date?: string | null
          id?: string
          paid_at?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          processed_at?: string | null
          processed_by?: string | null
          producer_id?: string
          producer_notes?: string | null
          receipt_url?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          status?: string | null
          withdrawal_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "producer_withdrawals_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producer_withdrawals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          product_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          product_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "event_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          product_id: string
          sort_order: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          product_id: string
          sort_order?: number | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          product_id?: string
          sort_order?: number | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "event_products"
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
          cnpj: string | null
          created_at: string | null
          document_number: string | null
          document_type: string
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
          cnpj?: string | null
          created_at?: string | null
          document_number?: string | null
          document_type?: string
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
          cnpj?: string | null
          created_at?: string | null
          document_number?: string | null
          document_type?: string
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
          cancelled_reason: string | null
          created_at: string | null
          event_id: string
          expires_at: string
          id: string
          original_price: number
          platform_fee_amount: number
          reserved_by: string | null
          reserved_until: string | null
          seller_id: string
          seller_receives: number
          sold_at: string | null
          sold_order_id: string | null
          status: string
          ticket_id: string
          tier_id: string
          updated_at: string | null
        }
        Insert: {
          asking_price: number
          buyer_id?: string | null
          cancelled_reason?: string | null
          created_at?: string | null
          event_id: string
          expires_at: string
          id?: string
          original_price?: number
          platform_fee_amount?: number
          reserved_by?: string | null
          reserved_until?: string | null
          seller_id: string
          seller_receives?: number
          sold_at?: string | null
          sold_order_id?: string | null
          status?: string
          ticket_id: string
          tier_id: string
          updated_at?: string | null
        }
        Update: {
          asking_price?: number
          buyer_id?: string | null
          cancelled_reason?: string | null
          created_at?: string | null
          event_id?: string
          expires_at?: string
          id?: string
          original_price?: number
          platform_fee_amount?: number
          reserved_by?: string | null
          reserved_until?: string | null
          seller_id?: string
          seller_receives?: number
          sold_at?: string | null
          sold_order_id?: string | null
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
            foreignKeyName: "resale_listings_sold_order_id_fkey"
            columns: ["sold_order_id"]
            isOneToOne: false
            referencedRelation: "resale_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resale_listings_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "checkin_details"
            referencedColumns: ["ticket_id"]
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
      resale_orders: {
        Row: {
          amount_gross: number
          asaas_payment_id: string | null
          asaas_payment_status: string | null
          boleto_barcode: string | null
          boleto_url: string | null
          buyer_id: string
          cancelled_at: string | null
          chargeback_at: string | null
          created_at: string
          event_id: string
          expires_at: string | null
          failure_reason: string | null
          id: string
          listing_id: string
          metadata: Json
          paid_at: string | null
          payment_method: string | null
          pix_qr_code: string | null
          pix_qr_code_image: string | null
          platform_fee_amount: number
          refunded_at: string | null
          seller_id: string
          seller_net_amount: number
          settled_at: string | null
          status: string
          ticket_id: string
          updated_at: string
          wallet_credit_amount: number
        }
        Insert: {
          amount_gross?: number
          asaas_payment_id?: string | null
          asaas_payment_status?: string | null
          boleto_barcode?: string | null
          boleto_url?: string | null
          buyer_id: string
          cancelled_at?: string | null
          chargeback_at?: string | null
          created_at?: string
          event_id: string
          expires_at?: string | null
          failure_reason?: string | null
          id?: string
          listing_id: string
          metadata?: Json
          paid_at?: string | null
          payment_method?: string | null
          pix_qr_code?: string | null
          pix_qr_code_image?: string | null
          platform_fee_amount?: number
          refunded_at?: string | null
          seller_id: string
          seller_net_amount?: number
          settled_at?: string | null
          status?: string
          ticket_id: string
          updated_at?: string
          wallet_credit_amount?: number
        }
        Update: {
          amount_gross?: number
          asaas_payment_id?: string | null
          asaas_payment_status?: string | null
          boleto_barcode?: string | null
          boleto_url?: string | null
          buyer_id?: string
          cancelled_at?: string | null
          chargeback_at?: string | null
          created_at?: string
          event_id?: string
          expires_at?: string | null
          failure_reason?: string | null
          id?: string
          listing_id?: string
          metadata?: Json
          paid_at?: string | null
          payment_method?: string | null
          pix_qr_code?: string | null
          pix_qr_code_image?: string | null
          platform_fee_amount?: number
          refunded_at?: string | null
          seller_id?: string
          seller_net_amount?: number
          settled_at?: string | null
          status?: string
          ticket_id?: string
          updated_at?: string
          wallet_credit_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "resale_orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resale_orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resale_orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "resale_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resale_orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resale_orders_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "checkin_details"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "resale_orders_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
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
          half_price_verified_at: string | null
          half_price_verified_by: string | null
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
          half_price_verified_at?: string | null
          half_price_verified_by?: string | null
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
          half_price_verified_at?: string | null
          half_price_verified_by?: string | null
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
      user_wallets: {
        Row: {
          available_balance: number
          created_at: string
          locked_balance: number
          pending_balance: number
          total_earned: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_balance?: number
          created_at?: string
          locked_balance?: number
          pending_balance?: number
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_balance?: number
          created_at?: string
          locked_balance?: number
          pending_balance?: number
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      wallet_ledger: {
        Row: {
          amount: number
          available_at: string | null
          balance_bucket: string
          created_at: string
          description: string
          direction: string
          id: string
          metadata: Json
          reference_id: string | null
          reference_type: string
          status: string
          updated_at: string
          user_id: string
          wallet_tx_type: string
        }
        Insert: {
          amount: number
          available_at?: string | null
          balance_bucket: string
          created_at?: string
          description: string
          direction: string
          id?: string
          metadata?: Json
          reference_id?: string | null
          reference_type: string
          status?: string
          updated_at?: string
          user_id: string
          wallet_tx_type: string
        }
        Update: {
          amount?: number
          available_at?: string | null
          balance_bucket?: string
          created_at?: string
          description?: string
          direction?: string
          id?: string
          metadata?: Json
          reference_id?: string | null
          reference_type?: string
          status?: string
          updated_at?: string
          user_id?: string
          wallet_tx_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          completed_at: string | null
          created_at: string | null
          description: string
          direction: string
          id: string
          metadata: Json | null
          reference_id: string | null
          reference_type: string | null
          status: string | null
          tx_type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          completed_at?: string | null
          created_at?: string | null
          description: string
          direction: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          tx_type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          completed_at?: string | null
          created_at?: string | null
          description?: string
          direction?: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          tx_type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_withdrawals: {
        Row: {
          admin_notes: string | null
          amount: number
          asaas_transfer_id: string | null
          created_at: string
          expected_payment_date: string | null
          failure_reason: string | null
          fee_amount: number
          id: string
          metadata: Json
          net_amount: number
          paid_at: string | null
          pix_key: string
          pix_key_type: string | null
          processed_at: string | null
          processed_by: string | null
          receipt_url: string | null
          requested_at: string
          status: string
          updated_at: string
          user_id: string
          wallet_transaction_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          asaas_transfer_id?: string | null
          created_at?: string
          expected_payment_date?: string | null
          failure_reason?: string | null
          fee_amount?: number
          id?: string
          metadata?: Json
          net_amount: number
          paid_at?: string | null
          pix_key: string
          pix_key_type?: string | null
          processed_at?: string | null
          processed_by?: string | null
          receipt_url?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
          user_id: string
          wallet_transaction_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          asaas_transfer_id?: string | null
          created_at?: string
          expected_payment_date?: string | null
          failure_reason?: string | null
          fee_amount?: number
          id?: string
          metadata?: Json
          net_amount?: number
          paid_at?: string | null
          pix_key?: string
          pix_key_type?: string | null
          processed_at?: string | null
          processed_by?: string | null
          receipt_url?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
          user_id?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_withdrawals_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          available_balance: number | null
          id: string
          locked_balance: number | null
          pending_balance: number | null
          total_earned: number | null
          total_withdrawn: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          available_balance?: number | null
          id?: string
          locked_balance?: number | null
          pending_balance?: number | null
          total_earned?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          available_balance?: number | null
          id?: string
          locked_balance?: number | null
          pending_balance?: number | null
          total_earned?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      certificates_with_event: {
        Row: {
          attendee_name: string | null
          certificate_code: string | null
          created_at: string | null
          download_url: string | null
          event_end_date: string | null
          event_id: string | null
          event_start_date: string | null
          event_title: string | null
          event_venue: string | null
          id: string | null
          issued_at: string | null
          linkedin_url: string | null
          participant_email: string | null
          participant_full_name: string | null
          previous_version_id: string | null
          qr_code_url: string | null
          revoked_at: string | null
          revoked_by: string | null
          revoked_reason: string | null
          ticket_id: string | null
          user_id: string | null
          version: number | null
          workload_hours: number | null
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
            foreignKeyName: "certificates_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "certificates_with_event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "valid_certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "checkin_details"
            referencedColumns: ["ticket_id"]
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
      checkin_details: {
        Row: {
          attendee_email: string | null
          attendee_name: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          event_date: string | null
          event_id: string | null
          event_title: string | null
          half_price_doc_number: string | null
          half_price_doc_type: string | null
          half_price_verified_at: string | null
          half_price_verified_by: string | null
          is_half_price: boolean | null
          last_scan_at: string | null
          last_scan_result: string | null
          operator_email: string | null
          operator_name: string | null
          ticket_id: string | null
          ticket_status: string | null
          tier_id: string | null
          tier_name: string | null
          verification_method: string | null
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
            foreignKeyName: "tickets_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      producer_financial_summary: {
        Row: {
          available_now: number | null
          event_date: string | null
          event_id: string | null
          event_status: string | null
          event_title: string | null
          locked_until_event: number | null
          pending_withdrawal: number | null
          producer_id: string | null
          projected_total: number | null
          release_status: string | null
          total_chargebacks: number | null
          total_gateway_fees: number | null
          total_platform_fees: number | null
          total_revenue: number | null
          total_withdrawn: number | null
        }
        Relationships: [
          {
            foreignKeyName: "producer_balances_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      valid_certificates: {
        Row: {
          attendee_name: string | null
          certificate_code: string | null
          created_at: string | null
          download_url: string | null
          event_end_date: string | null
          event_id: string | null
          event_start_date: string | null
          event_title: string | null
          event_venue: string | null
          id: string | null
          issued_at: string | null
          linkedin_url: string | null
          participant_email: string | null
          participant_full_name: string | null
          previous_version_id: string | null
          qr_code_url: string | null
          revoked_at: string | null
          revoked_by: string | null
          revoked_reason: string | null
          ticket_id: string | null
          user_id: string | null
          version: number | null
          workload_hours: number | null
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
            foreignKeyName: "certificates_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "certificates_with_event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "valid_certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "checkin_details"
            referencedColumns: ["ticket_id"]
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
    }
    Functions: {
      admin_force_delete_event: {
        Args: { p_event_id: string }
        Returns: undefined
      }
      apply_coupon: {
        Args: { p_coupon_id: string; p_order_id: string }
        Returns: boolean
      }
      calculate_producer_balance: {
        Args: { p_event_id: string; p_producer_id: string }
        Returns: Json
      }
      calculate_withdrawal_fee: { Args: { p_amount: number }; Returns: number }
      can_access_financial: {
        Args: { p_producer_id: string }
        Returns: boolean
      }
      cleanup_expired_resale_listings: { Args: never; Returns: number }
      cleanup_expired_resale_orders: { Args: never; Returns: number }
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
          p_billing_address?: string
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
      create_resale_order_atomic: {
        Args: {
          p_buyer_id: string
          p_listing_id: string
          p_payment_method: string
          p_reservation_minutes?: number
        }
        Returns: Json
      }
      ensure_user_wallet: { Args: { p_user_id: string }; Returns: undefined }
      finalize_wallet_withdrawal_atomic: {
        Args: {
          p_asaas_transfer_id?: string
          p_failure_reason?: string
          p_success: boolean
          p_withdrawal_id: string
        }
        Returns: Json
      }
      generate_certificate_code: { Args: never; Returns: string }
      get_or_create_wallet: {
        Args: { p_user_id: string }
        Returns: {
          available_balance: number | null
          id: string
          locked_balance: number | null
          pending_balance: number | null
          total_earned: number | null
          total_withdrawn: number | null
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "wallets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_preferred_certificate_name: {
        Args: { p_default_name?: string; p_event_id: string; p_user_id: string }
        Returns: string
      }
      get_team_member_role: {
        Args: { p_producer_id: string; p_user_id: string }
        Returns: string
      }
      get_user_id_by_email: { Args: { p_email: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_opted_out_certificate: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_event_views: {
        Args: { p_event_id: string }
        Returns: undefined
      }
      increment_promoter_clicks: {
        Args: { p_promoter_event_id: string }
        Returns: undefined
      }
      is_certificate_code_valid: {
        Args: { p_code: string }
        Returns: {
          certificate_id: string
          event_id: string
          revoked: boolean
          valid: boolean
        }[]
      }
      is_certificate_valid: { Args: { cert_id: string }; Returns: boolean }
      join_event_as_staff: { Args: { p_access_code: string }; Returns: Json }
      mark_payment_webhook_event_failed: {
        Args: { p_event_id: string; p_failure_reason?: string }
        Returns: undefined
      }
      mark_payment_webhook_event_processed: {
        Args: { p_event_id: string }
        Returns: undefined
      }
      process_producer_withdrawal: {
        Args: {
          p_admin_id: string
          p_rejection_reason?: string
          p_status: string
          p_withdrawal_id: string
        }
        Returns: Json
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
      register_payment_webhook_event: {
        Args: {
          p_event_type: string
          p_external_reference: string
          p_payload?: Json
          p_payment_id: string
          p_provider: string
        }
        Returns: Json
      }
      release_producer_balance_after_event: {
        Args: { p_event_id: string }
        Returns: Json
      }
      release_wallet_credits_due: { Args: never; Returns: number }
      request_producer_withdrawal: {
        Args: {
          p_amount: number
          p_bank_account_id: string
          p_event_id: string
          p_producer_id: string
        }
        Returns: Json
      }
      request_wallet_withdrawal_atomic: {
        Args: {
          p_amount: number
          p_pix_key: string
          p_pix_key_type?: string
          p_user_id: string
        }
        Returns: Json
      }
      reserve_tickets: {
        Args: { p_order_id: string; p_quantity: number; p_tier_id: string }
        Returns: boolean
      }
      reverse_resale_order_atomic: {
        Args: { p_reason?: string; p_resale_order_id: string }
        Returns: Json
      }
      revoke_certificate: {
        Args: { p_cert_id: string; p_reason: string; p_revoked_by: string }
        Returns: boolean
      }
      settle_resale_order_atomic: {
        Args: {
          p_asaas_payment_id: string
          p_asaas_payment_status: string
          p_buyer_email: string
          p_new_qr_code: string
          p_new_qr_image_url: string
          p_paid_at?: string
          p_resale_order_id: string
        }
        Returns: Json
      }
      update_half_price_report: {
        Args: { p_event_id: string }
        Returns: undefined
      }
      validate_unlock_code: {
        Args: { p_code: string; p_event_id: string }
        Returns: string[]
      }
      wallet_debit_available_atomic: {
        Args: {
          p_amount: number
          p_description?: string
          p_reference_id: string
          p_user_id: string
        }
        Returns: Json
      }
      wallet_refund_available_atomic: {
        Args: {
          p_amount: number
          p_description?: string
          p_reference_id: string
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "producer" | "buyer" | "staff"
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
      app_role: ["admin", "producer", "buyer", "staff"],
      producer_status: ["pending", "approved", "rejected", "suspended"],
    },
  },
} as const
