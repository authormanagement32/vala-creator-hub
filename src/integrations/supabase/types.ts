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
      applications: {
        Row: {
          applicant_name: string
          author_id: string | null
          country: string | null
          created_at: string
          decided_at: string | null
          email: string
          id: string
          notes: string | null
          reviewer_email: string | null
          stage: Database["public"]["Enums"]["application_stage"]
          submitted_at: string
          updated_at: string
        }
        Insert: {
          applicant_name: string
          author_id?: string | null
          country?: string | null
          created_at?: string
          decided_at?: string | null
          email: string
          id?: string
          notes?: string | null
          reviewer_email?: string | null
          stage?: Database["public"]["Enums"]["application_stage"]
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          applicant_name?: string
          author_id?: string | null
          country?: string | null
          created_at?: string
          decided_at?: string | null
          email?: string
          id?: string
          notes?: string | null
          reviewer_email?: string | null
          stage?: Database["public"]["Enums"]["application_stage"]
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json
          severity: string
          summary: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          severity?: string
          summary: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          severity?: string
          summary?: string
        }
        Relationships: []
      }
      auth_gate_events: {
        Row: {
          email: string | null
          id: string
          ip: string | null
          message: string | null
          occurred_at: string
          state: string
          status_code: number | null
          user_agent: string | null
          user_id: string | null
          wall_route: string
        }
        Insert: {
          email?: string | null
          id?: string
          ip?: string | null
          message?: string | null
          occurred_at?: string
          state: string
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
          wall_route: string
        }
        Update: {
          email?: string | null
          id?: string
          ip?: string | null
          message?: string | null
          occurred_at?: string
          state?: string
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
          wall_route?: string
        }
        Relationships: []
      }
      authors: {
        Row: {
          company: string | null
          country: string | null
          created_at: string
          email: string
          health_score: number
          id: string
          joined_at: string
          name: string
          products_count: number
          rating: number | null
          revenue: number
          risk_score: number
          royalties: number
          status: Database["public"]["Enums"]["author_status"]
          updated_at: string
          verified: boolean
        }
        Insert: {
          company?: string | null
          country?: string | null
          created_at?: string
          email: string
          health_score?: number
          id?: string
          joined_at?: string
          name: string
          products_count?: number
          rating?: number | null
          revenue?: number
          risk_score?: number
          royalties?: number
          status?: Database["public"]["Enums"]["author_status"]
          updated_at?: string
          verified?: boolean
        }
        Update: {
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string
          health_score?: number
          id?: string
          joined_at?: string
          name?: string
          products_count?: number
          rating?: number | null
          revenue?: number
          risk_score?: number
          royalties?: number
          status?: Database["public"]["Enums"]["author_status"]
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          severity?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      product_versions: {
        Row: {
          changelog: string
          id: string
          product_id: string
          released_at: string
          status: string
          version: string
        }
        Insert: {
          changelog?: string
          id?: string
          product_id: string
          released_at?: string
          status?: string
          version: string
        }
        Update: {
          changelog?: string
          id?: string
          product_id?: string
          released_at?: string
          status?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_versions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          author_id: string | null
          category: string
          created_at: string
          downloads: number
          id: string
          name: string
          price: number
          rating: number | null
          status: string
          type: string
          updated_at: string
          version: string
        }
        Insert: {
          author_id?: string | null
          category?: string
          created_at?: string
          downloads?: number
          id?: string
          name: string
          price?: number
          rating?: number | null
          status?: string
          type?: string
          updated_at?: string
          version?: string
        }
        Update: {
          author_id?: string | null
          category?: string
          created_at?: string
          downloads?: number
          id?: string
          name?: string
          price?: number
          rating?: number | null
          status?: string
          type?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      source_repos: {
        Row: {
          build_status: string
          created_at: string
          default_branch: string
          dependency_count: number
          id: string
          last_build_at: string | null
          last_scan_at: string | null
          latest_version: string | null
          license_valid: boolean
          name: string
          outdated_dependencies: number
          product_id: string | null
          provider: string
          scan_findings: Json
          updated_at: string
          url: string
          vuln_critical: number
          vuln_high: number
          vuln_low: number
          vuln_medium: number
        }
        Insert: {
          build_status?: string
          created_at?: string
          default_branch?: string
          dependency_count?: number
          id?: string
          last_build_at?: string | null
          last_scan_at?: string | null
          latest_version?: string | null
          license_valid?: boolean
          name: string
          outdated_dependencies?: number
          product_id?: string | null
          provider?: string
          scan_findings?: Json
          updated_at?: string
          url: string
          vuln_critical?: number
          vuln_high?: number
          vuln_low?: number
          vuln_medium?: number
        }
        Update: {
          build_status?: string
          created_at?: string
          default_branch?: string
          dependency_count?: number
          id?: string
          last_build_at?: string | null
          last_scan_at?: string | null
          latest_version?: string | null
          license_valid?: boolean
          name?: string
          outdated_dependencies?: number
          product_id?: string | null
          provider?: string
          scan_findings?: Json
          updated_at?: string
          url?: string
          vuln_critical?: number
          vuln_high?: number
          vuln_low?: number
          vuln_medium?: number
        }
        Relationships: [
          {
            foreignKeyName: "source_repos_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "boss" | "admin" | "reviewer" | "author"
      application_stage:
        | "registration"
        | "identity"
        | "kyc"
        | "portfolio"
        | "interview"
        | "agreement"
        | "approved"
        | "rejected"
      author_status: "verified" | "pending" | "suspended" | "rejected"
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
      app_role: ["boss", "admin", "reviewer", "author"],
      application_stage: [
        "registration",
        "identity",
        "kyc",
        "portfolio",
        "interview",
        "agreement",
        "approved",
        "rejected",
      ],
      author_status: ["verified", "pending", "suspended", "rejected"],
    },
  },
} as const
