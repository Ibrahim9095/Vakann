import crypto from "crypto";
import bcrypt from "bcrypt";

const LEGACY_SALT = "jobera_salt_2024";
const BCRYPT_ROUNDS = 12;

function legacyHash(password: string): string {
  return crypto.createHash("sha256").update(password + LEGACY_SALT).digest("hex");
}

function isBcryptHash(hash: string): boolean {
  return hash.startsWith("$2");
}

function isLegacyHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export type PasswordVerifyResult = {
  valid: boolean;
  needsRehash: boolean;
  newHash?: string;
};

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<PasswordVerifyResult> {
  if (isBcryptHash(storedHash)) {
    const valid = await bcrypt.compare(password, storedHash);
    return { valid, needsRehash: false };
  }

  if (isLegacyHash(storedHash)) {
    const valid = legacyHash(password) === storedHash;
    if (!valid) return { valid: false, needsRehash: false };
    const newHash = await hashPassword(password);
    return { valid: true, needsRehash: true, newHash };
  }

  return { valid: false, needsRehash: false };
}
