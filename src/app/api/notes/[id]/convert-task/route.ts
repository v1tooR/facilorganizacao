/**
 * POST /api/notes/[id]/convert-task
 *
 * Converte uma nota em tarefa:
 * - usa o título da nota como título da tarefa
 * - usa o conteúdo como descrição
 * - aceita priority, dueDate e projectId opcionais
 * - respeita limite de tarefas do plano
 * - mantém a nota original intacta
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { canCreate, limitReachedMessage } from "@/lib/plans";
import { z } from "zod";

const ConvertSchema = z.object({
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z
    .string()
    .datetime({ offset: true })
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  projectId: z
    .string()
    .cuid()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const note = await db.note.findFirst({ where: { id, userId: user.id } });
  if (!note) {
    return NextResponse.json({ error: "Anotação não encontrada." }, { status: 404 });
  }

  const currentCount = await db.task.count({ where: { userId: user.id } });
  if (!canCreate(user.plan, "tasks", currentCount)) {
    return NextResponse.json(
      { error: limitReachedMessage(user.plan, "tasks") },
      { status: 403 }
    );
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    /* empty body is valid — uses defaults */
  }

  const parsed = ConvertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const task = await db.task.create({
    data: {
      title: note.title,
      description: note.content || undefined,
      priority: parsed.data.priority,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      projectId: parsed.data.projectId || undefined,
      userId: user.id,
    },
  });

  return NextResponse.json({ task }, { status: 201 });
}
