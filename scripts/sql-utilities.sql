-- SQL Utilities for OmaHub
-- Common functions and policy patterns to reduce duplication

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION has_role(user_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_id
    AND (
      CASE required_role
        WHEN 'super_admin' THEN p.role = 'super_admin'
        WHEN 'admin' THEN p.role IN ('admin', 'super_admin')
        WHEN 'brand_admin' THEN p.role IN ('brand_admin', 'admin', 'super_admin')
        ELSE p.role = required_role
      END
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access brand data
CREATE OR REPLACE FUNCTION can_access_brand(user_id UUID, brand_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_brands TEXT[];
BEGIN
  SELECT p.role, p.owned_brands INTO user_role, user_brands
  FROM public.profiles p
  WHERE p.id = user_id;
  
  -- Super admin can access everything
  IF user_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Brand admin can access their own brands
  IF user_role = 'brand_admin' AND user_brands IS NOT NULL THEN
    RETURN brand_id = ANY(user_brands);
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create standard RLS policies for admin tables
CREATE OR REPLACE FUNCTION create_admin_policies(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Super admin can view all
  EXECUTE format('
    CREATE POLICY "Super admins can view all %I" 
    ON public.%I FOR SELECT 
    TO authenticated 
    USING (has_role(auth.uid(), ''super_admin''))',
    table_name, table_name);
    
  -- Super admin can manage all
  EXECUTE format('
    CREATE POLICY "Super admins can manage %I" 
    ON public.%I FOR ALL 
    TO authenticated 
    USING (has_role(auth.uid(), ''super_admin''))',
    table_name, table_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create brand-specific RLS policies
CREATE OR REPLACE FUNCTION create_brand_policies(table_name TEXT, brand_column TEXT DEFAULT 'brand_id')
RETURNS VOID AS $$
BEGIN
  -- Super admin can view all
  EXECUTE format('
    CREATE POLICY "Super admins can view all %I" 
    ON public.%I FOR SELECT 
    TO authenticated 
    USING (has_role(auth.uid(), ''super_admin''))',
    table_name, table_name);
    
  -- Brand admin can view their brands
  EXECUTE format('
    CREATE POLICY "Brand admins can view their %I" 
    ON public.%I FOR SELECT 
    TO authenticated 
    USING (can_access_brand(auth.uid(), %I))',
    table_name, table_name, brand_column);
    
  -- Admins can manage
  EXECUTE format('
    CREATE POLICY "Admins can manage %I" 
    ON public.%I FOR ALL 
    TO authenticated 
    USING (has_role(auth.uid(), ''brand_admin''))',
    table_name, table_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create updated_at trigger
CREATE OR REPLACE FUNCTION create_updated_at_trigger(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('
    CREATE OR REPLACE FUNCTION update_%I_updated_at()
    RETURNS TRIGGER AS $trigger$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;
    
    DROP TRIGGER IF EXISTS update_%I_updated_at_trigger ON public.%I;
    CREATE TRIGGER update_%I_updated_at_trigger
      BEFORE UPDATE ON public.%I
      FOR EACH ROW
      EXECUTE FUNCTION update_%I_updated_at();',
    table_name, table_name, table_name, table_name, table_name, table_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create standard audit fields
CREATE OR REPLACE FUNCTION add_audit_fields(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('
    ALTER TABLE public.%I 
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);',
    table_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to drop policies safely
CREATE OR REPLACE FUNCTION drop_policies_safely(table_name TEXT, policy_names TEXT[])
RETURNS VOID AS $$
DECLARE
  policy_name TEXT;
BEGIN
  FOREACH policy_name IN ARRAY policy_names
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION has_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_brand(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_admin_policies(TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION create_brand_policies(TEXT, TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION create_updated_at_trigger(TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION add_audit_fields(TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION drop_policies_safely(TEXT, TEXT[]) TO postgres; 