/**
 * PATCH /api/user/password  — troca senha do usuário
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/auth";
import { UpdatePasswordSchema } from "@/lib/validations";

export async function PATCH(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const parsed = UpdatePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  // Busca o hash atual
  const userWithHash = await db.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!userWithHash) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 401 });
  }

  const valid = await verifyPassword(currentPassword, userWithHash.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "Senha atual incorreta." },
      { status: 400 }
    );
  }

  const newHash = await hashPassword(newPassword);

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  return NextResponse.json({ ok: true });
}
