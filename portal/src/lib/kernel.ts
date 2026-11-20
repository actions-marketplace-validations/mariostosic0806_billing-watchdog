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

export type SampleSqlPresetMode =
  | "vulnerable"
  | "rls_idor"
  | "nextjs"
  | "orm"
  | "drizzle"
  | "prisma"
  | "hardened";

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

export interface SubscriptionDiffRow {
  classification: "ZOMBIE_SUBSCRIPTION" | "MISSING_IN_STRIPE" | "PAST_DUE_GRACE";
  subId: string;
  ownerId: string;
  dbStatus: string;
  stripeStatus: string;
  monthlyBleedCents: number;
  currency: string;
}

export interface SubscriptionDiffResult {
  stripeInput: string;
  dbInput: string;
  stripeRowsCount: number;
  dbRowsCount: number;
  rows: SubscriptionDiffRow[];
  zombieCount: number;
  missingInStripeCount: number;
  pastDueGraceCount: number;
  totalMonthlyBleedCents: number;
  dryRunSelectSql: string;
  remediationSql: string;
  parseError: string | null;
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
    sourceKind?: "sql" | "ts" | "drizzle" | "prisma";
    findings: LinterFinding[];
    patchOutput: string;
    patchStep1Transactional: string;
    patchStep2Concurrent: string;
    lintMs: number;
  };
  reconciler: {
    rawReport: string;
    checks: ReconcilerCheck[];
    diff: SubscriptionDiffResult;
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
  loadSampleSql: (mode: SampleSqlPresetMode) => void;
  setSqlInput: (sqlText: string) => void;
  runSqlLinter: (codeOverride?: string) => void;
  unlockProPortal: (explicitKey?: string) => boolean;
  verifyEd25519LicenseInBrowser: (rawKey: string, overrideSpkiB64?: string) => Promise<boolean>;
  startPolarCheckout: (itemName: string, amountCents: number) => boolean;
  setLicenseDrawerOpen: (open: boolean) => void;
  setLicenseKeyDraft: (draft: string) => void;
  copyPatch: (stepFilter?: 1 | 2) => boolean;
  downloadPatch: () => boolean;
  copyQuarantineSql: () => boolean;
  toggleGroupBDemo: () => void;
  runSubscriptionDiffReconciler: (stripeRaw?: string, dbRaw?: string) => SubscriptionDiffResult;
  loadSampleZombieDiff: () => SubscriptionDiffResult;
  copyDiffSql: () => boolean;
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
  const safe = Number.isSafeInteger(cents) ? cents : Math.trunc(Number(cents) || 0);
  const sign = safe < 0 ? "-" : "";
  const abs = Math.abs(safe);
  const whole = Math.trunc(abs / 100);
  const minor = abs % 100;
  return sign + "$" + whole.toLocaleString("en-US") + "." + String(minor).padStart(2, "0");
}
