import { FastifyInstance } from "fastify";
import prisma from "../prisma";

function serializeBigInt(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (_k, v) => (typeof v === "bigint" ? v.toString() : v))
  );
}

export default async function (app: FastifyInstance) {
  app.get("/:id/analysis", async (request, reply) => {
    const id = Number((request.params as any).id);
    const rows = await prisma.analysis.findMany({
      where: { repoId: id },
      orderBy: { analyzedAt: "desc" },
    });
    return reply.send(serializeBigInt(rows));
  });

  // Get a single analysis by id
  app.get("/analysis/:analysisId", async (request, reply) => {
    const analysisId = Number((request.params as any).analysisId);
    const row = await prisma.analysis.findUnique({ where: { id: analysisId } });
    if (!row) return reply.code(404).send({ error: "Not found" });
    return reply.send(serializeBigInt(row));
  });
}
