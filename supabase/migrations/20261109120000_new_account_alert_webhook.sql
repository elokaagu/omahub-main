-- New-account admin alerts.
--
-- When a profile is created, POST it to /api/webhooks/new-account, which emails
-- admins. Same body shape as a Supabase Database Webhook, so the route's tests
-- (tests/newAccountWebhook.test.ts) cover it.
--
-- The bearer secret lives in Supabase Vault as 'new_account_webhook_secret' and
-- must match WEBHOOK_SECRET in Vercel. It is never stored in this file. If the
-- secret is missing, the trigger does nothing.
--
-- pg_net sends the request after the insert commits, so signups never wait on
-- it, and any failure is logged instead of blocking the signup.

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_new_account_webhook()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  secret text;
begin
  select decrypted_secret into secret
  from vault.decrypted_secrets
  where name = 'new_account_webhook_secret'
  limit 1;

  if secret is null then
    return new;
  end if;

  perform net.http_post(
    url := 'https://www.oma-hub.com/api/webhooks/new-account',
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'profiles',
      'schema', 'public',
      'record', jsonb_build_object(
        'id', new.id,
        'email', new.email,
        'role', new.role,
        'created_at', new.created_at
      ),
      'old_record', null
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || secret
    ),
    timeout_milliseconds := 5000
  );

  return new;
exception
  when others then
    raise warning 'new account webhook failed: %', sqlerrm;
    return new;
end;
$$;

revoke all on function public.notify_new_account_webhook() from public, anon, authenticated;

drop trigger if exists new_account_alert on public.profiles;
create trigger new_account_alert
after insert on public.profiles
for each row execute function public.notify_new_account_webhook();
