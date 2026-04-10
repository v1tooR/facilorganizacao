"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, CheckCircle2, Wallet, FolderKanban, StickyNote,
  Settings, ChevronDown, Plus,
  Clock, LogOut, AlertCircle,
  Trash2, Pencil, X, Check, Lock,
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import DashboardHome from "@/components/dashboard/DashboardHome";
import SearchBar from "@/components/SearchBar";
import FinanceModuleV2 from "@/components/finance/FinanceModule";

/* ── Types ── */
type Module = "dashboard" | "tasks" | "finance" | "projects" | "notes" | "settings";
type UserPlan = "FREE" | "PRO" | "BUSINESS";

interface AppUser {
  id: string;
  name: string;
  email: string;
  plan: UserPlan;
  planLabel: string;
  planLimits: { tasks: number; projects: number; notes: number; categories: number };
}

/* ── Helpers ── */
function fmt(amount: number) {
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function priorityLabel(p: string) {
  return { LOW: "Baixa", MEDIUM: "Média", HIGH: "Alta", URGENT: "Urgente" }[p] ?? p;
}
function priorityBadge(p: string) {
  return { LOW: "badge-gray", MEDIUM: "badge-amber", HIGH: "badge-red", URGENT: "badge-red" }[p] ?? "badge-gray";
}
function statusLabel(s: string) {
  return { PENDING: "Pendente", IN_PROGRESS: "Em andamento", COMPLETED: "Concluída", CANCELLED: "Cancelada" }[s] ?? s;
}
function projectStatusLabel(s: string) {
  return { PLANNING: "Planejamento", IN_PROGRESS: "Em andamento", COMPLETED: "Concluído", ON_HOLD: "Em pausa", CANCELLED: "Cancelado" }[s] ?? s;
}

/* ── Modal ── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.35)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 14, padding: 24, width: "100%", maxWidth: 480,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{title}</h3>
          <button onClick={onClose} style={{ all: "unset", cursor: "pointer", color: "#6B7280" }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Field ── */
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

/* ── Sidebar ── */
function Sidebar({ active, onNavigate, user }: {
  active: Module;
  onNavigate: (m: Module) => void;
  user: AppUser | null;
}) {
  const items: { id: Module; icon: React.ReactNode; label: string }[] = [
    { id: "dashboard", icon: <LayoutDashboard size={16} />, label: "Dashboard" },
    { id: "tasks", icon: <CheckCircle2 size={16} />, label: "Tarefas" },
    { id: "finance", icon: <Wallet size={16} />, label: "Financeiro" },
    { id: "projects", icon: <FolderKanban size={16} />, label: "Projetos" },
    { id: "notes", icon: <StickyNote size={16} />, label: "Anotações" },
  ];

  const initial = user?.name?.charAt(0).toUpperCase() ?? "U";
  const planLabel = user?.planLabel ?? "Free";

  return (
    <aside style={{
      width: 220, background: "#FFFFFF", borderRight: "1px solid #E5E7EB",
      display: "flex", flexDirection: "column", padding: "20px 12px",
      flexShrink: 0, height: "100vh", position: "sticky", top: 0, overflowY: "auto",
    }}>
      <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9, padding: "4px 8px 20px" }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: "linear-gradient(135deg,#FBBF24 0%,#EA580C 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 3px 10px rgba(245,158,11,0.3)", flexShrink: 0,
        }}>
          <LayoutDashboard size={15} color="#fff" />
        </div>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>Org. Fácil</span>
      </Link>

      <p style={{ fontSize: 10.5, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.07em", textTransform: "uppercase", padding: "0 8px", marginBottom: 6 }}>Menu</p>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map((item) => (
          <button key={item.id} onClick={() => onNavigate(item.id)} style={{
            all: "unset", display: "flex", alignItems: "center", gap: 9,
            padding: "9px 10px", borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: "pointer",
            background: active === item.id ? "#FEF3C7" : "transparent",
            color: active === item.id ? "#92400E" : "#4B5563",
            transition: "background 0.15s, color 0.15s",
          }}
            onMouseEnter={(e) => { if (active !== item.id) { e.currentTarget.style.background = "#F3F4F6"; e.currentTarget.style.color = "#111827"; } }}
            onMouseLeave={(e) => { if (active !== item.id) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4B5563"; } }}
          >
            <span style={{ color: active === item.id ? "#F59E0B" : "#6B7280", display: "flex" }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div style={{ height: 1, background: "#F3F4F6", margin: "16px 0" }} />

      <p style={{ fontSize: 10.5, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.07em", textTransform: "uppercase", padding: "0 8px", marginBottom: 6 }}>Conta</p>

      <button onClick={() => onNavigate("settings")} style={{
        all: "unset", display: "flex", alignItems: "center", gap: 9,
        padding: "9px 10px", borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: "pointer",
        background: active === "settings" ? "#FEF3C7" : "transparent",
        color: active === "settings" ? "#92400E" : "#4B5563",
        transition: "background 0.15s",
      }}>
        <span style={{ color: active === "settings" ? "#F59E0B" : "#6B7280", display: "flex" }}><Settings size={16} /></span>
        Configurações
      </button>

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 10px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #F3F4F6", cursor: "pointer" }}
        onClick={() => onNavigate("settings")}
      >
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#FBBF24,#EA580C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
          {initial}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#111827", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user?.name ?? "Carregando..."}
          </div>
          <div style={{ fontSize: 11, color: "#9CA3AF" }}>Plano {planLabel}</div>
        </div>
        <ChevronDown size={13} color="#9CA3AF" style={{ marginLeft: "auto", flexShrink: 0 }} />
      </div>
    </aside>
  );
}

/* ── TopBar ── */
function TopBar({ title, user, onNavigate }: { title: string; user: AppUser | null; onNavigate: (m: Module) => void }) {
  const initial = user?.name?.charAt(0).toUpperCase() ?? "U";
  return (
    <div style={{ height: 60, background: "#FFFFFF", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, zIndex: 20 }}>
      <h1 style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{title}</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <SearchBar onNavigate={onNavigate} />
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#FBBF24,#EA580C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
          {initial}
        </div>
      </div>
    </div>
  );
}

const NOTE_COLORS = ["#FEF3C7", "#D1FAE5", "#DBEAFE", "#EDE9FE", "#FCE7F3", "#FEE2E2"];


/* ─────────────────────── TASKS MODULE ─────────────────────── */
interface Task {
  id: string; title: string; description?: string; status: string; priority: string;
  dueDate: string | null; completedAt: string | null;
  category: { id: string; name: string; color: string } | null;
  project: { id: string; name: string } | null;
}

function TasksModule({ user }: { user: AppUser | null }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM", dueDate: "", status: "PENDING" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterPriority) params.set("priority", filterPriority);
      const r = await fetch(`/api/tasks?${params}`);
      if (r.ok) { const d = await r.json(); setTasks(d.tasks); }
    } finally { setLoading(false); }
  }, [filterStatus, filterPriority]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", description: "", priority: "MEDIUM", dueDate: "", status: "PENDING" });
    setErr("");
    setShowModal(true);
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    setForm({
      title: t.title, description: t.description ?? "",
      priority: t.priority, status: t.status,
      dueDate: t.dueDate ? t.dueDate.substring(0, 10) : "",
    });
    setErr("");
    setShowModal(true);
  };

  const save = async () => {
    setSaving(true); setErr("");
    try {
      const body = {
        title: form.title, description: form.description || undefined,
        priority: form.priority, status: editing ? form.status : undefined,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      };
      const url = editing ? `/api/tasks/${editing.id}` : "/api/tasks";
      const method = editing ? "PUT" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) { setErr(d.error ?? "Erro ao salvar."); return; }
      setShowModal(false);
      load();
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta tarefa?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    load();
  };

  const toggleComplete = async (t: Task) => {
    const newStatus = t.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    await fetch(`/api/tasks/${t.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  };

  const planLimit = user ? PLANS[user.plan as keyof typeof PLANS].limits.tasks : 0;
  const atLimit = user && tasks.length >= planLimit;

  return (
    <div style={{ padding: 24 }}>
      {showModal && (
        <Modal title={editing ? "Editar tarefa" : "Nova tarefa"} onClose={() => setShowModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Título *">
              <input className="input-base" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="O que precisa ser feito?" style={{ fontSize: 13.5 }} />
            </Field>
            <Field label="Descrição">
              <textarea className="input-base" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalhes opcionais..." style={{ fontSize: 13.5, minHeight: 80, resize: "vertical" }} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Prioridade">
                <select className="input-base" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={{ fontSize: 13.5 }}>
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </Field>
              <Field label="Prazo">
                <input type="date" className="input-base" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={{ fontSize: 13.5 }} />
              </Field>
            </div>
            {editing && (
              <Field label="Status">
                <select className="input-base" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ fontSize: 13.5 }}>
                  <option value="PENDING">Pendente</option>
                  <option value="IN_PROGRESS">Em andamento</option>
                  <option value="COMPLETED">Concluída</option>
                  <option value="CANCELLED">Cancelada</option>
                </select>
              </Field>
            )}
            {err && <p style={{ fontSize: 13, color: "#EF4444" }}>{err}</p>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary" style={{ fontSize: 13, padding: "9px 18px" }}>Cancelar</button>
              <button onClick={save} disabled={saving} className="btn-primary" style={{ fontSize: 13, padding: "9px 18px" }}>
                {saving ? "Salvando..." : editing ? "Salvar" : "Criar tarefa"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>Tarefas</h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
            {tasks.length} tarefa{tasks.length !== 1 ? "s" : ""} · limite do plano: {planLimit}
          </p>
        </div>
        <button onClick={openCreate} disabled={!!atLimit} className="btn-primary" style={{ fontSize: 13, padding: "9px 18px", display: "flex", alignItems: "center", gap: 6, opacity: atLimit ? 0.5 : 1 }}>
          <Plus size={14} /> Nova tarefa
        </button>
      </div>

      {atLimit && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#FEF3C7", borderRadius: 9, marginBottom: 14, fontSize: 13, color: "#92400E" }}>
          <AlertCircle size={14} /> Limite do plano atingido. Faça upgrade para criar mais tarefas.
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "7px 12px", borderRadius: 9, border: "1.5px solid #E5E7EB", fontSize: 13, background: "#fff", color: "#374151", fontFamily: "DM Sans, sans-serif", cursor: "pointer" }}>
          <option value="">Todos os status</option>
          <option value="PENDING">Pendente</option>
          <option value="IN_PROGRESS">Em andamento</option>
          <option value="COMPLETED">Concluída</option>
          <option value="CANCELLED">Cancelada</option>
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={{ padding: "7px 12px", borderRadius: 9, border: "1.5px solid #E5E7EB", fontSize: 13, background: "#fff", color: "#374151", fontFamily: "DM Sans, sans-serif", cursor: "pointer" }}>
          <option value="">Todas as prioridades</option>
          <option value="LOW">Baixa</option>
          <option value="MEDIUM">Média</option>
          <option value="HIGH">Alta</option>
          <option value="URGENT">Urgente</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <p style={{ fontSize: 14, color: "#9CA3AF" }}>Carregando...</p>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <CheckCircle2 size={40} color="#E5E7EB" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: "#9CA3AF" }}>Nenhuma tarefa encontrada.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tasks.map((task) => (
            <div key={task.id} className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => toggleComplete(task)} style={{
                all: "unset", width: 20, height: 20, borderRadius: "50%", flexShrink: 0, cursor: "pointer",
                border: task.status === "COMPLETED" ? "none" : "2px solid #D1D5DB",
                background: task.status === "COMPLETED" ? "#10B981" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {task.status === "COMPLETED" && <Check size={11} color="#fff" />}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: task.status === "COMPLETED" ? "#9CA3AF" : "#111827", textDecoration: task.status === "COMPLETED" ? "line-through" : "none" }}>
                  {task.title}
                </div>
                {task.description && <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.description}</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span className={`badge ${priorityBadge(task.priority)}`}>{priorityLabel(task.priority)}</span>
                <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 999, background: "#F3F4F6", color: "#6B7280" }}>{statusLabel(task.status)}</span>
                {task.dueDate && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#9CA3AF" }}>
                    <Clock size={11} />{fmtDate(task.dueDate)}
                  </span>
                )}
                <button onClick={() => openEdit(task)} style={{ all: "unset", cursor: "pointer", color: "#9CA3AF", display: "flex" }}><Pencil size={14} /></button>
                <button onClick={() => remove(task.id)} style={{ all: "unset", cursor: "pointer", color: "#EF4444", display: "flex" }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── PROJECTS MODULE ─────────────────────── */
interface Project {
  id: string; name: string; description?: string; status: string; progress: number;
  _count: { tasks: number };
}

function ProjectsModule({ user }: { user: AppUser | null }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState({ name: "", description: "", status: "PLANNING", progress: 0 });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/projects");
      if (r.ok) { const d = await r.json(); setProjects(d.projects); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", status: "PLANNING", progress: 0 });
    setErr(""); setShowModal(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description ?? "", status: p.status, progress: p.progress });
    setErr(""); setShowModal(true);
  };

  const save = async () => {
    setSaving(true); setErr("");
    try {
      const url = editing ? `/api/projects/${editing.id}` : "/api/projects";
      const method = editing ? "PUT" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) { setErr(d.error ?? "Erro ao salvar."); return; }
      setShowModal(false); load();
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este projeto? As tarefas vinculadas perderão a referência.")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    load();
  };

  const planLimit = user ? PLANS[user.plan as keyof typeof PLANS].limits.projects : 0;
  const atLimit = user && projects.length >= planLimit;

  const statusColors: Record<string, { bg: string; color: string }> = {
    PLANNING: { bg: "#EDE9FE", color: "#7C3AED" },
    IN_PROGRESS: { bg: "#DBEAFE", color: "#1E40AF" },
    COMPLETED: { bg: "#D1FAE5", color: "#065F46" },
    ON_HOLD: { bg: "#FEF3C7", color: "#92400E" },
    CANCELLED: { bg: "#FEE2E2", color: "#991B1B" },
  };

  return (
    <div style={{ padding: 24 }}>
      {showModal && (
        <Modal title={editing ? "Editar projeto" : "Novo projeto"} onClose={() => setShowModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Nome *">
              <input className="input-base" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do projeto" style={{ fontSize: 13.5 }} />
            </Field>
            <Field label="Descrição">
              <textarea className="input-base" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição opcional" style={{ fontSize: 13.5, minHeight: 70, resize: "vertical" }} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Status">
                <select className="input-base" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ fontSize: 13.5 }}>
                  <option value="PLANNING">Planejamento</option>
                  <option value="IN_PROGRESS">Em andamento</option>
                  <option value="COMPLETED">Concluído</option>
                  <option value="ON_HOLD">Em pausa</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </Field>
              <Field label="Progresso (%)">
                <input type="number" className="input-base" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: parseInt(e.target.value) || 0 })} style={{ fontSize: 13.5 }} />
              </Field>
            </div>
            {err && <p style={{ fontSize: 13, color: "#EF4444" }}>{err}</p>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary" style={{ fontSize: 13, padding: "9px 18px" }}>Cancelar</button>
              <button onClick={save} disabled={saving} className="btn-primary" style={{ fontSize: 13, padding: "9px 18px" }}>
                {saving ? "Salvando..." : editing ? "Salvar" : "Criar projeto"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>Projetos</h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{projects.length} projeto{projects.length !== 1 ? "s" : ""} · limite: {planLimit}</p>
        </div>
        <button onClick={openCreate} disabled={!!atLimit} className="btn-primary" style={{ fontSize: 13, padding: "9px 18px", display: "flex", alignItems: "center", gap: 6, opacity: atLimit ? 0.5 : 1 }}>
          <Plus size={14} /> Novo projeto
        </button>
      </div>

      {atLimit && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#FEF3C7", borderRadius: 9, marginBottom: 14, fontSize: 13, color: "#92400E" }}>
          <AlertCircle size={14} /> Limite do plano atingido. Faça upgrade para criar mais projetos.
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: 14, color: "#9CA3AF" }}>Carregando...</p>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <FolderKanban size={40} color="#E5E7EB" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: "#9CA3AF" }}>Nenhum projeto ainda. Crie o primeiro!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {projects.map((p) => {
            const sc = statusColors[p.status] ?? { bg: "#F3F4F6", color: "#6B7280" };
            return (
              <div key={p.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", flex: 1, marginRight: 8 }}>{p.name}</h3>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => openEdit(p)} style={{ all: "unset", cursor: "pointer", color: "#9CA3AF" }}><Pencil size={14} /></button>
                    <button onClick={() => remove(p.id)} style={{ all: "unset", cursor: "pointer", color: "#EF4444" }}><Trash2 size={14} /></button>
                  </div>
                </div>
                {p.description && <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 12, lineHeight: 1.5 }}>{p.description}</p>}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>Progresso</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{p.progress}%</span>
                  </div>
                  <div style={{ height: 6, background: "#E5E7EB", borderRadius: 99 }}>
                    <div style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#FBBF24,#F59E0B)", width: `${p.progress}%`, transition: "width 0.5s" }} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: sc.bg, color: sc.color }}>
                    {projectStatusLabel(p.status)}
                  </span>
                  <span style={{ fontSize: 11.5, color: "#9CA3AF" }}>{p._count.tasks} tarefa{p._count.tasks !== 1 ? "s" : ""}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── NOTES MODULE ─────────────────────── */
interface Note { id: string; title: string; content: string; color: string | null; updatedAt: string; }

function NotesModule({ user }: { user: AppUser | null }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [form, setForm] = useState({ title: "", content: "", color: "#FEF3C7" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/notes");
      if (r.ok) { const d = await r.json(); setNotes(d.notes); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", content: "", color: "#FEF3C7" });
    setErr(""); setShowModal(true);
  };

  const openEdit = (n: Note) => {
    setEditing(n);
    setForm({ title: n.title, content: n.content, color: n.color ?? "#FEF3C7" });
    setErr(""); setShowModal(true);
  };

  const save = async () => {
    setSaving(true); setErr("");
    try {
      const url = editing ? `/api/notes/${editing.id}` : "/api/notes";
      const method = editing ? "PUT" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) { setErr(d.error ?? "Erro ao salvar."); return; }
      setShowModal(false); load();
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta anotação?")) return;
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    load();
  };

  const planLimit = user ? PLANS[user.plan as keyof typeof PLANS].limits.notes : 0;
  const atLimit = user && notes.length >= planLimit;

  return (
    <div style={{ padding: 24 }}>
      {showModal && (
        <Modal title={editing ? "Editar anotação" : "Nova anotação"} onClose={() => setShowModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Título *">
              <input className="input-base" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título da anotação" style={{ fontSize: 13.5 }} />
            </Field>
            <Field label="Conteúdo *">
              <textarea className="input-base" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Escreva aqui..." style={{ fontSize: 13.5, minHeight: 120, resize: "vertical" }} />
            </Field>
            <Field label="Cor">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {NOTE_COLORS.map((c) => (
                  <button key={c} onClick={() => setForm({ ...form, color: c })} style={{
                    all: "unset", width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer",
                    border: form.color === c ? "3px solid #374151" : "2px solid rgba(0,0,0,0.1)",
                  }} />
                ))}
              </div>
            </Field>
            {err && <p style={{ fontSize: 13, color: "#EF4444" }}>{err}</p>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary" style={{ fontSize: 13, padding: "9px 18px" }}>Cancelar</button>
              <button onClick={save} disabled={saving} className="btn-primary" style={{ fontSize: 13, padding: "9px 18px" }}>
                {saving ? "Salvando..." : editing ? "Salvar" : "Criar anotação"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>Anotações</h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{notes.length} anotaç{notes.length === 1 ? "ão" : "ões"} · limite: {planLimit}</p>
        </div>
        <button onClick={openCreate} disabled={!!atLimit} className="btn-primary" style={{ fontSize: 13, padding: "9px 18px", display: "flex", alignItems: "center", gap: 6, opacity: atLimit ? 0.5 : 1 }}>
          <Plus size={14} /> Nova anotação
        </button>
      </div>

      {atLimit && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#FEF3C7", borderRadius: 9, marginBottom: 14, fontSize: 13, color: "#92400E" }}>
          <AlertCircle size={14} /> Limite do plano atingido.
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: 14, color: "#9CA3AF" }}>Carregando...</p>
      ) : notes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <StickyNote size={40} color="#E5E7EB" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: "#9CA3AF" }}>Nenhuma anotação ainda.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {notes.map((note) => (
            <div key={note.id} style={{ padding: "16px", borderRadius: 12, background: note.color ?? "#F8FAFC", border: "1px solid rgba(0,0,0,0.06)", position: "relative", minHeight: 120 }}>
              <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
                <button onClick={() => openEdit(note)} style={{ all: "unset", cursor: "pointer", color: "rgba(0,0,0,0.35)" }}><Pencil size={13} /></button>
                <button onClick={() => remove(note.id)} style={{ all: "unset", cursor: "pointer", color: "#EF4444" }}><Trash2 size={13} /></button>
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1F2937", marginBottom: 8, paddingRight: 40 }}>{note.title}</h4>
              <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{note.content}</p>
              <p style={{ fontSize: 11, color: "rgba(0,0,0,0.35)", marginTop: 12 }}>
                {new Date(note.updatedAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── SETTINGS MODULE ─────────────────────── */
function SettingsModule({ user, onUserUpdate }: { user: AppUser | null; onUserUpdate: (u: AppUser) => void }) {
  const router = useRouter();
  const [profileForm, setProfileForm] = useState({ name: user?.name ?? "", email: user?.email ?? "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (user) setProfileForm({ name: user.name, email: user.email });
  }, [user]);

  const saveProfile = async () => {
    setSavingProfile(true); setProfileMsg({ type: "", text: "" });
    try {
      const r = await fetch("/api/user/profile", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const d = await r.json();
      if (!r.ok) { setProfileMsg({ type: "error", text: d.error }); return; }
      setProfileMsg({ type: "success", text: "Perfil atualizado com sucesso!" });
      onUserUpdate({ ...user!, ...d.user });
    } finally { setSavingProfile(false); }
  };

  const savePw = async () => {
    setSavingPw(true); setPwMsg({ type: "", text: "" });
    try {
      const r = await fetch("/api/user/password", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pwForm),
      });
      const d = await r.json();
      if (!r.ok) { setPwMsg({ type: "error", text: d.error }); return; }
      setPwMsg({ type: "success", text: "Senha alterada com sucesso!" });
      setPwForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } finally { setSavingPw(false); }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const plan = user?.plan ?? "FREE";
  const planConfig = PLANS[plan as keyof typeof PLANS];

  return (
    <div style={{ padding: 24, maxWidth: 640 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Configurações</h2>
      <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 28 }}>Gerencie sua conta e preferências.</p>

      {/* Plan info */}
      <div className="card" style={{ padding: 24, marginBottom: 16, background: "linear-gradient(135deg,#FFFBEB,#FEF3C7)", border: "1.5px solid #FDE68A" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#92400E", marginBottom: 4 }}>Plano atual: {planConfig.label}</h3>
            <p style={{ fontSize: 13, color: "#B45309" }}>Seus limites e recursos disponíveis</p>
          </div>
          <span className="badge badge-amber">{planConfig.label}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {(Object.entries(planConfig.limits) as [string, number][]).map(([key, limit]) => {
            const labels: Record<string, string> = { tasks: "Tarefas", projects: "Projetos", notes: "Anotações", categories: "Categorias" };
            return (
              <div key={key} style={{ padding: "10px 12px", borderRadius: 9, background: "rgba(255,255,255,0.6)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#92400E", marginBottom: 2 }}>{labels[key] ?? key}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>até {limit}</div>
              </div>
            );
          })}
        </div>
        {!planConfig.features.finance && (
          <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 9, background: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 8 }}>
            <Lock size={13} color="#92400E" />
            <span style={{ fontSize: 12, color: "#92400E" }}>Módulo financeiro disponível no plano Pro</span>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Perfil</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#FBBF24,#EA580C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
            {user?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: "#6B7280" }}>{user?.email}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Nome">
            <input className="input-base" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} style={{ fontSize: 13.5 }} />
          </Field>
          <Field label="E-mail">
            <input type="email" className="input-base" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} style={{ fontSize: 13.5 }} />
          </Field>
        </div>
        {profileMsg.text && (
          <p style={{ fontSize: 13, color: profileMsg.type === "error" ? "#EF4444" : "#10B981", marginTop: 10 }}>{profileMsg.text}</p>
        )}
        <button onClick={saveProfile} disabled={savingProfile} className="btn-primary" style={{ marginTop: 16, fontSize: 13.5, padding: "10px 20px" }}>
          {savingProfile ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>

      {/* Password */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Segurança</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {([
            { label: "Senha atual", key: "currentPassword" },
            { label: "Nova senha", key: "newPassword" },
            { label: "Confirmar nova senha", key: "confirmNewPassword" },
          ] as const).map(({ label, key }) => (
            <Field key={key} label={label}>
              <input type="password" className="input-base" value={pwForm[key]} onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })} placeholder="••••••••" style={{ fontSize: 13.5 }} />
            </Field>
          ))}
        </div>
        {pwMsg.text && (
          <p style={{ fontSize: 13, color: pwMsg.type === "error" ? "#EF4444" : "#10B981", marginTop: 10 }}>{pwMsg.text}</p>
        )}
        <button onClick={savePw} disabled={savingPw} className="btn-secondary" style={{ marginTop: 16, fontSize: 13.5, padding: "10px 20px" }}>
          {savingPw ? "Alterando..." : "Alterar senha"}
        </button>
      </div>

      {/* Danger zone */}
      <div className="card" style={{ padding: 20, border: "1px solid #FEE2E2" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <AlertCircle size={15} color="#EF4444" />
          <h3 style={{ fontSize: 13.5, fontWeight: 700, color: "#991B1B" }}>Zona de perigo</h3>
        </div>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 14 }}>Sair encerrará sua sessão atual.</p>
        <button onClick={logout} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, background: "#FEF2F2", border: "1.5px solid #FEE2E2", color: "#EF4444", fontSize: 13, fontWeight: 600 }}>
          <LogOut size={14} /> Sair da conta
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────── MODULE MAP ─────────────────────── */
const MODULE_TITLES: Record<Module, string> = {
  dashboard: "Dashboard",
  tasks: "Tarefas",
  finance: "Financeiro",
  projects: "Projetos",
  notes: "Anotações",
  settings: "Configurações",
};

/* ─────────────────────── MAIN PAGE ─────────────────────── */
export default function AppPage() {
  const [activeModule, setActiveModule] = useState<Module>("dashboard");
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.user) setUser({ ...d.user, planLabel: PLANS[d.user.plan as keyof typeof PLANS]?.label ?? d.user.plan, planLimits: PLANS[d.user.plan as keyof typeof PLANS]?.limits });
      });
  }, []);

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard": return <DashboardHome onNavigate={(m) => setActiveModule(m as Module)} />;
      case "tasks": return <TasksModule user={user} />;
      case "projects": return <ProjectsModule user={user} />;
      case "notes": return <NotesModule user={user} />;
      case "finance": return <FinanceModuleV2 user={user} />;
      case "settings": return <SettingsModule user={user} onUserUpdate={setUser} />;
      default: return null;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "DM Sans, sans-serif" }}>
      <Sidebar active={activeModule} onNavigate={setActiveModule} user={user} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowY: "auto" }}>
        <TopBar title={MODULE_TITLES[activeModule]} user={user} onNavigate={setActiveModule} />
        <main style={{ flex: 1 }}>
          {renderModule()}
        </main>
      </div>
    </div>
  );
}
