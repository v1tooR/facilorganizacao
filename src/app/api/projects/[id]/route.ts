/**
 * GET    /api/projects/[id]  — busca projeto por id (inclui tarefas)
 * PUT    /api/projects/[id]  — atualiza projeto
 * DELETE /api/projects/[id]  — exclui projeto
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { UpdateProjectSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const project = await db.project.findFirst({
    where: { id, userId: user.id },
    include: {
      _count: { select: { tasks: true } },
      tasks: {
        orderBy: [
          { status: "asc" },
          { priority: "desc" },
          { dueDate: "asc" },
          { createdAt: "desc" },
        ],
        include: {
          category: { select: { id: true, name: true, color: true } },
        },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  }

  const completedTaskCount = project.tasks.filter((t) => t.status === "COMPLETED").length;

  return NextResponse.json({ project: { ...project, completedTaskCount } });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const existing = await db.project.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const parsed = UpdateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { startDate, dueDate, ...rest } = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const project = await db.project.update({
    where: { id },
    data: {
      ...rest,
      ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
    } as any,
    include: { _count: { select: { tasks: true } } },
  });

  const completedTaskCount = await db.task.count({
    where: { projectId: id, userId: user.id, status: "COMPLETED" },
  });

  return NextResponse.json({ project: { ...project, completedTaskCount } });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const existing = await db.project.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  }

  await db.project.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
