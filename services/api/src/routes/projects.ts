import type { FastifyPluginAsync } from "fastify";
import { v7 as uuidv7, validate as uuidValidate } from "uuid";
import { prisma } from "../lib/prisma.js";

interface CreateProjectBody {
  id?: string;
  name: string;
  description?: string | null;
}

interface UpdateProjectBody {
  name?: string;
  description?: string | null;
  archived?: boolean;
}

interface ProjectParams {
  id: string;
}

const validateName = (name: unknown) =>
  typeof name === "string" && name.trim().length > 0 && name.length <= 200;

export const projectRoutes: FastifyPluginAsync = async (app) => {
  app.get("/projects", async (request) => {
    const userId = request.userId!;

    return prisma.project.findMany({
      where: { userId, archivedAt: null },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { tasks: true } } },
    });
  });

  app.post<{ Body: CreateProjectBody }>("/projects", async (request, reply) => {
    const userId = request.userId!;
    const { id, name, description = null } = request.body;

    if (!validateName(name)) {
      return reply.code(400).send({
        error: "INVALID_NAME",
        message: "Project name must be between 1 and 200 characters",
      });
    }

    if (id && !uuidValidate(id)) {
      return reply.code(400).send({
        error: "INVALID_ID",
        message: "Project id must be a valid UUID",
      });
    }

    const project = await prisma.project.create({
      data: {
        id: id ?? uuidv7(),
        userId,
        name: name.trim(),
        description,
      },
      include: { _count: { select: { tasks: true } } },
    });

    return reply.code(201).send(project);
  });

  app.patch<{ Params: ProjectParams; Body: UpdateProjectBody }>(
    "/projects/:id",
    async (request, reply) => {
      const userId = request.userId!;
      const { id } = request.params;
      const { name, description, archived } = request.body;

      if (!uuidValidate(id)) {
        return reply.code(400).send({
          error: "INVALID_ID",
          message: "Project id must be a valid UUID",
        });
      }

      if (name !== undefined && !validateName(name)) {
        return reply.code(400).send({
          error: "INVALID_NAME",
          message: "Project name must be between 1 and 200 characters",
        });
      }

      const current = await prisma.project.findFirst({
        where: { id, userId },
      });

      if (!current) {
        return reply.code(404).send({
          error: "NOT_FOUND",
          message: "Project not found",
        });
      }

      const project = await prisma.project.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name: name.trim() } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(archived !== undefined
            ? { archivedAt: archived ? new Date() : null }
            : {}),
        },
        include: { _count: { select: { tasks: true } } },
      });

      return reply.send(project);
    },
  );

  app.delete<{ Params: ProjectParams }>(
    "/projects/:id",
    async (request, reply) => {
      const userId = request.userId!;
      const { id } = request.params;

      if (!uuidValidate(id)) {
        return reply.code(400).send({
          error: "INVALID_ID",
          message: "Project id must be a valid UUID",
        });
      }

      const project = await prisma.project.findFirst({
        where: { id, userId },
      });

      if (!project) {
        return reply.code(404).send({
          error: "NOT_FOUND",
          message: "Project not found",
        });
      }

      await prisma.project.delete({ where: { id } });
      return reply.code(204).send();
    },
  );
};
