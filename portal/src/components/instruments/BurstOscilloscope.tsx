import { m } from "motion/react";
import NumberFlow from "@number-flow/react";
import { RotateCcw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { type EdgeFilterKey, type OscilloscopeTick, formatUsdCents } from "@/lib/kernel";
import { CircuitBreakerBadge, type BreakerPhase } from "./CircuitBreakerBadge";

interface BurstOscilloscopeProps {
  ticks: OscilloscopeTick[];
  playheadIndex: number; // 0..49
  isPlaying: boolean;
  speedMode: "1x" | "instant";
  activeFilter: EdgeFilterKey;
  thresholdCents: number;
  quarantinedCount: number;
  planCredits: number;
  onSelectPhase: (phase: EdgeFilterKey) => void;
  onReplay: () => void;
  onToggleSpeed: (mode: "1x" | "instant") => void;
}

const PHASE_SEGMENTS: Array<{
  key: Exclude<EdgeFilterKey, "ALL">;
  label: string;
  countLabel: string;
  start: number;
  end: number;
}> = [
  { key: "BURST", label: "Parallel Burst & Self-Echo", countLabel: "20 events", start: 0, end: 19 },
  { key: "OOO", label: "Out-of-Order Cancel", countLabel: "10 events", start: 20, end: 29 },
  { key: "MULTI", label: "Manual, Multi & 404", countLabel: "12 events", start: 30, end: 41 },
  { key: "STREAM", label: "Clawback & LLM Hold", countLabel: "8 events", start: 42, end: 49 },
];

export function BurstOscilloscope({
  ticks,
  playheadIndex,
  isPlaying,
  speedMode,
  activeFilter,
  thresholdCents,
  quarantinedCount,
  planCredits,
  onSelectPhase,
  onReplay,
  onToggleSpeed,
}: BurstOscilloscopeProps) {
  const safeTick = ticks[Math.min(Math.max(playheadIndex, 0), Math.max(ticks.length - 1, 0))];
  const liveCents = safeTick ? safeTick.cumulativeNaiveCents : 0;
  const liveCredits = safeTick ? safeTick.cumulativeNaiveCredits : 0;
  const breakerPhase: BreakerPhase = safeTick ? safeTick.breakerState : "ARMED";

  // Mobile 25-bar paired summary for clean rendering on 390px viewports
  const pairedTicks = [];
  for (let i = 0; i < ticks.length; i += 2) {
    const a = ticks[i];
    const b = ticks[i + 1] ?? a;
    const isHit = (a?.index ?? 0) <= playheadIndex;
    const hasLeak = (a?.naiveCentsDelta ?? 0) > 0 || (b?.naiveCentsDelta ?? 0) > 0;
    const hasTrip = Boolean(a?.isTripPoint || b?.isTripPoint);
    pairedTicks.push({
      index: i,
      phase: b.phase,
      isHit,
      hasLeak,
      hasTrip,
      title: `${a.phaseLabel} (${a.tLabel})`,
    });
  }

  return (
    <section
      aria-label="50-Event Concurrency Flight Recorder Oscilloscope"
      className="border-b border-[#2C2F2A] bg-[#121311] text-[#EAE8E1]"
    >
      {/* Top Instrument Chrome Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2C2F2A] bg-[#1B1D1A] px-3 sm:px-4 py-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium text-[#EAE8E1] whitespace-nowrap shrink-0">
            <span
              aria-hidden="true"
              className={cn(
                "h-2 w-2 rounded-full",
                isPlaying ? "bg-[#F2B441]" : breakerPhase === "QUARANTINED" ? "bg-[#4CD4AE]" : "bg-[#8C8A82]"
              )}
            />
            <span>Flight Recorder</span>
          </span>
          <span className="h-3 w-[1px] bg-[#2C2F2A]" aria-hidden="true" />
          <span className="font-mono text-[11px] text-[#A8A59C] tabular-nums truncate">
            tick {(safeTick?.index ?? 49) + 1}/50 ({safeTick?.tLabel ?? "1.57s"}) —{" "}
            <span className="text-[#EAE8E1]">{safeTick?.phaseLabel ?? "Storm Complete"}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div
            role="group"
            aria-label="Replay speed"
            className="inline-flex items-center rounded-[3px] border border-[#2C2F2A] bg-[#121311] p-0.5 font-mono text-[11px]"
          >
            <button
              type="button"
              onClick={() => onToggleSpeed("1x")}
              className={cn(
                "px-2 py-0.5 rounded-[2px] cursor-pointer transition-colors",
                speedMode === "1x" ? "bg-[#2C2F2A] text-[#EAE8E1]" : "text-[#8C8A82] hover:text-[#EAE8E1]"
              )}
            >
              1x sweep
            </button>
            <button
              type="button"
              onClick={() => onToggleSpeed("instant")}
              className={cn(
                "px-2 py-0.5 rounded-[2px] cursor-pointer transition-colors",
                speedMode === "instant" ? "bg-[#2C2F2A] text-[#EAE8E1]" : "text-[#8C8A82] hover:text-[#EAE8E1]"
              )}
            >
              Instant
            </button>
          </div>
          <button
            type="button"
            onClick={onReplay}
            className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#3E423B] bg-[#232622] px-2.5 py-1 font-mono text-[11px] text-[#EAE8E1] hover:bg-[#2F332E] cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" strokeWidth={1.75} />
            <span>Replay</span>
          </button>
        </div>
      </div>

      {/* Main Dual-Track 50-Tick Oscilloscope */}
      <div className="px-3 sm:px-4 py-3">
        {/* Track Legend + Live Rolling Counters */}
        <div className="mb-2.5 grid grid-cols-1 sm:grid-cols-3 items-center gap-2 border border-[#2C2F2A] bg-[#161815] px-3 py-2 rounded-[3px]">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="font-mono text-[11px] text-[#FF7A6B]">Naive handler leak:</span>
            <span className="font-mono text-[13px] font-semibold text-[#FF7A6B] tabular-nums">
              <NumberFlow
                value={liveCents / 100}
                format={{ style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }}
              />{" "}
              <span className="text-[11px] text-[#C5C2B8]">(+{liveCredits.toLocaleString("en-US")} cr)</span>
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-center gap-2 border-t sm:border-t-0 sm:border-l sm:border-r border-[#2C2F2A] pt-1.5 sm:pt-0 sm:px-3">
            <span className="font-mono text-[11px] text-[#4CD4AE]">Watchdog v2:</span>
            <span className="font-mono text-[13px] font-semibold text-[#4CD4AE] tabular-nums">
              $0.00 <span className="text-[11px] text-[#A8A59C]">(1 grant = {planCredits.toLocaleString("en-US")} cr)</span>
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 border-[#2C2F2A] pt-1.5 sm:pt-0">
            <span className="font-mono text-[10.5px] text-[#A8A59C]">Breaker:</span>
            <CircuitBreakerBadge
              state={breakerPhase}
              frozenCount={quarantinedCount}
              thresholdCents={thresholdCents}
              compact
            />
          </div>
        </div>

        {/* Desktop 50-Tick Bar Grid */}
        <div className="relative hidden sm:block select-none">
          <div className="grid grid-cols-50 gap-[3px] items-end h-[66px] pt-4">
            {ticks.map((tick) => {
              const reached = tick.index <= playheadIndex;
              const isBurstLeak = tick.naiveCentsDelta > 0;
              const isSelectedPhase = activeFilter === tick.phase;
              const heightPct = tick.isTripPoint
                ? 100
                : isBurstLeak
                  ? 82
                  : tick.index === 0
                    ? 66
                    : 38;

              return (
                <button
                  key={tick.index}
                  type="button"
                  title={`${tick.tLabel} · ${tick.phaseLabel} · Naive: ${
                    tick.naiveCentsDelta > 0 ? "+" + formatUsdCents(tick.naiveCentsDelta) : "0c"
                  } · Watchdog: ${tick.watchdogAction}`}
                  onClick={() => onSelectPhase(tick.phase)}
                  className={cn(
                    "group relative flex h-full flex-col justify-end gap-[2px] cursor-pointer focus-visible:outline-1 focus-visible:outline-[#EAE8E1]",
                    isSelectedPhase && "bg-white/[0.03]"
                  )}
                >
                  {/* Naive trace (top dot/segment) */}
                  <span
                    className={cn(
                      "w-full rounded-[1px] transition-all duration-100",
                      !reached
                        ? "h-[6px] bg-[#262925]"
                        : isBurstLeak
                          ? "bg-[#FF7A6B]"
                          : "h-[6px] bg-[#3A3D37]"
                    )}
                    style={reached && isBurstLeak ? { height: `${Math.round(heightPct * 0.52)}%` } : undefined}
                  />
                  {/* Watchdog trace (bottom conserved bar) */}
                  <span
                    className={cn(
                      "w-full rounded-[1px] transition-all duration-100",
                      !reached
                        ? "h-[10px] bg-[#2C2F2A]"
                        : tick.isTripPoint
                          ? "h-[24px] bg-[#F2B441]"
                          : tick.index === 0
                            ? "h-[20px] bg-[#4CD4AE]"
                            : "h-[12px] bg-[#1F4E42]"
                    )}
                  />
                  {tick.isTripPoint && reached && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[#F2B441]"
                    >
                      <Zap className="h-2.5 w-2.5" fill="#F2B441" strokeWidth={1.5} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Hairline sweep indicator */}
          <m.div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 bottom-0 w-[1.5px] bg-[#F2B441]"
            initial={false}
            animate={{ left: `${((playheadIndex + 0.5) / 50) * 100}%` }}
            transition={{ duration: 0.04, ease: "linear" }}
          />
        </div>

        {/* Mobile 25-Bar Paired Oscilloscope (<640px) */}
        <div className="relative grid grid-cols-25 gap-[3px] items-end h-[46px] sm:hidden">
          {pairedTicks.map((pt) => (
            <button
              key={pt.index}
              type="button"
              aria-label={pt.title}
              onClick={() => onSelectPhase(pt.phase)}
              className="flex h-full flex-col justify-end gap-[2px] cursor-pointer"
            >
              <span
                className={cn(
                  "w-full rounded-[1px]",
                  !pt.isHit ? "h-[5px] bg-[#262925]" : pt.hasLeak ? "h-[22px] bg-[#FF7A6B]" : "h-[6px] bg-[#3A3D37]"
                )}
              />
              <span
                className={cn(
                  "w-full rounded-[1px]",
                  !pt.isHit ? "h-[8px] bg-[#2C2F2A]" : pt.hasTrip ? "h-[16px] bg-[#F2B441]" : "h-[10px] bg-[#4CD4AE]"
                )}
              />
            </button>
          ))}
        </div>

        {/* Phase Legend Buttons (Interactive Jump to Scenario) */}
        <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 border border-[#2C2F2A] divide-y sm:divide-y-0 sm:divide-x divide-[#2C2F2A] rounded-[3px] overflow-hidden">
          {PHASE_SEGMENTS.map((seg) => {
            const active = activeFilter === seg.key;
            return (
              <button
                key={seg.key}
                type="button"
                onClick={() => onSelectPhase(active ? "ALL" : seg.key)}
                className={cn(
                  "flex items-center justify-between gap-2 px-2.5 py-1.5 text-left font-mono text-[11px] transition-colors cursor-pointer",
                  active ? "bg-[#262925] text-[#EAE8E1]" : "bg-[#161815] text-[#A8A59C] hover:bg-[#1E211D] hover:text-[#EAE8E1]"
                )}
              >
                <span className="truncate">{seg.label}</span>
                <span className="text-[10px] text-[#8C8A82] shrink-0">{seg.countLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
