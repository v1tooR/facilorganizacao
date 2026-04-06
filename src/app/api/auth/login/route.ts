/**
 * POST /api/auth/login
 *
 * Autenticação de usuário.
 * - Valida entrada
 * - Busca usuário pelo e-mail
 * - Compara senha com bcrypt (tempo constante)
 * - Cria sessão JWT em cookie httpOnly
 * - Retorna { user } ou { error }
 *
 * Mensagem de erro intencional genérica ("credenciais inválidas") para
 * não revelar se o e-mail existe ou não no sistema.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { LoginSchema } from "@/lib/validations";

const INVALID_CREDENTIALS_MSG = "E-mail ou senha incorretos.";

export async function POST(request: NextRequest) {
  try {
    // 1. Parse e validação
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Corpo da requisição inválido." },
        { status: 400 }
      );
    }

    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: INVALID_CREDENTIALS_MSG },
        { status: 401 }
      );
    }

    const { email, password } = parsed.data;

    // 2. Buscar usuário — sempre busca mesmo se e-mail não existir
    //    para evitar timing attack revelando existência de conta
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        plan: true,
      },
    });

    // 3. Verificar senha — bcrypt.compare em tempo constante
    const passwordValid = user
      ? await verifyPassword(password, user.passwordHash)
      : await verifyPassword(password, "$2b$12$invalidhashfortimingnormaliz"); // tempo constante mesmo sem usuário

    if (!user || !passwordValid) {
      return NextResponse.json(
        { error: INVALID_CREDENTIALS_MSG },
        { status: 401 }
      );
    }

    // 4. Criar sessão JWT em cookie httpOnly
    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // 5. Retornar dados públicos do usuário
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
      },
    });
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json(
      { error: "Erro interno. Tente novamente." },
      { status: 500 }
    );
  }
}
