/**
 * DELETE /api/categories/[id]  — exclui categoria
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const existing = await db.category.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });
  }

  // Ao excluir, tarefas/lançamentos ficam sem categoria (onDelete: SetNull no schema)
  await db.category.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
