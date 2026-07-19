import { describe, it, expect } from "vitest";

const FREE_HR_MEDIA_LIMIT = 10;
const UNLIMITED = 999999;

function canViewMedia(used: number, limit: number): boolean {
  if (limit >= UNLIMITED) return true;
  return used < limit;
}

describe("HR media limit logic", () => {
  it("allows views under free tier limit", () => {
    expect(canViewMedia(5, FREE_HR_MEDIA_LIMIT)).toBe(true);
  });

  it("blocks when free tier exhausted", () => {
    expect(canViewMedia(10, FREE_HR_MEDIA_LIMIT)).toBe(false);
  });

  it("allows unlimited for enterprise", () => {
    expect(canViewMedia(9999, UNLIMITED)).toBe(true);
  });
});
