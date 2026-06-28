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
      ai_settings: {
        Row: {
          analysis_depth: number
          created_date: string
          daily_message_limit: number
          deep_enabled: boolean
          direct_enabled: boolean
          fast_enabled: boolean
          fast_max_words: number
          id: string
          total_usage: number
        }
        Insert: {
          analysis_depth?: number
          created_date?: string
          daily_message_limit?: number
          deep_enabled?: boolean
          direct_enabled?: boolean
          fast_enabled?: boolean
          fast_max_words?: number
          id?: string
          total_usage?: number
        }
        Update: {
          analysis_depth?: number
          created_date?: string
          daily_message_limit?: number
          deep_enabled?: boolean
          direct_enabled?: boolean
          fast_enabled?: boolean
          fast_max_words?: number
          id?: string
          total_usage?: number
        }
        Relationships: []
      }
      call_rooms: {
        Row: {
          call_type: string
          created_date: string
          host_id: string
          host_name: string | null
          id: string
          name: string | null
          participant_cameras: Json
          participant_ids: string[]
          participant_mics: Json
          participant_names: string[]
          room_code: string
          started_at: string | null
          status: string
        }
        Insert: {
          call_type?: string
          created_date?: string
          host_id: string
          host_name?: string | null
          id?: string
          name?: string | null
          participant_cameras?: Json
          participant_ids?: string[]
          participant_mics?: Json
          participant_names?: string[]
          room_code: string
          started_at?: string | null
          status?: string
        }
        Update: {
          call_type?: string
          created_date?: string
          host_id?: string
          host_name?: string | null
          id?: string
          name?: string | null
          participant_cameras?: Json
          participant_ids?: string[]
          participant_mics?: Json
          participant_names?: string[]
          room_code?: string
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          admin_id: string | null
          avatar_url: string | null
          created_date: string
          id: string
          last_message: string | null
          last_message_sender: string | null
          last_message_time: string | null
          name: string | null
          participant_ids: string[]
          participant_names: string[]
          type: string
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          avatar_url?: string | null
          created_date?: string
          id?: string
          last_message?: string | null
          last_message_sender?: string | null
          last_message_time?: string | null
          name?: string | null
          participant_ids?: string[]
          participant_names?: string[]
          type?: string
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          avatar_url?: string | null
          created_date?: string
          id?: string
          last_message?: string | null
          last_message_sender?: string | null
          last_message_time?: string | null
          name?: string | null
          participant_ids?: string[]
          participant_names?: string[]
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_date: string
          id: string
          receiver_id: string
          requester_id: string
          status: string
        }
        Insert: {
          created_date?: string
          id?: string
          receiver_id: string
          requester_id: string
          status?: string
        }
        Update: {
          created_date?: string
          id?: string
          receiver_id?: string
          requester_id?: string
          status?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_date: string
          deleted_by: string[]
          file_name: string | null
          file_url: string | null
          id: string
          is_ai: boolean
          is_recalled: boolean
          read_by: string[]
          recalled_at: string | null
          sender_avatar: string | null
          sender_id: string | null
          sender_name: string | null
          type: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_date?: string
          deleted_by?: string[]
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_ai?: boolean
          is_recalled?: boolean
          read_by?: string[]
          recalled_at?: string | null
          sender_avatar?: string | null
          sender_id?: string | null
          sender_name?: string | null
          type?: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_date?: string
          deleted_by?: string[]
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_ai?: boolean
          is_recalled?: boolean
          read_by?: string[]
          recalled_at?: string | null
          sender_avatar?: string | null
          sender_id?: string | null
          sender_name?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_date: string
          from_user_avatar: string | null
          from_user_name: string | null
          id: string
          is_read: boolean
          related_id: string | null
          title: string | null
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_date?: string
          from_user_avatar?: string | null
          from_user_name?: string | null
          id?: string
          is_read?: boolean
          related_id?: string | null
          title?: string | null
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_date?: string
          from_user_avatar?: string | null
          from_user_name?: string | null
          id?: string
          is_read?: boolean
          related_id?: string | null
          title?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          action_taken: string | null
          created_date: string
          details: string | null
          id: string
          reason: string
          reported_user_id: string | null
          reported_user_name: string | null
          reporter_id: string
          reporter_name: string | null
          status: string
        }
        Insert: {
          action_taken?: string | null
          created_date?: string
          details?: string | null
          id?: string
          reason: string
          reported_user_id?: string | null
          reported_user_name?: string | null
          reporter_id: string
          reporter_name?: string | null
          status?: string
        }
        Update: {
          action_taken?: string | null
          created_date?: string
          details?: string | null
          id?: string
          reason?: string
          reported_user_id?: string | null
          reported_user_name?: string | null
          reporter_id?: string
          reporter_name?: string | null
          status?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          ai_daily_count: number
          ai_daily_date: string | null
          avatar_url: string | null
          ban_type: string | null
          ban_until: string | null
          bio: string | null
          bot_persona: string | null
          chat_disabled: boolean
          created_date: string
          display_name: string
          email: string | null
          id: string
          is_admin: boolean
          is_banned: boolean
          is_bot: boolean
          is_online: boolean | null
          last_active: string | null
          updated_at: string
          user_id: string
          warnings: number
        }
        Insert: {
          ai_daily_count?: number
          ai_daily_date?: string | null
          avatar_url?: string | null
          ban_type?: string | null
          ban_until?: string | null
          bio?: string | null
          bot_persona?: string | null
          chat_disabled?: boolean
          created_date?: string
          display_name?: string
          email?: string | null
          id?: string
          is_admin?: boolean
          is_banned?: boolean
          is_bot?: boolean
          is_online?: boolean | null
          last_active?: string | null
          updated_at?: string
          user_id: string
          warnings?: number
        }
        Update: {
          ai_daily_count?: number
          ai_daily_date?: string | null
          avatar_url?: string | null
          ban_type?: string | null
          ban_until?: string | null
          bio?: string | null
          bot_persona?: string | null
          chat_disabled?: boolean
          created_date?: string
          display_name?: string
          email?: string | null
          id?: string
          is_admin?: boolean
          is_banned?: boolean
          is_bot?: boolean
          is_online?: boolean | null
          last_active?: string | null
          updated_at?: string
          user_id?: string
          warnings?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _uid: string }; Returns: boolean }
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
