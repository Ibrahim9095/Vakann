import { describe, expect, it } from "vitest";
import path from "node:path";
import { readFileSync } from "node:fs";

type PanelRoutes = {
  base: string;
  sidebarHrefs: string[];
  routerPaths: string[];
  dynamicPatterns?: RegExp[];
};

const PANELS: PanelRoutes[] = [
  {
    base: "/dashboard/candidate",
    sidebarHrefs: [
      "/dashboard/candidate",
      "/dashboard/candidate/profile",
      "/dashboard/candidate/applications",
      "/dashboard/candidate/contact-requests",
      "/dashboard/candidate/subscriptions",
      "/dashboard/candidate/recommended",
      "/dashboard/candidate/notifications",
    ],
    routerPaths: [
      "/",
      "/profile",
      "/applications",
      "/contact-requests",
      "/subscriptions",
      "/checkout",
      "/notifications",
      "/recommended",
    ],
  },
  {
    base: "/dashboard/hr",
    sidebarHrefs: [
      "/dashboard/hr",
      "/dashboard/hr/company",
      "/dashboard/hr/jobs",
      "/dashboard/hr/candidates",
      "/dashboard/hr/applications",
      "/dashboard/hr/contact-requests",
      "/dashboard/hr/subscriptions",
    ],
    routerPaths: [
      "/",
      "/company",
      "/jobs",
      "/jobs/new",
      "/candidates",
      "/applications",
      "/contact-requests",
      "/subscriptions",
    ],
    dynamicPatterns: [/^\/jobs\/\d+\/edit$/],
  },
  {
    base: "/dashboard/admin",
    sidebarHrefs: [
      "/dashboard/admin",
      "/dashboard/admin/users",
      "/dashboard/admin/jobs",
      "/dashboard/admin/candidates",
      "/dashboard/admin/companies",
    ],
    routerPaths: ["/", "/users", "/jobs", "/candidates", "/companies"],
  },
];

function hrefToRelative(href: string, base: string): string {
  if (href === base) return "/";
  return href.slice(base.length);
}

function pathMatchesRegistry(
  relative: string,
  routerPaths: string[],
  dynamicPatterns: RegExp[] = [],
): boolean {
  if (routerPaths.includes(relative)) return true;
  return dynamicPatterns.some((pattern) => pattern.test(relative));
}

describe("dashboard route registry", () => {
  for (const panel of PANELS) {
    describe(panel.base, () => {
      it("sidebar links resolve to registered router paths", () => {
        for (const href of panel.sidebarHrefs) {
          expect(href.startsWith(panel.base)).toBe(true);
          const relative = hrefToRelative(href, panel.base);
          expect(
            pathMatchesRegistry(relative, panel.routerPaths, panel.dynamicPatterns),
          ).toBe(true);
        }
      });

      it("has unique sidebar hrefs", () => {
        expect(new Set(panel.sidebarHrefs).size).toBe(panel.sidebarHrefs.length);
      });
    });
  }

  it("App.tsx uses multi-segment dashboard routing (*, not *?)", () => {
    const appTsx = readFileSync(
      path.resolve(process.cwd(), "artifacts/jobera/src/App.tsx"),
      "utf8",
    );

    expect(appTsx).toMatch(/path="\/dashboard\/hr\/\*"/);
    expect(appTsx).toMatch(/path="\/dashboard\/candidate\/\*"/);
    expect(appTsx).toMatch(/path="\/dashboard\/admin\/\*"/);

    expect(appTsx).not.toMatch(/path="\/dashboard\/hr\/\*\?"/);
    expect(appTsx).not.toMatch(/path="\/dashboard\/candidate\/\*\?"/);
    expect(appTsx).not.toMatch(/path="\/dashboard\/admin\/\*\?"/);
  });

  it("/dashboard/hr jobs/new and jobs/:id/edit are registered in nested HR router", () => {
    const hr = PANELS.find((p) => p.base === "/dashboard/hr")!;
    expect(pathMatchesRegistry("/jobs/new", hr.routerPaths, hr.dynamicPatterns ?? [])).toBe(true);
    expect(pathMatchesRegistry("/jobs/42/edit", hr.routerPaths, hr.dynamicPatterns ?? [])).toBe(true);
  });

  it("candidate checkout route is registered (query strings do not affect path match)", () => {
    const candidate = PANELS.find((p) => p.base === "/dashboard/candidate")!;
    expect(candidate.routerPaths).toContain("/checkout");
  });

  it("nested dashboard pages must use router-relative hrefs (not duplicated base paths)", () => {
    const hrJobsList = readFileSync(
      path.resolve(process.cwd(), "artifacts/jobera/src/pages/dashboard/hr/JobsList.tsx"),
      "utf8",
    );
    const hrJobForm = readFileSync(
      path.resolve(process.cwd(), "artifacts/jobera/src/pages/dashboard/hr/JobForm.tsx"),
      "utf8",
    );
    const onboarding = readFileSync(
      path.resolve(process.cwd(), "artifacts/jobera/src/components/layout/OnboardingBanner.tsx"),
      "utf8",
    );

    expect(hrJobsList).toMatch(/href="\/jobs\/new"/);
    expect(hrJobsList).not.toMatch(/href="\/dashboard\/hr\/jobs\/new"/);
    expect(hrJobForm).toMatch(/setLocation\("\/jobs"\)/);
    expect(onboarding).toMatch(/href="\/company"/);
    expect(onboarding).not.toMatch(/href="\/dashboard\/hr\/company"/);
  });
});
