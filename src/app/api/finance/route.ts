/**
 * GET  /api/finance  — lista lançamentos financeiros
 * POST /api/finance  — cria novo lançamento
 *
 * Requer plano PRO ou BUSINESS (hasFeature "finance").
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { hasFeature, featureBlockedMessage } from "@/lib/plans";
import { CreateFinanceEntrySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  if (!hasFeature(user.plan, "finance")) {
    return NextResponse.json(
      { error: featureBlockedMessage("finance") },
      { status: 403 }
    );
  }

  const { searchParams } = request.nextUrl;
  const type       = searchParams.get("type");
  const month      = searchParams.get("month");      // "2026-04"
  const categoryId = searchParams.get("categoryId"); // cuid or "none"
  const status     = searchParams.get("status");     // "CONFIRMED" | "PREDICTED" | "OVERDUE"
  const q          = searchParams.get("q")?.trim();  // busca textual

  let dateFilter: { gte?: Date; lte?: Date } = {};
  if (month) {
    const [year, m] = month.split("-").map(Number);
    dateFilter = {
      gte: new Date(year, m - 1, 1),
      lte: new Date(year, m, 0, 23, 59, 59),
    };
  }

  const entries = await db.financeEntry.findMany({
    where: {
      userId: user.id,
      ...(type ? { type: type as import("@/generated/prisma/enums").FinanceType } : {}),
      ...(status ? { status: status as import("@/generated/prisma/enums").FinanceStatus } : {}),
      ...(month ? { occurredAt: dateFilter } : {}),
      ...(categoryId === "none"
        ? { categoryId: null }
        : categoryId
          ? { categoryId }
          : {}),
      ...(q && q.length >= 1
        ? { OR: [{ title: { contains: q } }, { description: { contains: q } }] }
        : {}),
    },
    orderBy: { occurredAt: "desc" },
    include: {
      category: { select: { id: true, name: true, color: true } },
    },
  });

  // Calcula totais
  let totalIncome = 0;
  let totalExpense = 0;
  for (const e of entries) {
    const amount = Number(e.amount);
    if (e.type === "INCOME") totalIncome += amount;
    else totalExpense += amount;
  }

  return NextResponse.json({
    entries: entries.map((e) => ({ ...e, amount: Number(e.amount) })),
    summary: {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      count: entries.length,
    },
  });
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  if (!hasFeature(user.plan, "finance")) {
    return NextResponse.json(
      { error: featureBlockedMessage("finance") },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const parsed = CreateFinanceEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const entry = await db.financeEntry.create({
    data: {
      type: data.type,
      title: data.title,
      description: data.description,
      amount: data.amount,
      occurredAt: new Date(data.occurredAt),
      categoryId: data.categoryId,
      status: data.status,
      recurrence: data.recurrence,
      userId: user.id,
    },
    include: {
      category: { select: { id: true, name: true, color: true } },
    },
  });

  return NextResponse.json(
    { entry: { ...entry, amount: Number(entry.amount) } },
    { status: 201 }
  );
}
