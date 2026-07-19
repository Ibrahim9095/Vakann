import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";

type Crumb = { label: string; href?: string };

const ROUTE_LABELS: Record<string, Record<string, string>> = {
  "/dashboard/hr": {
    "/": "Göstəricilər",
    "/company": "Şirkət Profili",
    "/jobs": "Vakansiyalarım",
    "/jobs/new": "Yeni Vakansiya",
    "/candidates": "Namizədlər",
    "/applications": "Müraciətlər",
    "/contact-requests": "Əlaqə Sorğuları",
    "/subscriptions": "HR Premium",
  },
  "/dashboard/candidate": {
    "/": "Göstəricilər",
    "/profile": "Profilim",
    "/applications": "Müraciətlərim",
    "/contact-requests": "Gələn Sorğular",
    "/subscriptions": "Abunəliklər",
    "/checkout": "Ödəniş",
    "/recommended": "Tövsiyələr",
    "/notifications": "Bildirişlər",
  },
  "/dashboard/admin": {
    "/": "Ümumi Baxış",
    "/users": "İstifadəçilər",
    "/jobs": "Vakansiyalar",
    "/candidates": "Namizədlər",
    "/companies": "Şirkətlər",
  },
};

function resolveRelativePath(basePath: string, location: string): string {
  if (location === basePath || location === `${basePath}/`) return "/";
  if (location.startsWith(`${basePath}/`)) {
    return location.slice(basePath.length);
  }
  return location;
}

function buildCrumbs(basePath: string, location: string): Crumb[] {
  const panelLabel =
    basePath === "/dashboard/admin"
      ? "Admin Paneli"
      : basePath === "/dashboard/hr"
        ? "HR Paneli"
        : "Namizəd Paneli";

  const relative = resolveRelativePath(basePath, location);
  const labels = ROUTE_LABELS[basePath] ?? {};

  if (relative === "/") {
    return [{ label: panelLabel }];
  }

  if (relative.match(/^\/jobs\/\d+\/edit$/)) {
    return [
      { label: panelLabel, href: basePath },
      { label: labels["/jobs"] ?? "Vakansiyalar", href: `${basePath}/jobs` },
      { label: "Redaktə" },
    ];
  }

  const label = labels[relative] ?? relative.replace(/^\//, "");
  return [
    { label: panelLabel, href: basePath },
    { label },
  ];
}

export function DashboardBreadcrumb({ basePath }: { basePath: string }) {
  const [location] = useLocation();
  const crumbs = buildCrumbs(basePath, location);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
      <Home className="h-3.5 w-3.5 shrink-0" />
      {crumbs.map((crumb, i) => (
        <span key={`${crumb.label}-${i}`} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
          {crumb.href && i < crumbs.length - 1 ? (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span className={i === crumbs.length - 1 ? "text-foreground font-medium" : ""}>
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function isNavLinkActive(location: string, href: string): boolean {
  if (href.match(/\/dashboard\/(hr|candidate|admin)$/)) {
    return location === href || location === `${href}/`;
  }
  return location === href || location.startsWith(`${href}/`);
}
