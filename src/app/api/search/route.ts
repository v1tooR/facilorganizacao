/**
 * GET /api/search?q=term
 *
 * Busca global isolada por usuário.
 * Retorna até 5 resultados por tipo: tasks, projects, notes, finance.
 * Finance só é incluído se o plano do usuário tiver o feature habilitado.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { hasFeature } from "@/lib/plans";

export interface SearchResultItem {
  type: "task" | "project" | "note" | "finance";
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  module: "tasks" | "projects" | "notes" | "finance";
}

const MAX_PER_TYPE = 5;

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({
      results: { tasks: [], projects: [], notes: [], finance: [] },
      total: 0,
    });
  }

  const financeEnabled = hasFeature(user.plan, "finance");

  // Executa buscas em paralelo
  const [tasks, projects, notes, financeEntries] = await Promise.all([
    // Tasks: title ou description
    db.task.findMany({
      where: {
        userId: user.id,
        status: { not: "CANCELLED" },
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
        ],
      },
      select: { id: true, title: true, description: true, status: true, priority: true, dueDate: true },
      orderBy: [{ title: "asc" }],
      take: MAX_PER_TYPE,
    }),

    // Projects: name ou description
    db.project.findMany({
      where: {
        userId: user.id,
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
        ],
      },
      select: { id: true, name: true, description: true, status: true, progress: true },
      orderBy: [{ name: "asc" }],
      take: MAX_PER_TYPE,
    }),

    // Notes: title ou content
    db.note.findMany({
      where: {
        userId: user.id,
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
        ],
      },
      select: { id: true, title: true, content: true, color: true },
      orderBy: [{ title: "asc" }],
      take: MAX_PER_TYPE,
    }),

    // Finance: apenas se o plano permitir
    financeEnabled
      ? db.financeEntry.findMany({
          where: {
            userId: user.id,
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
            ],
          },
          select: { id: true, title: true, description: true, type: true, amount: true, occurredAt: true },
          orderBy: [{ occurredAt: "desc" }],
          take: MAX_PER_TYPE,
        })
      : Promise.resolve([]),
  ]);

  // ── Mapeia para SearchResultItem ──────────────────────────────────────────

  const PRIORITY_LABELS: Record<string, string> = {
    LOW: "Baixa", MEDIUM: "Média", HIGH: "Alta", URGENT: "Urgente",
  };
  const STATUS_LABELS: Record<string, string> = {
    PENDING: "Pendente", IN_PROGRESS: "Em andamento", COMPLETED: "Concluída",
    PLANNING: "Planejamento", ON_HOLD: "Em pausa",
  };

  const taskResults: SearchResultItem[] = tasks.map((t) => ({
    type: "task",
    id: t.id,
    title: t.title,
    subtitle: t.description ? t.description.slice(0, 70) : undefined,
    meta: [PRIORITY_LABELS[t.priority], t.dueDate ? new Date(t.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : undefined]
      .filter(Boolean).join(" · ") || undefined,
    module: "tasks",
  }));

  const projectResults: SearchResultItem[] = projects.map((p) => ({
    type: "project",
    id: p.id,
    title: p.name,
    subtitle: p.description ? p.description.slice(0, 70) : undefined,
    meta: [STATUS_LABELS[p.status] ?? p.status, `${p.progress}%`].join(" · "),
    module: "projects",
  }));

  const noteResults: SearchResultItem[] = notes.map((n) => ({
    type: "note",
    id: n.id,
    title: n.title,
    subtitle: n.content ? n.content.replace(/\n/g, " ").slice(0, 80) : undefined,
    module: "notes",
  }));

  const financeResults: SearchResultItem[] = financeEntries.map((f) => ({
    type: "finance",
    id: f.id,
    title: f.title,
    subtitle: f.description ? f.description.slice(0, 60) : undefined,
    meta: [
      f.type === "INCOME" ? "Entrada" : "Saída",
      Number(f.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    ].join(" · "),
    module: "finance",
  }));

  const total = taskResults.length + projectResults.length + noteResults.length + financeResults.length;

  return NextResponse.json({
    results: {
      tasks: taskResults,
      projects: projectResults,
      notes: noteResults,
      finance: financeResults,
    },
    total,
  });
}
