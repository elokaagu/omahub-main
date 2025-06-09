-- Fix brand deletion policy to allow brand owners to delete their own brands

-- Drop the existing restrictive delete policy
DROP POLICY IF EXISTS "Enable delete for admins only" ON brands;

-- Create new delete policy that allows both admins and brand owners to delete
CREATE POLICY "Enable delete for admins and brand owners"
ON brands FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.role = 'admin'
      OR profiles.role = 'super_admin'
      OR (
        profiles.role = 'brand_admin'
        AND brands.id = ANY(profiles.owned_brands)
      )
    )
  )
);

-- Verify the policy was created
SELECT 'Brand deletion policy updated:' as info;
SELECT policyname, cmd, permissive, roles, qual 
FROM pg_policies 
WHERE tablename = 'brands' AND cmd = 'DELETE'
ORDER BY policyname; 