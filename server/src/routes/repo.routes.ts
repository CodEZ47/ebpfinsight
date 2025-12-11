import { FastifyInstance } from "fastify";
import prisma from "../prisma";
// Work around type-generation mismatch for PrimitiveAnalysis in tooling by aliasing as any
const primitiveAnalysis = (prisma as any).primitiveAnalysis;

function serializeBigInt(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (_k, v) => (typeof v === "bigint" ? v.toString() : v))
  );
}

export default async function (app: FastifyInstance) {
  app.post("/", async (request, reply) => {
    const body = (request.body as any) || {};
    let { name, url } = body;
    if (!url) return reply.code(400).send({ error: "url required" });
    // Derive name from URL if not provided
    if (!name) {
      try {
        const cleaned = url.trim();
        const withoutGit = cleaned.replace(/\.git$/i, "");
        const parts = withoutGit.split("/").filter(Boolean);
        name = parts[parts.length - 1];
      } catch {
        name = url; // fallback
      }
    }
    try {
      const created = await prisma.repo.create({
        data: {
          name,
          url,
          // Force uncategorized & description deferred to analyzer
          category: null,
          description: null,
        },
      });
      return reply.code(201).send(created);
    } catch (e: any) {
      if (e.code === "P2002") {
        return reply.code(409).send({ error: "Repository URL already exists" });
      }
      return reply.code(400).send({ error: "Create failed" });
    }
  });

  // Bulk add endpoint: accepts { urls: string[] }
  app.post("/bulk", async (request, reply) => {
    const body = (request.body as any) || {};
    const urls: string[] = Array.isArray(body.urls) ? body.urls : [];
    if (!urls.length)
      return reply.code(400).send({ error: "urls array required" });
    const created: any[] = [];
    const skipped: any[] = [];
    for (const raw of urls) {
      const url = (raw || "").trim();
      if (!url) continue;
      // Normalize: if user provided owner/repo only, prepend GitHub URL
      const normalized = /^(https?:)?\/\//i.test(url)
        ? url
        : `https://github.com/${url.replace(/^https?:\/\//, "")}`;
      let name: string;
      try {
        const cleaned = normalized.replace(/\.git$/i, "");
        const parts = cleaned.split("/").filter(Boolean);
        name = parts[parts.length - 1];
      } catch {
        name = normalized;
      }
      try {
        const repo = await prisma.repo.create({
          data: { name, url: normalized, category: null, description: null },
        });
        created.push(repo);
      } catch (e: any) {
        if (e.code === "P2002") {
          skipped.push({ url: normalized, reason: "duplicate" });
        } else {
          skipped.push({ url: normalized, reason: "error" });
        }
      }
    }
    return reply.code(201).send({ created, skipped });
  });

  app.post("/bulk/analyze", async (request, reply) => {
    const body = (request.body as any) || {};
    const rawIds = Array.isArray(body.repoIds) ? body.repoIds : [];
    const repoIds: number[] = rawIds
      .map((raw: any) => Number(raw))
      .filter((value: number) => Number.isFinite(value) && value > 0);

    if (!repoIds.length) {
      return reply.code(400).send({ error: "repoIds array required" });
    }

    const analyzerUrl = process.env.ANALYZER_URL || "http://repo-analyzer:8001";
    const successes: Array<{ repoId: number; analysisId?: number }> = [];
    const failures: Array<{ repoId: number; reason: string }> = [];

    for (const repoId of repoIds) {
      try {
        const repo = await prisma.repo.findUnique({ where: { id: repoId } });
        if (!repo) {
          failures.push({ repoId, reason: "Repository not found" });
          continue;
        }

        const res = await fetch(`${analyzerUrl}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoUrl: repo.url, repoId: repo.id }),
        });

        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          const reason =
            payload?.error || `Analyzer returned status ${res.status}`;
          failures.push({ repoId, reason });
          continue;
        }

        successes.push({ repoId, analysisId: payload?.analysisId });
      } catch (error: any) {
        failures.push({ repoId, reason: error?.message || String(error) });
      }
    }

    return reply.send({
      totalRequested: repoIds.length,
      successes,
      failures,
    });
  });

  // Category averages endpoint: returns averaged primitive metrics per category
  app.get("/categories/averages", async (request, reply) => {
    const { categories: rawCategories } = (request.query as any) || {};
    const categories: string[] = rawCategories
      ? String(rawCategories)
          .split(",")
          .map((c) => c.trim())
          .filter((c) => c.length)
      : [];
    try {
      const where: any = {};
      if (categories.length) {
        where.OR = categories.map((c) =>
          c === "UNCATEGORIZED" ? { category: null } : { category: c }
        );
      }
      const repos = await prisma.repo.findMany({ where });
      const agg: Record<
        string,
        {
          helpers: number;
          maps: number;
          programs: number;
          programTypes: number;
          attachPoints: number;
          count: number;
        }
      > = {};
      for (const r of repos) {
        const latest = await primitiveAnalysis.findFirst({
          where: { repoId: r.id },
          orderBy: { analyzedAt: "desc" },
        });
        if (!latest) continue; // skip repos without primitive analysis
        const cat = r.category || "UNCATEGORIZED";
        const bucket = agg[cat] || {
          helpers: 0,
          maps: 0,
          programs: 0,
          programTypes: 0,
          attachPoints: 0,
          count: 0,
        };
        bucket.helpers += latest.totalHelpers || 0;
        bucket.maps += latest.totalMaps || 0;
        bucket.programs += latest.totalPrograms || 0;
        bucket.programTypes += latest.totalProgramTypes || 0;
        bucket.attachPoints += latest.totalAttachPoints || 0;
        bucket.count += 1;
        agg[cat] = bucket;
      }
      const averages: Record<string, any> = {};
      Object.entries(agg).forEach(([cat, v]) => {
        if (v.count === 0) return; // safety
        averages[cat] = {
          helpers: +(v.helpers / v.count).toFixed(2),
          maps: +(v.maps / v.count).toFixed(2),
          programs: +(v.programs / v.count).toFixed(2),
          programTypes: +(v.programTypes / v.count).toFixed(2),
          attachPoints: +(v.attachPoints / v.count).toFixed(2),
          count: v.count,
        };
      });
      return reply.send({ categories: averages });
    } catch (e: any) {
      return reply.code(500).send({
        error: "Category averages failed",
        details: e.message || String(e),
      });
    }
  });

  app.get("/", async (request, reply) => {
    const {
      search,
      category,
      sort = "createdAt",
      order = "desc",
      skip: rawSkip,
      take: rawTake,
      page: rawPage,
      pageSize: rawPageSize,
    } = (request.query as any) || {};

    const pageSize = rawPageSize
      ? Math.min(Math.max(Number(rawPageSize), 1), 200)
      : rawTake
      ? Math.min(Math.max(Number(rawTake), 1), 200)
      : 50;
    const page = rawPage ? Math.max(Number(rawPage), 1) : 1;
    const skip = rawSkip ? Number(rawSkip) : Math.max((page - 1) * pageSize, 0);
    const take = pageSize;

    // Base where clause
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { url: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) {
      where.category = category;
    }

    const repoSortableFields = ["createdAt", "name", "id"]; // direct DB ordering
    const analysisSortableFields = [
      "stars",
      "forks",
      "watchers",
      "issues",
      "commits",
      "repoCreatedAt",
    ];

    // Handle category filtering
    if (category) {
      if (category === "UNCATEGORIZED") {
        where.category = null;
      } else {
        where.category = category;
      }
    }
    let repos;
    if (repoSortableFields.includes(sort)) {
      repos = await prisma.repo.findMany({
        where,
        orderBy: { [sort]: order === "asc" ? "asc" : "desc" },
        skip,
        take,
        include: {
          analysis: { orderBy: { analyzedAt: "desc" }, take: 1 },
          primitiveAnalyses: { orderBy: { analyzedAt: "desc" }, take: 1 },
        },
      });
    } else {
      // Fetch a larger slice then sort/filter in-memory for analysis-derived fields
      const base = await prisma.repo.findMany({
        where,
        include: {
          analysis: { orderBy: { analyzedAt: "desc" }, take: 1 },
          primitiveAnalyses: { orderBy: { analyzedAt: "desc" }, take: 1 },
        },
      });
      if (analysisSortableFields.includes(sort)) {
        const getComparableValue = (entry: any) => {
          const latestAnalysis = entry.analysis?.[0];
          if (!latestAnalysis) return undefined;
          if (sort === "repoCreatedAt") {
            const raw = latestAnalysis.repoCreatedAt;
            if (!raw) return undefined;
            const timestamp = new Date(raw).getTime();
            return Number.isNaN(timestamp) ? undefined : timestamp;
          }
          const metric = latestAnalysis[sort];
          return typeof metric === "number" ? metric : undefined;
        };

        const isAscending = order === "asc";

        base.sort((a: any, b: any) => {
          const av = getComparableValue(a);
          const bv = getComparableValue(b);

          const fallback = isAscending
            ? Number.POSITIVE_INFINITY
            : Number.NEGATIVE_INFINITY;

          const aVal = av ?? fallback;
          const bVal = bv ?? fallback;

          if (aVal === bVal) return 0;
          return isAscending ? aVal - bVal : bVal - aVal;
        });
      }
      repos = base.slice(skip, skip + take);
    }

    // Flatten latest analysis metrics for convenience
    const result = repos.map((r: any) => {
      const latest = r.analysis?.[0];
      const latestPrimitive = r.primitiveAnalyses?.[0];
      return {
        id: r.id,
        name: r.name,
        url: r.url,
        description: r.description,
        category: r.category,
        createdAt: r.createdAt,
        rationale: r.rationale,
        suggestedNewClass: r.suggestedNewClass,
        repoCreatedAt: latest?.repoCreatedAt ?? null,
        latestAnalysis: latest
          ? {
              stars: latest.stars,
              forks: latest.forks,
              watchers: latest.watchers,
              issues: latest.issues,
              language: latest.language,
              commits: latest.commits,
              analyzedAt: latest.analyzedAt,
              repoCreatedAt: latest.repoCreatedAt,
            }
          : null,
        latestPrimitive: latestPrimitive
          ? {
              id: latestPrimitive.id,
              analyzedAt: latestPrimitive.analyzedAt,
              totalHelpers: latestPrimitive.totalHelpers,
              totalMaps: latestPrimitive.totalMaps,
              totalPrograms: latestPrimitive.totalPrograms,
              totalProgramTypes: latestPrimitive.totalProgramTypes,
              totalAttachPoints: latestPrimitive.totalAttachPoints,
              helpers: latestPrimitive.helpers,
              maps: latestPrimitive.maps,
              mapTypes: latestPrimitive.mapTypes,
              attachPoints: latestPrimitive.attachPoints,
              attachTypes: latestPrimitive.attachTypes,
              programSections: latestPrimitive.programSections,
              programTypes: latestPrimitive.programTypes,
              programTypesInferred: latestPrimitive.programTypesInferred,
              programTypesTokens: latestPrimitive.programTypesTokens,
            }
          : null,
      };
    });
    const [total, categorizedTotal] = await Promise.all([
      prisma.repo.count({ where }),
      prisma.repo.count({
        where: {
          ...where,
          category: { not: null },
        },
      }),
    ]);
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    return reply.send({
      data: result,
      summary: {
        totalRepos: total,
        categorizedRepos: categorizedTotal,
      },
      pagination: {
        total,
        totalPages,
        page,
        pageSize,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  });

  app.get("/:id", async (request, reply) => {
    const id = Number((request.params as any).id);
    const repo = await prisma.repo.findUnique({
      where: { id },
      include: { analysis: true, overheadTests: true },
    });
    if (!repo) return reply.code(404).send({ error: "Not found" });
    return reply.send(serializeBigInt(repo));
  });

  // Primitive analysis list for a repo
  app.get("/:id/primitives", async (request, reply) => {
    const id = Number((request.params as any).id);
    const rows = await primitiveAnalysis.findMany({
      where: { repoId: id },
      orderBy: { analyzedAt: "desc" },
    });
    return reply.send(rows);
  });

  // Primitive analysis single by id
  app.get("/primitives/:primitiveId", async (request, reply) => {
    const primitiveId = Number((request.params as any).primitiveId);
    const row = await primitiveAnalysis.findUnique({
      where: { id: primitiveId },
    });
    if (!row) return reply.code(404).send({ error: "Not found" });
    return reply.send(row as any);
  });

  // Update repo properties (e.g., category)
  app.patch("/:id", async (request, reply) => {
    const id = Number((request.params as any).id);
    const body = (request.body as any) || {};
    try {
      const data: any = {};
      if ("category" in body) {
        data.category =
          body.category === "UNCATEGORIZED" ? null : body.category;
      }
      if ("description" in body) data.description = body.description;
      if ("rationale" in body) data.rationale = body.rationale;
      if ("suggestedNewClass" in body)
        data.suggestedNewClass = body.suggestedNewClass;
      const updated = await prisma.repo.update({ where: { id }, data });
      return reply.send(updated);
    } catch (e) {
      return reply.code(400).send({ error: "Update failed" });
    }
  });
  app.delete("/:id", async (request, reply) => {
    const id = Number((request.params as any).id);
    try {
      await prisma.repo.delete({ where: { id } });
      return reply.code(204).send();
    } catch (e) {
      return reply.code(404).send({ error: "Not found" });
    }
  });

  // analyze action: forward to analyzer service
  app.post("/:id/analyze", async (request, reply) => {
    const id = Number((request.params as any).id);
    const repo = await prisma.repo.findUnique({ where: { id } });
    if (!repo) return reply.code(404).send({ error: "Not found" });

    const analyzerUrl = process.env.ANALYZER_URL || "http://repo-analyzer:8001";
    try {
      const res = await fetch(`${analyzerUrl}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: repo.url, repoId: repo.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return reply.code(502).send({ error: "Analyzer error", details: data });
      }
      return reply
        .code(202)
        .send({ message: "Analyze job accepted", result: data });
    } catch (e: any) {
      return reply
        .code(502)
        .send({ error: "Analyzer unreachable", details: String(e) });
    }
  });

  // analyze primitives: forward to primitive-analyzer and persist summary
  app.post("/:id/analyze-primitives", async (request, reply) => {
    const id = Number((request.params as any).id);
    const repo = await prisma.repo.findUnique({ where: { id } });
    if (!repo) return reply.code(404).send({ error: "Not found" });

    const primitiveUrl =
      process.env.PRIMITIVE_ANALYZER_URL || "http://primitive-analyzer:5000";
    try {
      const res = await fetch(`${primitiveUrl}/clone-and-analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: repo.url }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        return reply
          .code(502)
          .send({ error: "Primitive analyzer error", details: payload });
      }
      const results = payload.results || {};
      const mapTypes = results.map_types || {};
      const attachTypes = results.attach_types || {};
      const helpers = results.helpers || {};
      const programSections = results.program_sections || {};
      const programTypesInferred = results.program_types_inferred || {};
      const programTypesTokens = results.program_types_tokens || {};

      // Program count: sum of inferred program occurrences
      const totalPrograms = Object.values(programTypesInferred).reduce(
        (a: any, b: any) => a + (Number(b) || 0),
        0
      );
      // Program types total: unique number of inferred program types
      const totalProgramTypes = Object.keys(programTypesInferred).length;
      const totalHelpers = Object.values(helpers).reduce(
        (a: any, b: any) => a + (Number(b) || 0),
        0
      );
      const uniqueHelpers = Object.keys(helpers).length;
      const totalMaps = Object.values(mapTypes).reduce(
        (a: any, b: any) => a + (Number(b) || 0),
        0
      );
      const uniqueMaps = Object.keys(mapTypes).length;
      const totalAttachPoints = Object.values(attachTypes).reduce(
        (a: any, b: any) => a + (Number(b) || 0),
        0
      );
      const uniqueAttachPoints = Object.keys(attachTypes).length;

      const created = await primitiveAnalysis.create({
        data: {
          repoId: repo.id,
          totalPrograms: Number(totalPrograms),
          totalProgramTypes: Number(totalProgramTypes),
          totalHelpers: Number(totalHelpers),
          uniqueHelpers: Number(uniqueHelpers),
          totalMaps: Number(totalMaps),
          uniqueMaps: Number(uniqueMaps),
          totalAttachPoints: Number(totalAttachPoints),
          uniqueAttachPoints: Number(uniqueAttachPoints),
          mapTypes: mapTypes as any,
          attachTypes: attachTypes as any,
          helpers: helpers as any,
          programSections: programSections as any,
          programTypesInferred: programTypesInferred as any,
          programTypesTokens: programTypesTokens as any,
        },
      });
      return reply.code(201).send(created);
    } catch (e: any) {
      return reply
        .code(502)
        .send({ error: "Primitive analyzer unreachable", details: String(e) });
    }
  });
}
