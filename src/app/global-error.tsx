"use client";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#F8FAFC",
          color: "#111827",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <section
            style={{
              width: "100%",
              maxWidth: 420,
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              background: "#FFFFFF",
              padding: 24,
              boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
            }}
          >
            <h1 style={{ margin: "0 0 8px", fontSize: 22, lineHeight: 1.2 }}>
              Algo saiu do esperado
            </h1>
            <p style={{ margin: "0 0 20px", color: "#4B5563", fontSize: 14, lineHeight: 1.6 }}>
              Nao foi possivel carregar esta tela agora.
              {error.digest ? ` Codigo: ${error.digest}.` : ""}
            </p>
            <button
              type="button"
              onClick={() => unstable_retry()}
              style={{
                border: 0,
                borderRadius: 8,
                background: "#F59E0B",
                color: "#FFFFFF",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
                padding: "10px 16px",
              }}
            >
              Tentar novamente
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
