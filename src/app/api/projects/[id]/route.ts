/**
 * GET    /api/projects/[id]  — busca projeto por id
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
    include: { _count: { select: { tasks: true } } },
  });

  if (!project) {
    return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ project });
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

  const project = await db.project.update({
    where: { id },
    data: parsed.data,
    include: { _count: { select: { tasks: true } } },
  });

  return NextResponse.json({ project });
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
