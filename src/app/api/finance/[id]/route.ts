/**
 * GET    /api/finance/[id]  — detalhe do lançamento
 * PUT    /api/finance/[id]  — atualiza lançamento
 * DELETE /api/finance/[id]  — exclui lançamento
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { hasFeature, featureBlockedMessage } from "@/lib/plans";
import { UpdateFinanceEntrySchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { user, error } = await requireAuth();
  if (error) return error;

  if (!hasFeature(user.plan, "finance")) {
    return NextResponse.json({ error: featureBlockedMessage("finance") }, { status: 403 });
  }

  const { id } = await params;

  const entry = await db.financeEntry.findFirst({
    where: { id, userId: user.id },
    include: { category: { select: { id: true, name: true, color: true } } },
  });

  if (!entry) {
    return NextResponse.json({ error: "Lançamento não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ entry: { ...entry, amount: Number(entry.amount) } });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { user, error } = await requireAuth();
  if (error) return error;

  if (!hasFeature(user.plan, "finance")) {
    return NextResponse.json({ error: featureBlockedMessage("finance") }, { status: 403 });
  }

  const { id } = await params;

  const existing = await db.financeEntry.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Lançamento não encontrado." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const parsed = UpdateFinanceEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const entry = await db.financeEntry.update({
    where: { id },
    data: {
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.occurredAt !== undefined ? { occurredAt: new Date(data.occurredAt) } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId ?? null } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.recurrence !== undefined ? { recurrence: data.recurrence } : {}),
    },
    include: {
      category: { select: { id: true, name: true, color: true } },
    },
  });

  return NextResponse.json({ entry: { ...entry, amount: Number(entry.amount) } });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { user, error } = await requireAuth();
  if (error) return error;

  if (!hasFeature(user.plan, "finance")) {
    return NextResponse.json({ error: featureBlockedMessage("finance") }, { status: 403 });
  }

  const { id } = await params;

  const existing = await db.financeEntry.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Lançamento não encontrado." }, { status: 404 });
  }

  await db.financeEntry.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
