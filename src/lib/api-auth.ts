/**
 * lib/api-auth.ts
 *
 * Helper compartilhado para Route Handlers autenticados.
 *
 * Uso:
 *   const { user, error } = await requireAuth();
 *   if (error) return error;
 *   // user está disponível e autenticado
 */

import { NextResponse } from "next/server";
import { getSession } from "./auth";
import { db } from "./db";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  plan: import("@/generated/prisma/enums").UserPlan;
};

type AuthResult =
  | { user: AuthUser; error: null }
  | { user: null; error: NextResponse };

/**
 * Valida a sessão e retorna o usuário autenticado.
 * Em caso de falha, retorna um NextResponse 401 pronto para retornar.
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await getSession();

  if (!session) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      ),
    };
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, plan: true },
  });

  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 401 }
      ),
    };
  }

  return { user, error: null };
}
