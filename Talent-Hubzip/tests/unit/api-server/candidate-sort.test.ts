import { describe, expect, it } from "vitest";

function sortCandidates(rows: Array<{ subscriptionTier: string; averageRating: number | null; createdAt: Date }>) {
  const tierOrder = { vip: 0, time_limited: 1, free: 2 };
  return [...rows].sort((a, b) => {
    const ta = tierOrder[a.subscriptionTier as keyof typeof tierOrder] ?? 2;
    const tb = tierOrder[b.subscriptionTier as keyof typeof tierOrder] ?? 2;
    if (ta !== tb) return ta - tb;
    if (ta === 2 && tb === 2) {
      return b.createdAt.getTime() - a.createdAt.getTime();
    }
    return (b.averageRating ?? 0) - (a.averageRating ?? 0);
  });
}

describe("free-tier candidate sorting", () => {
  it("sorts free candidates by createdAt desc within tier", () => {
    const sorted = sortCandidates([
      { subscriptionTier: "free", averageRating: 5, createdAt: new Date("2026-01-01") },
      { subscriptionTier: "free", averageRating: 1, createdAt: new Date("2026-06-01") },
      { subscriptionTier: "vip", averageRating: 0, createdAt: new Date("2026-01-01") },
    ]);
    expect(sorted[0].subscriptionTier).toBe("vip");
    expect(sorted[1].createdAt.getMonth()).toBe(5);
  });
});
