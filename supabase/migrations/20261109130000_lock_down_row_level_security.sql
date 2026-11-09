-- Lock down row-level security (found in the 9 Nov 2026 brand-owner audit).
--
-- Several tables had policies that let far too many people write:
--   * profiles: any signed-in user could set their own role (e.g. super_admin)
--     or owned_brands (take over any brand).
--   * brands: any signed-in user could update, insert or delete any brand.
--   * catalogues, tailors, catalogue_images: anyone, even signed out, could
--     insert, update or delete (policies for the "public" role with `true`).
--   * brand_images: any signed-in user could manage any brand's images.
--   * reviews: any signed-in user could edit any review; any brand owner could
--     manage reviews on every brand.
--   * notifications: anyone could create a notification for any user.
--
-- After this migration, writes are limited to:
--   * super_admin / admin: any brand;
--   * brand_admin: only brands in their owned_brands;
--   * the service role (server API routes): unchanged, it bypasses RLS.
-- Public read access is unchanged.
--
-- Roles and brand ownership can now only be changed by super admins or the
-- server; the app already does this through /api/admin/users (service role).

-- ---------------------------------------------------------------------------
-- Helper: can the current user manage this brand?
-- SECURITY DEFINER so it can read profiles without recursing through
-- profiles' own policies.
-- ---------------------------------------------------------------------------
create or replace function public.can_manage_brand(target_brand_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role in ('super_admin', 'admin')
        or (p.role = 'brand_admin' and target_brand_id = any (p.owned_brands))
      )
  );
$$;

revoke all on function public.can_manage_brand(text) from public;
grant execute on function public.can_manage_brand(text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
drop policy if exists "Allow profile creation during signup" on public.profiles;
drop policy if exists "Allow users to update their own profile" on public.profiles;

create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Signed-out visitors never need to write profiles.
revoke insert, update, delete, truncate on public.profiles from anon;

-- Browser requests run as `authenticated`. Only super admins may change role
-- or owned_brands that way; a self-created profile always starts as a plain
-- user. Server code (service role) and the signup trigger run as other roles
-- and are not affected. SECURITY INVOKER on purpose: current_user must be the
-- caller's role.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'super_admin'
  ) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.role := 'user';
    new.owned_brands := '{}';
    return new;
  end if;

  if new.role is distinct from old.role
     or new.owned_brands is distinct from old.owned_brands then
    raise exception 'Only super admins can change roles or brand ownership'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
  before insert or update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- ---------------------------------------------------------------------------
-- brands
-- ---------------------------------------------------------------------------
drop policy if exists "brands_auth_delete" on public.brands;
drop policy if exists "brands_auth_insert" on public.brands;
drop policy if exists "brands_auth_update" on public.brands;
drop policy if exists "Allow authenticated users to create brands" on public.brands;
drop policy if exists "Allow brand owners to update their brands" on public.brands;
-- Kept: "Brand owners can insert brands" (admin, super_admin, brand_admin) and
-- "Brand owners can update their own brand" (scoped to owned brands).

drop policy if exists "Staff and owners delete brands" on public.brands;
create policy "Staff and owners delete brands"
  on public.brands for delete to authenticated
  using (public.can_manage_brand(id));

-- ---------------------------------------------------------------------------
-- catalogues
-- ---------------------------------------------------------------------------
drop policy if exists "Allow API to create catalogues" on public.catalogues;
drop policy if exists "Allow API to update catalogues" on public.catalogues;
drop policy if exists "Allow API to delete collections" on public.catalogues;

drop policy if exists "Staff and owners manage catalogues" on public.catalogues;
create policy "Staff and owners manage catalogues"
  on public.catalogues for all to authenticated
  using (public.can_manage_brand(brand_id))
  with check (public.can_manage_brand(brand_id));

-- ---------------------------------------------------------------------------
-- catalogue_images (scoped through the catalogue's brand)
-- ---------------------------------------------------------------------------
drop policy if exists "Allow API to create catalogue_images" on public.catalogue_images;
drop policy if exists "Allow API to update catalogue_images" on public.catalogue_images;
drop policy if exists "Allow API to delete catalogue_images" on public.catalogue_images;
drop policy if exists "Allow authenticated users to manage collection images" on public.catalogue_images;

drop policy if exists "Staff and owners manage catalogue images" on public.catalogue_images;
create policy "Staff and owners manage catalogue images"
  on public.catalogue_images for all to authenticated
  using (exists (
    select 1 from public.catalogues c
    where c.id = catalogue_images.catalogue_id
      and public.can_manage_brand(c.brand_id)
  ))
  with check (exists (
    select 1 from public.catalogues c
    where c.id = catalogue_images.catalogue_id
      and public.can_manage_brand(c.brand_id)
  ));

-- ---------------------------------------------------------------------------
-- tailors
-- ---------------------------------------------------------------------------
drop policy if exists "Allow API to create tailors" on public.tailors;
drop policy if exists "Allow API to update tailors" on public.tailors;
drop policy if exists "Allow API to delete tailors" on public.tailors;

drop policy if exists "Staff and owners manage tailors" on public.tailors;
create policy "Staff and owners manage tailors"
  on public.tailors for all to authenticated
  using (public.can_manage_brand(brand_id))
  with check (public.can_manage_brand(brand_id));

-- ---------------------------------------------------------------------------
-- brand_images
-- ---------------------------------------------------------------------------
drop policy if exists "Authenticated users can manage brand images" on public.brand_images;

drop policy if exists "Staff and owners manage brand images" on public.brand_images;
create policy "Staff and owners manage brand images"
  on public.brand_images for all to authenticated
  using (public.can_manage_brand(brand_id))
  with check (public.can_manage_brand(brand_id));

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
drop policy if exists "Allow authenticated users to create reviews" on public.reviews;
drop policy if exists "Allow users to update their own reviews" on public.reviews;
drop policy if exists "Admins can manage reviews" on public.reviews;

drop policy if exists "Users create their own reviews" on public.reviews;
create policy "Users create their own reviews"
  on public.reviews for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users update their own reviews" on public.reviews;
create policy "Users update their own reviews"
  on public.reviews for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Staff and owners manage reviews" on public.reviews;
create policy "Staff and owners manage reviews"
  on public.reviews for all to authenticated
  using (public.can_manage_brand(brand_id))
  with check (public.can_manage_brand(brand_id));

-- ---------------------------------------------------------------------------
-- notifications: created by server code (service role) only. Super admins
-- keep their existing "manage all" policy.
-- ---------------------------------------------------------------------------
drop policy if exists "System can create notifications" on public.notifications;
