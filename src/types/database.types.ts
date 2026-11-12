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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string
          actor_user_id: string | null
          after_summary: Json | null
          before_summary: Json | null
          created_at: string
          id: string
          request_id: string | null
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_summary?: Json | null
          before_summary?: Json | null
          created_at?: string
          id?: string
          request_id?: string | null
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_summary?: Json | null
          before_summary?: Json | null
          created_at?: string
          id?: string
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: []
      }
      consent_records: {
        Row: {
          consent_type: string
          granted_at: string
          id: string
          notice_version: string
          source: string
          user_id: string | null
          withdrawn_at: string | null
        }
        Insert: {
          consent_type: string
          granted_at?: string
          id?: string
          notice_version: string
          source: string
          user_id?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          consent_type?: string
          granted_at?: string
          id?: string
          notice_version?: string
          source?: string
          user_id?: string | null
          withdrawn_at?: string | null
        }
        Relationships: []
      }
      document_access_events: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          document_id: string
          id: string
          purpose: string
          request_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          document_id: string
          id?: string
          purpose: string
          request_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          document_id?: string
          id?: string
          purpose?: string
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_access_events_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "private_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          consent_version: string
          contact_name: string
          created_at: string
          email_normalized: string
          id: string
          listing_id: string | null
          message: string
          phone: string | null
          requester_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          consent_version: string
          contact_name: string
          created_at?: string
          email_normalized: string
          id?: string
          listing_id?: string | null
          message: string
          phone?: string | null
          requester_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          consent_version?: string
          contact_name?: string
          created_at?: string
          email_normalized?: string
          id?: string
          listing_id?: string | null
          message?: string
          phone?: string | null
          requester_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "property_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_private_details: {
        Row: {
          access_notes: string | null
          created_at: string
          exact_address: string | null
          latitude: number | null
          listing_id: string
          longitude: number | null
          owner_user_id: string
          updated_at: string
        }
        Insert: {
          access_notes?: string | null
          created_at?: string
          exact_address?: string | null
          latitude?: number | null
          listing_id: string
          longitude?: number | null
          owner_user_id: string
          updated_at?: string
        }
        Update: {
          access_notes?: string | null
          created_at?: string
          exact_address?: string | null
          latitude?: number | null
          listing_id?: string
          longitude?: number | null
          owner_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_private_details_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "property_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_status_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          from_status: string | null
          id: string
          listing_id: string
          reason: string | null
          reason_code: string | null
          request_id: string | null
          to_status: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          listing_id: string
          reason?: string | null
          reason_code?: string | null
          request_id?: string | null
          to_status: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          listing_id?: string
          reason?: string | null
          reason_code?: string | null
          request_id?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_status_events_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "property_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      private_documents: {
        Row: {
          deleted_at: string | null
          detected_mime_type: string
          id: string
          listing_id: string | null
          original_filename: string
          owner_user_id: string
          purpose: string
          retention_until: string | null
          review_status: string
          scan_status: string
          service_request_id: string | null
          sha256_hex: string | null
          size_bytes: number
          storage_key: string
          uploaded_at: string
        }
        Insert: {
          deleted_at?: string | null
          detected_mime_type: string
          id?: string
          listing_id?: string | null
          original_filename: string
          owner_user_id: string
          purpose: string
          retention_until?: string | null
          review_status?: string
          scan_status?: string
          service_request_id?: string | null
          sha256_hex?: string | null
          size_bytes: number
          storage_key: string
          uploaded_at?: string
        }
        Update: {
          deleted_at?: string | null
          detected_mime_type?: string
          id?: string
          listing_id?: string | null
          original_filename?: string
          owner_user_id?: string
          purpose?: string
          retention_until?: string | null
          review_status?: string
          scan_status?: string
          service_request_id?: string | null
          sha256_hex?: string | null
          size_bytes?: number
          storage_key?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_documents_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "property_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_documents_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          country_of_residence: string | null
          created_at: string
          display_name: string | null
          id: string
          preferred_language: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          country_of_residence?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          preferred_language?: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          country_of_residence?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferred_language?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      property_listings: {
        Row: {
          area_basis: string | null
          area_unit: string | null
          area_value: number | null
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          currency_code: string
          description: string
          district: string
          division: string
          expires_at: string | null
          headline: string
          id: string
          listing_kind: string
          locality: string | null
          occupancy_status: string
          owner_user_id: string
          price_amount: number | null
          property_type: string
          public_location_label: string | null
          public_reference: string
          published_at: string | null
          status: string
          submitted_at: string | null
          upazila: string | null
          updated_at: string
        }
        Insert: {
          area_basis?: string | null
          area_unit?: string | null
          area_value?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          currency_code?: string
          description: string
          district: string
          division: string
          expires_at?: string | null
          headline: string
          id?: string
          listing_kind: string
          locality?: string | null
          occupancy_status?: string
          owner_user_id: string
          price_amount?: number | null
          property_type: string
          public_location_label?: string | null
          public_reference: string
          published_at?: string | null
          status?: string
          submitted_at?: string | null
          upazila?: string | null
          updated_at?: string
        }
        Update: {
          area_basis?: string | null
          area_unit?: string | null
          area_value?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          currency_code?: string
          description?: string
          district?: string
          division?: string
          expires_at?: string | null
          headline?: string
          id?: string
          listing_kind?: string
          locality?: string | null
          occupancy_status?: string
          owner_user_id?: string
          price_amount?: number | null
          property_type?: string
          public_location_label?: string | null
          public_reference?: string
          published_at?: string | null
          status?: string
          submitted_at?: string | null
          upazila?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          consent_version: string
          contact_name: string
          country_of_residence: string | null
          created_at: string
          email_normalized: string
          id: string
          phone: string | null
          property_listing_id: string | null
          requester_user_id: string | null
          service_code: string
          status: string
          summary: string
          updated_at: string
        }
        Insert: {
          consent_version: string
          contact_name: string
          country_of_residence?: string | null
          created_at?: string
          email_normalized: string
          id?: string
          phone?: string | null
          property_listing_id?: string | null
          requester_user_id?: string | null
          service_code: string
          status?: string
          summary: string
          updated_at?: string
        }
        Update: {
          consent_version?: string
          contact_name?: string
          country_of_residence?: string | null
          created_at?: string
          email_normalized?: string
          id?: string
          phone?: string | null
          property_listing_id?: string | null
          requester_user_id?: string | null
          service_code?: string
          status?: string
          summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_property_listing_id_fkey"
            columns: ["property_listing_id"]
            isOneToOne: false
            referencedRelation: "property_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          revoked_at: string | null
          role_code: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          revoked_at?: string | null
          role_code: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          revoked_at?: string | null
          role_code?: string
          user_id?: string
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
