import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface DiffLine {
  type: "add" | "remove" | "context";
  text: string;
}

export interface DiffHunk {
  start: number;
  lines: DiffLine[];
}

export interface FileChange {
  path: string;
  hunks: DiffHunk[];
}

interface AiDiffReviewProps {
  files: FileChange[];
  className?: string;
}

// Instant (<10ms) deterministic hunk diff inspector skinned to Swiss Clearinghouse Obsidian Bay (#121311).
// DEMO_LINE_MS = 0 (no artificial typewriter lag).
export function AiDiffReview({ files, className }: AiDiffReviewProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <div
      className={cn(
        "rounded-[3px] border border-[#2C2F2A] bg-[#121311] text-[#EAE8E1] overflow-hidden font-mono text-[11.5px]",
        className
      )}
    >
      {files.map((file, idx) => {
        const isClosed = Boolean(collapsed[file.path]);
        return (
          <div key={file.path} className={cn(idx > 0 && "border-t border-[#2C2F2A]")}>
            <button
              type="button"
              onClick={() =>
                setCollapsed((prev) => ({ ...prev, [file.path]: !prev[file.path] }))
              }
              className="flex w-full items-center justify-between bg-[#1B1D1A] px-3 py-1.5 text-left text-[11.5px] text-[#EAE8E1] hover:bg-[#232622] cursor-pointer"
            >
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 text-[#8C8A82] transition-transform duration-150 shrink-0",
                    !isClosed && "rotate-90"
                  )}
                  strokeWidth={1.75}
                />
                <span className="truncate">{file.path}</span>
              </span>
              <span className="text-[10.5px] text-[#8C8A82] shrink-0">Hunk diff</span>
            </button>
            {!isClosed && (
              <div className="divide-y divide-[#1B1D1A] overflow-x-auto bay-scroll">
                {file.hunks.map((hunk, hIdx) => (
                  <div key={hIdx} className="py-1">
                    {hunk.lines.map((line, lIdx) => {
                      const cleanText = line.text.replace(/^[+-]\s?/, "");
                      const prefix = line.type === "remove" ? "-" : line.type === "add" ? "+" : " ";
                      return (
                        <div
                          key={lIdx}
                          className={cn(
                            "flex items-start gap-2.5 px-3 py-0.5 leading-[1.45] whitespace-pre-wrap break-all sm:break-normal",
                            line.type === "remove" && "bg-[#2C1514] text-[#FF9B8F]",
                            line.type === "add" && "bg-[#0F241D] text-[#6AE4C0]",
                            line.type === "context" && "text-[#C5C2B8]"
                          )}
                        >
                          <span className="w-6 shrink-0 select-none text-right text-[10.5px] text-[#8C8A82] tabular-nums">
                            {hunk.start}
                          </span>
                          <span className="w-3 shrink-0 select-none font-semibold">{prefix}</span>
                          <span className="min-w-0 flex-1">{cleanText}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
