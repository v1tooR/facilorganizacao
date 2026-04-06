"use client";

import Link from "next/link";
import {
  CheckCircle2,
  LayoutDashboard,
  Wallet,
  FolderKanban,
  StickyNote,
  ArrowRight,
  MessageCircle,
  TrendingUp,
  Clock,
  Zap,
  Shield,
  Star,
  ChevronRight,
} from "lucide-react";

/* ─────────────────────────────────────────────
   DASHBOARD MOCKUP — CSS/JSX real components
───────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div
      className="animate-float"
      style={{
        width: "100%",
        maxWidth: 720,
        borderRadius: 20,
        overflow: "hidden",
        boxShadow:
          "0 32px 80px 0 rgba(0,0,0,0.18), 0 8px 24px 0 rgba(0,0,0,0.1)",
        border: "1px solid #E5E7EB",
        background: "#F8FAFC",
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      {/* Window bar */}
      <div
        style={{
          background: "#F3F4F6",
          borderBottom: "1px solid #E5E7EB",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#EF4444" }} />
        <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#F59E0B" }} />
        <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#10B981" }} />
        <div
          style={{
            flex: 1, marginLeft: 12, background: "#E5E7EB",
            borderRadius: 6, height: 22,
            display: "flex", alignItems: "center",
            paddingLeft: 10, fontSize: 11, color: "#9CA3AF",
          }}
        >
          app.organizacaofacil.com.br
        </div>
      </div>

      {/* App shell */}
      <div style={{ display: "flex", height: 420 }}>
        {/* Sidebar */}
        <div
          style={{
            width: 188,
            background: "#FFFFFF",
            borderRight: "1px solid #E5E7EB",
            padding: "16px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            flexShrink: 0,
          }}
        >
          {/* Logo */}
          <div style={{ padding: "4px 8px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28, height: 28, borderRadius: 8,
                background: "linear-gradient(135deg,#FBBF24,#EA580C)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <LayoutDashboard size={14} color="#fff" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>Org. Fácil</span>
          </div>

          {[
            { icon: <LayoutDashboard size={14} />, label: "Dashboard", active: true },
            { icon: <CheckCircle2 size={14} />, label: "Tarefas" },
            { icon: <Wallet size={14} />, label: "Financeiro" },
            { icon: <FolderKanban size={14} />, label: "Projetos" },
            { icon: <StickyNote size={14} />, label: "Anotações" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "7px 10px", borderRadius: 8,
                background: item.active ? "#FEF3C7" : "transparent",
                color: item.active ? "#92400E" : "#4B5563",
                fontSize: 12, fontWeight: 500, cursor: "pointer",
              }}
            >
              <span style={{ color: item.active ? "#F59E0B" : "#6B7280" }}>{item.icon}</span>
              {item.label}
            </div>
          ))}

          <div style={{ flex: 1 }} />
          <div
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 10px",
              background: "#F8FAFC", borderRadius: 8, marginTop: 8,
            }}
          >
            <div
              style={{
                width: 24, height: 24, borderRadius: "50%",
                background: "linear-gradient(135deg,#FBBF24,#EA580C)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0,
              }}
            >
              M
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#111827", lineHeight: 1.2 }}>Maria S.</div>
              <div style={{ fontSize: 10, color: "#9CA3AF" }}>Plano Pro</div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: "16px 16px", overflowY: "auto", background: "#F8FAFC" }}>
          {/* Top bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Bom dia, Maria 👋</div>
              <div style={{ fontSize: 10, color: "#6B7280" }}>Sábado, 5 de abril de 2026</div>
            </div>
            <div
              style={{
                background: "#FFFFFF", border: "1px solid #E5E7EB",
                borderRadius: 8, padding: "5px 10px",
                fontSize: 10, color: "#6B7280", display: "flex",
                alignItems: "center", gap: 5,
              }}
            >
              <div
                style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981" }}
              />
              Online
            </div>
          </div>

          {/* KPI cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
            {[
              { label: "Tarefas hoje", value: "8", sub: "3 concluídas", color: "#F59E0B" },
              { label: "Saldo mensal", value: "R$ 4.2k", sub: "+12% este mês", color: "#10B981" },
              { label: "Projetos", value: "5", sub: "2 em andamento", color: "#3B82F6" },
            ].map((kpi) => (
              <div
                key={kpi.label}
                style={{
                  background: "#FFFFFF", borderRadius: 10,
                  border: "1px solid #E5E7EB",
                  padding: "10px 11px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ fontSize: 9, color: "#6B7280", marginBottom: 4, fontWeight: 500 }}>
                  {kpi.label}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: kpi.color, lineHeight: 1 }}>
                  {kpi.value}
                </div>
                <div style={{ fontSize: 9, color: "#9CA3AF", marginTop: 3 }}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* Two columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {/* Tasks */}
            <div
              style={{
                background: "#FFFFFF", borderRadius: 10,
                border: "1px solid #E5E7EB", padding: "10px 12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  fontSize: 10, fontWeight: 700, color: "#111827",
                  marginBottom: 8, display: "flex",
                  justifyContent: "space-between", alignItems: "center",
                }}
              >
                Tarefas pendentes
                <span style={{ fontSize: 9, color: "#F59E0B", fontWeight: 600 }}>Ver tudo →</span>
              </div>
              {[
                { task: "Revisar relatório Q2", priority: "Alta", done: false },
                { task: "Reunião com equipe", priority: "Média", done: true },
                { task: "Pagar fornecedor", priority: "Alta", done: false },
              ].map((t) => (
                <div
                  key={t.task}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "5px 0", borderBottom: "1px solid #F3F4F6",
                  }}
                >
                  <div
                    style={{
                      width: 13, height: 13, borderRadius: "50%",
                      border: t.done ? "none" : "1.5px solid #D1D5DB",
                      background: t.done ? "#10B981" : "transparent",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10, color: t.done ? "#9CA3AF" : "#374151",
                      textDecoration: t.done ? "line-through" : "none",
                      flex: 1, fontWeight: 500,
                    }}
                  >
                    {t.task}
                  </span>
                  <span
                    style={{
                      fontSize: 9, fontWeight: 600, padding: "2px 6px",
                      borderRadius: 999,
                      background: t.priority === "Alta" ? "#FEE2E2" : "#FEF3C7",
                      color: t.priority === "Alta" ? "#991B1B" : "#92400E",
                    }}
                  >
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>

            {/* Finance mini chart */}
            <div
              style={{
                background: "#FFFFFF", borderRadius: 10,
                border: "1px solid #E5E7EB", padding: "10px 12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  fontSize: 10, fontWeight: 700, color: "#111827",
                  marginBottom: 8, display: "flex",
                  justifyContent: "space-between", alignItems: "center",
                }}
              >
                Visão financeira
                <span style={{ fontSize: 9, color: "#F59E0B", fontWeight: 600 }}>Abr 2026</span>
              </div>

              {/* Mini bar chart */}
              <div
                style={{
                  display: "flex", gap: 5, alignItems: "flex-end",
                  height: 52, marginBottom: 8,
                }}
              >
                {[
                  { h: 65, c: "#FDE68A", label: "Jan" },
                  { h: 80, c: "#FBBF24", label: "Fev" },
                  { h: 55, c: "#FDE68A", label: "Mar" },
                  { h: 90, c: "#F59E0B", label: "Abr" },
                  { h: 70, c: "#FDE68A", label: "Mai" },
                  { h: 45, c: "#FDE68A", label: "Jun" },
                ].map((bar) => (
                  <div key={bar.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <div
                      style={{
                        width: "100%", height: `${bar.h}%`,
                        background: bar.c, borderRadius: "4px 4px 0 0",
                      }}
                    />
                    <span style={{ fontSize: 8, color: "#9CA3AF" }}>{bar.label}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 9, color: "#6B7280" }}>Entradas</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#10B981" }}>R$ 7.500</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#6B7280" }}>Saídas</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#EF4444" }}>R$ 3.280</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#6B7280" }}>Saldo</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>R$ 4.220</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LANDING PAGE
───────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      {/* ── HEADER ── */}
      <header
        style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(248,250,252,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        <div
          style={{
            maxWidth: 1120, margin: "0 auto",
            padding: "0 24px",
            height: 62,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: "linear-gradient(135deg,#FBBF24 0%,#EA580C 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(245,158,11,0.3)",
              }}
            >
              <LayoutDashboard size={16} color="#fff" />
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
              Organização Fácil
            </span>
          </div>

          {/* Nav actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a
              href="mailto:contato@organizacaofacil.com.br"
              className="btn-secondary"
              style={{ fontSize: 13, padding: "8px 16px" }}
            >
              <MessageCircle size={14} />
              Falar com a gente
            </a>
            <Link href="/login" className="btn-primary" style={{ fontSize: 13, padding: "8px 16px" }}>
              Acessar plataforma
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section
        style={{
          maxWidth: 1120, margin: "0 auto",
          padding: "80px 24px 60px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.1fr",
            gap: 64,
            alignItems: "center",
          }}
          className="hero-grid-responsive"
        >
          {/* Left — Copy */}
          <div>
            <div
              className="animate-fade-up badge badge-amber"
              style={{ marginBottom: 20, fontSize: 12 }}
            >
              <Star size={11} />
              Centro Operacional Pessoal e Profissional
            </div>

            <h1
              className="animate-fade-up delay-100"
              style={{
                fontSize: "clamp(32px, 4vw, 52px)",
                fontWeight: 800,
                lineHeight: 1.12,
                color: "#111827",
                letterSpacing: "-0.02em",
                marginBottom: 20,
              }}
            >
              Tudo organizado.{" "}
              <span className="text-brand-gradient">Tudo no controle.</span>
            </h1>

            <p
              className="animate-fade-up delay-200"
              style={{
                fontSize: 17,
                color: "#4B5563",
                lineHeight: 1.7,
                marginBottom: 32,
                maxWidth: 440,
              }}
            >
              Centralize tarefas, finanças, projetos e anotações em um único
              sistema leve, claro e modular. Sua vida pessoal e profissional
              sincronizadas com clareza real.
            </p>

            <div
              className="animate-fade-up delay-300"
              style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}
            >
              <a
                href="mailto:contato@organizacaofacil.com.br"
                className="btn-primary"
              >
                <MessageCircle size={16} />
                Entrar em contato
              </a>
              <Link href="/login" className="btn-secondary">
                Acessar plataforma
                <ChevronRight size={15} />
              </Link>
            </div>

            {/* Social proof */}
            <div
              className="animate-fade-up delay-400"
              style={{ display: "flex", alignItems: "center", gap: 16 }}
            >
              <div style={{ display: "flex" }}>
                {["#FBBF24", "#F59E0B", "#EA580C"].map((c, i) => (
                  <div
                    key={i}
                    style={{
                      width: 30, height: 30, borderRadius: "50%",
                      background: c,
                      border: "2px solid #fff",
                      marginLeft: i > 0 ? -8 : 0,
                    }}
                  />
                ))}
              </div>
              <div>
                <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={11} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>
                <p style={{ fontSize: 12, color: "#6B7280" }}>
                  Usado por +200 profissionais
                </p>
              </div>
            </div>
          </div>

          {/* Right — Dashboard mockup */}
          <div
            className="animate-fade-up delay-200"
            style={{ position: "relative" }}
          >
            {/* Decorative blur blob */}
            <div
              style={{
                position: "absolute",
                top: -40, right: -40, width: 280, height: 280,
                background: "radial-gradient(circle, rgba(251,191,36,0.18) 0%, transparent 70%)",
                borderRadius: "50%",
                zIndex: 0, pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section
        style={{
          background: "#FFFFFF",
          borderTop: "1px solid #E5E7EB",
          borderBottom: "1px solid #E5E7EB",
          padding: "72px 24px",
        }}
      >
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p
              className="badge badge-amber"
              style={{ margin: "0 auto 14px", fontSize: 12, display: "inline-flex" }}
            >
              <Zap size={11} />
              Por que Organização Fácil?
            </p>
            <h2
              style={{
                fontSize: "clamp(24px, 3vw, 38px)",
                fontWeight: 800,
                color: "#111827",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              Um sistema feito para funcionar
            </h2>
            <p style={{ fontSize: 16, color: "#4B5563", marginTop: 12, maxWidth: 520, margin: "12px auto 0" }}>
              Chega de apps espalhados. Tudo que você precisa para organizar
              sua rotina, em um só lugar.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 20,
            }}
          >
            {[
              {
                icon: <CheckCircle2 size={22} />,
                color: "#F59E0B",
                bg: "#FEF3C7",
                title: "Tarefas organizadas",
                desc: "Priorize, categorize e acompanhe suas tarefas com clareza. Nunca mais esqueça o que precisa ser feito.",
              },
              {
                icon: <Wallet size={22} />,
                color: "#10B981",
                bg: "#D1FAE5",
                title: "Finanças centralizadas",
                desc: "Entradas, saídas e saldo em uma visão clara. Controle financeiro sem complicação.",
              },
              {
                icon: <FolderKanban size={22} />,
                color: "#3B82F6",
                bg: "#DBEAFE",
                title: "Projetos e rotina",
                desc: "Gerencie seus projetos pessoais e profissionais no mesmo ambiente. Tudo conectado.",
              },
              {
                icon: <TrendingUp size={22} />,
                color: "#8B5CF6",
                bg: "#EDE9FE",
                title: "Visão operacional",
                desc: "Dashboard com resumo real do seu dia, semana e mês. Tome decisões com dados claros.",
              },
              {
                icon: <Clock size={22} />,
                color: "#EA580C",
                bg: "#FED7AA",
                title: "Rotina simplificada",
                desc: "Anotações rápidas, lembretes e atalhos para o que importa no seu dia a dia.",
              },
              {
                icon: <Shield size={22} />,
                color: "#0EA5E9",
                bg: "#E0F2FE",
                title: "Seus dados, só seus",
                desc: "Cada usuário tem seu próprio espaço seguro. Privacidade e segurança desde o início.",
              },
            ].map((benefit) => (
              <div
                key={benefit.title}
                className="card"
                style={{
                  padding: "24px 22px",
                  transition: "box-shadow 0.2s, transform 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 8px 24px rgba(0,0,0,0.1)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 1px 3px rgba(0,0,0,0.06)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: benefit.bg, color: benefit.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  {benefit.icon}
                </div>
                <h3
                  style={{
                    fontSize: 15, fontWeight: 700, color: "#111827",
                    marginBottom: 8, lineHeight: 1.3,
                  }}
                >
                  {benefit.title}
                </h3>
                <p style={{ fontSize: 13.5, color: "#4B5563", lineHeight: 1.6 }}>
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODULES PREVIEW ── */}
      <section style={{ padding: "72px 24px", maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2
            style={{
              fontSize: "clamp(22px, 3vw, 34px)",
              fontWeight: 800, color: "#111827",
              letterSpacing: "-0.02em", marginBottom: 12,
            }}
          >
            Módulos que funcionam juntos
          </h2>
          <p style={{ fontSize: 15.5, color: "#4B5563", maxWidth: 480, margin: "0 auto" }}>
            Cada área do sistema é um módulo independente que se conecta ao
            seu centro operacional.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {[
            { icon: <LayoutDashboard size={18} />, label: "Dashboard", desc: "Visão geral do seu dia", color: "#F59E0B", bg: "#FEF3C7" },
            { icon: <CheckCircle2 size={18} />, label: "Tarefas", desc: "Pendências e prioridades", color: "#10B981", bg: "#D1FAE5" },
            { icon: <Wallet size={18} />, label: "Financeiro", desc: "Controle de entradas e saídas", color: "#3B82F6", bg: "#DBEAFE" },
            { icon: <FolderKanban size={18} />, label: "Projetos", desc: "Status e progresso", color: "#8B5CF6", bg: "#EDE9FE" },
            { icon: <StickyNote size={18} />, label: "Anotações", desc: "Notas e ideias rápidas", color: "#EA580C", bg: "#FED7AA" },
          ].map((mod) => (
            <div
              key={mod.label}
              style={{
                background: "#FFFFFF", border: "1px solid #E5E7EB",
                borderRadius: 14, padding: "20px 18px",
                display: "flex", flexDirection: "column", gap: 10,
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                transition: "box-shadow 0.2s, transform 0.2s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 20px rgba(0,0,0,0.09)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
              }}
            >
              <div
                style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: mod.bg, color: mod.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {mod.icon}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 3 }}>
                  {mod.label}
                </div>
                <div style={{ fontSize: 12.5, color: "#6B7280" }}>{mod.desc}</div>
              </div>
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: 11.5, color: mod.color, fontWeight: 600, marginTop: "auto",
                }}
              >
                Em breve completo <ChevronRight size={12} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section
        style={{
          background: "linear-gradient(135deg, #111827 0%, #1F2937 100%)",
          padding: "72px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 640, margin: "0 auto", textAlign: "center",
          }}
        >
          <div
            className="badge badge-amber"
            style={{ margin: "0 auto 20px", display: "inline-flex" }}
          >
            <Zap size={11} />
            Comece agora
          </div>
          <h2
            style={{
              fontSize: "clamp(26px, 4vw, 42px)",
              fontWeight: 800, color: "#FFFFFF",
              letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 16,
            }}
          >
            Pronto para organizar de verdade?
          </h2>
          <p style={{ fontSize: 16, color: "#9CA3AF", marginBottom: 36, lineHeight: 1.6 }}>
            Acesse a plataforma ou fale com a nossa equipe para saber mais.
            Sem complicação, sem enrolação.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" className="btn-primary" style={{ fontSize: 15, padding: "13px 28px" }}>
              Criar minha conta
              <ArrowRight size={16} />
            </Link>
            <a
              href="mailto:contato@organizacaofacil.com.br"
              className="btn-secondary"
              style={{
                fontSize: 15, padding: "13px 28px",
                background: "transparent",
                borderColor: "#374151",
                color: "#D1D5DB",
              }}
            >
              <MessageCircle size={16} />
              Falar com a gente
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          background: "#0F172A",
          padding: "28px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1120, margin: "0 auto",
            display: "flex", justifyContent: "space-between",
            alignItems: "center", flexWrap: "wrap", gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28, height: 28, borderRadius: 8,
                background: "linear-gradient(135deg,#FBBF24,#EA580C)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <LayoutDashboard size={13} color="#fff" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#9CA3AF" }}>
              Organização Fácil
            </span>
          </div>
          <p style={{ fontSize: 12, color: "#4B5563" }}>
            © 2026 Organização Fácil. Todos os direitos reservados.
          </p>
          <div style={{ display: "flex", gap: 20 }}>
            {["Privacidade", "Termos", "Suporte"].map((link) => (
              <a
                key={link}
                href="#"
                style={{ fontSize: 12, color: "#4B5563", textDecoration: "none" }}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 768px) {
          .hero-grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
