import { describe, it, expect, vi, beforeEach } from "vitest";

const mockBroadcast = vi.fn();
let counterValue = 0;

vi.mock("../../../artifacts/api-server/src/lib/events/sse", () => ({
  broadcastSseEvent: (...args: unknown[]) => mockBroadcast(...args),
}));

vi.mock("@workspace/db", () => ({
  INTERVIEW_CHANCES_COUNTER_KEY: "interview_chances",
  platformCountersTable: { key: "key", value: "value" },
  db: {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve(counterValue === 0 ? [] : [{ key: "interview_chances", value: counterValue }]),
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([{ key: "interview_chances", value: 1 }]),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
  },
}));

import { incrementInterviewChances } from "../../../artifacts/api-server/src/lib/platform/counters";

describe("incrementInterviewChances", () => {
  beforeEach(() => {
    counterValue = 0;
    mockBroadcast.mockClear();
  });

  it("creates counter and broadcasts SSE on first increment", async () => {
    const value = await incrementInterviewChances();
    expect(value).toBe(1);
    expect(mockBroadcast).toHaveBeenCalledWith("interview_chances", { value: 1 });
  });
});
