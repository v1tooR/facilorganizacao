"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, ArrowUpRight, ArrowDownRight, TrendingUp, Wallet,
  Search, X, Lock, Pencil, Trash2, Copy,
  CheckCircle2, Clock, AlertCircle, RefreshCw, Tag,
  ChevronDown,
} from "lucide-react";
import { PLANS } from "@/lib/plans";

// ── Types ─────────────────────────────────────────────────────────────────────

type UserPlan = "FREE" | "PRO" | "BUSINESS";

interface AppUser {
  id: string; name: string; email: string; plan: UserPlan;
  planLabel: string;
  planLimits: { tasks: number; projects: number; notes: number; categories: number };
}

type FinanceStatus     = "CONFIRMED" | "PREDICTED" | "OVERDUE";
type FinanceRecurrence = "NONE" | "WEEKLY" | "MONTHLY" | "ANNUAL";

interface FinanceEntry {
  id: string;
  type: "INCOME" | "EXPENSE";
  title: string;
  description?: string;
  amount: number;
  occurredAt: string;
  category: { id: string; name: string; color: string } | null;
  status: FinanceStatus;
  recurrence: FinanceRecurrence;
}

interface FinanceSummary {
  totalIncome: number; totalExpense: number; balance: number; count: number;
}

interface MonthStat {
  month: string; label: string; income: number; expense: number;
}

interface CategoryBreakdown {
  id: string | null; name: string; color: string | null;
  total: number; percentage: number;
}

interface FinanceStats {
  months: MonthStat[];
  categoryBreakdown: CategoryBreakdown[];
  comparison: { currentIncome: number; currentExpense: number; prevIncome: number; prevExpense: number };
}

interface Category {
  id: string; name: string; scope: string; color: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtShort(n: number) {
  if (Math.abs(n) >= 1000) return (n / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "k";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDateFull(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDayHeader(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yest  = new Date(today); yest.setDate(today.getDate() - 1);
  const day   = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (day.getTime() === today.getTime()) return "Hoje";
  if (day.getTime() === yest.getTime())  return "Ontem";
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function pctDiff(cur: number, prev: number) {
  if (prev === 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
}

// ── Constantes visuais ────────────────────────────────────────────────────────

const STATUS_CFG: Record<FinanceStatus, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  CONFIRMED: { label: "Confirmado",  color: "#10B981", bg: "#D1FAE5", Icon: CheckCircle2 },
  PREDICTED: { label: "Previsto",    color: "#F59E0B", bg: "#FEF3C7", Icon: Clock },
  OVERDUE:   { label: "Em atraso",   color: "#EF4444", bg: "#FEE2E2", Icon: AlertCircle },
};

const RECURRENCE_CFG: Record<FinanceRecurrence, string> = {
  NONE:    "Sem recorrência",
  WEEKLY:  "Semanal",
  MONTHLY: "Mensal",
  ANNUAL:  "Anual",
};

const DEFAULT_CAT_COLORS = [
  "#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#06B6D4","#84CC16",
];

// ── Modal ─────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: wide ? 600 : 480, boxShadow: "0 24px 64px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{title}</h3>
          <button onClick={onClose} style={{ all: "unset", cursor: "pointer", color: "#6B7280", display: "flex" }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
      {children}
    </div>
  );
}

// ── FinanceChart (SVG puro) ───────────────────────────────────────────────────

function FinanceChart({ months }: { months: MonthStat[] }) {
  const W = 100, H = 60, barW = 6, gap = 2, groupGap = 6;
  const allVals = months.flatMap((m) => [m.income, m.expense]);
  const maxVal  = Math.max(...allVals, 1);

  const groupWidth = barW * 2 + gap;
  const totalGroups = months.length;
  const totalWidth  = totalGroups * (groupWidth + groupGap) - groupGap;
  const startX      = (W - totalWidth) / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid meet">
      {months.map((m, i) => {
        const x    = startX + i * (groupWidth + groupGap);
        const incH = (m.income  / maxVal) * (H - 14);
        const expH = (m.expense / maxVal) * (H - 14);

        return (
          <g key={m.month}>
            {/* Income bar */}
            <rect x={x} y={H - 10 - incH} width={barW} height={incH || 1} rx={2} fill="#10B981" opacity={0.85} />
            {/* Expense bar */}
            <rect x={x + barW + gap} y={H - 10 - expH} width={barW} height={expH || 1} rx={2} fill="#EF4444" opacity={0.85} />
            {/* Month label */}
            <text x={x + barW + gap / 2} y={H - 1} textAnchor="middle" fontSize={5.5} fill="#9CA3AF" fontFamily="inherit">{m.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── CategoryBar ───────────────────────────────────────────────────────────────

function CategoryBar({ item }: { item: CategoryBreakdown }) {
  const color = item.color ?? "#9CA3AF";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>{item.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11.5, color: "#9CA3AF" }}>{item.percentage}%</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#EF4444" }}>{fmt(item.total)}</span>
        </div>
      </div>
      <div style={{ height: 5, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${item.percentage}%`, background: color, borderRadius: 3, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

// ── EntryDetailModal ──────────────────────────────────────────────────────────

function EntryDetailModal({ entryId, onClose, onEdit, onDelete }: {
  entryId: string;
  onClose: () => void;
  onEdit: (e: FinanceEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [entry, setEntry] = useState<FinanceEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/finance/${entryId}`)
      .then((r) => r.json())
      .then((d) => setEntry(d.entry))
      .finally(() => setLoading(false));
  }, [entryId]);

  if (loading || !entry) {
    return (
      <Modal title="Detalhes do lançamento" onClose={onClose}>
        <div style={{ textAlign: "center", padding: "32px 0", color: "#9CA3AF", fontSize: 14 }}>Carregando...</div>
      </Modal>
    );
  }

  const isIncome  = entry.type === "INCOME";
  const statusCfg = STATUS_CFG[entry.status];

  return (
    <Modal title="Detalhes do lançamento" onClose={onClose} wide>
      {/* Header: tipo + valor */}
      <div style={{ background: isIncome ? "#F0FDF4" : "#FFF5F5", borderRadius: 12, padding: "20px 24px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: isIncome ? "#D1FAE5" : "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {isIncome ? <ArrowUpRight size={22} color="#10B981" /> : <ArrowDownRight size={22} color="#EF4444" />}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: isIncome ? "#065F46" : "#991B1B", marginBottom: 2 }}>
            {isIncome ? "Entrada" : "Saída"}
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: isIncome ? "#10B981" : "#EF4444" }}>
            {isIncome ? "+" : "-"}{fmt(entry.amount)}
          </div>
        </div>
      </div>

      {/* Fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Título</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{entry.title}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Data</div>
            <div style={{ fontSize: 14, color: "#374151" }}>{fmtDateFull(entry.occurredAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Categoria</div>
            {entry.category ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: entry.category.color ?? "#9CA3AF" }} />
                <span style={{ fontSize: 14, color: "#374151" }}>{entry.category.name}</span>
              </div>
            ) : (
              <span style={{ fontSize: 14, color: "#9CA3AF" }}>Sem categoria</span>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Status</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: statusCfg.bg, fontSize: 12, fontWeight: 600, color: statusCfg.color }}>
              <statusCfg.Icon size={11} /> {statusCfg.label}
            </div>
          </div>
          {entry.recurrence !== "NONE" && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Recorrência</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: "#EDE9FE", fontSize: 12, fontWeight: 600, color: "#7C3AED" }}>
                <RefreshCw size={11} /> {RECURRENCE_CFG[entry.recurrence]}
              </div>
            </div>
          )}
        </div>

        {entry.description && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Descrição</div>
            <div style={{ fontSize: 13.5, color: "#4B5563", lineHeight: 1.6, background: "#F9FAFB", borderRadius: 8, padding: "10px 12px" }}>{entry.description}</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: "1px solid #F3F4F6", paddingTop: 16 }}>
        <button
          onClick={() => { onDelete(entry.id); onClose(); }}
          style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600, color: "#EF4444", border: "1.5px solid #FEE2E2", background: "#FFF5F5" }}
        >
          <Trash2 size={13} /> Excluir
        </button>
        <button
          onClick={() => { onEdit(entry); onClose(); }}
          style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 9, fontSize: 13, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg,#FBBF24,#F59E0B)" }}
        >
          <Pencil size={13} /> Editar
        </button>
      </div>
    </Modal>
  );
}

// ── EntryFormModal ────────────────────────────────────────────────────────────

interface EntryForm {
  type: "INCOME" | "EXPENSE";
  title: string; description: string; amount: string; occurredAt: string;
  categoryId: string; status: FinanceStatus; recurrence: FinanceRecurrence;
}

function EntryFormModal({ editing, categories, onClose, onSaved }: {
  editing: FinanceEntry | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<EntryForm>(() => editing ? {
    type: editing.type,
    title: editing.title,
    description: editing.description ?? "",
    amount: String(editing.amount),
    occurredAt: editing.occurredAt.substring(0, 10),
    categoryId: editing.category?.id ?? "",
    status: editing.status,
    recurrence: editing.recurrence,
  } : {
    type: "EXPENSE",
    title: "", description: "", amount: "",
    occurredAt: new Date().toISOString().substring(0, 10),
    categoryId: "", status: "CONFIRMED", recurrence: "NONE",
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const finCats = categories.filter((c) => c.scope === "FINANCE" || c.scope === "GENERAL");

  const save = async () => {
    setSaving(true); setErr("");
    try {
      const amountStr = form.amount.replace(",", ".");
      const body = {
        type: form.type,
        title: form.title.trim(),
        description: form.description || undefined,
        amount: amountStr,
        occurredAt: new Date(form.occurredAt + "T12:00:00").toISOString(),
        categoryId: form.categoryId || undefined,
        status: form.status || "CONFIRMED",
        recurrence: form.recurrence || "NONE",
      };
      const url    = editing ? `/api/finance/${editing.id}` : "/api/finance";
      const method = editing ? "PUT" : "POST";
      const r      = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const text   = await r.text();
      let d: Record<string, string> = {};
      try { d = text ? JSON.parse(text) : {}; } catch { /* ignore */ }
      if (!r.ok) { setErr(d.error ?? `Erro ${r.status}: ${text.slice(0, 200)}`); return; }
      onSaved(); onClose();
    } finally { setSaving(false); }
  };

  return (
    <Modal title={editing ? "Editar lançamento" : "Novo lançamento"} onClose={onClose} wide>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Tipo */}
        <Field label="Tipo *">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {(["INCOME", "EXPENSE"] as const).map((t) => (
              <button key={t} onClick={() => setForm({ ...form, type: t })} style={{
                all: "unset", padding: "11px", borderRadius: 10, cursor: "pointer", textAlign: "center",
                border: `2px solid ${form.type === t ? (t === "INCOME" ? "#10B981" : "#EF4444") : "#E5E7EB"}`,
                background: form.type === t ? (t === "INCOME" ? "#D1FAE5" : "#FEE2E2") : "#F9FAFB",
                fontSize: 13.5, fontWeight: 700,
                color: form.type === t ? (t === "INCOME" ? "#065F46" : "#991B1B") : "#6B7280",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                {t === "INCOME" ? <><ArrowUpRight size={14} /> Entrada</> : <><ArrowDownRight size={14} /> Saída</>}
              </button>
            ))}
          </div>
        </Field>

        {/* Título */}
        <Field label="Título *">
          <input
            className="input-base"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ex: Salário, Aluguel, Supermercado..."
            style={{ fontSize: 13.5 }}
          />
        </Field>

        {/* Valor + Data */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Valor (R$) *">
            <input
              className="input-base" type="number" step="0.01" min="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0,00"
              style={{ fontSize: 13.5 }}
            />
          </Field>
          <Field label="Data *">
            <input
              type="date" className="input-base"
              value={form.occurredAt}
              onChange={(e) => setForm({ ...form, occurredAt: e.target.value })}
              style={{ fontSize: 13.5 }}
            />
          </Field>
        </div>

        {/* Categoria */}
        <Field label="Categoria">
          <div style={{ position: "relative" }}>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #E5E7EB", fontSize: 13, background: "#fff", fontFamily: "inherit", cursor: "pointer", appearance: "none" }}
            >
              <option value="">Sem categoria</option>
              {finCats.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
          </div>
        </Field>

        {/* Status + Recorrência */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Status">
            <div style={{ position: "relative" }}>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as FinanceStatus })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #E5E7EB", fontSize: 13, background: "#fff", fontFamily: "inherit", cursor: "pointer", appearance: "none" }}
              >
                <option value="CONFIRMED">Confirmado</option>
                <option value="PREDICTED">Previsto</option>
                <option value="OVERDUE">Em atraso</option>
              </select>
              <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
            </div>
          </Field>
          <Field label="Recorrência">
            <div style={{ position: "relative" }}>
              <select
                value={form.recurrence}
                onChange={(e) => setForm({ ...form, recurrence: e.target.value as FinanceRecurrence })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #E5E7EB", fontSize: 13, background: "#fff", fontFamily: "inherit", cursor: "pointer", appearance: "none" }}
              >
                <option value="NONE">Sem recorrência</option>
                <option value="WEEKLY">Semanal</option>
                <option value="MONTHLY">Mensal</option>
                <option value="ANNUAL">Anual</option>
              </select>
              <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
            </div>
          </Field>
        </div>

        {/* Descrição */}
        <Field label="Descrição">
          <textarea
            className="input-base"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Observação opcional..."
            rows={2}
            style={{ fontSize: 13, resize: "none" }}
          />
        </Field>

        {err && <p style={{ fontSize: 13, color: "#EF4444", background: "#FFF5F5", padding: "8px 12px", borderRadius: 8 }}>{err}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ all: "unset", cursor: "pointer", padding: "9px 18px", borderRadius: 9, border: "1.5px solid #E5E7EB", fontSize: 13, fontWeight: 600, color: "#6B7280" }}>
            Cancelar
          </button>
          <button onClick={save} disabled={saving} style={{ all: "unset", cursor: saving ? "not-allowed" : "pointer", padding: "9px 22px", borderRadius: 9, background: "linear-gradient(135deg,#FBBF24,#F59E0B)", fontSize: 13, fontWeight: 700, color: "#fff", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Salvando..." : editing ? "Salvar" : "Registrar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── CategoryManagerModal ──────────────────────────────────────────────────────

function CategoryManagerModal({ categories, onClose, onCreated }: {
  categories: Category[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName]   = useState("");
  const [color, setColor] = useState(DEFAULT_CAT_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [err, setErr]     = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const finCats = categories.filter((c) => c.scope === "FINANCE" || c.scope === "GENERAL");

  const create = async () => {
    if (!name.trim()) { setErr("Nome é obrigatório."); return; }
    setSaving(true); setErr("");
    try {
      const r = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), scope: "FINANCE", color }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.error ?? "Erro ao criar categoria."); return; }
      setName(""); onCreated();
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta categoria? Os lançamentos vinculados perderão a categoria.")) return;
    setDeleting(id);
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    setDeleting(null);
    onCreated();
  };

  return (
    <Modal title="Categorias financeiras" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Create form */}
        <div style={{ background: "#F9FAFB", borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Nova categoria</div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <input
                className="input-base"
                value={name}
                onChange={(e) => { setName(e.target.value); setErr(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") create(); }}
                placeholder="Nome da categoria"
                style={{ fontSize: 13 }}
              />
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {DEFAULT_CAT_COLORS.slice(0, 5).map((c) => (
                <button key={c} onClick={() => setColor(c)} style={{ all: "unset", cursor: "pointer", width: 20, height: 20, borderRadius: "50%", background: c, outline: color === c ? `2.5px solid ${c}` : "none", outlineOffset: 2 }} />
              ))}
            </div>
            <button onClick={create} disabled={saving} style={{ all: "unset", cursor: saving ? "not-allowed" : "pointer", padding: "8px 14px", borderRadius: 8, background: "#111827", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {saving ? "..." : "Criar"}
            </button>
          </div>
          {err && <p style={{ fontSize: 12, color: "#EF4444", marginTop: 6 }}>{err}</p>}
        </div>

        {/* List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto" }}>
          {finCats.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#9CA3AF", fontSize: 13 }}>
              Nenhuma categoria financeira ainda.
            </div>
          ) : finCats.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "#F9FAFB", borderRadius: 9 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: c.color ?? "#9CA3AF", flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: "#374151" }}>{c.name}</span>
              <span style={{ fontSize: 11, color: "#D1D5DB", textTransform: "uppercase" }}>{c.scope}</span>
              <button
                onClick={() => remove(c.id)}
                disabled={deleting === c.id}
                style={{ all: "unset", cursor: "pointer", color: "#EF4444", display: "flex", opacity: deleting === c.id ? 0.5 : 1 }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

// ── FinanceModule (principal) ─────────────────────────────────────────────────

export default function FinanceModule({ user }: { user: AppUser | null }) {
  const planHasFinance = user ? PLANS[user.plan as keyof typeof PLANS].features.finance : false;

  const [entries, setEntries]   = useState<FinanceEntry[]>([]);
  const [summary, setSummary]   = useState<FinanceSummary>({ totalIncome: 0, totalExpense: 0, balance: 0, count: 0 });
  const [stats, setStats]       = useState<FinanceStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]   = useState(true);

  // Filtros
  const [filterMonth, setFilterMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [filterType, setFilterType]         = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus]     = useState("");
  const [filterQ, setFilterQ]               = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modals
  const [showDetail, setShowDetail]   = useState<string | null>(null);   // entry id
  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState<FinanceEntry | null>(null);
  const [showCategories, setShowCategories] = useState(false);

  // ── Carrega dados ──────────────────────────────────────────────────────────

  const loadEntries = useCallback(async () => {
    if (!planHasFinance) return;
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filterType)     p.set("type", filterType);
      if (filterMonth)    p.set("month", filterMonth);
      if (filterCategory) p.set("categoryId", filterCategory);
      if (filterStatus)   p.set("status", filterStatus);
      if (filterQ.trim().length >= 1) p.set("q", filterQ.trim());

      const r = await fetch(`/api/finance?${p}`);
      if (r.ok) {
        const d = await r.json();
        setEntries(d.entries);
        setSummary(d.summary);
      }
    } finally { setLoading(false); }
  }, [planHasFinance, filterType, filterMonth, filterCategory, filterStatus, filterQ]);

  const loadStats = useCallback(async () => {
    if (!planHasFinance) return;
    const r = await fetch(`/api/finance/stats?month=${filterMonth}`);
    if (r.ok) setStats(await r.json());
  }, [planHasFinance, filterMonth]);

  const loadCategories = useCallback(async () => {
    const r = await fetch("/api/categories");
    if (r.ok) { const d = await r.json(); setCategories(d.categories); }
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);
  useEffect(() => { loadStats();   }, [loadStats]);
  useEffect(() => { loadCategories(); }, [loadCategories]);

  const reload = () => { loadEntries(); loadStats(); };

  // ── Ações ──────────────────────────────────────────────────────────────────

  const openCreate = () => { setEditing(null); setShowForm(true); };
  const openEdit   = (e: FinanceEntry) => { setEditing(e); setShowForm(true); };

  const remove = async (id: string) => {
    if (!confirm("Excluir este lançamento?")) return;
    await fetch(`/api/finance/${id}`, { method: "DELETE" });
    reload();
  };

  // ── Busca com debounce ─────────────────────────────────────────────────────

  const handleSearch = (val: string) => {
    setFilterQ(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {}, 0); // trigger useEffect via filterQ change
  };

  // ── Agrupamento por data ───────────────────────────────────────────────────

  const grouped: Array<{ dayKey: string; dayLabel: string; entries: FinanceEntry[] }> = [];
  for (const entry of entries) {
    const k = dayKey(entry.occurredAt);
    const last = grouped[grouped.length - 1];
    if (last && last.dayKey === k) {
      last.entries.push(entry);
    } else {
      grouped.push({ dayKey: k, dayLabel: fmtDayHeader(entry.occurredAt), entries: [entry] });
    }
  }

  // ── Gate de plano ──────────────────────────────────────────────────────────

  if (!planHasFinance) {
    return (
      <div style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Lock size={28} color="#10B981" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 10 }}>Módulo Financeiro</h2>
          <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, marginBottom: 20 }}>
            O controle financeiro está disponível nos planos Pro e Business. Faça upgrade para acessar entradas, saídas, categorias e resumos mensais.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, background: "#FEF3C7", color: "#92400E", fontSize: 13.5, fontWeight: 600 }}>
            Disponível no plano Pro
          </div>
        </div>
      </div>
    );
  }

  // ── Comparação com mês anterior ───────────────────────────────────────────

  const cmp = stats?.comparison;
  const expenseDiff = cmp ? pctDiff(cmp.currentExpense, cmp.prevExpense) : 0;
  const incomeDiff  = cmp ? pctDiff(cmp.currentIncome,  cmp.prevIncome)  : 0;

  const finCats = categories.filter((c) => c.scope === "FINANCE" || c.scope === "GENERAL");

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: 24 }}>

      {/* Modals */}
      {showDetail && (
        <EntryDetailModal
          entryId={showDetail}
          onClose={() => setShowDetail(null)}
          onEdit={(e) => { setShowDetail(null); openEdit(e); }}
          onDelete={(id) => { remove(id); setShowDetail(null); }}
        />
      )}
      {showForm && (
        <EntryFormModal
          editing={editing}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={reload}
        />
      )}
      {showCategories && (
        <CategoryManagerModal
          categories={categories}
          onClose={() => setShowCategories(false)}
          onCreated={() => { loadCategories(); }}
        />
      )}

      {/* ── KPI Summary ─────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>

        {/* Entradas */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ArrowUpRight size={15} color="#10B981" />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>Entradas</span>
            </div>
            {cmp && incomeDiff !== 0 && (
              <span style={{ fontSize: 10.5, fontWeight: 700, color: incomeDiff > 0 ? "#10B981" : "#EF4444", background: incomeDiff > 0 ? "#D1FAE5" : "#FEE2E2", padding: "2px 6px", borderRadius: 20 }}>
                {incomeDiff > 0 ? "+" : ""}{incomeDiff}%
              </span>
            )}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#10B981" }}>{fmt(summary.totalIncome)}</div>
        </div>

        {/* Saídas */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ArrowDownRight size={15} color="#EF4444" />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>Saídas</span>
            </div>
            {cmp && expenseDiff !== 0 && (
              <span style={{ fontSize: 10.5, fontWeight: 700, color: expenseDiff > 0 ? "#EF4444" : "#10B981", background: expenseDiff > 0 ? "#FEE2E2" : "#D1FAE5", padding: "2px 6px", borderRadius: 20 }}>
                {expenseDiff > 0 ? "+" : ""}{expenseDiff}%
              </span>
            )}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#EF4444" }}>{fmt(summary.totalExpense)}</div>
        </div>

        {/* Saldo */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: summary.balance >= 0 ? "#D1FAE5" : "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={15} color={summary.balance >= 0 ? "#10B981" : "#EF4444"} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>Saldo</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: summary.balance >= 0 ? "#10B981" : "#EF4444" }}>{fmt(summary.balance)}</div>
        </div>

        {/* Lançamentos */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wallet size={15} color="#7C3AED" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>Lançamentos</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#7C3AED" }}>{summary.count}</div>
        </div>
      </div>

      {/* ── Gráfico + Breakdown ──────────────────────────────────────────── */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 20 }}>

          {/* Gráfico */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Histórico de 6 meses</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Entradas vs Saídas</div>
              </div>
              <div style={{ display: "flex", gap: 14 }}>
                {[{ color: "#10B981", label: "Entradas" }, { color: "#EF4444", label: "Saídas" }].map(({ color, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                    <span style={{ fontSize: 11, color: "#6B7280" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ height: 140 }}>
              {stats.months.every((m) => m.income === 0 && m.expense === 0) ? (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                  <TrendingUp size={28} color="#E5E7EB" />
                  <span style={{ fontSize: 13, color: "#9CA3AF" }}>Sem dados para este período</span>
                </div>
              ) : (
                <FinanceChart months={stats.months} />
              )}
            </div>
          </div>

          {/* Breakdown por categoria */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Gastos por categoria</div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 14 }}>Despesas do mês</div>
            {stats.categoryBreakdown.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "20px 0" }}>
                <Tag size={24} color="#E5E7EB" />
                <span style={{ fontSize: 12.5, color: "#9CA3AF", textAlign: "center" }}>Nenhuma despesa categorizada neste mês</span>
              </div>
            ) : (
              <div>
                {stats.categoryBreakdown.map((item, i) => (
                  <CategoryBar key={item.id ?? `__${i}`} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Barra de filtros ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 10, flexWrap: "wrap" }}>

        {/* Filtros lado esquerdo */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>

          {/* Mês */}
          <input
            type="month" value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            style={{ padding: "7px 12px", borderRadius: 9, border: "1.5px solid #E5E7EB", fontSize: 13, fontFamily: "inherit" }}
          />

          {/* Tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ padding: "7px 12px", borderRadius: 9, border: "1.5px solid #E5E7EB", fontSize: 13, background: "#fff", fontFamily: "inherit", cursor: "pointer" }}
          >
            <option value="">Todos os tipos</option>
            <option value="INCOME">Entradas</option>
            <option value="EXPENSE">Saídas</option>
          </select>

          {/* Categoria */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: "7px 12px", borderRadius: 9, border: "1.5px solid #E5E7EB", fontSize: 13, background: "#fff", fontFamily: "inherit", cursor: "pointer" }}
          >
            <option value="">Todas as categorias</option>
            <option value="none">Sem categoria</option>
            {finCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: "7px 12px", borderRadius: 9, border: "1.5px solid #E5E7EB", fontSize: 13, background: "#fff", fontFamily: "inherit", cursor: "pointer" }}
          >
            <option value="">Todos os status</option>
            <option value="CONFIRMED">Confirmados</option>
            <option value="PREDICTED">Previstos</option>
            <option value="OVERDUE">Em atraso</option>
          </select>

          {/* Busca */}
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
            <input
              value={filterQ}
              onChange={(e) => setFilterQ(e.target.value)}
              placeholder="Buscar título..."
              style={{ padding: "7px 28px 7px 30px", borderRadius: 9, border: "1.5px solid #E5E7EB", fontSize: 13, fontFamily: "inherit", width: 180 }}
            />
            {filterQ && (
              <button
                onMouseDown={(e) => { e.preventDefault(); setFilterQ(""); }}
                style={{ all: "unset", cursor: "pointer", position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Ações lado direito */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowCategories(true)}
            style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, border: "1.5px solid #E5E7EB", fontSize: 13, fontWeight: 600, color: "#6B7280" }}
          >
            <Tag size={13} /> Categorias
          </button>
          <button
            onClick={openCreate}
            style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 9, background: "linear-gradient(135deg,#FBBF24,#F59E0B)", fontSize: 13, fontWeight: 700, color: "#fff" }}
          >
            <Plus size={14} /> Novo lançamento
          </button>
        </div>
      </div>

      {/* ── Lista agrupada por data ──────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ padding: 16, height: 60, background: "#F9FAFB", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Wallet size={48} color="#E5E7EB" style={{ marginBottom: 14 }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
            {filterQ || filterType || filterCategory || filterStatus
              ? "Nenhum resultado para os filtros aplicados"
              : "Nenhum lançamento neste período"}
          </p>
          <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>
            {filterQ || filterType || filterCategory || filterStatus
              ? "Tente remover alguns filtros."
              : "Registre seu primeiro lançamento do mês."}
          </p>
          {!filterQ && !filterType && !filterCategory && !filterStatus && (
            <button
              onClick={openCreate}
              style={{ all: "unset", cursor: "pointer", padding: "10px 22px", borderRadius: 10, border: "1.5px dashed #FCD34D", color: "#F59E0B", fontSize: 13, fontWeight: 700 }}
            >
              + Registrar lançamento
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {grouped.map((group) => {
            // Totais do grupo
            const dayIncome  = group.entries.filter((e) => e.type === "INCOME").reduce((s, e) => s + e.amount, 0);
            const dayExpense = group.entries.filter((e) => e.type === "EXPENSE").reduce((s, e) => s + e.amount, 0);

            return (
              <div key={group.dayKey} style={{ marginBottom: 16 }}>
                {/* Cabeçalho do dia */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", marginBottom: 6, borderBottom: "1px solid #F3F4F6" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#6B7280", textTransform: "capitalize" }}>{group.dayLabel}</span>
                  <div style={{ display: "flex", gap: 12 }}>
                    {dayIncome > 0  && <span style={{ fontSize: 11.5, fontWeight: 700, color: "#10B981" }}>+{fmt(dayIncome)}</span>}
                    {dayExpense > 0 && <span style={{ fontSize: 11.5, fontWeight: 700, color: "#EF4444" }}>-{fmt(dayExpense)}</span>}
                  </div>
                </div>

                {/* Entradas do dia */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {group.entries.map((entry) => {
                    const isIncome  = entry.type === "INCOME";
                    const entryStatus = entry.status ?? "CONFIRMED";
                    const stCfg     = STATUS_CFG[entryStatus] ?? STATUS_CFG["CONFIRMED"];
                    const isPredicted = entryStatus === "PREDICTED";
                    const isOverdue   = entryStatus === "OVERDUE";

                    return (
                      <div
                        key={entry.id}
                        onClick={() => setShowDetail(entry.id)}
                        className="card"
                        style={{
                          padding: "12px 16px",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          cursor: "pointer",
                          opacity: isPredicted ? 0.85 : 1,
                          border: isOverdue ? "1.5px solid #FEE2E2" : undefined,
                          transition: "box-shadow 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
                        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "")}
                      >
                        {/* Ícone tipo */}
                        <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: isIncome ? "#D1FAE5" : "#FEE2E2" }}>
                          {isIncome ? <ArrowUpRight size={17} color="#10B981" /> : <ArrowDownRight size={17} color="#EF4444" />}
                        </div>

                        {/* Texto */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {entry.title}
                            </span>
                            {entryStatus !== "CONFIRMED" && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "1px 7px", borderRadius: 20, background: stCfg.bg, fontSize: 10.5, fontWeight: 700, color: stCfg.color, flexShrink: 0 }}>
                                <stCfg.Icon size={9} /> {stCfg.label}
                              </span>
                            )}
                            {entry.recurrence && entry.recurrence !== "NONE" && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "1px 7px", borderRadius: 20, background: "#EDE9FE", fontSize: 10.5, fontWeight: 700, color: "#7C3AED", flexShrink: 0 }}>
                                <RefreshCw size={9} /> {RECURRENCE_CFG[entry.recurrence] ?? ""}
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {entry.category && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#6B7280" }}>
                                <div style={{ width: 7, height: 7, borderRadius: "50%", background: entry.category.color ?? "#9CA3AF" }} />
                                {entry.category.name}
                              </span>
                            )}
                            {entry.description && (
                              <span style={{ fontSize: 11.5, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                                {entry.description}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Valor + ações */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: isIncome ? "#10B981" : "#EF4444" }}>
                            {isIncome ? "+" : "-"}{fmt(entry.amount)}
                          </span>
                          <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => { e.stopPropagation(); openEdit(entry); }}
                              style={{ all: "unset", cursor: "pointer", display: "flex", padding: 5, borderRadius: 7, color: "#9CA3AF" }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#374151")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "#9CA3AF")}
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); remove(entry.id); }}
                              style={{ all: "unset", cursor: "pointer", display: "flex", padding: 5, borderRadius: 7, color: "#9CA3AF" }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "#9CA3AF")}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
