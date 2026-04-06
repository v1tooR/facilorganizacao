/**
 * lib/auth.ts
 *
 * Utilitários de autenticação:
 * - Hash e verificação de senha com bcryptjs
 * - Criação, leitura e deleção de sessão JWT em cookie httpOnly
 *
 * Usa `jose` em vez de `jsonwebtoken` pois funciona corretamente
 * no runtime do Next.js (App Router) sem dependências nativas.
 *
 * cookies() é ASYNC no Next.js 16 — sempre usar await.
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

// ─── Constantes ───────────────────────────────────────────────────────────

const COOKIE_NAME = "of_session";
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 dias
const BCRYPT_ROUNDS = 12;

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET não definido nas variáveis de ambiente. Adicione ao .env"
    );
  }
  return new TextEncoder().encode(secret);
}

// ─── Tipos ────────────────────────────────────────────────────────────────

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
}

// ─── Senha ────────────────────────────────────────────────────────────────

/**
 * Gera o hash bcrypt de uma senha em texto plano.
 * Usar somente no servidor (Server Actions ou Route Handlers).
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compara uma senha em texto plano com um hash bcrypt armazenado.
 * Tempo constante — resistente a timing attacks.
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── Sessão ───────────────────────────────────────────────────────────────

/**
 * Cria uma sessão JWT e a armazena em cookie httpOnly.
 * Deve ser chamado apenas em Server Actions ou Route Handlers.
 */
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getJwtSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  });
}

/**
 * Lê e valida a sessão atual a partir do cookie.
 * Retorna null se não houver sessão ou se o token estiver expirado/inválido.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as SessionPayload;
  } catch {
    // Token expirado, malformado ou assinatura inválida
    return null;
  }
}

/**
 * Remove a sessão deletando o cookie.
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
