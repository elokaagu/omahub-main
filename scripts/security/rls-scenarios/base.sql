create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.role() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claim.role', true), '') $$;
grant usage on schema auth, public to anon, authenticated, service_role;
grant execute on all functions in schema auth to anon, authenticated, service_role;
create type user_role as enum ('user','brand_admin','admin','super_admin');
create table public.profiles (id uuid primary key, email text, role user_role default 'user', owned_brands text[] default '{}', first_name text, last_name text, avatar_url text, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.brands (id text primary key, name text, rating float8, user_id uuid, image text);
create table public.products (id uuid primary key default gen_random_uuid(), title text, brand_id text);
create table public.catalogues (id text primary key, brand_id text, title text, image text, description text);
create table public.catalogue_images (id uuid primary key default gen_random_uuid(), catalogue_id text, image_url text);
create table public.tailors (id text primary key, brand_id text, title text, image text);
create table public.brand_images (id uuid primary key default gen_random_uuid(), brand_id text, role text, storage_path text);
create table public.reviews (id uuid primary key default gen_random_uuid(), brand_id text, author text, comment text, rating float8, user_id uuid);
create table public.notifications (id uuid primary key default gen_random_uuid(), brand_id text, user_id uuid, type text, title text, message text, is_read bool default false);
do $$ declare t text; begin foreach t in array array['profiles','brands','products','catalogues','catalogue_images','tailors','brand_images','reviews','notifications'] loop
  execute format('alter table public.%I enable row level security', t);
  execute format('grant all on public.%I to anon, authenticated, service_role', t);
end loop; end $$;
-- signup trigger stand-in: SECURITY DEFINER, owned by postgres
create function public.signup_profile(uid uuid, mail text) returns void language plpgsql security definer set search_path='' as $$
begin insert into public.profiles (id, email, role, owned_brands) values (uid, mail, 'user', '{}'); end $$;
grant execute on function public.signup_profile(uuid,text) to authenticated, anon;
