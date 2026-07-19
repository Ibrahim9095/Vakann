import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Candidate } from "@workspace/db";

vi.mock("@workspace/db", () => {
  const chain = () => ({
    from: () => ({
      where: () => Promise.resolve([]),
    }),
  });

  return {
    db: {
      select: chain,
      insert: () => ({
        values: () => ({
          returning: () => Promise.resolve([{ id: 1 }]),
        }),
      }),
      update: () => ({
        set: () => ({
          where: () => Promise.resolve(),
        }),
      }),
    },
    candidatesTable: {},
    contactAccessGrantsTable: {},
    contactRequestsTable: {},
    usersTable: {},
  };
});

import { applyBlurToCandidate, shouldBlurCandidate } from "../../../artifacts/api-server/src/lib/blur";

function baseCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: 1,
    userId: 10,
    fullName: "John Doe",
    avatarUrl: null,
    category: "it",
    title: "Developer",
    summary: null,
    city: "Baku",
    district: null,
    metroStation: null,
    salaryExpectation: null,
    currency: "AZN",
    experienceYears: null,
    education: null,
    languages: [],
    skills: [],
    contactEmail: "john@example.com",
    contactPhone: "+994501234567",
    cvUrl: "/uploads/cv.pdf",
    voiceIntroUrl: null,
    videoIntroUrl: null,
    hasDisabilityStatus: false,
    hasMedicalRestriction: false,
    hasFinancialIssues: false,
    isContactBlurred: true,
    subscriptionTier: "free",
    subscriptionExpiresAt: null,
    averageRating: null,
    totalRatings: 0,
    profileViews: 0,
    isActive: true,
    isSuspendedByAdmin: false,
    adminNote: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("applyBlurToCandidate", () => {
  it("returns full contact when blur is off", () => {
    const candidate = baseCandidate();
    const result = applyBlurToCandidate(candidate, false, {
      contactEmail: "visible@example.com",
      contactPhone: "+994501111111",
    });

    expect(result.canViewContact).toBe(true);
    expect(result.contactEmail).toBe("visible@example.com");
    expect(result.contactPhone).toBe("+994501111111");
    expect(result.fullName).toBe("John Doe");
  });

  it("masks PII when blur is on", () => {
    const candidate = baseCandidate();
    const result = applyBlurToCandidate(candidate, true, {
      contactEmail: "john@example.com",
      contactPhone: "+994501234567",
    });

    expect(result.canViewContact).toBe(false);
    expect(result.contactEmail).toBeNull();
    expect(result.contactPhone).toBeNull();
    expect(result.cvUrl).toBeNull();
    expect(result.userId).toBe(0);
    expect(result.fullName.startsWith("J")).toBe(true);
  });
});

describe("shouldBlurCandidate", () => {
  it("does not blur for profile owner", async () => {
    const candidate = baseCandidate({ userId: 10 });
    const result = await shouldBlurCandidate(candidate, {
      viewer: { id: 10, role: "candidate" } as never,
    });
    expect(result).toBe(false);
  });

  it("does not blur for admin", async () => {
    const candidate = baseCandidate();
    const result = await shouldBlurCandidate(candidate, {
      viewer: { id: 99, role: "admin" } as never,
    });
    expect(result).toBe(false);
  });

  it("does not blur active VIP with contact unblurred", async () => {
    const candidate = baseCandidate({
      subscriptionTier: "vip",
      isContactBlurred: false,
    });
    const result = await shouldBlurCandidate(candidate, { viewer: null });
    expect(result).toBe(false);
  });

  it("blurs anonymous viewer when contact is blurred", async () => {
    const candidate = baseCandidate({ isContactBlurred: true });
    const result = await shouldBlurCandidate(candidate, { viewer: null });
    expect(result).toBe(true);
  });
});
