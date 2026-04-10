/**
 * GET  /api/notes  — lista notas do usuário
 * POST /api/notes  — cria nova nota (verifica limite do plano)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { canCreate, limitReachedMessage } from "@/lib/plans";
import { CreateNoteSchema } from "@/lib/validations";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const notes = await db.note.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ notes });
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

  const note = await db.note.create({
    data: {
      ...parsed.data,
      userId: user.id,
    },
  });

  return NextResponse.json({ note }, { status: 201 });
}
