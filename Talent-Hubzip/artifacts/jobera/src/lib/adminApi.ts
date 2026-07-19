// Admin API utility – plain fetch with auth token (no Orval hooks for admin routes)

const BASE = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`;

function getToken() {
  return localStorage.getItem("jobera_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json();
}

// ── Stats ──────────────────────────────────────────────────────────────────────
export interface AdminStats {
  totalUsers: number;
  bannedUsers: number;
  totalJobs: number;
  activeJobs: number;
  suspendedJobs: number;
  totalCandidates: number;
  suspendedCandidates: number;
  totalCompanies: number;
  totalApplications: number;
  totalSubscriptions: number;
}

export const adminGetStats = () => request<AdminStats>("/admin/stats");

// ── Users ──────────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  avatarUrl: string | null;
  isBanned: boolean;
  createdAt: string;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const adminGetUsers = (params?: { role?: string; search?: string; page?: number }) => {
  const q = new URLSearchParams();
  if (params?.role) q.set("role", params.role);
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  return request<PagedResult<AdminUser>>(`/admin/users?${q}`);
};

export const adminUpdateUser = (id: number, data: { isBanned?: boolean; role?: string }) =>
  request<AdminUser>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(data) });

export const adminDeleteUser = (id: number) =>
  request<{ success: boolean }>(`/admin/users/${id}`, { method: "DELETE" });

// ── Jobs ───────────────────────────────────────────────────────────────────────
export interface SocialPost {
  id: number;
  jobId: number;
  channel: string;
  status: string;
  externalPostId: string | null;
  error: string | null;
}

export interface AdminJob {
  id: number;
  companyId: number;
  title: string;
  category: string;
  city: string | null;
  employmentType: string;
  isActive: boolean;
  isSuspendedByAdmin: boolean;
  adminNote: string | null;
  viewCount: number;
  applicationCount: number;
  createdAt: string;
  company: { id: number; name: string; logoUrl: string | null } | null;
  socialPosts?: SocialPost[];
}

export const adminGetJobs = (params?: { search?: string; status?: string; page?: number }) => {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.status) q.set("status", params.status);
  if (params?.page) q.set("page", String(params.page));
  return request<PagedResult<AdminJob>>(`/admin/jobs?${q}`);
};

export const adminUpdateJob = (id: number, data: { isSuspendedByAdmin?: boolean; adminNote?: string; isActive?: boolean }) =>
  request<AdminJob>(`/admin/jobs/${id}`, { method: "PATCH", body: JSON.stringify(data) });

export const adminDeleteJob = (id: number) =>
  request<{ success: boolean }>(`/admin/jobs/${id}`, { method: "DELETE" });

export const adminRetrySocialPost = (postId: number) =>
  request<SocialPost>(`/admin/social-posts/${postId}/retry`, { method: "POST" });

// ── Candidates ─────────────────────────────────────────────────────────────────
export interface AdminCandidate {
  id: number;
  userId: number;
  fullName: string;
  category: string;
  city: string | null;
  subscriptionTier: string;
  isActive: boolean;
  isSuspendedByAdmin: boolean;
  adminNote: string | null;
  averageRating: number | null;
  totalRatings: number;
  createdAt: string;
  user: { id: number; email: string; isBanned: boolean } | null;
}

export const adminGetCandidates = (params?: { search?: string; status?: string; page?: number }) => {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.status) q.set("status", params.status);
  if (params?.page) q.set("page", String(params.page));
  return request<PagedResult<AdminCandidate>>(`/admin/candidates?${q}`);
};

export const adminUpdateCandidate = (id: number, data: { isSuspendedByAdmin?: boolean; adminNote?: string }) =>
  request<AdminCandidate>(`/admin/candidates/${id}`, { method: "PATCH", body: JSON.stringify(data) });

// ── Companies ──────────────────────────────────────────────────────────────────
export interface AdminCompany {
  id: number;
  userId: number;
  name: string;
  sector: string | null;
  city: string | null;
  isVerified: boolean;
  jobCount: number;
  createdAt: string;
  hrUser: { id: number; email: string; fullName: string } | null;
}

export const adminGetCompanies = (params?: { search?: string; page?: number }) => {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  return request<PagedResult<AdminCompany>>(`/admin/companies?${q}`);
};

export const adminUpdateCompany = (id: number, data: { isVerified?: boolean }) =>
  request<AdminCompany>(`/admin/companies/${id}`, { method: "PATCH", body: JSON.stringify(data) });
