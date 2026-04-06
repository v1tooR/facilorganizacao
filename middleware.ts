/**
 * middleware.ts
 *
 * Proteção de rotas via JWT armazenado em cookie httpOnly.
 *
 * Regras:
 * - /app e sub-rotas → requer sessão válida → redireciona para /login
 * - /login e /register → se já autenticado → redireciona para /app
 *
 * IMPORTANTE: Middleware no Next.js executa no Edge Runtime por padrão.
 * Por isso, usamos `jose` (funciona no Edge) em vez de `jsonwebtoken`.
 * Não importar `db` (Prisma) no middleware — Prisma não suporta Edge Runtime.
 * A validação aqui é apenas do JWT; dados reais do usuário são buscados
 * nos Route Handlers ou Server Components que necessitarem.
 *
 * Para Hostinger: Se o Edge Runtime causar problemas, adicione
 * `export const runtime = 'nodejs'` — mas tente Edge primeiro.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "of_session";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Em produção, este erro nunca deve acontecer
    throw new Error("JWT_SECRET não definido.");
  }
  return new TextEncoder().encode(secret);
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getJwtSecret());
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  const isProtected = pathname.startsWith("/app");
  const isAuthPage =
    pathname === "/login" || pathname === "/register";

  // Rota protegida sem token → redireciona para login
  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Rota protegida com token → verifica validade
  if (isProtected && token) {
    const valid = await verifyToken(token);
    if (!valid) {
      // Token inválido ou expirado → limpa cookie e redireciona
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  // Páginas de auth com token válido → redireciona para dashboard
  if (isAuthPage && token) {
    const valid = await verifyToken(token);
    if (valid) {
      return NextResponse.redirect(new URL("/app", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Aplica o middleware apenas nessas rotas — evita processar assets, _next, etc.
  matcher: ["/app/:path*", "/login", "/register"],
};
