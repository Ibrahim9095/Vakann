import type { Candidate, Job } from "@workspace/db";

export type MatchFactors = {
  category: number;
  city: number;
  skills: number;
  salary: number;
  activeBonus: number;
  filterBonus: number;
};

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const setB = new Set(b.map((s) => s.toLowerCase()));
  const intersection = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function salaryOverlap(job: Job, candidate: Candidate): number {
  if (job.salaryMin == null && job.salaryMax == null) return 1;
  if (candidate.salaryExpectation == null) return 0.5;
  const exp = candidate.salaryExpectation;
  const min = job.salaryMin ?? 0;
  const max = job.salaryMax ?? exp * 2;
  if (exp >= min && exp <= max) return 1;
  const dist = exp < min ? min - exp : exp - max;
  const range = Math.max(max - min, 1);
  return Math.max(0, 1 - dist / range);
}

export function candidatePassesJobFilters(job: Job, candidate: Candidate): boolean {
  if (job.requiresVoiceIntro && !candidate.voiceIntroUrl) return false;
  if (job.requiresHealthDeclaration && !candidate.hasMedicalRestriction && !candidate.hasDisabilityStatus) {
    // Job requires declaration — candidate must have answered (any value counts as declared)
    if (candidate.hasMedicalRestriction === false && candidate.hasDisabilityStatus === false) {
      // still valid — they declared "no" via profile fields
    }
  }
  if (job.requiresCreditDeclaration && candidate.hasFinancialIssues === undefined) {
    return false;
  }
  if (job.requiresNearbyLocation && job.city && candidate.city) {
    const sameCity = job.city.toLowerCase() === candidate.city.toLowerCase();
    const sameDistrict = job.address && candidate.district
      ? job.address.toLowerCase().includes(candidate.district.toLowerCase())
      : false;
    if (!sameCity && !sameDistrict) return false;
  }
  return true;
}

export function computeMatchScore(job: Job, candidate: Candidate): { score: number; factors: MatchFactors } {
  if (!candidatePassesJobFilters(job, candidate)) {
    return {
      score: 0,
      factors: { category: 0, city: 0, skills: 0, salary: 0, activeBonus: 0, filterBonus: 0 },
    };
  }

  const filterBonus =
    (job.requiresVoiceIntro && candidate.voiceIntroUrl ? 3 : 0) +
    (job.requiresNearbyLocation && job.city === candidate.city ? 2 : 0);

  const factors: MatchFactors = {
    category: job.category === candidate.category ? 40 : 0,
    city: job.city && candidate.city && job.city.toLowerCase() === candidate.city.toLowerCase() ? 15 : 0,
    skills: Math.round(jaccard(candidate.skills, parseSkillsFromJob(job)) * 25),
    salary: Math.round(salaryOverlap(job, candidate) * 15),
    activeBonus: candidate.isActive && !candidate.isSuspendedByAdmin ? 5 : 0,
    filterBonus,
  };

  const score = Math.min(
    100,
    factors.category + factors.city + factors.skills + factors.salary + factors.activeBonus + factors.filterBonus,
  );

  return { score, factors };
}

function parseSkillsFromJob(job: Job): string[] {
  const text = `${job.requirements ?? ""} ${job.description ?? ""}`.toLowerCase();
  const common = ["javascript", "typescript", "react", "python", "java", "sql", "node", "css", "html"];
  return common.filter((s) => text.includes(s));
}

export const MATCH_NOTIFY_THRESHOLD = 60;

export function countMatchingCandidates(job: Job, candidates: Candidate[]): number {
  return candidates.filter((c) => {
    const { score } = computeMatchScore(job, c);
    return score >= MATCH_NOTIFY_THRESHOLD;
  }).length;
}
