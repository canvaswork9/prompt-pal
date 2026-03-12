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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      daily_checkins: {
        Row: {
          cardio_zone: string | null
          coach_message: string | null
          created_at: string | null
          date: string
          decision: string | null
          id: string
          muscle_soreness: string | null
          nutrition_load: string | null
          readiness_score: number | null
          resting_hr: number | null
          score_breakdown: Json | null
          sleep_hours: number
          sleep_quality: string | null
          status: string | null
          training_split: string | null
          user_id: string
          yesterday_training: string | null
        }
        Insert: {
          cardio_zone?: string | null
          coach_message?: string | null
          created_at?: string | null
          date: string
          decision?: string | null
          id?: string
          muscle_soreness?: string | null
          nutrition_load?: string | null
          readiness_score?: number | null
          resting_hr?: number | null
          score_breakdown?: Json | null
          sleep_hours: number
          sleep_quality?: string | null
          status?: string | null
          training_split?: string | null
          user_id: string
          yesterday_training?: string | null
        }
        Update: {
          cardio_zone?: string | null
          coach_message?: string | null
          created_at?: string | null
          date?: string
          decision?: string | null
          id?: string
          muscle_soreness?: string | null
          nutrition_load?: string | null
          readiness_score?: number | null
          resting_hr?: number | null
          score_breakdown?: Json | null
          sleep_hours?: number
          sleep_quality?: string | null
          status?: string | null
          training_split?: string | null
          user_id?: string
          yesterday_training?: string | null
        }
        Relationships: []
      }
      exercise_sets: {
        Row: {
          created_at: string | null
          exercise_key: string
          exercise_name: string
          id: string
          is_warmup: boolean | null
          notes: string | null
          reps: number | null
          rpe: number | null
          session_id: string
          set_number: number
          weight_kg: number | null
        }
        Insert: {
          created_at?: string | null
          exercise_key: string
          exercise_name: string
          id?: string
          is_warmup?: boolean | null
          notes?: string | null
          reps?: number | null
          rpe?: number | null
          session_id: string
          set_number: number
          weight_kg?: number | null
        }
        Update: {
          created_at?: string | null
          exercise_key?: string
          exercise_name?: string
          id?: string
          is_warmup?: boolean | null
          notes?: string | null
          reps?: number | null
          rpe?: number | null
          session_id?: string
          set_number?: number
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_videos: {
        Row: {
          exercise_key: string
          exercise_name: string
          id: string
          thumbnail_url: string | null
          updated_at: string | null
          updated_by: string | null
          youtube_url: string | null
        }
        Insert: {
          exercise_key: string
          exercise_name: string
          id?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
          youtube_url?: string | null
        }
        Update: {
          exercise_key?: string
          exercise_name?: string
          id?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean | null
          feature_key: string
          id: string
          label: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          enabled?: boolean | null
          feature_key: string
          id?: string
          label: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          enabled?: boolean | null
          feature_key?: string
          id?: string
          label?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      meal_logs: {
        Row: {
          calories: number | null
          carbs_g: number | null
          created_at: string | null
          date: string
          eaten: boolean | null
          fat_g: number | null
          id: string
          meal_name: string | null
          meal_slot: string | null
          protein_g: number | null
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string | null
          date: string
          eaten?: boolean | null
          fat_g?: number | null
          id?: string
          meal_name?: string | null
          meal_slot?: string | null
          protein_g?: number | null
          user_id: string
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string | null
          date?: string
          eaten?: boolean | null
          fat_g?: number | null
          id?: string
          meal_name?: string | null
          meal_slot?: string | null
          protein_g?: number | null
          user_id?: string
        }
        Relationships: []
      }
      personal_records: {
        Row: {
          achieved_at: string | null
          estimated_1rm: number | null
          exercise_key: string
          id: string
          reps: number | null
          session_id: string | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          achieved_at?: string | null
          estimated_1rm?: number | null
          exercise_key: string
          id?: string
          reps?: number | null
          session_id?: string | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          achieved_at?: string | null
          estimated_1rm?: number | null
          exercise_key?: string
          id?: string
          reps?: number | null
          session_id?: string | null
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_key: string
          badge_name: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_key: string
          badge_name: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_key?: string
          badge_name?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_gamification: {
        Row: {
          active_title: string | null
          current_level: number | null
          id: string
          last_checkin: string | null
          longest_streak: number | null
          streak_days: number | null
          tier_name: string | null
          total_xp: number | null
          updated_at: string | null
        }
        Insert: {
          active_title?: string | null
          current_level?: number | null
          id: string
          last_checkin?: string | null
          longest_streak?: number | null
          streak_days?: number | null
          tier_name?: string | null
          total_xp?: number | null
          updated_at?: string | null
        }
        Update: {
          active_title?: string | null
          current_level?: number | null
          id?: string
          last_checkin?: string | null
          longest_streak?: number | null
          streak_days?: number | null
          tier_name?: string | null
          total_xp?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          age: number | null
          baseline_hr: number | null
          created_at: string | null
          display_name: string | null
          experience: string | null
          fitness_goal: string | null
          id: string
          language: string | null
          sex: string | null
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          baseline_hr?: number | null
          created_at?: string | null
          display_name?: string | null
          experience?: string | null
          fitness_goal?: string | null
          id: string
          language?: string | null
          sex?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          baseline_hr?: number | null
          created_at?: string | null
          display_name?: string | null
          experience?: string | null
          fitness_goal?: string | null
          id?: string
          language?: string | null
          sex?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: []
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
      workout_sessions: {
        Row: {
          checkin_id: string | null
          completed: boolean | null
          created_at: string | null
          date: string
          duration_min: number | null
          id: string
          notes: string | null
          readiness_score: number | null
          split: string | null
          user_id: string
        }
        Insert: {
          checkin_id?: string | null
          completed?: boolean | null
          created_at?: string | null
          date: string
          duration_min?: number | null
          id?: string
          notes?: string | null
          readiness_score?: number | null
          split?: string | null
          user_id: string
        }
        Update: {
          checkin_id?: string | null
          completed?: boolean | null
          created_at?: string | null
          date?: string
          duration_min?: number | null
          id?: string
          notes?: string | null
          readiness_score?: number | null
          split?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "daily_checkins"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_transactions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          multiplier: number | null
          reason: string
          user_id: string
          xp_amount: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          multiplier?: number | null
          reason: string
          user_id: string
          xp_amount: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          multiplier?: number | null
          reason?: string
          user_id?: string
          xp_amount?: number
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
