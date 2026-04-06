"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard, CheckCircle2, Wallet, FolderKanban, StickyNote,
  Settings, Search, Bell, ChevronDown, Plus, ArrowUpRight, ArrowDownRight,
  Clock, TrendingUp, Star, MoreHorizontal, Calendar, Target,
  LogOut, User, Zap, AlertCircle,
} from "lucide-react";

/* ── Types ── */
type Module = "dashboard" | "tasks" | "finance" | "projects" | "notes" | "settings";

/* ── Sidebar ── */
function Sidebar({ active, onNavigate }: { active: Module; onNavigate: (m: Module) => void }) {
  const items: { id: Module; icon: React.ReactNode; label: string }[] = [
    { id: "dashboard", icon: <LayoutDashboard size={16} />, label: "Dashboard" },
    { id: "tasks",     icon: <CheckCircle2 size={16} />,    label: "Tarefas" },
    { id: "finance",   icon: <Wallet size={16} />,          label: "Financeiro" },
    { id: "projects",  icon: <FolderKanban size={16} />,    label: "Projetos" },
    { id: "notes",     icon: <StickyNote size={16} />,      label: "Anotações" },
  ];

  return (
    <aside
      style={{
        width: 220,
        background: "#FFFFFF",
        borderRight: "1px solid #E5E7EB",
        display: "flex",
        flexDirection: "column",
        padding: "20px 12px",
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
        overflowY: "auto",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          textDecoration: "none",
          display: "flex", alignItems: "center", gap: 9,
          padding: "4px 8px 20px",
        }}
      >
        <div
          style={{
            width: 32, height: 32, borderRadius: 9,
            background: "linear-gradient(135deg,#FBBF24 0%,#EA580C 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 3px 10px rgba(245,158,11,0.3)",
            flexShrink: 0,
          }}
        >
          <LayoutDashboard size={15} color="#fff" />
        </div>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>
          Org. Fácil
        </span>
      </Link>

      {/* Nav label */}
      <p style={{ fontSize: 10.5, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.07em", textTransform: "uppercase", padding: "0 8px", marginBottom: 6 }}>
        Menu
      </p>

      {/* Nav items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            style={{
              all: "unset",
              display: "flex", alignItems: "center", gap: 9,
              padding: "9px 10px", borderRadius: 9,
              fontSize: 13.5, fontWeight: 500, cursor: "pointer",
              background: active === item.id ? "#FEF3C7" : "transparent",
              color: active === item.id ? "#92400E" : "#4B5563",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (active !== item.id) {
                (e.currentTarget as HTMLButtonElement).style.background = "#F3F4F6";
                (e.currentTarget as HTMLButtonElement).style.color = "#111827";
              }
            }}
            onMouseLeave={(e) => {
              if (active !== item.id) {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "#4B5563";
              }
            }}
          >
            <span style={{ color: active === item.id ? "#F59E0B" : "#6B7280", display: "flex" }}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      <div style={{ height: 1, background: "#F3F4F6", margin: "16px 0" }} />

      <p style={{ fontSize: 10.5, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.07em", textTransform: "uppercase", padding: "0 8px", marginBottom: 6 }}>
        Conta
      </p>

      <button
        onClick={() => onNavigate("settings")}
        style={{
          all: "unset",
          display: "flex", alignItems: "center", gap: 9,
          padding: "9px 10px", borderRadius: 9,
          fontSize: 13.5, fontWeight: 500, cursor: "pointer",
          background: active === "settings" ? "#FEF3C7" : "transparent",
          color: active === "settings" ? "#92400E" : "#4B5563",
          transition: "background 0.15s",
        }}
      >
        <span style={{ color: active === "settings" ? "#F59E0B" : "#6B7280", display: "flex" }}>
          <Settings size={16} />
        </span>
        Configurações
      </button>

      {/* User profile */}
      <div style={{ flex: 1 }} />
      <div
        style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "10px 10px",
          background: "#F8FAFC", borderRadius: 10,
          border: "1px solid #F3F4F6",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "linear-gradient(135deg,#FBBF24,#EA580C)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
          }}
        >
          M
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#111827", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Maria Silva
          </div>
          <div style={{ fontSize: 11, color: "#9CA3AF" }}>Plano Pro</div>
        </div>
        <ChevronDown size={13} color="#9CA3AF" style={{ marginLeft: "auto", flexShrink: 0 }} />
      </div>
    </aside>
  );
}

/* ── TopBar ── */
function TopBar({ title }: { title: string }) {
  return (
    <div
      style={{
        height: 60, background: "#FFFFFF",
        borderBottom: "1px solid #E5E7EB",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        position: "sticky", top: 0, zIndex: 20,
      }}
    >
      <h1 style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{title}</h1>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Buscar..."
            style={{
              padding: "7px 12px 7px 30px",
              background: "#F3F4F6", border: "1.5px solid transparent",
              borderRadius: 9, fontSize: 13, color: "#374151",
              outline: "none", width: 200, fontFamily: "DM Sans, sans-serif",
              transition: "border-color 0.2s, background 0.2s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#F59E0B";
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = "#F3F4F6";
              e.currentTarget.style.borderColor = "transparent";
            }}
          />
        </div>

        {/* Bell */}
        <button
          style={{
            all: "unset", cursor: "pointer",
            width: 34, height: 34, borderRadius: 9,
            background: "#F3F4F6",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}
        >
          <Bell size={15} color="#6B7280" />
          <div
            style={{
              position: "absolute", top: 6, right: 6,
              width: 7, height: 7, borderRadius: "50%",
              background: "#F59E0B", border: "1.5px solid #fff",
            }}
          />
        </button>

        {/* Avatar */}
        <div
          style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "linear-gradient(135deg,#FBBF24,#EA580C)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer",
          }}
        >
          M
        </div>
      </div>
    </div>
  );
}

/* ── DASHBOARD HOME ── */
function DashboardHome() {
  const tasks = [
    { id: 1, title: "Revisar relatório Q2", priority: "Alta", status: "pendente", due: "Hoje" },
    { id: 2, title: "Reunião com equipe de design", priority: "Média", status: "concluída", due: "Ontem" },
    { id: 3, title: "Pagar fornecedor XYZ", priority: "Alta", status: "pendente", due: "Amanhã" },
    { id: 4, title: "Atualizar planilha de gastos", priority: "Baixa", status: "pendente", due: "Sex" },
  ];

  const notes = [
    { id: 1, title: "Ideias para campanha", preview: "Explorar parceria com influenciadores do nicho...", color: "#FEF3C7" },
    { id: 2, title: "Lista de compras casa", preview: "Detergente, esponja, papel toalha, café...", color: "#D1FAE5" },
    { id: 3, title: "Próximos passos projeto", preview: "1. Validar com cliente 2. Ajustar wireframes...", color: "#DBEAFE" },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-0.01em", marginBottom: 4 }}>
          Bom dia, Maria 👋
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280" }}>
          Sábado, 5 de abril de 2026 · Você tem <strong style={{ color: "#111827" }}>3 tarefas</strong> pendentes hoje
        </p>
      </div>

      {/* KPI cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {[
          {
            label: "Tarefas pendentes",
            value: "8",
            sub: "3 para hoje",
            icon: <CheckCircle2 size={18} />,
            iconBg: "#FEF3C7", iconColor: "#F59E0B",
            trend: "+2 esta semana",
          },
          {
            label: "Saldo do mês",
            value: "R$ 4.220",
            sub: "+12% vs mês anterior",
            icon: <Wallet size={18} />,
            iconBg: "#D1FAE5", iconColor: "#10B981",
            trend: "Positivo",
          },
          {
            label: "Projetos ativos",
            value: "5",
            sub: "2 em andamento",
            icon: <FolderKanban size={18} />,
            iconBg: "#DBEAFE", iconColor: "#3B82F6",
            trend: "1 atrasado",
          },
          {
            label: "Anotações",
            value: "12",
            sub: "2 criadas esta semana",
            icon: <StickyNote size={18} />,
            iconBg: "#EDE9FE", iconColor: "#8B5CF6",
            trend: "Atualizado",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="card"
            style={{ padding: "18px 18px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: kpi.iconBg, color: kpi.iconColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {kpi.icon}
              </div>
              <span
                style={{
                  fontSize: 11, fontWeight: 600,
                  color: "#10B981",
                  background: "#D1FAE5",
                  padding: "2px 8px", borderRadius: 999,
                }}
              >
                {kpi.trend}
              </span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#111827", lineHeight: 1, marginBottom: 4 }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 12.5, color: "#6B7280" }}>{kpi.label}</div>
            <div style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 3 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* Tasks */}
        <div className="card" style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 16,
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
              Tarefas de hoje
            </h3>
            <button
              style={{
                all: "unset", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 12, fontWeight: 600, color: "#F59E0B",
              }}
            >
              <Plus size={12} /> Nova
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px", borderRadius: 9,
                  background: "#F8FAFC",
                  border: "1px solid #F3F4F6",
                }}
              >
                <div
                  style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: task.status === "concluída" ? "none" : "1.5px solid #D1D5DB",
                    background: task.status === "concluída" ? "#10B981" : "transparent",
                    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  {task.status === "concluída" && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3.5 6L6.5 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span
                  style={{
                    flex: 1, fontSize: 13, fontWeight: 500,
                    color: task.status === "concluída" ? "#9CA3AF" : "#374151",
                    textDecoration: task.status === "concluída" ? "line-through" : "none",
                  }}
                >
                  {task.title}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span
                    className={`badge ${task.priority === "Alta" ? "badge-red" : task.priority === "Média" ? "badge-amber" : "badge-gray"}`}
                  >
                    {task.priority}
                  </span>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{task.due}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Finance summary */}
        <div className="card" style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 16,
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
              Financeiro — Abril
            </h3>
            <span
              className="badge badge-amber"
              style={{ fontSize: 11 }}
            >
              <Calendar size={10} />
              Abr 2026
            </span>
          </div>

          {/* Summary numbers */}
          <div
            style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              gap: 10, marginBottom: 16,
            }}
          >
            {[
              { label: "Entradas", value: "R$ 7.500", color: "#10B981", icon: <ArrowUpRight size={12} /> },
              { label: "Saídas", value: "R$ 3.280", color: "#EF4444", icon: <ArrowDownRight size={12} /> },
              { label: "Saldo", value: "R$ 4.220", color: "#111827", icon: <TrendingUp size={12} /> },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: "10px", borderRadius: 9,
                  background: "#F8FAFC", border: "1px solid #F3F4F6",
                  textAlign: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, marginBottom: 4, color: item.color }}>
                  {item.icon}
                  <span style={{ fontSize: 10.5, fontWeight: 600 }}>{item.label}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: item.color }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div>
            <p style={{ fontSize: 11.5, color: "#6B7280", marginBottom: 8, fontWeight: 500 }}>Últimos 6 meses</p>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 60 }}>
              {[
                { m: "Nov", in: 65, out: 55 },
                { m: "Dez", in: 80, out: 70 },
                { m: "Jan", in: 55, out: 45 },
                { m: "Fev", in: 90, out: 60 },
                { m: "Mar", in: 70, out: 50 },
                { m: "Abr", in: 100, out: 45 },
              ].map((bar) => (
                <div key={bar.m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{ width: "100%", display: "flex", gap: 2, alignItems: "flex-end", height: 48 }}>
                    <div style={{ flex: 1, background: "#D1FAE5", borderRadius: "3px 3px 0 0", height: `${bar.in}%` }} />
                    <div style={{ flex: 1, background: "#FEE2E2", borderRadius: "3px 3px 0 0", height: `${bar.out}%` }} />
                  </div>
                  <span style={{ fontSize: 9.5, color: "#9CA3AF" }}>{bar.m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Projects */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Projetos ativos</h3>
            <button style={{ all: "unset", cursor: "pointer" }}>
              <MoreHorizontal size={16} color="#9CA3AF" />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { name: "Redesign do site", progress: 72, status: "Em andamento", color: "#3B82F6" },
              { name: "Campanha Q2", progress: 45, status: "Em andamento", color: "#F59E0B" },
              { name: "App mobile v2", progress: 18, status: "Atrasado", color: "#EF4444" },
            ].map((proj) => (
              <div key={proj.name} style={{ padding: "10px", background: "#F8FAFC", borderRadius: 9, border: "1px solid #F3F4F6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{proj.name}</span>
                  <span
                    style={{
                      fontSize: 11, fontWeight: 600,
                      color: proj.status === "Atrasado" ? "#EF4444" : "#4B5563",
                    }}
                  >
                    {proj.progress}%
                  </span>
                </div>
                <div style={{ height: 5, background: "#E5E7EB", borderRadius: 99 }}>
                  <div
                    style={{
                      height: "100%", borderRadius: 99,
                      background: proj.color,
                      width: `${proj.progress}%`,
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
                <div style={{ marginTop: 5 }}>
                  <span
                    style={{
                      fontSize: 11, fontWeight: 600,
                      padding: "2px 8px", borderRadius: 999,
                      background: proj.status === "Atrasado" ? "#FEE2E2" : "#DBEAFE",
                      color: proj.status === "Atrasado" ? "#991B1B" : "#1E40AF",
                    }}
                  >
                    {proj.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick notes */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Anotações rápidas</h3>
            <button
              style={{
                all: "unset", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 12, fontWeight: 600, color: "#F59E0B",
              }}
            >
              <Plus size={12} /> Nova
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {notes.map((note) => (
              <div
                key={note.id}
                style={{
                  padding: "10px 12px", borderRadius: 9,
                  background: note.color,
                  border: "1px solid rgba(0,0,0,0.05)",
                  cursor: "pointer",
                  transition: "transform 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateX(2px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateX(0)"; }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#374151", marginBottom: 3 }}>
                  {note.title}
                </div>
                <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {note.preview}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── PLACEHOLDER MODULE ── */
function PlaceholderModule({ icon, title, description, color, bg }: {
  icon: React.ReactNode; title: string; description: string; color: string; bg: string;
}) {
  return (
    <div
      style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 40,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <div
          style={{
            width: 64, height: 64, borderRadius: 18,
            background: bg, color: color,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", fontSize: 28,
          }}
        >
          {icon}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 10, letterSpacing: "-0.01em" }}>
          {title}
        </h2>
        <p style={{ fontSize: 14.5, color: "#6B7280", lineHeight: 1.7, marginBottom: 28 }}>
          {description}
        </p>
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 10,
            background: "#FEF3C7", color: "#92400E",
            fontSize: 13.5, fontWeight: 600,
          }}
        >
          <Zap size={14} color="#F59E0B" />
          Módulo em construção
        </div>
        <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 16 }}>
          Esta funcionalidade estará disponível em breve na plataforma.
        </p>
      </div>
    </div>
  );
}

/* ── SETTINGS MODULE ── */
function SettingsModule() {
  return (
    <div style={{ padding: 24, maxWidth: 640 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Configurações</h2>
      <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 28 }}>Gerencie suas preferências de conta e plataforma.</p>

      {/* Profile card */}
      <div className="card" style={{ padding: "24px", marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Perfil</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div
            style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "linear-gradient(135deg,#FBBF24,#EA580C)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 700, color: "#fff", flexShrink: 0,
            }}
          >
            M
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Maria Silva</div>
            <div style={{ fontSize: 13, color: "#6B7280" }}>maria@exemplo.com</div>
            <span className="badge badge-amber" style={{ fontSize: 11, marginTop: 4 }}>Plano Pro</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Nome", placeholder: "Maria Silva" },
            { label: "E-mail", placeholder: "maria@exemplo.com" },
          ].map((f) => (
            <div key={f.label}>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                {f.label}
              </label>
              <input
                type="text"
                className="input-base"
                defaultValue={f.placeholder}
                style={{ fontSize: 13.5 }}
              />
            </div>
          ))}
        </div>
        <button className="btn-primary" style={{ marginTop: 16, fontSize: 13.5, padding: "10px 20px" }}>
          Salvar alterações
        </button>
      </div>

      {/* Security card */}
      <div className="card" style={{ padding: "24px", marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Segurança</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {["Senha atual", "Nova senha", "Confirmar nova senha"].map((label) => (
            <div key={label}>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                {label}
              </label>
              <input type="password" className="input-base" placeholder="••••••••" style={{ fontSize: 13.5 }} />
            </div>
          ))}
        </div>
        <button className="btn-secondary" style={{ marginTop: 16, fontSize: 13.5, padding: "10px 20px" }}>
          Alterar senha
        </button>
      </div>

      {/* Danger zone */}
      <div className="card" style={{ padding: "20px", border: "1px solid #FEE2E2" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <AlertCircle size={15} color="#EF4444" />
          <h3 style={{ fontSize: 13.5, fontWeight: 700, color: "#991B1B" }}>Zona de perigo</h3>
        </div>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 14 }}>
          Ações irreversíveis. Tenha cuidado ao prosseguir.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            style={{
              all: "unset", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 16px", borderRadius: 9,
              background: "#FEF2F2", border: "1.5px solid #FEE2E2",
              color: "#EF4444", fontSize: 13, fontWeight: 600,
            }}
          >
            <LogOut size={14} />
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── MODULE MAP ── */
const MODULE_CONFIG: Record<Module, { title: string; content: React.ReactNode }> = {
  dashboard: {
    title: "Dashboard",
    content: <DashboardHome />,
  },
  tasks: {
    title: "Tarefas",
    content: (
      <PlaceholderModule
        icon={<CheckCircle2 size={28} />}
        title="Módulo de Tarefas"
        description="Gerencie suas tarefas, defina prioridades, prazos e acompanhe o progresso em tempo real. Tudo organizado de forma clara."
        color="#F59E0B"
        bg="#FEF3C7"
      />
    ),
  },
  finance: {
    title: "Financeiro",
    content: (
      <PlaceholderModule
        icon={<Wallet size={28} />}
        title="Módulo Financeiro"
        description="Registre entradas e saídas, categorize seus gastos e tenha uma visão clara da sua saúde financeira mensal e anual."
        color="#10B981"
        bg="#D1FAE5"
      />
    ),
  },
  projects: {
    title: "Projetos",
    content: (
      <PlaceholderModule
        icon={<FolderKanban size={28} />}
        title="Módulo de Projetos"
        description="Organize seus projetos pessoais e profissionais com status, progresso e marcos. Tudo em uma visão centralizada."
        color="#3B82F6"
        bg="#DBEAFE"
      />
    ),
  },
  notes: {
    title: "Anotações",
    content: (
      <PlaceholderModule
        icon={<StickyNote size={28} />}
        title="Módulo de Anotações"
        description="Capture ideias, listas e notas rapidamente. Organize seu pensamento sem complicação — simples e acessível."
        color="#8B5CF6"
        bg="#EDE9FE"
      />
    ),
  },
  settings: {
    title: "Configurações",
    content: <SettingsModule />,
  },
};

/* ── MAIN DASHBOARD PAGE ── */
export default function AppPage() {
  const [activeModule, setActiveModule] = useState<Module>("dashboard");
  const config = MODULE_CONFIG[activeModule];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "DM Sans, sans-serif" }}>
      <Sidebar active={activeModule} onNavigate={setActiveModule} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowY: "auto" }}>
        <TopBar title={config.title} />
        <main style={{ flex: 1 }}>
          {config.content}
        </main>
      </div>
    </div>
  );
}
