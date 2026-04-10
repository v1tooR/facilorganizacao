/**
 * GET  /api/projects  — lista projetos do usuário
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

  const projects = await db.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { tasks: true } },
    },
  });

  return NextResponse.json({ projects });
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

  const project = await db.project.create({
    data: {
      ...parsed.data,
      userId: user.id,
    },
    include: { _count: { select: { tasks: true } } },
  });

  return NextResponse.json({ project }, { status: 201 });
}
