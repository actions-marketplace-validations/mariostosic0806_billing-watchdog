import { useSyncExternalStore } from "react";

export type EdgeFilterKey =
  | "ALL"
  | "BURST"
  | "OOO"
  | "MANUAL"
  | "MULTI"
  | "DELETED"
  | "DISPUTE"
  | "ARITH"
  | "STREAM";

export interface ChaosRow {
  key: Exclude<EdgeFilterKey, "ALL">;
  edgeNum: string;
  plainTitle: string;
  impactTag: string;
  kpiDelta: string;
  vector: string;
  naive: string;
  watchdog: string;
  ruleCodes: string[];
}

export interface OscilloscopeTick {
  index: number;
  tLabel: string;
  phase: Exclude<EdgeFilterKey, "ALL">;
  phaseLabel: string;
  naiveCentsDelta: number;
  naiveCreditsDelta: number;
  cumulativeNaiveCents: number;
  cumulativeNaiveCredits: number;
  watchdogAction: string;
  breakerState: "ARMED" | "TRIPPED" | "QUARANTINED";
  isTripPoint: boolean;
}

export interface QuarantinedAccount {
  userId: string;
  leakCents: number;
  reason: string;
}

export interface LinterFinding {
  sev: "CRITICAL" | "HIGH";
  title: string;
  code: string;
  table: string;
  line: number;
  msg: string;
  diffRemove: string;
  diffAdd: string;
}

export interface ReconcilerCheck {
  id: string;
  code: string;
  title: string;
  entity: string;
  dbState: string;
  stripeTruth: string;
  variance: string;
  action: string;
  exposureCents: number;
  conservation?: {
    free: number;
    paid: number;
    used: number;
    expectedMax: number;
    actual: number;
    delta: number;
  };
}

export interface PolarNotice {
  itemName: string;
  amountCents: number;
  displayUsd: string;
  tierCode: string;
  mailtoHref: string;
}

export interface WatchdogKernelState {
  isProLicenseUnlocked: boolean;
  licenseLabel: string;
  licenseStatusKind: "free" | "ok" | "warn" | "error" | "info";
  licenseStatusText: string;
  licenseStatusHtml: string;
  licenseDrawerOpen: boolean;
  licenseKeyDraft: string;
  polarNotice: PolarNotice | null;
  chaos: {
    filter: EdgeFilterKey;
    planPriceCents: number;
    planCredits: number;
    monthlySubs: number;
    quarantineThresholdCents: number;
    naiveLeakedCredits: number;
    naiveLeakedCents: number;
    annualDriftCents: number;
    quarantinedAccounts: QuarantinedAccount[];
    rows: ChaosRow[];
    filteredRows: ChaosRow[];
    eventLog: string;
    logSections: Array<{ key: string; lines: string[] }>;
    quarantineSql: string;
    oscilloscopeTicks: OscilloscopeTick[];
  };
  linter: {
    activePreset: string;
    sqlInput: string;
    isCodeMode: boolean;
    findings: LinterFinding[];
    patchOutput: string;
    lintMs: number;
  };
  reconciler: {
    rawReport: string;
    checks: ReconcilerCheck[];
  };
}

export interface WatchdogKernelApi {
  getState: () => WatchdogKernelState;
  subscribe: (listener: () => void) => () => void;
  runChaosSimulation: (filterMode?: EdgeFilterKey) => void;
  setChaosParams: (partial: {
    planPriceCents?: number;
    planCredits?: number;
    monthlySubs?: number;
    quarantineThresholdCents?: number;
  }) => void;
  loadSampleSql: (mode: "vulnerable" | "rls_idor" | "nextjs" | "hardened") => void;
  setSqlInput: (sqlText: string) => void;
  runSqlLinter: (codeOverride?: string) => void;
  unlockProPortal: (explicitKey?: string) => boolean;
  verifyEd25519LicenseInBrowser: (rawKey: string, overrideSpkiB64?: string) => Promise<boolean>;
  startPolarCheckout: (itemName: string, amountCents: number) => boolean;
  setLicenseDrawerOpen: (open: boolean) => void;
  setLicenseKeyDraft: (draft: string) => void;
  copyPatch: () => boolean;
  downloadPatch: () => boolean;
  copyQuarantineSql: () => boolean;
  toggleGroupBDemo: () => void;
}

declare global {
  interface Window {
    __WATCHDOG_REACT_MOUNTED__?: boolean;
    __WATCHDOG_KERNEL__?: WatchdogKernelApi;
  }
}

export function getKernel(): WatchdogKernelApi {
  const api = window.__WATCHDOG_KERNEL__;
  if (!api) {
    throw new Error("Billing Watchdog kernel not initialized.");
  }
  return api;
}

export function useKernelState(): WatchdogKernelState {
  const kernel = getKernel();
  return useSyncExternalStore(kernel.subscribe, kernel.getState, kernel.getState);
}

export function formatUsdCents(cents: number): string {
  return "$" + (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
