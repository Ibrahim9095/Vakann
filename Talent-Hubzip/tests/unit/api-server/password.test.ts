import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { hashPassword, verifyPassword } from "../../../artifacts/api-server/src/lib/password";

describe("hashPassword", () => {
  it("produces bcrypt hash", async () => {
    const hash = await hashPassword("secret123");
    expect(hash.startsWith("$2")).toBe(true);
  });
});

describe("verifyPassword", () => {
  it("verifies bcrypt password", async () => {
    const hash = await hashPassword("mypassword");
    const result = await verifyPassword("mypassword", hash);
    expect(result.valid).toBe(true);
    expect(result.needsRehash).toBe(false);
  });

  it("rejects wrong password", async () => {
    const hash = await hashPassword("mypassword");
    const result = await verifyPassword("wrong", hash);
    expect(result.valid).toBe(false);
  });

  it("migrates legacy SHA-256 hash", async () => {
    const legacy = crypto
      .createHash("sha256")
      .update("legacy" + "jobera_salt_2024")
      .digest("hex");
    const result = await verifyPassword("legacy", legacy);
    expect(result.valid).toBe(true);
    expect(result.needsRehash).toBe(true);
    expect(result.newHash?.startsWith("$2")).toBe(true);
  });
});
