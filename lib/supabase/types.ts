export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          theme: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          theme?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          theme?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      workout_programs: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          description: string | null;
          is_active: boolean;
          last_performed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          description?: string | null;
          is_active?: boolean;
          last_performed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string | null;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          last_performed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      program_days: {
        Row: {
          id: string;
          program_id: string;
          name: string;
          subtitle: string | null;
          day_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          program_id: string;
          name: string;
          subtitle?: string | null;
          day_order?: number;
          created_at?: string;
        };
        Update: {
          program_id?: string;
          name?: string;
          subtitle?: string | null;
          day_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      program_day_exercises: {
        Row: {
          id: string;
          program_day_id: string;
          exercise_id: string;
          sets: number;
          reps: number;
          target_weight_kg: number | null;
          exercise_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          program_day_id: string;
          exercise_id: string;
          sets: number;
          reps: number;
          target_weight_kg?: number | null;
          exercise_order?: number;
          created_at?: string;
        };
        Update: {
          program_day_id?: string;
          exercise_id?: string;
          sets?: number;
          reps?: number;
          target_weight_kg?: number | null;
          exercise_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      motivational_quotes: {
        Row: {
          id: string;
          quote: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          quote: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          quote?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      user_favorite_quotes: {
        Row: {
          user_id: string;
          quote_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          quote_id: string;
          created_at?: string;
        };
        Update: {
          created_at?: string;
        };
        Relationships: [];
      };
      weight_goals: {
        Row: {
          id: string;
          user_id: string;
          target_kg: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          target_kg: number;
          created_at?: string;
        };
        Update: {
          target_kg?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      weight_tracking: {
        Row: {
          id: string;
          user_id: string;
          logged_on: string;
          weight_kg: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          logged_on: string;
          weight_kg: number;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          logged_on?: string;
          weight_kg?: number;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
