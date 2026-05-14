"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, CheckCircle2, Wallet, FolderKanban, StickyNote,
  Settings, ChevronDown, ChevronLeft, ChevronRight,
  LogOut, AlertCircle,
  X, Lock, Moon, Sun,
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { useDark } from "@/contexts/ThemeContext";
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
  const { dark } = useDark();
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: dark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.35)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: dark ? "#1C2128" : "#fff",
        border: dark ? "1px solid #30363D" : "none",
        borderRadius: 14, padding: 24, width: "100%", maxWidth: 480,
        boxShadow: dark ? "0 20px 60px rgba(0,0,0,0.5)" : "0 20px 60px rgba(0,0,0,0.15)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: dark ? "#E6EDF3" : "#111827" }}>{title}</h3>
          <button onClick={onClose} style={{ all: "unset", cursor: "pointer", color: dark ? "#6E7681" : "#6B7280" }}>
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
  const { dark } = useDark();
  return (
    <div>
      <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: dark ? "#8D96A0" : "#374151", marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

/* ── Sidebar ── */
function Sidebar({ active, onNavigate, user, collapsed, onToggle }: {
  active: Module;
  onNavigate: (m: Module) => void;
  user: AppUser | null;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { dark } = useDark();

  const items: { id: Module; icon: React.ReactNode; label: string }[] = [
    { id: "dashboard", icon: <LayoutDashboard size={17} />, label: "Dashboard" },
    { id: "tasks", icon: <CheckCircle2 size={17} />, label: "Tarefas" },
    { id: "finance", icon: <Wallet size={17} />, label: "Financeiro" },
    { id: "projects", icon: <FolderKanban size={17} />, label: "Projetos" },
    { id: "notes", icon: <StickyNote size={17} />, label: "Anotações" },
  ];

  const initial = user?.name?.charAt(0).toUpperCase() ?? "U";
  const planLabel = user?.planLabel ?? "Free";
  const W = collapsed ? 64 : 220;

  const surface = dark ? "#1C2128" : "#FFFFFF";
  const border = dark ? "#30363D" : "#E5E7EB";
  const textPrimary = dark ? "#E6EDF3" : "#111827";
  const textMuted = dark ? "#6E7681" : "#9CA3AF";
  const textSecondary = dark ? "#8D96A0" : "#4B5563";
  const hoverBg = dark ? "#21262D" : "#F3F4F6";
  const hoverText = dark ? "#E6EDF3" : "#111827";
  const userCardBg = dark ? "#161B22" : "#F8FAFC";
  const userCardBorder = dark ? "#21262D" : "#F3F4F6";
  const dividerColor = dark ? "#21262D" : "#F3F4F6";
  const collapseBtnBg = dark ? "#21262D" : "#F9FAFB";
  const collapseBtnHover = dark ? "#30363D" : "#F3F4F6";

  return (
    <aside style={{
      width: W, minWidth: W,
      background: surface, borderRight: `1px solid ${border}`,
      display: "flex", flexDirection: "column",
      padding: collapsed ? "20px 10px" : "20px 12px",
      flexShrink: 0, height: "100vh", position: "sticky", top: 0,
      overflowY: "auto", overflowX: "hidden",
      transition: "width 0.22s cubic-bezier(.4,0,.2,1), min-width 0.22s cubic-bezier(.4,0,.2,1), padding 0.22s cubic-bezier(.4,0,.2,1), background 0.2s, border-color 0.2s",
    }}>

      {/* Logo */}
      <Link href="/" style={{
        textDecoration: "none", display: "flex", alignItems: "center",
        gap: 9, padding: "4px 6px 20px",
        justifyContent: collapsed ? "center" : "flex-start", overflow: "hidden",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          background: "linear-gradient(135deg,#FBBF24 0%,#EA580C 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 3px 10px rgba(245,158,11,0.3)",
        }}>
          <LayoutDashboard size={15} color="#fff" />
        </div>
        {!collapsed && <span style={{ fontSize: 13.5, fontWeight: 700, color: textPrimary, whiteSpace: "nowrap" }}>Org. Fácil</span>}
      </Link>

      {!collapsed && (
        <p style={{ fontSize: 10.5, fontWeight: 700, color: textMuted, letterSpacing: "0.07em", textTransform: "uppercase", padding: "0 8px", marginBottom: 6, whiteSpace: "nowrap" }}>Menu</p>
      )}

      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map((item) => {
          const isActive = active === item.id;
          const activeBg = dark ? "#2D2008" : "#FEF3C7";
          const activeText = dark ? "#F59E0B" : "#92400E";
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                all: "unset", display: "flex", alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: collapsed ? 0 : 9,
                padding: collapsed ? "11px 0" : "9px 10px",
                borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: "pointer",
                background: isActive ? activeBg : "transparent",
                color: isActive ? activeText : textSecondary,
                transition: "background 0.15s, color 0.15s",
                overflow: "hidden", whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = hoverText; } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = textSecondary; } }}
            >
              <span style={{ color: isActive ? "#F59E0B" : (dark ? "#6E7681" : "#6B7280"), display: "flex", flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ height: 1, background: dividerColor, margin: "16px 0" }} />

      {!collapsed && (
        <p style={{ fontSize: 10.5, fontWeight: 700, color: textMuted, letterSpacing: "0.07em", textTransform: "uppercase", padding: "0 8px", marginBottom: 6 }}>Conta</p>
      )}

      <button onClick={() => onNavigate("settings")}
        title={collapsed ? "Configurações" : undefined}
        style={{
          all: "unset", display: "flex", alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : 9,
          padding: collapsed ? "11px 0" : "9px 10px",
          borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: "pointer",
          background: active === "settings" ? (dark ? "#2D2008" : "#FEF3C7") : "transparent",
          color: active === "settings" ? (dark ? "#F59E0B" : "#92400E") : textSecondary,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { if (active !== "settings") { e.currentTarget.style.background = hoverBg; } }}
        onMouseLeave={(e) => { if (active !== "settings") { e.currentTarget.style.background = "transparent"; } }}
      >
        <span style={{ color: active === "settings" ? "#F59E0B" : (dark ? "#6E7681" : "#6B7280"), display: "flex", flexShrink: 0 }}><Settings size={17} /></span>
        {!collapsed && "Configurações"}
      </button>

      <div style={{ flex: 1 }} />

      {/* User card */}
      <div
        onClick={() => onNavigate("settings")}
        title={collapsed ? (user?.name ?? "") : undefined}
        style={{
          display: "flex", alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : 9,
          padding: "10px", background: userCardBg, borderRadius: 10,
          border: `1px solid ${userCardBorder}`, cursor: "pointer",
          marginBottom: 8, overflow: "hidden",
          transition: "background 0.2s",
        }}
      >
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#FBBF24,#EA580C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
          {initial}
        </div>
        {!collapsed && (
          <>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: textPrimary, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.name ?? "Carregando..."}
              </div>
              <div style={{ fontSize: 11, color: textMuted }}>Plano {planLabel}</div>
            </div>
            <ChevronDown size={13} color={textMuted} style={{ marginLeft: "auto", flexShrink: 0 }} />
          </>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        title={collapsed ? "Expandir menu" : "Recolher menu"}
        style={{
          all: "unset", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "7px", borderRadius: 8,
          border: `1.5px solid ${border}`, background: collapseBtnBg, color: textMuted,
          transition: "background 0.15s, color 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = collapseBtnHover; e.currentTarget.style.color = textPrimary; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = collapseBtnBg; e.currentTarget.style.color = textMuted; }}
      >
        {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
      </button>
    </aside>
  );
}

/* ── DarkModeToggle ── */
function DarkModeToggle() {
  const { dark, toggle } = useDark();
  return (
    <button
      onClick={toggle}
      title={dark ? "Modo claro" : "Modo escuro"}
      style={{
        all: "unset", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 34, height: 34, borderRadius: 9,
        background: dark ? "#21262D" : "#F3F4F6",
        border: `1.5px solid ${dark ? "#30363D" : "#E5E7EB"}`,
        color: dark ? "#F59E0B" : "#6B7280",
        transition: "background 0.2s, border-color 0.2s, color 0.2s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = dark ? "#30363D" : "#E5E7EB";
        e.currentTarget.style.color = dark ? "#FBBF24" : "#374151";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = dark ? "#21262D" : "#F3F4F6";
        e.currentTarget.style.color = dark ? "#F59E0B" : "#6B7280";
      }}
    >
      {dark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}

/* ── TopBar ── */
function TopBar({ title, user, onNavigate }: { title: string; user: AppUser | null; onNavigate: (m: Module) => void }) {
  const { dark } = useDark();
  const initial = user?.name?.charAt(0).toUpperCase() ?? "U";
  return (
    <div style={{
      height: 60,
      background: dark ? "#1C2128" : "#FFFFFF",
      borderBottom: `1px solid ${dark ? "#30363D" : "#E5E7EB"}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px", position: "sticky", top: 0, zIndex: 20,
      transition: "background 0.2s, border-color 0.2s",
    }}>
      <h1 style={{ fontSize: 16, fontWeight: 700, color: dark ? "#E6EDF3" : "#111827" }}>{title}</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <DarkModeToggle />
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
  const { dark } = useDark();
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

  const txt = dark ? "#E6EDF3" : "#111827";
  const txtMuted = dark ? "#8D96A0" : "#6B7280";

  return (
    <div style={{ padding: 24, maxWidth: 640 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: txt, marginBottom: 4 }}>Configurações</h2>
      <p style={{ fontSize: 14, color: txtMuted, marginBottom: 28 }}>Gerencie sua conta e preferências.</p>

      {/* Plan info */}
      <div className="card" style={{ padding: 24, marginBottom: 16, background: dark ? "linear-gradient(135deg,#2D2008,#1A1400)" : "linear-gradient(135deg,#FFFBEB,#FEF3C7)", border: `1.5px solid ${dark ? "#4D3800" : "#FDE68A"}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: dark ? "#FBBF24" : "#92400E", marginBottom: 4 }}>Plano atual: {planConfig.label}</h3>
            <p style={{ fontSize: 13, color: dark ? "#D97706" : "#B45309" }}>Seus limites e recursos disponíveis</p>
          </div>
          <span className="badge badge-amber">{planConfig.label}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {(Object.entries(planConfig.limits) as [string, number][]).map(([key, limit]) => {
            const labels: Record<string, string> = { tasks: "Tarefas", projects: "Projetos", notes: "Anotações", categories: "Categorias" };
            return (
              <div key={key} style={{ padding: "10px 12px", borderRadius: 9, background: dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)", border: `1px solid ${dark ? "rgba(245,158,11,0.15)" : "rgba(245,158,11,0.2)"}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: dark ? "#FBBF24" : "#92400E", marginBottom: 2 }}>{labels[key] ?? key}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: txt }}>até {limit}</div>
              </div>
            );
          })}
        </div>
        {!planConfig.features.finance && (
          <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 9, background: dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 8 }}>
            <Lock size={13} color={dark ? "#FBBF24" : "#92400E"} />
            <span style={{ fontSize: 12, color: dark ? "#FBBF24" : "#92400E" }}>Módulo financeiro disponível no plano Pro</span>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: txt, marginBottom: 16 }}>Perfil</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#FBBF24,#EA580C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
            {user?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: txt }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: txtMuted }}>{user?.email}</div>
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
        <h3 style={{ fontSize: 14, fontWeight: 700, color: txt, marginBottom: 16 }}>Segurança</h3>
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
      <div className="card" style={{ padding: 20, border: `1px solid ${dark ? "#3D1515" : "#FEE2E2"}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <AlertCircle size={15} color="#EF4444" />
          <h3 style={{ fontSize: 13.5, fontWeight: 700, color: dark ? "#F87171" : "#991B1B" }}>Zona de perigo</h3>
        </div>
        <p style={{ fontSize: 13, color: txtMuted, marginBottom: 14 }}>Sair encerrará sua sessão atual.</p>
        <button onClick={logout} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, background: dark ? "#2D1010" : "#FEF2F2", border: `1.5px solid ${dark ? "#3D1515" : "#FEE2E2"}`, color: "#EF4444", fontSize: 13, fontWeight: 600 }}>
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const { dark } = useDark();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: dark ? "#0D1117" : "#F8FAFC", fontFamily: "DM Sans, sans-serif", transition: "background 0.2s" }}>
      <Sidebar active={activeModule} onNavigate={setActiveModule} user={user} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((c) => !c)} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowY: "auto" }}>
        <TopBar title={MODULE_TITLES[activeModule]} user={user} onNavigate={setActiveModule} />
        <main style={{ flex: 1 }}>
          {renderModule()}
        </main>
      </div>
    </div>
  );
}
