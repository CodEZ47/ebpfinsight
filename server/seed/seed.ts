import { PrismaClient, CategoryEnum } from "@prisma/client";
import fs from "fs";
import { parse } from "csv-parse";

const prisma = new PrismaClient();

async function loadCSV(path: string) {
  const stream = fs.createReadStream(path).pipe(parse({ columns: true }));
  const out: any[] = [];
  for await (const row of stream) out.push(row);
  return out;
}

function normalizeCategory(raw: string | null): CategoryEnum | null {
  if (!raw) return null;

  const lookup: Record<string, CategoryEnum> = {
    "Cloud Native Networking": CategoryEnum.CLOUD_NATIVE_NETWORKING,
    "Defensive Security": CategoryEnum.DEFENSIVE_SECURITY,
    "Developer Tooling / Frameworks": CategoryEnum.DEVELOPER_TOOLING_FRAMEWORKS,
    "Educational / Demonstration Resources": CategoryEnum.EDUCATIONAL_DEMONSTRATION_RESOURCES,
    "Kernel / Dataplane Networking": CategoryEnum.KERNEL_DATAPLANE_NETWORKING,
    "Observability": CategoryEnum.OBSERVABILITY,
    "Offensive Security": CategoryEnum.OFFENSIVE_SECURITY,
    "Operations, Orchestration & Lifecycle Management":
      CategoryEnum.OPERATIONS_ORCHESTRATION_LIFECYCLE,
    "Platform, Runtime & Acceleration": CategoryEnum.PLATFORM_RUNTIME_ACCELERATION,
    "Runtime Security": CategoryEnum.RUNTIME_SECURITY,
  };

  if (lookup[raw]) return lookup[raw];

  console.warn(`Unknown category "${raw}" — setting category = null`);
  return null;
}

async function main() {
  console.log("Loading CSV files...");

  const profiles = await loadCSV("./seed/repo_profile.csv");
  const categories = await loadCSV("./seed/final_categories.csv");

  const categoryMap: Record<string, any> = {};
  categories.forEach((c) => {
    categoryMap[c.repo_slug] = c;
  });

  console.log("Seeding database...");

  for (const r of profiles) {
    const slug = r.repo_slug;
    const name = slug.split("/")[1];
    const url = `https://github.com/${slug}`;

    const catRow = categoryMap[slug] || null;

    const categoryEnum = normalizeCategory(catRow?.category || null);

    const repo = await prisma.repo.upsert({
      where: { url },
      update: {},
      create: {
        name,
        url,
        description: r.description || null,
        category: categoryEnum,
        rationale: catRow?.rationale || null,
        suggestedNewClass: catRow?.suggested_new_class || null,
      },
    });

    await prisma.analysis.create({
      data: {
        repoId: repo.id,
        stars: parseInt(r.stars) || null,
        forks: parseInt(r.forks) || null,
        watchers: parseInt(r.watchers) || null,
        issues: parseInt(r.issues) || null,
        language: r.language || null,
        commits: parseInt(r.commits) || null,
        readmeText: r.readme_text || null,
        cloneUrl: url,
        defaultBranch: "main",
        analyzedAt: new Date(r.updated_at || Date.now()),
      },
    });

    console.log(`Inserted ${slug}`);
  }

  console.log("Seeding complete!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
    process.exit(1);
  });
