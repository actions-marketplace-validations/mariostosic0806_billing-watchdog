import { ShieldAlert, ShieldCheck, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreakerPhase = "ARMED" | "TRIPPED" | "QUARANTINED";

interface CircuitBreakerBadgeProps {
  state: BreakerPhase;
  frozenCount: number;
  thresholdCents: number;
  compact?: boolean;
  className?: string;
}

export function CircuitBreakerBadge({
  state,
  frozenCount,
  thresholdCents,
  compact = false,
  className,
}: CircuitBreakerBadgeProps) {
  const isTripped = state === "TRIPPED";
  const isQuarantined = state === "QUARANTINED" && frozenCount > 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[3px] border px-2 py-1 font-mono text-[11px] font-medium tabular-nums transition-colors",
        isQuarantined
          ? "border-[#E6CE9E] bg-[#FCF6E8] text-[#8F5100]"
          : isTripped
            ? "border-[#E9B8B2] bg-[#FDF2F0] text-[#A42216]"
            : "border-[#AEDCC9] bg-[#EDF7F3] text-[#095E49]",
        className
      )}
    >
      {isQuarantined ? (
        <ShieldAlert className="h-3.5 w-3.5 text-[#B86B00] shrink-0" strokeWidth={1.75} />
      ) : isTripped ? (
        <Activity className="h-3.5 w-3.5 text-[#C82E1F] shrink-0" strokeWidth={1.75} />
      ) : (
        <ShieldCheck className="h-3.5 w-3.5 text-[#0D7A5F] shrink-0" strokeWidth={1.75} />
      )}
      <span>
        {isQuarantined
          ? compact
            ? `QUARANTINED (${frozenCount})`
            : `QUARANTINED: ${frozenCount} frozen >= ${thresholdCents}c`
          : isTripped
            ? "TRIPPED (threshold hit)"
            : "ARMED ($0.00 leaked)"}
      </span>
    </span>
  );
}
