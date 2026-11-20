import { useRef, useState, type DragEvent } from "react";
import { ArrowLeftRight, Check, Copy, FileSpreadsheet, Play, RotateCcw, ShieldCheck, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatUsdCents, getKernel, type WatchdogKernelState } from "@/lib/kernel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VaultLockCurtain } from "@/components/instruments/VaultLockCurtain";

interface DriftReconcilerViewProps {
  state: WatchdogKernelState;
}

const BYPASSRLS_ROLE_SQL = [
  "-- Read-only reconciliation role with least-privilege BYPASSRLS (never runs as postgres superuser)",
  "CREATE ROLE watchdog_reconciler WITH LOGIN PASSWORD 'replace-with-kms-secret' BYPASSRLS;",
  "GRANT USAGE ON SCHEMA public TO watchdog_reconciler;",
  "GRANT SELECT ON public.users, public.subscriptions, public.wallets, public.credit_transactions TO watchdog_reconciler;",
  "REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM watchdog_reconciler;",
].join("\n");

export function DriftReconcilerView({ state }: DriftReconcilerViewProps) {
  const kernel = getKernel();
  const { reconciler, isProLicenseUnlocked } = state;
  const diff = reconciler.diff;

  const [stripeDraft, setStripeDraft] = useState<string>(() => diff?.stripeInput ?? "");
  const [dbDraft, setDbDraft] = useState<string>(() => diff?.dbInput ?? "");
  const [bayMode, setBayMode] = useState<"report" | "bypassrls">("report");
  const [copiedRole, setCopiedRole] = useState(false);
  const [copiedDiffSql, setCopiedDiffSql] = useState(false);

  const stripeFileRef = useRef<HTMLInputElement | null>(null);
  const dbFileRef = useRef<HTMLInputElement | null>(null);

  const handleFileLoad = async (file: File | undefined, side: "stripe" | "db") => {
    if (!file) return;
    const text = await file.text();
    if (side === "stripe") {
      setStripeDraft(text);
      kernel.runSubscriptionDiffReconciler(text, dbDraft);
    } else {
      setDbDraft(text);
      kernel.runSubscriptionDiffReconciler(stripeDraft, text);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, side: "stripe" | "db") => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    void handleFileLoad(file, side);
  };

  const handleLoadIncidentSample = () => {
    const sampleRes = kernel.loadSampleZombieDiff();
    setStripeDraft(sampleRes.stripeInput);
    setDbDraft(sampleRes.dbInput);
  };

  const handleCopyDiffSql = () => {
    const ok = kernel.copyDiffSql();
    if (ok) {
      setCopiedDiffSql(true);
      setTimeout(() => setCopiedDiffSql(false), 1800);
    }
  };

  const handleCopyRole = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(BYPASSRLS_ROLE_SQL);
      setCopiedRole(true);
      setTimeout(() => setCopiedRole(false), 1800);
    }
  };

  const actionableDiffCount = (diff?.zombieCount ?? 0) + (diff?.missingInStripeCount ?? 0);

  return (
    <div className="border-t border-[#DDD8CE] bg-[#FCFBF8]">
      {/* Live Emergency CSV / JSON Subscription Diff Dropzone (P15 · 0 Bytes Uploaded) */}
      <div className="border-b border-[#DDD8CE] bg-[#FCFBF8]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDD8CE] bg-[#F4F2EC]/70 px-3.5 sm:px-5 py-3.5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15.5px] font-semibold tracking-tight text-[#141413]">
                Emergency CSV / JSON Zombie Subscription Diff Inspector
              </h2>
              <span className="inline-flex items-center gap-1 rounded-[2px] border border-[#AEDCC9] bg-[#EDF7F3] px-2 py-0.5 font-mono text-[10.5px] font-medium text-[#095E49]">
                <ShieldCheck className="h-3 w-3 text-[#0D7A5F]" strokeWidth={1.75} />
                <span>0 bytes uploaded · In-browser RAM</span>
              </span>
            </div>
            <p className="mt-0.5 text-[13px] text-[#47453F]">
              Drop or paste your Stripe <code className="font-mono text-[12px]">subscriptions</code> export and Postgres <code className="font-mono text-[12px]">public.subscriptions</code> export to compute exact integer-cent zombie bleed and Dry-Run cut-off SQL in under 60 seconds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleLoadIncidentSample}>
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>Load $99/mo Incident Sample</span>
            </Button>
            <Button
              size="sm"
              onClick={() => kernel.runSubscriptionDiffReconciler(stripeDraft, dbDraft)}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>Reconcile CSV / JSON</span>
            </Button>
          </div>
        </div>

        {/* Two-Column CSV / JSON Dropzones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-[#DDD8CE] divide-y lg:divide-y-0 lg:divide-x divide-[#DDD8CE]">
          {/* Stripe Export Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, "stripe")}
            className="p-3.5 sm:p-4 bg-[#FCFBF8] min-w-0"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <label htmlFor="stripe-subs-input" className="text-[13px] font-semibold text-[#141413]">
                  1. Stripe Subscriptions (CSV or JSON)
                </label>
                <div className="font-mono text-[10.5px] text-[#68645B]">
                  Columns: id, customer, status, unit_amount (integer cents)
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-[#5C5850] tabular-nums">
                  {diff?.stripeRowsCount ?? 0} rows
                </span>
                <input
                  ref={stripeFileRef}
                  type="file"
                  accept=".csv,.json,text/csv,application/json"
                  className="hidden"
                  onChange={(e) => void handleFileLoad(e.target.files?.[0], "stripe")}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-[11.5px]"
                  onClick={() => stripeFileRef.current?.click()}
                >
                  <Upload className="h-3 w-3" strokeWidth={1.75} />
                  <span>Drop / Load File</span>
                </Button>
              </div>
            </div>
            <textarea
              id="stripe-subs-input"
              value={stripeDraft}
              onChange={(e) => {
                const next = e.target.value;
                setStripeDraft(next);
                kernel.runSubscriptionDiffReconciler(next, dbDraft);
              }}
              rows={6}
              spellCheck={false}
              className="w-full rounded-[3px] border border-[#C5BEB1] bg-[#121311] p-2.5 font-mono text-[11.5px] leading-[1.5] text-[#EAE8E1] outline-none bay-scroll"
            />
          </div>

          {/* Database Export Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, "db")}
            className="p-3.5 sm:p-4 bg-[#FCFBF8] min-w-0"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <label htmlFor="db-subs-input" className="text-[13px] font-semibold text-[#141413]">
                  2. Postgres / Supabase Subscriptions (CSV or JSON)
                </label>
                <div className="font-mono text-[10.5px] text-[#68645B]">
                  Columns: stripe_subscription_id (or id), user_id / org_id, status
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-[#5C5850] tabular-nums">
                  {diff?.dbRowsCount ?? 0} rows
                </span>
                <input
                  ref={dbFileRef}
                  type="file"
                  accept=".csv,.json,text/csv,application/json"
                  className="hidden"
                  onChange={(e) => void handleFileLoad(e.target.files?.[0], "db")}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-[11.5px]"
                  onClick={() => dbFileRef.current?.click()}
                >
                  <Upload className="h-3 w-3" strokeWidth={1.75} />
                  <span>Drop / Load File</span>
                </Button>
              </div>
            </div>
            <textarea
              id="db-subs-input"
              value={dbDraft}
              onChange={(e) => {
                const next = e.target.value;
                setDbDraft(next);
                kernel.runSubscriptionDiffReconciler(stripeDraft, next);
              }}
              rows={6}
              spellCheck={false}
              className="w-full rounded-[3px] border border-[#C5BEB1] bg-[#121311] p-2.5 font-mono text-[11.5px] leading-[1.5] text-[#EAE8E1] outline-none bay-scroll"
            />
          </div>
        </div>

        {/* 4-Cell Measured Zombie Bleed Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-[#DDD8CE] bg-[#EAE6DD]/65 divide-x divide-y lg:divide-y-0 divide-[#DDD8CE]">
          <div className="px-3.5 py-2.5">
            <div className="text-[11px] text-[#5C5850]">Zombie subscriptions</div>
            <div className="mt-0.5 font-mono text-[15px] font-semibold text-[#A42216] tabular-nums">
              {diff?.zombieCount ?? 0} active on canceled
            </div>
          </div>
          <div className="px-3.5 py-2.5">
            <div className="text-[11px] text-[#5C5850]">Missing in Stripe (404)</div>
            <div className="mt-0.5 font-mono text-[15px] font-semibold text-[#A42216] tabular-nums">
              {diff?.missingInStripeCount ?? 0} orphaned active
            </div>
          </div>
          <div className="px-3.5 py-2.5">
            <div className="text-[11px] text-[#5C5850]">Past-due grace window</div>
            <div className="mt-0.5 font-mono text-[15px] font-semibold text-[#8F5100] tabular-nums">
              {diff?.pastDueGraceCount ?? 0} in retry grace
            </div>
          </div>
          <div className="px-3.5 py-2.5">
            <div className="text-[11px] text-[#5C5850]">Monthly zombie bleed</div>
            <div className="mt-0.5 font-mono text-[15px] font-semibold text-[#A42216] tabular-nums">
              {formatUsdCents(diff?.totalMonthlyBleedCents ?? 0)}/mo{" "}
              <span className="text-[11px] font-normal text-[#5C5850]">
                ({(diff?.totalMonthlyBleedCents ?? 0).toLocaleString("en-US")}c)
              </span>
            </div>
          </div>
        </div>

        {/* Detected Drift Rows Ledger */}
        {diff?.parseError ? (
          <div className="p-3.5 bg-[#FDF2F0] text-[#A42216] font-mono text-[12px] border-b border-[#DDD8CE]">
            Parse error: {diff.parseError}
          </div>
        ) : diff && diff.rows.length > 0 ? (
          <div className="border-b border-[#DDD8CE] overflow-x-auto sheet-scroll">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-[#DDD8CE] bg-[#F4F2EC] text-[#5C5850] font-medium">
                  <th className="py-2 px-3.5">Finding</th>
                  <th className="py-2 px-3.5">Subscription &amp; Owner</th>
                  <th className="py-2 px-3.5">Postgres → Stripe Truth</th>
                  <th className="py-2 px-3.5 text-right">Monthly Exposure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD8CE] font-mono">
                {diff.rows.map((r) => (
                  <tr key={`${r.subId}-${r.ownerId}`} className="bg-[#FCFBF8]">
                    <td className="py-2 px-3.5 whitespace-nowrap">
                      <Badge variant={r.classification === "PAST_DUE_GRACE" ? "warn" : "leak"}>
                        {r.classification === "ZOMBIE_SUBSCRIPTION"
                          ? "Zombie active"
                          : r.classification === "MISSING_IN_STRIPE"
                            ? "Missing in Stripe"
                            : "Past-due grace"}
                      </Badge>
                    </td>
                    <td className="py-2 px-3.5">
                      <div className="font-medium text-[#141413] break-all">{r.subId}</div>
                      <div className="text-[10.5px] text-[#68645B] break-all">{r.ownerId}</div>
                    </td>
                    <td className="py-2 px-3.5 whitespace-nowrap">
                      <span className="text-[#A42216]">{r.dbStatus}</span>
                      <span className="mx-1.5 text-[#68645B]">→</span>
                      <span className="text-[#095E49]">{r.stripeStatus}</span>
                    </td>
                    <td className="py-2 px-3.5 text-right tabular-nums whitespace-nowrap">
                      <span className={r.classification === "PAST_DUE_GRACE" ? "text-[#8F5100]" : "font-semibold text-[#A42216]"}>
                        {formatUsdCents(r.monthlyBleedCents)}/mo
                      </span>
                      <span className="ml-1 text-[10.5px] text-[#68645B]">
                        ({r.monthlyBleedCents.toLocaleString("en-US")}c)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {/* Emergency Zombie Remediation SQL Bay (Gated cleanly by Pro unlock) */}
        <div className="bg-[#121311] text-[#EAE8E1] border-b border-[#DDD8CE]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2C2F2A] bg-[#1B1D1A] px-3.5 py-2">
            <span className="font-mono text-[11.5px] font-medium text-[#EAE8E1]">
              Dry-Run Verification SELECT &amp; Zombie Cut-Off SQL (public.subscriptions)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="bay"
                size="sm"
                onClick={handleCopyDiffSql}
                className="h-6 px-2 text-[11px]"
              >
                {copiedDiffSql ? (
                  <>
                    <Check className="h-3 w-3 text-[#4CD4AE]" strokeWidth={1.75} />
                    <span>Copied Cut-Off SQL</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" strokeWidth={1.75} />
                    <span>Copy Cut-Off SQL</span>
                  </>
                )}
              </Button>
              <span
                className={cn(
                  "rounded-[2px] border px-1.5 py-0.5 font-mono text-[10px] shrink-0",
                  isProLicenseUnlocked
                    ? "border-[#1F4E42] bg-[#0F241D] text-[#4CD4AE]"
                    : "border-[#493818] bg-[#241E11] text-[#F2B441]"
                )}
              >
                {isProLicenseUnlocked ? "PRO UNLOCKED" : "PRO LICENSE REQUIRED"}
              </span>
            </div>
          </div>

          <pre className="m-0 max-h-[210px] overflow-auto bay-scroll p-3.5 font-mono text-[11.5px] leading-[1.55] text-[#D7D4CB] whitespace-pre-wrap break-words">
            {diff?.remediationSql ?? ""}
          </pre>

          {!isProLicenseUnlocked && actionableDiffCount > 0 && (
            <VaultLockCurtain
              diagnosticSummary={`${actionableDiffCount} active zombie/orphaned subscription(s) (${formatUsdCents(diff?.totalMonthlyBleedCents ?? 0)}/mo bleed)`}
              onUnlockClick={() => kernel.setLicenseDrawerOpen(true)}
            />
          )}
        </div>
      </div>

      {/* CLI 6-Check Snapshot Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDD8CE] px-3.5 sm:px-5 py-3.5">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-[#141413]">
            Automated CLI Snapshot Reconciler Preview (Checks 4, 5 &amp; 6)
          </h3>
          <p className="text-[13px] text-[#47453F]">
            Previews <code className="font-mono text-[12px] text-[#141413]">billing-watchdog scan --config reconcile.config.json</code> inside a single deterministic <code className="font-mono text-[12px]">REPEATABLE READ</code> snapshot.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => kernel.toggleGroupBDemo()}>
          <Play className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span>Run 6-Check Snapshot Demo</span>
        </Button>
      </div>

      {/* 4-Cell Hairline Isolation Proof Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-[#DDD8CE] bg-[#EAE6DD]/65 divide-y sm:divide-y-0 sm:divide-x divide-[#DDD8CE]">
        <div className="px-4 py-2.5">
          <div className="text-[11px] text-[#5C5850]">Transaction isolation</div>
          <div className="font-mono text-[12px] font-medium text-[#141413]">
            REPEATABLE READ, READ ONLY
          </div>
        </div>
        <div className="px-4 py-2.5">
          <div className="text-[11px] text-[#5C5850]">Session RLS override</div>
          <div className="font-mono text-[12px] font-medium text-[#141413]">
            SET LOCAL row_security = off
          </div>
        </div>
        <div className="px-4 py-2.5">
          <div className="text-[11px] text-[#5C5850]">Monetary precision</div>
          <div className="font-mono text-[12px] font-medium text-[#141413]">
            INTEGER cents only (0 float)
          </div>
        </div>
        <div className="px-4 py-2.5">
          <div className="text-[11px] text-[#5C5850]">Deterministic clock</div>
          <div className="font-mono text-[12px] font-medium text-[#141413] tabular-nums">
            UTC 2026-11-01T10:00:00.000Z
          </div>
        </div>
      </div>

      {/* 3 Structured Drift Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 border-b border-[#DDD8CE] divide-y lg:divide-y-0 lg:divide-x divide-[#DDD8CE]">
        {reconciler.checks.map((chk) => (
          <div key={chk.id} className="p-4 flex flex-col justify-between gap-3 bg-[#FCFBF8]">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <Badge variant="leak">{chk.id}</Badge>
                <span className="font-mono text-[10.5px] text-[#68645B] truncate">{chk.entity}</span>
              </div>

              <h4 className="text-[14px] font-semibold text-[#141413]">{chk.title}</h4>
              <div className="mt-0.5 font-mono text-[10.5px] text-[#68645B]">{chk.code}</div>

              <div className="mt-3 space-y-1.5 rounded-[3px] border border-[#DDD8CE] bg-[#F4F2EC]/70 p-2.5 font-mono text-[11.5px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#5C5850] shrink-0 whitespace-nowrap">Postgres DB:</span>
                  <span className="text-[#A42216] font-medium text-right">{chk.dbState}</span>
                </div>
                <div className="flex items-center justify-center text-[#68645B]" aria-hidden="true">
                  <ArrowLeftRight className="h-3 w-3" strokeWidth={1.6} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#5C5850] shrink-0 whitespace-nowrap">Stripe truth:</span>
                  <span className="text-[#095E49] font-medium text-right">{chk.stripeTruth}</span>
                </div>
              </div>

              {chk.conservation && (
                <div className="mt-2.5 rounded-[3px] border border-[#E9B8B2] bg-[#FDF2F0] px-2.5 py-2 font-mono text-[11px] text-[#A42216] tabular-nums">
                  ({chk.conservation.free} + {chk.conservation.paid.toLocaleString("en-US")}) − {chk.conservation.used} ={" "}
                  <strong>{chk.conservation.expectedMax} max</strong> vs{" "}
                  <strong>{chk.conservation.actual.toLocaleString("en-US")} actual</strong> (+
                  {chk.conservation.delta.toLocaleString("en-US")} unbacked)
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-[#DDD8CE] pt-2.5 font-mono text-[11px]">
              <span className="text-[#A42216] font-medium">{chk.variance}</span>
              <Badge variant="warn">{chk.action}</Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Switchable Obsidian Bay */}
      <div className="bg-[#121311] text-[#EAE8E1]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2C2F2A] bg-[#1B1D1A] px-3.5 py-2">
          <div className="inline-flex rounded-[3px] border border-[#2C2F2A] bg-[#121311] p-0.5 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => setBayMode("report")}
              className={cn(
                "px-2.5 py-1 rounded-[2px] cursor-pointer transition-colors",
                bayMode === "report" ? "bg-[#262925] text-[#EAE8E1]" : "text-[#8C8A82] hover:text-[#EAE8E1]"
              )}
            >
              Raw CLI Snapshot Log
            </button>
            <button
              type="button"
              onClick={() => setBayMode("bypassrls")}
              className={cn(
                "px-2.5 py-1 rounded-[2px] cursor-pointer transition-colors",
                bayMode === "bypassrls" ? "bg-[#262925] text-[#EAE8E1]" : "text-[#8C8A82] hover:text-[#EAE8E1]"
              )}
            >
              Read-Only BYPASSRLS Role SQL
            </button>
          </div>

          {bayMode === "bypassrls" ? (
            <Button variant="bay" size="sm" onClick={handleCopyRole} className="h-6 px-2 text-[11px]">
              {copiedRole ? (
                <>
                  <Check className="h-3 w-3 text-[#4CD4AE]" strokeWidth={1.75} />
                  <span>Copied SQL</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" strokeWidth={1.75} />
                  <span>Copy Role SQL</span>
                </>
              )}
            </Button>
          ) : (
            <span className="font-mono text-[10.5px] text-[#4CD4AE]">INTEGER CENTS · UTC ISO-8601</span>
          )}
        </div>

        <pre
          id="group-b-report"
          className="m-0 max-h-[290px] overflow-auto bay-scroll p-3.5 font-mono text-[11.5px] leading-[1.6] text-[#D7D4CB] whitespace-pre"
        >
          {bayMode === "report" ? reconciler.rawReport : BYPASSRLS_ROLE_SQL}
        </pre>
      </div>
    </div>
  );
}
