const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];
const FILE_SIZE_LIMIT = 52428800;

const POLICIES = [
  `DROP POLICY IF EXISTS "edition-galleries_public_select" ON storage.objects`,
  `DROP POLICY IF EXISTS "edition-galleries_auth_insert" ON storage.objects`,
  `DROP POLICY IF EXISTS "edition-galleries_auth_update" ON storage.objects`,
  `DROP POLICY IF EXISTS "edition-galleries_auth_delete" ON storage.objects`,
  `CREATE POLICY "edition-galleries_public_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'edition-galleries')`,
  `CREATE POLICY "edition-galleries_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'edition-galleries')`,
  `CREATE POLICY "edition-galleries_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'edition-galleries') WITH CHECK (bucket_id = 'edition-galleries')`,
  `CREATE POLICY "edition-galleries_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'edition-galleries')`,
];

async function runSql(sql) {
  const { error } = await supabase.rpc("exec_sql", { sql });
  if (!error) return true;
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });
  return response.ok;
}

async function main() {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error("Could not list buckets:", listError.message);
    process.exit(1);
  }

  const names = (buckets || []).map((bucket) => bucket.name);
  console.log("Existing buckets:", names.join(", ") || "(none)");

  const exists = names.includes("edition-galleries");
  if (!exists) {
    const { error } = await supabase.storage.createBucket("edition-galleries", {
      public: true,
      fileSizeLimit: FILE_SIZE_LIMIT,
      allowedMimeTypes: MIME_TYPES,
    });
    if (error) {
      console.error("Could not create edition-galleries:", error.message);
      process.exit(1);
    }
    console.log("Created edition-galleries bucket");
  } else {
    const { error } = await supabase.storage.updateBucket("edition-galleries", {
      public: true,
      fileSizeLimit: FILE_SIZE_LIMIT,
      allowedMimeTypes: MIME_TYPES,
    });
    if (error) {
      console.warn("Could not update edition-galleries settings:", error.message);
    } else {
      console.log("Updated edition-galleries bucket settings");
    }
  }

  let policiesApplied = 0;
  for (const sql of POLICIES) {
    const ok = await runSql(sql);
    if (ok) policiesApplied += 1;
  }

  if (policiesApplied === POLICIES.length) {
    console.log("Applied edition-galleries storage policies");
  } else {
    console.warn(
      `Storage policies may need the SQL migration applied (${policiesApplied}/${POLICIES.length} statements succeeded).`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
