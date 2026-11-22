import { useCallback, useEffect, useRef, useState } from "react";
import NumberFlow from "@number-flow/react";
import {
  Activity,
  ArrowRight,
  FileCode2,
  GitCompareArrows,
  Github,
  KeyRound,
  PackageCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getKernel, useKernelState } from "@/lib/kernel";
import { SmoothTab, type WorkbenchTabItem } from "@/components/kokonutui/smooth-tab";
import { CommandButton } from "@/components/kokonutui/command-button";
import {
  CircuitBreakerBadge,
  type BreakerPhase,
} from "@/components/instruments/CircuitBreakerBadge";
import { StormRecorderView } from "@/views/StormRecorderView";
import { SchemaAuditorView } from "@/views/SchemaAuditorView";
import { DriftReconcilerView } from "@/views/DriftReconcilerView";
import { LicensingCiView } from "@/views/LicensingCiView";
import { LicenseSheet } from "@/views/LicenseSheet";

type WorkbenchTabId = "storm" | "auditor" | "reconciler" | "licensing";

const WORKBENCH_TABS: WorkbenchTabItem[] = [
  { id: "storm", code: "01", title: "Storm Flight Recorder", shortTitle: "Flight Recorder", icon: Activity },
  { id: "auditor", code: "02", title: "Schema & Route Auditor", shortTitle: "Auditor", icon: FileCode2 },
  { id: "reconciler", code: "03", title: "Drift Reconciler", shortTitle: "Reconciler", icon: GitCompareArrows },
  { id: "licensing", code: "04", title: "Self-Hosted & Licensing", shortTitle: "Licensing", icon: PackageCheck },
];

export default function App() {
  const kernel = getKernel();
  const state = useKernelState();
  const [activeTab, setActiveTab] = useState<WorkbenchTabId>("storm");
  const [speedMode, setSpeedMode] = useState<"1x" | "instant">("1x");
  const [playheadIndex, setPlayheadIndex] = useState<number>(49);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  const stopSweep = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const triggerReplay = useCallback(() => {
    stopSweep();
    kernel.runChaosSimulation(state.chaos.filter);
    setActiveTab("storm");

    const prefersReduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || speedMode === "instant") {
      setPlayheadIndex(49);
      return;
    }

    setPlayheadIndex(0);
    setIsPlaying(true);
    let current = 0;
    timerRef.current = window.setInterval(() => {
      current += 1;
      if (current >= 49) {
        setPlayheadIndex(49);
        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setIsPlaying(false);
      } else {
        setPlayheadIndex(current);
      }
    }, 32);
  }, [kernel, speedMode, state.chaos.filter, stopSweep]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, []);

  // Global physical shortcuts `1`–`4` for instant workbench mode switching
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (state.licenseDrawerOpen || document.querySelector('[role="dialog"]')) return;
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }
      if (e.key === "1") setActiveTab("storm");
      else if (e.key === "2") setActiveTab("auditor");
      else if (e.key === "3") setActiveTab("reconciler");
      else if (e.key === "4") setActiveTab("licensing");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.licenseDrawerOpen]);

  const ticks = state.chaos.oscilloscopeTicks;
  const activeTick = ticks[Math.min(Math.max(playheadIndex, 0), Math.max(ticks.length - 1, 0))];
  const liveLeakCents = isPlaying && activeTick ? activeTick.cumulativeNaiveCents : state.chaos.naiveLeakedCents;
  const liveLeakCredits = isPlaying && activeTick ? activeTick.cumulativeNaiveCredits : state.chaos.naiveLeakedCredits;
  const liveBreakerState: BreakerPhase = activeTick
    ? activeTick.breakerState
    : state.chaos.quarantinedAccounts.length > 0
      ? "QUARANTINED"
      : "ARMED";

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F2EC] text-[#141413]">
      {/* Sticky Precision Instrument Topbar */}
      <header className="sticky top-0 z-40 border-b border-[#DDD8CE] bg-[#FCFBF8]/95 backdrop-blur-[4px]">
        <div className="mx-auto max-w-[1380px] px-3 sm:px-5">
          {/* Desktop single-row / Mobile & Tablet row 1 */}
          <div className="flex h-12 items-center justify-between gap-3">
            {/* Brand Mark (Custom 22x22 hairline breaker SVG) */}
            <div className="flex items-center gap-2.5 shrink-0">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="shrink-0"
              >
                <rect x="2" y="2" width="20" height="20" rx="2" stroke="#141413" strokeWidth="1.6" />
                <path d="M5.5 12h4l2-4.5 2.5 9 2-4.5h2.5" stroke="#0D7A5F" strokeWidth="1.6" />
              </svg>
              <span className="text-[13.5px] font-semibold tracking-tight text-[#141413] whitespace-nowrap shrink-0">
                Billing Watchdog
              </span>
              <span className="hidden xl:inline-flex rounded-[2px] border border-[#DDD8CE] bg-[#F4F2EC] px-1.5 py-0.5 font-mono text-[10.5px] text-[#5C5850] shrink-0">
                v2.4.2
              </span>
            </div>

            {/* Desktop Centered SmoothTab Rail (>= 1280px so brand and tabs never collide) */}
            <div className="hidden xl:flex items-center shrink-0">
              <SmoothTab
                items={WORKBENCH_TABS}
                value={activeTab}
                onChange={(id) => setActiveTab(id as WorkbenchTabId)}
              />
            </div>

            {/* Right Controls: License Drawer + GitHub Action Link */}
            <div className="flex items-center gap-2 shrink-0">
              <CommandButton
                shortcut="l"
                variant="outline"
                onClick={() => kernel.setLicenseDrawerOpen(true)}
                className="h-8 px-2.5 text-[12px]"
                title={
                  state.isProLicenseUnlocked
                    ? "Pro Ed25519 license verified"
                    : "Enter your BWV2E license key to unlock Pro"
                }
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    state.isProLicenseUnlocked ? "bg-[#0D7A5F]" : "bg-[#B86B00]"
                  )}
                />
                <KeyRound className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                <span className="hidden sm:inline">
                  {state.isProLicenseUnlocked ? "Pro Verified" : "Unlock Key"}
                </span>
              </CommandButton>

              <a
                href="https://github.com/mariostosic0806/billing-watchdog"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-[3px] border border-[#DDD8CE] bg-[#FCFBF8] px-2.5 text-[12px] font-medium text-[#141413] hover:bg-[#EAE6DD] transition-colors"
              >
                <Github className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span className="hidden sm:inline">Action</span>
              </a>
            </div>
          </div>

          {/* Mobile / Tablet Row 2 Horizontally Scrollable Mode Rail (< 1280px) */}
          <div className="border-t border-[#DDD8CE] xl:hidden">
            <SmoothTab
              items={WORKBENCH_TABS}
              value={activeTab}
              onChange={(id) => setActiveTab(id as WorkbenchTabId)}
              className="w-full"
            />
          </div>
        </div>
      </header>

      {/* Main Centered Architectural Workbench Chassis */}
      <main className="mx-auto w-full max-w-[1380px] flex-1 px-3 sm:px-5 py-4 sm:py-5">
        <div className="rounded-[4px] border border-[#DDD8CE] bg-[#FCFBF8] overflow-hidden">
          {/* Compact Split Command Header (Dot-grid drafting canvas limited strictly here) */}
          <div className="command-grid-bg grid grid-cols-1 lg:grid-cols-12 border-b border-[#DDD8CE] divide-y lg:divide-y-0 lg:divide-x divide-[#DDD8CE]">
            <div className="lg:col-span-7 px-4 sm:px-6 py-4 sm:py-5">
              <h1 className="font-[family-name:var(--font-display)] text-[26px] sm:text-[32px] font-semibold tracking-[-0.03em] leading-[1.12] text-[#141413]">
                Deterministic firewall for Stripe &amp; Postgres credit ledgers.
              </h1>
              <p className="mt-2 max-w-[64ch] text-[13.5px] sm:text-[14px] leading-relaxed text-[#47453F]">
                Zero-custody Stripe ↔ Postgres REPEATABLE READ drift reconciler, pre-flight LLM stream credit holds, and offline schema/route CI gate.
              </p>
            </div>

            {/* Flush 2x2 Hairline Guarantee Grid */}
            <div className="lg:col-span-5 grid grid-cols-2 divide-x divide-y divide-[#DDD8CE] bg-[#FCFBF8]/90 text-[12px]">
              <div className="p-3.5">
                <div className="text-[#68645B] text-[11px]">Credential boundary</div>
                <div className="mt-0.5 font-mono font-medium text-[#141413]">0 keys leave runner</div>
              </div>
              <div className="p-3.5">
                <div className="text-[#68645B] text-[11px]">Money arithmetic</div>
                <div className="mt-0.5 font-mono font-medium text-[#141413]">Integer cents only</div>
              </div>
              <div className="p-3.5">
                <div className="text-[#68645B] text-[11px]">CI security output</div>
                <div className="mt-0.5 font-mono font-medium text-[#141413]">SARIF 2.1.0 + Fix MD</div>
              </div>
              <div className="p-3.5">
                <div className="text-[#68645B] text-[11px]">Self-hosted fonts &amp; UI</div>
                <div className="mt-0.5 font-mono font-medium text-[#095E49] tabular-nums">0 external requests</div>
              </div>
            </div>
          </div>

          {/* Live Conservation Telemetry Strip */}
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center border-b border-[#DDD8CE] bg-[#FCFBF8] divide-y lg:divide-y-0 lg:divide-x divide-[#DDD8CE]">
            {/* Naive Exposure Cell */}
            <div className="lg:col-span-3 flex items-center justify-between lg:justify-start gap-3 px-4 py-3">
              <div>
                <div className="text-[11px] font-medium text-[#68645B]">Naive handler leak</div>
                <div className="flex items-baseline gap-2 font-mono tabular-nums">
                  <span className="text-[18px] font-semibold text-[#A42216]">
                    <NumberFlow
                      value={liveLeakCents / 100}
                      format={{ style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                    />
                  </span>
                  <span className="text-[11px] text-[#68645B]">
                    +{liveLeakCredits.toLocaleString("en-US")} cr
                  </span>
                </div>
              </div>
            </div>

            {/* Watchdog Conservation + Circuit Breaker Cell */}
            <div className="lg:col-span-5 flex flex-wrap items-center justify-between gap-2.5 px-4 py-3">
              <div>
                <div className="text-[11px] font-medium text-[#68645B]">Watchdog v2 ledger balance</div>
                <div className="flex items-baseline gap-2 font-mono tabular-nums">
                  <span className="text-[18px] font-semibold text-[#095E49]">$0.00 leaked</span>
                  <span className="text-[11px] text-[#68645B]">0c drift</span>
                </div>
              </div>
              <CircuitBreakerBadge
                state={liveBreakerState}
                frozenCount={state.chaos.quarantinedAccounts.length}
                thresholdCents={state.chaos.quarantineThresholdCents}
              />
            </div>

            {/* Primary CTA Cell */}
            <div className="lg:col-span-4 flex flex-wrap items-center justify-between sm:justify-end gap-2.5 px-4 py-3">
              <CommandButton shortcut="r" variant="primary" onClick={triggerReplay}>
                Replay 50-Event Storm
              </CommandButton>

              <button
                type="button"
                onClick={() => setActiveTab("auditor")}
                className="inline-flex items-center gap-1 rounded-[3px] px-2.5 py-1.5 text-[12.5px] font-medium text-[#1E4E79] hover:bg-[#F4F2EC] transition-colors cursor-pointer"
              >
                <span>Audit Your SQL</span>
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {/* Active Workbench View */}
          <div role="tabpanel">
            {activeTab === "storm" && (
              <StormRecorderView
                state={state}
                playheadIndex={playheadIndex}
                isPlaying={isPlaying}
                speedMode={speedMode}
                onReplay={triggerReplay}
                onToggleSpeed={setSpeedMode}
              />
            )}
            {activeTab === "auditor" && <SchemaAuditorView state={state} />}
            {activeTab === "reconciler" && <DriftReconcilerView state={state} />}
            {activeTab === "licensing" && (
              <LicensingCiView onOpenAuditor={() => setActiveTab("auditor")} />
            )}
          </div>
        </div>
      </main>

      {/* Clean Architectural Footer (Polar.sh MoR Individual Developer AUP Compliant) */}
      <footer className="border-t border-[#DDD8CE] bg-[#FCFBF8]">
        <div className="mx-auto flex max-w-[1380px] flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-4 text-[12px] text-[#47453F]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>© 2026 Mario Stosic — Individual Software Developer (Serbia)</span>
            <span className="hidden sm:inline-block h-3 w-[1px] bg-[#DDD8CE]" aria-hidden="true" />
            <a href="mailto:mariostosic@prime-tech.rs" className="text-[#1E4E79] hover:underline">
              mariostosic@prime-tech.rs
            </a>
          </div>

          <nav aria-label="Legal and repository links" className="flex flex-wrap items-center gap-4">
            <a href="terms.html" className="text-[#1E4E79] hover:underline">
              Terms of Service
            </a>
            <a href="privacy.html" className="text-[#1E4E79] hover:underline">
              Privacy Policy
            </a>
            <a href="refund-policy.html" className="text-[#1E4E79] hover:underline">
              Refund Policy (30 Days)
            </a>
            <a
              href="https://github.com/mariostosic0806/billing-watchdog"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#141413] font-medium hover:underline"
            >
              GitHub Repository
            </a>
          </nav>
        </div>
      </footer>

      {/* Slide-Over License & Polar Fulfillment Sheet */}
      <LicenseSheet state={state} />
    </div>
  );
}
