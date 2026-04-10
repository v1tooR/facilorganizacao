/**
 * GET  /api/categories  — lista categorias do usuário
 * POST /api/categories  — cria nova categoria
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { canCreate, limitReachedMessage } from "@/lib/plans";
import { CreateCategorySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = request.nextUrl;
  const scope = searchParams.get("scope");

  const categories = await db.category.findMany({
    where: {
      userId: user.id,
      ...(scope ? { scope: scope as import("@/generated/prisma/enums").CategoryScope } : {}),
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const currentCount = await db.category.count({ where: { userId: user.id } });
  if (!canCreate(user.plan, "categories", currentCount)) {
    return NextResponse.json(
      { error: limitReachedMessage(user.plan, "categories") },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const parsed = CreateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const category = await db.category.create({
    data: {
      ...parsed.data,
      userId: user.id,
    },
  });

  return NextResponse.json({ category }, { status: 201 });
}
