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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          reason?: string | null
        }
        Relationships: []
      }
      college_directory: {
        Row: {
          college_name: string
          college_type: string
          created_at: string
          district_name: string
          id: number
          search_text: string | null
          state_name: string
          university_name: string
        }
        Insert: {
          college_name: string
          college_type: string
          created_at?: string
          district_name: string
          id?: never
          search_text?: string | null
          state_name: string
          university_name: string
        }
        Update: {
          college_name?: string
          college_type?: string
          created_at?: string
          district_name?: string
          id?: never
          search_text?: string | null
          state_name?: string
          university_name?: string
        }
        Relationships: []
      }
      college_verifications: {
        Row: {
          college_email: string
          created_at: string
          document_purge_at: string | null
          email_domain: string
          id: string
          id_document_path: string | null
          method: string
          notes: string | null
          otp_code: string | null
          otp_expires_at: string | null
          otp_verified_at: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          user_id: string
          verification_method: string | null
        }
        Insert: {
          college_email: string
          created_at?: string
          document_purge_at?: string | null
          email_domain: string
          id?: string
          id_document_path?: string | null
          method?: string
          notes?: string | null
          otp_code?: string | null
          otp_expires_at?: string | null
          otp_verified_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id: string
          verification_method?: string | null
        }
        Update: {
          college_email?: string
          created_at?: string
          document_purge_at?: string | null
          email_domain?: string
          id?: string
          id_document_path?: string | null
          method?: string
          notes?: string | null
          otp_code?: string | null
          otp_expires_at?: string | null
          otp_verified_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id?: string
          verification_method?: string | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          buyer_id: string
          completed_at: string | null
          created_at: string
          id: string
          listing_id: string
          proposed_days: number | null
          proposed_start_date: string | null
          rental_end_date: string | null
          rental_start_date: string | null
          return_confirmed_at: string | null
          seller_id: string
          status: Database["public"]["Enums"]["deal_status"]
          updated_at: string
        }
        Insert: {
          buyer_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          listing_id: string
          proposed_days?: number | null
          proposed_start_date?: string | null
          rental_end_date?: string | null
          rental_start_date?: string | null
          return_confirmed_at?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["deal_status"]
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          proposed_days?: number | null
          proposed_start_date?: string | null
          rental_end_date?: string | null
          rental_start_date?: string | null
          return_confirmed_at?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["deal_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          condition: Database["public"]["Enums"]["listing_condition"]
          created_at: string
          department: string | null
          description: string | null
          hostel: string | null
          id: string
          image_url: string | null
          isbn: string | null
          listing_type: string
          material_type: string | null
          price: number
          rental_price_type: string | null
          security_deposit: number | null
          status: Database["public"]["Enums"]["listing_status"]
          subject: string | null
          title: string
          transaction_type: string
          updated_at: string
          user_id: string
          year_of_study: number | null
        }
        Insert: {
          condition: Database["public"]["Enums"]["listing_condition"]
          created_at?: string
          department?: string | null
          description?: string | null
          hostel?: string | null
          id?: string
          image_url?: string | null
          isbn?: string | null
          listing_type?: string
          material_type?: string | null
          price: number
          rental_price_type?: string | null
          security_deposit?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          subject?: string | null
          title: string
          transaction_type?: string
          updated_at?: string
          user_id: string
          year_of_study?: number | null
        }
        Update: {
          condition?: Database["public"]["Enums"]["listing_condition"]
          created_at?: string
          department?: string | null
          description?: string | null
          hostel?: string | null
          id?: string
          image_url?: string | null
          isbn?: string | null
          listing_type?: string
          material_type?: string | null
          price?: number
          rental_price_type?: string | null
          security_deposit?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          subject?: string | null
          title?: string
          transaction_type?: string
          updated_at?: string
          user_id?: string
          year_of_study?: number | null
        }
        Relationships: []
      }
      message_reads: {
        Row: {
          last_read_at: string
          thread_id: string
          user_id: string
        }
        Insert: {
          last_read_at?: string
          thread_id: string
          user_id: string
        }
        Update: {
          last_read_at?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reports: {
        Row: {
          created_at: string
          id: string
          message_id: string | null
          reason: string
          reported_user_id: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          thread_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message_id?: string | null
          reason: string
          reported_user_id: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          thread_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string | null
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reports_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          context_id: string
          context_type: string
          created_at: string
          id: string
          last_message_at: string | null
          participant_a: string
          participant_b: string
        }
        Insert: {
          context_id: string
          context_type: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_a: string
          participant_b: string
        }
        Update: {
          context_id?: string
          context_type?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_a?: string
          participant_b?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          recipient_id: string
          sender_id: string
          thread_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          recipient_id: string
          sender_id: string
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          recipient_id?: string
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          email_deal_accepted: boolean
          email_deal_cancelled: boolean
          email_deal_completed: boolean
          email_deal_declined: boolean
          email_deal_requested: boolean
          email_message_received: boolean
          email_rating_received: boolean
          email_tutor_request_received: boolean
          email_tutor_request_responded: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          email_deal_accepted?: boolean
          email_deal_cancelled?: boolean
          email_deal_completed?: boolean
          email_deal_declined?: boolean
          email_deal_requested?: boolean
          email_message_received?: boolean
          email_rating_received?: boolean
          email_tutor_request_received?: boolean
          email_tutor_request_responded?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          email_deal_accepted?: boolean
          email_deal_cancelled?: boolean
          email_deal_completed?: boolean
          email_deal_declined?: boolean
          email_deal_requested?: boolean
          email_message_received?: boolean
          email_rating_received?: boolean
          email_tutor_request_received?: boolean
          email_tutor_request_responded?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          deal_id: string | null
          id: string
          listing_id: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          deal_id?: string | null
          id?: string
          listing_id?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          deal_id?: string | null
          id?: string
          listing_id?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          college_domain: string | null
          college_email: string | null
          college_name: string | null
          created_at: string
          full_name: string | null
          id: string
          phone_number: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          college_domain?: string | null
          college_email?: string | null
          college_name?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone_number?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          college_domain?: string | null
          college_email?: string | null
          college_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone_number?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      rate_limit_attempts: {
        Row: {
          attempt_type: string
          created_at: string | null
          id: number
          user_id: string
        }
        Insert: {
          attempt_type: string
          created_at?: string | null
          id?: number
          user_id: string
        }
        Update: {
          attempt_type?: string
          created_at?: string | null
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          deal_id: string
          id: string
          rated_user_id: string
          rater_id: string
          score: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          deal_id: string
          id?: string
          rated_user_id: string
          rater_id: string
          score: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          deal_id?: string
          id?: string
          rated_user_id?: string
          rater_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      study_materials: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_available: boolean
          material_type: Database["public"]["Enums"]["material_type"]
          price: number
          subject: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          material_type: Database["public"]["Enums"]["material_type"]
          price?: number
          subject?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          material_type?: Database["public"]["Enums"]["material_type"]
          price?: number
          subject?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tutor_profiles: {
        Row: {
          availability: string | null
          bio: string | null
          created_at: string
          experience: string | null
          headline: string
          hourly_rate: number
          id: string
          image_url: string | null
          languages: string[] | null
          mode: string
          status: string
          subjects: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string | null
          bio?: string | null
          created_at?: string
          experience?: string | null
          headline: string
          hourly_rate: number
          id?: string
          image_url?: string | null
          languages?: string[] | null
          mode: string
          status?: string
          subjects: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string | null
          bio?: string | null
          created_at?: string
          experience?: string | null
          headline?: string
          hourly_rate?: number
          id?: string
          image_url?: string | null
          languages?: string[] | null
          mode?: string
          status?: string
          subjects?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tutor_session_requests: {
        Row: {
          created_at: string
          id: string
          learner_user_id: string
          message: string | null
          mode: string
          proposed_when: string | null
          responded_at: string | null
          status: string
          subject: string
          tutor_profile_id: string
          tutor_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          learner_user_id: string
          message?: string | null
          mode: string
          proposed_when?: string | null
          responded_at?: string | null
          status?: string
          subject: string
          tutor_profile_id: string
          tutor_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          learner_user_id?: string
          message?: string | null
          mode?: string
          proposed_when?: string | null
          responded_at?: string | null
          status?: string
          subject?: string
          tutor_profile_id?: string
          tutor_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_session_requests_tutor_profile_id_fkey"
            columns: ["tutor_profile_id"]
            isOneToOne: false
            referencedRelation: "tutor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_audit_log: {
        Row: {
          action: Database["public"]["Enums"]["verification_audit_action"]
          actor_user_id: string | null
          created_at: string
          id: string
          reason: string | null
          verification_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["verification_audit_action"]
          actor_user_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          verification_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["verification_audit_action"]
          actor_user_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_audit_log_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "college_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _canon_pair: {
        Args: { p1: string; p2: string }
        Returns: Record<string, unknown>
      }
      _is_blocked_either_way: {
        Args: { u1: string; u2: string }
        Returns: boolean
      }
      admin_decide_verification: {
        Args: {
          p_decision: string
          p_notif_body?: string
          p_notif_title?: string
          p_reason?: string
          p_verification_id: string
        }
        Returns: Json
      }
      admin_get_thread_messages: {
        Args: { p_thread_id: string }
        Returns: {
          body: string
          created_at: string
          id: string
          recipient_id: string
          sender_id: string
          thread_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      block_user: {
        Args: { p_reason?: string; p_user_id: string }
        Returns: undefined
      }
      create_notification: {
        Args: {
          p_body: string
          p_deal_id?: string
          p_listing_id?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      get_all_notifications: {
        Args: never
        Returns: {
          body: string
          created_at: string
          deal_id: string | null
          id: string
          listing_id: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "notifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_deal_contact_phone: { Args: { p_deal_id: string }; Returns: string }
      get_notification_prefs: {
        Args: { p_user_id: string }
        Returns: {
          email_deal_accepted: boolean
          email_deal_cancelled: boolean
          email_deal_completed: boolean
          email_deal_declined: boolean
          email_deal_requested: boolean
          email_message_received: boolean
          email_rating_received: boolean
          email_tutor_request_received: boolean
          email_tutor_request_responded: boolean
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "notification_preferences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_own_phone: { Args: never; Returns: string }
      get_unread_notifications: {
        Args: never
        Returns: {
          body: string
          created_at: string
          deal_id: string | null
          id: string
          listing_id: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "notifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_email: { Args: { p_user_id: string }; Returns: string }
      get_user_threads: {
        Args: never
        Returns: {
          context_id: string
          context_type: string
          counterpart_id: string
          is_blocked: boolean
          last_message_at: string
          last_message_body: string
          last_message_sender: string
          thread_id: string
          unread_count: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      log_verification_document_upload: {
        Args: { p_verification_id: string }
        Returns: undefined
      }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: undefined
      }
      mark_notifications_read: { Args: never; Returns: undefined }
      mark_thread_read: { Args: { p_thread_id: string }; Returns: undefined }
      report_message: {
        Args: { p_message_id: string; p_reason: string; p_thread_id: string }
        Returns: string
      }
      send_message: {
        Args: { p_body: string; p_thread_id: string }
        Returns: {
          body: string
          created_at: string
          id: string
          recipient_id: string
          sender_id: string
          thread_id: string
        }
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      start_or_get_thread: {
        Args: { p_context_id: string; p_context_type: string }
        Returns: {
          context_id: string
          context_type: string
          created_at: string
          id: string
          last_message_at: string | null
          participant_a: string
          participant_b: string
        }
        SetofOptions: {
          from: "*"
          to: "message_threads"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      unblock_user: { Args: { p_user_id: string }; Returns: undefined }
      verify_student_otp: { Args: { p_otp: string }; Returns: Json }
    }
    Enums: {
      deal_status: "pending" | "accepted" | "completed" | "cancelled"
      listing_condition: "new" | "good" | "used"
      listing_status: "active" | "reserved" | "sold" | "archived"
      material_type: "notes" | "pyq" | "pdf" | "rental"
      verification_audit_action:
        | "approved"
        | "rejected"
        | "requested_changes"
        | "viewed"
        | "note_added"
        | "document_purged"
        | "document_uploaded"
      verification_status: "pending" | "verified" | "rejected"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      deal_status: ["pending", "accepted", "completed", "cancelled"],
      listing_condition: ["new", "good", "used"],
      listing_status: ["active", "reserved", "sold", "archived"],
      material_type: ["notes", "pyq", "pdf", "rental"],
      verification_audit_action: [
        "approved",
        "rejected",
        "requested_changes",
        "viewed",
        "note_added",
        "document_purged",
        "document_uploaded",
      ],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
