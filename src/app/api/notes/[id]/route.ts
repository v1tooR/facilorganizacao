/**
 * GET    /api/notes/[id]  — busca nota por id
 * PUT    /api/notes/[id]  — atualiza nota
 * DELETE /api/notes/[id]  — exclui nota
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { UpdateNoteSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const note = await db.note.findFirst({ where: { id, userId: user.id } });

  if (!note) {
    return NextResponse.json({ error: "Anotação não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ note });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const existing = await db.note.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Anotação não encontrada." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const parsed = UpdateNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const note = await db.note.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ note });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const existing = await db.note.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Anotação não encontrada." }, { status: 404 });
  }

  await db.note.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
