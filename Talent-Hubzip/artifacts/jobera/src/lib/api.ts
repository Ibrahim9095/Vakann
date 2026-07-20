const BASE =
  import.meta.env.PROD
    ? "https://vakann-api.onrender.com"
    : "";
    

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("jobera_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export type Package = {
  id: number;
  name: string;
  tier: string;
  audience?: string;
  description: string | null;
  price: number;
  currency: string;
  durationDays: number;
  mediaViewLimit?: number;
  features: string[];
};

export type Payment = {
  id: number;
  packageId: number;
  amount: number;
  currency: string;
  status: string;
  contactRequestId?: number | null;
  package?: Package | null;
};

export type Notification = {
  id: number;
  type: string;
  title: string;
  body: string | null;
  status: string;
  createdAt: string;
  readAt?: string | null;
};

export async function createPayment(packageId: number, contactRequestId?: number, companyId?: number) {
  return apiFetch<Payment & { paymentUrl?: string | null }>("/api/payments/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packageId, contactRequestId, companyId }),
  });
}

export async function confirmPayment(paymentId: number) {
  return apiFetch<Payment>("/api/payments/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentId }),
  });
}

export async function listPayments() {
  return apiFetch<Payment[]>("/api/payments");
}

export async function listNotifications() {
  return apiFetch<Notification[]>("/api/notifications");
}

export async function markNotificationRead(id: number) {
  return apiFetch<Notification>(`/api/notifications/${id}/read`, { method: "PATCH" });
}

export async function uploadFile(file: File, durationSec?: number): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  if (durationSec != null) form.append("durationSec", String(durationSec));
  const res = await fetch(`${BASE}/api/uploads`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error ?? "Upload failed");
  }
  return res.json();
}

export function dashboardPathForRole(role: string) {
  if (role === "admin") return "/dashboard/admin";
  if (role === "hr") return "/dashboard/hr";
  return "/dashboard/candidate";
}

export type JobMatch = {
  id: number;
  jobId: number;
  candidateId: number;
  score: number;
  factors: Record<string, number>;
  candidate?: { id: number; fullName: string; title: string | null; category: string } | null;
};

export type RecommendedJob = {
  id: number;
  jobId: number;
  score: number;
  job?: { id: number; title: string; city: string | null; category: string } | null;
};

export type MediaQuota = {
  companyId: number;
  tier: string;
  mediaViewLimit: number;
  mediaViewsUsed: number;
  expiresAt: string | null;
  isActive: boolean;
};

export async function listHrPackages() {
  return apiFetch<Package[]>("/api/packages?audience=hr");
}

export async function getJobMatches(jobId: number) {
  return apiFetch<JobMatch[]>(`/api/jobs/${jobId}/matches`);
}

export async function getRecommendedJobs() {
  return apiFetch<RecommendedJob[]>("/api/candidates/me/recommended-jobs");
}

export async function getCompanySubscription() {
  return apiFetch<{
    subscription: unknown;
    quota: MediaQuota;
    company: { id: number; name: string };
  }>("/api/companies/me/subscription");
}

export async function getJobMatchCount(jobId: number) {
  return apiFetch<{ jobId: number; count: number }>(`/api/jobs/${jobId}/match-count`);
}

export async function shareJob(jobId: number, channels?: string[]) {
  return apiFetch<{ success: boolean }>(`/api/jobs/${jobId}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channels }),
  });
}

export async function applyToJob(data: {
  jobId: number;
  coverLetter?: string;
  voiceApplicationUrl?: string;
  voiceDurationSec?: number;
}) {
  return apiFetch<unknown>("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function listCandidateRatings(candidateId: number) {
  return apiFetch<Array<{
    id: number;
    stars: number;
    comment: string | null;
    company?: { name: string } | null;
    createdAt: string;
  }>>(`/api/ratings?candidateId=${candidateId}`);
}

export async function getRatingEligibility(candidateId: number) {
  return apiFetch<{ allowed: boolean; reason?: string }>(
    `/api/ratings/eligibility?candidateId=${candidateId}`,
  );
}

export async function recordMediaView(candidateId: number, mediaType: "voice" | "video") {
  const res = await fetch(`${BASE}/api/candidates/${candidateId}/media-view`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mediaType }),
  });
  if (res.status === 402) {
    const data = await res.json();
    throw Object.assign(new Error("limit_exceeded"), { status: 402, data });
  }
  if (!res.ok) throw new Error("Media view failed");
  return res.json() as Promise<{ allowed: boolean; quota: MediaQuota }>;
}
