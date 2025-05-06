
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client with the service role key for full database access
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting backup generation...");
    
    // Get schemas and tables information
    const { data: schemas, error: schemasError } = await supabaseAdmin.rpc('get_schemas_info');
    
    if (schemasError) {
      throw new Error(`Error fetching schemas info: ${schemasError.message}`);
    }
    
    // Generate SQL script
    let sqlScript = `-- Database backup script generated on ${new Date().toISOString()}\n\n`;
    
    // Add schemas creation
    sqlScript += `-- Schemas creation\n`;
    for (const schema of schemas) {
      if (schema.name !== 'public' && 
          !schema.name.startsWith('pg_') && 
          schema.name !== 'information_schema') {
        sqlScript += `CREATE SCHEMA IF NOT EXISTS "${schema.name}";\n`;
      }
    }
    sqlScript += `\n`;
    
    // Fetch data from main tables
    const mainTables = ["clients", "plans", "subscriptions", "payments", "users"];
    const backupData = {};
    
    // Collect data from each table
    for (const table of mainTables) {
      const { data, error } = await supabaseAdmin.from(table).select("*");
      
      if (error) {
        throw new Error(`Error fetching data from ${table}: ${error.message}`);
      }
      
      backupData[table] = data;
    }
    
    // Generate table creation scripts for public schema
    sqlScript += `-- PUBLIC SCHEMA TABLES\n`;
    
    sqlScript += `-- Table structure for clients\n`;
    sqlScript += `CREATE TABLE IF NOT EXISTS public.clients (\n`;
    sqlScript += `  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`;
    sqlScript += `  name TEXT NOT NULL,\n`;
    sqlScript += `  cpf TEXT NOT NULL,\n`;
    sqlScript += `  email TEXT,\n`;
    sqlScript += `  phone TEXT NOT NULL,\n`;
    sqlScript += `  address TEXT NOT NULL,\n`;
    sqlScript += `  birth_date DATE NOT NULL,\n`;
    sqlScript += `  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),\n`;
    sqlScript += `  photo_url TEXT\n`;
    sqlScript += `);\n\n`;
    
    sqlScript += `-- Table structure for plans\n`;
    sqlScript += `CREATE TABLE IF NOT EXISTS public.plans (\n`;
    sqlScript += `  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`;
    sqlScript += `  name TEXT NOT NULL,\n`;
    sqlScript += `  type TEXT NOT NULL,\n`;
    sqlScript += `  price_brl NUMERIC NOT NULL,\n`;
    sqlScript += `  description TEXT,\n`;
    sqlScript += `  duration_months INTEGER NOT NULL,\n`;
    sqlScript += `  active BOOLEAN DEFAULT true,\n`;
    sqlScript += `  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),\n`;
    sqlScript += `  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()\n`;
    sqlScript += `);\n\n`;
    
    sqlScript += `-- Table structure for users\n`;
    sqlScript += `CREATE TABLE IF NOT EXISTS public.users (\n`;
    sqlScript += `  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`;
    sqlScript += `  name TEXT NOT NULL,\n`;
    sqlScript += `  email TEXT NOT NULL,\n`;
    sqlScript += `  profile TEXT NOT NULL,\n`;
    sqlScript += `  active BOOLEAN DEFAULT true,\n`;
    sqlScript += `  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()\n`;
    sqlScript += `);\n\n`;
    
    sqlScript += `-- Table structure for subscriptions\n`;
    sqlScript += `CREATE TABLE IF NOT EXISTS public.subscriptions (\n`;
    sqlScript += `  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`;
    sqlScript += `  client_id UUID REFERENCES public.clients(id),\n`;
    sqlScript += `  plan_id UUID REFERENCES public.plans(id),\n`;
    sqlScript += `  plan TEXT NOT NULL,\n`;
    sqlScript += `  start_date DATE NOT NULL,\n`;
    sqlScript += `  end_date DATE NOT NULL,\n`;
    sqlScript += `  active BOOLEAN DEFAULT true,\n`;
    sqlScript += `  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()\n`;
    sqlScript += `);\n\n`;
    
    sqlScript += `-- Table structure for payments\n`;
    sqlScript += `CREATE TABLE IF NOT EXISTS public.payments (\n`;
    sqlScript += `  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`;
    sqlScript += `  subscription_id UUID REFERENCES public.subscriptions(id),\n`;
    sqlScript += `  payment_date DATE NOT NULL,\n`;
    sqlScript += `  amount NUMERIC NOT NULL,\n`;
    sqlScript += `  payment_method TEXT NOT NULL,\n`;
    sqlScript += `  confirmed BOOLEAN DEFAULT false,\n`;
    sqlScript += `  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()\n`;
    sqlScript += `);\n\n`;
    
    // Auth schema tables (key tables only)
    sqlScript += `-- AUTH SCHEMA TABLES\n`;
    
    sqlScript += `-- Auth users table structure\n`;
    sqlScript += `CREATE TABLE IF NOT EXISTS auth.users (\n`;
    sqlScript += `  id UUID PRIMARY KEY,\n`;
    sqlScript += `  instance_id UUID,\n`;
    sqlScript += `  email TEXT,\n`;
    sqlScript += `  encrypted_password TEXT,\n`;
    sqlScript += `  email_confirmed_at TIMESTAMP WITH TIME ZONE,\n`;
    sqlScript += `  invited_at TIMESTAMP WITH TIME ZONE,\n`;
    sqlScript += `  confirmation_token TEXT,\n`;
    sqlScript += `  confirmation_sent_at TIMESTAMP WITH TIME ZONE,\n`;
    sqlScript += `  recovery_token TEXT,\n`;
    sqlScript += `  recovery_sent_at TIMESTAMP WITH TIME ZONE,\n`;
    sqlScript += `  email_change_token_new TEXT,\n`;
    sqlScript += `  email_change TEXT,\n`;
    sqlScript += `  email_change_sent_at TIMESTAMP WITH TIME ZONE,\n`;
    sqlScript += `  last_sign_in_at TIMESTAMP WITH TIME ZONE,\n`;
    sqlScript += `  raw_app_meta_data JSONB,\n`;
    sqlScript += `  raw_user_meta_data JSONB,\n`;
    sqlScript += `  is_super_admin BOOLEAN,\n`;
    sqlScript += `  created_at TIMESTAMP WITH TIME ZONE,\n`;
    sqlScript += `  updated_at TIMESTAMP WITH TIME ZONE,\n`;
    sqlScript += `  phone TEXT,\n`;
    sqlScript += `  phone_confirmed_at TIMESTAMP WITH TIME ZONE,\n`;
    sqlScript += `  phone_change TEXT,\n`;
    sqlScript += `  phone_change_token TEXT,\n`;
    sqlScript += `  phone_change_sent_at TIMESTAMP WITH TIME ZONE,\n`;
    sqlScript += `  confirmed_at TIMESTAMP WITH TIME ZONE,\n`;
    sqlScript += `  email_change_token_current TEXT,\n`;
    sqlScript += `  email_change_confirm_status SMALLINT,\n`;
    sqlScript += `  banned_until TIMESTAMP WITH TIME ZONE,\n`;
    sqlScript += `  reauthentication_token TEXT,\n`;
    sqlScript += `  reauthentication_sent_at TIMESTAMP WITH TIME ZONE,\n`;
    sqlScript += `  is_sso_user BOOLEAN DEFAULT false\n`;
    sqlScript += `);\n\n`;
    
    // Storage schema objects
    sqlScript += `-- STORAGE SCHEMA OBJECTS\n`;
    sqlScript += `CREATE SCHEMA IF NOT EXISTS storage;\n\n`;
    
    sqlScript += `-- Storage buckets table structure\n`;
    sqlScript += `CREATE TABLE IF NOT EXISTS storage.buckets (\n`;
    sqlScript += `  id TEXT PRIMARY KEY,\n`;
    sqlScript += `  name TEXT NOT NULL,\n`;
    sqlScript += `  owner UUID,\n`;
    sqlScript += `  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),\n`;
    sqlScript += `  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),\n`;
    sqlScript += `  public BOOLEAN DEFAULT false\n`;
    sqlScript += `);\n\n`;
    
    sqlScript += `-- Storage objects table structure\n`;
    sqlScript += `CREATE TABLE IF NOT EXISTS storage.objects (\n`;
    sqlScript += `  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`;
    sqlScript += `  bucket_id TEXT,\n`;
    sqlScript += `  name TEXT,\n`;
    sqlScript += `  owner UUID,\n`;
    sqlScript += `  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),\n`;
    sqlScript += `  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),\n`;
    sqlScript += `  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),\n`;
    sqlScript += `  metadata JSONB,\n`;
    sqlScript += `  path_tokens TEXT[],\n`;
    sqlScript += `  FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id)\n`;
    sqlScript += `);\n\n`;
    
    // Storage bucket creation for client photos
    sqlScript += `-- Storage bucket for client photos\n`;
    sqlScript += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n`;
    sqlScript += `INSERT INTO storage.buckets (id, name, public) VALUES ('client-photos', 'client-photos', true) ON CONFLICT DO NOTHING;\n\n`;
    
    // Get Row Level Security (RLS) policies
    const { data: policies, error: policiesError } = await supabaseAdmin.from('_rls_policies').select('*');
    
    if (!policiesError && policies) {
      sqlScript += `-- Row Level Security (RLS) Policies\n`;
      for (const policy of policies) {
        sqlScript += `ALTER TABLE ${policy.schema_name}.${policy.table_name} ENABLE ROW LEVEL SECURITY;\n`;
        // The actual policy definition would need to be reconstructed from the policy info
      }
      sqlScript += `\n`;
    }
    
    // Insert data into tables
    for (const table of mainTables) {
      const tableData = backupData[table];
      
      if (tableData && tableData.length > 0) {
        sqlScript += `-- Data for table ${table}\n`;
        
        tableData.forEach((row) => {
          const columns = Object.keys(row).filter(k => row[k] !== null);
          const values = columns.map(col => {
            const val = row[col];
            if (typeof val === 'string') {
              // Escape single quotes in string values
              return `'${val.replace(/'/g, "''")}'`;
            } else if (val instanceof Date) {
              return `'${val.toISOString()}'`;
            } else {
              return val;
            }
          });
          
          sqlScript += `INSERT INTO public.${table} (${columns.join(", ")}) VALUES (${values.join(", ")}) ON CONFLICT DO NOTHING;\n`;
        });
        
        sqlScript += `\n`;
      }
    }
    
    // Functions and procedures
    const { data: functions, error: functionsError } = await supabaseAdmin.rpc('get_functions_info');
    
    if (!functionsError && functions) {
      sqlScript += `-- Functions and procedures\n`;
      for (const func of functions) {
        if (func.definition && !func.name.startsWith('pg_')) {
          sqlScript += `${func.definition}\n\n`;
        }
      }
    }
    
    // Views
    const { data: views, error: viewsError } = await supabaseAdmin.rpc('get_views_info');
    
    if (!viewsError && views) {
      sqlScript += `-- Views\n`;
      for (const view of views) {
        if (view.definition && !view.name.startsWith('pg_') && 
            view.schema !== 'information_schema' && !view.schema.startsWith('pg_')) {
          sqlScript += `CREATE OR REPLACE VIEW ${view.schema}.${view.name} AS\n${view.definition};\n\n`;
        }
      }
    }
    
    // Triggers
    const { data: triggers, error: triggersError } = await supabaseAdmin.rpc('get_triggers_info');
    
    if (!triggersError && triggers) {
      sqlScript += `-- Triggers\n`;
      for (const trigger of triggers) {
        if (trigger.definition && !trigger.name.startsWith('pg_')) {
          sqlScript += `${trigger.definition}\n\n`;
        }
      }
    }
    
    console.log("Backup generation completed");
    
    return new Response(sqlScript, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/sql',
        'Content-Disposition': 'attachment; filename=supabase_backup.sql'
      },
    });
  } catch (error) {
    console.error("Error generating backup:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
