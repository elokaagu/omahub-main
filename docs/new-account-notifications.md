# New account notifications

When someone creates an OmaHub account, admins get an email ("New Account Alert").

## How it works

1. A new account creates a row in `public.profiles` (the `on_auth_user_created`
   trigger does this for every signup, whichever page it came from).
2. The `new_account_alert` trigger on `profiles`
   (`supabase/migrations/20261109120000_new_account_alert_webhook.sql`) uses
   `pg_net` to `POST` the new profile to
   `https://www.oma-hub.com/api/webhooks/new-account`, with
   `Authorization: Bearer <secret>`. The body has the same shape as a Supabase
   Database Webhook. The request is sent after the insert commits, so signups
   never wait on it or fail because of it.
3. The route (`app/api/webhooks/new-account/route.ts`) checks the secret and
   emails admins through Resend.

Who gets the email: the webhook admin list in `platform_settings`
(`webhook_admin_emails`); if that list is empty, every super admin.

## The secret

The same value must be in two places:

- **Vercel** (project `omahub-main`, Production): `WEBHOOK_SECRET`, marked
  Sensitive. The route returns 503 without it.
- **Supabase Vault**: secret named `new_account_webhook_secret`. The trigger
  does nothing without it.

To rotate it:

```bash
openssl rand -hex 32
```

1. Vercel → omahub-main → Settings → Environment Variables → edit
   `WEBHOOK_SECRET` → redeploy production.
2. Supabase SQL editor:
   ```sql
   select vault.update_secret(
     (select id from vault.secrets where name = 'new_account_webhook_secret'),
     'NEW_SECRET_HERE');
   ```

## Checking it works

- Sign up with a test address (e.g. `you+alerttest@gmail.com`). Admins should
  get "New account created - …" within a minute.
- If nothing arrives, look at recent requests:
  ```sql
  select created, status_code, content
  from net._http_response order by created desc limit 5;
  ```
  - `401` → the Vault secret doesn't match Vercel.
  - `503` → `WEBHOOK_SECRET` isn't set in Vercel, or production wasn't redeployed.
  - no rows → the Vault secret is missing, so the trigger skipped the call.
  - `200` but no email → check `RESEND_API_KEY` in Vercel and the admin list.
- Delete the test account afterwards (Studio → Users).

> History: the old `create_profile_for_user()` trigger only logged a notice and
> never called this endpoint, and the signup pages create accounts in the
> browser so they skip `/api/auth/signup`. Alerts never sent until Nov 2026.

## Tests

`tests/newAccountWebhook.test.ts` sends the exact body Supabase sends and checks:
emails go out with the right secret; wrong or missing secret → 401; no secret
configured → 503; updates and other tables are ignored.

## Studio dashboard

`app/studio/dashboard/RecentAccountsWidget.tsx` shows accounts created in the
last 7 days, independent of the email alerts.
