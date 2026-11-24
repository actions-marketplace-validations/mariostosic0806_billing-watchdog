import { KeyRound, ShieldAlert, ShieldCheck, ExternalLink } from "lucide-react";
import { getKernel, type WatchdogKernelState } from "@/lib/kernel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface LicenseSheetProps {
  state: WatchdogKernelState;
}

export function LicenseSheet({ state }: LicenseSheetProps) {
  const kernel = getKernel();
  const {
    licenseDrawerOpen,
    licenseKeyDraft,
    isProLicenseUnlocked,
    licenseStatusKind,
    licenseStatusText,
    polarNotice,
  } = state;

  return (
    <Sheet open={licenseDrawerOpen} onOpenChange={(open) => kernel.setLicenseDrawerOpen(open)}>
      <SheetContent side="right">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[#141413]" strokeWidth={1.75} />
            <SheetTitle>Self-Hosted Pro License &amp; Export Unlock</SheetTitle>
          </div>
          <SheetDescription>
            Offline cryptographic verification via browser WebCrypto Ed25519. Zero license telemetry leaves your browser.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 p-6 overflow-y-auto sheet-scroll">
          {/* Status Indicator (Unified with Polar.sh Fail-Closed Guidance when triggered) */}
          <div
            id="license-status-msg"
            role="status"
            aria-live="polite"
            className={
              licenseStatusKind === "ok"
                ? "rounded-[3px] border border-[#AEDCC9] bg-[#EDF7F3] p-3.5 text-[#095E49]"
                : licenseStatusKind === "error"
                  ? "rounded-[3px] border border-[#E9B8B2] bg-[#FDF2F0] p-3.5 text-[#A42216]"
                  : "rounded-[3px] border border-[#E6CE9E] bg-[#FCF6E8] p-3.5 text-[#8F5100]"
            }
          >
            <div className="flex items-start gap-2.5">
              {isProLicenseUnlocked || licenseStatusKind === "ok" ? (
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0D7A5F]" strokeWidth={1.75} />
              ) : (
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#B86B00]" strokeWidth={1.75} />
              )}
              <div className="min-w-0 flex-1 text-[12.5px] leading-snug space-y-1.5">
                {polarNotice ? (
                  <div className="polar-notice space-y-1.5">
                    <div className="font-semibold text-[#8F5100]">
                      Polar.sh Merchant-of-Record Checkout ({polarNotice.itemName} — {polarNotice.amountCents} integer cents)
                    </div>
                    <p className="text-[#47453F] leading-relaxed">
                      Live self-serve <code className="font-mono text-[11.5px]">buy.polar.sh</code> link is not yet published in this static build (fail-closed — zero unverified external payment redirects).
                    </p>
                    <a
                      href={polarNotice.mailtoHref}
                      className="inline-flex items-start gap-1.5 font-medium text-[#1E4E79] hover:underline break-words"
                    >
                      <span>
                        Request instant Polar.sh MoR checkout link / VAT invoice via{" "}
                        <span className="whitespace-nowrap">mariostosic@prime-tech.rs</span>
                      </span>
                      <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    </a>
                  </div>
                ) : (
                  <>
                    <div className="font-semibold">
                      {isProLicenseUnlocked
                        ? "Commercial License Verified"
                        : licenseStatusKind === "ok"
                          ? "Polar.sh Checkout Completed"
                          : "Free Diagnostic Mode Active"}
                    </div>
                    <div className="break-words font-mono text-[11px]">{licenseStatusText}</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* License Key Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              kernel.unlockProPortal(licenseKeyDraft);
            }}
            className="space-y-3"
          >
            <div>
              <label htmlFor="license-key-input" className="block text-[12.5px] font-semibold text-[#141413] mb-1.5">
                Signed Ed25519 License Key
              </label>
              <Input
                id="license-key-input"
                value={licenseKeyDraft}
                onChange={(e) => kernel.setLicenseKeyDraft(e.target.value)}
                placeholder="BWV2E-LIFETIME_TEAM-... or BWV2E-AGENCY_TEAM-..."
                className="font-mono break-all"
              />
            </div>

            <Button type="submit" className="w-full">
              Unlock Pro Export
            </Button>
          </form>

          {/* Direct Purchase Actions (Integer Cents Only: 14900, 29900) */}
          <div className="border-t border-[#DDD8CE] pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-[#141413]">Need a Commercial License?</span>
              <Badge variant="neutral">Polar.sh MoR</Badge>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <div className="flex items-center justify-between gap-3 rounded-[3px] border border-[#141413] bg-[#F4F2EC] p-3">
                <div>
                  <div className="text-[13px] font-semibold text-[#141413]">Lifetime Team License v2</div>
                  <div className="font-mono text-[11px] text-[#47453F] tabular-nums">$149 one-time (14,900c)</div>
                </div>
                <Button
                  size="sm"
                  className="shrink-0"
                  onClick={() => kernel.startPolarCheckout("Lifetime Team License v2 ($149 One-Time)", 14900)}
                >
                  Buy $149
                </Button>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-[3px] border border-[#DDD8CE] bg-[#F4F2EC]/65 p-3">
                <div>
                  <div className="text-[13px] font-semibold text-[#141413]">Agency &amp; Client-Handover v2</div>
                  <div className="font-mono text-[11px] text-[#68645B] tabular-nums">
                    $299 one-time (29,900c) · Unlimited client repos
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#141413] shrink-0"
                  onClick={() => kernel.startPolarCheckout("Agency & Client-Handover License v2 ($299 One-Time)", 29900)}
                >
                  Buy $299
                </Button>
              </div>
            </div>

            <p className="text-[11.5px] text-[#68645B] leading-relaxed">
              30-day refund guarantee via Polar Software, Inc. See{" "}
              <a href="terms.html" className="text-[#1E4E79] hover:underline">
                Terms (§3.2 Agency)
              </a>
              ,{" "}
              <a href="privacy.html" className="text-[#1E4E79] hover:underline">
                Privacy
              </a>
              , and{" "}
              <a href="refund-policy.html" className="text-[#1E4E79] hover:underline">
                Refund Policy
              </a>
              .
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
