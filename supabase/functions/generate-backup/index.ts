
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
    
    // Check if the helper functions exist by trying to call them
    const { data: schemasCheck, error: schemasCheckError } = await supabaseAdmin.rpc('get_schemas_info');
    
    if (schemasCheckError) {
      console.error("Error checking helper functions:", schemasCheckError.message);
      
      if (schemasCheckError.message.includes("Could not find the function")) {
        return new Response(JSON.stringify({ 
          error: "Helper functions not found in the database. Please run the migration file 20250506_add_backup_helper_functions.sql first.",
          details: "The migrations in supabase/migrations/ need to be applied to the database before using this function."
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw schemasCheckError;
    }
    
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
    
    // Generate the helper functions needed for future backups
    sqlScript += `-- Helper Functions for Backup Process\n`;
    sqlScript += `CREATE OR REPLACE FUNCTION get_schemas_info()\n`;
    sqlScript += `RETURNS TABLE (\n`;
    sqlScript += `  name TEXT,\n`;
    sqlScript += `  owner TEXT\n`;
    sqlScript += `) SECURITY DEFINER AS $$\n`;
    sqlScript += `BEGIN\n`;
    sqlScript += `  RETURN QUERY\n`;
    sqlScript += `  SELECT n.nspname AS name, pg_catalog.pg_get_userbyid(n.nspowner) AS owner\n`;
    sqlScript += `  FROM pg_catalog.pg_namespace n\n`;
    sqlScript += `  WHERE n.nspname NOT LIKE 'pg_%'\n`;
    sqlScript += `    AND n.nspname != 'information_schema'\n`;
    sqlScript += `  ORDER BY name;\n`;
    sqlScript += `END;\n`;
    sqlScript += `$$ LANGUAGE plpgsql;\n\n`;
    
    sqlScript += `CREATE OR REPLACE FUNCTION get_views_info()\n`;
    sqlScript += `RETURNS TABLE (\n`;
    sqlScript += `  schema TEXT,\n`;
    sqlScript += `  name TEXT,\n`;
    sqlScript += `  definition TEXT\n`;
    sqlScript += `) SECURITY DEFINER AS $$\n`;
    sqlScript += `BEGIN\n`;
    sqlScript += `  RETURN QUERY\n`;
    sqlScript += `  SELECT \n`;
    sqlScript += `    schemaname::TEXT AS schema,\n`;
    sqlScript += `    viewname::TEXT AS name,\n`;
    sqlScript += `    pg_get_viewdef(c.oid, true)::TEXT AS definition\n`;
    sqlScript += `  FROM pg_catalog.pg_views v\n`;
    sqlScript += `  JOIN pg_catalog.pg_class c ON c.relname = v.viewname\n`;
    sqlScript += `  JOIN pg_catalog.pg_namespace n ON n.nspname = v.schemaname AND c.relnamespace = n.oid\n`;
    sqlScript += `  WHERE schemaname NOT LIKE 'pg_%'\n`;
    sqlScript += `    AND schemaname != 'information_schema'\n`;
    sqlScript += `  ORDER BY schema, name;\n`;
    sqlScript += `END;\n`;
    sqlScript += `$$ LANGUAGE plpgsql;\n\n`;
    
    sqlScript += `CREATE OR REPLACE FUNCTION get_functions_info()\n`;
    sqlScript += `RETURNS TABLE (\n`;
    sqlScript += `  schema TEXT,\n`;
    sqlScript += `  name TEXT,\n`;
    sqlScript += `  definition TEXT\n`;
    sqlScript += `) SECURITY DEFINER AS $$\n`;
    sqlScript += `BEGIN\n`;
    sqlScript += `  RETURN QUERY\n`;
    sqlScript += `  SELECT \n`;
    sqlScript += `    n.nspname::TEXT AS schema,\n`;
    sqlScript += `    p.proname::TEXT AS name,\n`;
    sqlScript += `    pg_get_functiondef(p.oid)::TEXT AS definition\n`;
    sqlScript += `  FROM pg_catalog.pg_proc p\n`;
    sqlScript += `  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace\n`;
    sqlScript += `  WHERE n.nspname NOT LIKE 'pg_%'\n`;
    sqlScript += `    AND n.nspname != 'information_schema'\n`;
    sqlScript += `  ORDER BY schema, name;\n`;
    sqlScript += `END;\n`;
    sqlScript += `$$ LANGUAGE plpgsql;\n\n`;
    
    sqlScript += `CREATE OR REPLACE FUNCTION get_triggers_info()\n`;
    sqlScript += `RETURNS TABLE (\n`;
    sqlScript += `  schema TEXT,\n`;
    sqlScript += `  table_name TEXT,\n`;
    sqlScript += `  name TEXT,\n`;
    sqlScript += `  definition TEXT\n`;
    sqlScript += `) SECURITY DEFINER AS $$\n`;
    sqlScript += `BEGIN\n`;
    sqlScript += `  RETURN QUERY\n`;
    sqlScript += `  SELECT \n`;
    sqlScript += `    n.nspname::TEXT AS schema,\n`;
    sqlScript += `    c.relname::TEXT AS table_name,\n`;
    sqlScript += `    t.tgname::TEXT AS name,\n`;
    sqlScript += `    pg_get_triggerdef(t.oid)::TEXT AS definition\n`;
    sqlScript += `  FROM pg_catalog.pg_trigger t\n`;
    sqlScript += `  JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid\n`;
    sqlScript += `  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace\n`;
    sqlScript += `  WHERE NOT t.tgisinternal\n`;
    sqlScript += `    AND n.nspname NOT LIKE 'pg_%'\n`;
    sqlScript += `    AND n.nspname != 'information_schema'\n`;
    sqlScript += `  ORDER BY schema, table_name, name;\n`;
    sqlScript += `END;\n`;
    sqlScript += `$$ LANGUAGE plpgsql;\n\n`;
    
    sqlScript += `CREATE OR REPLACE VIEW _rls_policies AS\n`;
    sqlScript += `SELECT\n`;
    sqlScript += `  n.nspname AS schema_name,\n`;
    sqlScript += `  c.relname AS table_name,\n`;
    sqlScript += `  pol.polname AS policy_name,\n`;
    sqlScript += `  CASE pol.polcmd\n`;
    sqlScript += `    WHEN 'r' THEN 'SELECT'\n`;
    sqlScript += `    WHEN 'a' THEN 'INSERT'\n`;
    sqlScript += `    WHEN 'w' THEN 'UPDATE'\n`;
    sqlScript += `    WHEN 'd' THEN 'DELETE'\n`;
    sqlScript += `    ELSE 'ALL'\n`;
    sqlScript += `  END AS command,\n`;
    sqlScript += `  CASE pol.polpermissive\n`;
    sqlScript += `    WHEN TRUE THEN 'PERMISSIVE'\n`;
    sqlScript += `    ELSE 'RESTRICTIVE'\n`;
    sqlScript += `  END AS permissive,\n`;
    sqlScript += `  CASE pol.polroles = '{0}'\n`;
    sqlScript += `    WHEN TRUE THEN 'PUBLIC'\n`;
    sqlScript += `    ELSE array_to_string(ARRAY(\n`;
    sqlScript += `      SELECT rolname\n`;
    sqlScript += `      FROM pg_roles\n`;
    sqlScript += `      WHERE oid = ANY(pol.polroles)\n`;
    sqlScript += `    ), ', ')\n`;
    sqlScript += `  END AS roles,\n`;
    sqlScript += `  pg_get_expr(pol.polqual, pol.polrelid) AS qualifier,\n`;
    sqlScript += `  pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check\n`;
    sqlScript += `FROM pg_policy pol\n`;
    sqlScript += `JOIN pg_class c ON c.oid = pol.polrelid\n`;
    sqlScript += `JOIN pg_namespace n ON n.oid = c.relnamespace\n`;
    sqlScript += `WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')\n`;
    sqlScript += `ORDER BY schema_name, table_name, policy_name;\n\n`;
    
    sqlScript += `GRANT EXECUTE ON FUNCTION get_schemas_info() TO service_role;\n`;
    sqlScript += `GRANT EXECUTE ON FUNCTION get_views_info() TO service_role;\n`;
    sqlScript += `GRANT EXECUTE ON FUNCTION get_functions_info() TO service_role;\n`;
    sqlScript += `GRANT EXECUTE ON FUNCTION get_triggers_info() TO service_role;\n`;
    sqlScript += `GRANT SELECT ON _rls_policies TO service_role;\n\n`;
    
    // Try to get Row Level Security (RLS) policies if the helper functions exist
    try {
      const { data: policies, error: policiesError } = await supabaseAdmin.from('_rls_policies').select('*');
      
      if (!policiesError && policies) {
        sqlScript += `-- Row Level Security (RLS) Policies\n`;
        for (const policy of policies) {
          sqlScript += `ALTER TABLE ${policy.schema_name}.${policy.table_name} ENABLE ROW LEVEL SECURITY;\n`;
          // Add policy name, conditions, etc.
          const policyDefinition = `CREATE POLICY "${policy.policy_name}" ON ${policy.schema_name}.${policy.table_name} 
            FOR ${policy.command} 
            TO ${policy.roles} 
            ${policy.qualifier ? `USING (${policy.qualifier})` : ''} 
            ${policy.with_check ? `WITH CHECK (${policy.with_check})` : ''};`;
          
          sqlScript += `${policyDefinition}\n`;
        }
        sqlScript += `\n`;
      }
    } catch (error) {
      console.log("Could not retrieve RLS policies, they will be missing from the backup");
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
    
    // Try to get functions and procedures if the helper functions exist
    try {
      const { data: functions, error: functionsError } = await supabaseAdmin.rpc('get_functions_info');
      
      if (!functionsError && functions) {
        sqlScript += `-- Functions and procedures\n`;
        for (const func of functions) {
          if (func.definition && !func.name.startsWith('pg_')) {
            sqlScript += `${func.definition}\n\n`;
          }
        }
      }
    } catch (error) {
      console.log("Could not retrieve functions, they will be missing from the backup");
    }
    
    // Try to get views if the helper functions exist
    try {
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
    } catch (error) {
      console.log("Could not retrieve views, they will be missing from the backup");
    }
    
    // Try to get triggers if the helper functions exist
    try {
      const { data: triggers, error: triggersError } = await supabaseAdmin.rpc('get_triggers_info');
      
      if (!triggersError && triggers) {
        sqlScript += `-- Triggers\n`;
        for (const trigger of triggers) {
          if (trigger.definition && !trigger.name.startsWith('pg_')) {
            sqlScript += `${trigger.definition}\n\n`;
          }
        }
      }
    } catch (error) {
      console.log("Could not retrieve triggers, they will be missing from the backup");
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
    return new Response(JSON.stringify({ 
      error: error.message,
      details: "Make sure you've run all migrations in supabase/migrations/ before using this function."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
