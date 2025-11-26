import { FastifyInstance } from "fastify";
import prisma from "../prisma";

function serializeBigInt(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (_k, v) => (typeof v === "bigint" ? v.toString() : v))
  );
}

export default async function (app: FastifyInstance) {
  app.get("/:id/tests", async (request, reply) => {
    const id = Number((request.params as any).id);
    const rows = await prisma.overheadTest.findMany({
      where: { repoId: id },
      orderBy: { testedAt: "desc" },
    });
    return reply.send(serializeBigInt(rows));
  });

  // Get a single test by id
  app.get("/tests/:testId", async (request, reply) => {
    const testId = Number((request.params as any).testId);
    const row = await prisma.overheadTest.findUnique({ where: { id: testId } });
    if (!row) return reply.code(404).send({ error: "Not found" });
    return reply.send(serializeBigInt(row));
  });
}
