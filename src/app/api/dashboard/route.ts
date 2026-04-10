/**
 * GET /api/dashboard
 *
 * Retorna dados agregados para o dashboard:
 * - contagens de tarefas, projetos, notas
 * - resumo financeiro do mês atual + histórico dos últimos 6 meses
 * - tarefas recentes
 * - projetos ativos
 * - notas recentes
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { getPlanConfig, hasFeature } from "@/lib/plans";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const financeEnabled = hasFeature(user.plan, "finance");

  // Executa consultas em paralelo
  const [
    taskCounts,
    projectCount,
    noteCount,
    recentTasks,
    activeProjects,
    recentNotes,
    monthlyFinance,
    financeHistory,
  ] = await Promise.all([
    db.task.groupBy({
      by: ["status"],
      where: { userId: user.id },
      _count: { _all: true },
    }),

    db.project.count({
      where: { userId: user.id, status: { in: ["PLANNING", "IN_PROGRESS"] } },
    }),

    db.note.count({ where: { userId: user.id } }),

    db.task.findMany({
      where: {
        userId: user.id,
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
      take: 8,
      include: { category: { select: { name: true, color: true } } },
    }),

    db.project.findMany({
      where: {
        userId: user.id,
        status: { in: ["PLANNING", "IN_PROGRESS", "ON_HOLD"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 4,
      include: { _count: { select: { tasks: true } } },
    }),

    db.note.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),

    // Resumo financeiro do mês atual
    financeEnabled
      ? db.financeEntry.groupBy({
          by: ["type"],
          where: {
            userId: user.id,
            occurredAt: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        })
      : Promise.resolve([]),

    // Histórico dos últimos 6 meses (para gráfico)
    financeEnabled
      ? db.financeEntry.findMany({
          where: {
            userId: user.id,
            occurredAt: { gte: sixMonthsAgo },
          },
          select: { type: true, amount: true, occurredAt: true },
        })
      : Promise.resolve([]),
  ]);

  // Processa contagens de tarefas
  const taskCountMap = Object.fromEntries(
    taskCounts.map((t) => [t.status, t._count._all])
  );
  const pendingTasks = (taskCountMap["PENDING"] ?? 0) + (taskCountMap["IN_PROGRESS"] ?? 0);
  const completedTasks = taskCountMap["COMPLETED"] ?? 0;
  const totalTasks = Object.values(taskCountMap).reduce((s, v) => s + v, 0);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const tasksToday = recentTasks.filter(
    (t) => t.dueDate && t.dueDate >= todayStart && t.dueDate <= todayEnd
  ).length;

  // Resumo financeiro do mês
  const incomeMap = monthlyFinance.find((f) => f.type === "INCOME");
  const expenseMap = monthlyFinance.find((f) => f.type === "EXPENSE");
  const monthlyIncome = incomeMap?._sum.amount ? Number(incomeMap._sum.amount) : 0;
  const monthlyExpense = expenseMap?._sum.amount ? Number(expenseMap._sum.amount) : 0;

  // Agrega histórico 6 meses por mês
  const monthlyMap: Record<string, { income: number; expense: number }> = {};
  for (const entry of financeHistory) {
    const d = new Date(entry.occurredAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap[key]) monthlyMap[key] = { income: 0, expense: 0 };
    if (entry.type === "INCOME") monthlyMap[key].income += Number(entry.amount);
    else monthlyMap[key].expense += Number(entry.amount);
  }

  // Preenche meses sem dados com zero (garante sempre 6 meses)
  const months6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    return {
      month: key,
      label,
      income: monthlyMap[key]?.income ?? 0,
      expense: monthlyMap[key]?.expense ?? 0,
    };
  });

  const planConfig = getPlanConfig(user.plan);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      planLabel: planConfig.label,
      planLimits: planConfig.limits,
    },
    stats: {
      pendingTasks,
      completedTasks,
      totalTasks,
      tasksToday,
      activeProjects: projectCount,
      totalNotes: noteCount,
    },
    finance: financeEnabled
      ? {
          available: true,
          monthlyIncome,
          monthlyExpense,
          monthlyBalance: monthlyIncome - monthlyExpense,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          months: months6,
        }
      : { available: false },
    recentTasks: recentTasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      category: t.category,
    })),
    activeProjects: activeProjects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      progress: p.progress,
      taskCount: p._count.tasks,
    })),
    recentNotes: recentNotes.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      color: n.color,
    })),
  });
}
