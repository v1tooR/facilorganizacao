"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Eye, EyeOff, ArrowRight,
  Lock, Mail, User, CheckCircle2, AlertCircle,
} from "lucide-react";

// ─── Indicador de força de senha ─────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ caracteres", ok: password.length >= 8 },
    { label: "Letra maiúscula", ok: /[A-Z]/.test(password) },
    { label: "Número", ok: /\d/.test(password) },
  ];
  const strength = checks.filter((c) => c.ok).length;
  const colors = ["#EF4444", "#F59E0B", "#10B981"];
  const labels = ["Fraca", "Média", "Forte"];

  if (!password) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 3, borderRadius: 99,
              background: i < strength ? colors[strength - 1] : "#E5E7EB",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 10 }}>
          {checks.map((c) => (
            <span
              key={c.label}
              style={{
                fontSize: 11, fontWeight: 500,
                color: c.ok ? "#10B981" : "#9CA3AF",
                display: "flex", alignItems: "center", gap: 3,
              }}
            >
              <CheckCircle2 size={10} />
              {c.label}
            </span>
          ))}
        </div>
        {strength > 0 && (
          <span style={{ fontSize: 11, fontWeight: 600, color: colors[strength - 1] }}>
            {labels[strength - 1]}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Página de cadastro ───────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError(null);
    setFieldError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldError(null);

    // Validação client-side básica antes de chamar a API
    if (form.password !== form.confirm) {
      setError("As senhas não coincidem.");
      setFieldError("confirm");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Erro ao criar conta. Tente novamente.");
        if (data.field) setFieldError(data.field as string);
        return;
      }

      // Cadastro bem-sucedido
      setSuccess(true);

      // Redireciona para login após 1.5s para o usuário ver a confirmação
      setTimeout(() => {
        router.push("/login?registered=1");
      }, 1500);
    } catch {
      setError("Falha na conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const passwordMatch = form.confirm.length > 0 && form.password === form.confirm;
  const passwordMismatch = form.confirm.length > 0 && form.password !== form.confirm;

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
        <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, background: "radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, background: "radial-gradient(circle, rgba(234,88,12,0.12) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />

        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#FBBF24 0%,#EA580C 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(245,158,11,0.35)" }}>
            <LayoutDashboard size={17} color="#fff" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF" }}>Organização Fácil</span>
        </Link>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.25)", color: "#FBBF24", fontSize: 12, fontWeight: 600, marginBottom: 24, width: "fit-content" }}>
            ✦ Comece agora gratuitamente
          </div>

          <h2 style={{ fontSize: 30, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 16 }}>
            Organize sua vida em menos de 2 minutos
          </h2>
          <p style={{ fontSize: 14.5, color: "#9CA3AF", lineHeight: 1.7, marginBottom: 36 }}>
            Crie sua conta e tenha acesso imediato à plataforma completa de organização pessoal e profissional.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {["Dashboard pessoal e profissional", "Controle financeiro simplificado", "Gestão de tarefas e projetos", "Anotações e lembretes rápidos", "Seus dados seguros e privados"].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckCircle2 size={10} color="#FBBF24" />
                </div>
                <span style={{ fontSize: 13, color: "#D1D5DB" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 11.5, color: "#374151", position: "relative", zIndex: 1 }}>© 2026 Organização Fácil</p>
      </div>

      {/* ── Formulário ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* Success state */}
          {success ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <CheckCircle2 size={28} color="#10B981" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", marginBottom: 10 }}>Conta criada!</h2>
              <p style={{ fontSize: 14.5, color: "#6B7280", lineHeight: 1.6 }}>Redirecionando para o login...</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", marginBottom: 8 }}>Criar sua conta</h1>
                <p style={{ fontSize: 14.5, color: "#6B7280" }}>
                  Já tem uma conta?{" "}
                  <Link href="/login" style={{ color: "#D97706", fontWeight: 600, textDecoration: "none" }}>Entrar agora</Link>
                </p>
              </div>

              {/* Erro global */}
              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: 10, marginBottom: 20 }}>
                  <AlertCircle size={15} color="#EF4444" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13.5, color: "#991B1B", fontWeight: 500 }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {/* Nome */}
                <div>
                  <label style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "#374151", marginBottom: 7 }}>Nome completo</label>
                  <div style={{ position: "relative" }}>
                    <User size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
                    <input
                      type="text"
                      className="input-base"
                      placeholder="Seu nome completo"
                      value={form.name}
                      onChange={handleChange("name")}
                      required
                      autoComplete="name"
                      style={{ paddingLeft: 36, borderColor: fieldError === "name" ? "#EF4444" : undefined }}
                    />
                  </div>
                </div>

                {/* E-mail */}
                <div>
                  <label style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "#374151", marginBottom: 7 }}>E-mail</label>
                  <div style={{ position: "relative" }}>
                    <Mail size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
                    <input
                      type="email"
                      className="input-base"
                      placeholder="seu@email.com"
                      value={form.email}
                      onChange={handleChange("email")}
                      required
                      autoComplete="email"
                      style={{ paddingLeft: 36, borderColor: fieldError === "email" ? "#EF4444" : undefined }}
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
                      placeholder="Crie uma senha segura"
                      value={form.password}
                      onChange={handleChange("password")}
                      required
                      autoComplete="new-password"
                      style={{ paddingLeft: 36, paddingRight: 40 }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", alignItems: "center", padding: 2 }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <PasswordStrength password={form.password} />
                </div>

                {/* Confirmar senha */}
                <div>
                  <label style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "#374151", marginBottom: 7 }}>Confirmar senha</label>
                  <div style={{ position: "relative" }}>
                    <Lock size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: passwordMatch ? "#10B981" : passwordMismatch ? "#EF4444" : "#9CA3AF", pointerEvents: "none" }} />
                    <input
                      type={showConfirm ? "text" : "password"}
                      className="input-base"
                      placeholder="Repita a senha"
                      value={form.confirm}
                      onChange={handleChange("confirm")}
                      required
                      autoComplete="new-password"
                      style={{ paddingLeft: 36, paddingRight: 40, borderColor: passwordMatch ? "#10B981" : passwordMismatch || fieldError === "confirm" ? "#EF4444" : undefined }}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", alignItems: "center", padding: 2 }}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordMismatch && !error && (
                    <p style={{ fontSize: 12, color: "#EF4444", marginTop: 5, fontWeight: 500 }}>As senhas não coincidem.</p>
                  )}
                  {passwordMatch && (
                    <p style={{ fontSize: 12, color: "#10B981", marginTop: 5, fontWeight: 500 }}>Senhas coincidem ✓</p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || !!passwordMismatch}
                  style={{ width: "100%", padding: "13px", fontSize: 15, marginTop: 4, opacity: loading || passwordMismatch ? 0.8 : 1 }}
                >
                  {loading ? (
                    <>
                      <span style={{ display: "inline-block", width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                      Criando conta...
                    </>
                  ) : (
                    <>Criar minha conta <ArrowRight size={16} /></>
                  )}
                </button>
              </form>

              <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 24, lineHeight: 1.6 }}>
                Ao criar sua conta, você concorda com nossos{" "}
                <a href="#" style={{ color: "#6B7280", textDecoration: "underline" }}>Termos de Uso</a>{" "}
                e{" "}
                <a href="#" style={{ color: "#6B7280", textDecoration: "underline" }}>Política de Privacidade</a>.
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .auth-panel-hidden { display: none !important; } }
      `}</style>
    </div>
  );
}
