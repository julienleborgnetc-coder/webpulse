import { AuditResult } from "./types";

interface StoredAudit {
  result: AuditResult;
  paid: boolean;
  stripeSessionId?: string;
}

// Use globalThis to persist store across module re-evaluations in dev mode
const globalStore = globalThis as typeof globalThis & {
  __auditStore?: Map<string, StoredAudit>;
};

if (!globalStore.__auditStore) {
  globalStore.__auditStore = new Map<string, StoredAudit>();
}

const store = globalStore.__auditStore;

export const auditStore = {
  get(id: string): StoredAudit | undefined {
    return store.get(id);
  },

  getResult(id: string): AuditResult | undefined {
    return store.get(id)?.result;
  },

  isPaid(id: string): boolean {
    return store.get(id)?.paid ?? false;
  },

  set(id: string, result: AuditResult): void {
    store.set(id, { result, paid: false });
    // Clean old entries (keep last 1000)
    if (store.size > 1000) {
      const oldestKey = store.keys().next().value;
      if (oldestKey) store.delete(oldestKey);
    }
  },

  markPaid(id: string, stripeSessionId?: string): boolean {
    const entry = store.get(id);
    if (!entry) return false;
    entry.paid = true;
    if (stripeSessionId) entry.stripeSessionId = stripeSessionId;
    return true;
  },
};
