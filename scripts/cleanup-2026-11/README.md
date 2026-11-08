# Data cleanup, November 2026

One-off cleanup found during the 8 Nov 2026 site test pass. Not a migration:
run it by hand in the Supabase SQL editor.

## What it fixes

- **Test data**: 36 catalogues ("Func Catalogue…", "Probe Coll…") and 13 tailors
  ("Func Tailor…") left by a functional test run against production on
  3 Oct 2026. All sit on the Gbemi brand with `https://example.com/` images;
  the tailors are public and were in the sitemap. Gbemi's real data (the
  "Bestsellers" catalogue and its product) is kept.
- **Duplicate brands**, merged into the record with the real content:
  - YVK Design `e1aafaeb-…` (empty, created 1½ minutes before the real one)
    → `860f3268-…` (has the products).
  - Ebhs Couture `ebhs-couture` (typo record from an old seed script with a
    placeholder phone number) → Ehbs Couture `ehbs-couture` (7 products,
    tailor profile, logo). Its "Her Thirties" catalogue moves across.

Old links to the removed brand pages redirect to the kept ones
(`next.config.js`).

## How to run

1. **Back up first.** Supabase → Database → Backups: confirm a recent backup
   exists (or take one).
2. Supabase → SQL Editor → paste `1-preview.sql` → Run. It changes nothing.
   Check the table it returns:
   - 36 catalogues and 13 tailors to delete.
   - "Gbemi rows that STAY" lists Bestsellers and Jenel - Pink Rose.
   - Nothing marked "BLOCKS step 2".
   - Section C lists other possible test leftovers (e.g. `@example.com`
     emails). These are **not** deleted; review them separately.
3. Paste `2-apply.sql` → Run. The result should show 0 test catalogues,
   0 test tailors, one YVK Design and one Ehbs Couture.

## Safety

`2-apply.sql` runs in one transaction and checks before changing anything.
If the counts differ from what was found on 8 Nov, or a real product sits in
a test catalogue, it stops with an error and nothing changes. Running it a
second time stops the same way.

Both scripts were tested on a local Postgres copy of the affected tables
(including clashes such as a user who favourited both duplicate brands).

## Also do

The test run came from outside this repo, maybe an external QA tool or agent
pointed at production. Find and stop it, or it will create these rows again.
