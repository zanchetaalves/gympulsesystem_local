
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Create a Supabase client with the service role key for full database access
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

serve(async (req: Request) => {
  try {
    // Fetch data from all tables
    const tables = ["clients", "plans", "subscriptions", "payments", "users"];
    const backupData = {};
    
    // Collect data from each table
    for (const table of tables) {
      const { data, error } = await supabaseAdmin.from(table).select("*");
      
      if (error) {
        throw new Error(`Error fetching data from ${table}: ${error.message}`);
      }
      
      backupData[table] = data;
    }
    
    // Generate SQL script
    let sqlScript = `-- Database backup script generated on ${new Date().toISOString()}\n\n`;
    
    // Generate table creation scripts
    sqlScript += `-- Table structure for clients\n`;
    sqlScript += `CREATE TABLE public.clients (\n`;
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
    sqlScript += `CREATE TABLE public.plans (\n`;
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
    sqlScript += `CREATE TABLE public.users (\n`;
    sqlScript += `  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`;
    sqlScript += `  name TEXT NOT NULL,\n`;
    sqlScript += `  email TEXT NOT NULL,\n`;
    sqlScript += `  profile TEXT NOT NULL,\n`;
    sqlScript += `  active BOOLEAN DEFAULT true,\n`;
    sqlScript += `  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()\n`;
    sqlScript += `);\n\n`;
    
    sqlScript += `-- Table structure for subscriptions\n`;
    sqlScript += `CREATE TABLE public.subscriptions (\n`;
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
    sqlScript += `CREATE TABLE public.payments (\n`;
    sqlScript += `  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`;
    sqlScript += `  subscription_id UUID REFERENCES public.subscriptions(id),\n`;
    sqlScript += `  payment_date DATE NOT NULL,\n`;
    sqlScript += `  amount NUMERIC NOT NULL,\n`;
    sqlScript += `  payment_method TEXT NOT NULL,\n`;
    sqlScript += `  confirmed BOOLEAN DEFAULT false,\n`;
    sqlScript += `  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()\n`;
    sqlScript += `);\n\n`;
    
    // Create storage bucket for client photos
    sqlScript += `-- Storage bucket for client photos\n`;
    sqlScript += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n`;
    sqlScript += `-- Please create the storage bucket manually in your local PostgreSQL or equivalent\n\n`;
    
    // Insert data into tables
    for (const table of tables) {
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
          
          sqlScript += `INSERT INTO public.${table} (${columns.join(", ")}) VALUES (${values.join(", ")});\n`;
        });
        
        sqlScript += `\n`;
      }
    }
    
    return new Response(sqlScript, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': 'attachment; filename=supabase_backup.sql'
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
