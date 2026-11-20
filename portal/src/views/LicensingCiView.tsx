import { useState } from "react";
import { Check, Copy, KeyRound, ShieldCheck } from "lucide-react";
import { getKernel } from "@/lib/kernel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface LicensingCiViewProps {
  onOpenAuditor: () => void;
}

const GITHUB_ACTION_YAML = [
  "# .github/workflows/billing-watchdog.yml",
  "- uses: mariostosic0806/billing-watchdog@v2.3.0",
  "  with:",
  "    command: verify-ci",
  "    sql-path: supabase/migrations/001_billing.sql",
  "    sarif-file: billing-watchdog.sarif",
  "    agent-fix-file: billing-agent-fix.md",
].join("\n");

export function LicensingCiView({ onOpenAuditor }: LicensingCiViewProps) {
  const kernel = getKernel();
  const [copiedYaml, setCopiedYaml] = useState(false);

  const handleCopyYaml = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(GITHUB_ACTION_YAML);
      setCopiedYaml(true);
      setTimeout(() => setCopiedYaml(false), 1800);
    }
  };

  return (
    <div className="border-t border-[#DDD8CE] bg-[#FCFBF8]">
      {/* 10-Second GitHub Action Quickstart Strip */}
      <div className="border-b border-[#DDD8CE] bg-[#F4F2EC]/70 p-3.5 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-[15.5px] font-semibold tracking-tight text-[#141413]">
              Self-Hosted CI Enforcement &amp; Commercial Source Licensing
            </h2>
            <p className="text-[13px] text-[#47453F]">
              Your production <code className="font-mono text-[12px]">DATABASE_URL</code> and{" "}
              <code className="font-mono text-[12px]">STRIPE_RESTRICTED_KEY</code> stay inside your own runner.
            </p>
          </div>
          <Badge variant="ok">MIT GitHub Action @v2.3.0</Badge>
        </div>

        <div className="rounded-[3px] border border-[#2C2F2A] bg-[#121311] text-[#EAE8E1] overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-[#2C2F2A] bg-[#1B1D1A] px-3.5 py-2">
            <span className="font-mono text-[11.5px] text-[#EAE8E1]">
              10-second zero-credential PR gate (.github/workflows/billing-watchdog.yml)
            </span>
            <Button variant="bay" size="sm" onClick={handleCopyYaml} className="h-6 px-2 text-[11px]">
              {copiedYaml ? (
                <>
                  <Check className="h-3 w-3 text-[#4CD4AE]" strokeWidth={1.75} />
                  <span>Copied YAML</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" strokeWidth={1.75} />
                  <span>Copy YAML</span>
                </>
              )}
            </Button>
          </div>
          <pre className="m-0 overflow-x-auto bay-scroll p-3.5 font-mono text-[12px] leading-[1.6] text-[#EAE8E1]">
            {GITHUB_ACTION_YAML}
          </pre>
        </div>
      </div>

      {/* 3 Architectural Hairline Licensing Columns (Zero bubbly SaaS cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 border-b border-[#DDD8CE] divide-y lg:divide-y-0 lg:divide-x divide-[#DDD8CE]">
        {/* Column 1: Free MIT Action */}
        <div className="flex flex-col justify-between p-5 bg-[#FCFBF8]">
          <div>
            <div className="font-mono text-[11px] font-medium text-[#5C5850]">FREE PR GATE &amp; DIAGNOSTIC</div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-[28px] font-semibold tracking-tight text-[#141413] tabular-nums">
                $0
              </span>
              <span className="text-[13px] text-[#68645B]">/ MIT action</span>
            </div>
            <p className="mt-1 text-[13px] text-[#47453F]">
              Zero-credential static audit &amp; browser leak simulator
            </p>

            <ul className="mt-4 space-y-2 border-t border-[#DDD8CE] pt-4 text-[13px] text-[#47453F]">
              <li>GitHub Action <code className="font-mono text-[12px]">@v2.3.0</code> PR annotations</li>
              <li>OASIS SARIF 2.1.0 security tab export</li>
              <li>Prompt-injection-safe <code className="font-mono text-[12px]">--agent-fix-out</code></li>
              <li>Detects missing <code className="font-mono text-[12px]">CHECK (&gt;= 0)</code> &amp; <code className="font-mono text-[12px]">UNIQUE</code></li>
              <li>Static MCP SHA-256 lockfile verification</li>
            </ul>
          </div>

          <Button variant="outline" className="mt-6 w-full" onClick={onOpenAuditor}>
            Open Offline SQL &amp; Route Auditor
          </Button>
        </div>

        {/* Column 2: Monthly Rolling Rules & 33-Day Key */}
        <div className="flex flex-col justify-between p-5 bg-[#FCFBF8]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-medium text-[#5C5850]">
                PRO MONTHLY WATCHDOG v2
              </span>
              <Badge variant="neutral">Rolling Key</Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-[28px] font-semibold tracking-tight text-[#141413] tabular-nums">
                $49
              </span>
              <span className="text-[13px] text-[#68645B]">/ month</span>
            </div>
            <p className="mt-1 text-[13px] text-[#47453F]">
              Monthly Rolling Rules &amp; 33-Day Key (<code className="font-mono text-[11.5px]">BWV2E-PRO_MONTHLY</code>)
            </p>

            <ul className="mt-4 space-y-2 border-t border-[#DDD8CE] pt-4 text-[13px] text-[#47453F]">
              <li>Unlocks full SQL &amp; Next.js remediation downloads</li>
              <li>
                Rolling CI rule updates &amp; 33-day signed <code className="font-mono text-[12px]">BWV2E</code> key
              </li>
              <li>
                Atomic PL/pgSQL <code className="font-mono text-[12px]">SELECT ... FOR UPDATE</code> engine
              </li>
              <li>
                Runaway credit circuit-breaker (<code className="font-mono text-[12px]">is_billing_quarantined</code>)
              </li>
              <li>
                Drop-in <code className="font-mono text-[12px]">executeGuardedAiStream</code> &amp; guest backfill
              </li>
            </ul>
          </div>

          <Button
            variant="outline"
            className="mt-6 w-full border-[#141413] text-[#141413]"
            onClick={() => kernel.startPolarCheckout('Pro Monthly Watchdog v2 ($49/mo)', 4900)}
          >
            Buy via Polar.sh ($49/mo)
          </Button>
        </div>

        {/* Column 3: Lifetime Team License (Featured Hero SKU) */}
        <div className="flex flex-col justify-between p-5 border-t-2 border-t-[#141413] bg-[#F4F2EC]/45">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-semibold text-[#141413]">
                LIFETIME TEAM LICENSE
              </span>
              <Badge variant="ok">Recommended · Zero Churn</Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-[28px] font-semibold tracking-tight text-[#141413] tabular-nums">
                $149
              </span>
              <span className="text-[13px] text-[#68645B]">one-time</span>
            </div>
            <p className="mt-1 text-[13px] text-[#47453F]">
              Perpetual self-hosted source + CI pack for your engineering team
            </p>

            <ul className="mt-4 space-y-2 border-t border-[#DDD8CE] pt-4 text-[13px] text-[#141413]">
              <li>
                Perpetual signed Ed25519 key (<code className="font-mono text-[12px]">BWV2E-LIFETIME_TEAM-...</code>)
              </li>
              <li>
                Full source: <code className="font-mono text-[12px]">state-machine.ts</code>,{" "}
                <code className="font-mono text-[12px]">webhook-firewall.ts</code>
              </li>
              <li>
                Zero-custody <code className="font-mono text-[12px]">REPEATABLE READ</code> Stripe ↔ Postgres reconciler
              </li>
              <li>
                Pre-flight <code className="font-mono text-[12px]">executeGuardedAiStream</code> hold &amp; SARIF/Fix MD
              </li>
              <li>CI/CD workflow templates, migrations &amp; MIT Agent Skill</li>
            </ul>
          </div>

          <Button
            className="mt-6 w-full"
            onClick={() => kernel.startPolarCheckout('Lifetime Team License v2 ($149 One-Time)', 14900)}
          >
            Buy Lifetime via Polar.sh ($149)
          </Button>
        </div>
      </div>

      {/* Hairline MoR Guarantee Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-[#DDD8CE] bg-[#EAE6DD]/65 divide-y sm:divide-y-0 sm:divide-x divide-[#DDD8CE] text-[12.5px]">
        <div className="flex items-center gap-2 px-4 py-2.5 text-[#141413]">
          <ShieldCheck className="h-4 w-4 text-[#0D7A5F] shrink-0" strokeWidth={1.75} />
          <span>30-day money-back guarantee</span>
        </div>
        <div className="px-4 py-2.5 text-[#47453F]">
          Polar.sh Merchant-of-Record (EU VAT &amp; US tax)
        </div>
        <div className="px-4 py-2.5 text-[#47453F]">
          Instant digital <code className="font-mono text-[11.5px]">BWV2E-...</code> key delivery
        </div>
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-[#47453F]">Already have a key?</span>
          <button
            type="button"
            onClick={() => kernel.setLicenseDrawerOpen(true)}
            className="inline-flex items-center gap-1 font-medium text-[#1E4E79] hover:underline cursor-pointer"
          >
            <KeyRound className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Unlock</span>
          </button>
        </div>
      </div>

      {/* Audited Package Manifest Table */}
      <div className="p-3.5 sm:p-5">
        <div className="rounded-[3px] border border-[#DDD8CE] bg-[#FCFBF8] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDD8CE] bg-[#F4F2EC] px-4 py-2.5">
            <span className="text-[13px] font-semibold text-[#141413]">
              Inside <code className="font-mono text-[12px]">billing-watchdog-pro-v2.zip</code>
            </span>
            <Badge variant="ok">6,500+ Lines · 113 / 113 Automated Tests · Zero Cloud Lock-In</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#DDD8CE] text-[12.5px]">
            <div className="divide-y divide-[#DDD8CE]">
              <div className="px-4 py-2.5">
                <code className="font-mono font-medium text-[#141413]">src/state-machine.ts</code>{" "}
                <span className="font-mono text-[11px] text-[#68645B]">(2,238 lines)</span>
                <p className="mt-0.5 text-[#47453F]">
                  Two-phase AI stream hold (<code className="font-mono text-[11.5px]">executeGuardedAiStream</code>), 7 edge-case guards &amp; audit trail export.
                </p>
              </div>
              <div className="px-4 py-2.5">
                <code className="font-mono font-medium text-[#141413]">src/watchdog.ts</code>{" "}
                <span className="font-mono text-[11px] text-[#68645B]">(1,913 lines)</span>
                <p className="mt-0.5 text-[#47453F]">
                  Read-only PostgreSQL snapshot adapter, bi-directional Stripe drift reconciler &amp; guest checkout backfill.
                </p>
              </div>
              <div className="px-4 py-2.5">
                <code className="font-mono font-medium text-[#141413]">
                  src/webhook-firewall.ts &amp; circuit-breaker.ts
                </code>
                <p className="mt-0.5 text-[#47453F]">
                  Atomic <code className="font-mono text-[11.5px]">SELECT ... FOR UPDATE</code> coordinator &amp; auto-quarantine engine.
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#DDD8CE]">
              <div className="px-4 py-2.5">
                <code className="font-mono font-medium text-[#141413]">
                  src/code-scanner.ts, sarif.ts &amp; agent-fix.ts
                </code>
                <p className="mt-0.5 text-[#47453F]">
                  Static SQL/TS scanner, OASIS SARIF 2.1.0 output &amp; prompt-injection-safe Agent Fix Packet.
                </p>
              </div>
              <div className="px-4 py-2.5">
                <code className="font-mono font-medium text-[#141413]">test/*.test.ts</code>{" "}
                <span className="font-mono text-[11px] text-[#095E49]">(113 / 113 passing)</span>
                <p className="mt-0.5 text-[#47453F]">
                  Local CI webhook idempotency &amp; concurrency suite, 20x parallel burst &amp; 50x AI stream race benchmark.
                </p>
              </div>
              <div className="px-4 py-2.5">
                <code className="font-mono font-medium text-[#141413]">action.yml &amp; examples/</code>
                <p className="mt-0.5 text-[#47453F]">
                  Ready-to-merge GitHub Actions CI/CD workflow &amp; hardened PostgreSQL migration templates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
