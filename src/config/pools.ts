export const LCSD_SWIMMING_URL =
  "https://www.lcsd.gov.hk/clpss/en/webApp/Swimming.do";

export type PoolConfig = {
  readonly swpId: number;
  readonly name: string;
  readonly enabled: boolean;
  readonly phone?: string;
};

// Add a pool here and redeploy. The poller and UI both consume this list.
export const pools: readonly PoolConfig[] = [
  {
    swpId: 4,
    name: "Morrison Hill Swimming Pool",
    enabled: true,
    phone: "2575 3028 / 2891 7335",
  },
  {
    swpId: 5,
    name: "Victoria Park Swimming Pool",
    enabled: true,
    phone: "2570 8347",
  },
];

export function getPoolUrl(pool: Pick<PoolConfig, "swpId">): string {
  return `${LCSD_SWIMMING_URL}?swpId=${pool.swpId}`;
}
