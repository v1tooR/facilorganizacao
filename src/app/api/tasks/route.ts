/**
 * GET  /api/tasks  — lista tarefas do usuário
 * POST /api/tasks  — cria nova tarefa (verifica limite do plano)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { canCreate, limitReachedMessage } from "@/lib/plans";
import { CreateTaskSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const projectId = searchParams.get("projectId");

  const tasks = await db.task.findMany({
    where: {
      userId: user.id,
      ...(status ? { status: status as import("@/generated/prisma/enums").TaskStatus } : {}),
      ...(priority ? { priority: priority as import("@/generated/prisma/enums").TaskPriority } : {}),
      ...(projectId ? { projectId } : {}),
    },
    orderBy: [{ dueDate: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    include: {
      category: { select: { id: true, name: true, color: true } },
      project: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  // Verificar limite do plano
  const currentCount = await db.task.count({ where: { userId: user.id } });
  if (!canCreate(user.plan, "tasks", currentCount)) {
    return NextResponse.json(
      { error: limitReachedMessage(user.plan, "tasks") },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const parsed = CreateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const task = await db.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      projectId: data.projectId,
      categoryId: data.categoryId,
      userId: user.id,
    },
    include: {
      category: { select: { id: true, name: true, color: true } },
      project: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ task }, { status: 201 });
}
