import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "services/api/prisma/schema.prisma",
  migrations: {
    path: "database/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
