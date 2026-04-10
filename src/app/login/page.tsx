"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutDashboard, Eye, EyeOff, ArrowRight, Lock, Mail, CheckCircle2, AlertCircle } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justRegistered, setJustRegistered] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "1") {
      setJustRegistered(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Erro ao entrar. Tente novamente.");
        return;
      }

      // Login bem-sucedido — cookie já foi setado pelo Route Handler
      // O middleware redirecionará automaticamente se o usuário acessar /login novamente
      router.push("/app");
      router.refresh(); // garante que o layout reflita a sessão
    } catch {
      setError("Falha na conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        display: "flex",
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      {/* ── Painel esquerdo — branding ── */}
      <div
        className="auth-panel-hidden"
        style={{
          flex: "0 0 420px",
          background: "linear-gradient(150deg, #1F2937 0%, #111827 60%, #0F172A 100%)",
          padding: "48px 40px",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: -80, left: -80, width: 300, height: 300, background: "radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, right: -60, width: 240, height: 240, background: "radial-gradient(circle, rgba(234,88,12,0.12) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />

        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#FBBF24 0%,#EA580C 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(245,158,11,0.35)" }}>
            <LayoutDashboard size={17} color="#fff" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF" }}>Organização Fácil</span>
        </Link>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.25)", color: "#FBBF24", fontSize: 12, fontWeight: 600, marginBottom: 24, width: "fit-content" }}>
            ✦ Bem-vindo de volta
          </div>

          <h2 style={{ fontSize: 30, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 16 }}>
            Sua organização está esperando por você
          </h2>
          <p style={{ fontSize: 14.5, color: "#9CA3AF", lineHeight: 1.7, marginBottom: 36 }}>
            Acesse sua conta e tenha controle total da sua rotina, finanças e projetos em um só lugar.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Tarefas gerenciadas", value: "+12.000" },
              { label: "Lançamentos financeiros", value: "+38.000" },
              { label: "Usuários ativos", value: "+200" },
            ].map((stat) => (
              <div key={stat.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontSize: 12.5, color: "#9CA3AF" }}>{stat.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#FBBF24" }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 11.5, color: "#374151", position: "relative", zIndex: 1 }}>© 2026 Organização Fácil</p>
      </div>

      {/* ── Formulário ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>

          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", marginBottom: 8 }}>
              Entrar na plataforma
            </h1>
            <p style={{ fontSize: 14.5, color: "#6B7280" }}>
              Não tem uma conta?{" "}
              <Link href="/register" style={{ color: "#D97706", fontWeight: 600, textDecoration: "none" }}>Criar agora</Link>
            </p>
          </div>

          {/* Aviso de cadastro bem-sucedido */}
          {justRegistered && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, marginBottom: 20 }}>
              <CheckCircle2 size={15} color="#16A34A" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, color: "#15803D", fontWeight: 500 }}>
                Conta criada com sucesso! Faça login para entrar.
              </span>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: 10, marginBottom: 20 }}>
              <AlertCircle size={15} color="#EF4444" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, color: "#991B1B", fontWeight: 500 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* E-mail */}
            <div>
              <label style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "#374151", marginBottom: 7 }}>E-mail</label>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
                <input
                  type="email"
                  className="input-base"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  required
                  autoComplete="email"
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "#374151", marginBottom: 7 }}>Senha</label>
              <div style={{ position: "relative" }}>
                <Lock size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-base"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  required
                  autoComplete="current-password"
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", alignItems: "center", padding: 2 }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -6 }}>
              <Link href="/forgot-password" style={{ fontSize: 13, color: "#D97706", fontWeight: 600, textDecoration: "none" }}>
                Esqueci minha senha
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: "100%", padding: "13px", fontSize: 15, marginTop: 4, opacity: loading ? 0.8 : 1 }}
            >
              {loading ? (
                <>
                  <span style={{ display: "inline-block", width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  Entrando...
                </>
              ) : (
                <>Entrar na plataforma <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "28px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
            <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>ou</span>
            <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
          </div>

          <Link href="/register" className="btn-secondary" style={{ width: "100%", justifyContent: "center", fontSize: 14 }}>
            Criar uma conta gratuita
          </Link>

          <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 28, lineHeight: 1.6 }}>
            Ao acessar, você concorda com nossos{" "}
            <a href="#" style={{ color: "#6B7280", textDecoration: "underline" }}>Termos</a>{" "}
            e{" "}
            <a href="#" style={{ color: "#6B7280", textDecoration: "underline" }}>Política de Privacidade</a>.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .auth-panel-hidden { display: none !important; } }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
