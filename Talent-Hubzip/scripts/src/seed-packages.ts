/**
 * Seed default subscription packages for Jobera.az business model.
 * Run: DATABASE_URL=... pnpm --filter @workspace/scripts run seed-packages
 */
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { packagesTable } from "@workspace/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

const CANDIDATE_PACKAGES = [
  {
    name: "VIP Reytinq",
    tier: "vip",
    audience: "candidate",
    description: "Profiliniz TOP sırada göstərilir, əlaqə məlumatlarınız bütün HR-lara blursuz açıqdır.",
    price: 15,
    currency: "AZN",
    durationDays: 30,
    mediaViewLimit: 0,
    features: ["TOP sıralama", "Blursuz əlaqə", "VIP badge", "Prioritet görünürlük"],
  },
  {
    name: "1 Günlük Blur Qaldırma",
    tier: "time_1day",
    audience: "candidate",
    description: "HR sorğusunu qəbul etdikdən sonra 24 saat ərzində əlaqə məlumatlarınız açılır.",
    price: 2,
    currency: "AZN",
    durationDays: 1,
    mediaViewLimit: 0,
    features: ["24 saat blursuz rejim", "Real HR təklifi sonrası"],
  },
  {
    name: "15 Günlük Blur Qaldırma",
    tier: "time_15day",
    audience: "candidate",
    description: "15 gün boyunca profiliniz bütün HR-lara blursuz görünür.",
    price: 5,
    currency: "AZN",
    durationDays: 15,
    mediaViewLimit: 0,
    features: ["15 gün blursuz rejim", "Real HR təklifi sonrası"],
  },
  {
    name: "1 Aylıq Blur Qaldırma",
    tier: "time_30day",
    audience: "candidate",
    description: "30 gün boyunca tam blursuz rejim — bütün HR-lar əlaqənizi görə bilər.",
    price: 10,
    currency: "AZN",
    durationDays: 30,
    mediaViewLimit: 0,
    features: ["30 gün blursuz rejim", "Real HR təklifi sonrası", "Ən sərfəli B-paket"],
  },
];

const HR_PACKAGES = [
  {
    name: "HR Basic",
    tier: "hr_basic",
    audience: "hr",
    description: "Pulsuz — ayda 10 səsli/videolu CV baxışı.",
    price: 0,
    currency: "AZN",
    durationDays: 30,
    mediaViewLimit: 10,
    features: ["10 media baxış/ay", "Vakansiya yerləşdirmə"],
  },
  {
    name: "HR Premium",
    tier: "hr_premium",
    audience: "hr",
    description: "Ayda 100 səsli/videolu CV baxış limiti.",
    price: 49,
    currency: "AZN",
    durationDays: 30,
    mediaViewLimit: 100,
    features: ["100 media baxış/ay", "Prioritet dəstək"],
  },
  {
    name: "HR Enterprise",
    tier: "hr_enterprise",
    audience: "hr",
    description: "Limitsiz səsli/videolu CV baxışı.",
    price: 199,
    currency: "AZN",
    durationDays: 30,
    mediaViewLimit: 999999,
    features: ["Limitsiz media baxış", "Dedicated dəstək"],
  },
];

async function upsertPackage(pkg: typeof CANDIDATE_PACKAGES[0]) {
  const existing = await db.select().from(packagesTable).where(eq(packagesTable.tier, pkg.tier));
  if (existing.length === 0) {
    await db.insert(packagesTable).values(pkg);
    console.log(`Seeded package: ${pkg.name}`);
  } else {
    console.log(`Skipped (exists): ${pkg.name}`);
  }
}

async function main() {
  for (const pkg of CANDIDATE_PACKAGES) {
    await upsertPackage(pkg);
  }
  for (const pkg of HR_PACKAGES) {
    await upsertPackage(pkg);
  }

  console.log("Done seeding packages.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
