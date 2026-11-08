# New account notifications

When someone creates an OmaHub account, admins get an email ("New Account Alert").

## How it works

1. A new account creates a row in `public.profiles` (the `on_auth_user_created`
   database trigger does this for every signup, whichever page it came from).
2. A **Supabase Database Webhook** on `profiles` INSERT calls
   `POST https://www.oma-hub.com/api/webhooks/new-account` with
   `Authorization: Bearer <WEBHOOK_SECRET>`.
3. The route (`app/api/webhooks/new-account/route.ts`) checks the secret and
   emails admins through Resend.

Who gets the email: the webhook admin list in `platform_settings`
(`webhook_admin_emails`); if that list is empty, every super admin.

The route returns **503 until `WEBHOOK_SECRET` is set**, so alerts are off until
both steps below are done.

> The old `create_profile_for_user()` trigger only logs a notice; it never
> called this endpoint. The signup pages create accounts in the browser, so
> they don't go through `/api/auth/signup` either. The Database Webhook is what
> actually sends alerts.

## Setup (one time, about 5 minutes)

### 1. Create a secret

In a terminal:

```bash
openssl rand -hex 32
```

Copy the output. Use the same value in both steps below and don't share it.

### 2. Add it to Vercel

Vercel → **omahub-main** → Settings → Environment Variables → Add:

- Key: `WEBHOOK_SECRET`
- Value: the secret from step 1
- Environment: **Production** (and Preview if you want alerts from previews)

Then redeploy production (Deployments → latest → ⋯ → Redeploy) so the new
variable is picked up.

### 3. Create the Database Webhook in Supabase

Supabase → project `gswduyodzdgucjscjtvz` → **Database → Webhooks** → Create a
new hook (enable webhooks first if asked):

| Field | Value |
| --- | --- |
| Name | `new_account_alert` |
| Table | `public.profiles` |
| Events | **Insert** only |
| Type | HTTP Request |
| Method | `POST` |
| URL | `https://www.oma-hub.com/api/webhooks/new-account` (use `www`) |
| HTTP Headers | `Content-Type: application/json` and `Authorization: Bearer <secret from step 1>` |
| Timeout | 5000 ms |

Save.

### 4. Check it

- Sign up with a test address (e.g. `you+alerttest@gmail.com`). Admins should
  get "New account created - …" within a minute.
- If nothing arrives: Supabase → Database → Webhooks → `new_account_alert` →
  recent requests shows the response.
  - `401` → the secret in Supabase doesn't match Vercel.
  - `503` → `WEBHOOK_SECRET` isn't set in Vercel, or production wasn't redeployed.
  - `200` but no email → check `RESEND_API_KEY` in Vercel and the admin list.
- Delete the test account afterwards (Studio → Users).

## Tests

`tests/newAccountWebhook.test.ts` sends the exact body Supabase sends and checks:
emails go out with the right secret; wrong or missing secret → 401; no secret
configured → 503; updates and other tables are ignored.

## Studio dashboard

`app/studio/dashboard/RecentAccountsWidget.tsx` shows accounts created in the
last 7 days, independent of the email alerts.
