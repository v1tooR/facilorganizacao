"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  CheckCircle2, Wallet, FolderKanban, StickyNote,
  Plus, ArrowUpRight, ArrowDownRight, TrendingUp,
  Clock, ChevronRight, Lock, X, Check, Pencil, Trash2, AlertCircle,
} from "lucide-react";
import { PLANS } from "@/lib/plans";

// ── Types ──────────────────────────────────────────────────────────────────

interface FinanceMonth { month: string; label: string; income: number; expense: number; }

interface DashTask {
  id: string; title: string; status: string; priority: string;
  dueDate: string | null;
  category: { name: string; color: string } | null;
}

interface DashProject { id: string; name: string; status: string; progress: number; taskCount: number; }
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
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(3px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{title}</h3>
          <button onClick={onClose} style={{ all: "unset", cursor: "pointer", color: "#6B7280", display: "flex", padding: 4, borderRadius: 6 }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

// ── Finance Chart (SVG) ──────────────────────────────────────────────────────

function FinanceChart({ months }: { months: FinanceMonth[] }) {
  if (!months?.length) return <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#D1D5DB" }}>Sem dados</div>;

  const maxVal = Math.max(...months.flatMap((m) => [m.income, m.expense]), 1);
  const chartH = 56;
  const bw = 9, gap = 3, mw = bw * 2 + gap + 12;
  const totalW = months.length * mw;

  return (
    <div>
      <div style={{ display: "flex", gap: 12, fontSize: 10.5, color: "#6B7280", marginBottom: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: "#10B981", display: "inline-block" }} /> Entradas
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: "#F87171", display: "inline-block" }} /> Saídas
        </span>
      </div>
      <svg viewBox={`0 0 ${totalW + 4} ${chartH + 18}`} style={{ width: "100%", overflow: "visible" }}>
        {months.map((m, i) => {
          const x = i * mw + 2;
          const ih = maxVal > 0 ? Math.max((m.income / maxVal) * chartH, m.income > 0 ? 3 : 0) : 0;
          const eh = maxVal > 0 ? Math.max((m.expense / maxVal) * chartH, m.expense > 0 ? 3 : 0) : 0;
          return (
            <g key={m.month}>
              <rect x={x} y={chartH - ih} width={bw} height={ih} rx={2} fill="#10B981" opacity={0.85} />
              <rect x={x + bw + gap} y={chartH - eh} width={bw} height={eh} rx={2} fill="#F87171" opacity={0.85} />
              <text x={x + bw} y={chartH + 13} textAnchor="middle" fontSize={7.5} fill="#9CA3AF">{m.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
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

  return (
    <Modal title={editing ? "Editar tarefa" : "Detalhes da tarefa"} onClose={onClose}>
      {!task ? (
        <div style={{ textAlign: "center", padding: "28px 0", color: "#9CA3AF", fontSize: 13 }}>Carregando...</div>
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
              <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 2, border: task.status === "COMPLETED" ? "none" : "2px solid #D1D5DB", background: task.status === "COMPLETED" ? "#10B981" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {task.status === "COMPLETED" && <Check size={12} color="#fff" />}
              </div>
              <h4 style={{ fontSize: 17, fontWeight: 700, color: task.status === "COMPLETED" ? "#9CA3AF" : "#111827", lineHeight: 1.4, textDecoration: task.status === "COMPLETED" ? "line-through" : "none" }}>{task.title}</h4>
            </div>
            {task.description && <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.7, marginBottom: 14, paddingLeft: 32 }}>{task.description}</p>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingLeft: 32 }}>
              <span className={`badge ${priorityBadge(task.priority)}`}>{priorityLabel(task.priority)}</span>
              <span style={{ fontSize: 12, fontWeight: 500, padding: "2px 10px", borderRadius: 999, background: "#F3F4F6", color: "#6B7280" }}>{statusLabel(task.status)}</span>
              {task.dueDate && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6B7280" }}><Clock size={12} />{fmtDate(task.dueDate)}</span>}
              {task.category && <span style={{ fontSize: 12, padding: "2px 10px", borderRadius: 999, background: task.category.color ?? "#F3F4F6", color: "#374151" }}>{task.category.name}</span>}
              {task.project && <span style={{ fontSize: 12, color: "#6B7280" }}>Projeto: {task.project.name}</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: "1px solid #F3F4F6", paddingTop: 16 }}>
            <button onClick={remove} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, color: "#EF4444", fontSize: 13, fontWeight: 600, background: "#FEF2F2", border: "1px solid #FEE2E2" }}><Trash2 size={13} /> Excluir</button>
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

  const statusColors: Record<string, { bg: string; color: string }> = {
    PLANNING: { bg: "#EDE9FE", color: "#7C3AED" }, IN_PROGRESS: { bg: "#DBEAFE", color: "#1E40AF" },
    COMPLETED: { bg: "#D1FAE5", color: "#065F46" }, ON_HOLD: { bg: "#FEF3C7", color: "#92400E" }, CANCELLED: { bg: "#FEE2E2", color: "#991B1B" },
  };

  return (
    <Modal title={editing ? "Editar projeto" : "Detalhes do projeto"} onClose={onClose}>
      {!project ? (
        <div style={{ textAlign: "center", padding: "28px 0", color: "#9CA3AF", fontSize: 13 }}>Carregando...</div>
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
              <h4 style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{project.name}</h4>
              {(() => { const sc = statusColors[project.status] ?? { bg: "#F3F4F6", color: "#6B7280" }; return <span style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: sc.bg, color: sc.color }}>{projectStatusLabel(project.status)}</span>; })()}
            </div>
            {project.description && <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.7, marginBottom: 16 }}>{project.description}</p>}
            {/* Progress + slider */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Progresso</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{project.progress}%</span>
              </div>
              <div style={{ height: 8, background: "#F3F4F6", borderRadius: 99, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ height: "100%", background: "linear-gradient(90deg,#FBBF24,#F59E0B)", width: `${project.progress}%`, borderRadius: 99, transition: "width 0.3s" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="range" min={0} max={100} value={project.progress}
                  onChange={(e) => updateProgress(parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: "#F59E0B", cursor: "pointer" }}
                />
                <span style={{ fontSize: 12, color: "#6B7280", minWidth: 30, textAlign: "right" }}>{project.progress}%</span>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#6B7280" }}>{project._count.tasks} tarefa{project._count.tasks !== 1 ? "s" : ""} vinculada{project._count.tasks !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: "1px solid #F3F4F6", paddingTop: 16 }}>
            <button onClick={remove} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, color: "#EF4444", fontSize: 13, fontWeight: 600, background: "#FEF2F2", border: "1px solid #FEE2E2" }}><Trash2 size={13} /> Excluir</button>
            <button onClick={() => setEditing(true)} className="btn-secondary" style={{ fontSize: 13, padding: "9px 18px", display: "flex", alignItems: "center", gap: 6 }}><Pencil size={13} /> Editar</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Note Detail Modal ────────────────────────────────────────────────────────

function TagEditorInline({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
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
            <span key={tag} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, padding: "3px 8px", borderRadius: 20, background: "#F3F4F6", color: "#374151", fontWeight: 600 }}>
              #{tag}
              <button onClick={() => onChange(tags.filter((t) => t !== tag))} style={{ all: "unset", cursor: "pointer", color: "#9CA3AF", display: "flex", lineHeight: 1 }}><X size={10} /></button>
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

  return (
    <Modal title={editing ? "Editar anotação" : "Anotação"} onClose={onClose} maxWidth={540}>
      {!note ? (
        <div style={{ textAlign: "center", padding: "28px 0", color: "#9CA3AF", fontSize: 13 }}>Carregando...</div>
      ) : editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Título *"><input className="input-base" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ fontSize: 13.5 }} autoFocus /></Field>
          <Field label="Conteúdo *"><textarea className="input-base" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} style={{ fontSize: 13.5, minHeight: 140, resize: "vertical" }} /></Field>
          <Field label="Cor">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {NOTE_COLORS.map((c) => (
                <button key={c} onClick={() => setForm({ ...form, color: c })} style={{ all: "unset", width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: form.color === c ? "3px solid #374151" : "2px solid rgba(0,0,0,0.1)" }} />
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
          <div style={{ background: note.color ?? "#F8FAFC", borderRadius: 12, padding: "20px 22px", marginBottom: 20 }}>
            <h4 style={{ fontSize: 17, fontWeight: 700, color: "#1F2937", marginBottom: 12 }}>{note.title}</h4>
            <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{note.content}</p>
            {note.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 14 }}>
                {note.tags.map((tag) => (
                  <span key={tag} style={{ fontSize: 12, padding: "3px 8px", borderRadius: 20, background: "rgba(0,0,0,0.09)", color: "#374151", fontWeight: 600 }}>#{tag}</span>
                ))}
              </div>
            )}
            <p style={{ fontSize: 11, color: "rgba(0,0,0,0.3)", marginTop: 14 }}>Atualizada em {new Date(note.updatedAt).toLocaleDateString("pt-BR")}</p>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={remove} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, color: "#EF4444", fontSize: 13, fontWeight: 600, background: "#FEF2F2", border: "1px solid #FEE2E2" }}><Trash2 size={13} /> Excluir</button>
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
              {NOTE_COLORS.map((c) => (<button key={c} onClick={() => setForm({ ...form, color: c })} style={{ all: "unset", width: 26, height: 26, borderRadius: "50%", background: c, cursor: "pointer", border: form.color === c ? "3px solid #374151" : "2px solid rgba(0,0,0,0.1)" }} />))}
            </div>
          </Field>
        </>)}

        {type === "finance" && (<>
          <Field label="Tipo *">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {(["INCOME", "EXPENSE"] as const).map((t) => (
                <button key={t} onClick={() => setForm({ ...form, financeType: t })} style={{ all: "unset", padding: "9px", borderRadius: 9, cursor: "pointer", textAlign: "center", border: `2px solid ${form.financeType === t ? (t === "INCOME" ? "#10B981" : "#EF4444") : "#E5E7EB"}`, background: form.financeType === t ? (t === "INCOME" ? "#D1FAE5" : "#FEE2E2") : "#F9FAFB", fontSize: 13, fontWeight: 600, color: form.financeType === t ? (t === "INCOME" ? "#065F46" : "#991B1B") : "#6B7280" }}>
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
          {!hasFinance && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#FEF3C7", borderRadius: 9, fontSize: 13, color: "#92400E" }}><AlertCircle size={13} /> Este recurso requer o plano Pro.</div>}
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
          <div style={{ width: 36, height: 36, border: "3px solid #F3F4F6", borderTopColor: "#F59E0B", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>Carregando dashboard...</p>
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
    el.style.boxShadow = enter ? "0 8px 24px rgba(0,0,0,0.09)" : "";
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
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-0.01em", marginBottom: 4 }}>
            {greeting}, {firstName} 👋
          </h2>
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {stats && stats.tasksToday > 0 && (
              <> · <strong style={{ color: "#111827" }}>{stats.tasksToday} tarefa{stats.tasksToday > 1 ? "s" : ""}</strong> para hoje</>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {([
            { type: "task" as QuickCreateType, label: "+ Tarefa", bg: "#FEF3C7", color: "#92400E" },
            { type: "project" as QuickCreateType, label: "+ Projeto", bg: "#DBEAFE", color: "#1E40AF" },
            { type: "note" as QuickCreateType, label: "+ Nota", bg: "#EDE9FE", color: "#6D28D9" },
            ...(hasFinance ? [{ type: "finance" as QuickCreateType, label: "+ Lançamento", bg: "#D1FAE5", color: "#065F46" }] : []),
          ]).map(({ type, label, bg, color }) => (
            <button key={type} onClick={() => setQuickCreate(type)} style={{ all: "unset", cursor: "pointer", padding: "7px 14px", borderRadius: 99, background: bg, color, fontSize: 12.5, fontWeight: 700, transition: "opacity 0.15s", userSelect: "none" }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.75"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Row (4 cols) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 14 }}>
        {/* Tasks KPI */}
        <div className="card" style={{ padding: 18, cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
          onClick={() => onNavigate("tasks")}
          onMouseEnter={(e) => kpiHover(e.currentTarget as HTMLDivElement, true)}
          onMouseLeave={(e) => kpiHover(e.currentTarget as HTMLDivElement, false)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FEF3C7", color: "#F59E0B", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={18} /></div>
            <ChevronRight size={14} color="#D1D5DB" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#111827", lineHeight: 1, marginBottom: 4 }}>{stats?.pendingTasks ?? 0}</div>
          <div style={{ fontSize: 12.5, color: "#6B7280" }}>Tarefas pendentes</div>
          {(stats?.tasksToday ?? 0) > 0 && <div style={{ fontSize: 11.5, color: "#F59E0B", marginTop: 3, fontWeight: 600 }}>{stats!.tasksToday} para hoje</div>}
        </div>

        {/* Balance KPI */}
        <div className="card" style={{ padding: 18, cursor: hasFinance ? "pointer" : "default", transition: "transform 0.15s, box-shadow 0.15s" }}
          onClick={() => hasFinance && onNavigate("finance")}
          onMouseEnter={(e) => { if (hasFinance) kpiHover(e.currentTarget as HTMLDivElement, true); }}
          onMouseLeave={(e) => { if (hasFinance) kpiHover(e.currentTarget as HTMLDivElement, false); }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#D1FAE5", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center" }}><Wallet size={18} /></div>
            {hasFinance ? <ChevronRight size={14} color="#D1D5DB" /> : <Lock size={13} color="#D1D5DB" />}
          </div>
          {finance?.available ? (<>
            <div style={{ fontSize: 22, fontWeight: 800, color: (finance.monthlyBalance ?? 0) >= 0 ? "#10B981" : "#EF4444", lineHeight: 1, marginBottom: 4 }}>{fmt(finance.monthlyBalance ?? 0)}</div>
            <div style={{ fontSize: 12.5, color: "#6B7280" }}>Saldo do mês</div>
          </>) : (<>
            <div style={{ fontSize: 13, color: "#D1D5DB", fontWeight: 600, marginBottom: 4 }}>—</div>
            <div style={{ fontSize: 12, color: "#D1D5DB" }}>Plano Pro</div>
          </>)}
        </div>

        {/* Projects KPI */}
        <div className="card" style={{ padding: 18, cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
          onClick={() => onNavigate("projects")}
          onMouseEnter={(e) => kpiHover(e.currentTarget as HTMLDivElement, true)}
          onMouseLeave={(e) => kpiHover(e.currentTarget as HTMLDivElement, false)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#DBEAFE", color: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center" }}><FolderKanban size={18} /></div>
            <ChevronRight size={14} color="#D1D5DB" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#111827", lineHeight: 1, marginBottom: 4 }}>{stats?.activeProjects ?? 0}</div>
          <div style={{ fontSize: 12.5, color: "#6B7280" }}>Projetos ativos</div>
        </div>

        {/* Notes KPI */}
        <div className="card" style={{ padding: 18, cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
          onClick={() => onNavigate("notes")}
          onMouseEnter={(e) => kpiHover(e.currentTarget as HTMLDivElement, true)}
          onMouseLeave={(e) => kpiHover(e.currentTarget as HTMLDivElement, false)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EDE9FE", color: "#8B5CF6", display: "flex", alignItems: "center", justifyContent: "center" }}><StickyNote size={18} /></div>
            <ChevronRight size={14} color="#D1D5DB" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#111827", lineHeight: 1, marginBottom: 4 }}>{stats?.totalNotes ?? 0}</div>
          <div style={{ fontSize: 12.5, color: "#6B7280" }}>Anotações</div>
        </div>
      </div>

      {/* ── Bento: Resizable Split (arraste o handle para redimensionar) ── */}
      <div ref={bentoRef} style={{ display: "flex", alignItems: "stretch", gap: 0 }}>

        {/* ── Coluna esquerda: Tarefas + Notas ── */}
        <div style={{ width: `${leftPct}%`, display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>

          {/* Tarefas */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Tarefas pendentes</h3>
                <p style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 2 }}>✓ para concluir · clique para detalhes</p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => setQuickCreate("task")} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#92400E", padding: "5px 10px", background: "#FEF3C7", borderRadius: 7 }}>
                  <Plus size={11} /> Tarefa
                </button>
                <button onClick={() => onNavigate("tasks")} style={{ all: "unset", cursor: "pointer", fontSize: 12, color: "#6B7280", fontWeight: 500 }}>Ver todas →</button>
              </div>
            </div>
            {recentTasks.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 0", gap: 10 }}>
                <CheckCircle2 size={32} color="#D1D5DB" />
                <p style={{ fontSize: 13.5, color: "#9CA3AF" }}>Nenhuma tarefa pendente 🎉</p>
                <button onClick={() => setQuickCreate("task")} style={{ all: "unset", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#F59E0B", padding: "6px 14px", border: "1.5px dashed #FCD34D", borderRadius: 8 }}>+ Criar primeira tarefa</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {recentTasks.slice(0, 7).map((task) => (
                  <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "#F9FAFB", border: "1px solid #F3F4F6", transition: "background 0.1s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#F0F4FF"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#F9FAFB"; }}
                  >
                    <button onClick={(e) => { e.stopPropagation(); toggleTask(task); }} disabled={toggling === task.id}
                      style={{ all: "unset", cursor: "pointer", flexShrink: 0, width: 20, height: 20, borderRadius: "50%", border: task.status === "COMPLETED" ? "none" : "2px solid #D1D5DB", background: task.status === "COMPLETED" ? "#10B981" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s", opacity: toggling === task.id ? 0.4 : 1 }}>
                      {task.status === "COMPLETED" && <Check size={11} color="#fff" />}
                    </button>
                    <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setSelectedTaskId(task.id)}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: task.status === "COMPLETED" ? "#9CA3AF" : "#1F2937", textDecoration: task.status === "COMPLETED" ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {task.title}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, cursor: "pointer" }} onClick={() => setSelectedTaskId(task.id)}>
                      <span className={`badge ${priorityBadge(task.priority)}`} style={{ fontSize: 10.5 }}>{priorityLabel(task.priority)}</span>
                      {task.dueDate && <span style={{ fontSize: 11, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 3 }}><Clock size={10} />{fmtDate(task.dueDate)}</span>}
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
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Anotações</h3>
                <p style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 2 }}>Clique para abrir · arraste para navegar</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setQuickCreate("note")} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#6D28D9", padding: "5px 10px", background: "#EDE9FE", borderRadius: 7 }}>
                  <Plus size={11} /> Nota
                </button>
                <button onClick={() => onNavigate("notes")} style={{ all: "unset", cursor: "pointer", fontSize: 12, color: "#6B7280", fontWeight: 500 }}>Ver todas →</button>
              </div>
            </div>
            {recentNotes.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 0", gap: 10 }}>
                <StickyNote size={32} color="#D1D5DB" />
                <p style={{ fontSize: 13.5, color: "#9CA3AF" }}>Nenhuma anotação ainda.</p>
                <button onClick={() => setQuickCreate("note")} style={{ all: "unset", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#8B5CF6", padding: "6px 14px", border: "1.5px dashed #C4B5FD", borderRadius: 8 }}>+ Criar primeira nota</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 14, overflowX: "auto", scrollSnapType: "x mandatory", scrollBehavior: "smooth", paddingBottom: 6 }}>
                {recentNotes.map((note) => (
                  <div key={note.id} onClick={() => setSelectedNoteId(note.id)}
                    style={{ flexShrink: 0, width: 220, minHeight: 148, scrollSnapAlign: "start", borderRadius: 14, background: note.color ?? "#F8FAFC", border: "1px solid rgba(0,0,0,0.06)", padding: "16px 16px 12px", cursor: "pointer", position: "relative", transition: "transform 0.15s, box-shadow 0.15s" }}
                    onMouseEnter={(e) => { const d = e.currentTarget as HTMLDivElement; d.style.transform = "translateY(-3px)"; d.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
                    onMouseLeave={(e) => { const d = e.currentTarget as HTMLDivElement; d.style.transform = ""; d.style.boxShadow = ""; }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2937", marginBottom: 7, lineHeight: 1.3, paddingRight: 18 }}>{note.title}</div>
                    <div style={{ fontSize: 12, color: "#4B5563", lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" } as React.CSSProperties}>{note.content}</div>
                    <div style={{ position: "absolute", bottom: 10, right: 12 }}>
                      <Pencil size={10} color="rgba(0,0,0,0.18)" />
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
          <div style={{ width: 2, height: "100%", background: "#F0F0F0", position: "absolute", borderRadius: 99 }} />
          <div
            style={{ position: "relative", zIndex: 1, width: 12, height: 40, background: "#E5E7EB", borderRadius: 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, transition: "background 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#D1D5DB"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#E5E7EB"; }}
          >
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 2, height: 2, borderRadius: "50%", background: "#9CA3AF" }} />
            ))}
          </div>
        </div>

        {/* ── Coluna direita: Financeiro + Projetos ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>

          {/* Financeiro */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Financeiro</h3>
              {hasFinance && <button onClick={() => onNavigate("finance")} style={{ all: "unset", cursor: "pointer", fontSize: 12, color: "#6B7280", fontWeight: 500 }}>Ver →</button>}
            </div>
            {!finance?.available ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <Lock size={28} color="#E5E7EB" style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 12.5, color: "#9CA3AF", marginBottom: 6 }}>Disponível no plano Pro</p>
                <button onClick={() => onNavigate("settings")} style={{ all: "unset", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#F59E0B" }}>Ver planos →</button>
              </div>
            ) : (<>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div style={{ padding: "10px", background: "#F0FDF4", borderRadius: 9, textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, marginBottom: 3 }}>
                    <ArrowUpRight size={11} color="#10B981" /><span style={{ fontSize: 10, fontWeight: 600, color: "#10B981" }}>Entradas</span>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: "#10B981" }}>{fmt(finance.monthlyIncome ?? 0)}</div>
                </div>
                <div style={{ padding: "10px", background: "#FFF5F5", borderRadius: 9, textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, marginBottom: 3 }}>
                    <ArrowDownRight size={11} color="#EF4444" /><span style={{ fontSize: 10, fontWeight: 600, color: "#EF4444" }}>Saídas</span>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: "#EF4444" }}>{fmt(finance.monthlyExpense ?? 0)}</div>
                </div>
              </div>
              <div style={{ padding: "8px 10px", background: (finance.monthlyBalance ?? 0) >= 0 ? "#F0FDF4" : "#FFF5F5", borderRadius: 9, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><TrendingUp size={11} /> Saldo</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: (finance.monthlyBalance ?? 0) >= 0 ? "#10B981" : "#EF4444" }}>{fmt(finance.monthlyBalance ?? 0)}</span>
              </div>
              {finance.months && <FinanceChart months={finance.months} />}
            </>)}
          </div>

          {/* Projetos */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Projetos</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setQuickCreate("project")} style={{ all: "unset", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#1E40AF", padding: "4px 8px", background: "#DBEAFE", borderRadius: 6 }}><Plus size={10} style={{ display: "inline", marginRight: 2 }} />Novo</button>
                <button onClick={() => onNavigate("projects")} style={{ all: "unset", cursor: "pointer", fontSize: 12, color: "#6B7280", fontWeight: 500 }}>Ver →</button>
              </div>
            </div>
            {activeProjects.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 0", gap: 10 }}>
                <FolderKanban size={32} color="#D1D5DB" />
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>Nenhum projeto ativo</p>
                <button onClick={() => setQuickCreate("project")} style={{ all: "unset", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#3B82F6", padding: "6px 14px", border: "1.5px dashed #BFDBFE", borderRadius: 8 }}>+ Criar projeto</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {activeProjects.slice(0, 5).map((p) => (
                  <div key={p.id} onClick={() => setSelectedProjectId(p.id)}
                    style={{ padding: "10px 12px", background: "#F9FAFB", borderRadius: 9, border: "1px solid #F3F4F6", cursor: "pointer", transition: "background 0.1s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#F0F4FF"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#F9FAFB"; }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", flexShrink: 0, marginLeft: 8 }}>{p.progress}%</span>
                    </div>
                    <div style={{ height: 4, background: "#E5E7EB", borderRadius: 99 }}>
                      <div style={{ height: "100%", background: "linear-gradient(90deg,#FBBF24,#F59E0B)", width: `${p.progress}%`, borderRadius: 99, transition: "width 0.5s" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>{/* end coluna direita */}

      </div>{/* end bento */}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
