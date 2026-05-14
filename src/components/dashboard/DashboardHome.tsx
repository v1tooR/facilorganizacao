"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  CheckCircle2, Wallet, FolderKanban, StickyNote,
  Plus, ArrowUpRight, ArrowDownRight, TrendingUp,
  Clock, ChevronRight, Lock, X, Check, Pencil, Trash2, AlertCircle,
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { useDark } from "@/contexts/ThemeContext";
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────

interface FinanceMonth { month: string; label: string; income: number; expense: number; }

interface DashTask {
  id: string; title: string; status: string; priority: string;
  dueDate: string | null;
  category: { name: string; color: string } | null;
}

interface DashProject {
  id: string; name: string; description?: string | null; status: string;
  progress: number; taskCount: number; completedTaskCount: number;
  dueDate?: string | null;
}
interface DashNote { id: string; title: string; content: string; color: string | null; tags: string[]; }

interface DashboardData {
  user: { id: string; name: string; email: string; plan: string; planLabel: string; planLimits: { tasks: number; projects: number; notes: number; categories: number } };
  stats: { pendingTasks: number; completedTasks: number; totalTasks: number; tasksToday: number; activeProjects: number; totalNotes: number };
  finance: { available: boolean; monthlyIncome?: number; monthlyExpense?: number; monthlyBalance?: number; months?: FinanceMonth[] };
  recentTasks: DashTask[];
  activeProjects: DashProject[];
  recentNotes: DashNote[];
}

type QuickCreateType = "task" | "project" | "note" | "finance";

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function fmtShort(n: number) {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "M";
  if (Math.abs(n) >= 1000) return (n / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "k";
  return Math.round(n).toLocaleString("pt-BR");
}

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "";
  const date = new Date(d);
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Hoje";
  if (date.toDateString() === tomorrow.toDateString()) return "Amanhã";
  if (date.toDateString() === yesterday.toDateString()) return "Ontem";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function priorityLabel(p: string) { return ({ LOW: "Baixa", MEDIUM: "Média", HIGH: "Alta", URGENT: "Urgente" } as Record<string, string>)[p] ?? p; }
function priorityBadge(p: string) { return ({ LOW: "badge-gray", MEDIUM: "badge-amber", HIGH: "badge-red", URGENT: "badge-red" } as Record<string, string>)[p] ?? "badge-gray"; }
function statusLabel(s: string) { return ({ PENDING: "Pendente", IN_PROGRESS: "Em andamento", COMPLETED: "Concluída", CANCELLED: "Cancelada" } as Record<string, string>)[s] ?? s; }
function projectStatusLabel(s: string) { return ({ PLANNING: "Planejamento", IN_PROGRESS: "Em andamento", COMPLETED: "Concluído", ON_HOLD: "Em pausa", CANCELLED: "Cancelado" } as Record<string, string>)[s] ?? s; }

const NOTE_COLORS = ["#FEF3C7", "#D1FAE5", "#DBEAFE", "#EDE9FE", "#FCE7F3", "#FEE2E2"];

// ── Modal ───────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, maxWidth = 480 }: {
  title: string; onClose: () => void; children: React.ReactNode; maxWidth?: number;
}) {
  const { dark } = useDark();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: dark ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(3px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: dark ? "#1C2128" : "#fff",
        border: dark ? "1px solid #30363D" : "none",
        borderRadius: 16, padding: 28, width: "100%", maxWidth, maxHeight: "90vh", overflowY: "auto",
        boxShadow: dark ? "0 24px 64px rgba(0,0,0,0.5)" : "0 24px 64px rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: dark ? "#E6EDF3" : "#111827" }}>{title}</h3>
          <button onClick={onClose} style={{ all: "unset", cursor: "pointer", color: dark ? "#6E7681" : "#6B7280", display: "flex", padding: 4, borderRadius: 6 }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { dark } = useDark();
  return (
    <div>
      <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: dark ? "#8D96A0" : "#374151", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

// ── Finance Charts (Recharts) ────────────────────────────────────────────────

type ChartMonth = { month: string; label: string; income: number; expense: number };

function FinanceBarChart({ months, height = 110, dark = false }: { months: ChartMonth[]; height?: number; dark?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={months} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid vertical={false} stroke={dark ? "#30363D" : "#F3F4F6"} strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: dark ? "#8B949E" : "#9CA3AF" }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: dark ? "#8B949E" : "#9CA3AF" }} axisLine={false} tickLine={false} width={34} />
        <Tooltip
          formatter={(value: unknown, name: unknown) => [fmt(value as number), name === "income" ? "Receitas" : "Despesas"]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${dark ? "#30363D" : "#F3F4F6"}`, padding: "6px 10px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", background: dark ? "#21262D" : "#fff", color: dark ? "#E6EDF3" : "#111827" }}
          cursor={{ fill: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }}
        />
        <Bar dataKey="income" fill="#10B981" radius={[3, 3, 0, 0]} maxBarSize={16} />
        <Bar dataKey="expense" fill="#F87171" radius={[3, 3, 0, 0]} maxBarSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function FinanceBalanceChart({ months, gradId, height = 110, dark = false }: { months: ChartMonth[]; gradId: string; height?: number; dark?: boolean }) {
  let cum = 0;
  const data = months.map((m) => {
    cum += m.income - m.expense;
    return { label: m.label, balance: cum };
  });
  const lastBalance = data[data.length - 1]?.balance ?? 0;
  const color = lastBalance >= 0 ? "#6366F1" : "#EF4444";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={dark ? "#30363D" : "#F3F4F6"} strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: dark ? "#8B949E" : "#9CA3AF" }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: dark ? "#8B949E" : "#9CA3AF" }} axisLine={false} tickLine={false} width={34} />
        <Tooltip
          formatter={(value: unknown) => [fmt(value as number), "Saldo"]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${dark ? "#30363D" : "#F3F4F6"}`, padding: "6px 10px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", background: dark ? "#21262D" : "#fff", color: dark ? "#E6EDF3" : "#111827" }}
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

// ── Task Detail Modal ────────────────────────────────────────────────────────

interface FullTask {
  id: string; title: string; description?: string; status: string; priority: string;
  dueDate: string | null; completedAt: string | null;
  category: { id: string; name: string; color: string } | null;
  project: { id: string; name: string } | null;
}

function TaskDetailModal({ taskId, onClose, onRefresh }: { taskId: string; onClose: () => void; onRefresh: () => void }) {
  const { dark } = useDark();
  const [task, setTask] = useState<FullTask | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM", status: "PENDING", dueDate: "", projectId: "" });
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`/api/tasks/${taskId}`).then((r) => r.json()).then((d) => {
      if (!d.task) return;
      setTask(d.task);
      setForm({ title: d.task.title, description: d.task.description ?? "", priority: d.task.priority, status: d.task.status, dueDate: d.task.dueDate ? d.task.dueDate.substring(0, 10) : "", projectId: d.task.project?.id ?? "" });
    });
    fetch("/api/projects").then((r) => r.json()).then((d) => {
      if (d.projects) setProjects(d.projects.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
    });
  }, [taskId]);

  const save = async () => {
    setSaving(true); setErr("");
    const r = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title, description: form.description || undefined, priority: form.priority, status: form.status, dueDate: form.dueDate ? new Date(form.dueDate + "T12:00:00").toISOString() : undefined, projectId: form.projectId || null }),
    });
    setSaving(false);
    if (r.ok) {
      const updated = await r.json();
      setTask(updated.task); setEditing(false); onRefresh();
    } else { const d = await r.json(); setErr(d.error ?? "Erro ao salvar."); }
  };

  const remove = async () => {
    if (!confirm("Excluir esta tarefa?")) return;
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    onClose(); onRefresh();
  };

  const txt = dark ? "#E6EDF3" : "#111827";
  const txt2 = dark ? "#8D96A0" : "#4B5563";
  const txt3 = dark ? "#8B949E" : "#6B7280";
  const borderTop = dark ? "#30363D" : "#F3F4F6";

  return (
    <Modal title={editing ? "Editar tarefa" : "Detalhes da tarefa"} onClose={onClose}>
      {!task ? (
        <div style={{ textAlign: "center", padding: "28px 0", color: dark ? "#8B949E" : "#9CA3AF", fontSize: 13 }}>Carregando...</div>
      ) : editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Título *"><input className="input-base" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ fontSize: 13.5 }} autoFocus /></Field>
          <Field label="Descrição"><textarea className="input-base" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ fontSize: 13.5, minHeight: 80, resize: "vertical" }} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Prioridade">
              <select className="input-base" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={{ fontSize: 13.5 }}>
                <option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Alta</option><option value="URGENT">Urgente</option>
              </select>
            </Field>
            <Field label="Status">
              <select className="input-base" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ fontSize: 13.5 }}>
                <option value="PENDING">Pendente</option><option value="IN_PROGRESS">Em andamento</option><option value="COMPLETED">Concluída</option><option value="CANCELLED">Cancelada</option>
              </select>
            </Field>
          </div>
          <Field label="Prazo"><input type="date" className="input-base" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={{ fontSize: 13.5 }} /></Field>
          <Field label="Projeto">
            <select className="input-base" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} style={{ fontSize: 13.5 }}>
              <option value="">Nenhum projeto</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          {err && <p style={{ fontSize: 13, color: "#EF4444" }}>{err}</p>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setEditing(false)} className="btn-secondary" style={{ fontSize: 13, padding: "9px 18px" }}>Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary" style={{ fontSize: 13, padding: "9px 18px" }}>{saving ? "Salvando..." : "Salvar"}</button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 2, border: task.status === "COMPLETED" ? "none" : `2px solid ${dark ? "#30363D" : "#D1D5DB"}`, background: task.status === "COMPLETED" ? "#10B981" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {task.status === "COMPLETED" && <Check size={12} color="#fff" />}
              </div>
              <h4 style={{ fontSize: 17, fontWeight: 700, color: task.status === "COMPLETED" ? txt3 : txt, lineHeight: 1.4, textDecoration: task.status === "COMPLETED" ? "line-through" : "none" }}>{task.title}</h4>
            </div>
            {task.description && <p style={{ fontSize: 14, color: txt2, lineHeight: 1.7, marginBottom: 14, paddingLeft: 32 }}>{task.description}</p>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingLeft: 32 }}>
              <span className={`badge ${priorityBadge(task.priority)}`}>{priorityLabel(task.priority)}</span>
              <span style={{ fontSize: 12, fontWeight: 500, padding: "2px 10px", borderRadius: 999, background: dark ? "#21262D" : "#F3F4F6", color: txt3 }}>{statusLabel(task.status)}</span>
              {task.dueDate && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: txt3 }}><Clock size={12} />{fmtDate(task.dueDate)}</span>}
              {task.category && <span style={{ fontSize: 12, padding: "2px 10px", borderRadius: 999, background: task.category.color ?? (dark ? "#21262D" : "#F3F4F6"), color: dark ? "#E6EDF3" : "#374151" }}>{task.category.name}</span>}
              {task.project && <span style={{ fontSize: 12, color: txt3 }}>Projeto: {task.project.name}</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${borderTop}`, paddingTop: 16 }}>
            <button onClick={remove} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, color: "#EF4444", fontSize: 13, fontWeight: 600, background: dark ? "#2D1010" : "#FEF2F2", border: `1px solid ${dark ? "#3D1515" : "#FEE2E2"}` }}><Trash2 size={13} /> Excluir</button>
            <button onClick={() => setEditing(true)} className="btn-secondary" style={{ fontSize: 13, padding: "9px 18px", display: "flex", alignItems: "center", gap: 6 }}><Pencil size={13} /> Editar</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Project Detail Modal ─────────────────────────────────────────────────────

interface FullProject { id: string; name: string; description?: string; status: string; progress: number; _count: { tasks: number } }

function ProjectDetailModal({ projectId, onClose, onRefresh }: { projectId: string; onClose: () => void; onRefresh: () => void }) {
  const { dark } = useDark();
  const [project, setProject] = useState<FullProject | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", status: "PLANNING", progress: 0 });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const fetchProject = useCallback(async () => {
    const r = await fetch(`/api/projects/${projectId}`);
    if (r.ok) {
      const d = await r.json();
      setProject(d.project);
      setForm({ name: d.project.name, description: d.project.description ?? "", status: d.project.status, progress: d.project.progress });
    }
  }, [projectId]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const save = async () => {
    setSaving(true); setErr("");
    const r = await fetch(`/api/projects/${projectId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (r.ok) { setEditing(false); fetchProject(); onRefresh(); }
    else { const d = await r.json(); setErr(d.error ?? "Erro ao salvar."); }
  };

  const updateProgress = async (progress: number) => {
    setProject((prev) => prev ? { ...prev, progress } : null);
    await fetch(`/api/projects/${projectId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ progress }) });
    onRefresh();
  };

  const remove = async () => {
    if (!confirm("Excluir este projeto?")) return;
    await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    onClose(); onRefresh();
  };

  const txt = dark ? "#E6EDF3" : "#111827";
  const txt2 = dark ? "#8D96A0" : "#4B5563";
  const txt3 = dark ? "#8B949E" : "#6B7280";
  const borderTop = dark ? "#30363D" : "#F3F4F6";
  const progressTrack = dark ? "#21262D" : "#F3F4F6";
  const progressLabel = dark ? "#CDD5E0" : "#374151";

  const statusColors: Record<string, { bg: string; color: string }> = dark ? {
    PLANNING:    { bg: "#1E1340", color: "#A78BFA" },
    IN_PROGRESS: { bg: "#0D1F3C", color: "#60A5FA" },
    COMPLETED:   { bg: "#0D2B1E", color: "#34D399" },
    ON_HOLD:     { bg: "#2D2008", color: "#FBBF24" },
    CANCELLED:   { bg: "#2D1010", color: "#F87171" },
  } : {
    PLANNING:    { bg: "#EDE9FE", color: "#7C3AED" },
    IN_PROGRESS: { bg: "#DBEAFE", color: "#1E40AF" },
    COMPLETED:   { bg: "#D1FAE5", color: "#065F46" },
    ON_HOLD:     { bg: "#FEF3C7", color: "#92400E" },
    CANCELLED:   { bg: "#FEE2E2", color: "#991B1B" },
  };

  return (
    <Modal title={editing ? "Editar projeto" : "Detalhes do projeto"} onClose={onClose}>
      {!project ? (
        <div style={{ textAlign: "center", padding: "28px 0", color: dark ? "#8B949E" : "#9CA3AF", fontSize: 13 }}>Carregando...</div>
      ) : editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Nome *"><input className="input-base" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ fontSize: 13.5 }} autoFocus /></Field>
          <Field label="Descrição"><textarea className="input-base" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ fontSize: 13.5, minHeight: 70, resize: "vertical" }} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Status">
              <select className="input-base" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ fontSize: 13.5 }}>
                <option value="PLANNING">Planejamento</option><option value="IN_PROGRESS">Em andamento</option><option value="COMPLETED">Concluído</option><option value="ON_HOLD">Em pausa</option><option value="CANCELLED">Cancelado</option>
              </select>
            </Field>
            <Field label="Progresso (%)"><input type="number" className="input-base" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: parseInt(e.target.value) || 0 })} style={{ fontSize: 13.5 }} /></Field>
          </div>
          {err && <p style={{ fontSize: 13, color: "#EF4444" }}>{err}</p>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setEditing(false)} className="btn-secondary" style={{ fontSize: 13, padding: "9px 18px" }}>Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary" style={{ fontSize: 13, padding: "9px 18px" }}>{saving ? "Salvando..." : "Salvar"}</button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <h4 style={{ fontSize: 18, fontWeight: 700, color: txt }}>{project.name}</h4>
              {(() => { const sc = statusColors[project.status] ?? { bg: dark ? "#21262D" : "#F3F4F6", color: txt3 }; return <span style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: sc.bg, color: sc.color }}>{projectStatusLabel(project.status)}</span>; })()}
            </div>
            {project.description && <p style={{ fontSize: 14, color: txt2, lineHeight: 1.7, marginBottom: 16 }}>{project.description}</p>}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: progressLabel }}>Progresso</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: txt }}>{project.progress}%</span>
              </div>
              <div style={{ height: 8, background: progressTrack, borderRadius: 99, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ height: "100%", background: "linear-gradient(90deg,#FBBF24,#F59E0B)", width: `${project.progress}%`, borderRadius: 99, transition: "width 0.3s" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="range" min={0} max={100} value={project.progress}
                  onChange={(e) => updateProgress(parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: "#F59E0B", cursor: "pointer" }}
                />
                <span style={{ fontSize: 12, color: txt3, minWidth: 30, textAlign: "right" }}>{project.progress}%</span>
              </div>
            </div>
            <div style={{ fontSize: 13, color: txt3 }}>{project._count.tasks} tarefa{project._count.tasks !== 1 ? "s" : ""} vinculada{project._count.tasks !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${borderTop}`, paddingTop: 16 }}>
            <button onClick={remove} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, color: "#EF4444", fontSize: 13, fontWeight: 600, background: dark ? "#2D1010" : "#FEF2F2", border: `1px solid ${dark ? "#3D1515" : "#FEE2E2"}` }}><Trash2 size={13} /> Excluir</button>
            <button onClick={() => setEditing(true)} className="btn-secondary" style={{ fontSize: 13, padding: "9px 18px", display: "flex", alignItems: "center", gap: 6 }}><Pencil size={13} /> Editar</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Note Detail Modal ────────────────────────────────────────────────────────

function TagEditorInline({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const { dark } = useDark();
  const [input, setInput] = useState("");
  const addTag = () => {
    const t = input.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 10) onChange([...tags, t]);
    setInput("");
  };
  return (
    <div>
      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
          {tags.map((tag) => (
            <span key={tag} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, padding: "3px 8px", borderRadius: 20, background: dark ? "#21262D" : "#F3F4F6", color: dark ? "#CDD5E0" : "#374151", fontWeight: 600 }}>
              #{tag}
              <button onClick={() => onChange(tags.filter((t) => t !== tag))} style={{ all: "unset", cursor: "pointer", color: dark ? "#6E7681" : "#9CA3AF", display: "flex", lineHeight: 1 }}><X size={10} /></button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 6 }}>
        <input className="input-base" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Nova tag… Enter para adicionar" style={{ fontSize: 12.5, flex: 1 }} />
        <button onClick={addTag} className="btn-secondary" style={{ fontSize: 12, padding: "6px 10px" }}>+</button>
      </div>
    </div>
  );
}

interface FullNote { id: string; title: string; content: string; color: string | null; tags: string[]; updatedAt: string; }

function NoteDetailModal({ noteId, onClose, onRefresh }: { noteId: string; onClose: () => void; onRefresh: () => void }) {
  const { dark } = useDark();
  const [note, setNote] = useState<FullNote | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", color: "#FEF3C7", tags: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const fetchNote = useCallback(async () => {
    const r = await fetch(`/api/notes/${noteId}`);
    if (r.ok) {
      const d = await r.json();
      setNote(d.note);
      setForm({ title: d.note.title, content: d.note.content, color: d.note.color ?? "#FEF3C7", tags: d.note.tags ?? [] });
    }
  }, [noteId]);

  useEffect(() => { fetchNote(); }, [fetchNote]);

  const save = async () => {
    setSaving(true); setErr("");
    const r = await fetch(`/api/notes/${noteId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (r.ok) { setEditing(false); fetchNote(); onRefresh(); }
    else { const d = await r.json(); setErr(d.error ?? "Erro ao salvar."); }
  };

  const remove = async () => {
    if (!confirm("Excluir esta anotação?")) return;
    await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    onClose(); onRefresh();
  };

  const noteCardStyle = dark
    ? { background: "#21262D", border: "1px solid #30363D" }
    : { background: note?.color ?? "#F8FAFC", border: "none" };

  return (
    <Modal title={editing ? "Editar anotação" : "Anotação"} onClose={onClose} maxWidth={540}>
      {!note ? (
        <div style={{ textAlign: "center", padding: "28px 0", color: dark ? "#8B949E" : "#9CA3AF", fontSize: 13 }}>Carregando...</div>
      ) : editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Título *"><input className="input-base" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ fontSize: 13.5 }} autoFocus /></Field>
          <Field label="Conteúdo *"><textarea className="input-base" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} style={{ fontSize: 13.5, minHeight: 140, resize: "vertical" }} /></Field>
          <Field label="Cor">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {NOTE_COLORS.map((c) => (
                <button key={c} onClick={() => setForm({ ...form, color: c })} style={{ all: "unset", width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: form.color === c ? `3px solid ${dark ? "#E6EDF3" : "#374151"}` : "2px solid rgba(0,0,0,0.1)" }} />
              ))}
            </div>
          </Field>
          <Field label="Tags">
            <TagEditorInline tags={form.tags} onChange={(tags) => setForm({ ...form, tags })} />
          </Field>
          {err && <p style={{ fontSize: 13, color: "#EF4444" }}>{err}</p>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setEditing(false)} className="btn-secondary" style={{ fontSize: 13, padding: "9px 18px" }}>Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary" style={{ fontSize: 13, padding: "9px 18px" }}>{saving ? "Salvando..." : "Salvar"}</button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ ...noteCardStyle, borderRadius: 12, padding: "20px 22px", marginBottom: 20 }}>
            <h4 style={{ fontSize: 17, fontWeight: 700, color: dark ? "#E6EDF3" : "#1F2937", marginBottom: 12 }}>{note.title}</h4>
            <p style={{ fontSize: 14, color: dark ? "#CDD5E0" : "#374151", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{note.content}</p>
            {note.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 14 }}>
                {note.tags.map((tag) => (
                  <span key={tag} style={{ fontSize: 12, padding: "3px 8px", borderRadius: 20, background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)", color: dark ? "#CDD5E0" : "#374151", fontWeight: 600 }}>#{tag}</span>
                ))}
              </div>
            )}
            <p style={{ fontSize: 11, color: dark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)", marginTop: 14 }}>Atualizada em {new Date(note.updatedAt).toLocaleDateString("pt-BR")}</p>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={remove} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, color: "#EF4444", fontSize: 13, fontWeight: 600, background: dark ? "#2D1010" : "#FEF2F2", border: `1px solid ${dark ? "#3D1515" : "#FEE2E2"}` }}><Trash2 size={13} /> Excluir</button>
            <button onClick={() => setEditing(true)} className="btn-secondary" style={{ fontSize: 13, padding: "9px 18px", display: "flex", alignItems: "center", gap: 6 }}><Pencil size={13} /> Editar</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Quick Create Modal ───────────────────────────────────────────────────────

function QuickCreateModal({ type, onClose, onRefresh, hasFinance }: {
  type: QuickCreateType; onClose: () => void; onRefresh: () => void; hasFinance: boolean;
}) {
  const { dark } = useDark();
  const [form, setForm] = useState({
    title: "", description: "", priority: "MEDIUM", dueDate: "",
    name: "", status: "PLANNING",
    content: "", color: "#FEF3C7",
    financeType: "EXPENSE", amount: "", occurredAt: new Date().toISOString().substring(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const titles: Record<QuickCreateType, string> = { task: "Nova tarefa", project: "Novo projeto", note: "Nova anotação", finance: "Novo lançamento" };

  const save = async () => {
    setSaving(true); setErr("");
    let url = ""; let body: unknown;
    if (type === "task") { url = "/api/tasks"; body = { title: form.title, description: form.description || undefined, priority: form.priority, dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined }; }
    else if (type === "project") { url = "/api/projects"; body = { name: form.name || form.title, description: form.description || undefined, status: form.status, progress: 0 }; }
    else if (type === "note") { url = "/api/notes"; body = { title: form.title, content: form.content, color: form.color }; }
    else { url = "/api/finance"; body = { type: form.financeType, title: form.title, amount: form.amount, occurredAt: new Date(form.occurredAt).toISOString() }; }

    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (r.ok) { onClose(); onRefresh(); }
    else { const d = await r.json(); setErr(d.error ?? "Erro ao criar."); }
  };

  return (
    <Modal title={titles[type]} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {type === "task" && (<>
          <Field label="Título *"><input className="input-base" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="O que precisa ser feito?" style={{ fontSize: 13.5 }} autoFocus /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Prioridade">
              <select className="input-base" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={{ fontSize: 13.5 }}>
                <option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Alta</option><option value="URGENT">Urgente</option>
              </select>
            </Field>
            <Field label="Prazo"><input type="date" className="input-base" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={{ fontSize: 13.5 }} /></Field>
          </div>
        </>)}

        {type === "project" && (<>
          <Field label="Nome *"><input className="input-base" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do projeto" style={{ fontSize: 13.5 }} autoFocus /></Field>
          <Field label="Descrição"><textarea className="input-base" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição opcional" style={{ fontSize: 13.5, minHeight: 60, resize: "vertical" }} /></Field>
        </>)}

        {type === "note" && (<>
          <Field label="Título *"><input className="input-base" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título" style={{ fontSize: 13.5 }} autoFocus /></Field>
          <Field label="Conteúdo *"><textarea className="input-base" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Escreva aqui..." style={{ fontSize: 13.5, minHeight: 100, resize: "vertical" }} /></Field>
          <Field label="Cor">
            <div style={{ display: "flex", gap: 8 }}>
              {NOTE_COLORS.map((c) => (<button key={c} onClick={() => setForm({ ...form, color: c })} style={{ all: "unset", width: 26, height: 26, borderRadius: "50%", background: c, cursor: "pointer", border: form.color === c ? `3px solid ${dark ? "#E6EDF3" : "#374151"}` : "2px solid rgba(0,0,0,0.1)" }} />))}
            </div>
          </Field>
        </>)}

        {type === "finance" && (<>
          <Field label="Tipo *">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {(["INCOME", "EXPENSE"] as const).map((t) => (
                <button key={t} onClick={() => setForm({ ...form, financeType: t })} style={{
                  all: "unset", padding: "9px", borderRadius: 9, cursor: "pointer", textAlign: "center",
                  border: `2px solid ${form.financeType === t ? (t === "INCOME" ? "#10B981" : "#EF4444") : (dark ? "#30363D" : "#E5E7EB")}`,
                  background: form.financeType === t ? (t === "INCOME" ? (dark ? "#0D2B1E" : "#D1FAE5") : (dark ? "#2D1010" : "#FEE2E2")) : (dark ? "#21262D" : "#F9FAFB"),
                  fontSize: 13, fontWeight: 600,
                  color: form.financeType === t ? (t === "INCOME" ? "#10B981" : "#EF4444") : (dark ? "#8D96A0" : "#6B7280"),
                }}>
                  {t === "INCOME" ? "↑ Entrada" : "↓ Saída"}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Título *"><input className="input-base" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Salário, Aluguel..." style={{ fontSize: 13.5 }} autoFocus /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Valor *"><input className="input-base" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" style={{ fontSize: 13.5 }} /></Field>
            <Field label="Data *"><input type="date" className="input-base" value={form.occurredAt} onChange={(e) => setForm({ ...form, occurredAt: e.target.value })} style={{ fontSize: 13.5 }} /></Field>
          </div>
          {!hasFinance && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: dark ? "#2D2008" : "#FEF3C7", borderRadius: 9, fontSize: 13, color: dark ? "#FBBF24" : "#92400E" }}><AlertCircle size={13} /> Este recurso requer o plano Pro.</div>}
        </>)}

        {err && <p style={{ fontSize: 13, color: "#EF4444" }}>{err}</p>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn-secondary" style={{ fontSize: 13, padding: "9px 18px" }}>Cancelar</button>
          <button onClick={save} disabled={saving || (type === "finance" && !hasFinance)} className="btn-primary" style={{ fontSize: 13, padding: "9px 18px", opacity: (type === "finance" && !hasFinance) ? 0.5 : 1 }}>{saving ? "Criando..." : "Criar"}</button>
        </div>
      </div>
    </Modal>
  );
}

// ── Dashboard Home (Bento V2) ────────────────────────────────────────────────

export default function DashboardHome({ onNavigate }: { onNavigate: (m: string) => void }) {
  const { dark } = useDark();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [quickCreate, setQuickCreate] = useState<QuickCreateType | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [leftPct, setLeftPct] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dash-split");
      return saved ? parseFloat(saved) : 65;
    }
    return 65;
  });
  const bentoRef = useRef<HTMLDivElement>(null);

  // ── Dark palette ─────────────────────────────────────────────────────────
  const txt          = dark ? "#E6EDF3" : "#111827";
  const txt2         = dark ? "#CDD5E0" : "#1F2937";
  const txtMuted     = dark ? "#8D96A0" : "#6B7280";
  const txtFaint     = dark ? "#8B949E" : "#9CA3AF";
  const surface      = dark ? "#21262D" : "#F9FAFB";
  const surfaceBord  = dark ? "#30363D" : "#F3F4F6";
  const itemHoverBg  = dark ? "#2D333B" : "#EFF6FF";
  const taskHoverBg  = dark ? "#2D333B" : "#F0F4FF";
  const cardAccentBorder = (color: string) => `inset 0 3px 0 0 ${color}`;
  const handleBg     = dark ? "#30363D" : "#F0F0F0";
  const handleKnob   = dark ? "#484F58" : "#E5E7EB";
  const handleDotBg  = dark ? "#6E7681" : "#9CA3AF";
  const handleKnobHover = dark ? "#6E7681" : "#D1D5DB";

  const startDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const container = bentoRef.current;
    if (!container) return;
    const startX = e.clientX;
    const startPct = leftPct;
    const containerW = container.getBoundingClientRect().width;
    const onMove = (ev: MouseEvent) => {
      const newPct = Math.min(82, Math.max(28, startPct + ((ev.clientX - startX) / containerW) * 100));
      setLeftPct(newPct);
      localStorage.setItem("dash-split", String(newPct));
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [leftPct]);

  const loadDashboard = useCallback(async () => {
    try { const r = await fetch("/api/dashboard"); if (r.ok) setData(await r.json()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const toggleTask = async (task: DashTask) => {
    setToggling(task.id);
    const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    await fetch(`/api/tasks/${task.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    setToggling(null);
    loadDashboard();
  };

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Bom dia" : now.getHours() < 18 ? "Boa tarde" : "Boa noite";
  const firstName = data?.user?.name?.split(" ")[0] ?? "você";
  const hasFinance = data ? (PLANS[data.user.plan as keyof typeof PLANS]?.features?.finance ?? false) : false;

  if (loading) {
    return (
      <div style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 36, height: 36, borderWidth: 3, borderStyle: "solid", borderColor: dark ? "#30363D" : "#F3F4F6", borderTopColor: "#F59E0B", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 13, color: txtFaint }}>Carregando dashboard...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const stats = data?.stats;
  const finance = data?.finance;
  const recentTasks = data?.recentTasks ?? [];
  const activeProjects = data?.activeProjects ?? [];
  const recentNotes = data?.recentNotes ?? [];

  const kpiHover = (el: HTMLDivElement, enter: boolean) => {
    el.style.transform = enter ? "translateY(-2px)" : "";
    el.style.boxShadow = enter ? (dark ? "0 8px 24px rgba(0,0,0,0.35)" : "0 8px 24px rgba(0,0,0,0.09)") : "";
  };

  // Quick action pills — dark-aware
  const qaPills = [
    { type: "task"    as QuickCreateType, label: "Tarefa",     icon: <CheckCircle2 size={13} />, bg: dark ? "#2D2008" : "#FFFBEB", color: dark ? "#FBBF24" : "#92400E", border: dark ? "#4D3800" : "#FDE68A" },
    { type: "project" as QuickCreateType, label: "Projeto",    icon: <FolderKanban size={13} />, bg: dark ? "#0D1F3C" : "#EFF6FF", color: dark ? "#60A5FA" : "#1D4ED8", border: dark ? "#1D3A6D" : "#BFDBFE" },
    { type: "note"    as QuickCreateType, label: "Nota",       icon: <StickyNote   size={13} />, bg: dark ? "#1E1340" : "#F5F3FF", color: dark ? "#A78BFA" : "#6D28D9", border: dark ? "#3B2773" : "#DDD6FE" },
    ...(hasFinance ? [{ type: "finance" as QuickCreateType, label: "Lançamento", icon: <Wallet size={13} />, bg: dark ? "#0D2B1E" : "#F0FDF4", color: dark ? "#34D399" : "#065F46", border: dark ? "#1B4D38" : "#BBF7D0" }] : []),
  ];

  // Project status config — dark-aware
  const statusCfgMap: Record<string, { label: string; bg: string; color: string }> = dark ? {
    PLANNING:    { label: "Planejamento", bg: "#1E1340", color: "#A78BFA" },
    IN_PROGRESS: { label: "Em andamento", bg: "#0D1F3C", color: "#60A5FA" },
    ON_HOLD:     { label: "Em pausa",     bg: "#2D2008", color: "#FBBF24" },
  } : {
    PLANNING:    { label: "Planejamento", bg: "#EDE9FE", color: "#7C3AED" },
    IN_PROGRESS: { label: "Em andamento", bg: "#DBEAFE", color: "#1E40AF" },
    ON_HOLD:     { label: "Em pausa",     bg: "#FEF3C7", color: "#92400E" },
  };

  return (
    <div style={{ padding: 20, fontFamily: "DM Sans, sans-serif" }}>
      {/* ── Modals ── */}
      {selectedTaskId && <TaskDetailModal taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} onRefresh={loadDashboard} />}
      {selectedProjectId && <ProjectDetailModal projectId={selectedProjectId} onClose={() => setSelectedProjectId(null)} onRefresh={loadDashboard} />}
      {selectedNoteId && <NoteDetailModal noteId={selectedNoteId} onClose={() => setSelectedNoteId(null)} onRefresh={loadDashboard} />}
      {quickCreate && <QuickCreateModal type={quickCreate} onClose={() => setQuickCreate(null)} onRefresh={loadDashboard} hasFinance={hasFinance} />}

      {/* ── Greeting + Quick Actions ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: txt, letterSpacing: "-0.01em", marginBottom: 4 }}>
            {greeting}, {firstName} 👋
          </h2>
          <p style={{ fontSize: 14, color: txtMuted }}>
            {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {stats && stats.tasksToday > 0 && (
              <> · <strong style={{ color: txt }}>{stats.tasksToday} tarefa{stats.tasksToday > 1 ? "s" : ""}</strong> para hoje</>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {qaPills.map(({ type, label, icon, bg, color, border }) => (
            <button key={type} onClick={() => setQuickCreate(type)} style={{
              all: "unset", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 13px", borderRadius: 10,
              background: bg, color, border: `1.5px solid ${border}`,
              fontSize: 12.5, fontWeight: 700,
              transition: "transform 0.15s, box-shadow 0.15s", userSelect: "none",
            }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.transform = "translateY(-1px)"; el.style.boxShadow = dark ? "0 4px 12px rgba(0,0,0,0.35)" : "0 4px 12px rgba(0,0,0,0.08)"; }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.transform = ""; el.style.boxShadow = ""; }}>
              {icon}
              + {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Row (4 cols) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 14 }}>
        {/* Tasks KPI */}
        <div className="card" style={{ padding: 18, cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s", background: "var(--surface)" }}
          onClick={() => onNavigate("tasks")}
          onMouseEnter={(e) => kpiHover(e.currentTarget as HTMLDivElement, true)}
          onMouseLeave={(e) => kpiHover(e.currentTarget as HTMLDivElement, false)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: dark ? "#2D2008" : "#FEF3C7", color: "#F59E0B", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={18} /></div>
            <ChevronRight size={14} color={dark ? "#6E7681" : "#D1D5DB"} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: txt, lineHeight: 1, marginBottom: 4 }}>{stats?.pendingTasks ?? 0}</div>
          <div style={{ fontSize: 12.5, color: txtMuted }}>Tarefas pendentes</div>
          {(stats?.tasksToday ?? 0) > 0 && <div style={{ fontSize: 11.5, color: "#F59E0B", marginTop: 3, fontWeight: 600 }}>{stats!.tasksToday} para hoje</div>}
        </div>

        {/* Balance KPI */}
        <div className="card" style={{ padding: 18, cursor: hasFinance ? "pointer" : "default", transition: "transform 0.15s, box-shadow 0.15s", background: "var(--surface)" }}
          onClick={() => hasFinance && onNavigate("finance")}
          onMouseEnter={(e) => { if (hasFinance) kpiHover(e.currentTarget as HTMLDivElement, true); }}
          onMouseLeave={(e) => { if (hasFinance) kpiHover(e.currentTarget as HTMLDivElement, false); }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: dark ? "#0D2B1E" : "#D1FAE5", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center" }}><Wallet size={18} /></div>
            {hasFinance ? <ChevronRight size={14} color={dark ? "#6E7681" : "#D1D5DB"} /> : <Lock size={13} color={dark ? "#6E7681" : "#D1D5DB"} />}
          </div>
          {finance?.available ? (<>
            <div style={{ fontSize: 22, fontWeight: 800, color: (finance.monthlyBalance ?? 0) >= 0 ? "#10B981" : "#EF4444", lineHeight: 1, marginBottom: 4 }}>{fmt(finance.monthlyBalance ?? 0)}</div>
            <div style={{ fontSize: 12.5, color: txtMuted }}>Saldo do mês</div>
          </>) : (<>
            <div style={{ fontSize: 13, color: dark ? "#8B949E" : "#9CA3AF", fontWeight: 600, marginBottom: 4 }}>—</div>
            <div style={{ fontSize: 12, color: dark ? "#8B949E" : "#9CA3AF" }}>Plano Pro</div>
          </>)}
        </div>

        {/* Projects KPI */}
        <div className="card" style={{ padding: 18, cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s", background: "var(--surface)" }}
          onClick={() => onNavigate("projects")}
          onMouseEnter={(e) => kpiHover(e.currentTarget as HTMLDivElement, true)}
          onMouseLeave={(e) => kpiHover(e.currentTarget as HTMLDivElement, false)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: dark ? "#0D1F3C" : "#DBEAFE", color: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center" }}><FolderKanban size={18} /></div>
            <ChevronRight size={14} color={dark ? "#6E7681" : "#D1D5DB"} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: txt, lineHeight: 1, marginBottom: 4 }}>{stats?.activeProjects ?? 0}</div>
          <div style={{ fontSize: 12.5, color: txtMuted }}>Projetos ativos</div>
        </div>

        {/* Notes KPI */}
        <div className="card" style={{ padding: 18, cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s", background: "var(--surface)" }}
          onClick={() => onNavigate("notes")}
          onMouseEnter={(e) => kpiHover(e.currentTarget as HTMLDivElement, true)}
          onMouseLeave={(e) => kpiHover(e.currentTarget as HTMLDivElement, false)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: dark ? "#1E1340" : "#EDE9FE", color: "#8B5CF6", display: "flex", alignItems: "center", justifyContent: "center" }}><StickyNote size={18} /></div>
            <ChevronRight size={14} color={dark ? "#6E7681" : "#D1D5DB"} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: txt, lineHeight: 1, marginBottom: 4 }}>{stats?.totalNotes ?? 0}</div>
          <div style={{ fontSize: 12.5, color: txtMuted }}>Anotações</div>
        </div>
      </div>

      {/* ── Bento: Resizable Split ── */}
      <div ref={bentoRef} style={{ display: "flex", alignItems: "stretch", gap: 0 }}>

        {/* ── Coluna esquerda: Tarefas + Notas ── */}
        <div style={{ width: `${leftPct}%`, display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>

          {/* Tarefas */}
          <div className="card" style={{ padding: 20, background: "var(--surface)", boxShadow: cardAccentBorder("#F59E0B") }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: txt }}>Tarefas pendentes</h3>
                <p style={{ fontSize: 11.5, color: txtFaint, marginTop: 2 }}>✓ para concluir · clique para detalhes</p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => setQuickCreate("task")} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: dark ? "#FBBF24" : "#92400E", padding: "5px 10px", background: dark ? "#2D2008" : "#FEF3C7", borderRadius: 7 }}>
                  <Plus size={11} /> Tarefa
                </button>
                <button onClick={() => onNavigate("tasks")} style={{ all: "unset", cursor: "pointer", fontSize: 12, color: txtMuted, fontWeight: 500 }}>Ver todas →</button>
              </div>
            </div>
            {recentTasks.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 0", gap: 10 }}>
                <CheckCircle2 size={32} color={dark ? "#30363D" : "#D1D5DB"} />
                <p style={{ fontSize: 13.5, color: txtFaint }}>Nenhuma tarefa pendente 🎉</p>
                <button onClick={() => setQuickCreate("task")} style={{ all: "unset", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#F59E0B", padding: "6px 14px", border: "1.5px dashed #FCD34D", borderRadius: 8 }}>+ Criar primeira tarefa</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {recentTasks.slice(0, 7).map((task) => (
                  <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: surface, borderTop: `1px solid ${surfaceBord}`, borderRight: `1px solid ${surfaceBord}`, borderBottom: `1px solid ${surfaceBord}`, borderLeft: `3px solid ${{ LOW: dark ? "#6E7681" : "#D1D5DB", MEDIUM: "#FCD34D", HIGH: "#FCA5A5", URGENT: "#EF4444" }[task.priority] ?? (dark ? "#6E7681" : "#D1D5DB")}`, transition: "background 0.1s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = taskHoverBg; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = surface; }}
                  >
                    <button onClick={(e) => { e.stopPropagation(); toggleTask(task); }} disabled={toggling === task.id}
                      style={{ all: "unset", cursor: "pointer", flexShrink: 0, width: 20, height: 20, borderRadius: "50%", border: task.status === "COMPLETED" ? "none" : `2px solid ${dark ? "#6E7681" : "#D1D5DB"}`, background: task.status === "COMPLETED" ? "#10B981" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s", opacity: toggling === task.id ? 0.4 : 1 }}>
                      {task.status === "COMPLETED" && <Check size={11} color="#fff" />}
                    </button>
                    <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setSelectedTaskId(task.id)}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: task.status === "COMPLETED" ? txtFaint : txt2, textDecoration: task.status === "COMPLETED" ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {task.title}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, cursor: "pointer" }} onClick={() => setSelectedTaskId(task.id)}>
                      <span className={`badge ${priorityBadge(task.priority)}`} style={{ fontSize: 10.5 }}>{priorityLabel(task.priority)}</span>
                      {task.dueDate && <span style={{ fontSize: 11, color: txtFaint, display: "flex", alignItems: "center", gap: 3 }}><Clock size={10} />{fmtDate(task.dueDate)}</span>}
                    </div>
                  </div>
                ))}
                {recentTasks.length > 7 && (
                  <button onClick={() => onNavigate("tasks")} style={{ all: "unset", cursor: "pointer", textAlign: "center", fontSize: 12.5, color: "#F59E0B", fontWeight: 600, paddingTop: 10, display: "block" }}>
                    Ver mais {recentTasks.length - 7} tarefas →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Notas slider */}
          <div className="card" style={{ padding: 20, background: "var(--surface)", boxShadow: cardAccentBorder("#8B5CF6") }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: txt }}>Anotações</h3>
                <p style={{ fontSize: 11.5, color: txtFaint, marginTop: 2 }}>Clique para abrir · arraste para navegar</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setQuickCreate("note")} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: dark ? "#A78BFA" : "#6D28D9", padding: "5px 10px", background: dark ? "#1E1340" : "#EDE9FE", borderRadius: 7 }}>
                  <Plus size={11} /> Nota
                </button>
                <button onClick={() => onNavigate("notes")} style={{ all: "unset", cursor: "pointer", fontSize: 12, color: txtMuted, fontWeight: 500 }}>Ver todas →</button>
              </div>
            </div>
            {recentNotes.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 0", gap: 10 }}>
                <StickyNote size={32} color={dark ? "#30363D" : "#D1D5DB"} />
                <p style={{ fontSize: 13.5, color: txtFaint }}>Nenhuma anotação ainda.</p>
                <button onClick={() => setQuickCreate("note")} style={{ all: "unset", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#8B5CF6", padding: "6px 14px", border: "1.5px dashed #C4B5FD", borderRadius: 8 }}>+ Criar primeira nota</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 14, overflowX: "auto", scrollSnapType: "x mandatory", scrollBehavior: "smooth", paddingBottom: 6 }}>
                {recentNotes.map((note) => (
                  <div key={note.id} onClick={() => setSelectedNoteId(note.id)}
                    style={{
                      flexShrink: 0, width: 220, minHeight: 148, scrollSnapAlign: "start", borderRadius: 14,
                      background: dark ? "#21262D" : (note.color ?? "#F8FAFC"),
                      border: `1px solid ${dark ? "#30363D" : "rgba(0,0,0,0.06)"}`,
                      padding: "16px 16px 12px", cursor: "pointer", position: "relative", transition: "transform 0.15s, box-shadow 0.15s",
                    }}
                    onMouseEnter={(e) => { const d = e.currentTarget as HTMLDivElement; d.style.transform = "translateY(-3px)"; d.style.boxShadow = dark ? "0 8px 24px rgba(0,0,0,0.4)" : "0 8px 24px rgba(0,0,0,0.1)"; }}
                    onMouseLeave={(e) => { const d = e.currentTarget as HTMLDivElement; d.style.transform = ""; d.style.boxShadow = ""; }}
                  >
                    {/* Color accent dot for dark mode */}
                    {dark && note.color && (
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: note.color, marginBottom: 8 }} />
                    )}
                    <div style={{ fontSize: 13, fontWeight: 700, color: dark ? "#E6EDF3" : "#1F2937", marginBottom: 7, lineHeight: 1.3, paddingRight: 18 }}>{note.title}</div>
                    <div style={{ fontSize: 12, color: dark ? "#8D96A0" : "#4B5563", lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" } as React.CSSProperties}>{note.content}</div>
                    <div style={{ position: "absolute", bottom: 10, right: 12 }}>
                      <Pencil size={10} color={dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)"} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>{/* end coluna esquerda */}

        {/* ── Drag Handle ── */}
        <div
          onMouseDown={startDrag}
          title="Arrastar para redimensionar"
          style={{ width: 16, flexShrink: 0, cursor: "col-resize", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", userSelect: "none" }}
        >
          <div style={{ width: 2, height: "100%", background: handleBg, position: "absolute", borderRadius: 99 }} />
          <div
            style={{ position: "relative", zIndex: 1, width: 12, height: 40, background: handleKnob, borderRadius: 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, transition: "background 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = handleKnobHover; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = handleKnob; }}
          >
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 2, height: 2, borderRadius: "50%", background: handleDotBg }} />
            ))}
          </div>
        </div>

        {/* ── Coluna direita: Financeiro + Projetos ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>

          {/* Financeiro */}
          <div className="card" style={{ padding: 20, background: "var(--surface)", boxShadow: cardAccentBorder("#10B981") }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: txt }}>Financeiro</h3>
              {hasFinance && <button onClick={() => onNavigate("finance")} style={{ all: "unset", cursor: "pointer", fontSize: 12, color: txtMuted, fontWeight: 500 }}>Ver →</button>}
            </div>
            {!finance?.available ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <Lock size={28} color={dark ? "#30363D" : "#E5E7EB"} style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 12.5, color: txtFaint, marginBottom: 6 }}>Disponível no plano Pro</p>
                <button onClick={() => onNavigate("settings")} style={{ all: "unset", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#F59E0B" }}>Ver planos →</button>
              </div>
            ) : (<>
              {/* Compact summary row */}
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", background: dark ? "#0D2B1E" : "#F0FDF4", borderRadius: 8, border: `1px solid ${dark ? "#1B4D38" : "#D1FAE5"}` }}>
                  <ArrowUpRight size={12} color="#10B981" style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 9.5, fontWeight: 600, color: "#059669", lineHeight: 1 }}>Entradas</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#10B981", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fmt(finance.monthlyIncome ?? 0)}</div>
                  </div>
                </div>
                <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", background: dark ? "#2D1010" : "#FFF5F5", borderRadius: 8, border: `1px solid ${dark ? "#3D1515" : "#FEE2E2"}` }}>
                  <ArrowDownRight size={12} color="#EF4444" style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 9.5, fontWeight: 600, color: "#DC2626", lineHeight: 1 }}>Saídas</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#EF4444", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fmt(finance.monthlyExpense ?? 0)}</div>
                  </div>
                </div>
                <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", background: (finance.monthlyBalance ?? 0) >= 0 ? (dark ? "#0D2B1E" : "#F0FDF4") : (dark ? "#2D1010" : "#FFF5F5"), borderRadius: 8, border: `1px solid ${(finance.monthlyBalance ?? 0) >= 0 ? (dark ? "#1B4D38" : "#D1FAE5") : (dark ? "#3D1515" : "#FEE2E2")}` }}>
                  <TrendingUp size={12} color={(finance.monthlyBalance ?? 0) >= 0 ? "#10B981" : "#EF4444"} style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 9.5, fontWeight: 600, color: txtMuted, lineHeight: 1 }}>Saldo</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: (finance.monthlyBalance ?? 0) >= 0 ? "#10B981" : "#EF4444", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fmt(finance.monthlyBalance ?? 0)}</div>
                  </div>
                </div>
              </div>
              {finance.months && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
                  <div>
                    <div style={{ fontSize: 9.5, fontWeight: 600, color: txtFaint, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: "#10B981", display: "inline-block", flexShrink: 0 }} />
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: "#F87171", display: "inline-block", flexShrink: 0 }} />
                      Receitas vs Despesas
                    </div>
                    <FinanceBarChart months={finance.months} dark={dark} />
                  </div>
                  <div>
                    <div style={{ fontSize: 9.5, fontWeight: 600, color: txtFaint, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 16, height: 2, background: "#6366F1", display: "inline-block", borderRadius: 2, flexShrink: 0 }} />
                      Evolução do Saldo
                    </div>
                    <FinanceBalanceChart months={finance.months} gradId="db-bal" dark={dark} />
                  </div>
                </div>
              )}
            </>)}
          </div>

          {/* Projetos */}
          <div className="card" style={{ padding: 20, background: "var(--surface)", boxShadow: cardAccentBorder("#3B82F6") }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: txt }}>Projetos</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setQuickCreate("project")} style={{ all: "unset", cursor: "pointer", fontSize: 12, fontWeight: 700, color: dark ? "#60A5FA" : "#1E40AF", padding: "4px 8px", background: dark ? "#0D1F3C" : "#DBEAFE", borderRadius: 6 }}><Plus size={10} style={{ display: "inline", marginRight: 2 }} />Novo</button>
                <button onClick={() => onNavigate("projects")} style={{ all: "unset", cursor: "pointer", fontSize: 12, color: txtMuted, fontWeight: 500 }}>Ver →</button>
              </div>
            </div>
            {activeProjects.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 0", gap: 10 }}>
                <FolderKanban size={32} color={dark ? "#30363D" : "#D1D5DB"} />
                <p style={{ fontSize: 13, color: txtFaint }}>Nenhum projeto ativo</p>
                <button onClick={() => setQuickCreate("project")} style={{ all: "unset", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#3B82F6", padding: "6px 14px", border: "1.5px dashed #BFDBFE", borderRadius: 8 }}>+ Criar projeto</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {activeProjects.slice(0, 4).map((p) => {
                  const sc = statusCfgMap[p.status] ?? { label: p.status, bg: dark ? "#21262D" : "#F3F4F6", color: txtMuted };
                  const done = p.completedTaskCount;
                  const total = p.taskCount;
                  const pct = total > 0 ? Math.round((done / total) * 100) : p.progress;
                  const isOverdue = p.dueDate && new Date(p.dueDate) < new Date();

                  return (
                    <div key={p.id} onClick={() => setSelectedProjectId(p.id)}
                      style={{ padding: "11px 12px", background: surface, borderRadius: 10, border: `1px solid ${surfaceBord}`, cursor: "pointer", transition: "background 0.1s, box-shadow 0.15s, transform 0.12s" }}
                      onMouseEnter={(e) => { const d = e.currentTarget as HTMLDivElement; d.style.background = itemHoverBg; d.style.boxShadow = dark ? "0 4px 14px rgba(0,0,0,0.3)" : "0 4px 14px rgba(0,0,0,0.07)"; d.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={(e) => { const d = e.currentTarget as HTMLDivElement; d.style.background = surface; d.style.boxShadow = ""; d.style.transform = ""; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: sc.bg, color: sc.color, flexShrink: 0 }}>{sc.label}</span>
                        {isOverdue && <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: dark ? "#2D1010" : "#FEE2E2", color: "#EF4444", flexShrink: 0 }}>Atrasado</span>}
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: txt, marginBottom: p.description ? 3 : 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      {p.description && (
                        <div style={{ fontSize: 11.5, color: txtMuted, marginBottom: 6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" } as React.CSSProperties}>
                          {p.description}
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 10.5, color: txtFaint }}>
                          {total === 0 ? "Sem tarefas" : `${done}/${total} concluída${done !== 1 ? "s" : ""}`}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: dark ? "#CDD5E0" : "#374151" }}>{pct}%</span>
                      </div>
                      <div style={{ height: 4, background: dark ? "#30363D" : "#E5E7EB", borderRadius: 99 }}>
                        <div style={{ height: "100%", borderRadius: 99, background: pct === 100 ? "#10B981" : "linear-gradient(90deg,#6366F1,#8B5CF6)", width: `${pct}%`, transition: "width 0.5s" }} />
                      </div>
                      {p.dueDate && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5, fontSize: 10.5, color: isOverdue ? "#EF4444" : txtFaint, fontWeight: isOverdue ? 600 : 400 }}>
                          <Clock size={10} />
                          {fmtDate(p.dueDate)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>{/* end coluna direita */}

      </div>{/* end bento */}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
