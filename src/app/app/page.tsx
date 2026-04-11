"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, CheckCircle2, Wallet, FolderKanban, StickyNote,
  Settings, ChevronDown,
  LogOut, AlertCircle,
  X, Lock,
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import DashboardHome from "@/components/dashboard/DashboardHome";
import SearchBar from "@/components/SearchBar";
import FinanceModuleV2 from "@/components/finance/FinanceModule";
import ProjectsModuleV2 from "@/components/projects/ProjectsModule";
import TasksModuleV2 from "@/components/tasks/TasksModule";
import NotesModuleV2 from "@/components/notes/NotesModule";

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
      case "tasks": return <TasksModuleV2 user={user} />;
      case "projects": return <ProjectsModuleV2 user={user} />;
      case "notes": return <NotesModuleV2 user={user} />;
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
