import { useState } from "react";
import { Check, Copy, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type EdgeFilterKey,
  formatUsdCents,
  getKernel,
  type WatchdogKernelState,
} from "@/lib/kernel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BurstOscilloscope } from "@/components/instruments/BurstOscilloscope";
import { VaultLockCurtain } from "@/components/instruments/VaultLockCurtain";

interface StormRecorderViewProps {
  state: WatchdogKernelState;
  playheadIndex: number;
  isPlaying: boolean;
  speedMode: "1x" | "instant";
  onReplay: () => void;
  onToggleSpeed: (mode: "1x" | "instant") => void;
}

export function StormRecorderView({
  state,
  playheadIndex,
  isPlaying,
  speedMode,
  onReplay,
  onToggleSpeed,
}: StormRecorderViewProps) {
  const kernel = getKernel();
  const { chaos, isProLicenseUnlocked } = state;
  const [copiedSql, setCopiedSql] = useState(false);

  const selectedEdge =
    chaos.filter === "ALL" ? null : chaos.rows.find((r) => r.key === chaos.filter) ?? null;

  const handleSelectFilter = (filter: EdgeFilterKey) => {
    kernel.runChaosSimulation(filter);
  };

  const handleCopySql = () => {
    const ok = kernel.copyQuarantineSql();
    if (ok) {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 1800);
    }
  };

  return (
    <div className="border-t border-[#DDD8CE] bg-[#FCFBF8]">
      {/* 52px Machined Parameter Well */}
      <div className="border-b border-[#DDD8CE] bg-[#EAE6DD] px-3 sm:px-5 py-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <label className="flex flex-col gap-1 min-w-0">
            <span className="font-mono text-[10.5px] font-medium text-[#5C5850]">
              Plan price (integer cents)
            </span>
            <select
              id="chaos-plan-price"
              value={String(chaos.planPriceCents)}
              onChange={(e) =>
                kernel.setChaosParams({ planPriceCents: parseInt(e.target.value, 10) || 4900 })
              }
              className="h-9 rounded-[3px] border border-[#C5BEB1] bg-[#FCFBF8] px-2.5 font-mono text-[16px] sm:text-[12.5px] text-[#141413] tabular-nums cursor-pointer"
            >
              <option value="2900">$29.00 / mo (2,900c)</option>
              <option value="4900">$49.00 / mo (4,900c)</option>
              <option value="9900">$99.00 / mo (9,900c)</option>
              <option value="24900">$249.00 / mo (24,900c)</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 min-w-0">
            <span className="font-mono text-[10.5px] font-medium text-[#5C5850]">
              Included monthly credits
            </span>
            <select
              id="chaos-plan-credits"
              value={String(chaos.planCredits)}
              onChange={(e) =>
                kernel.setChaosParams({ planCredits: parseInt(e.target.value, 10) || 2000 })
              }
              className="h-9 rounded-[3px] border border-[#C5BEB1] bg-[#FCFBF8] px-2.5 font-mono text-[16px] sm:text-[12.5px] text-[#141413] tabular-nums cursor-pointer"
            >
              <option value="1000">1,000 credits</option>
              <option value="2000">2,000 credits</option>
              <option value="5000">5,000 credits</option>
              <option value="10000">10,000 credits</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 min-w-0">
            <span className="font-mono text-[10.5px] font-medium text-[#5C5850]">
              Active paying subscriptions
            </span>
            <input
              id="chaos-monthly-subs"
              type="number"
              min={10}
              max={100000}
              value={chaos.monthlySubs}
              onChange={(e) => {
                const parsed = parseInt(e.target.value, 10);
                const safeSubs = Number.isFinite(parsed)
                  ? Math.min(100000, Math.max(10, parsed))
                  : 500;
                kernel.setChaosParams({
                  monthlySubs: safeSubs,
                });
              }}
              className="h-9 rounded-[3px] border border-[#C5BEB1] bg-[#FCFBF8] px-2.5 font-mono text-[16px] sm:text-[12.5px] text-[#141413] tabular-nums"
            />
          </label>

          <label className="flex flex-col gap-1 min-w-0">
            <span className="font-mono text-[10.5px] font-medium text-[#5C5850]">
              Circuit-breaker trip threshold
            </span>
            <select
              id="chaos-quarantine-threshold"
              value={String(chaos.quarantineThresholdCents)}
              onChange={(e) =>
                kernel.setChaosParams({
                  quarantineThresholdCents: parseInt(e.target.value, 10) || 2500,
                })
              }
              className="h-9 rounded-[3px] border border-[#C5BEB1] bg-[#FCFBF8] px-2.5 font-mono text-[16px] sm:text-[12.5px] text-[#141413] tabular-nums cursor-pointer"
            >
              <option value="1000">$10.00 (1,000c)</option>
              <option value="2500">$25.00 (2,500c)</option>
              <option value="5000">$50.00 (5,000c)</option>
            </select>
          </label>
        </div>
      </div>

      {/* Signature Micro-Interaction: 50-Event Concurrency Oscilloscope */}
      <BurstOscilloscope
        ticks={chaos.oscilloscopeTicks}
        playheadIndex={playheadIndex}
        isPlaying={isPlaying}
        speedMode={speedMode}
        activeFilter={chaos.filter}
        thresholdCents={chaos.quarantineThresholdCents}
        quarantinedCount={chaos.quarantinedAccounts.length}
        planCredits={chaos.planCredits}
        onSelectPhase={handleSelectFilter}
        onReplay={onReplay}
        onToggleSpeed={onToggleSpeed}
      />

      {/* Master-Detail Edge-Case Proof Inspector (34% Rail / 66% Proof Cards + Dual Bay) */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left Navigation Rail (Horizontal Chip Rail on Mobile, Vertical 34% Ledger Rail on Desktop) */}
        <aside
          aria-label="Edge-Case State-Machine Vectors"
          className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#DDD8CE] bg-[#F4F2EC]/60"
        >
          <div className="flex items-center justify-between border-b border-[#DDD8CE] px-3.5 py-2.5">
            <span className="text-[12px] font-semibold text-[#141413]">
              State-machine invariant vectors
            </span>
            <span className="font-mono text-[11px] text-[#68645B] tabular-nums">8 / 8 proved</span>
          </div>

          <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible no-scrollbar divide-x lg:divide-x-0 lg:divide-y divide-[#DDD8CE]">
            <button
              id="btn-filter-ALL"
              type="button"
              onClick={() => handleSelectFilter("ALL")}
              className={cn(
                "flex items-center justify-between gap-2 px-3.5 py-2.5 text-left transition-colors cursor-pointer shrink-0 lg:w-full",
                chaos.filter === "ALL"
                  ? "bg-[#FCFBF8] text-[#141413] lg:border-l-[2px] lg:border-l-[#141413] font-semibold"
                  : "text-[#47453F] hover:bg-[#EAE6DD]/60"
              )}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[11px] text-[#68645B] tabular-nums">ALL</span>
                <span className="text-[12.5px] whitespace-nowrap lg:truncate">
                  Complete 8-Vector Ledger Summary
                </span>
              </span>
              <Badge variant="ok" className="shrink-0">
                50 / 50
              </Badge>
            </button>

            {chaos.rows.map((row) => {
              const active = chaos.filter === row.key;
              return (
                <button
                  key={row.key}
                  id={`btn-filter-${row.key}`}
                  type="button"
                  onClick={() => handleSelectFilter(row.key)}
                  className={cn(
                    "flex items-center justify-between gap-2 px-3.5 py-2.5 text-left transition-colors cursor-pointer shrink-0 lg:w-full",
                    active
                      ? "bg-[#FCFBF8] text-[#141413] lg:border-l-[2px] lg:border-l-[#141413] font-semibold"
                      : "text-[#47453F] hover:bg-[#EAE6DD]/60"
                  )}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[10.5px] text-[#68645B] tabular-nums shrink-0">
                      {row.edgeNum}
                    </span>
                    <span className="text-[12.5px] whitespace-nowrap lg:truncate">
                      {row.plainTitle}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[10.5px] px-1.5 py-0.5 rounded-[2px] shrink-0 tabular-nums border",
                      active
                        ? "border-[#C5BEB1] bg-[#EAE6DD] text-[#141413]"
                        : "border-[#DDD8CE] bg-[#FCFBF8] text-[#5C5850]"
                    )}
                  >
                    {row.impactTag}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Detail Inspector (66%) */}
        <div className="lg:col-span-8 flex flex-col min-w-0">
          {/* Proof Stage */}
          <div className="p-3.5 sm:p-5 border-b border-[#DDD8CE]">
            {selectedEdge ? (
              <div className="space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-[11px] text-[#68645B]">
                      Vector {selectedEdge.edgeNum} — {selectedEdge.kpiDelta}
                    </div>
                    <h2 className="text-[16px] font-semibold tracking-tight text-[#141413]">
                      {selectedEdge.plainTitle}
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEdge.ruleCodes.map((code) => (
                      <Badge key={code} variant="sheet">
                        {code}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Crisp Naive vs Watchdog Side-by-Side Proof Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 border border-[#DDD8CE] divide-y md:divide-y-0 md:divide-x divide-[#DDD8CE] rounded-[3px] overflow-hidden">
                  <div className="border-t-2 border-t-[#C82E1F] bg-[#FDF2F0]/45 p-3.5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#A42216]">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                        <span>Naive Handler Outcome</span>
                      </span>
                      <Badge variant="leak">FAIL</Badge>
                    </div>
                    <p className="text-[13px] leading-relaxed text-[#47453F]">
                      {selectedEdge.naive.replace(/^FAIL:\s*/, "")}
                    </p>
                  </div>

                  <div className="border-t-2 border-t-[#0D7A5F] bg-[#EDF7F3]/45 p-3.5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#095E49]">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                        <span>Watchdog v2 State Machine</span>
                      </span>
                      <Badge variant="ok">PASS</Badge>
                    </div>
                    <p className="text-[13px] leading-relaxed text-[#141413]">
                      {selectedEdge.watchdog.replace(/^PASS:\s*/, "")}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-[15.5px] font-semibold tracking-tight text-[#141413]">
                      All 8 Deterministic Edge-Case Guarantees
                    </h2>
                    <p className="text-[12.5px] text-[#47453F]">
                      Click any row or oscilloscope phase above to inspect side-by-side failure vs conservation proofs.
                    </p>
                  </div>
                  <div className="font-mono text-[11.5px] text-[#5C5850] tabular-nums">
                    Annual exposure:{" "}
                    <span className="font-semibold text-[#A42216]">
                      {formatUsdCents(chaos.annualDriftCents)} / yr
                    </span>
                  </div>
                </div>

                {/* Scannable Compact Hairline Matrix (replaces dense 16-paragraph colored table) */}
                <div className="border border-[#DDD8CE] rounded-[3px] divide-y divide-[#DDD8CE] overflow-hidden">
                  {chaos.rows.map((row) => (
                    <button
                      key={row.key}
                      type="button"
                      onClick={() => handleSelectFilter(row.key)}
                      className="flex w-full items-center justify-between gap-3 bg-[#FCFBF8] px-3 py-2 text-left hover:bg-[#F4F2EC] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-[11px] text-[#68645B] w-10 shrink-0 tabular-nums">
                          {row.edgeNum}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium text-[#141413] truncate">
                            {row.plainTitle}
                          </div>
                          <div className="font-mono text-[11px] text-[#68645B] truncate">
                            {row.kpiDelta}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="leak" className="hidden sm:inline-flex">
                          {row.impactTag}
                        </Badge>
                        <Badge variant="ok">Blocked</Badge>
                        <ArrowRight className="h-3.5 w-3.5 text-[#68645B]" strokeWidth={1.6} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Dual Obsidian Bay: Transition Stream + Circuit-Breaker Quarantine Patch */}
          <div className="grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-[#2C2F2A] bg-[#121311] text-[#EAE8E1]">
            {/* Left Obsidian Pane: Live State Transition Stream */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center justify-between gap-2 border-b border-[#2C2F2A] bg-[#1B1D1A] px-3.5 py-2 min-h-[41px]">
                <span className="font-mono text-[11.5px] font-medium text-[#EAE8E1] truncate whitespace-nowrap">
                  State Transition Stream
                </span>
                <span className="font-mono text-[10.5px] text-[#A8A59C] tabular-nums shrink-0">
                  {chaos.logSections.length} vector group(s)
                </span>
              </div>
              <pre
                id="chaos-event-log"
                className="m-0 max-h-[260px] overflow-auto bay-scroll p-3.5 font-mono text-[11.5px] leading-[1.55] text-[#D7D4CB] whitespace-pre"
              >
                {chaos.eventLog}
              </pre>
            </div>

            {/* Right Obsidian Pane: Active Circuit-Breaker SQL Patch */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center justify-between gap-2 border-b border-[#2C2F2A] bg-[#1B1D1A] px-3.5 py-2">
                <span className="font-mono text-[11.5px] font-medium text-[#EAE8E1] truncate">
                  Circuit-Breaker Patch (is_billing_quarantined)
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={cn(
                      "rounded-[2px] border px-1.5 py-0.5 font-mono text-[10px]",
                      isProLicenseUnlocked
                        ? "border-[#1F4E42] bg-[#0F241D] text-[#4CD4AE]"
                        : "border-[#493818] bg-[#241E11] text-[#F2B441]"
                    )}
                  >
                    {isProLicenseUnlocked ? "PRO UNLOCKED" : "PRO LICENSE REQUIRED"}
                  </span>
                  <Button
                    variant="bay"
                    size="sm"
                    onClick={handleCopySql}
                    className="h-6 px-2 text-[11px]"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="h-3 w-3 text-[#4CD4AE]" strokeWidth={1.75} />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" strokeWidth={1.75} />
                        <span>Copy SQL</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <textarea
                id="quarantine-sql-output"
                readOnly
                value={chaos.quarantineSql}
                rows={9}
                aria-label="Circuit-Breaker SQL Patch Preview"
                className="w-full flex-1 resize-none border-0 bg-[#121311] p-3.5 font-mono text-[11.5px] leading-[1.55] text-[#C5C2B8] outline-none bay-scroll whitespace-pre-wrap break-words"
              />

              {!isProLicenseUnlocked && (
                <VaultLockCurtain
                  diagnosticSummary={`${chaos.quarantinedAccounts.length} account(s) >= ${formatUsdCents(
                    chaos.quarantineThresholdCents
                  )} tripped breaker`}
                  onUnlockClick={() => kernel.setLicenseDrawerOpen(true)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
