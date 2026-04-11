/**
 * GET  /api/projects  — lista projetos do usuário com contagem de tarefas
 * POST /api/projects  — cria novo projeto (verifica limite do plano)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { canCreate, limitReachedMessage } from "@/lib/plans";
import { CreateProjectSchema } from "@/lib/validations";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const [projects, completedCounts] = await Promise.all([
    db.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { tasks: true } },
      },
    }),
    db.task.groupBy({
      by: ["projectId"],
      where: { userId: user.id, projectId: { not: null }, status: "COMPLETED" },
      _count: { id: true },
    }),
  ]);

  const completedMap: Record<string, number> = {};
  for (const c of completedCounts) {
    if (c.projectId) completedMap[c.projectId] = c._count.id;
  }

  return NextResponse.json({
    projects: projects.map((p) => ({
      ...p,
      completedTaskCount: completedMap[p.id] ?? 0,
    })),
  });
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const currentCount = await db.project.count({ where: { userId: user.id } });
  if (!canCreate(user.plan, "projects", currentCount)) {
    return NextResponse.json(
      { error: limitReachedMessage(user.plan, "projects") },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const parsed = CreateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { startDate, dueDate, ...rest } = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const project = await db.project.create({
    data: {
      ...rest,
      startDate: startDate ? new Date(startDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      userId: user.id,
    } as any,
    include: { _count: { select: { tasks: true } } },
  });

  return NextResponse.json({ project: { ...project, completedTaskCount: 0 } }, { status: 201 });
}
