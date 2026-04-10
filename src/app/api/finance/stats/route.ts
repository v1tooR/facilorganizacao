/**
 * GET /api/finance/stats?month=2026-04
 *
 * Retorna:
 *  - months[]: últimos 6 meses com income/expense (para gráfico)
 *  - categoryBreakdown[]: top categorias de despesa no mês selecionado
 *  - comparison: variação vs mês anterior
 *
 * Requer plano PRO ou BUSINESS.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { hasFeature, featureBlockedMessage } from "@/lib/plans";

const PT_MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  if (!hasFeature(user.plan, "finance")) {
    return NextResponse.json({ error: featureBlockedMessage("finance") }, { status: 403 });
  }

  const monthParam = request.nextUrl.searchParams.get("month"); // "2026-04"

  // ── Determinar mês de referência ──────────────────────────────────────────
  let refYear: number;
  let refMonth: number; // 1-based

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    refYear = y;
    refMonth = m;
  } else {
    const now = new Date();
    refYear = now.getFullYear();
    refMonth = now.getMonth() + 1;
  }

  // ── 6 meses a partir do mês de referência (inclusive) ────────────────────
  const monthKeys: Array<{ year: number; month: number; label: string; key: string }> = [];
  for (let i = 5; i >= 0; i--) {
    let m = refMonth - i;
    let y = refYear;
    while (m <= 0) { m += 12; y--; }
    monthKeys.push({
      year: y,
      month: m,
      label: PT_MONTHS[m - 1],
      key: `${y}-${String(m).padStart(2, "0")}`,
    });
  }

  const sixMonthsStart = new Date(monthKeys[0].year, monthKeys[0].month - 1, 1);
  const sixMonthsEnd   = new Date(refYear, refMonth, 0, 23, 59, 59);

  // ── Mês anterior (para comparação) ───────────────────────────────────────
  let prevMonth = refMonth - 1;
  let prevYear  = refYear;
  if (prevMonth <= 0) { prevMonth = 12; prevYear--; }
  const prevStart = new Date(prevYear, prevMonth - 1, 1);
  const prevEnd   = new Date(prevYear, prevMonth, 0, 23, 59, 59);

  // ── Mês atual ─────────────────────────────────────────────────────────────
  const curStart = new Date(refYear, refMonth - 1, 1);
  const curEnd   = new Date(refYear, refMonth, 0, 23, 59, 59);

  // ── Consultas em paralelo ─────────────────────────────────────────────────
  const [allEntries, prevEntries, catEntries] = await Promise.all([
    // Todos os lançamentos dos 6 meses (para gráfico)
    db.financeEntry.findMany({
      where: {
        userId: user.id,
        occurredAt: { gte: sixMonthsStart, lte: sixMonthsEnd },
      },
      select: { type: true, amount: true, occurredAt: true },
    }),

    // Lançamentos do mês anterior (para comparação)
    db.financeEntry.findMany({
      where: {
        userId: user.id,
        occurredAt: { gte: prevStart, lte: prevEnd },
      },
      select: { type: true, amount: true },
    }),

    // Lançamentos do mês atual com categoria (para breakdown)
    db.financeEntry.findMany({
      where: {
        userId: user.id,
        type: "EXPENSE",
        occurredAt: { gte: curStart, lte: curEnd },
      },
      select: { amount: true, categoryId: true, category: { select: { id: true, name: true, color: true } } },
    }),
  ]);

  // ── Agrupar por mês ───────────────────────────────────────────────────────
  const byMonth: Record<string, { income: number; expense: number }> = {};
  for (const { key } of monthKeys) byMonth[key] = { income: 0, expense: 0 };

  for (const e of allEntries) {
    const d = new Date(e.occurredAt);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (byMonth[k]) {
      const amt = Number(e.amount);
      if (e.type === "INCOME") byMonth[k].income += amt;
      else byMonth[k].expense += amt;
    }
  }

  const months = monthKeys.map(({ key, label }) => ({
    month: key,
    label,
    income:  byMonth[key].income,
    expense: byMonth[key].expense,
  }));

  // ── Variação vs mês anterior ──────────────────────────────────────────────
  const curKey = `${refYear}-${String(refMonth).padStart(2, "0")}`;
  const comparison = {
    currentIncome:  byMonth[curKey]?.income  ?? 0,
    currentExpense: byMonth[curKey]?.expense ?? 0,
    prevIncome:  prevEntries.filter((e) => e.type === "INCOME").reduce((s, e) => s + Number(e.amount), 0),
    prevExpense: prevEntries.filter((e) => e.type === "EXPENSE").reduce((s, e) => s + Number(e.amount), 0),
  };

  // ── Breakdown por categoria (despesas do mês) ─────────────────────────────
  const catMap: Record<string, { id: string | null; name: string; color: string | null; total: number }> = {};

  for (const e of catEntries) {
    const key    = e.categoryId ?? "__none__";
    const name   = e.category?.name ?? "Sem categoria";
    const color  = e.category?.color ?? null;
    const catId  = e.category?.id ?? null;
    const amount = Number(e.amount);

    if (!catMap[key]) catMap[key] = { id: catId, name, color, total: 0 };
    catMap[key].total += amount;
  }

  const totalExpense = Object.values(catMap).reduce((s, c) => s + c.total, 0);

  const categoryBreakdown = Object.values(catMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)
    .map((c) => ({
      ...c,
      percentage: totalExpense > 0 ? Math.round((c.total / totalExpense) * 100) : 0,
    }));

  return NextResponse.json({ months, comparison, categoryBreakdown });
}
