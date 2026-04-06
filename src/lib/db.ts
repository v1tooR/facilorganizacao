/**
 * lib/db.ts
 *
 * Singleton do Prisma Client para Next.js com Prisma 7.
 *
 * Prisma 7 usa Driver Adapters para conexão direta ao banco.
 * Para MySQL/MariaDB, usamos @prisma/adapter-mariadb.
 * O adapter aceita a DATABASE_URL diretamente (string) e gerencia o pool.
 *
 * O padrão singleton evita múltiplas conexões durante o hot-reload
 * em desenvolvimento. Em produção, cada processo tem uma instância.
 */

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL não definido. Configure o arquivo .env com a string de conexão MySQL/MariaDB."
    );
  }

  // PrismaMariaDb aceita a URL diretamente e cria o pool de conexões internamente
  const adapter = new PrismaMariaDb(databaseUrl);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

type PrismaClientSingleton = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
