import { type ComponentProps, type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Modifier = "mod" | "ctrl" | "alt" | "shift";

interface ParsedShortcut {
  modifiers: Modifier[];
  key: string;
}

interface CommandButtonProps extends ComponentProps<"button"> {
  children?: ReactNode;
  shortcut?: string;
  global?: boolean;
  variant?: "primary" | "outline";
}

const APPLE_PLATFORM = /mac|iphone|ipad|ipod/i;
const MODIFIERS = new Set<Modifier>(["mod", "ctrl", "alt", "shift"]);

function parseShortcut(shortcut: string): ParsedShortcut {
  const parts = shortcut
    .toLowerCase()
    .split("+")
    .map((p) => p.trim())
    .filter(Boolean);
  const modifiers = parts.filter((p): p is Modifier => MODIFIERS.has(p as Modifier));
  const key = parts.find((p) => !MODIFIERS.has(p as Modifier)) ?? "k";
  return { modifiers, key };
}

function keyLabel(key: string): string {
  if (key === "enter") return "↵";
  if (key === "space") return "Space";
  return key.length === 1 ? key.toUpperCase() : key;
}

function isKeyMatch(event: KeyboardEvent, key: string): boolean {
  const pressed = event.key.toLowerCase();
  if (key === "space") return event.code === "Space";
  return (
    pressed === key ||
    event.code === `Key${key.toUpperCase()}` ||
    event.code === `Digit${key}`
  );
}

function matchesShortcut(event: KeyboardEvent, { modifiers, key }: ParsedShortcut, isMac: boolean): boolean {
  if (!isKeyMatch(event, key)) return false;
  const wanted = {
    meta: modifiers.includes("mod") && isMac,
    ctrl: modifiers.includes("ctrl") || (modifiers.includes("mod") && !isMac),
    alt: modifiers.includes("alt"),
    shift: modifiers.includes("shift"),
  };
  return (
    event.metaKey === wanted.meta &&
    event.ctrlKey === wanted.ctrl &&
    event.altKey === wanted.alt &&
    event.shiftKey === wanted.shift
  );
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT")
  );
}

function isModalDialogOpen(): boolean {
  if (typeof window !== "undefined" && window.__WATCHDOG_KERNEL__?.getState().licenseDrawerOpen) {
    return true;
  }
  if (typeof document !== "undefined" && document.querySelector('[role="dialog"]')) {
    return true;
  }
  return false;
}

export function CommandButton({
  className,
  children,
  shortcut = "r",
  global = true,
  variant = "primary",
  ...props
}: CommandButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isMac, setIsMac] = useState(false);
  const [keyDown, setKeyDown] = useState(false);
  const parsed = parseShortcut(shortcut);
  const parsedRef = useRef(parsed);
  parsedRef.current = parsed;

  useEffect(() => {
    const platform =
      (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
      navigator.platform ??
      "";
    setIsMac(APPLE_PLATFORM.test(platform));
  }, []);

  useEffect(() => {
    if (!global) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const current = parsedRef.current;
      const needsMod = current.modifiers.some((m) => m !== "shift");
      if (!needsMod && (isTypingTarget(event.target) || isModalDialogOpen())) return;
      if (!event.repeat && matchesShortcut(event, current, isMac) && !buttonRef.current?.disabled) {
        setKeyDown(true);
        event.preventDefault();
        buttonRef.current?.click();
      }
    };
    const handleKeyUp = () => setKeyDown(false);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleKeyUp);
    };
  }, [global, isMac]);

  const isPrimary = variant === "primary";

  return (
    <button
      ref={buttonRef}
      type="button"
      className={cn(
        "group/cmd inline-flex items-center gap-2.5 rounded-[3px] px-3.5 h-9 text-[13px] font-medium transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50",
        isPrimary
          ? "bg-[#141413] text-[#FCFBF8] hover:bg-[#2B2B28]"
          : "border border-[#DDD8CE] bg-[#FCFBF8] text-[#141413] hover:bg-[#EAE6DD] hover:border-[#C5BEB1]",
        className
      )}
      {...props}
    >
      {children}
      <kbd
        aria-hidden="true"
        className={cn(
          "hidden sm:inline-flex h-5 min-w-5 items-center justify-center rounded-[2px] px-1.5 font-mono text-[10.5px] leading-none transition-transform duration-75",
          isPrimary
            ? "border border-[#3A3D37] bg-[#1B1D1A] text-[#EAE8E1] shadow-[0_1.5px_0_0_#0A0B09]"
            : "border border-[#C5BEB1] bg-[#F4F2EC] text-[#47453F] shadow-[0_1.5px_0_0_#C5BEB1]",
          keyDown && "translate-y-[1.5px] shadow-none"
        )}
      >
        {keyLabel(parsed.key)}
      </kbd>
    </button>
  );
}
