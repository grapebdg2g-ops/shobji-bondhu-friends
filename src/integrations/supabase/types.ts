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
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          details: Json
          id: string
          target_id: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
        }
        Relationships: []
      }
      app_installs: {
        Row: {
          id: string
          installed_at: string
          platform: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          installed_at?: string
          platform?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          installed_at?: string
          platform?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      disease_history: {
        Row: {
          created_at: string
          crop_type: string
          disease_name: string
          id: string
          image_url: string | null
          result_json: Json
          severity: string
          user_id: string
        }
        Insert: {
          created_at?: string
          crop_type: string
          disease_name: string
          id?: string
          image_url?: string | null
          result_json: Json
          severity: string
          user_id: string
        }
        Update: {
          created_at?: string
          crop_type?: string
          disease_name?: string
          id?: string
          image_url?: string | null
          result_json?: Json
          severity?: string
          user_id?: string
        }
        Relationships: []
      }
      exchanges: {
        Row: {
          created_at: string
          description: string | null
          district: string
          id: string
          image_url: string | null
          is_active: boolean
          is_free: boolean
          price: number | null
          title: string
          type: string
          unit: string | null
          upazila: string | null
          user_id: string
          user_name: string
          user_phone: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          district: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_free?: boolean
          price?: number | null
          title: string
          type?: string
          unit?: string | null
          upazila?: string | null
          user_id: string
          user_name?: string
          user_phone?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          district?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_free?: boolean
          price?: number | null
          title?: string
          type?: string
          unit?: string | null
          upazila?: string | null
          user_id?: string
          user_name?: string
          user_phone?: string | null
        }
        Relationships: []
      }
      muted_users: {
        Row: {
          created_at: string
          id: string
          muted_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          muted_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          muted_id?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_broadcasts: {
        Row: {
          admin_id: string
          body: string
          created_at: string
          icon: string | null
          id: string
          link: string | null
          opened_count: number
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number
          target_type: string
          target_value: string | null
          title: string
        }
        Insert: {
          admin_id: string
          body: string
          created_at?: string
          icon?: string | null
          id?: string
          link?: string | null
          opened_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number
          target_type?: string
          target_value?: string | null
          title: string
        }
        Update: {
          admin_id?: string
          body?: string
          created_at?: string
          icon?: string | null
          id?: string
          link?: string | null
          opened_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number
          target_type?: string
          target_value?: string | null
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          ref_id: string | null
          ref_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          ref_id?: string | null
          ref_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          ref_id?: string | null
          ref_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
          user_name: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
          user_name?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number
          content: string
          created_at: string
          crop_tag: string | null
          district: string | null
          id: string
          image_url: string | null
          likes_count: number
          type: string
          upazila: string | null
          user_district: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          comments_count?: number
          content: string
          created_at?: string
          crop_tag?: string | null
          district?: string | null
          id?: string
          image_url?: string | null
          likes_count?: number
          type?: string
          upazila?: string | null
          user_district?: string | null
          user_id: string
          user_name?: string
        }
        Update: {
          comments_count?: number
          content?: string
          created_at?: string
          crop_tag?: string | null
          district?: string | null
          id?: string
          image_url?: string | null
          likes_count?: number
          type?: string
          upazila?: string | null
          user_district?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      prices: {
        Row: {
          category: string
          created_at: string
          district: string
          id: string
          market_name: string
          previous_price: number | null
          price: number
          product_name: string
          unit: string
          upazila: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          category?: string
          created_at?: string
          district: string
          id?: string
          market_name: string
          previous_price?: number | null
          price: number
          product_name: string
          unit?: string
          upazila?: string | null
          user_id: string
          user_name?: string
        }
        Update: {
          category?: string
          created_at?: string
          district?: string
          id?: string
          market_name?: string
          previous_price?: number | null
          price?: number
          product_name?: string
          unit?: string
          upazila?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      pro_subscriptions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          payment_ref: string | null
          plan: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          payment_ref?: string | null
          plan?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          payment_ref?: string | null
          plan?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          crops: string[]
          district: string | null
          exchanges_count: number
          expert_institution: string | null
          expert_specialty: string | null
          id: string
          is_suspended: boolean
          is_verified: boolean
          last_active: string | null
          name: string
          phone: string | null
          posts_count: number
          prices_count: number
          role: string
          suspension_reason: string | null
          suspension_until: string | null
          total_reports: number
          upazila: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          crops?: string[]
          district?: string | null
          exchanges_count?: number
          expert_institution?: string | null
          expert_specialty?: string | null
          id: string
          is_suspended?: boolean
          is_verified?: boolean
          last_active?: string | null
          name?: string
          phone?: string | null
          posts_count?: number
          prices_count?: number
          role?: string
          suspension_reason?: string | null
          suspension_until?: string | null
          total_reports?: number
          upazila?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          crops?: string[]
          district?: string | null
          exchanges_count?: number
          expert_institution?: string | null
          expert_specialty?: string | null
          id?: string
          is_suspended?: boolean
          is_verified?: boolean
          last_active?: string | null
          name?: string
          phone?: string | null
          posts_count?: number
          prices_count?: number
          role?: string
          suspension_reason?: string | null
          suspension_until?: string | null
          total_reports?: number
          upazila?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          district: string | null
          endpoint: string
          id: string
          p256dh: string
          upazila: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          district?: string | null
          endpoint: string
          id?: string
          p256dh: string
          upazila?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          district?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          upazila?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      revenue_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          reference: string | null
          status: string
          subscription_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          reference?: string | null
          status?: string
          subscription_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          reference?: string | null
          status?: string
          subscription_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "pro_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reports: {
        Row: {
          content_id: string | null
          content_type: string
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_user_id: string | null
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          content_id?: string | null
          content_type: string
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_user_id?: string | null
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          content_id?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_user_id?: string | null
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weather_alerts_sent: {
        Row: {
          alert_type: string
          day: string | null
          district: string
          id: string
          sent_at: string
          upazila: string | null
        }
        Insert: {
          alert_type: string
          day?: string | null
          district: string
          id?: string
          sent_at?: string
          upazila?: string | null
        }
        Update: {
          alert_type?: string
          day?: string | null
          district?: string
          id?: string
          sent_at?: string
          upazila?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_likes: { Args: { post_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_comments: { Args: { post_id: string }; Returns: undefined }
      increment_likes: { Args: { post_id: string }; Returns: undefined }
      is_active_user: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "farmer" | "expert" | "moderator" | "admin"
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
      app_role: ["farmer", "expert", "moderator", "admin"],
    },
  },
} as const
