"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, ArrowUpRight, ArrowDownRight, TrendingUp, Wallet,
  Search, X, Lock, Pencil, Trash2, Copy,
  CheckCircle2, Clock, AlertCircle, RefreshCw, Tag,
  ChevronDown, Upload, FileText, CheckSquare, Square,
} from "lucide-react";
import type { OFXTransaction } from "@/lib/ofx-parser";
import { PLANS } from "@/lib/plans";
import { useDark } from "@/contexts/ThemeContext";
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

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
  const { dark } = useDark();
  const surface  = dark ? "#1C2128" : "#fff";
  const txt      = dark ? "#E6EDF3" : "#111827";
  const txtMuted = dark ? "#8D96A0" : "#6B7280";
  const bord     = dark ? "#30363D" : "#E5E7EB";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: surface, borderRadius: 16, padding: 24, width: "100%", maxWidth: wide ? 600 : 480, boxShadow: "0 24px 64px rgba(0,0,0,0.3)", maxHeight: "90vh", overflowY: "auto", border: dark ? `1px solid ${bord}` : "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: txt }}>{title}</h3>
          <button onClick={onClose} style={{ all: "unset", cursor: "pointer", color: txtMuted, display: "flex" }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { dark } = useDark();
  const txtMuted = dark ? "#8D96A0" : "#6B7280";
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: txtMuted, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
      {children}
    </div>
  );
}

// ── Finance Charts (Recharts) ────────────────────────────────────────────────

type ChartMonth = { month: string; label: string; income: number; expense: number };

function FinanceBarChart({ months, height = 160, dark = false }: { months: ChartMonth[]; height?: number; dark?: boolean }) {
  const gridColor   = dark ? "#21262D" : "#F3F4F6";
  const tickColorX  = dark ? "#8D96A0" : "#9CA3AF";
  const tickColorY  = dark ? "#8B949E" : "#D1D5DB";
  const tooltipBg   = dark ? "#1C2128" : "#fff";
  const tooltipBord = dark ? "#30363D" : "#F3F4F6";
  const tooltipTxt  = dark ? "#E6EDF3" : "#111827";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={months} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: tickColorX }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: tickColorY }} axisLine={false} tickLine={false} width={36} />
        <Tooltip
          formatter={(value: unknown, name: unknown) => [fmt(value as number), name === "income" ? "Receitas" : "Despesas"]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${tooltipBord}`, padding: "6px 10px", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", background: tooltipBg, color: tooltipTxt }}
          cursor={{ fill: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }}
        />
        <Bar dataKey="income" fill="#10B981" radius={[3, 3, 0, 0]} maxBarSize={18} />
        <Bar dataKey="expense" fill="#F87171" radius={[3, 3, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function FinanceBalanceChart({ months, gradId, height = 160, dark = false }: { months: ChartMonth[]; gradId: string; height?: number; dark?: boolean }) {
  let cum = 0;
  const data = months.map((m) => {
    cum += m.income - m.expense;
    return { label: m.label, balance: cum };
  });
  const lastBalance = data[data.length - 1]?.balance ?? 0;
  const color = lastBalance >= 0 ? "#6366F1" : "#EF4444";

  const gridColor   = dark ? "#21262D" : "#F3F4F6";
  const tickColorX  = dark ? "#8D96A0" : "#9CA3AF";
  const tickColorY  = dark ? "#8B949E" : "#D1D5DB";
  const tooltipBg   = dark ? "#1C2128" : "#fff";
  const tooltipBord = dark ? "#30363D" : "#F3F4F6";
  const tooltipTxt  = dark ? "#E6EDF3" : "#111827";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: tickColorX }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: tickColorY }} axisLine={false} tickLine={false} width={36} />
        <Tooltip
          formatter={(value: unknown) => [fmt(value as number), "Saldo"]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${tooltipBord}`, padding: "6px 10px", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", background: tooltipBg, color: tooltipTxt }}
          cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "4 2" }}
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradId})`}
          dot={{ fill: dark ? "#1C2128" : "#fff", stroke: color, strokeWidth: 2, r: 3 }}
          activeDot={{ r: 5, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── CategoryBar ───────────────────────────────────────────────────────────────

function CategoryBar({ item, dark = false }: { item: CategoryBreakdown; dark?: boolean }) {
  const color    = item.color ?? "#9CA3AF";
  const nameTxt  = dark ? "#CDD5E0" : "#374151";
  const pctTxt   = dark ? "#8B949E" : "#9CA3AF";
  const barTrack = dark ? "#21262D" : "#F3F4F6";

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: nameTxt }}>{item.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11.5, color: pctTxt }}>{item.percentage}%</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#EF4444" }}>{fmt(item.total)}</span>
        </div>
      </div>
      <div style={{ height: 5, background: barTrack, borderRadius: 3, overflow: "hidden" }}>
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
  const { dark } = useDark();
  const txt      = dark ? "#E6EDF3" : "#111827";
  const txt2     = dark ? "#CDD5E0" : "#374151";
  const txtFaint = dark ? "#8B949E" : "#9CA3AF";
  const bord     = dark ? "#30363D" : "#F3F4F6";

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
        <div style={{ textAlign: "center", padding: "32px 0", color: txtFaint, fontSize: 14 }}>Carregando...</div>
      </Modal>
    );
  }

  const isIncome  = entry.type === "INCOME";
  const statusCfg = STATUS_CFG[entry.status];

  const headerBg   = dark ? (isIncome ? "#0D2B1E" : "#2D1010") : (isIncome ? "#F0FDF4" : "#FFF5F5");
  const iconBg     = dark ? (isIncome ? "#134E30" : "#4D1A1A") : (isIncome ? "#D1FAE5" : "#FEE2E2");
  const typeTxtClr = dark ? (isIncome ? "#4ADE80" : "#F87171") : (isIncome ? "#065F46" : "#991B1B");

  return (
    <Modal title="Detalhes do lançamento" onClose={onClose} wide>
      {/* Header: tipo + valor */}
      <div style={{ background: headerBg, borderRadius: 12, padding: "20px 24px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {isIncome ? <ArrowUpRight size={22} color="#10B981" /> : <ArrowDownRight size={22} color="#EF4444" />}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: typeTxtClr, marginBottom: 2 }}>
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
          <div style={{ fontSize: 11, fontWeight: 700, color: txtFaint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Título</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: txt }}>{entry.title}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: txtFaint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Data</div>
            <div style={{ fontSize: 14, color: txt2 }}>{fmtDateFull(entry.occurredAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: txtFaint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Categoria</div>
            {entry.category ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: entry.category.color ?? "#9CA3AF" }} />
                <span style={{ fontSize: 14, color: txt2 }}>{entry.category.name}</span>
              </div>
            ) : (
              <span style={{ fontSize: 14, color: txtFaint }}>Sem categoria</span>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: txtFaint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Status</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: statusCfg.bg, fontSize: 12, fontWeight: 600, color: statusCfg.color }}>
              <statusCfg.Icon size={11} /> {statusCfg.label}
            </div>
          </div>
          {entry.recurrence !== "NONE" && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: txtFaint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Recorrência</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: "#EDE9FE", fontSize: 12, fontWeight: 600, color: "#7C3AED" }}>
                <RefreshCw size={11} /> {RECURRENCE_CFG[entry.recurrence]}
              </div>
            </div>
          )}
        </div>

        {entry.description && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: txtFaint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Descrição</div>
            <div style={{ fontSize: 13.5, color: txt2, lineHeight: 1.6, background: dark ? "#21262D" : "#F9FAFB", borderRadius: 8, padding: "10px 12px" }}>{entry.description}</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${bord}`, paddingTop: 16 }}>
        <button
          onClick={() => { onDelete(entry.id); onClose(); }}
          style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600, color: "#EF4444", border: "1.5px solid #FEE2E2", background: dark ? "#2D1010" : "#FFF5F5" }}
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
  const { dark } = useDark();
  const txt2     = dark ? "#CDD5E0" : "#374151";
  const txtMuted = dark ? "#8D96A0" : "#6B7280";
  const surface  = dark ? "#1C2128" : "#fff";
  const bord     = dark ? "#30363D" : "#E5E7EB";

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

  const selectStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 9, border: `1.5px solid ${bord}`,
    fontSize: 13, background: surface, color: txt2, fontFamily: "inherit", cursor: "pointer", appearance: "none",
  };

  return (
    <Modal title={editing ? "Editar lançamento" : "Novo lançamento"} onClose={onClose} wide>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Tipo */}
        <Field label="Tipo *">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {(["INCOME", "EXPENSE"] as const).map((t) => {
              const isSelected = form.type === t;
              const selectedBg = dark
                ? (t === "INCOME" ? "#0D2B1E" : "#2D1010")
                : (t === "INCOME" ? "#D1FAE5" : "#FEE2E2");
              const selectedColor = dark
                ? (t === "INCOME" ? "#4ADE80" : "#F87171")
                : (t === "INCOME" ? "#065F46" : "#991B1B");
              const selectedBorder = t === "INCOME" ? "#10B981" : "#EF4444";
              return (
                <button key={t} onClick={() => setForm({ ...form, type: t })} style={{
                  all: "unset", padding: "11px", borderRadius: 10, cursor: "pointer", textAlign: "center",
                  border: `2px solid ${isSelected ? selectedBorder : bord}`,
                  background: isSelected ? selectedBg : (dark ? "#21262D" : "#F9FAFB"),
                  fontSize: 13.5, fontWeight: 700,
                  color: isSelected ? selectedColor : txtMuted,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                  {t === "INCOME" ? <><ArrowUpRight size={14} /> Entrada</> : <><ArrowDownRight size={14} /> Saída</>}
                </button>
              );
            })}
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
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} style={selectStyle}>
              <option value="">Sem categoria</option>
              {finCats.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: txtMuted, pointerEvents: "none" }} />
          </div>
        </Field>

        {/* Status + Recorrência */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Status">
            <div style={{ position: "relative" }}>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as FinanceStatus })} style={selectStyle}>
                <option value="CONFIRMED">Confirmado</option>
                <option value="PREDICTED">Previsto</option>
                <option value="OVERDUE">Em atraso</option>
              </select>
              <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: txtMuted, pointerEvents: "none" }} />
            </div>
          </Field>
          <Field label="Recorrência">
            <div style={{ position: "relative" }}>
              <select value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value as FinanceRecurrence })} style={selectStyle}>
                <option value="NONE">Sem recorrência</option>
                <option value="WEEKLY">Semanal</option>
                <option value="MONTHLY">Mensal</option>
                <option value="ANNUAL">Anual</option>
              </select>
              <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: txtMuted, pointerEvents: "none" }} />
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

        {err && <p style={{ fontSize: 13, color: "#EF4444", background: dark ? "#2D1010" : "#FFF5F5", padding: "8px 12px", borderRadius: 8 }}>{err}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ all: "unset", cursor: "pointer", padding: "9px 18px", borderRadius: 9, border: `1.5px solid ${bord}`, fontSize: 13, fontWeight: 600, color: dark ? "#CDD5E0" : "#6B7280" }}>
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
  const { dark } = useDark();
  const txt2     = dark ? "#CDD5E0" : "#374151";
  const txtMuted = dark ? "#8D96A0" : "#6B7280";
  const txtFaint = dark ? "#8B949E" : "#9CA3AF";
  const surface  = dark ? "#21262D" : "#F9FAFB";
  const bord     = dark ? "#30363D" : "#E5E7EB";

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
        <div style={{ background: surface, borderRadius: 10, padding: 14, border: dark ? `1px solid ${bord}` : "none" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: txtMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Nova categoria</div>
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
            <button onClick={create} disabled={saving} style={{ all: "unset", cursor: saving ? "not-allowed" : "pointer", padding: "8px 14px", borderRadius: 8, background: dark ? "#E6EDF3" : "#111827", fontSize: 12, fontWeight: 700, color: dark ? "#0D1117" : "#fff", flexShrink: 0 }}>
              {saving ? "..." : "Criar"}
            </button>
          </div>
          {err && <p style={{ fontSize: 12, color: "#EF4444", marginTop: 6 }}>{err}</p>}
        </div>

        {/* List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto" }}>
          {finCats.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: txtFaint, fontSize: 13 }}>
              Nenhuma categoria financeira ainda.
            </div>
          ) : finCats.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: surface, borderRadius: 9, border: dark ? `1px solid ${bord}` : "none" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: c.color ?? "#9CA3AF", flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: txt2 }}>{c.name}</span>
              <span style={{ fontSize: 11, color: txtFaint, textTransform: "uppercase" }}>{c.scope}</span>
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
  const { dark } = useDark();
  const txt      = dark ? "#E6EDF3" : "#111827";
  const txt2     = dark ? "#CDD5E0" : "#374151";
  const txtMuted = dark ? "#8D96A0" : "#6B7280";
  const txtFaint = dark ? "#8B949E" : "#9CA3AF";
  const surface  = dark ? "#1C2128" : "#FFFFFF";
  const bgSec    = dark ? "#21262D" : "#F3F4F6";
  const bord     = dark ? "#30363D" : "#E5E7EB";

  const planHasFinance = user ? PLANS[user.plan as keyof typeof PLANS].features.finance : false;

  const [entries, setEntries]   = useState<FinanceEntry[]>([]);
  const [summary, setSummary]   = useState<FinanceSummary>({ totalIncome: 0, totalExpense: 0, balance: 0, count: 0 });
  const [stats, setStats]       = useState<FinanceStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]   = useState(true);

  const [filterMonth, setFilterMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [filterType, setFilterType]         = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus]     = useState("");
  const [filterQ, setFilterQ]               = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showDetail, setShowDetail]   = useState<string | null>(null);
  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState<FinanceEntry | null>(null);
  const [showCategories, setShowCategories] = useState(false);

  // OFX import state
  const [showOFX, setShowOFX]             = useState(false);
  const [ofxStep, setOfxStep]             = useState<"upload" | "preview">("upload");
  const [ofxTxns, setOfxTxns]             = useState<OFXTransaction[]>([]);
  const [ofxSelected, setOfxSelected]     = useState<Set<string>>(new Set());
  const [ofxImporting, setOfxImporting]   = useState(false);
  const [ofxError, setOfxError]           = useState("");
  const [ofxProgress, setOfxProgress]     = useState(0);
  const [ofxDragging, setOfxDragging]     = useState(false);
  const ofxFileRef                        = useRef<HTMLInputElement>(null);

  function closeOFX() {
    setShowOFX(false);
    setOfxStep("upload");
    setOfxTxns([]);
    setOfxSelected(new Set());
    setOfxError("");
    setOfxProgress(0);
  }

  async function handleOFXFile(file: File) {
    setOfxError("");
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/finance/import-ofx", { method: "POST", body: fd });
    const d = await r.json();
    if (!r.ok) { setOfxError(d.error || "Erro ao processar arquivo."); return; }
    const txns: OFXTransaction[] = d.transactions;
    setOfxTxns(txns);
    setOfxSelected(new Set(txns.map((t) => t.fitid)));
    setOfxStep("preview");
  }

  async function importOFXSelected() {
    const toImport = ofxTxns.filter((t) => ofxSelected.has(t.fitid));
    if (toImport.length === 0) return;
    setOfxImporting(true);
    setOfxProgress(0);
    setOfxError("");
    let done = 0;
    let failed = 0;
    for (const t of toImport) {
      // Schema exige amount como string "1234.56" e occurredAt como ISO com offset
      const r = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: t.type,
          title: t.description.substring(0, 120),
          amount: t.amount.toFixed(2),
          occurredAt: `${t.date}T12:00:00.000Z`,
          status: "CONFIRMED",
          recurrence: "NONE",
        }),
      });
      if (!r.ok) failed++;
      done++;
      setOfxProgress(Math.round((done / toImport.length) * 100));
    }
    setOfxImporting(false);
    if (failed > 0) {
      setOfxError(`${failed} lançamento(s) não puderam ser importados.`);
    } else {
      closeOFX();
    }
    // Limpa filtro de mês para mostrar as transactions importadas
    // (podem ser de meses diferentes do mês atual)
    setFilterMonth("");
    loadEntries();
    loadStats();
  }

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

  const openCreate = () => { setEditing(null); setShowForm(true); };
  const openEdit   = (e: FinanceEntry) => { setEditing(e); setShowForm(true); };

  const remove = async (id: string) => {
    if (!confirm("Excluir este lançamento?")) return;
    await fetch(`/api/finance/${id}`, { method: "DELETE" });
    reload();
  };

  const handleSearch = (val: string) => {
    setFilterQ(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {}, 0);
  };

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
          <div style={{ width: 64, height: 64, borderRadius: 18, background: dark ? "#0D2B1E" : "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Lock size={28} color="#10B981" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: txt, marginBottom: 10 }}>Módulo Financeiro</h2>
          <p style={{ fontSize: 14, color: txtMuted, lineHeight: 1.7, marginBottom: 20 }}>
            O controle financeiro está disponível nos planos Pro e Business. Faça upgrade para acessar entradas, saídas, categorias e resumos mensais.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, background: dark ? "#2D2008" : "#FEF3C7", color: dark ? "#F59E0B" : "#92400E", fontSize: 13.5, fontWeight: 600 }}>
            Disponível no plano Pro
          </div>
        </div>
      </div>
    );
  }

  const cmp = stats?.comparison;
  const expenseDiff = cmp ? pctDiff(cmp.currentExpense, cmp.prevExpense) : 0;
  const incomeDiff  = cmp ? pctDiff(cmp.currentIncome,  cmp.prevIncome)  : 0;

  const finCats = categories.filter((c) => c.scope === "FINANCE" || c.scope === "GENERAL");

  const filterSelectStyle: React.CSSProperties = {
    padding: "7px 12px", borderRadius: 9, border: `1.5px solid ${bord}`,
    fontSize: 13, background: surface, color: txt2, fontFamily: "inherit", cursor: "pointer",
  };

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
              <div style={{ width: 32, height: 32, borderRadius: 9, background: dark ? "#0D2B1E" : "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ArrowUpRight size={15} color="#10B981" />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: txtMuted }}>Entradas</span>
            </div>
            {cmp && incomeDiff !== 0 && (
              <span style={{ fontSize: 10.5, fontWeight: 700, color: incomeDiff > 0 ? "#10B981" : "#EF4444", background: incomeDiff > 0 ? (dark ? "#0D2B1E" : "#D1FAE5") : (dark ? "#2D1010" : "#FEE2E2"), padding: "2px 6px", borderRadius: 20 }}>
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
              <div style={{ width: 32, height: 32, borderRadius: 9, background: dark ? "#2D1010" : "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ArrowDownRight size={15} color="#EF4444" />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: txtMuted }}>Saídas</span>
            </div>
            {cmp && expenseDiff !== 0 && (
              <span style={{ fontSize: 10.5, fontWeight: 700, color: expenseDiff > 0 ? "#EF4444" : "#10B981", background: expenseDiff > 0 ? (dark ? "#2D1010" : "#FEE2E2") : (dark ? "#0D2B1E" : "#D1FAE5"), padding: "2px 6px", borderRadius: 20 }}>
                {expenseDiff > 0 ? "+" : ""}{expenseDiff}%
              </span>
            )}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#EF4444" }}>{fmt(summary.totalExpense)}</div>
        </div>

        {/* Saldo */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: summary.balance >= 0 ? (dark ? "#0D2B1E" : "#D1FAE5") : (dark ? "#2D1010" : "#FEE2E2"), display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={15} color={summary.balance >= 0 ? "#10B981" : "#EF4444"} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: txtMuted }}>Saldo</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: summary.balance >= 0 ? "#10B981" : "#EF4444" }}>{fmt(summary.balance)}</div>
        </div>

        {/* Lançamentos */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: dark ? "#1A1030" : "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wallet size={15} color="#7C3AED" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: txtMuted }}>Lançamentos</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#7C3AED" }}>{summary.count}</div>
        </div>
      </div>

      {/* ── Gráfico + Breakdown ──────────────────────────────────────────── */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 20 }}>

          {/* Gráficos duais */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: txt, marginBottom: 14 }}>Histórico de 6 meses</div>
            {stats.months.every((m) => m.income === 0 && m.expense === 0) ? (
              <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                <TrendingUp size={28} color={dark ? "#30363D" : "#E5E7EB"} />
                <span style={{ fontSize: 13, color: txtFaint }}>Sem dados para este período</span>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: txtFaint, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: "#10B981", display: "inline-block" }} />
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: "#F87171", display: "inline-block" }} />
                    Receitas vs Despesas
                  </div>
                  <FinanceBarChart months={stats.months} dark={dark} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: txtFaint, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 18, height: 2, background: "#6366F1", display: "inline-block", borderRadius: 2 }} />
                    Evolução do Saldo
                  </div>
                  <FinanceBalanceChart months={stats.months} gradId="fm-bal" dark={dark} />
                </div>
              </div>
            )}
          </div>

          {/* Breakdown por categoria */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: txt, marginBottom: 4 }}>Gastos por categoria</div>
            <div style={{ fontSize: 12, color: txtFaint, marginBottom: 14 }}>Despesas do mês</div>
            {stats.categoryBreakdown.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "20px 0" }}>
                <Tag size={24} color={dark ? "#30363D" : "#E5E7EB"} />
                <span style={{ fontSize: 12.5, color: txtFaint, textAlign: "center" }}>Nenhuma despesa categorizada neste mês</span>
              </div>
            ) : (
              <div>
                {stats.categoryBreakdown.map((item, i) => (
                  <CategoryBar key={item.id ?? `__${i}`} item={item} dark={dark} />
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
            style={{ padding: "7px 12px", borderRadius: 9, border: `1.5px solid ${bord}`, fontSize: 13, fontFamily: "inherit", background: surface, color: txt2 }}
          />

          {/* Tipo */}
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={filterSelectStyle}>
            <option value="">Todos os tipos</option>
            <option value="INCOME">Entradas</option>
            <option value="EXPENSE">Saídas</option>
          </select>

          {/* Categoria */}
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={filterSelectStyle}>
            <option value="">Todas as categorias</option>
            <option value="none">Sem categoria</option>
            {finCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Status */}
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={filterSelectStyle}>
            <option value="">Todos os status</option>
            <option value="CONFIRMED">Confirmados</option>
            <option value="PREDICTED">Previstos</option>
            <option value="OVERDUE">Em atraso</option>
          </select>

          {/* Busca */}
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: txtFaint, pointerEvents: "none" }} />
            <input
              value={filterQ}
              onChange={(e) => setFilterQ(e.target.value)}
              placeholder="Buscar título..."
              style={{ padding: "7px 28px 7px 30px", borderRadius: 9, border: `1.5px solid ${bord}`, fontSize: 13, fontFamily: "inherit", width: 180, background: surface, color: txt2 }}
            />
            {filterQ && (
              <button
                onMouseDown={(e) => { e.preventDefault(); setFilterQ(""); }}
                style={{ all: "unset", cursor: "pointer", position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: txtFaint }}
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
            style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, border: `1.5px solid ${bord}`, fontSize: 13, fontWeight: 600, color: txt2 }}
          >
            <Tag size={13} /> Categorias
          </button>
          <button
            onClick={() => { setShowOFX(true); setOfxStep("upload"); setOfxError(""); }}
            style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, border: `1.5px solid ${bord}`, fontSize: 13, fontWeight: 600, color: txt2 }}
          >
            <Upload size={13} /> Importar OFX
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
            <div key={i} className="card" style={{ padding: 16, height: 60, background: bgSec, animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Wallet size={48} color={dark ? "#30363D" : "#E5E7EB"} style={{ marginBottom: 14 }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: txt2, marginBottom: 6 }}>
            {filterQ || filterType || filterCategory || filterStatus
              ? "Nenhum resultado para os filtros aplicados"
              : "Nenhum lançamento neste período"}
          </p>
          <p style={{ fontSize: 13, color: txtFaint, marginBottom: 20 }}>
            {filterQ || filterType || filterCategory || filterStatus
              ? "Tente remover alguns filtros."
              : "Registre seu primeiro lançamento do mês."}
          </p>
          {!filterQ && !filterType && !filterCategory && !filterStatus && (
            <button
              onClick={openCreate}
              style={{ all: "unset", cursor: "pointer", padding: "10px 22px", borderRadius: 10, border: `1.5px dashed ${dark ? "#4D3000" : "#FCD34D"}`, color: dark ? "#F59E0B" : "#F59E0B", fontSize: 13, fontWeight: 700 }}
            >
              + Registrar lançamento
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {grouped.map((group) => {
            const dayIncome  = group.entries.filter((e) => e.type === "INCOME").reduce((s, e) => s + e.amount, 0);
            const dayExpense = group.entries.filter((e) => e.type === "EXPENSE").reduce((s, e) => s + e.amount, 0);

            return (
              <div key={group.dayKey} style={{ marginBottom: 16 }}>
                {/* Cabeçalho do dia */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", marginBottom: 6, borderBottom: `1px solid ${dark ? "#30363D" : "#F3F4F6"}` }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: txtMuted, textTransform: "capitalize" }}>{group.dayLabel}</span>
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
                        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = dark ? "0 4px 16px rgba(0,0,0,0.3)" : "0 4px 16px rgba(0,0,0,0.08)")}
                        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "")}
                      >
                        {/* Ícone tipo */}
                        <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: isIncome ? (dark ? "#0D2B1E" : "#D1FAE5") : (dark ? "#2D1010" : "#FEE2E2") }}>
                          {isIncome ? <ArrowUpRight size={17} color="#10B981" /> : <ArrowDownRight size={17} color="#EF4444" />}
                        </div>

                        {/* Texto */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: txt, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {entry.title}
                            </span>
                            {entryStatus !== "CONFIRMED" && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "1px 7px", borderRadius: 20, background: stCfg.bg, fontSize: 10.5, fontWeight: 700, color: stCfg.color, flexShrink: 0 }}>
                                <stCfg.Icon size={9} /> {stCfg.label}
                              </span>
                            )}
                            {entry.recurrence && entry.recurrence !== "NONE" && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "1px 7px", borderRadius: 20, background: dark ? "#1A1030" : "#EDE9FE", fontSize: 10.5, fontWeight: 700, color: "#7C3AED", flexShrink: 0 }}>
                                <RefreshCw size={9} /> {RECURRENCE_CFG[entry.recurrence] ?? ""}
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {entry.category && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: txtMuted }}>
                                <div style={{ width: 7, height: 7, borderRadius: "50%", background: entry.category.color ?? "#9CA3AF" }} />
                                {entry.category.name}
                              </span>
                            )}
                            {entry.description && (
                              <span style={{ fontSize: 11.5, color: txtFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
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
                              style={{ all: "unset", cursor: "pointer", display: "flex", padding: 5, borderRadius: 7, color: txtFaint }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = txt2)}
                              onMouseLeave={(e) => (e.currentTarget.style.color = txtFaint)}
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); remove(entry.id); }}
                              style={{ all: "unset", cursor: "pointer", display: "flex", padding: 5, borderRadius: 7, color: txtFaint }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = txtFaint)}
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

      {/* ── Modal: Importar OFX ──────────────────────────────────────────── */}
      {showOFX && (
        <Modal title="Importar extrato OFX / QFX" onClose={closeOFX} wide>
          {/* Hidden file input */}
          <input
            ref={ofxFileRef}
            type="file"
            accept=".ofx,.qfx"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleOFXFile(f);
              e.target.value = "";
            }}
          />

          {ofxStep === "upload" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setOfxDragging(true); }}
                onDragLeave={() => setOfxDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setOfxDragging(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleOFXFile(f);
                }}
                onClick={() => ofxFileRef.current?.click()}
                style={{
                  border: `2px dashed ${ofxDragging ? "#F59E0B" : bord}`,
                  borderRadius: 12,
                  padding: "48px 24px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: ofxDragging ? (dark ? "#1A1400" : "#FFFBEB") : (dark ? "#161B22" : "#FAFAFA"),
                  transition: "all 0.2s",
                }}
              >
                <Upload size={36} style={{ margin: "0 auto 12px", display: "block", color: ofxDragging ? "#F59E0B" : (dark ? "#484F58" : "#D1D5DB") }} />
                <p style={{ fontSize: 15, fontWeight: 700, color: txt2, marginBottom: 6 }}>
                  {ofxDragging ? "Solte o arquivo aqui" : "Arraste o arquivo ou clique para selecionar"}
                </p>
                <p style={{ fontSize: 13, color: txtMuted }}>Suporta arquivos .OFX e .QFX exportados pelo seu banco</p>
              </div>

              {ofxError && (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: dark ? "#2D1010" : "#FEE2E2", color: dark ? "#F87171" : "#991B1B", fontSize: 13, fontWeight: 500 }}>
                  {ofxError}
                </div>
              )}

              <p style={{ fontSize: 12, color: txtFaint, textAlign: "center" }}>
                O arquivo é processado localmente no servidor e não é armazenado.
              </p>
            </div>
          )}

          {ofxStep === "preview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Resumo */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 120, padding: "10px 14px", borderRadius: 10, background: dark ? "#0D2B1E" : "#D1FAE5", textAlign: "center" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: dark ? "#6EE7B7" : "#065F46", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>Entradas</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: dark ? "#10B981" : "#047857" }}>
                    {fmt(ofxTxns.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0))}
                  </p>
                </div>
                <div style={{ flex: 1, minWidth: 120, padding: "10px 14px", borderRadius: 10, background: dark ? "#2D1010" : "#FEE2E2", textAlign: "center" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: dark ? "#FCA5A5" : "#991B1B", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>Saídas</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: dark ? "#EF4444" : "#DC2626" }}>
                    {fmt(ofxTxns.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0))}
                  </p>
                </div>
                <div style={{ flex: 1, minWidth: 120, padding: "10px 14px", borderRadius: 10, background: dark ? "#21262D" : "#F3F4F6", textAlign: "center" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: txtMuted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>Selecionados</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: txt2 }}>
                    {ofxSelected.size} de {ofxTxns.length}
                  </p>
                </div>
              </div>

              {/* Selecionar todos */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => {
                    if (ofxSelected.size === ofxTxns.length) setOfxSelected(new Set());
                    else setOfxSelected(new Set(ofxTxns.map(t => t.fitid)));
                  }}
                  style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#F59E0B" }}
                >
                  {ofxSelected.size === ofxTxns.length
                    ? <CheckSquare size={15} />
                    : <Square size={15} />}
                  {ofxSelected.size === ofxTxns.length ? "Desmarcar todos" : "Selecionar todos"}
                </button>
                <button
                  onClick={() => { setOfxStep("upload"); setOfxTxns([]); setOfxSelected(new Set()); }}
                  style={{ all: "unset", cursor: "pointer", fontSize: 13, color: txtMuted, marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}
                >
                  <FileText size={13} /> Trocar arquivo
                </button>
              </div>

              {/* Tabela de transações */}
              <div style={{ maxHeight: 320, overflowY: "auto", borderRadius: 10, border: `1px solid ${bord}` }}>
                {ofxTxns.map((t) => {
                  const selected = ofxSelected.has(t.fitid);
                  const isInc = t.type === "INCOME";
                  return (
                    <div
                      key={t.fitid}
                      onClick={() => {
                        const next = new Set(ofxSelected);
                        if (next.has(t.fitid)) next.delete(t.fitid);
                        else next.add(t.fitid);
                        setOfxSelected(next);
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px",
                        borderBottom: `1px solid ${bord}`,
                        cursor: "pointer",
                        background: selected ? (dark ? "rgba(245,158,11,0.06)" : "rgba(245,158,11,0.04)") : (dark ? "#1C2128" : "#fff"),
                        transition: "background 0.15s",
                        opacity: selected ? 1 : 0.45,
                      }}
                    >
                      {selected ? <CheckSquare size={15} color="#F59E0B" style={{ flexShrink: 0 }} /> : <Square size={15} color={txtFaint} style={{ flexShrink: 0 }} />}
                      <span style={{ fontSize: 12, color: txtMuted, whiteSpace: "nowrap", minWidth: 76 }}>
                        {new Date(t.date + "T12:00:00").toLocaleDateString("pt-BR")}
                      </span>
                      <span style={{ flex: 1, fontSize: 13, color: txt2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.description}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: isInc ? "#10B981" : "#EF4444", whiteSpace: "nowrap" }}>
                        {isInc ? "+" : "-"}{fmt(t.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Progresso */}
              {ofxImporting && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: txtMuted, marginBottom: 4 }}>
                    <span>Importando...</span>
                    <span>{ofxProgress}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: dark ? "#21262D" : "#F3F4F6", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${ofxProgress}%`, background: "linear-gradient(90deg,#FBBF24,#F59E0B)", borderRadius: 999, transition: "width 0.3s" }} />
                  </div>
                </div>
              )}

              {/* Ações */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  onClick={closeOFX}
                  disabled={ofxImporting}
                  style={{ all: "unset", cursor: "pointer", padding: "10px 18px", borderRadius: 9, border: `1.5px solid ${bord}`, fontSize: 13, fontWeight: 600, color: txt2 }}
                >
                  Cancelar
                </button>
                <button
                  onClick={importOFXSelected}
                  disabled={ofxImporting || ofxSelected.size === 0}
                  style={{
                    all: "unset", cursor: ofxImporting || ofxSelected.size === 0 ? "not-allowed" : "pointer",
                    padding: "10px 20px", borderRadius: 9,
                    background: ofxSelected.size === 0 ? (dark ? "#21262D" : "#F3F4F6") : "linear-gradient(135deg,#FBBF24,#F59E0B)",
                    fontSize: 13, fontWeight: 700,
                    color: ofxSelected.size === 0 ? txtMuted : "#fff",
                    opacity: ofxImporting ? 0.7 : 1,
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  <Upload size={13} />
                  {ofxImporting ? "Importando..." : `Importar ${ofxSelected.size} lançamento${ofxSelected.size !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          )}
        </Modal>
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
