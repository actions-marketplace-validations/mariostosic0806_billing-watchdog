// Billing Watchdog v2 — Canonical Deterministic Headless Kernel
// Runs identically in Node VM verification sandboxes and as React 19 useSyncExternalStore backing store.
// Zero external dependencies. Zero hardcoded secrets or plaintext license keys.

let currentChaosFilter = "ALL";
let isProLicenseUnlocked = false;
const __kernelListeners = new Set();

// Zero-Plaintext License Verification (Only 64-char SHA-256 digests stored; keys are never in HTML)
const VALID_LICENSE_SHA256_DIGESTS = [
  "60a3c51229e4d4381251d1e60dc2b1d5d281f976217f3876e3e956f47af9cdea",
  "f757e3d38a3103843b57af2c7d5b9eb6607593d075928407f99a065caf3e7599"
];

function isReactMounted() {
  return typeof window !== "undefined" && window.__WATCHDOG_REACT_MOUNTED__ === true;
}

function getElSafe(id) {
  if (typeof document === "undefined" || typeof document.getElementById !== "function") {
    return null;
  }
  return document.getElementById(id);
}

function readIntInput(id, fallbackVal, minVal, maxVal) {
  const el = getElSafe(id);
  const parsed = el && el.value !== undefined && el.value !== "" ? parseInt(String(el.value), 10) : NaN;
  let val = Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackVal;
  if (minVal !== undefined) val = Math.max(minVal, val);
  if (maxVal !== undefined) val = Math.min(maxVal, val);
  return val;
}

function sanitizePositiveSafeInt(val, fallbackVal, minVal, maxVal) {
  if (typeof val !== "number" || !Number.isSafeInteger(val) || val <= 0) {
    return fallbackVal;
  }
  let out = val;
  if (minVal !== undefined && out < minVal) out = minVal;
  if (maxVal !== undefined && out > maxVal) out = maxVal;
  return out;
}

function sanitizeClampedSubsInt(val, fallbackVal) {
  if (typeof val !== "number" || !Number.isSafeInteger(val)) {
    return fallbackVal;
  }
  return Math.min(100000, Math.max(10, val));
}

function sha256HexSync(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = "";
  const words = [];
  const asciiBitLength = ascii.length * 8;
  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  ascii += "\x80";
  while ((ascii.length % 64) - 56) ascii += "\x00";
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;
  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }
    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? 0 : "") + b.toString(16);
    }
  }
  return result;
}

// Public-only RFC 8410 Ed25519 SPKI key (44 bytes DER in Base64 — zero private signing material in HTML)
const PRIME_TECH_ED25519_PUBLIC_KEY_SPKI_B64 = "MCowBQYDK2VwAyEAxkJtuXeg/fNeir0z70Cg4grr8ZpFXjVQd+Oe1G42IQU=";

function decodeBase64Bytes(b64, isUrlSafe) {
  let norm = isUrlSafe ? b64.replace(/-/g, "+").replace(/_/g, "/") : b64;
  while (norm.length % 4 !== 0) norm += "=";
  if (typeof atob === "function") {
    const bin = atob(norm);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i) & 0xff;
    return out;
  }
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(norm, "base64"));
  }
  throw new Error("Base64 decoder unavailable");
}

function escapeHtmlSafe(raw) {
  return String(raw || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatUsdFromCents(cents) {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatUsdFromIntegerCents(amountCents) {
  const whole = Math.trunc(amountCents / 100);
  const minor = Math.abs(amountCents % 100);
  return "$" + whole + (minor > 0 ? "." + String(minor).padStart(2, "0") : "");
}

const VULNERABLE_SQL = [
  "-- Typical AI / Usage-Based SaaS Schema (Missing 3 Critical Billing Invariants)",
  "CREATE TABLE public.users (",
  "  id uuid PRIMARY KEY,",
  "  email text NOT NULL,",
  "  stripe_customer_id text UNIQUE",
  ");",
  "",
  "CREATE TABLE public.subscriptions (",
  "  id uuid PRIMARY KEY,",
  "  user_id uuid REFERENCES public.users(id),",
  "  stripe_subscription_id text UNIQUE,",
  "  status text NOT NULL",
  ");",
  "",
  "-- DEFECT 1: No CHECK (credits_balance >= 0) -> race conditions drive balance negative!",
  "CREATE TABLE public.wallets (",
  "  user_id uuid PRIMARY KEY REFERENCES public.users(id),",
  "  credits_balance integer NOT NULL DEFAULT 50",
  ");",
  "",
  "-- DEFECT 2: No UNIQUE(stripe_event_id) -> concurrent Stripe webhook retries double-grant credits!",
  "-- DEFECT 3: RLS not enabled on billing tables!",
  "CREATE TABLE public.credit_transactions (",
  "  id uuid PRIMARY KEY,",
  "  user_id uuid REFERENCES public.users(id),",
  "  stripe_event_id text,",
  "  stripe_invoice_id text,",
  "  credits_delta integer NOT NULL,",
  "  created_at timestamptz DEFAULT now()",
  ");"
].join("\n");

const HARDENED_SQL = [
  "CREATE TABLE public.users (id uuid PRIMARY KEY, stripe_customer_id text UNIQUE);",
  "CREATE TABLE public.subscriptions (id uuid PRIMARY KEY, user_id uuid, stripe_subscription_id text UNIQUE, status text);",
  "CREATE TABLE public.wallets (",
  "  user_id uuid PRIMARY KEY,",
  "  credits_balance integer NOT NULL CHECK (credits_balance >= 0)",
  ");",
  "CREATE TABLE public.credit_transactions (",
  "  id uuid PRIMARY KEY,",
  "  user_id uuid,",
  "  stripe_event_id text UNIQUE,",
  "  credits_delta integer NOT NULL",
  ");",
  "ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;",
  "CREATE POLICY users_isolation ON public.users FOR SELECT USING (auth.uid() = id);",
  "ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;",
  "CREATE POLICY subs_isolation ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);",
  "ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;",
  "CREATE POLICY wallets_isolation ON public.wallets FOR SELECT USING (auth.uid() = user_id);",
  "ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;",
  "CREATE POLICY tx_isolation ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);"
].join("\n");

const VULNERABLE_NEXTJS_TS = [
  "// AI-Generated Next.js Stripe Webhook + Vercel AI SDK Streaming Route (app/api/webhooks/stripe/route.ts)",
  "export async function POST(req: Request) {",
  "  // BUG 1: Parses req.json() without raw-body Stripe-Signature HMAC verification!",
  "  const event = await req.json();",
  "",
  "  // BUG 2: Grants on BOTH checkout.session.completed and invoice.paid without canonical invoice lock!",
  "  if (event.type === 'checkout.session.completed' || event.type === 'invoice.paid') {",
  "    const { data: wallet } = await supabase.from('wallets').select('credits').single();",
  "    // BUG 3: Non-atomic JS Read-Modify-Write + parseFloat money math!",
  "    await supabase.from('wallets').update({ credits: wallet.credits + parseFloat(event.amount) });",
  "  }",
  "",
  "  // BUG 4: Streaming LLM deducts credits inside onFinish WITHOUT pre-flight HOLD reservation!",
  "  return streamText({",
  "    model: openai('gpt-4o'),",
  "    onFinish: async ({ usage }) => {",
  "      await supabase.from('wallets').update({ credits: wallet.credits - usage.totalTokens });",
  "    }",
  "  });",
  "}"
].join("\n");

const BROKEN_RLS_SQL = [
  "-- Multi-Tenant AI SaaS Schema with Permissive RLS & Unpinned SECURITY DEFINER RPC",
  "CREATE TABLE public.users (id uuid PRIMARY KEY, stripe_customer_id text UNIQUE);",
  "CREATE TABLE public.subscriptions (id uuid PRIMARY KEY, user_id uuid, stripe_subscription_id text UNIQUE, status text);",
  "CREATE TABLE public.wallets (user_id uuid PRIMARY KEY, credits_balance integer NOT NULL CHECK (credits_balance >= 0));",
  "CREATE TABLE public.credit_transactions (id uuid PRIMARY KEY, user_id uuid, stripe_event_id text UNIQUE, credits_delta integer NOT NULL);",
  "ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;",
  "CREATE POLICY users_isolation ON public.users FOR SELECT USING (auth.uid() = id);",
  "ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;",
  "CREATE POLICY subs_isolation ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);",
  "ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;",
  "-- DEFECT 4: Permissive USING (true) leaks every tenant wallet balance via PostgREST!",
  "CREATE POLICY wallets_open_read ON public.wallets FOR SELECT USING (true);",
  "ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;",
  "-- DEFECT 5: auth.role() = 'authenticated' without auth.uid() allows any logged-in user to read all tenants!",
  "CREATE POLICY tx_any_logged_in ON public.credit_transactions FOR SELECT USING (auth.role() = 'authenticated');",
  "",
  "-- DEFECT 6: SECURITY DEFINER RPC accepts target_user_id without auth.uid() check or SET search_path!",
  "CREATE OR REPLACE FUNCTION public.grant_bonus_credits(target_user_id uuid, delta integer)",
  "RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$",
  "BEGIN",
  "  UPDATE public.wallets SET credits_balance = credits_balance + delta WHERE user_id = target_user_id;",
  "END;",
  "$$;"
].join("\n");

let __state = {
  isProLicenseUnlocked: false,
  licenseLabel: "Free Diagnostic Mode",
  licenseStatusKind: "free",
  licenseStatusText: "FREE DIAGNOSTIC MODE (Remediation SQL Export Redacted)",
  licenseStatusHtml: 'Status: <strong class="status-warn">FREE DIAGNOSTIC MODE (Remediation SQL Export Redacted)</strong>',
  licenseDrawerOpen: false,
  licenseKeyDraft: "",
  polarNotice: null,
  chaos: {
    filter: "ALL",
    planPriceCents: 4900,
    planCredits: 2000,
    monthlySubs: 500,
    quarantineThresholdCents: 2500,
    naiveLeakedCredits: 43680,
    naiveLeakedCents: 107016,
    annualDriftCents: 3210480,
    quarantinedAccounts: [],
    rows: [],
    filteredRows: [],
    eventLog: "",
    logSections: [],
    quarantineSql: "",
    oscilloscopeTicks: []
  },
  linter: {
    activePreset: "vulnerable",
    sqlInput: VULNERABLE_SQL,
    isCodeMode: false,
    findings: [],
    patchOutput: "",
    lintMs: 2
  },
  reconciler: {
    rawReport: "",
    checks: []
  }
};

function notifyKernelListeners() {
  for (const listener of __kernelListeners) {
    try {
      listener();
    } catch (_err) {
      // Isolate listener errors
    }
  }
}

function commitState(mutator) {
  const next = Object.assign({}, __state);
  mutator(next);
  __state = next;
  notifyKernelListeners();
}

function lineOfPattern(text, regex) {
  const m = regex.exec(text);
  if (!m || m.index === undefined) return 1;
  return text.slice(0, m.index).split(/\r?\n/).length;
}

function buildOscilloscopeTicks(planPriceCents, planCredits, thresholdCents, _oooLeakedCents, disputeDeficitCredits, disputeDeficitCents) {
  const ticks = [];
  let runningLeakCents = 0;
  let runningLeakCredits = 0;
  let oooRunningCents = 0;
  let trippedAtTick = -1;

  for (let i = 0; i < 50; i++) {
    let phase = "STREAM";
    let phaseLabel = "Edge 8 · 50x Parallel LLM Hold";
    let naiveCentsDelta = 0;
    let naiveCreditsDelta = 0;
    let watchdogAction = "VERIFIED";

    if (i < 20) {
      phase = "BURST";
      phaseLabel = "Edge 1 & 3 · 20x Parallel Burst";
      if (i === 0) {
        watchdogAction = "COMMITTED";
      } else {
        naiveCentsDelta = planPriceCents;
        naiveCreditsDelta = planCredits;
        watchdogAction = i === 19 ? "ECHO_IGNORED" : "LOCK_REJECTED";
      }
    } else if (i < 30) {
      phase = "OOO";
      phaseLabel = "Edge 2 · Out-of-Order Cancel";
      if (i === 22 || i === 27) {
        naiveCentsDelta = planPriceCents;
        naiveCreditsDelta = planCredits;
        oooRunningCents += planPriceCents;
        watchdogAction = "WATERMARK_DROP";
      } else {
        watchdogAction = "VERIFIED";
      }
    } else if (i < 42) {
      if (i < 35) {
        phase = "MANUAL";
        phaseLabel = "Edge 4 · Manual Override Guard";
        watchdogAction = i === 32 ? "MANUAL_PRESERVED" : "VERIFIED";
      } else if (i < 39) {
        phase = "MULTI";
        phaseLabel = "Edge 5 · 3+ Bucket Deactivation";
        watchdogAction = "ORDER_INVARIANT";
      } else {
        phase = "DELETED";
        phaseLabel = "Edge 6 · Deleted Stripe 404";
        watchdogAction = i === 40 ? "ENTITY_ISOLATED" : "VERIFIED";
      }
    } else {
      if (i < 45) {
        phase = "DISPUTE";
        phaseLabel = "Edge 7a · Clawback > Balance";
        if (i === 43) {
          naiveCentsDelta = disputeDeficitCents;
          naiveCreditsDelta = disputeDeficitCredits;
          watchdogAction = "CLAMPED_ZERO";
        } else {
          watchdogAction = disputeDeficitCents >= thresholdCents ? "QUARANTINED" : "VERIFIED";
        }
      } else if (i === 45 || i === 46) {
        phase = "ARITH";
        phaseLabel = "Edge 7b · $0.01 Floor Clamp";
        watchdogAction = "FLOOR_CLAMPED";
      } else {
        phase = "STREAM";
        phaseLabel = "Edge 8 · 50x Parallel LLM Hold";
        watchdogAction = i === 49 ? "RELEASED_HOLD" : "HTTP_402_GUARDED";
      }
    }

    runningLeakCents += naiveCentsDelta;
    runningLeakCredits += naiveCreditsDelta;
    if (trippedAtTick === -1) {
      if ((i === 22 || i === 27) && oooRunningCents >= thresholdCents) {
        trippedAtTick = i;
      } else if (i === 43 && disputeDeficitCents >= thresholdCents) {
        trippedAtTick = i;
      }
    }

    const breakerState =
      trippedAtTick === -1 || i < trippedAtTick
        ? "ARMED"
        : i === trippedAtTick
          ? "TRIPPED"
          : "QUARANTINED";

    ticks.push({
      index: i,
      tLabel: (i * 0.032).toFixed(2) + "s",
      phase,
      phaseLabel,
      naiveCentsDelta,
      naiveCreditsDelta,
      cumulativeNaiveCents: runningLeakCents,
      cumulativeNaiveCredits: runningLeakCredits,
      watchdogAction,
      breakerState,
      isTripPoint: i === trippedAtTick
    });
  }
  return ticks;
}

function updateLicenseDom(statusHtml, badgeLabel, unlocked) {
  if (isReactMounted()) return;
  const statusEl = getElSafe("license-status-msg");
  const qBadge = getElSafe("quarantine-lock-badge");
  const pBadge = getElSafe("patch-lock-badge");
  if (statusEl) {
    statusEl.innerHTML = statusHtml;
  }
  if (unlocked) {
    if (qBadge) {
      qBadge.className = "sev sev-ok";
      qBadge.textContent = badgeLabel || "PRO UNLOCKED";
    }
    if (pBadge) {
      pBadge.className = "sev sev-ok";
      pBadge.textContent = badgeLabel || "PRO UNLOCKED";
    }
  } else {
    if (qBadge) {
      qBadge.className = "sev sev-warn";
      qBadge.textContent = badgeLabel || "PRO LICENSE REQUIRED";
    }
    if (pBadge) {
      pBadge.className = "sev sev-warn";
      pBadge.textContent = badgeLabel || "PRO LICENSE REQUIRED";
    }
  }
}

function applyProUnlockedUiState(labelSuffix) {
  const text = labelSuffix || "PRO / LIFETIME LICENSE VERIFIED (Full SQL Remediation Export Unlocked)";
  const statusHtml = 'Status: <strong class="status-ok">' + escapeHtmlSafe(text) + "</strong>";
  isProLicenseUnlocked = true;
  commitState((next) => {
    next.isProLicenseUnlocked = true;
    next.licenseLabel = "Pro Verified";
    next.licenseStatusKind = "ok";
    next.licenseStatusText = text;
    next.licenseStatusHtml = statusHtml;
    next.polarNotice = null;
  });
  updateLicenseDom(statusHtml, "PRO UNLOCKED", true);
  runChaosSimulation(currentChaosFilter);
  runSqlLinter();
}

function applyLicenseRelockState(statusKind, msg, statusCssClass, draftOverride) {
  const html = 'Status: <strong class="' + statusCssClass + '">' + escapeHtmlSafe(msg) + "</strong>";
  isProLicenseUnlocked = false;
  commitState((next) => {
    next.isProLicenseUnlocked = false;
    next.licenseLabel = "Free Diagnostic Mode";
    next.licenseStatusKind = statusKind;
    next.licenseStatusText = msg;
    next.licenseStatusHtml = html;
    next.polarNotice = null;
    if (draftOverride !== undefined) {
      next.licenseKeyDraft = draftOverride;
    }
  });
  updateLicenseDom(html, "PRO LICENSE REQUIRED", false);
  runChaosSimulation(currentChaosFilter);
  runSqlLinter();
}

async function verifyEd25519LicenseInBrowser(rawKey, overrideSpkiB64) {
  const trimmed = (rawKey || "").trim();
  const match = /^BWV2E-(PRO_MONTHLY|LIFETIME_TEAM)-(WATCHDOG_V2|BUNDLE_ALL)-(\d{10,12})-([0-9A-F]{12})-([A-Za-z0-9_-]{86})$/.exec(trimmed);
  if (!match) {
    applyLicenseRelockState("error", "Malformed BWV2E Ed25519 License Key.", "status-danger");
    return false;
  }
  const tier = match[1];
  const scope = match[2];
  const expUnix = parseInt(match[3], 10);
  const custHash12 = match[4];
  const sigB64Url = match[5];

  const nowUnix = Math.floor(Date.now() / 1000);
  if (nowUnix > expUnix) {
    applyLicenseRelockState(
      "error",
      "License Key Expired (UTC Unix " + expUnix + "). Renew via Polar checkout below.",
      "status-danger"
    );
    return false;
  }

  const subtle =
    (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.subtle) ||
    (typeof window !== "undefined" && window.crypto && window.crypto.subtle);
  if (!subtle) {
    applyLicenseRelockState(
      "warn",
      "Browser WebCrypto Ed25519 unavailable (HTTPS or localhost required).",
      "status-warn"
    );
    return false;
  }

  try {
    const spkiBytes = decodeBase64Bytes(overrideSpkiB64 || PRIME_TECH_ED25519_PUBLIC_KEY_SPKI_B64, false);
    const sigBytes = decodeBase64Bytes(sigB64Url, true);
    if (sigBytes.length === 64) {
      const canonical = "BWV2E:" + tier + ":" + scope + ":" + expUnix + ":" + custHash12;
      const msgBytes = new Uint8Array(canonical.length);
      for (let i = 0; i < canonical.length; i++) msgBytes[i] = canonical.charCodeAt(i) & 0x7f;

      const pubKey = await subtle.importKey("spki", spkiBytes, { name: "Ed25519" }, false, ["verify"]);
      const ok = await subtle.verify({ name: "Ed25519" }, pubKey, sigBytes, msgBytes);
      if (ok) {
        applyProUnlockedUiState("ED25519 " + tier + " VERIFIED (Full SQL Remediation Export Unlocked)");
        return true;
      }
    }
  } catch (_err) {
    // Fall through to invalid signature message
  }

  applyLicenseRelockState("error", "Invalid Ed25519 License Signature.", "status-danger");
  return false;
}

function unlockProPortal(explicitKey) {
  const inputEl = !isReactMounted() ? getElSafe("license-key-input") : null;
  const rawKey = (
    explicitKey !== undefined
      ? explicitKey
      : inputEl && inputEl.value
        ? inputEl.value
        : __state.licenseKeyDraft || ""
  ).trim();

  if (rawKey.indexOf("BWV2E-") === 0) {
    const wasUnlocked = isProLicenseUnlocked;
    const verifyingMsg = "Verifying Asymmetric Ed25519 Signature...";
    const verifyingHtml = 'Status: <strong class="status-info">' + verifyingMsg + "</strong>";
    isProLicenseUnlocked = false;
    commitState((next) => {
      next.isProLicenseUnlocked = false;
      next.licenseLabel = "Free Diagnostic Mode";
      next.licenseKeyDraft = rawKey;
      next.licenseStatusKind = "info";
      next.licenseStatusText = verifyingMsg;
      next.licenseStatusHtml = verifyingHtml;
      next.polarNotice = null;
    });
    updateLicenseDom(verifyingHtml, "PRO LICENSE REQUIRED", false);
    if (wasUnlocked) {
      runChaosSimulation(currentChaosFilter);
      runSqlLinter();
    }
    verifyEd25519LicenseInBrowser(rawKey);
    return false;
  }

  const digest = sha256HexSync(rawKey);
  if (VALID_LICENSE_SHA256_DIGESTS.indexOf(digest) !== -1) {
    commitState((next) => {
      next.licenseKeyDraft = rawKey;
    });
    applyProUnlockedUiState("PRO / LIFETIME LICENSE VERIFIED (Full SQL Remediation Export Unlocked)");
    return true;
  } else {
    applyLicenseRelockState(
      "error",
      "Invalid License Key. Purchase Pro ($49/mo) or Lifetime ($149) below to receive your BWV2E-... key.",
      "status-danger",
      rawKey
    );
    return false;
  }
}

function runChaosSimulation(filterMode, paramsOverride) {
  currentChaosFilter = filterMode || "ALL";
  const filterBtns = ["ALL", "BURST", "OOO", "MANUAL", "MULTI", "DELETED", "DISPUTE", "ARITH", "STREAM"];
  if (!isReactMounted()) {
    for (const f of filterBtns) {
      const el = getElSafe("btn-filter-" + f);
      if (el && el.classList) {
        if (f === currentChaosFilter) el.classList.add("btn-active");
        else el.classList.remove("btn-active");
      }
    }
  }

  const fallbackPrice = sanitizePositiveSafeInt(__state.chaos.planPriceCents, 4900, 1, 100000000);
  const fallbackCredits = sanitizePositiveSafeInt(__state.chaos.planCredits, 2000, 1, 100000000);
  const fallbackSubs = sanitizeClampedSubsInt(__state.chaos.monthlySubs, 500);
  const fallbackThreshold = sanitizePositiveSafeInt(__state.chaos.quarantineThresholdCents, 2500, 1, 100000000);

  const planPriceCents =
    paramsOverride && paramsOverride.planPriceCents !== undefined
      ? sanitizePositiveSafeInt(paramsOverride.planPriceCents, fallbackPrice, 1, 100000000)
      : isReactMounted()
        ? fallbackPrice
        : readIntInput("chaos-plan-price", fallbackPrice, 1, 100000000);
  const planCredits =
    paramsOverride && paramsOverride.planCredits !== undefined
      ? sanitizePositiveSafeInt(paramsOverride.planCredits, fallbackCredits, 1, 100000000)
      : isReactMounted()
        ? fallbackCredits
        : readIntInput("chaos-plan-credits", fallbackCredits, 1, 100000000);
  const monthlySubs =
    paramsOverride && paramsOverride.monthlySubs !== undefined
      ? sanitizeClampedSubsInt(paramsOverride.monthlySubs, fallbackSubs)
      : isReactMounted()
        ? fallbackSubs
        : readIntInput("chaos-monthly-subs", fallbackSubs, 10, 100000);
  const thresholdCents =
    paramsOverride && paramsOverride.quarantineThresholdCents !== undefined
      ? sanitizePositiveSafeInt(paramsOverride.quarantineThresholdCents, fallbackThreshold, 1, 100000000)
      : isReactMounted()
        ? fallbackThreshold
        : readIntInput("chaos-quarantine-threshold", fallbackThreshold, 1, 100000000);

  // Pure integer arithmetic for all 4 chaos vectors (50 events total):
  const burstMultiplier = 19;
  const burstLeakedCredits = planCredits * burstMultiplier;
  const burstLeakedCents = planPriceCents * burstMultiplier;

  const oooLeakedCredits = planCredits * 2;
  const oooLeakedCents = planPriceCents * 2;

  const consumedBeforeDispute = Math.round((planCredits * 84) / 100);
  const remainingBeforeDispute = planCredits - consumedBeforeDispute;
  const disputeDeficitCredits = consumedBeforeDispute;
  const disputeDeficitCents = Math.round((planPriceCents * 84) / 100);

  const preservedTopUpAndSupport = 500 + 200;

  const totalNaiveLeakedCredits = burstLeakedCredits + oooLeakedCredits + disputeDeficitCredits;
  const totalNaiveLeakedCents = burstLeakedCents + oooLeakedCents + disputeDeficitCents;

  const affectedAccountsPerYear = Math.max(1, Math.round((monthlySubs * 2) / 100));
  const singleAccountAvgLeakCents = Math.round(totalNaiveLeakedCents / 4);
  const annualExposureCents = affectedAccountsPerYear * singleAccountAvgLeakCents * 12;

  const quarantinedAccounts = [];
  if (oooLeakedCents >= thresholdCents) {
    quarantinedAccounts.push({
      userId: "usr_ooo_zombie_01",
      leakCents: oooLeakedCents,
      reason: "ZOMBIE_SUBSCRIPTION_OUT_OF_ORDER_ATTEMPT"
    });
  }
  if (disputeDeficitCents >= thresholdCents) {
    quarantinedAccounts.push({
      userId: "usr_dispute_abuse_02",
      leakCents: disputeDeficitCents,
      reason: "CLAWBACK_DEFICIT_CHARGE_DISPUTE_CREATED"
    });
  }

  const rows = [
    {
      key: "BURST",
      edgeNum: "01 & 03",
      plainTitle: "20x Parallel Burst & Self-Echo",
      impactTag: "+" + formatUsdFromCents(burstLeakedCents) + " blocked",
      kpiDelta: "20 events -> 1 commit (19 rejected)",
      vector: "Edge 1 & 3 · 20x Parallel Burst & Self-Echo Idempotency (20 events in 1ms)",
      naive:
        "FAIL: Race condition reads stale balance before UPDATE commits: grants " +
        (planCredits * 20).toLocaleString("en-US") +
        " credits instead of " +
        planCredits.toLocaleString("en-US") +
        " (+" +
        burstLeakedCredits.toLocaleString("en-US") +
        " leaked = " +
        formatUsdFromCents(burstLeakedCents) +
        "); re-applies self-echo webhooks.",
      watchdog:
        "PASS: Atomic canonical lock (invoice:in_pro_1), stripe_event_id dedup & live_state === last_applied_state self-echo guard (IGNORED_SELF_ECHO): applies 1/20, 0 credits leaked.",
      ruleCodes: ["CONCURRENT_LOCK_REJECTED", "IGNORED_SELF_ECHO"]
    },
    {
      key: "OOO",
      edgeNum: "02",
      plainTitle: "Out-of-Order Cancel vs Update",
      impactTag: "2 zombies blocked",
      kpiDelta: "t=90s update <= t=100s cancel",
      vector: "Edge 2 · Out-of-Order Webhook (10 events: t=100s delete before t=90s update)",
      naive:
        "FAIL: Blindly overwrites 'canceled' with delayed t=90s 'active' payload, resurrecting 2 Zombie Subscriptions (" +
        formatUsdFromCents(oooLeakedCents) +
        " / +" +
        oooLeakedCredits.toLocaleString("en-US") +
        " credits leaked).",
      watchdog:
        "PASS: Enforces last_stripe_event_created_utc & last_reverted_at watermarks (t=90s <= t=100s): rejects stale update as IGNORED_OUT_OF_ORDER; status stays 'canceled'.",
      ruleCodes: ["IGNORED_OUT_OF_ORDER", "UTC_WATERMARK"]
    },
    {
      key: "MANUAL",
      edgeNum: "04",
      plainTitle: "Manual Override & Support Grant Guard",
      impactTag: "7 fields preserved",
      kpiDelta: "compare_at_price + 250 support cr safe",
      vector: "Edge 4 · Partial Manual Edit of Any Field & Support Grants (SKIPPED_MANUAL_EDIT)",
      naive:
        "FAIL: Blind campaign revert overwrites admin's manual compare_at_price override (6,500c -> 5,900c) and wipes out +250 support goodwill credits.",
      watchdog:
        "PASS: Detects isolated manual change on any of 7 tracked fields, marks ALL active memberships SKIPPED_MANUAL_EDIT before clearing registry, and preserves SKIPPED_MANUAL_SUPPORT_GRANT.",
      ruleCodes: ["SKIPPED_MANUAL_EDIT", "SKIPPED_MANUAL_SUPPORT_GRANT"]
    },
    {
      key: "MULTI",
      edgeNum: "05",
      plainTitle: "3+ Overlapping Credit Buckets",
      impactTag: "700 = 700 = 700",
      kpiDelta: "3 permutation orders match",
      vector: "Edge 5 · 3+ Overlapping Credit Sources in 3 Orders: 1→2→3, 2→1→3, 3→2→1 (12 events)",
      naive:
        "FAIL: Flat credits_balance=0 reset on subscription cancel wipes out 500 non-expiring Top-Up credits + 200 Manual Support credits.",
      watchdog:
        "PASS: 100% order-invariant across 1→2→3, 2→1→3, 3→2→1: converges to exact baseline price (" +
        planPriceCents +
        "c) and preserves 500 Top-Up + 200 Support = 700 credits.",
      ruleCodes: ["ORDER_INVARIANT", "MULTI_BUCKET_LEDGER"]
    },
    {
      key: "DELETED",
      edgeNum: "06",
      plainTitle: "Deleted Stripe Entities (404)",
      impactTag: "Batch isolated",
      kpiDelta: "0 batch aborts on missing entities",
      vector: "Edge 6 · Deleted External Entities in Stripe (deletedCustomers / deletedSubscriptions)",
      naive: "FAIL: Throws unhandled Stripe 404 resource_missing mid-batch, aborting reconciliation for all remaining active subscribers.",
      watchdog:
        "PASS: Gracefully isolates deleted entities into deletedCustomers, deletedSubscriptions & deletedVariants while completing 100% of remaining batch.",
      ruleCodes: ["deletedCustomers", "deletedSubscriptions"]
    },
    {
      key: "DISPUTE",
      edgeNum: "07a",
      plainTitle: "Clawback Exceeding Wallet Balance",
      impactTag: "0 HTTP 500s",
      kpiDelta: "Clamped at 0 cr + account frozen",
      vector: "Edge 7a · Partial Refund + Dispute Clawback > Remaining Balance (8 events)",
      naive:
        "FAIL: Subtracts " +
        planCredits.toLocaleString("en-US") +
        " from " +
        remainingBeforeDispute.toLocaleString("en-US") +
        " remaining -> balance hits -" +
        disputeDeficitCredits.toLocaleString("en-US") +
        " (or crashes PostgreSQL CHECK >= 0 with HTTP 500 retry storm).",
      watchdog:
        "PASS: Clamps deduction to 0 revocable credits (never negative), emits Dry-Run CLAWBACK_EXCEEDS_REMAINING_BALANCE_WARNING (" +
        disputeDeficitCents +
        "c deficit), and quarantines.",
      ruleCodes: ["CLAWBACK_EXCEEDS_REMAINING_BALANCE_WARNING", "CHECK_NON_NEGATIVE"]
    },
    {
      key: "ARITH",
      edgeNum: "07b",
      plainTitle: "100% Discount & $0.01 Floor Clamp",
      impactTag: "Integer floor",
      kpiDelta: "1c floor + ISO-4217 guard",
      vector: "Edge 7b · Boundary Arithmetic: 100% Discount & Fixed Discount > Price ($0.01 Floor)",
      naive:
        "FAIL: 100% discount or $50.00 off $29.00 yields $0.00 or -$21.00 negative billing amount; FLOAT math introduces IEEE-754 drift and accepts zero-decimal JPY without validation.",
      watchdog:
        "PASS: Pure integer cents + ISO-4217 validation: clamps 100% and > price discounts to 1 cent ($0.01) with Dry-Run FLOOR_CLAMP_WARNING & EFFECTIVE_DISCOUNT_DRIFT_GT_5PP.",
      ruleCodes: ["FLOOR_CLAMP_WARNING", "EFFECTIVE_DISCOUNT_DRIFT_GT_5PP"]
    },
    {
      key: "STREAM",
      edgeNum: "08",
      plainTitle: "50x Parallel LLM Stream Hold",
      impactTag: "40/50 HTTP 402",
      kpiDelta: "650 used, 350 released, 0 leaked",
      vector: "Edge 8 · 50x Parallel LLM Stream Hold (streamText / onFinish Token Race)",
      naive:
        "FAIL: Post-stream onFinish deduction checks if (user.credits > 0) at t=0ms: all 50 parallel /api/chat requests pass before any stream finishes, burning 3,250 credits on a 1,000-credit wallet (+2,250 unbacked credits leaked).",
      watchdog:
        "PASS: Two-Phase Pre-Flight Reservation (HOLD -> CAPTURE / RELEASE + TTL Zombie Reaper): locks 100 max credits pre-flight, allows 10/50 streams, blocks 40/50 with HTTP 402 before touching OpenAI, commits 650 actual credits & refunds 350 unused hold (0 leaked).",
      ruleCodes: ["PRE_FLIGHT_HOLD", "HTTP_402_BLOCK"]
    }
  ];

  const filteredRows = currentChaosFilter === "ALL" ? rows : rows.filter((r) => r.key === currentChaosFilter);

  const logSections = [
    {
      key: "BURST",
      lines: [
        "[Edge 1 & 3 | t=00.000s] 20x concurrent invoice.paid + checkout.session.completed (invoice=in_pro_1, amount=" + planPriceCents + "c)",
        "  -> Naive Handler:     APPLIED 20/20 -> oldBalance=0 -> newBalance=" + planCredits * 20 + " (LEAKED +" + burstLeakedCredits + " credits)",
        "  -> Watchdog v2:       APPLIED 1/20, CONCURRENT_LOCK_REJECTED / IGNORED_ALREADY_SETTLED=19 -> newBalance=" + planCredits + " (0 leak)",
        "  -> Self-Echo Check:   evt_echo_back_002 (live_state === last_applied_state) -> IGNORED_SELF_ECHO"
      ]
    },
    {
      key: "OOO",
      lines: [
        "[Edge 2 | t=01.400s] evt_sub_deleted (created t=100s) arrived BEFORE evt_sub_updated (created t=90s, status='active')",
        "  -> Naive Handler:     APPLIED stale t=90s update -> status='active' (ZOMBIE SUBSCRIPTION RESURRECTED)",
        "  -> Watchdog v2:       IGNORED_OUT_OF_ORDER (eventCreatedUtc 90s <= watermark 100s) -> status='canceled'"
      ]
    },
    {
      key: "MANUAL",
      lines: [
        "[Edge 4 | t=03.200s] Admin manually edited compareAtPriceCents (5900c -> 6500c) while rule_1 & rule_2 were active",
        "  -> Naive Handler:     Overwrote manual edit back to 5900c and wiped +250 support grant credits",
        "  -> Watchdog v2:       Marked rule_1 & rule_2 SKIPPED_MANUAL_EDIT before registry clear; preserved 6500c & +250 SKIPPED_MANUAL_SUPPORT_GRANT"
      ]
    },
    {
      key: "MULTI",
      lines: [
        "[Edge 5 | t=05.000s] 3+ Overlapping Sources (Free=100, MonthlySub=" + planCredits + ", TopUp=500, ManualSupport=200)",
        "  -> Deactivation 1->2->3: Watchdog v2 finalBalance = 700 cr | baselinePrice=" + planPriceCents + "c",
        "  -> Deactivation 2->1->3: Watchdog v2 finalBalance = 700 cr | baselinePrice=" + planPriceCents + "c (Exact Match)",
        "  -> Deactivation 3->2->1: Watchdog v2 finalBalance = 700 cr | baselinePrice=" + planPriceCents + "c (Exact Match)"
      ]
    },
    {
      key: "DELETED",
      lines: [
        "[Edge 6 | t=06.800s] Batch Reconcile with Deleted Stripe Entities (cus_deleted_99, sub_deleted_88)",
        "  -> Naive Handler:     Uncaught Stripe 404 resource_missing -> batch aborted",
        "  -> Watchdog v2:       revertedOrSyncedUsers=['usr_valid_1'], deletedCustomers=['cus_deleted_99'], deletedSubscriptions=['sub_deleted_88']"
      ]
    },
    {
      key: "DISPUTE",
      lines: [
        "[Edge 7a | t=08.100s] User consumed " + consumedBeforeDispute + "/" + planCredits + " credits; 50% charge.refunded + 50% charge.dispute.created arrived",
        "  -> Naive Handler:     oldBalance=" + remainingBeforeDispute + " -> newBalance=-" + disputeDeficitCredits + " (POSTGRES CHECK >= 0 CRASH / HTTP 500)",
        "  -> Watchdog v2:       Clamped oldBalance=" + remainingBeforeDispute + " -> newBalance=0 | Deficit=" + disputeDeficitCredits + " cr (" + disputeDeficitCents + "c) | QUARANTINED=true"
      ]
    },
    {
      key: "ARITH",
      lines: [
        "[Edge 7b | t=09.500s] Dry-Run Boundary Arithmetic (100% discount & $50.00 off " + formatUsdFromCents(planPriceCents) + " plan)",
        "  -> Dry-Run Preview:   oldPrice=" + planPriceCents + "c -> newPrice=1c ($0.01 minimum floor) | Warnings: [FLOOR_CLAMP_WARNING, EFFECTIVE_DISCOUNT_DRIFT_GT_5PP]"
      ]
    },
    {
      key: "STREAM",
      lines: [
        "[Edge 8  | t=10.000s] 50x concurrent POST /api/chat LLM streams (wallet=1000cr, maxHold=100cr, actualUsed=65cr)",
        "  -> Naive onFinish:    50/50 pass t=0ms check -> 3,250 credits burned on OpenAI (+2,250 unbacked credits leaked)",
        "  -> Watchdog 2-Phase:  RESERVED 10/50, HTTP 402 BLOCKED 40/50 -> COMMITTED 650cr, RELEASED 350cr unused hold -> 0 leaked"
      ]
    }
  ];

  const activeLogSections = currentChaosFilter === "ALL" ? logSections : logSections.filter((s) => s.key === currentChaosFilter);
  const logLines = [
    "[UTC 2026-11-01T10:00:00.000Z] Deterministic Stripe Webhook Fault & 7-Edge-Case State Machine Log (Integer Cents Mode)",
    "--------------------------------------------------------------------------------------------------------------"
  ];
  for (const sec of activeLogSections) {
    for (const l of sec.lines) logLines.push(l);
    logLines.push("");
  }
  const eventLogText = logLines.join("\n");

  const sqlPatch = [
    "-- Active Runaway Credit Circuit-Breaker Quarantine Patch (Dry-Run Preview)",
    "-- Target Column: public.users.is_billing_quarantined | Threshold: " + thresholdCents + " integer cents (" + formatUsdFromCents(thresholdCents) + ")"
  ];
  if (!isProLicenseUnlocked) {
    sqlPatch.push(
      "-- Diagnostic Result: " + quarantinedAccounts.length + " account(s) exceeded threshold (" + quarantinedAccounts.map((a) => a.userId + "=" + a.leakCents + "c").join(", ") + ")",
      "--",
      "-- [REDACTED IN FREE DIAGNOSTIC MODE]",
      "-- Enter your BWV2-... Pro/Lifetime License Key above (or purchase Pro $49/mo / Lifetime $149 below)",
      "-- to unlock executable circuit-breaker SQL statements & the atomic PL/pgSQL SELECT ... FOR UPDATE engine."
    );
  } else {
    sqlPatch.push(
      'ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "is_billing_quarantined" BOOLEAN NOT NULL DEFAULT FALSE;',
      "BEGIN;"
    );
    if (quarantinedAccounts.length === 0) {
      sqlPatch.push("-- No accounts exceeded quarantine threshold of " + thresholdCents + " integer cents.");
    } else {
      for (const acc of quarantinedAccounts) {
        sqlPatch.push(
          "-- Freeze " + acc.userId + ": estimatedLeakCents=" + acc.leakCents + " (" + formatUsdFromCents(acc.leakCents) + "), reason=" + acc.reason,
          'UPDATE "public"."users" SET "is_billing_quarantined" = TRUE WHERE "id" = \'' + acc.userId + '\' AND COALESCE("is_billing_quarantined", FALSE) = FALSE;'
        );
      }
    }
    sqlPatch.push("COMMIT;");
  }
  const quarantineSqlText = sqlPatch.join("\n");

  if (!isReactMounted()) {
    const leakedCreditsEl = getElSafe("naive-leaked-credits");
    const leakedUsdEl = getElSafe("naive-leaked-usd");
    const annualEl = getElSafe("naive-annual-exposure");
    const wipedEl = getElSafe("naive-wiped-credits");
    const qStatusEl = getElSafe("watchdog-quarantine-status");
    const tbodyEl = getElSafe("chaos-comparison-tbody");
    const logEl = getElSafe("chaos-event-log");
    const qSqlEl = getElSafe("quarantine-sql-output");

    if (leakedCreditsEl) leakedCreditsEl.textContent = "+" + totalNaiveLeakedCredits.toLocaleString("en-US") + " credits";
    if (leakedUsdEl) leakedUsdEl.textContent = formatUsdFromCents(totalNaiveLeakedCents) + " (" + totalNaiveLeakedCents.toLocaleString("en-US") + " integer cents)";
    if (annualEl) annualEl.textContent = formatUsdFromCents(annualExposureCents) + " / yr";
    if (wipedEl) wipedEl.textContent = preservedTopUpAndSupport + " customer credits destroyed";
    if (qStatusEl) qStatusEl.textContent = "is_billing_quarantined = TRUE (" + quarantinedAccounts.length + " frozen >= " + thresholdCents + "c)";
    if (tbodyEl) {
      tbodyEl.innerHTML = filteredRows
        .map(
          (r) =>
            "<tr>" +
            "<td><strong>" + escapeHtmlSafe(r.vector) + "</strong></td>" +
            "<td class='cell-naive'>" + escapeHtmlSafe(r.naive) + "</td>" +
            "<td class='cell-watchdog'>" + escapeHtmlSafe(r.watchdog) + "</td>" +
            "</tr>"
        )
        .join("");
    }
    if (logEl) logEl.textContent = eventLogText;
    if (qSqlEl) qSqlEl.value = quarantineSqlText;
  }

  const ticks = buildOscilloscopeTicks(
    planPriceCents,
    planCredits,
    thresholdCents,
    oooLeakedCents,
    disputeDeficitCredits,
    disputeDeficitCents
  );

  commitState((next) => {
    next.chaos = {
      filter: currentChaosFilter,
      planPriceCents,
      planCredits,
      monthlySubs,
      quarantineThresholdCents: thresholdCents,
      naiveLeakedCredits: totalNaiveLeakedCredits,
      naiveLeakedCents: totalNaiveLeakedCents,
      annualDriftCents: annualExposureCents,
      quarantinedAccounts,
      rows,
      filteredRows,
      eventLog: eventLogText,
      logSections: activeLogSections,
      quarantineSql: quarantineSqlText,
      oscilloscopeTicks: ticks
    };
  });
}

function copyQuarantineSql() {
  if (!isProLicenseUnlocked) {
    const msg = "Pro / Lifetime License Required to copy executable Quarantine SQL.";
    const html = 'Status: <strong class="status-warn">' + msg + "</strong>";
    commitState((next) => {
      next.licenseStatusKind = "warn";
      next.licenseStatusText = msg;
      next.licenseStatusHtml = html;
      next.polarNotice = null;
      next.licenseDrawerOpen = true;
    });
    updateLicenseDom(html, "PRO LICENSE REQUIRED", false);
    return false;
  }
  const el = !isReactMounted() ? getElSafe("quarantine-sql-output") : null;
  const textToCopy = el && el.value ? el.value : __state.chaos.quarantineSql;
  if (el && typeof el.select === "function") el.select();
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    navigator.clipboard.writeText(textToCopy);
  }
  return true;
}

function loadSampleSql(mode) {
  let code = VULNERABLE_SQL;
  let preset = "vulnerable";
  if (mode === "hardened") {
    code = HARDENED_SQL;
    preset = "hardened";
  } else if (mode === "nextjs") {
    code = VULNERABLE_NEXTJS_TS;
    preset = "nextjs";
  } else if (mode === "rls_idor") {
    code = BROKEN_RLS_SQL;
    preset = "rls_idor";
  }

  if (!isReactMounted()) {
    const inputEl = getElSafe("sql-input");
    if (inputEl) inputEl.value = code;
  }
  commitState((next) => {
    next.linter = Object.assign({}, next.linter, {
      activePreset: preset,
      sqlInput: code
    });
  });
  runSqlLinter(code, preset);
}

function stripJsCommentsPreserveLines(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\r\n]/g, " "))
    .replace(/(^|[^:\\])\/\/[^\r\n]*/g, "$1");
}

function stripSqlCommentsPreserveLines(src) {
  return src.replace(/\/\*[\s\S]*?\*\/|--[^\r\n]*/g, (m) => m.replace(/[^\r\n]/g, " "));
}

function extractBalancedParen(str, startIdx) {
  let i = startIdx;
  while (i < str.length && /\s/.test(str[i])) i++;
  if (i >= str.length || str[i] !== "(") return null;
  let depth = 0;
  let inSingleQuote = false;
  const contentStart = i + 1;
  for (; i < str.length; i++) {
    const ch = str[i];
    if (inSingleQuote) {
      if (ch === "'" && str[i + 1] === "'") {
        i++;
      } else if (ch === "'") {
        inSingleQuote = false;
      }
      continue;
    }
    if (ch === "'") {
      inSingleQuote = true;
    } else if (ch === "(") {
      depth++;
    } else if (ch === ")") {
      depth--;
      if (depth === 0) {
        return { expr: str.slice(contentStart, i), endIdx: i + 1 };
      }
    }
  }
  return null;
}

function isPermissivePolicyExpr(rawExpr) {
  let e = rawExpr.trim();
  while (e.startsWith("(") && e.endsWith(")")) {
    const inner = extractBalancedParen(e, 0);
    if (inner && inner.endIdx === e.length) {
      e = inner.expr.trim();
    } else {
      break;
    }
  }
  if (/^true$/i.test(e) || /^1\s*=\s*1$/.test(e)) return true;
  if (/auth\.role\s*\(\s*\)\s*=\s*'authenticated'/i.test(e) && !/auth\.(?:uid|jwt)\s*\(/i.test(e)) {
    return true;
  }
  return false;
}

function stmtHasNonNegativeBalanceCheck(stmt) {
  if (!/\bCHECK\b/i.test(stmt)) return false;
  const chkRe = /\bCHECK\s*\([\s(]*([a-zA-Z0-9_."]+)\s*>=\s*(?:\(\s*0\s*\)|0\b)/gi;
  let m;
  while ((m = chkRe.exec(stmt)) !== null) {
    if (m[1].toLowerCase().indexOf("balance") !== -1) {
      return true;
    }
  }
  return false;
}

function runSqlLinter(codeOverride, presetOverride) {
  const tStart = typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : 0;
  const domSqlEl = !isReactMounted() ? getElSafe("sql-input") : null;
  const sql =
    typeof codeOverride === "string"
      ? codeOverride
      : isReactMounted()
        ? __state.linter.sqlInput
        : domSqlEl && typeof domSqlEl.value === "string"
          ? domSqlEl.value
          : __state.linter.sqlInput || "";

  if (sql.trim() === "") {
    const emptyPatchText =
      "-- Paste a PostgreSQL migration (.sql) or Next.js/TypeScript route (.ts) to run offline invariant checks.";
    if (!isReactMounted()) {
      const container = getElSafe("findings-container");
      const patchEl = getElSafe("patch-output");
      if (container) {
        container.innerHTML =
          '<div class="finding-ok">0 Schema or RLS Vulnerabilities Found — Paste SQL or TypeScript route to audit</div>';
      }
      if (patchEl) patchEl.value = emptyPatchText;
    }
    const tEnd = typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : 0;
    const lintMs = Math.max(1, Math.round(tEnd - tStart));
    commitState((next) => {
      next.linter = {
        activePreset: presetOverride !== undefined ? presetOverride : next.linter.activePreset,
        sqlInput: sql,
        isCodeMode: false,
        findings: [],
        patchOutput: emptyPatchText,
        lintMs
      };
    });
    return;
  }

  const cleanCode = stripJsCommentsPreserveLines(sql);
  const codeDetectProbe = cleanCode.replace(/^\s*--[^\r\n]*/gm, " ");
  const isCodeMode =
    /\b(?:export\s+(?:async\s+)?function|export\s+default\b|streamText\s*\(|generateText\s*\(|generateObject\s*\(|streamObject\s*\(|(?:req|request)\.json\s*\(|supabase\.from\s*\(|prisma\.)/.test(
      codeDetectProbe
    );

  if (isCodeMode) {
    const codeFindings = [];
    const looksLikeStripeWebhook =
      /stripe-signature|constructEvent|verifyStripeWebhookSignature|webhooks\/stripe|stripe\.webhooks|checkout\.session\.completed|invoice\.(?:paid|payment_succeeded)|customer\.subscription|charge\.(?:refunded|dispute)|payment_intent\./i.test(
        cleanCode
      );
    if (
      looksLikeStripeWebhook &&
      (/\b(req|request)\.json\s*\(\s*\)/.test(cleanCode) || !/constructEvent|verifyStripeWebhookSignature/.test(cleanCode))
    ) {
      codeFindings.push({
        sev: "CRITICAL",
        title: "Webhook skips raw-body HMAC signature verification",
        code: "AST 1 · MISSING_STRIPE_SIGNATURE_VERIFICATION",
        table: "app/api/webhooks/stripe/route.ts",
        line: lineOfPattern(cleanCode, /\b(?:req|request)\.json\s*\(|export\s+(?:default\s+)?(?:async\s+)?function/),
        msg: "Webhook route parses req.json() or omits cryptographic Stripe-Signature HMAC verification, allowing forged invoice.paid payloads.",
        diffRemove: "- const event = await req.json(); // Breaks raw HMAC body & skips Stripe-Signature check",
        diffAdd: "+ const rawBody = await req.text(); verifyStripeWebhookSignature(rawBody, sig, secret);"
      });
    }
    if (
      /checkout\.session\.completed/.test(cleanCode) &&
      /invoice\.(paid|payment_succeeded)/.test(cleanCode) &&
      !/canonical_grant_key|canonicalGrantKey/.test(cleanCode)
    ) {
      codeFindings.push({
        sev: "HIGH",
        title: "Grants twice on signup without canonical invoice lock",
        code: "AST 2 · DUAL_WEBHOOK_GRANT_WITHOUT_CANONICAL_LOCK",
        table: "checkout.session.completed + invoice.paid",
        line: lineOfPattern(cleanCode, /checkout\.session\.completed/),
        msg: "Handles both checkout.session.completed and invoice.paid without canonical invoice_id deduplication (grants 2x credits on signup).",
        diffRemove: "- if (event.type === 'checkout.session.completed' || event.type === 'invoice.paid') { ... }",
        diffAdd: "+ canonicalGrantKey = `invoice:${event.invoiceId}`; // Dedupes cross-event parallel bursts"
      });
    }
    if (/\b(credits|credits_balance|balance)\s*:\s*[a-zA-Z0-9_$.]+\.(credits|credits_balance|balance)\s*[+-]/.test(cleanCode)) {
      codeFindings.push({
        sev: "CRITICAL",
        title: "Non-atomic JS wallet balance read-modify-write",
        code: "AST 3 · NON_ATOMIC_READ_MODIFY_WRITE_CREDITS",
        table: "supabase.from('wallets').update(...)",
        line: lineOfPattern(cleanCode, /\b(?:credits|credits_balance|balance)\s*:/),
        msg: "Non-atomic JavaScript Read-Modify-Write credit mutation allows 20 concurrent requests to overwrite the same wallet balance.",
        diffRemove: "- await supabase.from('wallets').update({ credits: wallet.credits + 1000 });",
        diffAdd: "+ SELECT credits_balance FROM public.wallets WHERE user_id = $1 FOR UPDATE; // Row lock"
      });
    }
    if (
      /\b(streamText|streamObject)\s*\(/.test(cleanCode) &&
      /\bonFinish\b/.test(cleanCode) &&
      !/reserveCreditsForStream|reserveStreamCredits|executeGuardedAiStream/.test(cleanCode)
    ) {
      codeFindings.push({
        sev: "CRITICAL",
        title: "Unreserved LLM stream deduction inside onFinish",
        code: "AST 4 · UNRESERVED_STREAMING_LLM_DEDUCTION",
        table: "streamText({ onFinish })",
        line: lineOfPattern(cleanCode, /\b(?:streamText|streamObject)\s*\(/),
        msg: "Deducts LLM credits inside onFinish without a Pre-Flight Hold Reservation. 50 parallel /api/chat requests will bypass the balance check before stream #1 finishes.",
        diffRemove: "- return streamText({ model, onFinish: async ({ usage }) => deductCredits(usage) });",
        diffAdd: "+ return watchdog.executeGuardedAiStream({ userId, estimatedMaxCredits: 100, streamExecutor });"
      });
    }
    if (
      /\b(streamText|generateText|generateObject|streamObject)\s*\(/.test(cleanCode) &&
      !/auth\.getUser|getServerSession|currentUser\s*\(|verifySession|requireAuthenticatedUser/.test(cleanCode)
    ) {
      codeFindings.push({
        sev: "CRITICAL",
        title: "AI route runs paid model without caller auth or hold",
        code: "AST 5 · DENIAL_OF_WALLET_UNGUARDED_AI_ROUTE",
        table: "POST /api/chat (LLM Endpoint)",
        line: lineOfPattern(cleanCode, /\b(?:streamText|generateText|generateObject|streamObject)\s*\(/),
        msg: "Invokes paid LLM inference without caller session authentication or pre-flight rate/wallet hold, enabling anonymous Denial-of-Wallet API spend.",
        diffRemove: "- export async function POST(req: Request) { return streamText({ model: openai('gpt-4o') }); }",
        diffAdd: "+ const user = await requireAuthenticatedUser(req); // + pre-flight credit hold & rate limit"
      });
    }

    const patchOutputText = !isProLicenseUnlocked
      ? [
          "// Billing Watchdog AST Code Audit: " + codeFindings.length + " Next.js / Streaming LLM Vulnerability(s) Detected",
          "//",
          "// [REDACTED IN FREE DIAGNOSTIC MODE]",
          "// Enter your BWV2-... Pro/Lifetime License Key above to unlock the drop-in Two-Phase Streaming Hold & Atomic Webhook route.ts blueprint."
        ].join("\n")
      : [
          "// Billing Watchdog v2 — Hardened Next.js Webhook + Two-Phase Streaming Hold Blueprint",
          "export async function POST(req: Request) {",
          "  const rawBody = await req.text();",
          "  const sig = req.headers.get('stripe-signature');",
          "  const out = await watchdogFirewall.handleRawWebhookHttp(rawBody, sig);",
          "  return new Response(JSON.stringify(out.body), { status: out.httpStatus });",
          "}",
          "// Pre-Flight Hold before streamText(): watchdogFirewall.reserveStreamCredits(...) -> commitStreamCredits(...)"
        ].join("\n");

    if (!isReactMounted()) {
      const container = getElSafe("findings-container");
      const patchEl = getElSafe("patch-output");
      if (container) {
        if (codeFindings.length === 0) {
          container.innerHTML =
            '<div class="finding-ok">0 Next.js / Streaming LLM Route Vulnerabilities Found</div>';
        } else {
          container.innerHTML = codeFindings
            .map(
              (f) =>
                '<div class="finding">' +
                '<div class="finding-head"><span class="sev ' +
                (f.sev === "HIGH" ? "sev-high" : "") +
                '">' +
                escapeHtmlSafe(f.sev) +
                "</span><strong>" +
                escapeHtmlSafe(f.code) +
                '</strong> <span class="finding-table">(' +
                escapeHtmlSafe(f.table) +
                ")</span></div>" +
                '<div class="finding-msg">' +
                escapeHtmlSafe(f.msg) +
                "</div>" +
                '<div class="code-diff">' +
                '<div class="diff-del">' +
                escapeHtmlSafe(f.diffRemove) +
                "</div>" +
                '<div class="diff-add">' +
                escapeHtmlSafe(f.diffAdd) +
                "</div>" +
                "</div>" +
                "</div>"
            )
            .join("");
        }
      }
      if (patchEl) patchEl.value = patchOutputText;
    }

    const tEnd = typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : 0;
    const lintMs = Math.max(1, Math.round(tEnd - tStart));
    commitState((next) => {
      next.linter = {
        activePreset: presetOverride !== undefined ? presetOverride : next.linter.activePreset,
        sqlInput: sql,
        isCodeMode: true,
        findings: codeFindings,
        patchOutput: patchOutputText,
        lintMs
      };
    });
    return;
  }

  const cleanSql = stripSqlCommentsPreserveLines(sql);
  const statements = cleanSql
    .split(";")
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const findings = [];
  const patchLines = [
    "-- Billing Watchdog Auto-Generated Non-Blocking Remediation Patch",
    "-- Safe for zero-downtime production execution on PostgreSQL / Supabase",
    ""
  ];

  const hasCheckNonNeg = statements.some((stmt) => stmtHasNonNegativeBalanceCheck(stmt));
  if (!hasCheckNonNeg) {
    findings.push({
      sev: "CRITICAL",
      title: "Missing non-negative balance check constraint",
      code: "CHECK 1 · MISSING_NON_NEGATIVE_CHECK",
      table: "public.wallets (credits_balance)",
      line: lineOfPattern(cleanSql, /CREATE\s+TABLE\s+(?:"?public"?\s*\.\s*)?"?wallets"?|credits_balance/i),
      msg: "No CHECK (credits_balance >= 0) constraint found. Concurrent API requests can drive user credit balances negative.",
      diffRemove: "-   credits_balance integer NOT NULL DEFAULT 50",
      diffAdd: "+   credits_balance integer NOT NULL DEFAULT 50 CHECK (credits_balance >= 0)"
    });
    patchLines.push(
      "-- 1. Enforce non-negative credit balance without locking concurrent reads:",
      "ALTER TABLE public.wallets",
      "  ADD CONSTRAINT wallets_credits_balance_non_negative_chk",
      "  CHECK (credits_balance >= 0) NOT VALID;",
      "ALTER TABLE public.wallets",
      "  VALIDATE CONSTRAINT wallets_credits_balance_non_negative_chk;",
      ""
    );
  }

  const hasUniqueEvent = statements.some(
    (stmt) =>
      /\bstripe_event_id"?\s+[^,)]*\bUNIQUE\b/i.test(stmt) ||
      /\bUNIQUE\s*\([^)]*\bstripe_event_id\b[^)]*\)/i.test(stmt) ||
      /\bUNIQUE\s+USING\s+INDEX\s+"?[a-zA-Z0-9_]*stripe_event_id[a-zA-Z0-9_]*"?/i.test(stmt) ||
      (/\bCREATE\s+UNIQUE\s+INDEX\b/i.test(stmt) && /\bstripe_event_id\b/i.test(stmt))
  );
  if (!hasUniqueEvent) {
    findings.push({
      sev: "CRITICAL",
      title: "Missing Stripe event idempotency key constraint",
      code: "CHECK 2 · MISSING_WEBHOOK_UNIQUE_CONSTRAINT",
      table: "public.credit_transactions (stripe_event_id)",
      line: lineOfPattern(cleanSql, /stripe_event_id|credit_transactions/i),
      msg: "Column stripe_event_id lacks a UNIQUE constraint. Parallel Stripe webhook retries (invoice.paid) will grant duplicate credits.",
      diffRemove: "-   stripe_event_id text,",
      diffAdd: "+   stripe_event_id text UNIQUE,"
    });
    patchLines.push(
      "-- 2. Enforce Stripe webhook idempotency at the database boundary (zero-downtime CONCURRENTLY):",
      "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS credit_transactions_stripe_event_id_idx ON public.credit_transactions (stripe_event_id);",
      "ALTER TABLE public.credit_transactions ADD CONSTRAINT credit_transactions_stripe_event_id_uq UNIQUE USING INDEX credit_transactions_stripe_event_id_idx;",
      ""
    );
  }

  const tables = ["public.users", "public.subscriptions", "public.wallets", "public.credit_transactions"];
  const rlsMissing = [];
  for (const tbl of tables) {
    const shortName = tbl.split(".")[1];
    const rlsRe = new RegExp(
      "\\bALTER\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?(?:ONLY\\s+)?(?:\"?public\"?\\s*\\.\\s*)?\"?" +
        shortName +
        "\"?\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY\\b",
      "i"
    );
    const polRe = new RegExp(
      "\\bCREATE\\s+POLICY\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(?:\"(?:[^\"]|\"\")+\"|[a-zA-Z0-9_]+)\\s+ON\\s+(?:\"?public\"?\\s*\\.\\s*)?\"?" +
        shortName +
        "\"?(?=\\s|$)",
      "i"
    );
    const hasRls = statements.some((stmt) => rlsRe.test(stmt));
    const hasPol = statements.some((stmt) => polRe.test(stmt));
    if (!hasRls || !hasPol) rlsMissing.push(tbl);
  }
  if (rlsMissing.length > 0) {
    findings.push({
      sev: "HIGH",
      title: "Row-Level Security missing on billing tables",
      code: "CHECK 3 · MISSING_RLS_OR_POLICY",
      table: rlsMissing.join(", "),
      line: lineOfPattern(cleanSql, /CREATE\s+TABLE/i),
      msg: "Row-Level Security (ENABLE ROW LEVEL SECURITY + CREATE POLICY) is missing on " + rlsMissing.length + " billing table(s), exposing records to PostgREST / anon key queries.",
      diffRemove: "- -- No ENABLE ROW LEVEL SECURITY / CREATE POLICY statements",
      diffAdd: "+ ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY; CREATE POLICY wallets_isolation ON public.wallets FOR SELECT USING (auth.uid() = user_id);"
    });
    patchLines.push("-- 3. Enable Row-Level Security (RLS) on exposed billing tables:");
    for (const tbl of rlsMissing) {
      patchLines.push("ALTER TABLE " + tbl + " ENABLE ROW LEVEL SECURITY;");
    }
    patchLines.push("");
  }

  const policyHeaderRe =
    /\bCREATE\s+POLICY\s+(?:IF\s+NOT\s+EXISTS\s+)?("(?:[^"]|"")+"|[a-zA-Z0-9_]+)\s+ON\s+((?:"?[a-zA-Z0-9_]+"?\s*\.\s*)?"?[a-zA-Z0-9_]+"?)/gi;
  const badPolicies = [];
  for (const stmt of statements) {
    policyHeaderRe.lastIndex = 0;
    const headers = [];
    let hm;
    while ((hm = policyHeaderRe.exec(stmt)) !== null) {
      headers.push({
        polName: hm[1],
        polTable: hm[2],
        bodyStart: hm.index + hm[0].length,
        headerStart: hm.index
      });
    }
    for (let idx = 0; idx < headers.length; idx++) {
      const h = headers[idx];
      const bodyEnd = idx + 1 < headers.length ? headers[idx + 1].headerStart : stmt.length;
      const clauseSlice = stmt.slice(h.bodyStart, bodyEnd);
      const clauseKwRe = /\b(?:USING|WITH\s+CHECK)\b/gi;
      let km;
      let flagged = false;
      while ((km = clauseKwRe.exec(clauseSlice)) !== null) {
        const extracted = extractBalancedParen(clauseSlice, km.index + km[0].length);
        if (extracted && isPermissivePolicyExpr(extracted.expr)) {
          flagged = true;
          break;
        }
      }
      if (flagged) {
        badPolicies.push(h.polTable + " (" + h.polName + ")");
      }
    }
  }
  if (badPolicies.length > 0) {
    findings.push({
      sev: "CRITICAL",
      title: "Permissive RLS policy allows cross-tenant access",
      code: "CHECK 4 · RLS_PERMISSIVE_NO_TENANT_FILTER",
      table: badPolicies.join(", "),
      line: lineOfPattern(cleanSql, /(?:USING|WITH\s+CHECK)\s*\(\s*\(*\s*true\b|auth\.role\s*\(/i),
      msg: "Permissive RLS policy allows cross-tenant reads/writes (USING (true) / WITH CHECK (true) or auth.role() = 'authenticated' without auth.uid() / auth.jwt() tenant isolation).",
      diffRemove: "- CREATE POLICY wallets_open_read ON public.wallets FOR SELECT USING (true);",
      diffAdd: "+ CREATE POLICY wallets_isolation ON public.wallets FOR SELECT USING (auth.uid() = user_id);"
    });
    patchLines.push(
      "-- 4. Replace permissive RLS policies with strict auth.uid() tenant isolation:",
      "-- DROP POLICY <policy_name> ON <table>; CREATE POLICY tenant_isolation ON <table> USING (auth.uid() = user_id);",
      ""
    );
  }

  const hasSecDef = statements.some((stmt) => /\bSECURITY\s+DEFINER\b/i.test(stmt));
  if (hasSecDef) {
    const hasSearchPath = statements.some((stmt) => /\bSET\s+search_path\s*=/i.test(stmt));
    const fnIdx = cleanSql.search(/\bFUNCTION\b/i);
    const hasAuthUidInFn = fnIdx !== -1 && /\bauth\.uid\s*\(/i.test(cleanSql.slice(fnIdx));
    const hasRevokePublic = statements.some((stmt) =>
      /\bREVOKE\s+(?:EXECUTE|ALL(?:\s+PRIVILEGES)?)\s+ON\s+FUNCTION\b/i.test(stmt) &&
      /\bFROM\s+[^;]*?\bPUBLIC\b/i.test(stmt)
    );
    if (!hasSearchPath || (!hasAuthUidInFn && !hasRevokePublic)) {
      findings.push({
        sev: "CRITICAL",
        title: "Unpinned SECURITY DEFINER RPC allows privilege escalation",
        code: "CHECK 5 · SECURITY_DEFINER_WITHOUT_AUTH_OR_SEARCH_PATH",
        table: "SECURITY DEFINER RPC",
        line: lineOfPattern(cleanSql, /SECURITY\s+DEFINER/i),
        msg: "SECURITY DEFINER function bypasses RLS without SET search_path = public, pg_temp or explicit auth.uid() / REVOKE EXECUTE FROM PUBLIC caller isolation (privilege escalation / IDOR risk).",
        diffRemove: "- RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$",
        diffAdd: "+ RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$ -- + IF auth.uid() IS DISTINCT FROM target_user_id THEN RAISE EXCEPTION 'forbidden'; END IF;"
      });
      patchLines.push(
        "-- 5. Pin search_path and enforce auth.uid() or REVOKE FROM PUBLIC on SECURITY DEFINER RPCs:",
        "-- ALTER FUNCTION public.<fn_name> SET search_path = public, pg_temp;",
        ""
      );
    }
  }

  let patchOutputText = "";
  if (findings.length === 0) {
    patchOutputText =
      "-- All Group A schema invariants (CHECK >= 0, UNIQUE(stripe_event_id), and RLS policies) are present.\n-- No SQL remediation patch required.";
  } else if (!isProLicenseUnlocked) {
    patchOutputText = [
      "-- Billing Watchdog Diagnostic Summary: " + findings.length + " Schema/RLS Vulnerability(s) Detected",
      "-- Affected Objects: " + findings.map((f) => f.table).join(" | "),
      "--",
      "-- [REDACTED IN FREE DIAGNOSTIC MODE]",
      "-- Enter your BWV2-... Pro/Lifetime License Key above (or purchase Pro $49/mo / Lifetime $149 below)",
      "-- to unlock the zero-downtime NOT VALID + VALIDATE CONSTRAINT + CREATE UNIQUE INDEX CONCURRENTLY remediation script."
    ].join("\n");
  } else {
    patchOutputText = patchLines.join("\n").trimEnd();
  }

  if (!isReactMounted()) {
    const container = getElSafe("findings-container");
    const patchEl = getElSafe("patch-output");
    if (container) {
      if (findings.length === 0) {
        container.innerHTML = '<div class="finding-ok">0 Schema or RLS Vulnerabilities Found — All Group A Database Invariants Passed</div>';
      } else {
        container.innerHTML = findings
          .map(
            (f) =>
              '<div class="finding">' +
              '<div class="finding-head"><span class="sev ' +
              (f.sev === "HIGH" ? "sev-high" : "") +
              '">' +
              escapeHtmlSafe(f.sev) +
              "</span><strong>" +
              escapeHtmlSafe(f.code) +
              '</strong> <span class="finding-table">(' +
              escapeHtmlSafe(f.table) +
              ")</span></div>" +
              '<div class="finding-msg">' +
              escapeHtmlSafe(f.msg) +
              "</div>" +
              '<div class="code-diff">' +
              '<div class="diff-del">' +
              escapeHtmlSafe(f.diffRemove) +
              "</div>" +
              '<div class="diff-add">' +
              escapeHtmlSafe(f.diffAdd) +
              "</div>" +
              "</div>" +
              "</div>"
          )
          .join("");
      }
    }
    if (patchEl) patchEl.value = patchOutputText;
  }

  const tEnd = typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : 0;
  const lintMs = Math.max(1, Math.round(tEnd - tStart));
  commitState((next) => {
    next.linter = {
      activePreset: presetOverride !== undefined ? presetOverride : next.linter.activePreset,
      sqlInput: sql,
      isCodeMode: false,
      findings,
      patchOutput: patchOutputText,
      lintMs
    };
  });
}

function copyPatch() {
  if (!isProLicenseUnlocked) {
    const msg = "Pro / Lifetime License Required to copy production SQL remediation patch.";
    const html = 'Status: <strong class="status-warn">' + msg + "</strong>";
    commitState((next) => {
      next.licenseStatusKind = "warn";
      next.licenseStatusText = msg;
      next.licenseStatusHtml = html;
      next.polarNotice = null;
      next.licenseDrawerOpen = true;
    });
    updateLicenseDom(html, "PRO LICENSE REQUIRED", false);
    return false;
  }
  const el = !isReactMounted() ? getElSafe("patch-output") : null;
  const textToCopy = el && el.value ? el.value : __state.linter.patchOutput;
  if (el && typeof el.select === "function") el.select();
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    navigator.clipboard.writeText(textToCopy);
  }
  return true;
}

function downloadPatch() {
  if (!isProLicenseUnlocked) {
    const msg = "Pro / Lifetime License Required to download remediation.sql.";
    const html = 'Status: <strong class="status-warn">' + msg + "</strong>";
    commitState((next) => {
      next.licenseStatusKind = "warn";
      next.licenseStatusText = msg;
      next.licenseStatusHtml = html;
      next.polarNotice = null;
      next.licenseDrawerOpen = true;
    });
    updateLicenseDom(html, "PRO LICENSE REQUIRED", false);
    return false;
  }
  const el = !isReactMounted() ? getElSafe("patch-output") : null;
  const content = el && el.value ? el.value : __state.linter.patchOutput;
  const blob = new Blob([content], { type: "application/sql;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "billing-watchdog-remediation.sql";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

function toggleGroupBDemo() {
  const reportText = [
    "# Billing Integrity & Reconciliation Diagnostic Report (Demo Fixture Run)",
    "Generated At (UTC): 2026-11-01T10:00:00.000Z",
    "PostgreSQL Transaction Snapshot: BEGIN ISOLATION LEVEL REPEATABLE READ, READ ONLY (VERIFIED)",
    "Monetary Arithmetic: INTEGER Cents Only (Zero FLOAT/REAL)",
    "",
    "## Group B: Stripe <-> Postgres Entitlement & Credit Ledger Drift",
    "",
    "1. [CRITICAL] CHECK 4 · ZOMBIE_SUBSCRIPTION (Entity: user_id=usr_zombie_1 / sub_zombie_01)",
    "   - DB Status: 'active' | Live Stripe Status: 'canceled'",
    "   - Impact: User is consuming paid compute/credits for free after subscription cancellation.",
    "   - Circuit-Breaker Action: QUARANTINE (is_billing_quarantined: false -> true, exposure=2900 cents)",
    "",
    "2. [CRITICAL] CHECK 5 · DUPLICATE_WEBHOOK_CREDIT_GRANT (Entity: stripe_event_id=evt_dup_99)",
    "   - Invoice: in_starter_29 ($29.00 = 2900 integer cents)",
    "   - Ledger Rows Found: 2 (tx_1: +1000 credits, tx_2: +1000 credits)",
    "   - Impact: Parallel Stripe webhook retry double-granted +1,000 extra credits.",
    "",
    "3. [CRITICAL] CHECK 6 · CREDIT_CONSERVATION_VIOLATION (Entity: user_id=usr_replay_2)",
    "   - Formula: ExpectedMax (850) = FreeSignup (50) + PaidInvoices (1000) - Consumed (200)",
    "   - Actual Wallet Balance in DB: 1850 credits (+1,000 unbacked credit leakage detected).",
    "   - Circuit-Breaker Action: QUARANTINE (is_billing_quarantined: false -> true, exposure=3000 cents)"
  ].join("\n");

  const structuredChecks = [
    {
      id: "CHECK 4",
      code: "ZOMBIE_SUBSCRIPTION",
      title: "Active DB access on canceled subscription",
      entity: "usr_zombie_1 / sub_zombie_01",
      dbState: "status = 'active'",
      stripeTruth: "status = 'canceled'",
      variance: "Unpaid compute burn active",
      action: "Quarantine ($29.00 / 2,900c)",
      exposureCents: 2900
    },
    {
      id: "CHECK 5",
      code: "DUPLICATE_WEBHOOK_CREDIT_GRANT",
      title: "Duplicate credit grant on webhook retry",
      entity: "stripe_event_id = evt_dup_99 · in_starter_29",
      dbState: "2 ledger rows (tx_1: +1,000 cr, tx_2: +1,000 cr)",
      stripeTruth: "1 paid invoice ($29.00 / 2,900c)",
      variance: "+1,000 extra credits",
      action: "Enforce UNIQUE(stripe_event_id)",
      exposureCents: 2900
    },
    {
      id: "CHECK 6",
      code: "CREDIT_CONSERVATION_VIOLATION",
      title: "Wallet balance breaks conservation formula",
      entity: "usr_replay_2",
      dbState: "Actual DB wallet = 1,850 credits",
      stripeTruth: "50 Free + 1,000 Paid - 200 Used = 850 max",
      variance: "+1,000 unbacked credits",
      action: "Quarantine ($30.00 / 3,000c)",
      exposureCents: 3000,
      conservation: { free: 50, paid: 1000, used: 200, expectedMax: 850, actual: 1850, delta: 1000 }
    }
  ];

  if (!isReactMounted()) {
    const el = getElSafe("group-b-report");
    if (el) el.textContent = reportText;
  }

  commitState((next) => {
    next.reconciler = {
      rawReport: reportText,
      checks: structuredChecks
    };
  });
}

// Polar.sh Merchant-of-Record Instant Delivery Links (EU VAT / US Tax + GitHub Repo Invite + BWV2E Key)
// Keyed strictly by INTEGER cents (4900 = PRO_MONTHLY, 14900 = LIFETIME_TEAM; zero FLOAT/REAL).
const POLAR_CHECKOUT_URLS = {
  4900: "",
  14900: ""
};
if (typeof window !== "undefined") {
  window.POLAR_CHECKOUT_URLS = POLAR_CHECKOUT_URLS;
}

function startPolarCheckout(itemName, amountCents) {
  if (typeof amountCents !== "number" || !Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new Error("NonIntegerMoneyError: amountCents must be a positive safe integer in minor units.");
  }
  const configuredMoRUrl = Object.prototype.hasOwnProperty.call(POLAR_CHECKOUT_URLS, amountCents)
    ? POLAR_CHECKOUT_URLS[amountCents]
    : "";
  if (typeof configuredMoRUrl === "string" && configuredMoRUrl.indexOf("https://buy.polar.sh/") === 0) {
    window.open(configuredMoRUrl, "_blank", "noopener,noreferrer");
    return true;
  }

  const tierCode = amountCents === 14900 ? "LIFETIME_TEAM" : "PRO_MONTHLY";
  const displayUsd = formatUsdFromIntegerCents(amountCents);
  const subject = encodeURIComponent(
    "Polar.sh MoR Checkout / Invoice Request - Billing Watchdog v2 (" + tierCode + " - " + amountCents + " cents)"
  );
  const body = encodeURIComponent(
    "Hi Mario,\n\nPlease send an instant Polar.sh Merchant-of-Record checkout link (or EU VAT / B2B invoice) for:\n" +
      "- Plan: " + itemName + " (" + tierCode + ")\n" +
      "- Amount: " + displayUsd + " USD (" + amountCents + " integer cents)\n\n" +
      "Upon settlement, please deliver our Ed25519 BWV2E-... license key and GitHub Pro repository invite.\n"
  );
  const mailtoHref = "mailto:mariostosic@prime-tech.rs?subject=" + subject + "&body=" + body;

  const statusHtml =
    '<div class="polar-notice">' +
    '<strong class="polar-notice-title">Polar.sh Merchant-of-Record Checkout (' +
    escapeHtmlSafe(itemName) +
    " — " +
    amountCents +
    " integer cents):</strong> " +
    "Live self-serve <code>buy.polar.sh</code> link is not yet published in this static build (fail-closed — zero unverified external payment redirects). " +
    '<a class="polar-notice-link" href="' +
    mailtoHref +
    '">Request instant Polar.sh MoR checkout link / VAT invoice via mariostosic@prime-tech.rs →</a>' +
    "</div>";

  commitState((next) => {
    next.licenseDrawerOpen = true;
    next.licenseStatusKind = "warn";
    next.licenseStatusText =
      "Polar.sh Merchant-of-Record Checkout (" + itemName + " — " + amountCents + " integer cents): live self-serve link unpublished (fail-closed).";
    next.licenseStatusHtml = statusHtml;
    next.polarNotice = {
      itemName,
      amountCents,
      displayUsd,
      tierCode,
      mailtoHref
    };
  });

  if (!isReactMounted()) {
    const statusEl = getElSafe("license-status-msg");
    if (statusEl) {
      statusEl.innerHTML = statusHtml;
      if (typeof statusEl.scrollIntoView === "function") {
        statusEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }
  return false;
}

if (typeof window !== "undefined") {
  window.__WATCHDOG_KERNEL__ = {
    getState: () => __state,
    subscribe: (listener) => {
      __kernelListeners.add(listener);
      return () => {
        __kernelListeners.delete(listener);
      };
    },
    runChaosSimulation,
    setChaosParams: (partial) => {
      const p = partial && typeof partial === "object" ? partial : {};
      const merged = {
        planPriceCents:
          p.planPriceCents !== undefined
            ? sanitizePositiveSafeInt(p.planPriceCents, __state.chaos.planPriceCents, 1, 100000000)
            : __state.chaos.planPriceCents,
        planCredits:
          p.planCredits !== undefined
            ? sanitizePositiveSafeInt(p.planCredits, __state.chaos.planCredits, 1, 100000000)
            : __state.chaos.planCredits,
        monthlySubs:
          p.monthlySubs !== undefined
            ? sanitizeClampedSubsInt(p.monthlySubs, __state.chaos.monthlySubs)
            : __state.chaos.monthlySubs,
        quarantineThresholdCents:
          p.quarantineThresholdCents !== undefined
            ? sanitizePositiveSafeInt(
                p.quarantineThresholdCents,
                __state.chaos.quarantineThresholdCents,
                1,
                100000000
              )
            : __state.chaos.quarantineThresholdCents
      };
      runChaosSimulation(__state.chaos.filter, merged);
    },
    loadSampleSql,
    setSqlInput: (sqlText) => {
      commitState((next) => {
        next.linter = Object.assign({}, next.linter, {
          activePreset: "custom",
          sqlInput: sqlText
        });
      });
      runSqlLinter(sqlText, "custom");
    },
    runSqlLinter,
    unlockProPortal,
    verifyEd25519LicenseInBrowser,
    startPolarCheckout,
    setLicenseDrawerOpen: (open) => {
      commitState((next) => {
        next.licenseDrawerOpen = Boolean(open);
      });
    },
    setLicenseKeyDraft: (draft) => {
      commitState((next) => {
        next.licenseKeyDraft = draft;
      });
    },
    copyPatch,
    downloadPatch,
    copyQuarantineSql,
    toggleGroupBDemo
  };
}

runChaosSimulation("ALL");
loadSampleSql("vulnerable");
toggleGroupBDemo();

if (typeof window !== "undefined" && window.location && window.location.search) {
  try {
    const params = new URLSearchParams(window.location.search);
    const licenseParam = params.get("license");
    const checkoutState = params.get("checkout");
    const provider = params.get("provider");

    if (licenseParam && licenseParam.indexOf("BWV2E-") === 0) {
      const inputEl = getElSafe("license-key-input");
      if (inputEl) inputEl.value = licenseParam;
      commitState((next) => {
        next.licenseKeyDraft = licenseParam;
        next.licenseDrawerOpen = true;
      });
      if (window.history && typeof window.history.replaceState === "function") {
        params.delete("license");
        const cleanQuery = params.toString();
        window.history.replaceState(
          {},
          "",
          window.location.pathname + (cleanQuery ? "?" + cleanQuery : "") + (window.location.hash || "")
        );
      }
      verifyEd25519LicenseInBrowser(licenseParam);
    } else if (checkoutState === "success") {
      const statusHtml =
        provider === "polar"
          ? 'Status: <strong class="status-ok">Polar.sh Checkout Completed. Check your inbox for your instant <code>BWV2E-...</code> Ed25519 License Key, <code>billing-watchdog-pro-v2.zip</code> download, and GitHub private repo invite.</strong>'
          : 'Status: <strong class="status-ok">Checkout Completed. Send your receipt email to <a href="mailto:mariostosic@prime-tech.rs?subject=Billing%20Watchdog%20v2%20License%20Key%20Delivery">mariostosic@prime-tech.rs</a> to receive your BWV2E-... License Key &amp; Pro ZIP immediately.</strong>';
      commitState((next) => {
        next.licenseDrawerOpen = true;
        next.licenseStatusKind = "ok";
        next.licenseStatusText =
          provider === "polar"
            ? "Polar.sh Checkout Completed. Check your inbox for your instant BWV2E-... Ed25519 License Key."
            : "Checkout Completed. Send your receipt email to mariostosic@prime-tech.rs.";
        next.licenseStatusHtml = statusHtml;
      });
      updateLicenseDom(statusHtml, "", false);
    }
  } catch (_urlErr) {
    // Ignore non-standard URL environments in embedded sandboxes
  }
}
