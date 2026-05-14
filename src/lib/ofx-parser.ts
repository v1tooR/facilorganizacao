export interface OFXTransaction {
  fitid: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  rawType: string;
}

function getField(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([^<\\r\\n]*)`, "i");
  const m = block.match(re);
  return m ? m[1].trim() : "";
}

function parseOFXDate(raw: string): string {
  // Formats: YYYYMMDDHHMMSS, YYYYMMDDHHMMSS[offset], YYYYMMDD
  const clean = raw.replace(/[\[\(].*/, "").trim();
  const y  = clean.substring(0, 4);
  const mo = clean.substring(4, 6);
  const d  = clean.substring(6, 8);
  if (!y || !mo || !d) return "";
  return `${y}-${mo}-${d}`;
}

export function parseOFX(content: string): OFXTransaction[] {
  const results: OFXTransaction[] = [];

  // Extract STMTTRN blocks — handles both XML (with </STMTTRN>) and SGML (without)
  const blocks: string[] = [];

  // Try XML-style first
  const xmlRe = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let m: RegExpExecArray | null;
  while ((m = xmlRe.exec(content)) !== null) blocks.push(m[1]);

  // Fallback to SGML-style (no closing tags)
  if (blocks.length === 0) {
    const sgmlRe = /<STMTTRN>([\s\S]*?)(?=<STMTTRN>|<\/BANKTRANLIST>|$)/gi;
    while ((m = sgmlRe.exec(content)) !== null) {
      if (m[1].trim()) blocks.push(m[1]);
    }
  }

  const CREDIT_TYPES = new Set([
    "CREDIT", "INT", "DIV", "DIRECTDEP", "REFUND", "XFER", "DEP",
  ]);

  for (const block of blocks) {
    const trnType  = getField(block, "TRNTYPE");
    const dtPosted = getField(block, "DTPOSTED");
    const trnAmt   = getField(block, "TRNAMT");
    const fitid    = getField(block, "FITID");
    const memo     = getField(block, "MEMO") || getField(block, "NAME") || "Sem descrição";

    const amount = parseFloat(trnAmt.replace(",", "."));
    if (isNaN(amount)) continue;

    const date = parseOFXDate(dtPosted);
    if (!date) continue;

    const isCredit = amount > 0 || CREDIT_TYPES.has(trnType.toUpperCase());

    results.push({
      fitid:       fitid || `${dtPosted}-${trnAmt}-${memo.substring(0, 20)}`,
      type:        isCredit ? "INCOME" : "EXPENSE",
      amount:      Math.abs(amount),
      date,
      description: memo,
      rawType:     trnType,
    });
  }

  return results;
}
