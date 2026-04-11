"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, CheckCircle2, Pencil, Trash2, X, Check, Clock,
  AlertCircle, FolderKanban,
} from "lucide-react";
import { PLANS } from "@/lib/plans";

// ── Types ─────────────────────────────────────────────────────────────────────

type UserPlan = "FREE" | "PRO" | "BUSINESS";
interface AppUser {
  id: string; name: string; email: string; plan: UserPlan;
  planLabel: string;
  planLimits: { tasks: number; projects: number; notes: number; categories: number };
}

type TaskStatus   = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface Task {
  id: string; title: string; description?: string;
  status: TaskStatus; priority: TaskPriority;
  dueDate: string | null; completedAt: string | null;
  category: { id: string; name: string; color: string } | null;
  project: { id: string; name: string } | null;
}

interface ProjectOption {
  id: string; name: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

const PRIORITY_CFG: Record<TaskPriority, { label: string; badgeBg: string; badgeColor: string }> = {
  LOW:    { label: "Baixa",   badgeBg: "#F3F4F6", badgeColor: "#6B7280" },
  MEDIUM: { label: "Média",   badgeBg: "#FEF3C7", badgeColor: "#92400E" },
  HIGH:   { label: "Alta",    badgeBg: "#FEE2E2", badgeColor: "#991B1B" },
  URGENT: { label: "Urgente", badgeBg: "#FEE2E2", badgeColor: "#7F1D1D" },
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente", IN_PROGRESS: "Em andamento", COMPLETED: "Concluída", CANCELLED: "Cancelada",
};

function isOverdue(dueDate: string | null, status: string) {
  if (!dueDate || status === "COMPLETED" || status === "CANCELLED") return false;
  return new Date(dueDate) < new Date();
}

// ── Modal & Field ─────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.35)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "#fff", borderRadius: 14, padding: 24, width: "100%", maxWidth: 480,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{title}</h3>
          <button onClick={onClose} style={{ all: "unset", cursor: "pointer", color: "#6B7280" }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Task Form Modal ───────────────────────────────────────────────────────────

function TaskFormModal({
  editing, projects, defaultProjectId, onClose, onSaved,
}: {
  editing: Task | null;
  projects: ProjectOption[];
  defaultProjectId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(() => editing ? {
    title: editing.title,
    description: editing.description ?? "",
    priority: editing.priority,
    status: editing.status,
    dueDate: editing.dueDate ? editing.dueDate.substring(0, 10) : "",
    projectId: editing.project?.id ?? "",
  } : {
    title: "", description: "", priority: "MEDIUM" as TaskPriority,
    status: "PENDING" as TaskStatus, dueDate: "",
    projectId: defaultProjectId ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setSaving(true); setErr("");
    try {
      const body: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description || undefined,
        priority: form.priority,
        dueDate: form.dueDate ? new Date(form.dueDate + "T12:00:00").toISOString() : undefined,
        projectId: form.projectId || null,
      };
      if (editing) body.status = form.status;

      const url = editing ? `/api/tasks/${editing.id}` : "/api/tasks";
      const method = editing ? "PUT" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const text = await r.text();
      let d: Record<string, unknown> = {};
      try { d = text ? JSON.parse(text) : {}; } catch { /* */ }
      if (!r.ok) { setErr((d.error as string) ?? "Erro ao salvar."); return; }
      onSaved(); onClose();
    } finally { setSaving(false); }
  };

  return (
    <Modal title={editing ? "Editar tarefa" : "Nova tarefa"} onClose={onClose}>
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
            placeholder="Detalhes opcionais..." style={{ fontSize: 13.5, minHeight: 72, resize: "vertical" }}
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
        <Field label="Projeto">
          <select className="input-base" value={form.projectId}
            onChange={(e) => setForm({ ...form, projectId: e.target.value })} style={{ fontSize: 13.5 }}>
            <option value="">Nenhum projeto</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
        {editing && (
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
          <button onClick={save} disabled={saving || !form.title.trim()} className="btn-primary"
            style={{ fontSize: 13, padding: "9px 18px", opacity: !form.title.trim() ? 0.6 : 1 }}>
            {saving ? "Salvando..." : editing ? "Salvar" : "Criar tarefa"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Task Row ──────────────────────────────────────────────────────────────────

function TaskRow({ task, onToggle, onEdit, onDelete }: {
  task: Task;
  onToggle: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const done = task.status === "COMPLETED";
  const overdue = isOverdue(task.dueDate, task.status);
  const pCfg = PRIORITY_CFG[task.priority];

  return (
    <div className="card" style={{
      padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
      opacity: task.status === "CANCELLED" ? 0.6 : 1,
    }}>
      {/* Checkbox */}
      <button onClick={() => onToggle(task)} style={{
        all: "unset", width: 20, height: 20, borderRadius: "50%", flexShrink: 0, cursor: "pointer",
        border: done ? "none" : "2px solid #D1D5DB",
        background: done ? "#10B981" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {done && <Check size={11} color="#fff" />}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 600,
          color: done ? "#9CA3AF" : "#111827",
          textDecoration: done ? "line-through" : "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {task.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
          {task.project && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#6366F1", fontWeight: 600 }}>
              <FolderKanban size={11} />{task.project.name}
            </span>
          )}
          {task.description && (
            <span style={{ fontSize: 11.5, color: "#9CA3AF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
              {task.description}
            </span>
          )}
        </div>
      </div>

      {/* Meta */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: pCfg.badgeBg, color: pCfg.badgeColor }}>
          {pCfg.label}
        </span>
        <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 999, background: "#F3F4F6", color: "#6B7280" }}>
          {STATUS_LABEL[task.status] ?? task.status}
        </span>
        {task.dueDate && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: overdue ? "#EF4444" : "#9CA3AF", fontWeight: overdue ? 600 : 400 }}>
            <Clock size={11} />{fmtDate(task.dueDate)}
          </span>
        )}
        <button onClick={() => onEdit(task)} style={{ all: "unset", cursor: "pointer", color: "#9CA3AF", display: "flex" }}><Pencil size={14} /></button>
        <button onClick={() => onDelete(task.id)} style={{ all: "unset", cursor: "pointer", color: "#EF4444", display: "flex" }}><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

// ── Main Module ───────────────────────────────────────────────────────────────

export default function TasksModule({ user }: { user: AppUser | null }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [modal, setModal] = useState<{ open: boolean; editing: Task | null }>({ open: false, editing: null });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus)  params.set("status",    filterStatus);
      if (filterPriority) params.set("priority", filterPriority);
      if (filterProject) params.set("projectId", filterProject);
      const [tasksRes, projectsRes] = await Promise.all([
        fetch(`/api/tasks?${params}`),
        fetch("/api/projects"),
      ]);
      if (tasksRes.ok)    { const d = await tasksRes.json();    setTasks(d.tasks); }
      if (projectsRes.ok) { const d = await projectsRes.json(); setProjects(d.projects.map((p: ProjectOption) => ({ id: p.id, name: p.name }))); }
    } finally { setLoading(false); }
  }, [filterStatus, filterPriority, filterProject]);

  useEffect(() => { load(); }, [load]);

  const toggleComplete = async (t: Task) => {
    const newStatus: TaskStatus = t.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    await fetch(`/api/tasks/${t.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta tarefa?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    load();
  };

  const planLimit = user ? PLANS[user.plan as keyof typeof PLANS].limits.tasks : 0;
  const atLimit = user && tasks.length >= planLimit && !filterStatus && !filterPriority && !filterProject;

  return (
    <div style={{ padding: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>Tarefas</h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
            {tasks.length} tarefa{tasks.length !== 1 ? "s" : ""}
            {planLimit > 0 && ` · limite: ${planLimit}`}
          </p>
        </div>
        <button onClick={() => setModal({ open: true, editing: null })} disabled={!!atLimit}
          className="btn-primary"
          style={{ fontSize: 13, padding: "9px 18px", display: "flex", alignItems: "center", gap: 6, opacity: atLimit ? 0.5 : 1 }}>
          <Plus size={14} /> Nova tarefa
        </button>
      </div>

      {atLimit && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#FEF3C7", borderRadius: 9, marginBottom: 14, fontSize: 13, color: "#92400E" }}>
          <AlertCircle size={14} /> Limite do plano atingido. Faça upgrade para criar mais tarefas.
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: "7px 12px", borderRadius: 9, border: "1.5px solid #E5E7EB", fontSize: 13, background: "#fff", color: "#374151", fontFamily: "DM Sans, sans-serif", cursor: "pointer" }}>
          <option value="">Todos os status</option>
          <option value="PENDING">Pendente</option>
          <option value="IN_PROGRESS">Em andamento</option>
          <option value="COMPLETED">Concluída</option>
          <option value="CANCELLED">Cancelada</option>
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
          style={{ padding: "7px 12px", borderRadius: 9, border: "1.5px solid #E5E7EB", fontSize: 13, background: "#fff", color: "#374151", fontFamily: "DM Sans, sans-serif", cursor: "pointer" }}>
          <option value="">Todas as prioridades</option>
          <option value="LOW">Baixa</option>
          <option value="MEDIUM">Média</option>
          <option value="HIGH">Alta</option>
          <option value="URGENT">Urgente</option>
        </select>
        {projects.length > 0 && (
          <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}
            style={{ padding: "7px 12px", borderRadius: 9, border: "1.5px solid #E5E7EB", fontSize: 13, background: "#fff", color: "#374151", fontFamily: "DM Sans, sans-serif", cursor: "pointer" }}>
            <option value="">Todos os projetos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
        {(filterStatus || filterPriority || filterProject) && (
          <button onClick={() => { setFilterStatus(""); setFilterPriority(""); setFilterProject(""); }}
            style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#6B7280", padding: "7px 10px", borderRadius: 9, border: "1.5px solid #E5E7EB", background: "#fff" }}>
            <X size={13} /> Limpar
          </button>
        )}
      </div>

      {/* Task List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 58, borderRadius: 10, background: "#F3F4F6", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <CheckCircle2 size={40} color="#E5E7EB" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
            {filterStatus || filterPriority || filterProject ? "Nenhuma tarefa com esses filtros" : "Nenhuma tarefa ainda"}
          </p>
          {!filterStatus && !filterPriority && !filterProject && (
            <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>
              Crie sua primeira tarefa para começar.
            </p>
          )}
          {!filterStatus && !filterPriority && !filterProject && (
            <button onClick={() => setModal({ open: true, editing: null })} className="btn-primary"
              style={{ fontSize: 13, padding: "10px 20px", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Plus size={14} /> Criar tarefa
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task}
              onToggle={toggleComplete}
              onEdit={(t) => setModal({ open: true, editing: t })}
              onDelete={remove}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {modal.open && (
        <TaskFormModal
          editing={modal.editing}
          projects={projects}
          onClose={() => setModal({ open: false, editing: null })}
          onSaved={() => { load(); setModal({ open: false, editing: null }); }}
        />
      )}
    </div>
  );
}
