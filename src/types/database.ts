/**
 * Generated-style Database types for Supabase tables.
 * Keep in sync with supabase/migrations/20260320000000_init.sql
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          city: string | null;
          country: string | null;
          membership: string;
          xp: number;
          age: number | null;
          weight_kg: number | null;
          height_cm: number | null;
          assessment_completed: boolean;
          kcal_goal: number;
          notification_prefs: Json;
          is_creator: boolean;
          creator_slug: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          country?: string | null;
          membership?: string;
          xp?: number;
          age?: number | null;
          weight_kg?: number | null;
          height_cm?: number | null;
          assessment_completed?: boolean;
          kcal_goal?: number;
          notification_prefs?: Json;
          is_creator?: boolean;
          creator_slug?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          country?: string | null;
          membership?: string;
          xp?: number;
          age?: number | null;
          weight_kg?: number | null;
          height_cm?: number | null;
          assessment_completed?: boolean;
          kcal_goal?: number;
          notification_prefs?: Json;
          is_creator?: boolean;
          creator_slug?: string | null;
        };
        Relationships: [];
      };
      assessment_responses: {
        Row: {
          user_id: string;
          answers: Json;
          current_step: number;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          answers?: Json;
          current_step?: number;
          completed_at?: string | null;
        };
        Update: {
          user_id?: string;
          answers?: Json;
          current_step?: number;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      creators: {
        Row: {
          id: string;
          name: string;
          role: string | null;
          bio: string | null;
          avatar_url: string | null;
          cover_url: string | null;
          verified: boolean;
          socials: Json;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          role?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          cover_url?: string | null;
          verified?: boolean;
          socials?: Json;
          user_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["creators"]["Insert"]>;
        Relationships: [];
      };
      programs: {
        Row: {
          id: string;
          creator_id: string;
          creator_user_id: string | null;
          title: string;
          description: string | null;
          cover_url: string | null;
          weeks: number;
          days_per_week: number;
          minutes: number;
          level: string;
          tags: string[];
          is_premium: boolean;
          status: "draft" | "published";
          created_at: string;
        };
        Insert: {
          id: string;
          creator_id: string;
          creator_user_id?: string | null;
          title: string;
          description?: string | null;
          cover_url?: string | null;
          weeks?: number;
          days_per_week?: number;
          minutes?: number;
          level: string;
          tags?: string[];
          is_premium?: boolean;
          status?: "draft" | "published";
        };
        Update: Partial<Database["public"]["Tables"]["programs"]["Insert"]>;
        Relationships: [];
      };
      workout_sessions: {
        Row: {
          id: string;
          program_id: string;
          title: string;
          description: string | null;
          cover_url: string | null;
          tags: string[];
          sets: number;
          day: number;
          minutes: number;
          mux_playback_id: string | null;
          video_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          program_id: string;
          title: string;
          description?: string | null;
          cover_url?: string | null;
          tags?: string[];
          sets?: number;
          day?: number;
          minutes?: number;
          mux_playback_id?: string | null;
          video_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["workout_sessions"]["Insert"]>;
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          session_id: string;
          name: string;
          thumbnail_url: string | null;
          reps: string | null;
          sort_order: number;
          rest_seconds: number;
          mux_playback_id: string | null;
          video_url: string | null;
        };
        Insert: {
          id: string;
          session_id: string;
          name: string;
          thumbnail_url?: string | null;
          reps?: string | null;
          sort_order?: number;
          rest_seconds?: number;
          mux_playback_id?: string | null;
          video_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["exercises"]["Insert"]>;
        Relationships: [];
      };
      user_program_enrollments: {
        Row: {
          id: string;
          user_id: string;
          program_id: string;
          current_day: number;
          progress_pct: number;
          day_order: string[];
          enrolled_at: string;
        };
        Insert: {
          user_id: string;
          program_id: string;
          current_day?: number;
          progress_pct?: number;
          day_order?: string[];
        };
        Update: Partial<Database["public"]["Tables"]["user_program_enrollments"]["Insert"]>;
        Relationships: [];
      };
      session_progress: {
        Row: {
          user_id: string;
          session_id: string;
          exercise_index: number;
          set_index: number;
          elapsed_seconds: number;
          status: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          session_id: string;
          exercise_index?: number;
          set_index?: number;
          elapsed_seconds?: number;
          status?: string;
        };
        Update: Partial<Database["public"]["Tables"]["session_progress"]["Insert"]>;
        Relationships: [];
      };
      set_logs: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          exercise_id: string;
          set_number: number;
          reps_logged: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          session_id: string;
          exercise_id: string;
          set_number: number;
          reps_logged: number;
        };
        Update: Partial<Database["public"]["Tables"]["set_logs"]["Insert"]>;
        Relationships: [];
      };
      session_completions: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          xp_earned: number;
          duration_seconds: number | null;
          completed_at: string;
        };
        Insert: {
          user_id: string;
          session_id: string;
          xp_earned?: number;
          duration_seconds?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["session_completions"]["Insert"]>;
        Relationships: [];
      };
      xp_events: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          reason: string;
          meta: Json;
          created_at: string;
        };
        Insert: {
          user_id: string;
          amount: number;
          reason: string;
          meta?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["xp_events"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      complete_session: {
        Args: {
          p_session_id: string;
          p_xp?: number | null;
          p_duration?: number | null;
        };
        Returns: Database["public"]["Tables"]["session_completions"]["Row"];
      };
      enroll_program: {
        Args: { p_program_id: string };
        Returns: Database["public"]["Tables"]["user_program_enrollments"]["Row"];
      };
      save_session_progress: {
        Args: {
          p_session_id: string;
          p_exercise_index: number;
          p_set_index: number;
          p_elapsed: number;
          p_status?: string;
        };
        Returns: Database["public"]["Tables"]["session_progress"]["Row"];
      };
      log_set_rep: {
        Args: {
          p_session_id: string;
          p_exercise_id: string;
          p_set_number: number;
          p_reps: number;
        };
        Returns: Database["public"]["Tables"]["set_logs"]["Row"];
      };
      activate_creator: {
        Args: { p_slug?: string | null };
        Returns: Database["public"]["Tables"]["profiles"]["Row"];
      };
      creator_student_progress: {
        Args: { p_program_id?: string | null };
        Returns: {
          enrollment_id: string;
          program_id: string;
          program_title: string;
          student_id: string;
          student_name: string;
          student_avatar: string | null;
          progress_pct: number;
          current_day: number;
          enrolled_at: string;
          last_completed_at: string | null;
          sessions_done: number;
        }[];
      };
      save_program_day_order: {
        Args: { p_program_id: string; p_session_ids: string[] };
        Returns: Database["public"]["Tables"]["user_program_enrollments"]["Row"];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
