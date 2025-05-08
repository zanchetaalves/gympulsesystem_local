

-- Function to get schemas information
CREATE OR REPLACE FUNCTION get_schemas_info()
RETURNS TABLE (
  name TEXT,
  owner TEXT
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT n.nspname::TEXT AS name, pg_catalog.pg_get_userbyid(n.nspowner)::TEXT AS owner
  FROM pg_catalog.pg_namespace n
  WHERE n.nspname NOT LIKE 'pg_%'
    AND n.nspname != 'information_schema'
  ORDER BY name;
END;
$$ LANGUAGE plpgsql;

-- Function to get view information
CREATE OR REPLACE FUNCTION get_views_info()
RETURNS TABLE (
  schema TEXT,
  name TEXT,
  definition TEXT
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname::TEXT AS schema,
    viewname::TEXT AS name,
    pg_get_viewdef(c.oid, true)::TEXT AS definition
  FROM pg_catalog.pg_views v
  JOIN pg_catalog.pg_class c ON c.relname = v.viewname
  JOIN pg_catalog.pg_namespace n ON n.nspname = v.schemaname AND c.relnamespace = n.oid
  WHERE schemaname NOT LIKE 'pg_%'
    AND schemaname != 'information_schema'
  ORDER BY schema, name;
END;
$$ LANGUAGE plpgsql;

-- Function to get function information
CREATE OR REPLACE FUNCTION get_functions_info()
RETURNS TABLE (
  schema TEXT,
  name TEXT,
  definition TEXT
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.nspname::TEXT AS schema,
    p.proname::TEXT AS name,
    pg_get_functiondef(p.oid)::TEXT AS definition
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname NOT LIKE 'pg_%'
    AND n.nspname != 'information_schema'
  ORDER BY schema, name;
END;
$$ LANGUAGE plpgsql;

-- Function to get trigger information
CREATE OR REPLACE FUNCTION get_triggers_info()
RETURNS TABLE (
  schema TEXT,
  table_name TEXT,
  name TEXT,
  definition TEXT
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.nspname::TEXT AS schema,
    c.relname::TEXT AS table_name,
    t.tgname::TEXT AS name,
    pg_get_triggerdef(t.oid)::TEXT AS definition
  FROM pg_catalog.pg_trigger t
  JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE NOT t.tgisinternal
    AND n.nspname NOT LIKE 'pg_%'
    AND n.nspname != 'information_schema'
  ORDER BY schema, table_name, name;
END;
$$ LANGUAGE plpgsql;

-- Create a view for RLS policies
CREATE OR REPLACE VIEW _rls_policies AS
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  pol.polname AS policy_name,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    ELSE 'ALL'
  END AS command,
  CASE pol.polpermissive
    WHEN TRUE THEN 'PERMISSIVE'
    ELSE 'RESTRICTIVE'
  END AS permissive,
  CASE pol.polroles = '{0}'
    WHEN TRUE THEN 'PUBLIC'
    ELSE array_to_string(ARRAY(
      SELECT rolname
      FROM pg_roles
      WHERE oid = ANY(pol.polroles)
    ), ', ')
  END AS roles,
  pg_get_expr(pol.polqual, pol.polrelid) AS qualifier,
  pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schema_name, table_name, policy_name;

GRANT EXECUTE ON FUNCTION get_schemas_info() TO service_role;
GRANT EXECUTE ON FUNCTION get_views_info() TO service_role;
GRANT EXECUTE ON FUNCTION get_functions_info() TO service_role;
GRANT EXECUTE ON FUNCTION get_triggers_info() TO service_role;
GRANT SELECT ON _rls_policies TO service_role;

