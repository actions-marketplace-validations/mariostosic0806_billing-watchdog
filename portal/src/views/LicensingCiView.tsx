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
  "- uses: mariostosic0806/billing-watchdog@v2.4.0",
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
          <Badge variant="ok">MIT GitHub Action @v2.4.0</Badge>
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

      {/* 4 Architectural Hairline Licensing Columns (Zero bubbly SaaS cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 border-b border-[#DDD8CE] divide-y md:divide-y-0 md:divide-x divide-[#DDD8CE]">
        {/* Column 1: Free MIT Action */}
        <div className="flex flex-col justify-between p-4 sm:p-5 bg-[#FCFBF8] md:border-b xl:border-b-0 border-[#DDD8CE]">
          <div>
            <div className="text-[12px] font-semibold text-[#5C5850]">Free PR Gate &amp; Diagnostic</div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-[26px] font-semibold tracking-tight text-[#141413] tabular-nums">
                $0
              </span>
              <span className="text-[12.5px] text-[#68645B]">/ MIT action</span>
            </div>
            <p className="mt-1 text-[12.5px] text-[#47453F]">
              Zero-credential static audit &amp; browser leak simulator
            </p>

            <ul className="mt-4 space-y-2 border-t border-[#DDD8CE] pt-4 text-[12.5px] text-[#47453F]">
              <li>GitHub Action <code className="font-mono text-[11.5px]">@v2.4.0</code> PR annotations</li>
              <li>OASIS SARIF 2.1.0 security tab export</li>
              <li>Prompt-injection-safe <code className="font-mono text-[11.5px]">--agent-fix-out</code></li>
              <li>Drizzle, Prisma, SQL &amp; Next.js route checks</li>
              <li>Fail-closed <code className="font-mono text-[11.5px]">.mcp.json</code> lockfile verification</li>
            </ul>
          </div>

          <Button variant="outline" className="mt-6 w-full" onClick={onOpenAuditor}>
            Open SQL &amp; ORM Auditor
          </Button>
        </div>

        {/* Column 2: Monthly Rolling Rules & 33-Day Key */}
        <div className="flex flex-col justify-between p-4 sm:p-5 bg-[#FCFBF8] md:border-b xl:border-b-0 border-[#DDD8CE]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-semibold text-[#5C5850]">
                Pro Monthly v2
              </span>
              <Badge variant="neutral">Rolling Key</Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-[26px] font-semibold tracking-tight text-[#141413] tabular-nums">
                $49
              </span>
              <span className="text-[12.5px] text-[#68645B]">/ month</span>
            </div>
            <p className="mt-1 text-[12.5px] text-[#47453F]">
              Monthly rolling rules &amp; 33-day key (<code className="font-mono text-[11px]">BWV2E-PRO_MONTHLY</code>)
            </p>

            <ul className="mt-4 space-y-2 border-t border-[#DDD8CE] pt-4 text-[12.5px] text-[#47453F]">
              <li>Unlocks Studio-safe SQL &amp; zombie cut-off exports</li>
              <li>
                Rolling CI rules &amp; 33-day signed <code className="font-mono text-[11.5px]">BWV2E</code> key
              </li>
              <li>
                PL/pgSQL <code className="font-mono text-[11.5px]">SELECT ... FOR UPDATE</code> hold RPCs
              </li>
              <li>
                Runaway credit circuit-breaker &amp; zombie sync
              </li>
              <li>
                Async Postgres <code className="font-mono text-[11.5px]">executeGuardedAiStreamSql</code>
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

        {/* Column 3: Lifetime Team License (Featured Single Primary Action) */}
        <div className="flex flex-col justify-between p-4 sm:p-5 border-t-2 border-t-[#141413] bg-[#F4F2EC]/45">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-semibold text-[#141413]">
                Lifetime Team License
              </span>
              <Badge variant="ok">Recommended</Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-[26px] font-semibold tracking-tight text-[#141413] tabular-nums">
                $149
              </span>
              <span className="text-[12.5px] text-[#68645B]">one-time</span>
            </div>
            <p className="mt-1 text-[12.5px] text-[#47453F]">
              Perpetual self-hosted source + CI pack for your internal team
            </p>

            <ul className="mt-4 space-y-2 border-t border-[#DDD8CE] pt-4 text-[12.5px] text-[#141413]">
              <li>
                Perpetual Ed25519 key (<code className="font-mono text-[11px]">BWV2E-LIFETIME_TEAM</code>)
              </li>
              <li>
                Full source: <code className="font-mono text-[11.5px]">state-machine.ts</code>,{" "}
                <code className="font-mono text-[11.5px]">webhook-firewall.ts</code>
              </li>
              <li>
                Multi-seat &amp; non-wallet <code className="font-mono text-[11.5px]">REPEATABLE READ</code> reconciler
              </li>
              <li>
                Live shadow-DB Cross-JWT RLS probe (<code className="font-mono text-[11.5px]">--probe-rls-url</code>)
              </li>
              <li>EU B2B VAT reverse-charge invoice via Polar.sh</li>
            </ul>
          </div>

          <Button
            className="mt-6 w-full"
            onClick={() => kernel.startPolarCheckout('Lifetime Team License v2 ($149 One-Time)', 14900)}
          >
            Buy Lifetime via Polar.sh ($149)
          </Button>
        </div>

        {/* Column 4: Agency & Client-Handover License ($299 / 29,900 integer cents) */}
        <div className="flex flex-col justify-between p-4 sm:p-5 bg-[#FCFBF8]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-semibold text-[#141413]">
                Agency &amp; Client-Handover
              </span>
              <Badge variant="warn">Unlimited MSAs</Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-[26px] font-semibold tracking-tight text-[#141413] tabular-nums">
                $299
              </span>
              <span className="text-[12.5px] text-[#68645B]">one-time</span>
            </div>
            <p className="mt-1 text-[12.5px] text-[#47453F]">
              Perpetual client-repo handover rights (<code className="font-mono text-[11px]">BWV2E-AGENCY_TEAM</code>)
            </p>

            <ul className="mt-4 space-y-2 border-t border-[#DDD8CE] pt-4 text-[12.5px] text-[#47453F]">
              <li>Everything in Lifetime Team (100% digital software)</li>
              <li>
                Embed SQL migrations, PL/pgSQL RPCs &amp; guards in unlimited client repos
              </li>
              <li>
                Royalty-free transfer of delivered repos to paid clients (Terms §3.2)
              </li>
              <li>Zero per-client license seats or recurring royalties</li>
              <li>Prohibits only standalone resale as a competing dev tool</li>
            </ul>
          </div>

          <Button
            variant="outline"
            className="mt-6 w-full border-[#141413] text-[#141413]"
            onClick={() => kernel.startPolarCheckout('Agency & Client-Handover License v2 ($299 One-Time)', 29900)}
          >
            Buy Agency License ($299)
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
            <Badge variant="ok">Self-Hosted TypeScript &amp; PL/pgSQL · Zero Cloud Lock-In</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#DDD8CE] text-[12.5px]">
            <div className="divide-y divide-[#DDD8CE]">
              <div className="px-4 py-2.5">
                <code className="font-mono font-medium text-[#141413]">src/state-machine.ts &amp; webhook-firewall.ts</code>
                <p className="mt-0.5 text-[#47453F]">
                  Native <code className="font-mono text-[11.5px]">Stripe.Event</code> parser, PL/pgSQL two-phase stream hold RPCs (<code className="font-mono text-[11.5px]">reserve_stream_credits</code>) &amp; multi-bucket conservation.
                </p>
              </div>
              <div className="px-4 py-2.5">
                <code className="font-mono font-medium text-[#141413]">src/watchdog.ts &amp; adapters.ts</code>
                <p className="mt-0.5 text-[#47453F]">
                  Read-only PostgreSQL snapshot adapter, B2B multi-seat/proration invoice math, optional non-wallet subscription mode &amp; bi-directional drift sync.
                </p>
              </div>
              <div className="px-4 py-2.5">
                <code className="font-mono font-medium text-[#141413]">
                  src/circuit-breaker.ts
                </code>
                <p className="mt-0.5 text-[#47453F]">
                  Real <code className="font-mono text-[11.5px]">unit_amount</code> exposure math, negative overdraft quarantine &amp; direct <code className="font-mono text-[11.5px]">subscriptions.status = 'canceled'</code> cut-off.
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#DDD8CE]">
              <div className="px-4 py-2.5">
                <code className="font-mono font-medium text-[#141413]">
                  src/code-scanner.ts, prooftwin-ci-gate.ts &amp; sarif.ts
                </code>
                <p className="mt-0.5 text-[#47453F]">
                  Drizzle/Prisma/FastAPI/Next.js scanner, live Cross-JWT RLS prober, fail-closed <code className="font-mono text-[11.5px]">.mcp.json</code> lockfile gate &amp; SARIF 2.1.0 output.
                </p>
              </div>
              <div className="px-4 py-2.5">
                <code className="font-mono font-medium text-[#141413]">test/*.test.ts</code>{" "}
                <span className="font-mono text-[11px] text-[#095E49]">(Deterministic Node test suite)</span>
                <p className="mt-0.5 text-[#47453F]">
                  Local CI webhook idempotency &amp; concurrency suite, 20x parallel burst, 50x AI stream race &amp; multi-tenant RLS verification.
                </p>
              </div>
              <div className="px-4 py-2.5">
                <code className="font-mono font-medium text-[#141413]">action.yml &amp; examples/</code>
                <p className="mt-0.5 text-[#47453F]">
                  Ready-to-merge GitHub Actions CI/CD workflow &amp; Supabase Studio-safe PostgreSQL migration templates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
