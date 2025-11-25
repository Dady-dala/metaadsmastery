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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          requirement_count: number
          requirement_type: string
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          requirement_count?: number
          requirement_type: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_count?: number
          requirement_type?: string
        }
        Relationships: []
      }
      certificate_settings: {
        Row: {
          accent_color: string
          background_color: string
          certificate_title: string
          created_at: string
          id: string
          logo_url: string | null
          organization_name: string
          organization_subtitle: string
          primary_color: string
          text_color: string
          trainer_name: string
          trainer_signature_url: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string
          background_color?: string
          certificate_title?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          organization_name?: string
          organization_subtitle?: string
          primary_color?: string
          text_color?: string
          trainer_name?: string
          trainer_signature_url?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string
          background_color?: string
          certificate_title?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          organization_name?: string
          organization_subtitle?: string
          primary_color?: string
          text_color?: string
          trainer_name?: string
          trainer_signature_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_url: string | null
          course_id: string
          id: string
          issued_at: string
          student_id: string
        }
        Insert: {
          certificate_url?: string | null
          course_id: string
          id?: string
          issued_at?: string
          student_id: string
        }
        Update: {
          certificate_url?: string | null
          course_id?: string
          id?: string
          issued_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_list_members: {
        Row: {
          added_at: string
          contact_id: string
          id: string
          list_id: string
        }
        Insert: {
          added_at?: string
          contact_id: string
          id?: string
          list_id: string
        }
        Update: {
          added_at?: string
          contact_id?: string
          id?: string
          list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_list_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_list_members_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "contact_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_lists: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone_number: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          phone_number?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone_number?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          metadata: Json | null
          notes: string | null
          phone: string | null
          source: string
          status: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          source?: string
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          source?: string
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      course_videos: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          title: string
          wistia_media_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title: string
          wistia_media_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title?: string
          wistia_media_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_videos_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_certifying: boolean
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_certifying?: boolean
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_certifying?: boolean
          title?: string
        }
        Relationships: []
      }
      email_campaign_logs: {
        Row: {
          campaign_id: string
          error_message: string | null
          id: string
          metadata: Json | null
          sent_at: string
          status: string
          student_id: string
        }
        Insert: {
          campaign_id: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          sent_at?: string
          status?: string
          student_id: string
        }
        Update: {
          campaign_id?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          sent_at?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          created_at: string
          created_by: string | null
          html_body: string
          id: string
          name: string
          status: string
          subject: string
          target_audience: Json | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          html_body: string
          id?: string
          name: string
          status?: string
          subject: string
          target_audience?: Json | null
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          html_body?: string
          id?: string
          name?: string
          status?: string
          subject?: string
          target_audience?: Json | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          content: Json
          created_at: string | null
          html_body: string | null
          id: string
          is_active: boolean | null
          preview_text: string | null
          subject: string
          template_key: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          html_body?: string | null
          id?: string
          is_active?: boolean | null
          preview_text?: string | null
          subject: string
          template_key: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          html_body?: string | null
          id?: string
          is_active?: boolean | null
          preview_text?: string | null
          subject?: string
          template_key?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      emails: {
        Row: {
          created_by: string | null
          from_email: string
          from_name: string | null
          html_body: string
          id: string
          metadata: Json | null
          read_at: string | null
          reply_to_id: string | null
          sent_at: string
          status: string
          subject: string
          text_body: string | null
          to_email: string
          to_name: string | null
        }
        Insert: {
          created_by?: string | null
          from_email: string
          from_name?: string | null
          html_body: string
          id?: string
          metadata?: Json | null
          read_at?: string | null
          reply_to_id?: string | null
          sent_at?: string
          status?: string
          subject: string
          text_body?: string | null
          to_email: string
          to_name?: string | null
        }
        Update: {
          created_by?: string | null
          from_email?: string
          from_name?: string | null
          html_body?: string
          id?: string
          metadata?: Json | null
          read_at?: string | null
          reply_to_id?: string | null
          sent_at?: string
          status?: string
          subject?: string
          text_body?: string | null
          to_email?: string
          to_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emails_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          data: Json
          email: string | null
          form_id: string
          id: string
          submitted_at: string
        }
        Insert: {
          data?: Json
          email?: string | null
          form_id: string
          id?: string
          submitted_at?: string
        }
        Update: {
          data?: Json
          email?: string | null
          form_id?: string
          id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          action_type: string
          created_at: string
          created_by: string | null
          description: string | null
          fields: Json
          id: string
          is_active: boolean
          mapping_config: Json | null
          public_description: string | null
          public_title: string | null
          target_list_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          action_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          fields?: Json
          id?: string
          is_active?: boolean
          mapping_config?: Json | null
          public_description?: string | null
          public_title?: string | null
          target_list_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          fields?: Json
          id?: string
          is_active?: boolean
          mapping_config?: Json | null
          public_description?: string | null
          public_title?: string | null
          target_list_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forms_target_list_id_fkey"
            columns: ["target_list_id"]
            isOneToOne: false
            referencedRelation: "contact_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_sections: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          is_active: boolean
          media_url: string | null
          order_index: number
          section_key: string
          section_type: string
          styles: Json | null
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          media_url?: string | null
          order_index?: number
          section_key: string
          section_type: string
          styles?: Json | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          media_url?: string | null
          order_index?: number
          section_key?: string
          section_type?: string
          styles?: Json | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_system_page: boolean
          meta_description: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_system_page?: boolean
          meta_description?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_system_page?: boolean
          meta_description?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          first_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string
          id: string
          passed: boolean
          quiz_id: string
          score: number
          student_id: string
        }
        Insert: {
          answers: Json
          completed_at?: string
          id?: string
          passed?: boolean
          quiz_id: string
          score?: number
          student_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string
          id: string
          options: Json | null
          order_index: number
          points: number
          question_text: string
          question_type: string
          quiz_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          id?: string
          options?: Json | null
          order_index?: number
          points?: number
          question_text: string
          question_type: string
          quiz_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          id?: string
          options?: Json | null
          order_index?: number
          points?: number
          question_text?: string
          question_type?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_required: boolean
          passing_score: number
          title: string
          video_id: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          passing_score?: number
          title: string
          video_id?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          passing_score?: number
          title?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "course_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      student_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          student_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          student_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          course_id: string
          enrolled_at: string
          id: string
          student_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          id?: string
          student_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_notes: {
        Row: {
          created_at: string
          id: string
          note_content: string
          student_id: string
          timestamp_seconds: number | null
          updated_at: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note_content: string
          student_id: string
          timestamp_seconds?: number | null
          updated_at?: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note_content?: string
          student_id?: string
          timestamp_seconds?: number | null
          updated_at?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_notes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "course_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_progress: {
        Row: {
          completed: boolean
          id: string
          last_watched_at: string
          student_id: string
          video_id: string
          watch_percentage: number
        }
        Insert: {
          completed?: boolean
          id?: string
          last_watched_at?: string
          student_id: string
          video_id: string
          watch_percentage?: number
        }
        Update: {
          completed?: boolean
          id?: string
          last_watched_at?: string
          student_id?: string
          video_id?: string
          watch_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "video_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "course_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_executions: {
        Row: {
          actions_completed: Json | null
          completed_at: string | null
          contact_id: string | null
          error_message: string | null
          id: string
          started_at: string
          status: string
          trigger_data: Json | null
          workflow_id: string
        }
        Insert: {
          actions_completed?: Json | null
          completed_at?: string | null
          contact_id?: string | null
          error_message?: string | null
          id?: string
          started_at?: string
          status?: string
          trigger_data?: Json | null
          workflow_id: string
        }
        Update: {
          actions_completed?: Json | null
          completed_at?: string | null
          contact_id?: string | null
          error_message?: string | null
          id?: string
          started_at?: string
          status?: string
          trigger_data?: Json | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          actions: Json
          conditions: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          status: string
          trigger_config: Json | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
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
      app_role: "admin" | "user" | "student"
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
      app_role: ["admin", "user", "student"],
    },
  },
} as const
