import { Lock, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VaultLockCurtainProps {
  diagnosticSummary: string;
  onUnlockClick: () => void;
}

export function VaultLockCurtain({ diagnosticSummary, onUnlockClick }: VaultLockCurtainProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-[#2C2F2A] bg-[#1B1D1A] px-3 py-2.5 text-[#EAE8E1]">
      <div className="flex items-center gap-2 min-w-0">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-[3px] border border-[#493818] bg-[#241E11] text-[#F2B441] shrink-0">
          <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <div className="text-[12px] font-medium text-[#EAE8E1] truncate">{diagnosticSummary}</div>
          <div className="font-mono text-[10.5px] text-[#A8A59C] truncate">
            Executable SQL redacted in Free Diagnostic Mode
          </div>
        </div>
      </div>

      <Button
        variant="bay"
        size="sm"
        onClick={onUnlockClick}
        className="shrink-0 border-[#493818] text-[#F2B441] hover:bg-[#241E11] hover:text-[#F8C86A]"
      >
        <KeyRound className="h-3.5 w-3.5" strokeWidth={1.75} />
        <span>Enter BWV2E Key</span>
      </Button>
    </div>
  );
}
