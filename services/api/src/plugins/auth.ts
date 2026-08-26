import type { FastifyPluginAsync } from "fastify";
import { getSupabaseClient } from "../lib/supabase.js";
import { prisma } from "../lib/prisma.js";

declare module "fastify" {
  interface FastifyRequest {
    userId: string | null;
  }
}

export const authPlugin: FastifyPluginAsync = async (app) => {
  app.decorateRequest("userId", null);

  app.addHook("preHandler", async (request, reply) => {
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return reply.code(401).send({
        error: "UNAUTHORIZED",
        message: "A Bearer access token is required",
      });
    }

    const token = authorization.slice("Bearer ".length).trim();

    if (!token) {
      return reply.code(401).send({
        error: "UNAUTHORIZED",
        message: "Access token is missing",
      });
    }

    const { data, error } = await getSupabaseClient().auth.getUser(token);

    if (error || !data.user) {
      return reply.code(401).send({
        error: "UNAUTHORIZED",
        message: "Invalid or expired access token",
      });
    }

    request.userId = data.user.id;

    await prisma.user.upsert({
      where: { id: data.user.id },
      create: { id: data.user.id },
      update: {},
    });
  });
};
