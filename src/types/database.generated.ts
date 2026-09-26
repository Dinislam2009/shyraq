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
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      activity_feed: {
        Row: {
          actor_id: string
          created_at: string
          entity_id: string | null
          entity_type: string
          event_type: string
          id: string
          metadata: Json
          workspace_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          event_type: string
          id?: string
          metadata?: Json
          workspace_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          event_type?: string
          id?: string
          metadata?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_schedules: {
        Row: {
          created_at: string
          enabled: boolean
          frequency: string
          id: string
          last_error: string | null
          last_run_at: string | null
          next_run_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          frequency?: string
          id?: string
          last_error?: string | null
          last_run_at?: string | null
          next_run_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          frequency?: string
          id?: string
          last_error?: string | null
          last_run_at?: string | null
          next_run_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      backup_versions: {
        Row: {
          checksum: string | null
          created_at: string
          format: string
          id: string
          size_bytes: number
          storage_path: string
          user_id: string
        }
        Insert: {
          checksum?: string | null
          created_at?: string
          format: string
          id?: string
          size_bytes?: number
          storage_path: string
          user_id: string
        }
        Update: {
          checksum?: string | null
          created_at?: string
          format?: string
          id?: string
          size_bytes?: number
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      card_states: {
        Row: {
          card_id: string
          due_at: string
          ease_factor: number
          id: string
          interval: number
          lapses: number
          last_reviewed_at: string | null
          repetitions: number
          status: string
        }
        Insert: {
          card_id: string
          due_at?: string
          ease_factor?: number
          id: string
          interval?: number
          lapses?: number
          last_reviewed_at?: string | null
          repetitions?: number
          status?: string
        }
        Update: {
          card_id?: string
          due_at?: string
          ease_factor?: number
          id?: string
          interval?: number
          lapses?: number
          last_reviewed_at?: string | null
          repetitions?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_states_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_tags: {
        Row: {
          card_id: string
          tag_id: string
        }
        Insert: {
          card_id: string
          tag_id: string
        }
        Update: {
          card_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_tags_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      card_templates: {
        Row: {
          back_template: string
          created_at: string
          css: string
          deck_id: string
          field_schema: Json
          front_template: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          back_template?: string
          created_at?: string
          css?: string
          deck_id: string
          field_schema?: Json
          front_template?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Update: {
          back_template?: string
          created_at?: string
          css?: string
          deck_id?: string
          field_schema?: Json
          front_template?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_templates_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          content: Json
          created_at: string
          deck_id: string
          id: string
          is_marked: boolean
          is_suspended: boolean
          kind: Database["public"]["Enums"]["card_kind"]
          owner_id: string
          sort_order: number
          template_id: string | null
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          deck_id: string
          id?: string
          is_marked?: boolean
          is_suspended?: boolean
          kind?: Database["public"]["Enums"]["card_kind"]
          owner_id: string
          sort_order?: number
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          deck_id?: string
          id?: string
          is_marked?: boolean
          is_suspended?: boolean
          kind?: Database["public"]["Enums"]["card_kind"]
          owner_id?: string
          sort_order?: number
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "card_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_cards: {
        Row: {
          card_id: string
          collection_id: string
          created_at: string
        }
        Insert: {
          card_id: string
          collection_id: string
          created_at?: string
        }
        Update: {
          card_id?: string
          collection_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_cards_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_members: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
          workspace_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_members_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          id: string
          is_featured: boolean
          is_public: boolean
          kind: Database["public"]["Enums"]["collection_kind"]
          name: string
          owner_id: string
          rule: Json
          sort_mode: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_featured?: boolean
          is_public?: boolean
          kind?: Database["public"]["Enums"]["collection_kind"]
          name: string
          owner_id: string
          rule?: Json
          sort_mode?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_featured?: boolean
          is_public?: boolean
          kind?: Database["public"]["Enums"]["collection_kind"]
          name?: string
          owner_id?: string
          rule?: Json
          sort_mode?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_mentions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          mentioned_user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          mentioned_user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          mentioned_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_mentions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          body: string
          card_id: string | null
          created_at: string
          deck_id: string
          id: string
          parent_id: string | null
          resolved: boolean
          updated_at: string
          workspace_id: string
        }
        Insert: {
          author_id: string
          body: string
          card_id?: string | null
          created_at?: string
          deck_id: string
          id?: string
          parent_id?: string | null
          resolved?: boolean
          updated_at?: string
          workspace_id: string
        }
        Update: {
          author_id?: string
          body?: string
          card_id?: string | null
          created_at?: string
          deck_id?: string
          id?: string
          parent_id?: string | null
          resolved?: boolean
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_relations: {
        Row: {
          created_at: string
          creator_id: string
          relation: string
          user_id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          relation: string
          user_id: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          relation?: string
          user_id?: string
        }
        Relationships: []
      }
      deck_copies: {
        Row: {
          copied_deck_id: string
          created_at: string
          last_synced_source_updated_at: string | null
          source_deck_id: string
          source_updated_at: string | null
          update_policy: string
          user_id: string
        }
        Insert: {
          copied_deck_id: string
          created_at?: string
          last_synced_source_updated_at?: string | null
          source_deck_id: string
          source_updated_at?: string | null
          update_policy?: string
          user_id: string
        }
        Update: {
          copied_deck_id?: string
          created_at?: string
          last_synced_source_updated_at?: string | null
          source_deck_id?: string
          source_updated_at?: string | null
          update_policy?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deck_copies_copied_deck_id_fkey"
            columns: ["copied_deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deck_copies_source_deck_id_fkey"
            columns: ["source_deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_copy_update_history: {
        Row: {
          accepted_at: string
          card_changes: Json
          copied_deck_id: string
          id: string
          source_deck_id: string
          source_updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          card_changes?: Json
          copied_deck_id: string
          id?: string
          source_deck_id: string
          source_updated_at: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          card_changes?: Json
          copied_deck_id?: string
          id?: string
          source_deck_id?: string
          source_updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deck_copy_update_history_copied_deck_id_fkey"
            columns: ["copied_deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deck_copy_update_history_source_deck_id_fkey"
            columns: ["source_deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_members: {
        Row: {
          created_at: string
          deck_id: string
          id: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          deck_id: string
          id?: string
          role: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          deck_id?: string
          id?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deck_members_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deck_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_reports: {
        Row: {
          created_at: string
          deck_id: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          deck_id: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          deck_id?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "deck_reports_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_versions: {
        Row: {
          created_at: string
          created_by: string
          deck_id: string
          id: string
          label: string
          reason: string | null
          snapshot: Json
          version_number: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deck_id: string
          id?: string
          label?: string
          reason?: string | null
          snapshot?: Json
          version_number: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deck_id?: string
          id?: string
          label?: string
          reason?: string | null
          snapshot?: Json
          version_number?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deck_versions_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deck_versions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      decks: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string
          id: string
          name: string
          owner_id: string
          settings: Json
          sort_order: number
          source_deck_id: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["deck_visibility"]
          workspace_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string
          id?: string
          name: string
          owner_id: string
          settings?: Json
          sort_order?: number
          source_deck_id?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["deck_visibility"]
          workspace_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string
          id?: string
          name?: string
          owner_id?: string
          settings?: Json
          sort_order?: number
          source_deck_id?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["deck_visibility"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decks_source_deck_id_fkey"
            columns: ["source_deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          created_at: string
          digest: string | null
          id: string
          level: string
          message: string
          metadata: Json
          route: string | null
          source: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          digest?: string | null
          id?: string
          level?: string
          message: string
          metadata?: Json
          route?: string | null
          source: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          digest?: string | null
          id?: string
          level?: string
          message?: string
          metadata?: Json
          route?: string | null
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      flashcard_decks: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_decks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_reviews: {
        Row: {
          card_id: string
          correct: boolean
          deck_id: string
          id: string
          rating: string
          reviewed_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          correct: boolean
          deck_id: string
          id: string
          rating?: string
          reviewed_at?: string
          user_id: string
        }
        Update: {
          card_id?: string
          correct?: boolean
          deck_id?: string
          id?: string
          rating?: string
          reviewed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_reviews_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcard_reviews_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "flashcard_decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcard_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          deck_id: string
          front: string
          id: string
          position: number
          updated_at: string
        }
        Insert: {
          back: string
          created_at?: string
          deck_id: string
          front: string
          id: string
          position?: number
          updated_at?: string
        }
        Update: {
          back?: string
          created_at?: string
          deck_id?: string
          front?: string
          id?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "flashcard_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          duration_seconds: number | null
          ended_at: string | null
          id: string
          started_at: string
          status: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          duration_seconds?: number | null
          ended_at?: string | null
          id: string
          started_at: string
          status?: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_completions: {
        Row: {
          created_at: string
          date: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          habit_id: string
          id: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          frequency: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          frequency?: string
          id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_rows: number
          deck_id: string | null
          duplicate_mode: string
          error: string | null
          format: string
          id: string
          processed_rows: number
          replaced_rows: number
          skipped_rows: number
          source_name: string
          status: string
          storage_path: string
          total_rows: number
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_rows?: number
          deck_id?: string | null
          duplicate_mode?: string
          error?: string | null
          format?: string
          id?: string
          processed_rows?: number
          replaced_rows?: number
          skipped_rows?: number
          source_name: string
          status?: string
          storage_path: string
          total_rows?: number
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_rows?: number
          deck_id?: string | null
          duplicate_mode?: string
          error?: string | null
          format?: string
          id?: string
          processed_rows?: number
          replaced_rows?: number
          skipped_rows?: number
          source_name?: string
          status?: string
          storage_path?: string
          total_rows?: number
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          byte_size: number | null
          checksum: string | null
          created_at: string
          id: string
          mime_type: string
          owner_id: string
          storage_path: string
          workspace_id: string
        }
        Insert: {
          byte_size?: number | null
          checksum?: string | null
          created_at?: string
          id?: string
          mime_type: string
          owner_id: string
          storage_path: string
          workspace_id: string
        }
        Update: {
          byte_size?: number | null
          checksum?: string | null
          created_at?: string
          id?: string
          mime_type?: string
          owner_id?: string
          storage_path?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action: string
          created_at: string
          id: string
          moderator_id: string
          note: string | null
          report_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          moderator_id: string
          note?: string | null
          report_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          moderator_id?: string
          note?: string | null
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "deck_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      moderators: {
        Row: {
          created_at: string
          enabled: boolean
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          author_updates: boolean
          backup: boolean
          collaboration: boolean
          in_app: boolean
          moderation: boolean
          offline_state: boolean
          sync_conflicts: boolean
          updated_at: string
          user_id: string
          workspace_invites: boolean
        }
        Insert: {
          author_updates?: boolean
          backup?: boolean
          collaboration?: boolean
          in_app?: boolean
          moderation?: boolean
          offline_state?: boolean
          sync_conflicts?: boolean
          updated_at?: string
          user_id: string
          workspace_invites?: boolean
        }
        Update: {
          author_updates?: boolean
          backup?: boolean
          collaboration?: boolean
          in_app?: boolean
          moderation?: boolean
          offline_state?: boolean
          sync_conflicts?: boolean
          updated_at?: string
          user_id?: string
          workspace_invites?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          href: string | null
          id: string
          kind: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          href?: string | null
          id?: string
          kind: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          href?: string | null
          id?: string
          kind?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          locale: string
          selected_workspace_id: string | null
          show_activity: boolean
          show_followers: boolean
          timezone: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          locale?: string
          selected_workspace_id?: string | null
          show_activity?: boolean
          show_followers?: boolean
          timezone?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          locale?: string
          selected_workspace_id?: string | null
          show_activity?: boolean
          show_followers?: boolean
          timezone?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_selected_workspace_id_fkey"
            columns: ["selected_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      public_deck_follow_counts: {
        Row: {
          deck_id: string
          follow_count: number
          updated_at: string
        }
        Insert: {
          deck_id: string
          follow_count?: number
          updated_at?: string
        }
        Update: {
          deck_id?: string
          follow_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_deck_follow_counts_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: true
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      public_deck_follows: {
        Row: {
          created_at: string
          deck_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deck_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          deck_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_deck_follows_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      review_devices: {
        Row: {
          created_at: string
          id: string
          last_seen_at: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          last_seen_at?: string
          name?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_seen_at?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      review_events: {
        Row: {
          card_id: string
          client_sequence: number | null
          created_at: string
          device_id: string
          elapsed_ms: number | null
          event_key: string
          id: string
          metadata: Json
          next_state: Json
          previous_state: Json
          rating: Database["public"]["Enums"]["review_rating"]
          reviewed_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          client_sequence?: number | null
          created_at?: string
          device_id: string
          elapsed_ms?: number | null
          event_key: string
          id?: string
          metadata?: Json
          next_state?: Json
          previous_state?: Json
          rating: Database["public"]["Enums"]["review_rating"]
          reviewed_at: string
          user_id: string
        }
        Update: {
          card_id?: string
          client_sequence?: number | null
          created_at?: string
          device_id?: string
          elapsed_ms?: number | null
          event_key?: string
          id?: string
          metadata?: Json
          next_state?: Json
          previous_state?: Json
          rating?: Database["public"]["Enums"]["review_rating"]
          reviewed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_events_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      review_preferences: {
        Row: {
          accessibility: Json
          desired_retention: number
          enable_fuzz: boolean
          enable_short_term: boolean
          learning_steps: Json
          maximum_interval: number
          new_cards_per_day: number
          rating_labels: Json
          rating_order: Json
          rating_styles: Json
          relearning_steps: Json
          reviews_per_day: number
          scheduler_profiles: Json
          session_defaults: Json
          show_keyboard_hints: boolean
          swipe_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          accessibility?: Json
          desired_retention?: number
          enable_fuzz?: boolean
          enable_short_term?: boolean
          learning_steps?: Json
          maximum_interval?: number
          new_cards_per_day?: number
          rating_labels?: Json
          rating_order?: Json
          rating_styles?: Json
          relearning_steps?: Json
          reviews_per_day?: number
          scheduler_profiles?: Json
          session_defaults?: Json
          show_keyboard_hints?: boolean
          swipe_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          accessibility?: Json
          desired_retention?: number
          enable_fuzz?: boolean
          enable_short_term?: boolean
          learning_steps?: Json
          maximum_interval?: number
          new_cards_per_day?: number
          rating_labels?: Json
          rating_order?: Json
          rating_styles?: Json
          relearning_steps?: Json
          reviews_per_day?: number
          scheduler_profiles?: Json
          session_defaults?: Json
          show_keyboard_hints?: boolean
          swipe_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      review_states: {
        Row: {
          card_id: string
          difficulty: number | null
          due_at: string | null
          lapses: number
          last_reviewed_at: string | null
          queue: Database["public"]["Enums"]["card_queue"]
          reps: number
          scheduled_days: number
          stability: number | null
          state_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          difficulty?: number | null
          due_at?: string | null
          lapses?: number
          last_reviewed_at?: string | null
          queue?: Database["public"]["Enums"]["card_queue"]
          reps?: number
          scheduled_days?: number
          stability?: number | null
          state_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          card_id?: string
          difficulty?: number | null
          due_at?: string | null
          lapses?: number
          last_reviewed_at?: string | null
          queue?: Database["public"]["Enums"]["card_queue"]
          reps?: number
          scheduled_days?: number
          stability?: number | null
          state_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_states_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_filters: {
        Row: {
          created_at: string
          id: string
          kind: string
          name: string
          query: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          name: string
          query?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          name?: string
          query?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string
          filters: Json
          id: string
          name: string
          query: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          name: string
          query: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          query?: string
          user_id?: string
        }
        Relationships: []
      }
      sync_changes: {
        Row: {
          cursor: number
          entity_id: string
          entity_type: string
          event_key: string
          occurred_at: string
          operation: string
          payload: Json
          user_id: string
        }
        Insert: {
          cursor?: never
          entity_id: string
          entity_type: string
          event_key: string
          occurred_at?: string
          operation: string
          payload?: Json
          user_id: string
        }
        Update: {
          cursor?: never
          entity_id?: string
          entity_type?: string
          event_key?: string
          occurred_at?: string
          operation?: string
          payload?: Json
          user_id?: string
        }
        Relationships: []
      }
      sync_conflicts: {
        Row: {
          card_id: string
          current_reviewed_at: string | null
          current_state: Json
          detected_at: string
          event_key: string
          id: string
          incoming_reviewed_at: string | null
          incoming_state: Json
          resolution: string | null
          resolved_at: string | null
          user_id: string
        }
        Insert: {
          card_id: string
          current_reviewed_at?: string | null
          current_state?: Json
          detected_at?: string
          event_key: string
          id?: string
          incoming_reviewed_at?: string | null
          incoming_state?: Json
          resolution?: string | null
          resolved_at?: string | null
          user_id: string
        }
        Update: {
          card_id?: string
          current_reviewed_at?: string | null
          current_state?: Json
          detected_at?: string
          event_key?: string
          id?: string
          incoming_reviewed_at?: string | null
          incoming_state?: Json
          resolution?: string | null
          resolved_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_conflicts_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_conflicts_event_key_fkey"
            columns: ["event_key"]
            isOneToOne: false
            referencedRelation: "review_events"
            referencedColumns: ["event_key"]
          },
        ]
      }
      sync_cursors: {
        Row: {
          last_cursor: number
          updated_at: string
          user_id: string
        }
        Insert: {
          last_cursor?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          last_cursor?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sync_operations: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          operation: string
          operation_id: string
          payload: Json
          sequence: number
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          operation: string
          operation_id: string
          payload?: Json
          sequence?: number
          user_id: string
          version: number
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          operation?: string
          operation_id?: string
          payload?: Json
          sequence?: number
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "sync_operations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          id: string
          name: string
          parent_id: string | null
          workspace_id: string
        }
        Insert: {
          id?: string
          name: string
          parent_id?: string | null
          workspace_id: string
        }
        Update: {
          id?: string
          name?: string
          parent_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tags_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          due_at: string | null
          id: string
          priority: string
          project_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_at?: string | null
          id: string
          priority?: string
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: string
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      workspace_audit_logs: {
        Row: {
          actor_id: string
          created_at: string
          event_type: string
          id: string
          metadata: Json
          target_user_id: string | null
          workspace_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          target_user_id?: string | null
          workspace_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          target_user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_audit_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string | null
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["workspace_role"]
          token_hash: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email?: string | null
          expires_at: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["workspace_role"]
          token_hash: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          token_hash?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["workspace_kind"]
          name: string
          owner_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["workspace_kind"]
          name: string
          owner_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["workspace_kind"]
          name?: string
          owner_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          bio: string | null
          avatar_url: string | null
          created_at: string
          show_activity: boolean
          show_followers: boolean
        }
      }
    }
    Functions: {
      is_platform_moderator: { Args: never; Returns: boolean }
    }
    Enums: {
      card_kind:
        | "basic"
        | "reverse"
        | "cloze"
        | "multiple_choice"
        | "image"
        | "custom"
      card_queue: "learning" | "review" | "relearning" | "suspended"
      collection_kind: "favorites" | "custom" | "smart"
      deck_visibility: "private" | "workspace" | "public"
      review_rating: "again" | "hard" | "good" | "easy"
      workspace_kind: "personal" | "team"
      workspace_role: "owner" | "admin" | "editor" | "reviewer" | "viewer"
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
    Enums: {
      card_kind: [
        "basic",
        "reverse",
        "cloze",
        "multiple_choice",
        "image",
        "custom",
      ],
      card_queue: ["learning", "review", "relearning", "suspended"],
      collection_kind: ["favorites", "custom", "smart"],
      deck_visibility: ["private", "workspace", "public"],
      review_rating: ["again", "hard", "good", "easy"],
      workspace_kind: ["personal", "team"],
      workspace_role: ["owner", "admin", "editor", "reviewer", "viewer"],
    },
  },
} as const
