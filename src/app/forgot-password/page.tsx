"use client";

import Link from "next/link";
import { useState } from "react";
import { LayoutDashboard, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1400);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      {/* Decorative blobs */}
      <div
        style={{
          position: "fixed", top: -100, left: -100,
          width: 400, height: 400,
          background: "radial-gradient(circle, rgba(251,191,36,0.1) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed", bottom: -80, right: -80,
          width: 320, height: 320,
          background: "radial-gradient(circle, rgba(234,88,12,0.08) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%", maxWidth: 420,
          background: "#FFFFFF", borderRadius: 20,
          border: "1px solid #E5E7EB",
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          padding: "40px 36px",
          position: "relative", zIndex: 1,
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 9, marginBottom: 36 }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: 9,
              background: "linear-gradient(135deg,#FBBF24 0%,#EA580C 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 3px 10px rgba(245,158,11,0.3)",
            }}
          >
            <LayoutDashboard size={15} color="#fff" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
            Organização Fácil
          </span>
        </Link>

        {!sent ? (
          <>
            {/* Icon */}
            <div
              style={{
                width: 52, height: 52, borderRadius: 14,
                background: "#FEF3C7",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <Mail size={24} color="#F59E0B" />
            </div>

            <h1
              style={{
                fontSize: 22, fontWeight: 800, color: "#111827",
                letterSpacing: "-0.02em", marginBottom: 8,
              }}
            >
              Recuperar senha
            </h1>
            <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 28, lineHeight: 1.6 }}>
              Informe o e-mail cadastrado e enviaremos um link para você criar uma nova senha.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "#374151", marginBottom: 7 }}>
                  E-mail cadastrado
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={15}
                    style={{
                      position: "absolute", left: 13, top: "50%",
                      transform: "translateY(-50%)", color: "#9CA3AF",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    type="email"
                    className="input-base"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ paddingLeft: 36 }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{
                  width: "100%", padding: "13px",
                  fontSize: 14.5, marginTop: 4,
                  opacity: loading ? 0.8 : 1,
                }}
              >
                {loading ? (
                  <>
                    <span
                      style={{
                        display: "inline-block", width: 14, height: 14,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff", borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                      }}
                    />
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviar link de recuperação
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Success state */
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "#D1FAE5",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <CheckCircle2 size={28} color="#10B981" />
            </div>
            <h2
              style={{
                fontSize: 22, fontWeight: 800, color: "#111827",
                letterSpacing: "-0.02em", marginBottom: 10,
              }}
            >
              E-mail enviado!
            </h2>
            <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, marginBottom: 8 }}>
              Enviamos um link de recuperação para
            </p>
            <p
              style={{
                fontSize: 14, fontWeight: 700, color: "#111827",
                marginBottom: 24,
                background: "#F3F4F6", padding: "8px 16px",
                borderRadius: 8, display: "inline-block",
              }}
            >
              {email}
            </p>
            <p style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.6, marginBottom: 28 }}>
              Verifique também sua caixa de spam. O link expira em 15 minutos.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 13, color: "#6B7280", textDecoration: "underline",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              Usar outro e-mail
            </button>
          </div>
        )}

        {/* Back to login */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid #F3F4F6" }}>
          <Link
            href="/login"
            style={{
              display: "flex", alignItems: "center", gap: 6, justifyContent: "center",
              fontSize: 13.5, color: "#4B5563", fontWeight: 600, textDecoration: "none",
              transition: "color 0.15s",
            }}
          >
            <ArrowLeft size={14} />
            Voltar para o login
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
