import { describe, expect, it } from "vitest";
import { buildInterviewInviteMessage, buildInterviewInviteTitle } from "../../../artifacts/api-server/src/lib/notifications/templates";

describe("interview invite notification templates", () => {
  it("builds TT-compliant invite title", () => {
    expect(buildInterviewInviteTitle()).toBe("Müsahibəyə dəvət!");
  });

  it("includes job title in invite body", () => {
    const body = buildInterviewInviteMessage("Frontend Developer");
    expect(body).toContain("Frontend Developer");
    expect(body).toContain("kontaktlarınızı aktivləşdirməyinizi");
  });
});
