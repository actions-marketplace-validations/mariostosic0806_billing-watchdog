import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const portalDir = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(portalDir, "..");
const distDir = path.resolve(portalDir, "dist");
const docsDir = path.resolve(repoRoot, "docs");

function collectFiles(dir, extFilter) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      out.push(...collectFiles(full, extFilter));
    } else if (!extFilter || extFilter.some((ext) => entry.name.endsWith(ext))) {
      out.push(full);
    }
  }
  return out.sort();
}

// 1. Verify portal/ NEVER imports private Pro source or tests
for (const srcFile of collectFiles(portalDir, [".ts", ".tsx", ".js", ".mjs", ".html", ".css"])) {
  if (path.resolve(srcFile) === path.resolve(import.meta.filename)) continue;
  const content = fs.readFileSync(srcFile, "utf8");
  assert.doesNotMatch(
    content,
    /from\s+["'][^"']*\.\.\/(?:src|test)/,
    `Forbidden private Pro import found in ${srcFile}`
  );
}

// 2. Sync ONLY docs/index.html, docs/assets/*, and docs/.nojekyll (preserve all sibling HTML pages!)
const distHtmlPath = path.join(distDir, "index.html");
const distAssetsDir = path.join(distDir, "assets");
assert.ok(fs.existsSync(distHtmlPath), "Missing portal/dist/index.html — run vite build first.");
assert.ok(fs.existsSync(distAssetsDir), "Missing portal/dist/assets/ — run vite build first.");

fs.mkdirSync(docsDir, { recursive: true });
fs.copyFileSync(distHtmlPath, path.join(docsDir, "index.html"));

const targetAssetsDir = path.join(docsDir, "assets");
if (fs.existsSync(targetAssetsDir)) {
  fs.rmSync(targetAssetsDir, { recursive: true, force: true });
}
fs.cpSync(distAssetsDir, targetAssetsDir, { recursive: true });
fs.writeFileSync(path.join(docsDir, ".nojekyll"), "", "utf8");

// 3. Enforce exact CI, Polar AUP, EU GDPR Self-Hosted Fonts, Zero-Plaintext-Secret, and VM Contract gates on built docs/
const builtHtml = fs.readFileSync(path.join(docsDir, "index.html"), "utf8");

// Exactly 1 bare <script>...</script> tag (first match for Node VM suites)
const bareScripts = [...builtHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(bareScripts.length, 1, `Expected exactly 1 bare <script> block, found ${bareScripts.length}`);

// Required CI & Polar & Ed25519 assertions on raw docs/index.html
const requiredPatterns = [
  /PRIME_TECH_ED25519_PUBLIC_KEY_SPKI_B64/,
  /verifyEd25519LicenseInBrowser/,
  /AGENCY_TEAM/,
  /REDACTED IN FREE DIAGNOSTIC MODE/,
  /RLS_PERMISSIVE_NO_TENANT_FILTER/,
  /function\s+startPolarCheckout\s*\(\s*itemName\s*,\s*amountCents\s*\)/,
  /startPolarCheckout\(\s*'Pro Monthly Watchdog v2 \(\$49\/mo\)'\s*,\s*4900\s*\)/,
  /startPolarCheckout\(\s*'Lifetime Team License v2 \(\$149 One-Time\)'\s*,\s*14900\s*\)/,
  /startPolarCheckout\(\s*'Agency &(?:amp;)? Client-Handover License v2 \(\$299 One-Time\)'\s*,\s*29900\s*\)/,
  /const\s+POLAR_CHECKOUT_URLS\s*=\s*\{\s*4900\s*:\s*"[^"]*"\s*,\s*14900\s*:\s*"[^"]*"\s*,\s*29900\s*:\s*"[^"]*"\s*\}/,
  /Mario Stosic/i,
  /Individual Software Developer/i,
  /terms\.html/,
  /privacy\.html/,
  /refund-policy\.html/,
];
for (const re of requiredPatterns) {
  assert.match(builtHtml, re, `Built docs/index.html missing required pattern: ${re}`);
}

// Audit Lic-F1: only signed BWV2E Ed25519 keys may unlock — no legacy digest bypass and no
// caller-supplied trust anchor on the global verifier.
assert.doesNotMatch(
  builtHtml,
  /VALID_LICENSE_SHA256_DIGESTS|overrideSpkiB64|60a3c51229e4d4381251d1e60dc2b1d5d281f976217f3876e3e956f47af9cdea|f757e3d38a3103843b57af2c7d5b9eb6607593d075928407f99a065caf3e7599/,
  "Legacy license unlock bypass must not ship in docs/index.html"
);

// Verify bundled .woff2 self-hosted font files exist in docs/assets/
const woff2Files = collectFiles(targetAssetsDir, [".woff2"]);
assert.ok(woff2Files.length >= 6, `Expected self-hosted .woff2 font files in docs/assets/, found ${woff2Files.length}`);

// Check forbidden secrets, AUP strings, Google Fonts CDN leaks, float prices, and legacy payment tokens across ALL docs HTML + assets
const assetFiles = collectFiles(targetAssetsDir, [".js", ".css"]);
const siblingPages = ["docs/terms.html", "docs/privacy.html", "docs/refund-policy.html"].map((rel) =>
  path.join(repoRoot, rel)
);
const builtFilesToAudit = [path.join(docsDir, "index.html"), ...siblingPages, ...assetFiles];
const forbiddenTokens = [
  ["pay", "pal.com"].join(""),
  ["_x", "click"].join(""),
  ["startPay", "PalCheckout"].join(""),
  ["mario.stosic", "357@gmail.com"].join(""),
  ["fonts.google", "apis.com"].join(""),
  ["fonts.g", "static.com"].join(""),
];

for (const file of builtFilesToAudit) {
  const txt = fs.readFileSync(file, "utf8");
  const lower = txt.toLowerCase();
  for (const tok of forbiddenTokens) {
    assert.equal(lower.includes(tok.toLowerCase()), false, `Forbidden external/legacy token ${tok} in ${file}`);
  }
  assert.doesNotMatch(txt, /PRIVATE KEY|WATCHDOG_ED25519_PRIVATE_KEY/, `Private key marker in ${file}`);
  assert.doesNotMatch(
    txt,
    /BWV2-(?:LIFETIME_TEAM|PRO_MONTHLY|AGENCY_TEAM|AGENCY_CLIENT_HANDOVER)-(?:[0-9]{4}-[0-9]{2}-[0-9]{2}T|[0-9]{10,12}-[0-9A-F]{24})/,
    `Plaintext legacy license key in ${file}`
  );
  assert.doesNotMatch(
    txt,
    /BWV2E-(?:LIFETIME_TEAM|PRO_MONTHLY|AGENCY_TEAM|AGENCY_CLIENT_HANDOVER)-(?:WATCHDOG_V2|BUNDLE_ALL)-[0-9]{10,12}-/,
    `Plaintext BWV2E Ed25519 license key in ${file}`
  );
  assert.doesNotMatch(txt, /CONCIERGE|1-on-1 Engineer/i, `Banned Polar AUP term in ${file}`);
  assert.doesNotMatch(txt, /© 2026 Prime Tech/i, `Banned company branding in ${file}`);
  assert.doesNotMatch(txt, /Pentest Suite|Chaos Attack Vector/i, `Banned offensive wording in ${file}`);
  assert.doesNotMatch(txt, /Chargeback Dispute Evidence|SafeRevert/i, `Banned cross-brand term in ${file}`);
}

assert.doesNotMatch(builtHtml, /["']49\.00["']/);
assert.doesNotMatch(builtHtml, /["']149\.00["']/);
assert.doesNotMatch(builtHtml, /["']299\.00["']/);

for (const sibling of [
  "docs/terms.html",
  "docs/privacy.html",
  "docs/refund-policy.html",
]) {
  assert.ok(fs.existsSync(path.join(repoRoot, sibling)), `Required sibling preserved check failed: ${sibling}`);
}

for (const removedDir of ["docs/calculator", ["docs/safe", "revert"].join("")]) {
  assert.equal(
    fs.existsSync(path.join(repoRoot, removedDir)),
    false,
    `Removed sibling directory must not exist: ${removedDir}`
  );
}

console.log(
  `[sync-docs] OK -> synced docs/index.html + ${assetFiles.length} JS/CSS file(s) + ${woff2Files.length} self-hosted .woff2 font(s) + .nojekyll; all static & EU GDPR gates passed.`
);
