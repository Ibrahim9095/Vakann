export type JobSocialContext = {
  title: string;
  companyName: string;
  city?: string | null;
  employmentType?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  jobUrl?: string;
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Tam ştat",
  part_time: "Yarım ştat",
  remote: "Remote",
  hybrid: "Hibrid",
  internship: "Təcrübə",
};

function formatSalary(ctx: JobSocialContext): string | null {
  const { salaryMin, salaryMax, currency = "AZN" } = ctx;
  if (salaryMin && salaryMax) return `${salaryMin}–${salaryMax} ${currency}`;
  if (salaryMin) return `${salaryMin}+ ${currency}`;
  if (salaryMax) return `≤${salaryMax} ${currency}`;
  return null;
}

export function buildJobSocialCaption(ctx: JobSocialContext): string {
  const lines = [
    `🆕 ${ctx.title}`,
    `🏢 ${ctx.companyName}`,
  ];
  if (ctx.city) lines.push(`📍 ${ctx.city}`);
  const emp = ctx.employmentType ? EMPLOYMENT_LABELS[ctx.employmentType] ?? ctx.employmentType : null;
  if (emp) lines.push(`💼 ${emp}`);
  const salary = formatSalary(ctx);
  if (salary) lines.push(`💰 ${salary}`);
  lines.push("", "Jobera.az ilə müraciət edin 👇");
  if (ctx.jobUrl) lines.push(ctx.jobUrl);
  return lines.join("\n");
}

export function buildJobCardSvg(ctx: JobSocialContext): string {
  const title = escapeXml(ctx.title.slice(0, 60));
  const company = escapeXml(ctx.companyName.slice(0, 40));
  const city = ctx.city ? escapeXml(ctx.city) : "";
  const salary = formatSalary(ctx);
  const salaryLine = salary ? escapeXml(salary) : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e40af"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <text x="80" y="140" fill="#93c5fd" font-family="Arial,sans-serif" font-size="36" font-weight="700">JOBERA.AZ</text>
  <text x="80" y="280" fill="#ffffff" font-family="Arial,sans-serif" font-size="56" font-weight="700">${title}</text>
  <text x="80" y="360" fill="#e2e8f0" font-family="Arial,sans-serif" font-size="40">${company}</text>
  ${city ? `<text x="80" y="440" fill="#cbd5e1" font-family="Arial,sans-serif" font-size="32">📍 ${city}</text>` : ""}
  ${salaryLine ? `<text x="80" y="520" fill="#fbbf24" font-family="Arial,sans-serif" font-size="36">💰 ${salaryLine}</text>` : ""}
  <rect x="80" y="880" width="320" height="72" rx="12" fill="#f59e0b"/>
  <text x="110" y="928" fill="#0f172a" font-family="Arial,sans-serif" font-size="28" font-weight="700">İndi müraciət et</text>
</svg>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
