import { describe, it, expect } from "vitest";
import type { Candidate, Job } from "@workspace/db";
import { computeMatchScore, MATCH_NOTIFY_THRESHOLD } from "../../../artifacts/api-server/src/lib/matching/score";

function job(overrides: Partial<Job> = {}): Job {
  return {
    id: 1,
    companyId: 1,
    title: "Frontend Dev",
    category: "it",
    description: "React typescript developer needed",
    requirements: "javascript react",
    city: "baku",
    address: null,
    employmentType: "full_time",
    salaryMin: 1000,
    salaryMax: 2000,
    currency: "AZN",
    isActive: true,
    isSuspendedByAdmin: false,
    adminNote: null,
    viewCount: 0,
    applicationCount: 0,
    requiresVoiceIntro: false,
    voicePrompt: null,
    requiresNearbyLocation: false,
    jobLat: null,
    jobLng: null,
    radiusKm: null,
    requiresHealthDeclaration: false,
    requiresCreditDeclaration: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function candidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: 1,
    userId: 10,
    fullName: "Ali",
    avatarUrl: null,
    category: "it",
    title: "Dev",
    summary: null,
    city: "baku",
    district: null,
    metroStation: null,
    salaryExpectation: 1500,
    currency: "AZN",
    experienceYears: 3,
    education: null,
    languages: [],
    skills: ["javascript", "react"],
    contactEmail: null,
    contactPhone: null,
    cvUrl: null,
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

describe("computeMatchScore", () => {
  it("scores high for matching category, city, skills", () => {
    const { score } = computeMatchScore(job(), candidate());
    expect(score).toBeGreaterThanOrEqual(MATCH_NOTIFY_THRESHOLD);
  });

  it("scores low for category mismatch", () => {
    const { score } = computeMatchScore(job({ category: "finance" }), candidate());
    expect(score).toBeLessThan(MATCH_NOTIFY_THRESHOLD);
  });
});
