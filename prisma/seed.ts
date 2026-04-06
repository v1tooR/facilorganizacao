/**
 * prisma/seed.ts
 *
 * Seed de desenvolvimento — cria dados básicos para facilitar testes locais.
 * NÃO executar em produção.
 *
 * Execução: npm run db:seed
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { TaskPriority, TaskStatus, FinanceType, ProjectStatus, CategoryScope } from "../src/generated/prisma/enums";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL não definido no .env");

const adapter = new PrismaMariaDb(databaseUrl);
const db = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Iniciando seed...");

  // Limpa dados existentes na ordem correta (respeita FK)
  await db.financeEntry.deleteMany();
  await db.task.deleteMany();
  await db.note.deleteMany();
  await db.category.deleteMany();
  await db.project.deleteMany();
  await db.user.deleteMany();

  // ── Usuário de desenvolvimento ──────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Dev@12345", 12);

  const user = await db.user.create({
    data: {
      name: "Maria Silva",
      email: "dev@organizacaofacil.com.br",
      passwordHash,
      plan: "PRO",
    },
  });

  console.log(`✅ Usuário criado: ${user.email} (senha: Dev@12345)`);

  // ── Categorias ──────────────────────────────────────────────────────────
  const [catPessoal, catTrabalho, catSaude, catEntrada, catMoradia, catAlimentacao] =
    await Promise.all([
      db.category.create({ data: { name: "Pessoal", scope: CategoryScope.TASK, color: "#DBEAFE", userId: user.id } }),
      db.category.create({ data: { name: "Trabalho", scope: CategoryScope.TASK, color: "#FEF3C7", userId: user.id } }),
      db.category.create({ data: { name: "Saúde", scope: CategoryScope.TASK, color: "#D1FAE5", userId: user.id } }),
      db.category.create({ data: { name: "Renda", scope: CategoryScope.FINANCE, color: "#D1FAE5", userId: user.id } }),
      db.category.create({ data: { name: "Moradia", scope: CategoryScope.FINANCE, color: "#FEE2E2", userId: user.id } }),
      db.category.create({ data: { name: "Alimentação", scope: CategoryScope.FINANCE, color: "#FED7AA", userId: user.id } }),
    ]);

  console.log("✅ Categorias criadas");

  // ── Projetos ────────────────────────────────────────────────────────────
  const [projRedesign, projCampanha, projApp] = await Promise.all([
    db.project.create({
      data: { name: "Redesign do site", description: "Atualização completa do site institucional", status: ProjectStatus.IN_PROGRESS, progress: 72, userId: user.id },
    }),
    db.project.create({
      data: { name: "Campanha Q2", description: "Campanha de marketing para o segundo trimestre", status: ProjectStatus.IN_PROGRESS, progress: 45, userId: user.id },
    }),
    db.project.create({
      data: { name: "App mobile v2", description: "Segunda versão do aplicativo mobile", status: ProjectStatus.PLANNING, progress: 18, userId: user.id },
    }),
  ]);

  console.log("✅ Projetos criados");

  // ── Tarefas ─────────────────────────────────────────────────────────────
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  await db.task.createMany({
    data: [
      {
        title: "Revisar relatório Q2",
        description: "Revisar e aprovar o relatório de resultados do segundo trimestre.",
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dueDate: today,
        userId: user.id,
        projectId: projCampanha.id,
        categoryId: catTrabalho.id,
      },
      {
        title: "Reunião com equipe de design",
        description: "Alinhamento sobre os wireframes do novo site.",
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.MEDIUM,
        dueDate: lastWeek,
        completedAt: lastWeek,
        userId: user.id,
        projectId: projRedesign.id,
        categoryId: catTrabalho.id,
      },
      {
        title: "Pagar fornecedor XYZ",
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dueDate: tomorrow,
        userId: user.id,
        categoryId: catTrabalho.id,
      },
      {
        title: "Atualizar planilha de gastos",
        status: TaskStatus.PENDING,
        priority: TaskPriority.LOW,
        userId: user.id,
        categoryId: catPessoal.id,
      },
      {
        title: "Consulta médica",
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dueDate: tomorrow,
        userId: user.id,
        categoryId: catSaude.id,
      },
    ],
  });

  console.log("✅ Tarefas criadas");

  // ── Notas ───────────────────────────────────────────────────────────────
  await db.note.createMany({
    data: [
      {
        title: "Ideias para campanha",
        content: "Explorar parceria com influenciadores do nicho. Considerar formato de vídeo curto para redes sociais. Testar anúncio em newsletter do setor.",
        color: "#FEF3C7",
        userId: user.id,
      },
      {
        title: "Lista de compras casa",
        content: "Detergente, esponja, papel toalha, café, açúcar, leite, pão integral, frutas da semana.",
        color: "#D1FAE5",
        userId: user.id,
      },
      {
        title: "Próximos passos projeto app",
        content: "1. Validar wireframes com cliente\n2. Ajustar wireframes conforme feedback\n3. Iniciar desenvolvimento do protótipo\n4. Apresentar para stakeholders",
        color: "#DBEAFE",
        userId: user.id,
      },
    ],
  });

  console.log("✅ Notas criadas");

  // ── Lançamentos financeiros ──────────────────────────────────────────────
  const thisMonth = new Date();
  const lastMonth = new Date(thisMonth);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  await db.financeEntry.createMany({
    data: [
      // Entradas
      {
        type: FinanceType.INCOME,
        title: "Salário",
        amount: "5000.00",
        occurredAt: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 5),
        userId: user.id,
        categoryId: catEntrada.id,
      },
      {
        type: FinanceType.INCOME,
        title: "Freelance — Projeto site",
        amount: "2500.00",
        occurredAt: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 12),
        userId: user.id,
        categoryId: catEntrada.id,
      },
      // Saídas
      {
        type: FinanceType.EXPENSE,
        title: "Aluguel",
        amount: "1800.00",
        occurredAt: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1),
        userId: user.id,
        categoryId: catMoradia.id,
      },
      {
        type: FinanceType.EXPENSE,
        title: "Supermercado",
        amount: "680.50",
        occurredAt: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 8),
        userId: user.id,
        categoryId: catAlimentacao.id,
      },
      {
        type: FinanceType.EXPENSE,
        title: "Contas (água, luz, internet)",
        amount: "420.00",
        occurredAt: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 10),
        userId: user.id,
        categoryId: catMoradia.id,
      },
      {
        type: FinanceType.EXPENSE,
        title: "Restaurante",
        amount: "185.90",
        occurredAt: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 15),
        userId: user.id,
        categoryId: catAlimentacao.id,
      },
    ],
  });

  console.log("✅ Lançamentos financeiros criados");

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log("─────────────────────────────────────");
  console.log("  Login de desenvolvimento:");
  console.log("  E-mail: dev@organizacaofacil.com.br");
  console.log("  Senha:  Dev@12345");
  console.log("─────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
