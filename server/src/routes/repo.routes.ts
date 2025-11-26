import { FastifyInstance } from "fastify";
import prisma from "../prisma";

function serializeBigInt(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (_k, v) => (typeof v === "bigint" ? v.toString() : v))
  );
}

export default async function (app: FastifyInstance) {
  app.post("/", async (request, reply) => {
    const body = request.body as any;
    const created = await prisma.repo.create({ data: body });
    return reply.code(201).send(created);
  });

  app.get("/", async (request, reply) => {
    const {
      search,
      category,
      sort = "createdAt",
      order = "desc",
      skip: rawSkip,
      take: rawTake,
    } = (request.query as any) || {};

    const skip = rawSkip ? Number(rawSkip) : 0;
    const take = rawTake ? Number(rawTake) : 50;

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
        },
      });
    } else {
      // Fetch a larger slice then sort/filter in-memory for analysis-derived fields
      const base = await prisma.repo.findMany({
        where,
        include: {
          analysis: { orderBy: { analyzedAt: "desc" }, take: 1 },
        },
      });
      if (analysisSortableFields.includes(sort)) {
        base.sort((a: any, b: any) => {
          const av = a.analysis[0]?.[sort] ?? -Infinity;
          const bv = b.analysis[0]?.[sort] ?? -Infinity;
          if (av === bv) return 0;
          return order === "asc" ? av - bv : bv - av;
        });
      }
      repos = base.slice(skip, skip + take);
    }

    // Flatten latest analysis metrics for convenience
    const result = repos.map((r: any) => {
      const latest = r.analysis?.[0];
      return {
        id: r.id,
        name: r.name,
        url: r.url,
        description: r.description,
        category: r.category,
        createdAt: r.createdAt,
        rationale: r.rationale,
        suggestedNewClass: r.suggestedNewClass,
        latestAnalysis: latest
          ? {
              stars: latest.stars,
              forks: latest.forks,
              watchers: latest.watchers,
              issues: latest.issues,
              language: latest.language,
              commits: latest.commits,
              analyzedAt: latest.analyzedAt,
            }
          : null,
      };
    });
    return reply.send(result);
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

  // stub for future analyze action
  app.post("/:id/analyze", async (request, reply) => {
    return reply.code(202).send({ message: "Analyze job accepted (stub)" });
  });
}
