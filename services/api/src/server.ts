import "dotenv/config";

import Fastify from "fastify";
import { authPlugin } from "./plugins/auth.js";
import { prisma } from "./lib/prisma.js";
import { taskRoutes } from "./routes/tasks.js";

const app = Fastify({ logger: true });

app.get("/health", async () => ({
  status: "ok",
  service: "shyraq-api",
}));

app.get("/health/db", async (_request, reply) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: "ok",
      database: "reachable",
    };
  } catch (error) {
    app.log.error(error);

    return reply.code(503).send({
      status: "error",
      database: "unreachable",
    });
  }
});

app.register(
  async (api) => {
    await api.register(authPlugin);
    await api.register(taskRoutes);
  },
  { prefix: "/api/v1" },
);

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

app.listen({ port, host }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
