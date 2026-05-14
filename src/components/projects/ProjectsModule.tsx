"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, FolderKanban, Pencil, Trash2, X, Check, Clock,
  AlertCircle, ChevronRight, Calendar, CheckCircle2,
  Circle, Loader2, ArrowRight,
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { useDark } from "@/contexts/ThemeContext";

// ── Types ─────────────────────────────────────────────────────────────────────

type UserPlan = "FREE" | "PRO" | "BUSINESS";
interface AppUser {
  id: string; name: string; email: string; plan: UserPlan;
  planLabel: string;
  planLimits: { tasks: number; projects: number; notes: number; categories: number };
}

type ProjectStatus = "PLANNING" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" | "CANCELLED";
type TaskStatus    = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type TaskPriority  = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface ProjectTask {
  id: string; title: string; description?: string;
  status: TaskStatus; priority: TaskPriority;
  dueDate: string | null; completedAt: string | null;
  category: { id: string; name: string; color: string } | null;
}

interface Project {
  id: string; name: string; description?: string;
  status: ProjectStatus; progress: number;
  startDate: string | null; dueDate: string | null;
  completedTaskCount: number;
  _count: { tasks: number };
  tasks?: ProjectTask[];
  createdAt: string; updatedAt: string;
}

interface ProjectForm {
  name: string; description: string; status: string;
  startDate: string; dueDate: string;
}

interface TaskQuickForm {
  title: string; priority: TaskPriority; dueDate: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function fmtDateFull(d: string | Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function toDateInput(d: string | null | undefined) {
  if (!d) return "";
  return new Date(d).toISOString().substring(0, 10);
}

function toIso(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toISOString();
}

function isOverdue(dueDate: string | null, status: string) {
  if (!dueDate || status === "COMPLETED" || status === "CANCELLED") return false;
  return new Date(dueDate) < new Date();
}

function computedProgress(project: Project): number {
  const total = project._count.tasks;
  if (total === 0) return project.progress;
  return Math.round((project.completedTaskCount / total) * 100);
}

const STATUS_CFG: Record<ProjectStatus, { label: string; bg: string; color: string }> = {
  PLANNING:    { label: "Planejamento", bg: "#EDE9FE", color: "#7C3AED" },
  IN_PROGRESS: { label: "Em andamento", bg: "#DBEAFE", color: "#1E40AF" },
  COMPLETED:   { label: "Concluído",    bg: "#D1FAE5", color: "#065F46" },
  ON_HOLD:     { label: "Em pausa",     bg: "#FEF3C7", color: "#92400E" },
  CANCELLED:   { label: "Cancelado",    bg: "#FEE2E2", color: "#991B1B" },
};

const PRIORITY_CFG: Record<TaskPriority, { label: string; color: string }> = {
  LOW:    { label: "Baixa",   color: "#6B7280" },
  MEDIUM: { label: "Média",   color: "#D97706" },
  HIGH:   { label: "Alta",    color: "#EF4444" },
  URGENT: { label: "Urgente", color: "#DC2626" },
};

const TASK_STATUS_ORDER: TaskStatus[] = ["IN_PROGRESS", "PENDING", "COMPLETED", "CANCELLED"];

// ── Shared UI ─────────────────────────────────────────────────────────────────

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
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: surface, borderRadius: 14, padding: 24,
        width: "100%", maxWidth: wide ? 520 : 460,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)", maxHeight: "90vh", overflowY: "auto",
        border: dark ? `1px solid ${bord}` : "none",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: txt }}>{title}</h3>
          <button onClick={onClose} style={{ all: "unset", cursor: "pointer", color: txtMuted }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { dark } = useDark();
  const txt2 = dark ? "#CDD5E0" : "#374151";
  return (
    <div>
      <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: txt2, marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Project Form Modal ────────────────────────────────────────────────────────

function ProjectFormModal({
  editing, onClose, onSaved,
}: {
  editing: Project | null;
  onClose: () => void;
  onSaved: (p: Project) => void;
}) {
  const [form, setForm] = useState<ProjectForm>(() => editing ? {
    name: editing.name,
    description: editing.description ?? "",
    status: editing.status,
    startDate: toDateInput(editing.startDate),
    dueDate: toDateInput(editing.dueDate),
  } : {
    name: "", description: "", status: "PLANNING", startDate: "", dueDate: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setSaving(true); setErr("");
    try {
      const body = {
        name: form.name.trim(),
        description: form.description || undefined,
        status: form.status,
        startDate: form.startDate ? toIso(form.startDate) : (editing ? null : undefined),
        dueDate: form.dueDate ? toIso(form.dueDate) : (editing ? null : undefined),
      };
      const url = editing ? `/api/projects/${editing.id}` : "/api/projects";
      const method = editing ? "PUT" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const text = await r.text();
      let d: Record<string, unknown> = {};
      try { d = text ? JSON.parse(text) : {}; } catch { /* */ }
      if (!r.ok) { setErr((d.error as string) ?? "Erro ao salvar."); return; }
      onSaved(d.project as Project);
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <Modal title={editing ? "Editar projeto" : "Novo projeto"} onClose={onClose} wide>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Nome *">
          <input className="input-base" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nome do projeto" style={{ fontSize: 13.5 }}
            onKeyDown={(e) => { if (e.key === "Enter") save(); }}
          />
        </Field>
        <Field label="Descrição">
          <textarea className="input-base" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Descrição opcional" style={{ fontSize: 13.5, minHeight: 72, resize: "vertical" }}
          />
        </Field>
        <Field label="Status">
          <select className="input-base" value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ fontSize: 13.5 }}>
            <option value="PLANNING">Planejamento</option>
            <option value="IN_PROGRESS">Em andamento</option>
            <option value="COMPLETED">Concluído</option>
            <option value="ON_HOLD">Em pausa</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Data de início">
            <input type="date" className="input-base" value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={{ fontSize: 13.5 }} />
          </Field>
          <Field label="Data de entrega">
            <input type="date" className="input-base" value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={{ fontSize: 13.5 }} />
          </Field>
        </div>
        {err && <p style={{ fontSize: 13, color: "#EF4444" }}>{err}</p>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn-secondary" style={{ fontSize: 13, padding: "9px 18px" }}>Cancelar</button>
          <button onClick={save} disabled={saving} className="btn-primary" style={{ fontSize: 13, padding: "9px 18px" }}>
            {saving ? "Salvando..." : editing ? "Salvar" : "Criar projeto"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Task Row (inside drawer) ──────────────────────────────────────────────────

function TaskRow({
  task, onToggle, onEdit, onDelete,
}: {
  task: ProjectTask;
  onToggle: (t: ProjectTask) => void;
  onEdit: (t: ProjectTask) => void;
  onDelete: (id: string) => void;
}) {
  const { dark } = useDark();
  const txt      = dark ? "#E6EDF3" : "#111827";
  const txtFaint = dark ? "#8B949E" : "#9CA3AF";
  const rowBg    = dark ? (task.status === "COMPLETED" ? "#21262D" : "#1C2128") : (task.status === "COMPLETED" ? "#F9FAFB" : "#fff");
  const rowBord  = dark ? "#30363D" : "#E5E7EB";

  const done = task.status === "COMPLETED";
  const overdue = !done && task.dueDate && new Date(task.dueDate) < new Date();
  const pCfg = PRIORITY_CFG[task.priority];

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 12px", borderRadius: 10,
      background: rowBg, border: `1.5px solid ${rowBord}`,
      transition: "box-shadow 0.12s",
    }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = dark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.07)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "")}
    >
      {/* Checkbox */}
      <button onClick={() => onToggle(task)} style={{
        all: "unset", width: 20, height: 20, borderRadius: "50%", flexShrink: 0, cursor: "pointer",
        border: done ? "none" : `2px solid ${dark ? "#6E7681" : "#D1D5DB"}`,
        background: done ? "#10B981" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {done && <Check size={11} color="#fff" />}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13.5, fontWeight: 600,
          color: done ? txtFaint : txt,
          textDecoration: done ? "line-through" : "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {task.title}
        </div>
        {task.dueDate && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2, fontSize: 11, color: overdue ? "#EF4444" : txtFaint }}>
            <Clock size={10} />{fmtDate(task.dueDate)}
            {overdue && " · Atrasada"}
          </div>
        )}
      </div>

      {/* Priority dot */}
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: pCfg.color, flexShrink: 0 }} title={pCfg.label} />

      {/* Actions */}
      <button onClick={() => onEdit(task)} style={{ all: "unset", cursor: "pointer", color: txtFaint, display: "flex", padding: "2px" }}>
        <Pencil size={13} />
      </button>
      <button onClick={() => onDelete(task.id)} style={{ all: "unset", cursor: "pointer", color: "#EF4444", display: "flex", padding: "2px" }}>
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ── Task Edit Modal (inside drawer) ──────────────────────────────────────────

function TaskEditModal({
  task, projectId, onClose, onSaved,
}: {
  task: ProjectTask | null;
  projectId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(() => task ? {
    title: task.title,
    description: task.description ?? "",
    priority: task.priority,
    status: task.status,
    dueDate: toDateInput(task.dueDate),
  } : {
    title: "", description: "", priority: "MEDIUM" as TaskPriority, status: "PENDING" as TaskStatus, dueDate: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setSaving(true); setErr("");
    try {
      const body = {
        title: form.title.trim(),
        description: form.description || undefined,
        priority: form.priority,
        status: task ? form.status : undefined,
        dueDate: form.dueDate ? new Date(form.dueDate + "T12:00:00").toISOString() : undefined,
        projectId: projectId,
      };
      const url = task ? `/api/tasks/${task.id}` : "/api/tasks";
      const method = task ? "PUT" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const text = await r.text();
      let d: Record<string, unknown> = {};
      try { d = text ? JSON.parse(text) : {}; } catch { /* */ }
      if (!r.ok) { setErr((d.error as string) ?? "Erro ao salvar."); return; }
      onSaved(); onClose();
    } finally { setSaving(false); }
  };

  return (
    <Modal title={task ? "Editar tarefa" : "Nova tarefa"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Título *">
          <input className="input-base" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="O que precisa ser feito?" style={{ fontSize: 13.5 }}
            onKeyDown={(e) => { if (e.key === "Enter") save(); }}
          />
        </Field>
        <Field label="Descrição">
          <textarea className="input-base" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Detalhes opcionais..." style={{ fontSize: 13.5, minHeight: 64, resize: "vertical" }}
          />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Prioridade">
            <select className="input-base" value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })} style={{ fontSize: 13.5 }}>
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </select>
          </Field>
          <Field label="Prazo">
            <input type="date" className="input-base" value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={{ fontSize: 13.5 }} />
          </Field>
        </div>
        {task && (
          <Field label="Status">
            <select className="input-base" value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })} style={{ fontSize: 13.5 }}>
              <option value="PENDING">Pendente</option>
              <option value="IN_PROGRESS">Em andamento</option>
              <option value="COMPLETED">Concluída</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </Field>
        )}
        {err && <p style={{ fontSize: 13, color: "#EF4444" }}>{err}</p>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn-secondary" style={{ fontSize: 13, padding: "9px 18px" }}>Cancelar</button>
          <button onClick={save} disabled={saving} className="btn-primary" style={{ fontSize: 13, padding: "9px 18px" }}>
            {saving ? "Salvando..." : task ? "Salvar" : "Criar tarefa"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Project Drawer ────────────────────────────────────────────────────────────

function ProjectDrawer({
  projectId, onClose, onProjectUpdated, onProjectDeleted,
}: {
  projectId: string;
  onClose: () => void;
  onProjectUpdated: (p: Project) => void;
  onProjectDeleted: (id: string) => void;
}) {
  const { dark } = useDark();
  const txt      = dark ? "#E6EDF3" : "#111827";
  const txt2     = dark ? "#CDD5E0" : "#374151";
  const txtMuted = dark ? "#8D96A0" : "#6B7280";
  const txtFaint = dark ? "#8B949E" : "#9CA3AF";
  const surface  = dark ? "#1C2128" : "#fff";
  const surfSec  = dark ? "#21262D" : "#F9FAFB";
  const bord     = dark ? "#30363D" : "#F3F4F6";
  const bord2    = dark ? "#30363D" : "#E5E7EB";

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [editProject, setEditProject] = useState(false);
  const [taskModal, setTaskModal] = useState<{ open: boolean; task: ProjectTask | null }>({ open: false, task: null });
  const [quickTitle, setQuickTitle] = useState("");
  const [quickPriority, setQuickPriority] = useState<TaskPriority>("MEDIUM");
  const [addingQuick, setAddingQuick] = useState(false);
  const [showQuickForm, setShowQuickForm] = useState(false);
  const quickInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/projects/${projectId}`);
      if (r.ok) {
        const d = await r.json();
        setProject(d.project);
      }
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (showQuickForm) setTimeout(() => quickInputRef.current?.focus(), 50);
  }, [showQuickForm]);

  const toggleTask = async (t: ProjectTask) => {
    const newStatus: TaskStatus = t.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    await fetch(`/api/tasks/${t.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Excluir esta tarefa?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    load();
  };

  const addQuick = async () => {
    if (!quickTitle.trim()) return;
    setAddingQuick(true);
    try {
      await fetch("/api/tasks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: quickTitle.trim(), priority: quickPriority, projectId }),
      });
      setQuickTitle(""); setShowQuickForm(false);
      load();
    } finally { setAddingQuick(false); }
  };

  const deleteProject = async () => {
    if (!project) return;
    if (!confirm(`Excluir o projeto "${project.name}"? As tarefas perderão a referência.`)) return;
    await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    onProjectDeleted(projectId);
    onClose();
  };

  const progress = project ? computedProgress(project) : 0;
  const overdue = project ? isOverdue(project.dueDate, project.status) : false;

  const tasks = project?.tasks ?? [];
  const sortedTasks = [...tasks].sort((a, b) => {
    return TASK_STATUS_ORDER.indexOf(a.status) - TASK_STATUS_ORDER.indexOf(b.status);
  });
  const activeTasks    = sortedTasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED");
  const doneTasks      = sortedTasks.filter((t) => t.status === "COMPLETED");
  const cancelledTasks = sortedTasks.filter((t) => t.status === "CANCELLED");

  return (
    <>
      {/* Overlay */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201,
        width: "min(700px, 100vw)",
        background: surface,
        boxShadow: dark ? "-8px 0 40px rgba(0,0,0,0.5)" : "-8px 0 40px rgba(0,0,0,0.15)",
        overflowY: "auto",
        display: "flex", flexDirection: "column",
        borderLeft: dark ? `1px solid ${bord2}` : "none",
      }}>

        {loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Loader2 size={28} color={dark ? "#30363D" : "#D1D5DB"} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : !project ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontSize: 14, color: txtFaint }}>Projeto não encontrado.</p>
          </div>
        ) : (
          <>
            {/* ── Header ─────────────────────────────────────────────── */}
            <div style={{ padding: "20px 24px 20px", borderBottom: `1px solid ${bord}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    {(() => {
                      const sc = STATUS_CFG[project.status];
                      return (
                        <span style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: sc.bg, color: sc.color, flexShrink: 0 }}>
                          {sc.label}
                        </span>
                      );
                    })()}
                    {overdue && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999, background: "#FEE2E2", color: "#991B1B", flexShrink: 0 }}>
                        Atrasado
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: txt, lineHeight: 1.2, marginBottom: 8 }}>
                    {project.name}
                  </h2>
                  {/* Datas */}
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {project.startDate && (
                      <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: txtMuted }}>
                        <Calendar size={13} /> Início: {fmtDateFull(project.startDate)}
                      </span>
                    )}
                    {project.dueDate && (
                      <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: overdue ? "#EF4444" : txtMuted, fontWeight: overdue ? 600 : 400 }}>
                        <Calendar size={13} /> Entrega: {fmtDateFull(project.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => setEditProject(true)} style={{
                    all: "unset", cursor: "pointer", padding: "7px 12px", borderRadius: 8,
                    background: surfSec, color: txt2, fontSize: 13, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 5,
                    border: dark ? `1px solid ${bord2}` : "none",
                  }}>
                    <Pencil size={13} /> Editar
                  </button>
                  <button onClick={deleteProject} style={{
                    all: "unset", cursor: "pointer", padding: "7px 10px", borderRadius: 8,
                    background: "#FEE2E2", color: "#EF4444", display: "flex", alignItems: "center",
                  }}>
                    <Trash2 size={14} />
                  </button>
                  <button onClick={onClose} style={{
                    all: "unset", cursor: "pointer", padding: "7px 10px", borderRadius: 8,
                    background: surfSec, color: txt2, display: "flex", alignItems: "center",
                    border: dark ? `1px solid ${bord2}` : "none",
                  }}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, color: txtMuted, fontWeight: 500 }}>
                    Progresso — {project.completedTaskCount} de {project._count.tasks} tarefa{project._count.tasks !== 1 ? "s" : ""} concluída{project.completedTaskCount !== 1 ? "s" : ""}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: txt2 }}>{progress}%</span>
                </div>
                <div style={{ height: 7, background: dark ? "#30363D" : "#E5E7EB", borderRadius: 99 }}>
                  <div style={{
                    height: "100%", borderRadius: 99,
                    background: progress === 100 ? "#10B981" : "linear-gradient(90deg,#6366F1,#8B5CF6)",
                    width: `${progress}%`, transition: "width 0.5s",
                  }} />
                </div>
              </div>
            </div>

            {/* ── Description ────────────────────────────────────────── */}
            {project.description && (
              <div style={{ padding: "16px 24px", borderBottom: `1px solid ${bord}` }}>
                <p style={{ fontSize: 13.5, color: txt2, lineHeight: 1.6, margin: 0 }}>{project.description}</p>
              </div>
            )}

            {/* ── Tasks Section ───────────────────────────────────────── */}
            <div style={{ padding: "20px 24px", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: txt }}>
                  Tarefas ({project._count.tasks})
                </h3>
                <button onClick={() => { setShowQuickForm(true); }}
                  style={{
                    all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                    fontSize: 13, fontWeight: 600, color: "#6366F1",
                    padding: "5px 12px", borderRadius: 8, background: dark ? "#1A1D3A" : "#EEF2FF",
                  }}>
                  <Plus size={14} /> Adicionar
                </button>
              </div>

              {/* Quick add form */}
              {showQuickForm && (
                <div style={{
                  display: "flex", gap: 8, alignItems: "center", marginBottom: 12,
                  padding: "10px 12px", borderRadius: 10,
                  border: "1.5px solid #6366F1",
                  background: dark ? "#1A1A2E" : "#F5F3FF",
                }}>
                  <input ref={quickInputRef}
                    className="input-base" placeholder="Título da tarefa..."
                    value={quickTitle} onChange={(e) => setQuickTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addQuick();
                      if (e.key === "Escape") { setShowQuickForm(false); setQuickTitle(""); }
                    }}
                    style={{ fontSize: 13.5, flex: 1, border: "none", background: "transparent", padding: 0 }}
                  />
                  <select value={quickPriority} onChange={(e) => setQuickPriority(e.target.value as TaskPriority)}
                    style={{ fontSize: 12, border: `1.5px solid ${bord2}`, borderRadius: 7, padding: "4px 6px", background: surface, fontFamily: "DM Sans, sans-serif", color: txt2 }}>
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                  <button onClick={addQuick} disabled={addingQuick || !quickTitle.trim()}
                    style={{ all: "unset", cursor: "pointer", padding: "5px 10px", borderRadius: 7, background: "#6366F1", color: "#fff", fontSize: 12.5, fontWeight: 600, opacity: !quickTitle.trim() ? 0.5 : 1 }}>
                    {addingQuick ? "..." : "Criar"}
                  </button>
                  <button onClick={() => { setShowQuickForm(false); setQuickTitle(""); }}
                    style={{ all: "unset", cursor: "pointer", color: txtFaint, display: "flex" }}>
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Open full task form */}
              {showQuickForm && (
                <button onClick={() => { setShowQuickForm(false); setTaskModal({ open: true, task: null }); }}
                  style={{ all: "unset", cursor: "pointer", fontSize: 12.5, color: "#6366F1", marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
                  <ArrowRight size={12} /> Formulário completo
                </button>
              )}

              {/* Empty state */}
              {tasks.length === 0 && !showQuickForm && (
                <div style={{ textAlign: "center", padding: "36px 0" }}>
                  <CheckCircle2 size={36} color={dark ? "#30363D" : "#E5E7EB"} style={{ marginBottom: 10 }} />
                  <p style={{ fontSize: 13.5, color: txtFaint, marginBottom: 12 }}>Nenhuma tarefa neste projeto.</p>
                  <button onClick={() => setShowQuickForm(true)} style={{
                    all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "9px 16px", borderRadius: 9, background: "#6366F1", color: "#fff", fontSize: 13, fontWeight: 600,
                  }}>
                    <Plus size={14} /> Criar primeira tarefa
                  </button>
                </div>
              )}

              {/* Active tasks */}
              {activeTasks.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
                  {activeTasks.map((t) => (
                    <TaskRow key={t.id} task={t}
                      onToggle={toggleTask}
                      onEdit={(task) => setTaskModal({ open: true, task })}
                      onDelete={deleteTask}
                    />
                  ))}
                </div>
              )}

              {/* Completed tasks */}
              {doneTasks.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: txtFaint, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                    Concluídas ({doneTasks.length})
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {doneTasks.map((t) => (
                      <TaskRow key={t.id} task={t}
                        onToggle={toggleTask}
                        onEdit={(task) => setTaskModal({ open: true, task })}
                        onDelete={deleteTask}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Cancelled tasks */}
              {cancelledTasks.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: txtFaint, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                    Canceladas ({cancelledTasks.length})
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {cancelledTasks.map((t) => (
                      <TaskRow key={t.id} task={t}
                        onToggle={toggleTask}
                        onEdit={(task) => setTaskModal({ open: true, task })}
                        onDelete={deleteTask}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Edit Project Modal (on top of drawer) */}
      {editProject && project && (
        <ProjectFormModal
          editing={project}
          onClose={() => setEditProject(false)}
          onSaved={(updated) => {
            setProject({ ...updated, tasks: project.tasks });
            onProjectUpdated(updated);
            setEditProject(false);
          }}
        />
      )}

      {/* Task Modal */}
      {taskModal.open && (
        <TaskEditModal
          task={taskModal.task}
          projectId={projectId}
          onClose={() => setTaskModal({ open: false, task: null })}
          onSaved={load}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

// ── Project Card ──────────────────────────────────────────────────────────────

function ProjectCard({ project, onOpen, onEdit, onDelete }: {
  project: Project;
  onOpen: (p: Project) => void;
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
}) {
  const { dark } = useDark();
  const txt      = dark ? "#E6EDF3" : "#111827";
  const txt2     = dark ? "#CDD5E0" : "#374151";
  const txtMuted = dark ? "#8D96A0" : "#6B7280";
  const txtFaint = dark ? "#8B949E" : "#9CA3AF";

  const sc = STATUS_CFG[project.status] ?? STATUS_CFG.PLANNING;
  const progress = computedProgress(project);
  const overdue = isOverdue(project.dueDate, project.status);
  const total = project._count.tasks;
  const done = project.completedTaskCount;

  return (
    <div
      className="card"
      onClick={() => onOpen(project)}
      style={{
        padding: 20, cursor: "pointer", display: "flex", flexDirection: "column", gap: 12,
        transition: "box-shadow 0.15s, transform 0.1s",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = dark ? "0 8px 24px rgba(0,0,0,0.4)" : "0 8px 24px rgba(0,0,0,0.1)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "";
        e.currentTarget.style.transform = "";
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: sc.bg, color: sc.color }}>
              {sc.label}
            </span>
            {overdue && (
              <span style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 7px", borderRadius: 999, background: "#FEE2E2", color: "#EF4444" }}>
                Atrasado
              </span>
            )}
          </div>
          <h3 style={{ fontSize: 14.5, fontWeight: 700, color: txt, lineHeight: 1.3, marginBottom: 2 }}>
            {project.name}
          </h3>
        </div>
        {/* Edit/Delete buttons — stop propagation to not open drawer */}
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onEdit(project)} style={{ all: "unset", cursor: "pointer", color: txtFaint, padding: "4px" }}>
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(project.id)} style={{ all: "unset", cursor: "pointer", color: "#EF4444", padding: "4px" }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <p style={{ fontSize: 12.5, color: txtMuted, lineHeight: 1.5, margin: 0,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {project.description}
        </p>
      )}

      {/* Progress */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 12, color: txtMuted }}>
            {total === 0 ? "Sem tarefas" : `${done}/${total} concluída${done !== 1 ? "s" : ""}`}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: txt2 }}>{progress}%</span>
        </div>
        <div style={{ height: 5, background: dark ? "#30363D" : "#E5E7EB", borderRadius: 99 }}>
          <div style={{
            height: "100%", borderRadius: 99,
            background: progress === 100 ? "#10B981" : "linear-gradient(90deg,#6366F1,#8B5CF6)",
            width: `${progress}%`, transition: "width 0.5s",
          }} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 10 }}>
          {project.dueDate && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: overdue ? "#EF4444" : txtFaint, fontWeight: overdue ? 600 : 400 }}>
              <Calendar size={11} /> {fmtDate(project.dueDate)}
            </span>
          )}
        </div>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: txtFaint }}>
          Ver detalhes <ChevronRight size={13} />
        </span>
      </div>
    </div>
  );
}

// ── Main Module ───────────────────────────────────────────────────────────────

export default function ProjectsModule({ user }: { user: AppUser | null }) {
  const { dark } = useDark();
  const txt      = dark ? "#E6EDF3" : "#111827";
  const txtMuted = dark ? "#8D96A0" : "#6B7280";
  const bgSec    = dark ? "#21262D" : "#F3F4F6";

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerProjectId, setDrawerProjectId] = useState<string | null>(null);
  const [formModal, setFormModal] = useState<{ open: boolean; editing: Project | null }>({ open: false, editing: null });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/projects");
      if (r.ok) { const d = await r.json(); setProjects(d.projects); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => setFormModal({ open: true, editing: null });
  const openEdit = (p: Project) => { setFormModal({ open: true, editing: p }); };

  const remove = async (id: string) => {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    if (!confirm(`Excluir "${p.name}"? As tarefas vinculadas perderão a referência.`)) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setProjects((prev) => prev.filter((x) => x.id !== id));
  };

  const handleSaved = (saved: Project) => {
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...prev[idx], ...saved };
        return next;
      }
      return [{ ...saved }, ...prev];
    });
  };

  const planLimit = user ? PLANS[user.plan as keyof typeof PLANS].limits.projects : 0;
  const atLimit = user && projects.length >= planLimit;

  return (
    <div style={{ padding: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: txt }}>Projetos</h2>
          <p style={{ fontSize: 13, color: txtMuted, marginTop: 2 }}>
            {projects.length} projeto{projects.length !== 1 ? "s" : ""} · limite: {planLimit}
          </p>
        </div>
        <button onClick={openCreate} disabled={!!atLimit} className="btn-primary"
          style={{ fontSize: 13, padding: "9px 18px", display: "flex", alignItems: "center", gap: 6, opacity: atLimit ? 0.5 : 1 }}>
          <Plus size={14} /> Novo projeto
        </button>
      </div>

      {atLimit && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: dark ? "#2D2008" : "#FEF3C7", borderRadius: 9, marginBottom: 14, fontSize: 13, color: dark ? "#F59E0B" : "#92400E" }}>
          <AlertCircle size={14} /> Limite do plano atingido. Faça upgrade para criar mais projetos.
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 140, borderRadius: 12, background: bgSec, animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 0" }}>
          <FolderKanban size={44} color={dark ? "#30363D" : "#E5E7EB"} style={{ marginBottom: 14 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: dark ? "#CDD5E0" : "#374151", marginBottom: 6 }}>Nenhum projeto ainda</p>
          <p style={{ fontSize: 13.5, color: dark ? "#8B949E" : "#9CA3AF", marginBottom: 20 }}>
            Crie um projeto para organizar suas tarefas por objetivo.
          </p>
          <button onClick={openCreate} className="btn-primary"
            style={{ fontSize: 13, padding: "10px 20px", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Plus size={14} /> Criar primeiro projeto
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p}
              onOpen={(proj) => setDrawerProjectId(proj.id)}
              onEdit={openEdit}
              onDelete={remove}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {formModal.open && (
        <ProjectFormModal
          editing={formModal.editing}
          onClose={() => setFormModal({ open: false, editing: null })}
          onSaved={(saved) => { handleSaved(saved); setFormModal({ open: false, editing: null }); }}
        />
      )}

      {/* Project Drawer */}
      {drawerProjectId && (
        <ProjectDrawer
          projectId={drawerProjectId}
          onClose={() => setDrawerProjectId(null)}
          onProjectUpdated={handleSaved}
          onProjectDeleted={(id) => {
            setProjects((prev) => prev.filter((p) => p.id !== id));
            setDrawerProjectId(null);
          }}
        />
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
