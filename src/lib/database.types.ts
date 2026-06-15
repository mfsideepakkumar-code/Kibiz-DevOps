export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_usage_log: {
        Row: {
          cache_creation_input_tokens: number
          cache_read_input_tokens: number
          created_at: string
          feature: string
          id: string
          input_tokens: number
          model: string
          output_tokens: number
          status: string
          user_id: string | null
        }
        Insert: {
          cache_creation_input_tokens?: number
          cache_read_input_tokens?: number
          created_at?: string
          feature: string
          id?: string
          input_tokens?: number
          model: string
          output_tokens?: number
          status?: string
          user_id?: string | null
        }
        Update: {
          cache_creation_input_tokens?: number
          cache_read_input_tokens?: number
          created_at?: string
          feature?: string
          id?: string
          input_tokens?: number
          model?: string
          output_tokens?: number
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_log_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          created_at: string
          decision: string | null
          id: string
          item_id: string
          item_type: string
          notes: string | null
          reviewer_id: string | null
        }
        Insert: {
          created_at?: string
          decision?: string | null
          id?: string
          item_id: string
          item_type: string
          notes?: string | null
          reviewer_id?: string | null
        }
        Update: {
          created_at?: string
          decision?: string | null
          id?: string
          item_id?: string
          item_type?: string
          notes?: string | null
          reviewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approvals_reviewer_id_fkey"
            columns: ["reviewer_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          diff: Json | null
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_summaries: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          generated_by: string
          id: string
          internal_detail: string | null
          status: string
          summary_text: string | null
          ticket_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          generated_by?: string
          id?: string
          internal_detail?: string | null
          status?: string
          summary_text?: string | null
          ticket_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          generated_by?: string
          id?: string
          internal_detail?: string | null
          status?: string
          summary_text?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_summaries_approved_by_fkey"
            columns: ["approved_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_summaries_ticket_id_fkey"
            columns: ["ticket_id"]
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      bugs: {
        Row: {
          converted_to_id: string | null
          converted_to_type: string | null
          created_at: string
          description: string | null
          duplicate_of_id: string | null
          id: string
          project_id: string
          reporter_id: string | null
          title: string
          triage_status: string
        }
        Insert: {
          converted_to_id?: string | null
          converted_to_type?: string | null
          created_at?: string
          description?: string | null
          duplicate_of_id?: string | null
          id?: string
          project_id: string
          reporter_id?: string | null
          title: string
          triage_status?: string
        }
        Update: {
          converted_to_id?: string | null
          converted_to_type?: string | null
          created_at?: string
          description?: string | null
          duplicate_of_id?: string | null
          id?: string
          project_id?: string
          reporter_id?: string | null
          title?: string
          triage_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bugs_duplicate_of_id_fkey"
            columns: ["duplicate_of_id"]
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bugs_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bugs_reporter_id_fkey"
            columns: ["reporter_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          default_billable: boolean | null
          id: string
          name: string
        }
        Insert: {
          default_billable?: boolean | null
          id?: string
          name: string
        }
        Update: {
          default_billable?: boolean | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      client_contacts: {
        Row: {
          client_id: string
          email: string | null
          has_portal_access: boolean
          id: string
          is_primary: boolean
          name: string
          phone: string | null
          receives_invoices: boolean
          receives_reports: boolean
        }
        Insert: {
          client_id: string
          email?: string | null
          has_portal_access?: boolean
          id?: string
          is_primary?: boolean
          name: string
          phone?: string | null
          receives_invoices?: boolean
          receives_reports?: boolean
        }
        Update: {
          client_id?: string
          email?: string | null
          has_portal_access?: boolean
          id?: string
          is_primary?: boolean
          name?: string
          phone?: string | null
          receives_invoices?: boolean
          receives_reports?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_hosting_margins"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_hosting_prices"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_unbilled_exposure"
            referencedColumns: ["client_id"]
          },
        ]
      }
      client_credit_policies: {
        Row: {
          alert_thresholds: number[]
          client_id: string
          credit_limit: number | null
        }
        Insert: {
          alert_thresholds?: number[]
          client_id: string
          credit_limit?: number | null
        }
        Update: {
          alert_thresholds?: number[]
          client_id?: string
          credit_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_credit_policies_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_credit_policies_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_hosting_margins"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_credit_policies_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_hosting_prices"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_credit_policies_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_unbilled_exposure"
            referencedColumns: ["client_id"]
          },
        ]
      }
      client_pricing: {
        Row: {
          billing_increment: string
          client_id: string
          filemaker_license_cycle: string | null
          filemaker_license_price: number | null
          hosting_cycle: string | null
          hosting_price: number | null
          hourly_rate: number | null
          notes: string | null
          price_history: Json[]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          billing_increment?: string
          client_id: string
          filemaker_license_cycle?: string | null
          filemaker_license_price?: number | null
          hosting_cycle?: string | null
          hosting_price?: number | null
          hourly_rate?: number | null
          notes?: string | null
          price_history?: Json[]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          billing_increment?: string
          client_id?: string
          filemaker_license_cycle?: string | null
          filemaker_license_price?: number | null
          hosting_cycle?: string | null
          hosting_price?: number | null
          hourly_rate?: number | null
          notes?: string | null
          price_history?: Json[]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_pricing_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_pricing_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_hosting_margins"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_pricing_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_hosting_prices"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_pricing_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_unbilled_exposure"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_pricing_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      client_subscriptions: {
        Row: {
          auto_renew: boolean
          auto_send_invoice: boolean
          billing_day_override: number | null
          client_id: string
          created_at: string
          id: string
          product_id: string
          qty: number
          renewal_date: string | null
          unit_price_override: number | null
        }
        Insert: {
          auto_renew?: boolean
          auto_send_invoice?: boolean
          billing_day_override?: number | null
          client_id: string
          created_at?: string
          id?: string
          product_id: string
          qty?: number
          renewal_date?: string | null
          unit_price_override?: number | null
        }
        Update: {
          auto_renew?: boolean
          auto_send_invoice?: boolean
          billing_day_override?: number | null
          client_id?: string
          created_at?: string
          id?: string
          product_id?: string
          qty?: number
          renewal_date?: string | null
          unit_price_override?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_subscriptions_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_hosting_margins"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_subscriptions_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_hosting_prices"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_subscriptions_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_unbilled_exposure"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_subscriptions_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "v_hosting_margins"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "client_subscriptions_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "v_hosting_prices"
            referencedColumns: ["product_id"]
          },
        ]
      }
      clients: {
        Row: {
          engagement_model: string | null
          fm_client_id: string | null
          id: string
          industry: string | null
          is_active: boolean
          name: string
        }
        Insert: {
          engagement_model?: string | null
          fm_client_id?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean
          name: string
        }
        Update: {
          engagement_model?: string | null
          fm_client_id?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      company_config: {
        Row: {
          address: string | null
          billable_target_percent: number
          company_name: string
          daily_digest_time: string
          default_currency: string
          default_payment_terms_days: number
          email: string | null
          fiscal_year_start: string | null
          id: string
          invoice_prefix: string
          kicare_buckets_counted: string
          logo_url: string | null
          monthly_billing_day: number
          phone: string | null
          profit_margin_target: number
          reminder_schedule: Json | null
          tax_label: string | null
          tax_rate: number | null
          timesheet_review_deadline: string | null
          timesheet_submit_deadline: string | null
          website: string | null
          work_week_start: string
        }
        Insert: {
          address?: string | null
          billable_target_percent?: number
          company_name: string
          daily_digest_time?: string
          default_currency?: string
          default_payment_terms_days?: number
          email?: string | null
          fiscal_year_start?: string | null
          id?: string
          invoice_prefix?: string
          kicare_buckets_counted?: string
          logo_url?: string | null
          monthly_billing_day?: number
          phone?: string | null
          profit_margin_target?: number
          reminder_schedule?: Json | null
          tax_label?: string | null
          tax_rate?: number | null
          timesheet_review_deadline?: string | null
          timesheet_submit_deadline?: string | null
          website?: string | null
          work_week_start?: string
        }
        Update: {
          address?: string | null
          billable_target_percent?: number
          company_name?: string
          daily_digest_time?: string
          default_currency?: string
          default_payment_terms_days?: number
          email?: string | null
          fiscal_year_start?: string | null
          id?: string
          invoice_prefix?: string
          kicare_buckets_counted?: string
          logo_url?: string | null
          monthly_billing_day?: number
          phone?: string | null
          profit_margin_target?: number
          reminder_schedule?: Json | null
          tax_label?: string | null
          tax_rate?: number | null
          timesheet_review_deadline?: string | null
          timesheet_submit_deadline?: string | null
          website?: string | null
          work_week_start?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          date: string | null
          id: string
          is_pass_through: boolean
          profit_center_id: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          date?: string | null
          id?: string
          is_pass_through?: boolean
          profit_center_id?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          date?: string | null
          id?: string
          is_pass_through?: boolean
          profit_center_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_profit_center_id_fkey"
            columns: ["profit_center_id"]
            referencedRelation: "profit_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_items: {
        Row: {
          added_by: string | null
          carried_from_date: string | null
          date: string
          id: string
          planned_minutes: number | null
          recurring_template_id: string | null
          removal_reason: string | null
          sort_order: number | null
          status: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          added_by?: string | null
          carried_from_date?: string | null
          date: string
          id?: string
          planned_minutes?: number | null
          recurring_template_id?: string | null
          removal_reason?: string | null
          sort_order?: number | null
          status?: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          added_by?: string | null
          carried_from_date?: string | null
          date?: string
          id?: string
          planned_minutes?: number | null
          recurring_template_id?: string | null
          removal_reason?: string | null
          sort_order?: number | null
          status?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_items_added_by_fkey"
            columns: ["added_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_items_recurring_template_id_fkey"
            columns: ["recurring_template_id"]
            referencedRelation: "recurring_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_items_task_id_fkey"
            columns: ["task_id"]
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_items_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hour_block_drawdowns: {
        Row: {
          drawn_at: string
          hour_block_id: string
          hours_drawn: number
          id: string
          time_entry_id: string
        }
        Insert: {
          drawn_at?: string
          hour_block_id: string
          hours_drawn: number
          id?: string
          time_entry_id: string
        }
        Update: {
          drawn_at?: string
          hour_block_id?: string
          hours_drawn?: number
          id?: string
          time_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hour_block_drawdowns_hour_block_id_fkey"
            columns: ["hour_block_id"]
            referencedRelation: "hour_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hour_block_drawdowns_hour_block_id_fkey"
            columns: ["hour_block_id"]
            referencedRelation: "v_block_burn"
            referencedColumns: ["hour_block_id"]
          },
          {
            foreignKeyName: "hour_block_drawdowns_time_entry_id_fkey"
            columns: ["time_entry_id"]
            referencedRelation: "time_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      hour_blocks: {
        Row: {
          activated_at: string | null
          alert_thresholds: number[]
          alerts_sent: number[]
          client_id: string
          created_at: string
          created_by: string | null
          depleted_at: string | null
          id: string
          invoice_id: string | null
          linked_project_ids: string[] | null
          notes: string | null
          rate: number | null
          status: string
          total_hours: number
        }
        Insert: {
          activated_at?: string | null
          alert_thresholds?: number[]
          alerts_sent?: number[]
          client_id: string
          created_at?: string
          created_by?: string | null
          depleted_at?: string | null
          id?: string
          invoice_id?: string | null
          linked_project_ids?: string[] | null
          notes?: string | null
          rate?: number | null
          status?: string
          total_hours: number
        }
        Update: {
          activated_at?: string | null
          alert_thresholds?: number[]
          alerts_sent?: number[]
          client_id?: string
          created_at?: string
          created_by?: string | null
          depleted_at?: string | null
          id?: string
          invoice_id?: string | null
          linked_project_ids?: string[] | null
          notes?: string | null
          rate?: number | null
          status?: string
          total_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "hour_blocks_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hour_blocks_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_hosting_margins"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "hour_blocks_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_hosting_prices"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "hour_blocks_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_unbilled_exposure"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "hour_blocks_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hour_blocks_invoice_id_fkey"
            columns: ["invoice_id"]
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_lines: {
        Row: {
          amount: number | null
          description: string
          id: string
          invoice_id: string
          is_included: boolean
          product_id: string | null
          profit_center_id: string | null
          qty: number | null
          sort_order: number | null
          time_entry_id: string | null
          type: string
          unit_price: number | null
        }
        Insert: {
          amount?: number | null
          description: string
          id?: string
          invoice_id: string
          is_included?: boolean
          product_id?: string | null
          profit_center_id?: string | null
          qty?: number | null
          sort_order?: number | null
          time_entry_id?: string | null
          type: string
          unit_price?: number | null
        }
        Update: {
          amount?: number | null
          description?: string
          id?: string
          invoice_id?: string
          is_included?: boolean
          product_id?: string | null
          profit_center_id?: string | null
          qty?: number | null
          sort_order?: number | null
          time_entry_id?: string | null
          type?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "v_hosting_margins"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "invoice_lines_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "v_hosting_prices"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "invoice_lines_profit_center_id_fkey"
            columns: ["profit_center_id"]
            referencedRelation: "profit_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_time_entry_id_fkey"
            columns: ["time_entry_id"]
            referencedRelation: "time_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due: number | null
          amount_paid: number
          client_id: string
          created_at: string
          created_by: string | null
          currency: string
          due_date: string | null
          id: string
          internal_notes: string | null
          invoice_no: string
          issue_date: string | null
          pdf_path: string | null
          portal_token: string | null
          status: string
          subtotal: number | null
          tax_amount: number
          tax_label: string | null
          total: number | null
          void_at: string | null
          void_by: string | null
          void_reason: string | null
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number
          client_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          internal_notes?: string | null
          invoice_no: string
          issue_date?: string | null
          pdf_path?: string | null
          portal_token?: string | null
          status?: string
          subtotal?: number | null
          tax_amount?: number
          tax_label?: string | null
          total?: number | null
          void_at?: string | null
          void_by?: string | null
          void_reason?: string | null
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number
          client_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          internal_notes?: string | null
          invoice_no?: string
          issue_date?: string | null
          pdf_path?: string | null
          portal_token?: string | null
          status?: string
          subtotal?: number | null
          tax_amount?: number
          tax_label?: string | null
          total?: number | null
          void_at?: string | null
          void_by?: string | null
          void_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_hosting_margins"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_hosting_prices"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_unbilled_exposure"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_void_by_fkey"
            columns: ["void_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      kicare_contracts: {
        Row: {
          client_id: string
          contract_amount: number
          end_date: string
          id: string
          project_ids: string[] | null
          renewal_date: string | null
          scope_definition: string | null
          start_date: string
        }
        Insert: {
          client_id: string
          contract_amount: number
          end_date: string
          id?: string
          project_ids?: string[] | null
          renewal_date?: string | null
          scope_definition?: string | null
          start_date: string
        }
        Update: {
          client_id?: string
          contract_amount?: number
          end_date?: string
          id?: string
          project_ids?: string[] | null
          renewal_date?: string | null
          scope_definition?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "kicare_contracts_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kicare_contracts_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_hosting_margins"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "kicare_contracts_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_hosting_prices"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "kicare_contracts_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_unbilled_exposure"
            referencedColumns: ["client_id"]
          },
        ]
      }
      mcp_api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          last_used_at: string | null
          name: string
          scope: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          last_used_at?: string | null
          name: string
          scope: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          last_used_at?: string | null
          name?: string
          scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcp_api_keys_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_audit_log: {
        Row: {
          called_at: string
          duration_ms: number | null
          id: string
          ip_address: string | null
          key_id: string | null
          params_sanitized: Json | null
          result_status: string | null
          tool: string
        }
        Insert: {
          called_at?: string
          duration_ms?: number | null
          id?: string
          ip_address?: string | null
          key_id?: string | null
          params_sanitized?: Json | null
          result_status?: string | null
          tool: string
        }
        Update: {
          called_at?: string
          duration_ms?: number | null
          id?: string
          ip_address?: string | null
          key_id?: string | null
          params_sanitized?: Json | null
          result_status?: string | null
          tool?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcp_audit_log_key_id_fkey"
            columns: ["key_id"]
            referencedRelation: "mcp_api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          completed_at: string | null
          description: string | null
          id: string
          name: string
          project_id: string
          status: string
          target_date: string | null
          target_hours: number | null
        }
        Insert: {
          completed_at?: string | null
          description?: string | null
          id?: string
          name: string
          project_id: string
          status?: string
          target_date?: string | null
          target_hours?: number | null
        }
        Update: {
          completed_at?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          status?: string
          target_date?: string | null
          target_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          channel: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          severity: string
          type: string
          user_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          severity?: string
          type: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          severity?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_reminders: {
        Row: {
          id: string
          invoice_id: string
          sent_at: string
          sent_to: string[] | null
          type: string
        }
        Insert: {
          id?: string
          invoice_id: string
          sent_at?: string
          sent_to?: string[] | null
          type: string
        }
        Update: {
          id?: string
          invoice_id?: string
          sent_at?: string
          sent_to?: string[] | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_reminders_invoice_id_fkey"
            columns: ["invoice_id"]
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          cayan_transaction_id: string | null
          created_at: string
          currency: string
          id: string
          invoice_id: string
          method: string
          paid_at: string | null
          receipt_sent_at: string | null
          recorded_by: string | null
          reference_note: string | null
        }
        Insert: {
          amount: number
          cayan_transaction_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          invoice_id: string
          method: string
          paid_at?: string | null
          receipt_sent_at?: string | null
          recorded_by?: string | null
          reference_note?: string | null
        }
        Update: {
          amount?: number
          cayan_transaction_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string
          method?: string
          paid_at?: string | null
          receipt_sent_at?: string | null
          recorded_by?: string | null
          reference_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_recorded_by_fkey"
            columns: ["recorded_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          billing_cycle: string | null
          category: string | null
          cost_price: number | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          profit_center_id: string | null
          unit_price: number | null
        }
        Insert: {
          billing_cycle?: string | null
          category?: string | null
          cost_price?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          profit_center_id?: string | null
          unit_price?: number | null
        }
        Update: {
          billing_cycle?: string | null
          category?: string | null
          cost_price?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          profit_center_id?: string | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_profit_center_id_fkey"
            columns: ["profit_center_id"]
            referencedRelation: "profit_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      profit_centers: {
        Row: {
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      project_rates: {
        Row: {
          billing_rate_per_hour: number | null
          cost_rate_per_hour: number | null
          effective_from: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          billing_rate_per_hour?: number | null
          cost_rate_per_hour?: number | null
          effective_from: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          billing_rate_per_hour?: number | null
          cost_rate_per_hour?: number | null
          effective_from?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_rates_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_rates_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          default_profit_center_id: string | null
          default_rate_per_hour: number | null
          id: string
          is_internal: boolean
          name: string
          sow_hours: number | null
          status: string
        }
        Insert: {
          client_id: string
          default_profit_center_id?: string | null
          default_rate_per_hour?: number | null
          id?: string
          is_internal?: boolean
          name: string
          sow_hours?: number | null
          status?: string
        }
        Update: {
          client_id?: string
          default_profit_center_id?: string | null
          default_rate_per_hour?: number | null
          id?: string
          is_internal?: boolean
          name?: string
          sow_hours?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_hosting_margins"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_hosting_prices"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_unbilled_exposure"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "projects_default_profit_center_id_fkey"
            columns: ["default_profit_center_id"]
            referencedRelation: "profit_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_templates: {
        Row: {
          activity_type: string | null
          billable: boolean
          days_of_week: number[]
          default_minutes: number | null
          id: string
          is_active: boolean
          task_id: string | null
          ticket_id: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          activity_type?: string | null
          billable?: boolean
          days_of_week: number[]
          default_minutes?: number | null
          id?: string
          is_active?: boolean
          task_id?: string | null
          ticket_id?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          activity_type?: string | null
          billable?: boolean
          days_of_week?: number[]
          default_minutes?: number | null
          id?: string
          is_active?: boolean
          task_id?: string | null
          ticket_id?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_templates_task_id_fkey"
            columns: ["task_id"]
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_templates_ticket_id_fkey"
            columns: ["ticket_id"]
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_templates_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      report_snapshots: {
        Row: {
          data_snapshot: Json | null
          date_from: string | null
          date_to: string | null
          filters: Json | null
          generated_at: string
          generated_by: string | null
          id: string
          pdf_path: string | null
          type: string
        }
        Insert: {
          data_snapshot?: Json | null
          date_from?: string | null
          date_to?: string | null
          filters?: Json | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          pdf_path?: string | null
          type: string
        }
        Update: {
          data_snapshot?: Json | null
          date_from?: string | null
          date_to?: string | null
          filters?: Json | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          pdf_path?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_snapshots_generated_by_fkey"
            columns: ["generated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          capacity_hours: number | null
          id: string
          monthly_rate: number | null
          name: string
          type: string | null
        }
        Insert: {
          capacity_hours?: number | null
          id?: string
          monthly_rate?: number | null
          name: string
          type?: string | null
        }
        Update: {
          capacity_hours?: number | null
          id?: string
          monthly_rate?: number | null
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      splits: {
        Row: {
          billable: boolean | null
          id: string
          percent: number
          profit_center_id: string
          time_entry_id: string
        }
        Insert: {
          billable?: boolean | null
          id?: string
          percent: number
          profit_center_id: string
          time_entry_id: string
        }
        Update: {
          billable?: boolean | null
          id?: string
          percent?: number
          profit_center_id?: string
          time_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "splits_profit_center_id_fkey"
            columns: ["profit_center_id"]
            referencedRelation: "profit_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "splits_time_entry_id_fkey"
            columns: ["time_entry_id"]
            referencedRelation: "time_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          end_date: string | null
          goal: string | null
          id: string
          name: string
          project_id: string
          start_date: string | null
          status: string
        }
        Insert: {
          end_date?: string | null
          goal?: string | null
          id?: string
          name: string
          project_id: string
          start_date?: string | null
          status?: string
        }
        Update: {
          end_date?: string | null
          goal?: string | null
          id?: string
          name?: string
          project_id?: string
          start_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprints_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_projects: {
        Row: {
          end_date: string | null
          id: string
          name: string
          notes: string | null
          project_id: string
          sow_hours: number | null
          start_date: string | null
          status: string
        }
        Insert: {
          end_date?: string | null
          id?: string
          name: string
          notes?: string | null
          project_id: string
          sow_hours?: number | null
          start_date?: string | null
          status?: string
        }
        Update: {
          end_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          project_id?: string
          sow_hours?: number | null
          start_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_projects_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          activity_type: string | null
          assignee_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          estimated_hours: number | null
          id: string
          milestone_id: string | null
          priority: string | null
          sprint_id: string | null
          status: string
          ticket_id: string
          title: string
        }
        Insert: {
          activity_type?: string | null
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          milestone_id?: string | null
          priority?: string | null
          sprint_id?: string | null
          status?: string
          ticket_id: string
          title: string
        }
        Update: {
          activity_type?: string | null
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          milestone_id?: string | null
          priority?: string | null
          sprint_id?: string | null
          status?: string
          ticket_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_milestone_id_fkey"
            columns: ["milestone_id"]
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_sprint_id_fkey"
            columns: ["sprint_id"]
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_ticket_id_fkey"
            columns: ["ticket_id"]
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          billing_type: string | null
          category_id: string
          created_at: string
          created_by: string | null
          description: string | null
          escalation_level: number
          fm_ticket_id: string | null
          id: string
          priority: string | null
          profit_center_id: string | null
          project_id: string
          status: string
          sub_project_id: string | null
          ticket_no: string | null
          title: string
          updated_at: string
        }
        Insert: {
          billing_type?: string | null
          category_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          escalation_level?: number
          fm_ticket_id?: string | null
          id?: string
          priority?: string | null
          profit_center_id?: string | null
          project_id: string
          status?: string
          sub_project_id?: string | null
          ticket_no?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          billing_type?: string | null
          category_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          escalation_level?: number
          fm_ticket_id?: string | null
          id?: string
          priority?: string | null
          profit_center_id?: string | null
          project_id?: string
          status?: string
          sub_project_id?: string | null
          ticket_no?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_profit_center_id_fkey"
            columns: ["profit_center_id"]
            referencedRelation: "profit_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_sub_project_id_fkey"
            columns: ["sub_project_id"]
            referencedRelation: "sub_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_sub_project_same_project_fk"
            columns: ["project_id", "sub_project_id"]
            referencedRelation: "sub_projects"
            referencedColumns: ["project_id", "id"]
          },
        ]
      }
      time_entries: {
        Row: {
          activity_type: string | null
          billable: boolean
          billable_label: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          edit_history: Json[]
          end_time: string | null
          fm_sync_status: string
          fm_synced_at: string | null
          id: string
          invoice_id: string | null
          local_id: string | null
          project_id: string
          rate_applied: number | null
          start_time: string | null
          state: string
          task_id: string | null
          ticket_id: string | null
          user_id: string
          work_date: string
        }
        Insert: {
          activity_type?: string | null
          billable: boolean
          billable_label?: string | null
          created_at?: string
          description?: string | null
          duration_minutes: number
          edit_history?: Json[]
          end_time?: string | null
          fm_sync_status?: string
          fm_synced_at?: string | null
          id?: string
          invoice_id?: string | null
          local_id?: string | null
          project_id: string
          rate_applied?: number | null
          start_time?: string | null
          state?: string
          task_id?: string | null
          ticket_id?: string | null
          user_id: string
          work_date: string
        }
        Update: {
          activity_type?: string | null
          billable?: boolean
          billable_label?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          edit_history?: Json[]
          end_time?: string | null
          fm_sync_status?: string
          fm_synced_at?: string | null
          id?: string
          invoice_id?: string | null
          local_id?: string | null
          project_id?: string
          rate_applied?: number | null
          start_time?: string | null
          state?: string
          task_id?: string | null
          ticket_id?: string | null
          user_id?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_invoice_id_fkey"
            columns: ["invoice_id"]
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_ticket_id_fkey"
            columns: ["ticket_id"]
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      timer_state: {
        Row: {
          accumulated_seconds: number
          started_at: string | null
          task_id: string | null
          user_id: string
        }
        Insert: {
          accumulated_seconds?: number
          started_at?: string | null
          task_id?: string | null
          user_id: string
        }
        Update: {
          accumulated_seconds?: number
          started_at?: string | null
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timer_state_task_id_fkey"
            columns: ["task_id"]
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timer_state_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheets: {
        Row: {
          approved_at: string | null
          billed_at: string | null
          id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string | null
          user_id: string
          week_start: string
        }
        Insert: {
          approved_at?: string | null
          billed_at?: string | null
          id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          user_id: string
          week_start: string
        }
        Update: {
          approved_at?: string | null
          billed_at?: string | null
          id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_reviewed_by_fkey"
            columns: ["reviewed_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          billing_rate_per_hour: number | null
          cost_rate_per_hour: number | null
          daily_capacity_hours: number
          email: string
          fm_email: string | null
          id: string
          is_active: boolean
          name: string
          resource_id: string | null
          role: string
        }
        Insert: {
          billing_rate_per_hour?: number | null
          cost_rate_per_hour?: number | null
          daily_capacity_hours?: number
          email: string
          fm_email?: string | null
          id?: string
          is_active?: boolean
          name: string
          resource_id?: string | null
          role: string
        }
        Update: {
          billing_rate_per_hour?: number | null
          cost_rate_per_hour?: number | null
          daily_capacity_hours?: number
          email?: string
          fm_email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          resource_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_resource_id_fkey"
            columns: ["resource_id"]
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          date_from: string | null
          date_to: string | null
          hour_block_id: string | null
          id: string
          pdf_path: string | null
          sent_at: string | null
          sent_to: string[] | null
          snapshot: Json | null
          work_order_no: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          date_from?: string | null
          date_to?: string | null
          hour_block_id?: string | null
          id?: string
          pdf_path?: string | null
          sent_at?: string | null
          sent_to?: string[] | null
          snapshot?: Json | null
          work_order_no?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          date_from?: string | null
          date_to?: string | null
          hour_block_id?: string | null
          id?: string
          pdf_path?: string | null
          sent_at?: string | null
          sent_to?: string[] | null
          snapshot?: Json | null
          work_order_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_hosting_margins"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "work_orders_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_hosting_prices"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "work_orders_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_unbilled_exposure"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "work_orders_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_hour_block_id_fkey"
            columns: ["hour_block_id"]
            referencedRelation: "hour_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_hour_block_id_fkey"
            columns: ["hour_block_id"]
            referencedRelation: "v_block_burn"
            referencedColumns: ["hour_block_id"]
          },
        ]
      }
    }
    Views: {
      v_billable_by_developer: {
        Row: {
          billable: boolean | null
          hours: number | null
          minutes: number | null
          state: string | null
          user_id: string | null
          user_name: string | null
          work_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      v_block_burn: {
        Row: {
          activated_at: string | null
          alert_thresholds: number[] | null
          alerts_sent: number[] | null
          client_id: string | null
          hour_block_id: string | null
          projected_depletion_date: string | null
          remaining_hours: number | null
          status: string | null
          total_hours: number | null
          trailing_3wk_weekly_burn: number | null
          used_hours: number | null
          used_percent: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hour_blocks_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hour_blocks_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_hosting_margins"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "hour_blocks_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_hosting_prices"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "hour_blocks_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_unbilled_exposure"
            referencedColumns: ["client_id"]
          },
        ]
      }
      v_executive_kpis: {
        Row: {
          active_clients: number | null
          active_projects: number | null
          billable_hours_30d: number | null
          outstanding_receivables: number | null
          refreshed_at: string | null
          revenue_invoiced_30d: number | null
          total_approved_hours_30d: number | null
        }
        Relationships: []
      }
      v_goal_plan_vs_actual: {
        Row: {
          actual_minutes: number | null
          date: string | null
          planned_minutes: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_hosting_margins: {
        Row: {
          category: string | null
          client_id: string | null
          client_name: string | null
          cost_price: number | null
          margin: number | null
          margin_percent: number | null
          price: number | null
          product_id: string | null
          product_name: string | null
          qty: number | null
          renewal_date: string | null
        }
        Relationships: []
      }
      v_hosting_prices: {
        Row: {
          category: string | null
          client_id: string | null
          client_name: string | null
          price: number | null
          product_id: string | null
          product_name: string | null
          qty: number | null
          renewal_date: string | null
        }
        Relationships: []
      }
      v_kicare_profitability: {
        Row: {
          client_id: string | null
          client_name: string | null
          contract_amount: number | null
          contract_id: string | null
          end_date: string | null
          hourly_rate: number | null
          non_billable_hours: number | null
          renewal_date: string | null
          start_date: string | null
          status: string | null
          surplus: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kicare_contracts_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kicare_contracts_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_hosting_margins"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "kicare_contracts_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_hosting_prices"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "kicare_contracts_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "v_unbilled_exposure"
            referencedColumns: ["client_id"]
          },
        ]
      }
      v_unbilled_exposure: {
        Row: {
          client_id: string | null
          client_name: string | null
          credit_limit: number | null
          exposure_percent: number | null
          unbilled_amount: number | null
          unbilled_minutes: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      fn_current_role: { Args: never; Returns: string }
      fn_is_manager_up: { Args: never; Returns: boolean }
      fn_is_staff: { Args: never; Returns: boolean }
      fn_refresh_executive_kpis: { Args: never; Returns: undefined }
      fn_resolve_rate: {
        Args: { p_project_id: string; p_user_id: string; p_work_date: string }
        Returns: number
      }
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

