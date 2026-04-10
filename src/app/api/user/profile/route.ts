/**
 * PATCH /api/user/profile  — atualiza nome e/ou e-mail
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { UpdateProfileSchema } from "@/lib/validations";

export async function PATCH(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const parsed = UpdateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Se está trocando o e-mail, verifica unicidade
  if (data.email && data.email !== user.email) {
    const emailInUse = await db.user.findUnique({ where: { email: data.email } });
    if (emailInUse) {
      return NextResponse.json(
        { error: "Este e-mail já está em uso." },
        { status: 409 }
      );
    }
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      ...(data.name ? { name: data.name } : {}),
      ...(data.email ? { email: data.email } : {}),
    },
    select: { id: true, name: true, email: true, plan: true },
  });

  return NextResponse.json({ user: updated });
}
