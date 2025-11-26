import Fastify from "fastify";
import cors from "@fastify/cors";
import repoRoutes from "./routes/repo.routes";
import analysisRoutes from "./routes/analysis.routes";
import overheadRoutes from "./routes/overhead.routes";

const app = Fastify({ logger: true });

app.register(cors, { origin: true });

app.register(repoRoutes, { prefix: "/repos" });
app.register(analysisRoutes, { prefix: "/repos" });
app.register(overheadRoutes, { prefix: "/repos" });

export default app;
