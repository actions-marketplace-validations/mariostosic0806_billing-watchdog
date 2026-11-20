import { type KeyboardEvent, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { m } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WorkbenchTabItem {
  id: string;
  code: string;
  title: string;
  shortTitle?: string;
  icon?: LucideIcon;
}

interface SmoothTabProps {
  items: WorkbenchTabItem[];
  value: string;
  onChange: (tabId: string) => void;
  className?: string;
  label?: string;
}

const SPRING = { type: "spring", stiffness: 420, damping: 38 } as const;

export function SmoothTab({
  items,
  value,
  onChange,
  className,
  label = "Workbench sections",
}: SmoothTabProps) {
  const uid = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [rect, setRect] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const measure = () => {
    const activeEl = btnRefs.current[value];
    const container = listRef.current;
    if (!activeEl || !container) return;
    setRect({
      left: activeEl.offsetLeft,
      width: activeEl.offsetWidth,
    });
  };

  useLayoutEffect(() => {
    measure();
  }, [value, items.length]);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = items.findIndex((it) => it.id === value);
    if (idx === -1) return;
    let nextIdx = -1;
    if (e.key === "ArrowRight") nextIdx = (idx + 1) % items.length;
    else if (e.key === "ArrowLeft") nextIdx = (idx - 1 + items.length) % items.length;
    else if (e.key === "Home") nextIdx = 0;
    else if (e.key === "End") nextIdx = items.length - 1;

    if (nextIdx !== -1) {
      e.preventDefault();
      const target = items[nextIdx];
      onChange(target.id);
      btnRefs.current[target.id]?.focus();
    }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative inline-flex items-stretch overflow-x-auto no-scrollbar max-w-full",
        className
      )}
    >
      {items.map((item) => {
        const active = item.id === value;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            ref={(el) => {
              btnRefs.current[item.id] = el;
            }}
            id={`${uid}-tab-${item.id}`}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cn(
              "relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap px-3 h-11 sm:h-12 text-[12.5px] font-medium transition-colors cursor-pointer shrink-0",
              active ? "text-[#141413] font-semibold" : "text-[#5C5850] hover:text-[#141413]"
            )}
          >
            <span className="font-mono text-[10.5px] tabular-nums text-[#68645B]">{item.code}</span>
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />}
            <span className="hidden md:inline">{item.title}</span>
            <span className="md:hidden">{item.shortTitle ?? item.title}</span>
          </button>
        );
      })}
      {rect.width > 0 && (
        <m.div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 h-[2px] bg-[#141413]"
          initial={false}
          animate={{ left: rect.left, width: rect.width }}
          transition={SPRING}
        />
      )}
    </div>
  );
}
