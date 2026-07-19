/**
 * Seed default admin user for Jobera.az.
 * Run: DATABASE_URL=... pnpm seed:admin
 */
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { usersTable } from "@workspace/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@jobera.az";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin123!";
const BCRYPT_ROUNDS = 12;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

async function main() {
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, ADMIN_EMAIL));

  if (existing.length > 0) {
    const user = existing[0];
    if (user.role !== "admin") {
      console.error(`User ${ADMIN_EMAIL} exists but role is "${user.role}", not admin.`);
      process.exit(1);
    }
    console.log(`Admin already exists: ${ADMIN_EMAIL}`);
    await pool.end();
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);
  await db.insert(usersTable).values({
    email: ADMIN_EMAIL,
    passwordHash,
    fullName: "Platform Admin",
    role: "admin",
  });

  console.log(`Seeded admin user: ${ADMIN_EMAIL}`);
  console.log(`Login at /auth/login → /dashboard/admin`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
