import type { PoolConfig } from "@/src/config/pools";

export type Notice = {
  readonly id: string;
  readonly swpId: number;
  readonly poolName: string;
  readonly sourceUrl: string;
  readonly startAt: string;
  readonly endAt: string | null;
  readonly facilities: string;
  readonly reason: string;
  readonly remarks: string;
  readonly kind: "temporary-closure";
};

export type PoolCheck = {
  readonly pool: PoolConfig;
  readonly sourceUrl: string;
  readonly notices: readonly Notice[];
  readonly checkedAt: string;
  readonly error?: string;
};

export type StoredPushSubscription = {
  readonly endpoint: string;
  readonly expirationTime?: number | null;
  readonly keys: {
    readonly p256dh: string;
    readonly auth: string;
  };
};
