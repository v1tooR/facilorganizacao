/**
 * GET    /api/tasks/[id]  — busca tarefa por id
 * PUT    /api/tasks/[id]  — atualiza tarefa
 * DELETE /api/tasks/[id]  — exclui tarefa
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { UpdateTaskSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const task = await db.task.findFirst({
    where: { id, userId: user.id },
    include: {
      category: { select: { id: true, name: true, color: true } },
      project: { select: { id: true, name: true } },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Tarefa não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ task });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  // Garante que a tarefa pertence ao usuário
  const existing = await db.task.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Tarefa não encontrada." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const parsed = UpdateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const task = await db.task.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.dueDate !== undefined ? { dueDate: data.dueDate ? new Date(data.dueDate) : null } : {}),
      ...(data.projectId !== undefined ? { projectId: data.projectId ?? null } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId ?? null } : {}),
      // Se completando, registra data
      ...(data.status === "COMPLETED" ? { completedAt: new Date() } : {}),
      ...(data.status && data.status !== "COMPLETED" ? { completedAt: null } : {}),
    },
    include: {
      category: { select: { id: true, name: true, color: true } },
      project: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ task });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const existing = await db.task.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Tarefa não encontrada." }, { status: 404 });
  }

  await db.task.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
