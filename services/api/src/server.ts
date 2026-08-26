import "dotenv/config";

import Fastify from "fastify";
import cors from "@fastify/cors";
import { authPlugin } from "./plugins/auth.js";
import { prisma } from "./lib/prisma.js";
import { analyticsRoutes } from "./routes/analytics.js";
import { focusRoutes } from "./routes/focus.js";
import { habitRoutes } from "./routes/habits.js";
import { learningRoutes } from "./routes/learning.js";
import { projectRoutes } from "./routes/projects.js";
import { syncRoutes } from "./routes/sync.js";
import { taskRoutes } from "./routes/tasks.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
});

app.get("/health", async () => ({ status: "ok", service: "shyraq-api" }));

app.get("/health/db", async (_request, reply) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok", database: "reachable" };
  } catch (error) {
    app.log.error(error);
    return reply.code(503).send({ status: "error", database: "unreachable" });
  }
});

app.register(
  async (api) => {
    await api.register(authPlugin);
    await api.register(taskRoutes);
    await api.register(projectRoutes);
    await api.register(habitRoutes);
    await api.register(focusRoutes);
    await api.register(learningRoutes);
    await api.register(analyticsRoutes);
    await api.register(syncRoutes);
  },
  { prefix: "/api/v1" },
);

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";
app.listen({ port, host }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
