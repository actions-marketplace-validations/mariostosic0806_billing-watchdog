import { useState } from "react";
import { ArrowLeftRight, Check, Copy, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { getKernel, type WatchdogKernelState } from "@/lib/kernel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  const { reconciler } = state;
  const [bayMode, setBayMode] = useState<"report" | "bypassrls">("report");
  const [copiedRole, setCopiedRole] = useState(false);

  const handleCopyRole = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(BYPASSRLS_ROLE_SQL);
      setCopiedRole(true);
      setTimeout(() => setCopiedRole(false), 1800);
    }
  };

  return (
    <div className="border-t border-[#DDD8CE] bg-[#FCFBF8]">
      {/* Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDD8CE] px-3.5 sm:px-5 py-3.5">
        <div>
          <h2 className="text-[15.5px] font-semibold tracking-tight text-[#141413]">
            Read-Only Stripe ⇄ Postgres Snapshot Drift Reconciler (Checks 4, 5 &amp; 6)
          </h2>
          <p className="text-[13px] text-[#47453F]">
            Previews <code className="font-mono text-[12px] text-[#141413]">node src/cli.ts scan --config reconcile.config.json</code> inside a single deterministic snapshot.
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

              <h3 className="text-[14px] font-semibold text-[#141413]">{chk.title}</h3>
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
