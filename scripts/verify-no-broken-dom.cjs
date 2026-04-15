/**
 * Fail install/build if packages that trigger ERR_REQUIRE_ESM on Vercel
 * (html-encoding-sniffer ≥5 → @exodus/bytes ESM via require) are present.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const nm = path.join(root, "node_modules");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

if (fs.existsSync(path.join(nm, "jsdom"))) {
  console.error(
    "[verify-no-broken-dom] `jsdom` is installed. It pulls `html-encoding-sniffer@6` and breaks Vercel Node (ERR_REQUIRE_ESM). Remove consumers (e.g. isomorphic-dompurify); legal HTML uses `sanitize-html` only."
  );
  process.exit(1);
}

if (fs.existsSync(path.join(nm, "isomorphic-dompurify"))) {
  console.error(
    "[verify-no-broken-dom] `isomorphic-dompurify` must not be installed. Use `sanitize-html` in lib/legal/sanitizeLegalDocumentHtml.ts."
  );
  process.exit(1);
}

const sniffPkg = path.join(nm, "html-encoding-sniffer", "package.json");
if (fs.existsSync(sniffPkg)) {
  const v = readJson(sniffPkg).version;
  const major = parseInt(String(v).split(".")[0], 10);
  if (major >= 5) {
    console.error(
      `[verify-no-broken-dom] html-encoding-sniffer@${v} is not allowed (CJS/ESM issue on Vercel). Pin package.json overrides to "html-encoding-sniffer": "4.0.0" or remove the package that depends on sniffer ≥5.`
    );
    process.exit(1);
  }
}

console.log("[verify-no-broken-dom] ok");
