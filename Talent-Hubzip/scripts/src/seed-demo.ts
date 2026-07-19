/**
 * Seed demo companies, candidates, and jobs for Jobera.az.
 * Run: DATABASE_URL=... pnpm seed:demo
 *
 * Demo passwords (all): Demo123!
 */
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { usersTable, companiesTable, candidatesTable, jobsTable } from "@workspace/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "Demo123!";
const BCRYPT_ROUNDS = 12;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

type HrSeed = {
  email: string;
  fullName: string;
  company: {
    name: string;
    sector: string;
    description: string;
    city: string;
    address: string;
    website: string;
    contactEmail: string;
    contactPhone: string;
    employeeCount: string;
    isVerified: boolean;
  };
  jobs: Array<{
    title: string;
    category: string;
    description: string;
    requirements: string;
    city: string;
    address: string;
    employmentType: string;
    salaryMin: number;
    salaryMax: number;
    requiresVoiceIntro?: boolean;
    voicePrompt?: string;
    requiresHealthDeclaration?: boolean;
  }>;
};

type CandidateSeed = {
  email: string;
  fullName: string;
  phone: string;
  profile: {
    category: string;
    title: string;
    summary: string;
    city: string;
    district: string;
    metroStation: string;
    salaryExpectation: number;
    experienceYears: number;
    education: string;
    languages: string[];
    skills: string[];
    contactEmail: string;
    contactPhone: string;
    subscriptionTier?: string;
  };
};

const HR_SEEDS: HrSeed[] = [
  {
    email: "hr@techaz.az",
    fullName: "Aysel Məmmədova",
    company: {
      name: "TechAZ Solutions",
      sector: "İT / Proqram təminatı",
      description: "Bakı mərkəzli rəqəmsal məhsul və proqram təminatı şirkəti. Web, mobil və cloud həllər təqdim edirik.",
      city: "Bakı",
      address: "Nəsimi r., 28 May küç. 15",
      website: "https://techaz.az",
      contactEmail: "hr@techaz.az",
      contactPhone: "+994501112233",
      employeeCount: "50-100",
      isVerified: true,
    },
    jobs: [
      {
        title: "Senior Frontend Developer",
        category: "it",
        description: "React və TypeScript ilə müasir web məhsullar hazırlayacaqsınız. Komanda Agile metodologiyası ilə işləyir.",
        requirements: "3+ il React təcrübəsi\nTypeScript\nREST/GraphAPI\nGit\nİngilis dili — orta səviyyə",
        city: "Bakı",
        address: "Nəsimi r., 28 May küç. 15",
        employmentType: "full_time",
        salaryMin: 1800,
        salaryMax: 2800,
        requiresVoiceIntro: true,
        voicePrompt: "İngiliscə özünüzü 30 saniyədə təqdim edin",
      },
      {
        title: "Backend Developer (Node.js)",
        category: "it",
        description: "Express/NestJS əsaslı API-lər və PostgreSQL ilə işləyəcəksiniz.",
        requirements: "Node.js, PostgreSQL, Redis\n2+ il backend təcrübəsi\nDocker bilikləri üstünlükdür",
        city: "Bakı",
        address: "Nəsimi r., 28 May küç. 15",
        employmentType: "hybrid",
        salaryMin: 1600,
        salaryMax: 2400,
      },
      {
        title: "QA Engineer",
        category: "it",
        description: "Manual və avtomatlaşdırılmış test proseslərini idarə edin.",
        requirements: "QA metodologiyası\nPostman / Cypress\nBug tracking (Jira)",
        city: "Bakı",
        address: "Nəsimi r., 28 May küç. 15",
        employmentType: "full_time",
        salaryMin: 1000,
        salaryMax: 1600,
      },
    ],
  },
  {
    email: "hr@kapitalbank.az",
    fullName: "Elvin Həsənov",
    company: {
      name: "Kapital Bank",
      sector: "Bank / Maliyyə",
      description: "Azərbaycanın aparıcı banklarından biri. Rəqəmsal bankçılıq və müştəri xidmətləri üzrə vakansiyalar.",
      city: "Bakı",
      address: "Nizami küç. 71",
      website: "https://kapitalbank.az",
      contactEmail: "hr@kapitalbank.az",
      contactPhone: "+994124937373",
      employeeCount: "1000+",
      isVerified: true,
    },
    jobs: [
      {
        title: "Maliyyə Analitiki",
        category: "finance",
        description: "Şöbə hesabatları, büdcə planlaşdırması və risk analizi.",
        requirements: "İqtisadiyyat / Maliyyə təhsili\nExcel / Power BI\n2+ il təcrübə",
        city: "Bakı",
        address: "Nizami küç. 71",
        employmentType: "full_time",
        salaryMin: 1200,
        salaryMax: 2000,
        requiresHealthDeclaration: true,
      },
      {
        title: "Müştəri Xidmətləri Mütəxəssisi",
        category: "sales",
        description: "Filial və call-center müştəri dəstəyi.",
        requirements: "Yaxşı ünsiyyət bacarığı\nAzərbaycan və rus dili\nMüştəri xidməti təcrübəsi üstünlükdür",
        city: "Bakı",
        address: "Gənclik metrosu yaxınlığı",
        employmentType: "full_time",
        salaryMin: 700,
        salaryMax: 1100,
      },
    ],
  },
  {
    email: "hr@pasha.az",
    fullName: "Nigar Quliyeva",
    company: {
      name: "PASHA Holding",
      sector: "Holdinq / İdarəetmə",
      description: "Çoxşaxəli holdinq — sığorta, tikinti, turizm və digər sahələr.",
      city: "Bakı",
      address: "Port Baku Tower 2",
      website: "https://pasha-holding.az",
      contactEmail: "hr@pasha.az",
      contactPhone: "+994124970000",
      employeeCount: "500-1000",
      isVerified: true,
    },
    jobs: [
      {
        title: "HR Business Partner",
        category: "marketing",
        description: "İşəqəbul, talent management və daxili kommunikasiya.",
        requirements: "HR sahəsində 3+ il\nLabor qanunvericiliyi\nİngilis dili — yaxşı",
        city: "Bakı",
        address: "Port Baku Tower 2",
        employmentType: "full_time",
        salaryMin: 1500,
        salaryMax: 2200,
      },
      {
        title: "UI/UX Dizayner",
        category: "design",
        description: "Rəqəmsal məhsullar üçün interfeys və istifadəçi təcrübəsi dizaynı.",
        requirements: "Figma\nPortfolio tələb olunur\n2+ il UI/UX təcrübəsi",
        city: "Bakı",
        address: "Port Baku Tower 2",
        employmentType: "remote",
        salaryMin: 1400,
        salaryMax: 2100,
      },
    ],
  },
  {
    email: "hr@azercell.az",
    fullName: "Rəşad Əliyev",
    company: {
      name: "Azercell Telecom",
      sector: "Telekommunikasiya",
      description: "Ölkənin aparıcı mobil operatoru. Marketinq, satış və texniki vakansiyalar.",
      city: "Bakı",
      address: "Azadlıq prospekti 189",
      website: "https://azercell.com",
      contactEmail: "hr@azercell.az",
      contactPhone: "+994125554444",
      employeeCount: "1000+",
      isVerified: true,
    },
    jobs: [
      {
        title: "Digital Marketing Specialist",
        category: "marketing",
        description: "Sosial media, performance ads və content kampaniyaları.",
        requirements: "Google Ads / Meta Ads\nAnalytics\n1+ il digital marketing",
        city: "Bakı",
        address: "Azadlıq prospekti 189",
        employmentType: "hybrid",
        salaryMin: 1100,
        salaryMax: 1700,
      },
      {
        title: "Satış Nümayəndəsi",
        category: "sales",
        description: "B2C satış və abunəçi cəlb etmə.",
        requirements: "Satış təcrübəsi\nYaxşı ünsiyyət\nSürücülük vəsiqəsi üstünlükdür",
        city: "Bakı",
        address: "Müxtəlif filiallar",
        employmentType: "full_time",
        salaryMin: 800,
        salaryMax: 1400,
      },
    ],
  },
  {
    email: "hr@wolt.az",
    fullName: "Camal İsmayılov",
    company: {
      name: "Wolt Azərbaycan",
      sector: "Çatdırılma / E-ticarət",
      description: "Yemək və məhsul çatdırılması platforması. Operativ və texniki komanda axtarırıq.",
      city: "Bakı",
      address: "Yasamal r., Şərifzadə 177",
      website: "https://wolt.com",
      contactEmail: "hr@wolt.az",
      contactPhone: "+994502223344",
      employeeCount: "100-250",
      isVerified: false,
    },
    jobs: [
      {
        title: "Operations Coordinator",
        category: "sales",
        description: "Gündəlik əməliyyatların koordinasiyası və kuryer dəstəyi.",
        requirements: "Excel\nStressə dözümlülük\nİngilis dili üstünlükdür",
        city: "Bakı",
        address: "Yasamal r., Şərifzadə 177",
        employmentType: "full_time",
        salaryMin: 900,
        salaryMax: 1300,
      },
      {
        title: "Junior React Developer",
        category: "it",
        description: "Partner portal və daxili panellərin inkişafı.",
        requirements: "React əsasları\nJavaScript\nÖyrənməyə həvəs",
        city: "Bakı",
        address: "Yasamal r., Şərifzadə 177",
        employmentType: "internship",
        salaryMin: 500,
        salaryMax: 800,
      },
    ],
  },
];

const CANDIDATE_SEEDS: CandidateSeed[] = [
  {
    email: "leyla@example.com",
    fullName: "Leyla Əhmədova",
    phone: "+994501234567",
    profile: {
      category: "it",
      title: "Frontend Developer",
      summary: "React və TypeScript ilə 4 ildir web məhsullar hazırlayıram. Startup və korporativ mühitdə işləmişəm.",
      city: "Bakı",
      district: "Nəsimi",
      metroStation: "28 May",
      salaryExpectation: 2000,
      experienceYears: 4,
      education: "ADA Universiteti — Kompüter Elmləri",
      languages: ["Azərbaycan", "İngilis", "Rus"],
      skills: ["React", "TypeScript", "Next.js", "Tailwind", "Git"],
      contactEmail: "leyla@example.com",
      contactPhone: "+994501234567",
      subscriptionTier: "vip",
    },
  },
  {
    email: "orkhan@example.com",
    fullName: "Orxan Rəhimov",
    phone: "+994552345678",
    profile: {
      category: "it",
      title: "Full-stack Developer",
      summary: "Node.js + React stack. Mikroservis və PostgreSQL təcrübəsi.",
      city: "Bakı",
      district: "Yasamal",
      metroStation: "Nəsimi",
      salaryExpectation: 2200,
      experienceYears: 5,
      education: "Bakı Dövlət Universiteti — Tətbiqi riyaziyyat",
      languages: ["Azərbaycan", "İngilis"],
      skills: ["Node.js", "React", "PostgreSQL", "Docker", "Redis"],
      contactEmail: "orkhan@example.com",
      contactPhone: "+994552345678",
      subscriptionTier: "free",
    },
  },
  {
    email: "gunel@example.com",
    fullName: "Günel Hüseynova",
    phone: "+994703456789",
    profile: {
      category: "finance",
      title: "Maliyyə Mütəxəssisi",
      summary: "Bank və audit sahəsində 3 il təcrübə. IFRS və maliyyə hesabatları.",
      city: "Bakı",
      district: "Nərimanov",
      metroStation: "Gənclik",
      salaryExpectation: 1500,
      experienceYears: 3,
      education: "UNEC — Maliyyə",
      languages: ["Azərbaycan", "Rus", "İngilis"],
      skills: ["Excel", "1C", "Power BI", "IFRS"],
      contactEmail: "gunel@example.com",
      contactPhone: "+994703456789",
      subscriptionTier: "time_limited",
    },
  },
  {
    email: "tural@example.com",
    fullName: "Tural Məmmədli",
    phone: "+994554567890",
    profile: {
      category: "design",
      title: "UI/UX Designer",
      summary: "Figma ilə mobil və web interfeyslər. 20+ tamamlanmış layihə.",
      city: "Bakı",
      district: "Səbail",
      metroStation: "İçərişəhər",
      salaryExpectation: 1600,
      experienceYears: 3,
      education: "Azərbaycan Dövlət Rəssamlıq Akademiyası",
      languages: ["Azərbaycan", "İngilis"],
      skills: ["Figma", "Adobe XD", "Prototyping", "Design System"],
      contactEmail: "tural@example.com",
      contactPhone: "+994554567890",
      subscriptionTier: "free",
    },
  },
  {
    email: "sevinj@example.com",
    fullName: "Sevinc Qasımova",
    phone: "+994505678901",
    profile: {
      category: "marketing",
      title: "Digital Marketing Manager",
      summary: "Performance marketing və brand kampaniyaları. Meta + Google Ads.",
      city: "Bakı",
      district: "Xətai",
      metroStation: "Xətai",
      salaryExpectation: 1400,
      experienceYears: 4,
      education: "Bakı Biznes Universiteti — Marketinq",
      languages: ["Azərbaycan", "İngilis", "Türkcə"],
      skills: ["Google Ads", "Meta Ads", "SEO", "Analytics", "Copywriting"],
      contactEmail: "sevinj@example.com",
      contactPhone: "+994505678901",
      subscriptionTier: "free",
    },
  },
  {
    email: "farid@example.com",
    fullName: "Fərid Nəbiyev",
    phone: "+994707890123",
    profile: {
      category: "sales",
      title: "Satış Meneceri",
      summary: "B2B satış və müştəri əlaqələri. Telekom və FMCG təcrübəsi.",
      city: "Bakı",
      district: "Binəqədi",
      metroStation: "Azadlıq",
      salaryExpectation: 1200,
      experienceYears: 6,
      education: "Azərbaycan Dövlət İqtisad Universiteti",
      languages: ["Azərbaycan", "Rus"],
      skills: ["CRM", "Negotiation", "B2B Sales", "Presentation"],
      contactEmail: "farid@example.com",
      contactPhone: "+994707890123",
      subscriptionTier: "free",
    },
  },
  {
    email: "nargiz@example.com",
    fullName: "Nərgiz Əliyeva",
    phone: "+994508901234",
    profile: {
      category: "it",
      title: "QA Engineer",
      summary: "Manual + avtomatlaşdırılmış test. Cypress və Playwright.",
      city: "Bakı",
      district: "Nizami",
      metroStation: "Qara Qarayev",
      salaryExpectation: 1300,
      experienceYears: 2,
      education: "Azərbaycan Texniki Universiteti",
      languages: ["Azərbaycan", "İngilis"],
      skills: ["Cypress", "Playwright", "Postman", "Jira", "SQL"],
      contactEmail: "nargiz@example.com",
      contactPhone: "+994508901234",
      subscriptionTier: "free",
    },
  },
  {
    email: "kamran@example.com",
    fullName: "Kamran Vəliyev",
    phone: "+994559012345",
    profile: {
      category: "it",
      title: "DevOps Engineer",
      summary: "CI/CD, Kubernetes və AWS infrastrukturu.",
      city: "Bakı",
      district: "Nəsimi",
      metroStation: "Sahil",
      salaryExpectation: 2500,
      experienceYears: 5,
      education: "Qafqaz Universiteti — Kompüter mühəndisliyi",
      languages: ["Azərbaycan", "İngilis", "Rus"],
      skills: ["AWS", "Kubernetes", "Terraform", "CI/CD", "Linux"],
      contactEmail: "kamran@example.com",
      contactPhone: "+994559012345",
      subscriptionTier: "vip",
    },
  },
];

async function upsertUser(email: string, fullName: string, role: string, phone?: string) {
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) return existing[0];

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);
  const [user] = await db
    .insert(usersTable)
    .values({ email, passwordHash, fullName, role, phone: phone ?? null })
    .returning();
  return user;
}

async function main() {
  console.log("Seeding demo data (companies, candidates, jobs)...\n");

  let companiesCreated = 0;
  let jobsCreated = 0;
  let candidatesCreated = 0;

  for (const seed of HR_SEEDS) {
    const user = await upsertUser(seed.email, seed.fullName, "hr", seed.company.contactPhone);

    let company = (await db.select().from(companiesTable).where(eq(companiesTable.userId, user.id)))[0];
    if (!company) {
      const [created] = await db
        .insert(companiesTable)
        .values({
          userId: user.id,
          ...seed.company,
        })
        .returning();
      company = created;
      companiesCreated++;
      console.log(`  + Şirkət: ${company.name}`);
    } else {
      console.log(`  · Şirkət mövcuddur: ${company.name}`);
    }

    const existingJobs = await db.select().from(jobsTable).where(eq(jobsTable.companyId, company.id));
    if (existingJobs.length === 0) {
      for (const job of seed.jobs) {
        await db.insert(jobsTable).values({
          companyId: company.id,
          title: job.title,
          category: job.category,
          description: job.description,
          requirements: job.requirements,
          city: job.city,
          address: job.address,
          employmentType: job.employmentType,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          requiresVoiceIntro: job.requiresVoiceIntro ?? false,
          voicePrompt: job.voicePrompt ?? null,
          requiresHealthDeclaration: job.requiresHealthDeclaration ?? false,
          currency: "AZN",
          isActive: true,
        });
        jobsCreated++;
        console.log(`    + Vakansiya: ${job.title}`);
      }
    } else {
      console.log(`    · ${existingJobs.length} vakansiya artıq var`);
    }
  }

  console.log("");

  for (const seed of CANDIDATE_SEEDS) {
    const user = await upsertUser(seed.email, seed.fullName, "candidate", seed.phone);

    const existing = await db.select().from(candidatesTable).where(eq(candidatesTable.userId, user.id));
    if (existing.length === 0) {
      const expiresAt =
        seed.profile.subscriptionTier === "time_limited"
          ? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
          : null;

      await db.insert(candidatesTable).values({
        userId: user.id,
        fullName: seed.fullName,
        category: seed.profile.category,
        title: seed.profile.title,
        summary: seed.profile.summary,
        city: seed.profile.city,
        district: seed.profile.district,
        metroStation: seed.profile.metroStation,
        salaryExpectation: seed.profile.salaryExpectation,
        experienceYears: seed.profile.experienceYears,
        education: seed.profile.education,
        languages: seed.profile.languages,
        skills: seed.profile.skills,
        contactEmail: seed.profile.contactEmail,
        contactPhone: seed.profile.contactPhone,
        subscriptionTier: seed.profile.subscriptionTier ?? "free",
        subscriptionExpiresAt: expiresAt,
        isContactBlurred: seed.profile.subscriptionTier !== "vip",
        isActive: true,
      });
      candidatesCreated++;
      console.log(`  + Namizəd: ${seed.fullName} (${seed.profile.title})`);
    } else {
      console.log(`  · Namizəd mövcuddur: ${seed.fullName}`);
    }
  }

  console.log("\n--- Nəticə ---");
  console.log(`Şirkətlər: +${companiesCreated}`);
  console.log(`Vakansiyalar: +${jobsCreated}`);
  console.log(`Namizədlər: +${candidatesCreated}`);
  console.log(`\nBütün demo hesabların şifrəsi: ${DEMO_PASSWORD}`);
  console.log("HR nümunə: hr@techaz.az");
  console.log("Namizəd nümunə: leyla@example.com");
  console.log("Done.");

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
