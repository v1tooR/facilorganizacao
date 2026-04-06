/**
 * POST /api/auth/register
 *
 * Cadastro de novo usuário.
 * - Valida entrada com Zod
 * - Verifica duplicidade de e-mail
 * - Faz hash da senha com bcryptjs (12 rounds)
 * - Persiste no banco via Prisma
 * - Retorna JSON com { user } ou { error }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { RegisterSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    // 1. Parse do body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Corpo da requisição inválido." },
        { status: 400 }
      );
    }

    // 2. Validação com Zod
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: firstIssue.message,
          field: firstIssue.path[0] ?? null,
          issues: parsed.error.issues.map((issue) => ({
            field: issue.path[0],
            message: issue.message,
          })),
        },
        { status: 422 }
      );
    }

    const { name, email, password } = parsed.data;

    // 3. Verificar duplicidade de e-mail
    const existing = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado.", field: "email" },
        { status: 409 }
      );
    }

    // 4. Hash da senha
    const passwordHash = await hashPassword(password);

    // 5. Criar usuário
    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        plan: "FREE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        createdAt: true,
      },
    });

    // 6. Retornar usuário criado (sem passwordHash)
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    // Captura inesperada — não expor detalhes internos em produção
    console.error("[POST /api/auth/register]", error);

    return NextResponse.json(
      { error: "Erro interno. Tente novamente." },
      { status: 500 }
    );
  }
}
