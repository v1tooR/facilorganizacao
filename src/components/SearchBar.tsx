"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search, CheckCircle2, FolderKanban, StickyNote,
  Wallet, X, ArrowRight,
} from "lucide-react";
import type { SearchResultItem } from "@/app/api/search/route";

type Module = "dashboard" | "tasks" | "finance" | "projects" | "notes" | "settings";

interface SearchResults {
  tasks: SearchResultItem[];
  projects: SearchResultItem[];
  notes: SearchResultItem[];
  finance: SearchResultItem[];
}

// ── Configuração visual por tipo ─────────────────────────────────────────────

const TYPE_CFG = {
  task:    { label: "Tarefas",    Icon: CheckCircle2,  color: "#F59E0B", bg: "#FEF3C7" },
  project: { label: "Projetos",   Icon: FolderKanban,  color: "#3B82F6", bg: "#DBEAFE" },
  note:    { label: "Anotações",  Icon: StickyNote,    color: "#8B5CF6", bg: "#EDE9FE" },
  finance: { label: "Financeiro", Icon: Wallet,        color: "#10B981", bg: "#D1FAE5" },
} as const;

// ── SearchBar ────────────────────────────────────────────────────────────────

export default function SearchBar({ onNavigate }: { onNavigate: (m: Module) => void }) {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const [cursor, setCursor]   = useState(-1);
  const [hasError, setError]  = useState(false);

  const containerRef  = useRef<HTMLDivElement>(null);
  const inputRef      = useRef<HTMLInputElement>(null);
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lista plana de todos os resultados (para navegação por teclado)
  const flat: SearchResultItem[] = results
    ? [...results.tasks, ...results.projects, ...results.notes, ...results.finance]
    : [];

  const hasAny    = flat.length > 0;
  const isEmpty   = results !== null && !hasAny;

  // ── Busca ──────────────────────────────────────────────────────────────────

  const doSearch = useCallback(async (q: string) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) { setError(true); return; }
      const data = await res.json();
      setResults(data.results);
      setOpen(true);
      setCursor(-1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.trim().length < 2) {
      setResults(null);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true); // mostra spinner imediatamente
    debounceRef.current = setTimeout(() => doSearch(q.trim()), 300);
  };

  const clear = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery("");
    setResults(null);
    setOpen(false);
    setLoading(false);
    setCursor(-1);
    inputRef.current?.focus();
  };

  // ── Seleção de resultado ────────────────────────────────────────────────────

  const handleSelect = (item: SearchResultItem) => {
    onNavigate(item.module as Module);
    clear();
    inputRef.current?.blur();
  };

  // ── Teclado: ↑ ↓ Enter Esc ────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setCursor(-1);
      inputRef.current?.blur();
      return;
    }
    if (!open || flat.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" && cursor >= 0 && flat[cursor]) {
      e.preventDefault();
      handleSelect(flat[cursor]);
    }
  };

  // ── Click-outside ──────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCursor(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Renderiza um grupo de resultados ───────────────────────────────────────

  let flatIdx = 0;

  const renderGroup = (items: SearchResultItem[], type: keyof typeof TYPE_CFG) => {
    if (!items.length) return null;
    const { label, Icon, color, bg } = TYPE_CFG[type];

    return (
      <div key={type}>
        {/* Cabeçalho do grupo */}
        <div style={{
          padding: "8px 14px 3px",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={9} color={color} />
          </div>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {label}
          </span>
        </div>

        {/* Itens */}
        {items.map((item) => {
          const myIdx    = flatIdx++;
          const isActive = cursor === myIdx;

          return (
            <div key={item.id}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
              onMouseEnter={() => setCursor(myIdx)}
              style={{
                padding: "8px 14px",
                cursor: "pointer",
                background: isActive ? "#FFFBEB" : "transparent",
                borderLeft: `2.5px solid ${isActive ? "#F59E0B" : "transparent"}`,
                display: "flex", alignItems: "center", gap: 10,
                transition: "background 0.08s",
              }}
            >
              {/* Ícone */}
              <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={14} color={color} />
              </div>

              {/* Texto */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1F2937", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.title}
                </div>
                {item.subtitle && (
                  <div style={{ fontSize: 11.5, color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>
                    {item.subtitle}
                  </div>
                )}
              </div>

              {/* Meta */}
              {item.meta && (
                <span style={{ fontSize: 10.5, color: "#9CA3AF", flexShrink: 0, fontWeight: 500, textAlign: "right", maxWidth: 100, lineHeight: 1.3 }}>
                  {item.meta}
                </span>
              )}

              {isActive && <ArrowRight size={13} color="#F59E0B" style={{ flexShrink: 0 }} />}
            </div>
          );
        })}
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} style={{ position: "relative" }}>

      {/* Input */}
      <div style={{ position: "relative" }}>
        {/* Ícone / spinner */}
        {loading ? (
          <div style={{
            position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
            width: 13, height: 13,
            border: "2px solid #F59E0B", borderTopColor: "transparent",
            borderRadius: "50%", animation: "sb-spin 0.7s linear infinite",
          }} />
        ) : (
          <Search size={14} style={{
            position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
            color: open ? "#F59E0B" : "#9CA3AF",
            pointerEvents: "none", transition: "color 0.15s",
          }} />
        )}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results && flat.length > 0) setOpen(true); }}
          placeholder="Buscar tarefas, projetos, notas..."
          autoComplete="off"
          style={{
            padding: "7px 28px 7px 32px",
            background: open ? "#fff" : "#F3F4F6",
            border: `1.5px solid ${open ? "#F59E0B" : "transparent"}`,
            borderRadius: 9,
            fontSize: 13,
            color: "#374151",
            outline: "none",
            width: 250,
            fontFamily: "inherit",
            transition: "border-color 0.2s, background 0.2s",
          }}
        />

        {/* Botão limpar */}
        {query && (
          <button
            onMouseDown={(e) => { e.preventDefault(); clear(); }}
            style={{
              all: "unset", cursor: "pointer",
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              color: "#9CA3AF", display: "flex", padding: 2,
              borderRadius: 4,
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          width: 380, background: "#fff",
          borderRadius: 14, border: "1px solid #E5E7EB",
          boxShadow: "0 12px 40px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.06)",
          zIndex: 300, overflow: "hidden",
        }}>

          {/* Cabeçalho do dropdown */}
          <div style={{
            padding: "9px 14px", borderBottom: "1px solid #F3F4F6",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 11.5, color: "#9CA3AF" }}>
              {loading
                ? "Buscando..."
                : hasAny
                  ? `${flat.length} resultado${flat.length !== 1 ? "s" : ""} para "${query}"`
                  : " "}
            </span>
            <span style={{ fontSize: 10.5, color: "#D1D5DB" }}>ESC para fechar</span>
          </div>

          {/* Corpo */}
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {/* Loading skeleton */}
            {loading && !results && (
              <div style={{ padding: "28px 0", textAlign: "center" }}>
                <div style={{
                  width: 20, height: 20, border: "2px solid #F59E0B", borderTopColor: "transparent",
                  borderRadius: "50%", animation: "sb-spin 0.7s linear infinite",
                  margin: "0 auto 8px",
                }} />
                <div style={{ fontSize: 13, color: "#9CA3AF" }}>Buscando...</div>
              </div>
            )}

            {/* Empty state */}
            {isEmpty && !loading && !hasError && (
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <Search size={30} color="#E5E7EB" style={{ marginBottom: 10 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: "#6B7280" }}>
                  Nenhum resultado para &quot;{query}&quot;
                </div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
                  Tente outros termos ou verifique a ortografia
                </div>
              </div>
            )}

            {/* Erro */}
            {hasError && (
              <div style={{ padding: "24px 0", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "#EF4444" }}>
                  Erro ao buscar. Tente novamente.
                </div>
              </div>
            )}

            {/* Resultados agrupados */}
            {results && !loading && !hasError && (() => {
              flatIdx = 0; // reset do índice antes de renderizar grupos
              return (
                <>
                  {renderGroup(results.tasks,    "task")}
                  {renderGroup(results.projects, "project")}
                  {renderGroup(results.notes,    "note")}
                  {renderGroup(results.finance,  "finance")}
                </>
              );
            })()}
          </div>

          {/* Rodapé com atalhos de teclado */}
          {hasAny && (
            <div style={{
              padding: "7px 14px", borderTop: "1px solid #F3F4F6",
              display: "flex", gap: 14,
            }}>
              {[["↑↓", "navegar"], ["↵", "abrir"], ["ESC", "fechar"]].map(([key, desc]) => (
                <span key={key} style={{ fontSize: 10.5, color: "#C4C4C4", display: "flex", gap: 4, alignItems: "center" }}>
                  <kbd style={{ background: "#F3F4F6", padding: "1px 5px", borderRadius: 4, fontFamily: "inherit", fontSize: 10 }}>{key}</kbd>
                  {desc}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes sb-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
