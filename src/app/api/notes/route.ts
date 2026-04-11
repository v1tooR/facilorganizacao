/**
 * GET  /api/notes          — lista notas ativas (isArchived=false) do usuário
 * GET  /api/notes?archived=1 — lista notas arquivadas
 * POST /api/notes          — cria nova nota (verifica limite do plano)
 *
 * Tags são armazenadas como JSON string no campo `tags` (Text).
 * Pinned notes aparecem primeiro na ordenação padrão.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { canCreate, limitReachedMessage } from "@/lib/plans";
import { CreateNoteSchema } from "@/lib/validations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const noteDb = db.note as any;

function parseNote(n: Record<string, unknown>) {
  return {
    ...n,
    tags: n.tags ? JSON.parse(n.tags as string) : [],
  };
}

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const archived = searchParams.get("archived") === "1";

  const notes = await noteDb.findMany({
    where: { userId: user.id, isArchived: archived },
    orderBy: archived
      ? [{ updatedAt: "desc" }]
      : [{ isPinned: "desc" }, { pinnedAt: "desc" }, { updatedAt: "desc" }],
    include: {
      project: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ notes: notes.map(parseNote) });
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const currentCount = await db.note.count({ where: { userId: user.id } });
  if (!canCreate(user.plan, "notes", currentCount)) {
    return NextResponse.json(
      { error: limitReachedMessage(user.plan, "notes") },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const parsed = CreateNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { tags, ...rest } = parsed.data;

  const note = await noteDb.create({
    data: {
      ...rest,
      tags: tags && tags.length > 0 ? JSON.stringify(tags) : null,
      userId: user.id,
    },
    include: {
      project: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ note: parseNote(note) }, { status: 201 });
}
