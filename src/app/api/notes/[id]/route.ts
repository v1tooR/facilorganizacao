/**
 * GET    /api/notes/[id]  — busca nota por id (inclui projeto vinculado)
 * PUT    /api/notes/[id]  — atualiza nota (tags, isPinned, isArchived, etc.)
 * DELETE /api/notes/[id]  — exclui nota
 *
 * Quando isPinned muda: atualiza pinnedAt automaticamente.
 * Quando isArchived muda: atualiza archivedAt automaticamente.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { UpdateNoteSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const noteDb = db.note as any;

function parseNote(n: Record<string, unknown>) {
  return {
    ...n,
    tags: n.tags ? JSON.parse(n.tags as string) : [],
  };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const note = await noteDb.findFirst({
    where: { id, userId: user.id },
    include: { project: { select: { id: true, name: true } } },
  });

  if (!note) {
    return NextResponse.json({ error: "Anotação não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ note: parseNote(note) });
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

  const { tags, isPinned, isArchived, ...rest } = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = { ...rest };

  if (tags !== undefined) {
    updateData.tags = tags.length > 0 ? JSON.stringify(tags) : null;
  }
  if (isPinned !== undefined) {
    updateData.isPinned = isPinned;
    updateData.pinnedAt = isPinned ? new Date() : null;
  }
  if (isArchived !== undefined) {
    updateData.isArchived = isArchived;
    updateData.archivedAt = isArchived ? new Date() : null;
  }

  const note = await noteDb.update({
    where: { id },
    data: updateData,
    include: { project: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ note: parseNote(note) });
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
