import { useState } from "react";
import { Check, Copy, Download, CheckCircle2, Play, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { getKernel, type WatchdogKernelState } from "@/lib/kernel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AiDiffReview, type FileChange } from "@/components/kokonutui/ai-diff-review";
import { LineNumberedCodeEditor } from "@/components/instruments/LineNumberedCodeEditor";
import { VaultLockCurtain } from "@/components/instruments/VaultLockCurtain";

interface SchemaAuditorViewProps {
  state: WatchdogKernelState;
}

const SAMPLE_FILES: Array<{
  mode: "vulnerable" | "rls_idor" | "nextjs" | "hardened";
  filename: string;
}> = [
  { mode: "vulnerable", filename: "001_vulnerable.sql" },
  { mode: "rls_idor", filename: "002_broken_rls.sql" },
  { mode: "nextjs", filename: "api/webhooks/route.ts" },
  { mode: "hardened", filename: "003_hardened.sql" },
];

export function SchemaAuditorView({ state }: SchemaAuditorViewProps) {
  const kernel = getKernel();
  const { linter, isProLicenseUnlocked } = state;
  const [mobilePane, setMobilePane] = useState<"code" | "findings">("code");
  const [copiedPatch, setCopiedPatch] = useState(false);

  const criticalCount = linter.findings.filter((f) => f.sev === "CRITICAL").length;
  const highCount = linter.findings.filter((f) => f.sev === "HIGH").length;

  const diffFiles: FileChange[] =
    linter.findings.length > 0
      ? [
          {
            path: linter.isCodeMode ? "app/api/webhooks/stripe/route.ts" : "migrations/billing_schema.sql",
            hunks: linter.findings.map((f) => ({
              start: f.line,
              lines: [
                { type: "remove", text: f.diffRemove },
                { type: "add", text: f.diffAdd },
              ],
            })),
          },
        ]
      : [];

  const handleCopy = () => {
    const ok = kernel.copyPatch();
    if (ok) {
      setCopiedPatch(true);
      setTimeout(() => setCopiedPatch(false), 1800);
    }
  };

  return (
    <div className="border-t border-[#DDD8CE] bg-[#FCFBF8]">
      {/* Mobile Pane Toggle (<1024px) */}
      <div className="flex items-center justify-between gap-2 border-b border-[#DDD8CE] bg-[#EAE6DD] px-3 py-2 lg:hidden">
        <div className="inline-flex rounded-[3px] border border-[#C5BEB1] bg-[#F4F2EC] p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setMobilePane("code")}
            className={cn(
              "px-2.5 py-1 rounded-[2px] text-[12px] font-medium cursor-pointer whitespace-nowrap",
              mobilePane === "code" ? "bg-[#141413] text-[#FCFBF8]" : "text-[#47453F]"
            )}
          >
            Source Editor
          </button>
          <button
            type="button"
            onClick={() => setMobilePane("findings")}
            className={cn(
              "px-2.5 py-1 rounded-[2px] text-[12px] font-medium cursor-pointer whitespace-nowrap",
              mobilePane === "findings" ? "bg-[#141413] text-[#FCFBF8]" : "text-[#47453F]"
            )}
          >
            Findings ({linter.findings.length}) &amp; Patch
          </button>
        </div>
        <span className="font-mono text-[11px] text-[#5C5850] whitespace-nowrap shrink-0 tabular-nums">
          &lt;{linter.lintMs}ms
        </span>
      </div>

      {/* 52% / 48% IDE-Grade Split Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left 52% (6 cols desktop-ish -> 7/12 = ~58% or 6/12 with balanced grid; let's use lg:grid-cols-[52%_48%]) */}
        <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-[52%_48%] divide-y lg:divide-y-0 lg:divide-x divide-[#DDD8CE]">
          {/* Left Pane: Obsidian Code Editor with IDE Tabs */}
          <div
            className={cn(
              "flex flex-col p-3.5 sm:p-4 bg-[#FCFBF8] min-w-0",
              mobilePane === "findings" && "hidden lg:flex"
            )}
          >
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {SAMPLE_FILES.map((sample) => {
                  const active = linter.activePreset === sample.mode;
                  return (
                    <button
                      key={sample.mode}
                      type="button"
                      onClick={() => kernel.loadSampleSql(sample.mode)}
                      className={cn(
                        "rounded-[3px] border px-2.5 py-1 font-mono text-[11.5px] transition-colors cursor-pointer",
                        active
                          ? "border-[#141413] bg-[#141413] text-[#FCFBF8]"
                          : "border-[#DDD8CE] bg-[#F4F2EC] text-[#47453F] hover:border-[#C5BEB1] hover:text-[#141413]"
                      )}
                    >
                      {sample.filename}
                    </button>
                  );
                })}
              </div>

              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-[3px] border border-[#DDD8CE] bg-[#F4F2EC] px-2 py-0.5 font-mono text-[11px] text-[#5C5850]">
                <ShieldCheck className="h-3 w-3 text-[#0D7A5F]" strokeWidth={1.75} />
                <span>Offline</span>
                <span className="h-2.5 w-[1px] bg-[#C5BEB1]" aria-hidden="true" />
                <span>&lt;{linter.lintMs}ms</span>
                <span className="h-2.5 w-[1px] bg-[#C5BEB1]" aria-hidden="true" />
                <span>0 bytes uploaded</span>
              </span>
            </div>

            <LineNumberedCodeEditor
              id="sql-input"
              label="Input SQL Migration or TypeScript Route"
              value={linter.sqlInput}
              onChange={(val) => kernel.setSqlInput(val)}
              findings={linter.findings}
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => kernel.runSqlLinter()}>
                <Play className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>Re-run Offline Audit</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copiedPatch ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#0D7A5F]" strokeWidth={1.75} />
                    <span>Copied Patch</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
                    <span>Copy SQL Patch</span>
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={() => kernel.downloadPatch()}>
                <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>Download .sql</span>
              </Button>
            </div>
          </div>

          {/* Right Pane: Findings Tally, Instant Diff Hunks & Non-Blocking Patch Bay */}
          <div
            className={cn(
              "flex flex-col justify-between bg-[#FCFBF8] min-w-0",
              mobilePane === "code" && "hidden lg:flex"
            )}
          >
            <div className="p-3.5 sm:p-4 space-y-3">
              {/* Tally Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDD8CE] pb-2.5">
                <div>
                  <h2 className="text-[15px] font-semibold tracking-tight text-[#141413]">
                    {linter.isCodeMode ? "TypeScript & AI Stream Route Audit" : "PostgreSQL & RLS Invariant Audit"}
                  </h2>
                  <p className="text-[12.5px] text-[#47453F]">
                    {linter.findings.length === 0
                      ? "All checked Group A schema and policy invariants passed."
                      : "Flagged structural holes before webhooks or LLM traffic hit production."}
                  </p>
                </div>

                {linter.findings.length === 0 ? (
                  <Badge variant="ok">0 Defects</Badge>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {criticalCount > 0 && <Badge variant="leak">{criticalCount} Critical</Badge>}
                    {highCount > 0 && <Badge variant="warn">{highCount} High</Badge>}
                  </div>
                )}
              </div>

              {/* Findings List */}
              {linter.findings.length === 0 ? (
                <div className="flex items-start gap-2.5 rounded-[3px] border border-[#AEDCC9] bg-[#EDF7F3] p-3 text-[#095E49]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0D7A5F]" strokeWidth={1.75} />
                  <div>
                    <div className="text-[13px] font-semibold">
                      0 Schema or RLS Vulnerabilities Found — All Group A Database Invariants Passed
                    </div>
                    <p className="mt-0.5 text-[12px] text-[#095E49]/90">
                      Wallet non-negative check, webhook idempotency uniqueness, and per-table tenant RLS policies verified.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[240px] overflow-y-auto sheet-scroll pr-1">
                  {linter.findings.map((f) => (
                    <div
                      key={f.code}
                      className="rounded-[3px] border border-[#DDD8CE] bg-[#F4F2EC]/55 p-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant={f.sev === "HIGH" ? "warn" : "leak"}>{f.sev}</Badge>
                          <span className="text-[13px] font-semibold text-[#141413] truncate">
                            {f.title}
                          </span>
                        </div>
                        <span className="font-mono text-[10.5px] text-[#5C5850] tabular-nums">
                          L{f.line}
                        </span>
                      </div>

                      <p className="mt-1.5 text-[12.5px] leading-snug text-[#47453F]">{f.msg}</p>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-[2px] border border-[#DDD8CE] bg-[#FCFBF8] px-1.5 py-0.5 font-mono text-[10px] text-[#5C5850]">
                          {f.code}
                        </span>
                        <span className="font-mono text-[10.5px] text-[#68645B] truncate">
                          {f.table}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* KokonutUI Instant Hunk Diff Review */}
              {diffFiles.length > 0 && <AiDiffReview files={diffFiles} />}
            </div>

            {/* Bottom Obsidian Bay: Non-Blocking PostgreSQL Patch */}
            <div className="border-t border-[#2C2F2A] bg-[#121311] text-[#EAE8E1]">
              <div className="flex items-center justify-between gap-2 border-b border-[#2C2F2A] bg-[#1B1D1A] px-3.5 py-2">
                <label
                  htmlFor="patch-output"
                  className="font-mono text-[11.5px] font-medium text-[#EAE8E1] truncate"
                >
                  Non-Blocking Patch (NOT VALID + VALIDATE)
                </label>
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

              <textarea
                id="patch-output"
                readOnly
                value={linter.patchOutput}
                rows={7}
                className="w-full resize-none border-0 bg-[#121311] p-3 font-mono text-[11.5px] leading-[1.55] text-[#C5C2B8] outline-none bay-scroll whitespace-pre-wrap break-words"
              />

              {!isProLicenseUnlocked && linter.findings.length > 0 && (
                <VaultLockCurtain
                  diagnosticSummary={`${linter.findings.length} remediation hunk(s) ready`}
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
