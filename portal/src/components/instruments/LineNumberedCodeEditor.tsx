import { useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import type { LinterFinding } from "@/lib/kernel";

interface LineNumberedCodeEditorProps {
  id?: string;
  value: string;
  onChange: (nextVal: string) => void;
  findings: LinterFinding[];
  label: string;
}

export function LineNumberedCodeEditor({
  id = "sql-input",
  value,
  onChange,
  findings,
  label,
}: LineNumberedCodeEditorProps) {
  const gutterRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lines = useMemo(() => value.split(/\r?\n/), [value]);
  const sevByLine = useMemo(() => {
    const map = new Map<number, "CRITICAL" | "HIGH">();
    for (const f of findings) {
      const existing = map.get(f.line);
      if (existing !== "CRITICAL") {
        map.set(f.line, f.sev);
      }
    }
    return map;
  }, [findings]);

  const handleScroll = () => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  return (
    <div className="relative flex flex-1 min-h-[340px] lg:min-h-[480px] rounded-[3px] border border-[#2C2F2A] bg-[#121311] overflow-hidden">
      {/* Synchronized Line Gutter */}
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="w-12 shrink-0 select-none overflow-hidden border-r border-[#2C2F2A] bg-[#161815] py-3 text-right font-mono text-[12px] leading-[1.6] text-[#8C8A82] tabular-nums"
      >
        {lines.map((_, idx) => {
          const lineNum = idx + 1;
          const sev = sevByLine.get(lineNum);
          return (
            <div key={lineNum} className="flex items-center justify-end gap-1.5 px-2 h-[19.2px]">
              {sev ? (
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full shrink-0",
                    sev === "CRITICAL" ? "bg-[#FF7A6B]" : "bg-[#F2B441]"
                  )}
                />
              ) : (
                <span className="h-1.5 w-1.5 shrink-0" />
              )}
              <span>{lineNum}</span>
            </div>
          );
        })}
      </div>

      {/* Controlled Editor Textarea */}
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        className="w-full flex-1 resize-none border-0 bg-[#121311] px-3 py-3 font-mono text-[16px] sm:text-[12px] leading-[1.6] text-[#EAE8E1] outline-none bay-scroll overflow-auto whitespace-pre"
      />
    </div>
  );
}
