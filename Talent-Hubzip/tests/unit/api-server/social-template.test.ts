import { describe, it, expect } from "vitest";
import { buildJobSocialCaption, buildJobCardSvg } from "../../../artifacts/api-server/src/lib/social/template";

describe("social template", () => {
  it("builds caption with job details", () => {
    const caption = buildJobSocialCaption({
      title: "Frontend Developer",
      companyName: "TechCo",
      city: "Bakı",
      employmentType: "remote",
      salaryMin: 1500,
      salaryMax: 2500,
      jobUrl: "https://jobera.az/jobs/1",
    });
    expect(caption).toContain("Frontend Developer");
    expect(caption).toContain("TechCo");
    expect(caption).toContain("Bakı");
    expect(caption).toContain("https://jobera.az/jobs/1");
  });

  it("builds SVG job card", () => {
    const svg = buildJobCardSvg({
      title: "QA Engineer",
      companyName: "Jobera",
      city: "Bakı",
    });
    expect(svg).toContain("<svg");
    expect(svg).toContain("QA Engineer");
    expect(svg).toContain("Jobera");
  });
});
