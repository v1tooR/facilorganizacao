/**
 * POST /api/finance/import-ofx
 *
 * Recebe um arquivo .ofx ou .qfx via multipart/form-data (campo "file").
 * Faz parse e retorna as transações encontradas para preview no cliente.
 * Não persiste nada no banco — o frontend chama POST /api/finance para cada entrada selecionada.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { hasFeature, featureBlockedMessage } from "@/lib/plans";
import { parseOFX } from "@/lib/ofx-parser";

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  if (!hasFeature(user.plan, "finance")) {
    return NextResponse.json(
      { error: featureBlockedMessage("finance") },
      { status: 403 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
  }

  const name = (file as File).name.toLowerCase();
  if (!name.endsWith(".ofx") && !name.endsWith(".qfx")) {
    return NextResponse.json(
      { error: "Formato inválido. Envie um arquivo .ofx ou .qfx." },
      { status: 400 }
    );
  }

  const content = await (file as File).text();
  if (!content.includes("STMTTRN") && !content.includes("stmttrn")) {
    return NextResponse.json(
      { error: "O arquivo não contém transações bancárias reconhecíveis." },
      { status: 400 }
    );
  }

  const transactions = parseOFX(content);
  if (transactions.length === 0) {
    return NextResponse.json(
      { error: "Nenhuma transação encontrada no arquivo." },
      { status: 400 }
    );
  }

  return NextResponse.json({ transactions });
}
