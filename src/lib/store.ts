import { Redis } from "@upstash/redis";
import { AuditResult } from "./types";

interface StoredAudit {
  result: AuditResult;
  paid: boolean;
  stripeSessionId?: string;
}

// ---- Redis client (production) ----
function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return new Redis({ url, token });
  }
  return null;
}

// TTL for audit entries: 24 hours
const TTL_SECONDS = 60 * 60 * 24;

// ---- In-memory fallback (dev only) ----
const globalStore = globalThis as typeof globalThis & {
  __auditStore?: Map<string, StoredAudit>;
};
if (!globalStore.__auditStore) {
  globalStore.__auditStore = new Map<string, StoredAudit>();
}
const memoryStore = globalStore.__auditStore;

function redisKey(id: string): string {
  return `audit:${id}`;
}

export const auditStore = {
  async get(id: string): Promise<StoredAudit | undefined> {
    const redis = getRedis();
    if (redis) {
      const data = await redis.get<StoredAudit>(redisKey(id));
      return data ?? undefined;
    }
    return memoryStore.get(id);
  },

  async getResult(id: string): Promise<AuditResult | undefined> {
    const entry = await this.get(id);
    return entry?.result;
  },

  async isPaid(id: string): Promise<boolean> {
    const entry = await this.get(id);
    return entry?.paid ?? false;
  },

  async set(id: string, result: AuditResult): Promise<void> {
    const entry: StoredAudit = { result, paid: false };
    const redis = getRedis();
    if (redis) {
      await redis.set(redisKey(id), entry, { ex: TTL_SECONDS });
      return;
    }
    // Dev fallback
    memoryStore.set(id, entry);
    if (memoryStore.size > 1000) {
      const oldestKey = memoryStore.keys().next().value;
      if (oldestKey) memoryStore.delete(oldestKey);
    }
  },

  async markPaid(id: string, stripeSessionId?: string): Promise<boolean> {
    const redis = getRedis();
    if (redis) {
      const entry = await redis.get<StoredAudit>(redisKey(id));
      if (!entry) return false;
      entry.paid = true;
      if (stripeSessionId) entry.stripeSessionId = stripeSessionId;
      await redis.set(redisKey(id), entry, { ex: TTL_SECONDS });
      return true;
    }
    // Dev fallback
    const entry = memoryStore.get(id);
    if (!entry) return false;
    entry.paid = true;
    if (stripeSessionId) entry.stripeSessionId = stripeSessionId;
    return true;
  },
};
