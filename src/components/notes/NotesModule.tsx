"use client";

/**
 * NotesModule V2
 *
 * Funcionalidades:
 * - Cards clicáveis com hover, tags e indicador de fixado
 * - Seção separada para notas fixadas
 * - Drawer direito com visualização + edição + ações
 * - Fixar / desfixar (com timestamp)
 * - Arquivar / desarquivar (visualização separada)
 * - Tags (JSON array, edição inline no drawer)
 * - Busca client-side por título e conteúdo
 * - Filtro por tag, fixadas, arquivadas
 * - Converter nota em tarefa (com prioridade, prazo e projeto)
 * - Duplicar nota
 * - Vínculo opcional com projeto
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  StickyNote, Plus, Search, Pin, PinOff, Archive, ArchiveRestore,
  Trash2, X, Pencil, FolderKanban, CheckCircle2, AlertCircle, Copy, Check,
} from "lucide-react";
import { PLANS } from "@/lib/plans";

// ── Constants ─────────────────────────────────────────────────────────────────

const NOTE_COLORS = [
  "#FEF3C7", "#D1FAE5", "#DBEAFE", "#EDE9FE",
  "#FCE7F3", "#FEE2E2", "#F3F4F6", "#FFF7ED",
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface Note {
  id: string;
  title: string;
  content: string;
  color: string | null;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  pinnedAt: string | null;
  archivedAt: string | null;
  projectId: string | null;
  project: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface Project { id: string; name: string; }

interface AppUser {
  id: string;
  plan: "FREE" | "PRO" | "BUSINESS";
  planLimits: { notes: number; tasks: number; };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

async function apiCall(url: string, opts?: RequestInit): Promise<{ ok: boolean; data: Record<string, unknown>; status: number }> {
  const r = await fetch(url, opts);
  const text = await r.text();
  let data: Record<string, unknown> = {};
  try { data = text ? JSON.parse(text) : {}; } catch { /* ignore */ }
  return { ok: r.ok, data, status: r.status };
}

// ── ColorPicker ───────────────────────────────────────────────────────────────

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {NOTE_COLORS.map((c) => (
        <button key={c} onClick={() => onChange(c)} style={{
          all: "unset", width: 22, height: 22, borderRadius: "50%",
          background: c, cursor: "pointer",
          border: value === c ? "2.5px solid #374151" : "1.5px solid rgba(0,0,0,0.15)",
          transition: "transform 0.1s",
          transform: value === c ? "scale(1.2)" : "none",
        }} />
      ))}
    </div>
  );
}

// ── TagEditor ─────────────────────────────────────────────────────────────────

function TagEditor({
  tags, onChange,
}: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const t = input.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 10) onChange([...tags, t]);
    setInput("");
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: tags.length > 0 ? 6 : 0 }}>
        {tags.map((tag) => (
          <span key={tag} style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 12, padding: "3px 8px", borderRadius: 20,
            background: "#F3F4F6", color: "#374151", fontWeight: 600,
          }}>
            #{tag}
            <button
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              style={{ all: "unset", cursor: "pointer", color: "#9CA3AF", display: "flex", lineHeight: 1 }}
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <input
        className="input-base"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
        placeholder="Adicionar tag e pressionar Enter"
        style={{ fontSize: 12.5 }}
      />
    </div>
  );
}

// ── NoteCard ──────────────────────────────────────────────────────────────────

function NoteCard({ note, onClick, onPin, onDelete }: {
  note: Note;
  onClick: () => void;
  onPin: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const bg = note.color ?? "#F8FAFC";

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "16px", borderRadius: 12, background: bg,
        border: `1.5px solid ${hovered ? "rgba(0,0,0,0.16)" : "rgba(0,0,0,0.07)"}`,
        position: "relative", minHeight: 130, cursor: "pointer",
        transition: "transform 0.15s, box-shadow 0.15s, border-color 0.15s",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.1)" : "0 1px 4px rgba(0,0,0,0.05)",
        display: "flex", flexDirection: "column", gap: 6,
      }}
    >
      {note.isPinned && (
        <Pin size={11} color="#F59E0B" fill="#F59E0B"
          style={{ position: "absolute", top: 10, left: 10 }} />
      )}

      <div style={{
        position: "absolute", top: 8, right: 8, display: "flex", gap: 3,
        opacity: hovered ? 1 : 0, transition: "opacity 0.15s",
      }}>
        <button onClick={onPin} title={note.isPinned ? "Desfixar" : "Fixar"} style={{
          all: "unset", cursor: "pointer",
          width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 5, background: "rgba(255,255,255,0.85)",
          color: note.isPinned ? "#F59E0B" : "rgba(0,0,0,0.4)",
        }}>
          {note.isPinned ? <PinOff size={11} /> : <Pin size={11} />}
        </button>
        <button onClick={onDelete} title="Excluir" style={{
          all: "unset", cursor: "pointer",
          width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 5, background: "rgba(255,255,255,0.85)", color: "#EF4444",
        }}>
          <Trash2 size={11} />
        </button>
      </div>

      <h4 style={{
        fontSize: 14, fontWeight: 700, color: "#1F2937",
        paddingLeft: note.isPinned ? 18 : 0, paddingRight: 48, lineHeight: 1.4,
      }}>
        {note.title}
      </h4>

      {note.content && (
        <p style={{
          fontSize: 12.5, color: "#4B5563", lineHeight: 1.6,
          overflow: "hidden", maxHeight: 63, flex: 1,
        }}>
          {note.content}
        </p>
      )}

      {note.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 2 }}>
          {note.tags.slice(0, 4).map((tag) => (
            <span key={tag} style={{
              fontSize: 10, fontWeight: 600, padding: "2px 6px",
              borderRadius: 20, background: "rgba(0,0,0,0.09)", color: "#374151",
            }}>
              #{tag}
            </span>
          ))}
          {note.tags.length > 4 && (
            <span style={{ fontSize: 10, color: "rgba(0,0,0,0.35)", padding: "2px 0" }}>
              +{note.tags.length - 4}
            </span>
          )}
        </div>
      )}

      {note.project && (
        <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
          <FolderKanban size={10} color="#6B7280" />
          <span style={{ fontSize: 10.5, color: "#6B7280" }}>{note.project.name}</span>
        </div>
      )}

      <p style={{ fontSize: 10, color: "rgba(0,0,0,0.3)", marginTop: 2 }}>
        {fmtDate(note.updatedAt)}
      </p>
    </div>
  );
}

// ── NoteGrid ──────────────────────────────────────────────────────────────────

function NoteGrid({ notes, onSelect, onPin, onDelete }: {
  notes: Note[];
  onSelect: (n: Note) => void;
  onPin: (e: React.MouseEvent, n: Note) => void;
  onDelete: (e: React.MouseEvent, n: Note) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onClick={() => onSelect(note)}
          onPin={(e) => onPin(e, note)}
          onDelete={(e) => onDelete(e, note)}
        />
      ))}
    </div>
  );
}

// ── CreateNoteModal ───────────────────────────────────────────────────────────

function CreateNoteModal({ projects, onClose, onCreated }: {
  projects: Project[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    title: "", content: "", color: "#FEF3C7",
    tags: [] as string[], projectId: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const save = async () => {
    if (!form.title.trim()) { setErr("Título é obrigatório."); return; }
    setSaving(true); setErr("");
    try {
      const { ok, data } = await apiCall("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          color: form.color || undefined,
          tags: form.tags,
          projectId: form.projectId || undefined,
        }),
      });
      if (!ok) { setErr((data.error as string) ?? "Erro ao salvar."); return; }
      onCreated();
    } finally { setSaving(false); }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.45)", display: "flex",
        alignItems: "center", justifyContent: "center",
        padding: 16, backdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 16, padding: 28,
        width: "100%", maxWidth: 520, maxHeight: "90vh",
        overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Nova anotação</h3>
          <button onClick={onClose} style={{ all: "unset", cursor: "pointer", color: "#6B7280", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Título *</label>
            <input
              ref={titleRef}
              className="input-base"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) { e.preventDefault(); save(); } }}
              placeholder="Título da anotação"
              style={{ fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Conteúdo</label>
            <textarea
              className="input-base"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Escreva aqui..."
              style={{ fontSize: 13.5, minHeight: 100, resize: "vertical" }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Cor</label>
            <ColorPicker value={form.color} onChange={(c) => setForm({ ...form, color: c })} />
          </div>

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Tags</label>
            <TagEditor tags={form.tags} onChange={(tags) => setForm({ ...form, tags })} />
          </div>

          {projects.length > 0 && (
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Projeto</label>
              <select
                className="input-base"
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                style={{ fontSize: 13.5 }}
              >
                <option value="">Nenhum projeto</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          {err && <p style={{ fontSize: 13, color: "#EF4444" }}>{err}</p>}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={onClose} className="btn-secondary" style={{ fontSize: 13, padding: "9px 18px" }}>
              Cancelar
            </button>
            <button onClick={save} disabled={saving} className="btn-primary" style={{ fontSize: 13, padding: "9px 18px" }}>
              {saving ? "Salvando..." : "Criar anotação"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── NoteDrawer ────────────────────────────────────────────────────────────────

function NoteDrawer({ note, projects, onClose, onUpdate }: {
  note: Note;
  projects: Project[];
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [form, setForm] = useState({
    title: note.title,
    content: note.content,
    color: note.color ?? "#FEF3C7",
    tags: [...note.tags],
    projectId: note.projectId ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showConvert, setShowConvert] = useState(false);
  const [convertForm, setConvertForm] = useState({ priority: "MEDIUM", dueDate: "", projectId: "" });
  const [converting, setConverting] = useState(false);
  const [convertSuccess, setConvertSuccess] = useState(false);
  const [convertErr, setConvertErr] = useState("");

  // Sync form when note changes (e.g. after pin/archive from parent reload)
  useEffect(() => {
    setForm({
      title: note.title,
      content: note.content,
      color: note.color ?? "#FEF3C7",
      tags: [...note.tags],
      projectId: note.projectId ?? "",
    });
    setMode("view");
    setShowConvert(false);
    setConvertSuccess(false);
    setErr(""); setConvertErr("");
  }, [note.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ESC: edit mode → view; view mode → close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mode === "edit") setMode("view");
        else onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mode, onClose]);

  const resetForm = () => setForm({
    title: note.title, content: note.content,
    color: note.color ?? "#FEF3C7", tags: [...note.tags],
    projectId: note.projectId ?? "",
  });

  const save = async () => {
    if (!form.title.trim()) { setErr("Título é obrigatório."); return; }
    setSaving(true); setErr("");
    try {
      const { ok, data } = await apiCall(`/api/notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title, content: form.content,
          color: form.color || undefined, tags: form.tags,
          projectId: form.projectId || null,
        }),
      });
      if (!ok) { setErr((data.error as string) ?? "Erro ao salvar."); return; }
      setMode("view");
      onUpdate();
    } finally { setSaving(false); }
  };

  const doAction = async (action: string) => {
    setActionLoading(action);
    try {
      if (action === "pin") {
        const { ok } = await apiCall(`/api/notes/${note.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPinned: !note.isPinned }),
        });
        if (ok) onUpdate();
      } else if (action === "archive") {
        const { ok } = await apiCall(`/api/notes/${note.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isArchived: !note.isArchived }),
        });
        if (ok) { onUpdate(); onClose(); }
      } else if (action === "delete") {
        if (!confirm(`Excluir "${note.title}"? Esta ação não pode ser desfeita.`)) return;
        const { ok } = await apiCall(`/api/notes/${note.id}`, { method: "DELETE" });
        if (ok) { onUpdate(); onClose(); }
      } else if (action === "duplicate") {
        const { ok } = await apiCall("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `${note.title} (Cópia)`,
            content: note.content, color: note.color,
            tags: note.tags, projectId: note.projectId || undefined,
          }),
        });
        if (ok) onUpdate();
      }
    } finally { setActionLoading(null); }
  };

  const convertToTask = async () => {
    setConverting(true); setConvertErr("");
    try {
      const dueDate = convertForm.dueDate
        ? new Date(convertForm.dueDate + "T12:00:00").toISOString()
        : undefined;
      const { ok, data } = await apiCall(`/api/notes/${note.id}/convert-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priority: convertForm.priority,
          dueDate,
          projectId: convertForm.projectId || undefined,
        }),
      });
      if (!ok) { setConvertErr((data.error as string) ?? "Erro ao criar tarefa."); return; }
      setConvertSuccess(true);
    } finally { setConverting(false); }
  };

  const bg = form.color ?? "#F8FAFC";
  const isLoading = (a: string) => actionLoading === a;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 150,
          background: "rgba(0,0,0,0.2)", backdropFilter: "blur(2px)",
        }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 151,
        width: "min(520px, 100vw)", background: "#fff",
        boxShadow: "-4px 0 32px rgba(0,0,0,0.12)",
        display: "flex", flexDirection: "column", overflowY: "auto",
      }}>
        {/* Color header */}
        <div style={{
          background: bg, padding: "18px 22px 16px",
          borderBottom: "1px solid rgba(0,0,0,0.08)", flexShrink: 0,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <ColorPicker value={form.color} onChange={(c) => setForm((f) => ({ ...f, color: c }))} />
            <button onClick={onClose} style={{
              all: "unset", cursor: "pointer", color: "#6B7280",
              width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 7, background: "rgba(255,255,255,0.65)", flexShrink: 0,
            }}>
              <X size={16} />
            </button>
          </div>

          {mode === "view" ? (
            <h2 style={{ fontSize: 19, fontWeight: 800, color: "#111827", lineHeight: 1.3, marginBottom: 6 }}>
              {note.title}
            </h2>
          ) : (
            <input
              className="input-base"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              style={{ fontSize: 17, fontWeight: 700, background: "rgba(255,255,255,0.7)", marginBottom: 6 }}
              placeholder="Título"
            />
          )}

          <div style={{ display: "flex", gap: 10, fontSize: 11, color: "rgba(0,0,0,0.4)" }}>
            <span>Criada {fmtDate(note.createdAt)}</span>
            <span>·</span>
            <span>Editada {fmtDate(note.updatedAt)}</span>
            {note.isPinned && (
              <><span>·</span><span style={{ color: "#F59E0B", fontWeight: 600 }}>Fixada</span></>
            )}
            {note.isArchived && (
              <><span>·</span><span style={{ color: "#6B7280", fontWeight: 600 }}>Arquivada</span></>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>

          {/* Content */}
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Conteúdo</div>
            {mode === "view" ? (
              note.content ? (
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{note.content}</p>
              ) : (
                <p style={{ fontSize: 14, color: "#9CA3AF", fontStyle: "italic" }}>Sem conteúdo</p>
              )
            ) : (
              <textarea
                className="input-base"
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Escreva aqui..."
                style={{ fontSize: 14, minHeight: 160, resize: "vertical", lineHeight: 1.8 }}
              />
            )}
          </div>

          {/* Tags */}
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Tags</div>
            {mode === "view" ? (
              note.tags.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {note.tags.map((tag) => (
                    <span key={tag} style={{
                      fontSize: 12.5, padding: "3px 10px", borderRadius: 20,
                      background: "#F3F4F6", color: "#374151", fontWeight: 600,
                    }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>Sem tags</p>
              )
            ) : (
              <TagEditor tags={form.tags} onChange={(tags) => setForm((f) => ({ ...f, tags }))} />
            )}
          </div>

          {/* Project */}
          {(note.project || (mode === "edit" && projects.length > 0)) && (
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Projeto</div>
              {mode === "view" ? (
                note.project ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: "#374151", fontWeight: 600 }}>
                    <FolderKanban size={14} color="#6B7280" />
                    {note.project.name}
                  </div>
                ) : null
              ) : (
                <select
                  className="input-base"
                  value={form.projectId}
                  onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
                  style={{ fontSize: 13.5 }}
                >
                  <option value="">Nenhum projeto</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}
            </div>
          )}

          {/* Convert to task */}
          {showConvert && (
            <div style={{
              padding: 16, borderRadius: 12,
              background: "#F0FDF4", border: "1px solid #BBF7D0",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 12 }}>
                Converter em Tarefa
              </div>
              {convertSuccess ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#166534", fontSize: 13.5 }}>
                  <Check size={16} />
                  Tarefa criada com sucesso! A nota original foi mantida.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Prioridade</label>
                    <select className="input-base" value={convertForm.priority}
                      onChange={(e) => setConvertForm((f) => ({ ...f, priority: e.target.value }))}
                      style={{ fontSize: 13 }}>
                      <option value="LOW">Baixa</option>
                      <option value="MEDIUM">Média</option>
                      <option value="HIGH">Alta</option>
                      <option value="URGENT">Urgente</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Prazo (opcional)</label>
                    <input type="date" className="input-base"
                      value={convertForm.dueDate}
                      onChange={(e) => setConvertForm((f) => ({ ...f, dueDate: e.target.value }))}
                      style={{ fontSize: 13 }} />
                  </div>
                  {projects.length > 0 && (
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Projeto (opcional)</label>
                      <select className="input-base" value={convertForm.projectId}
                        onChange={(e) => setConvertForm((f) => ({ ...f, projectId: e.target.value }))}
                        style={{ fontSize: 13 }}>
                        <option value="">Nenhum</option>
                        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  )}
                  {convertErr && <p style={{ fontSize: 12, color: "#EF4444" }}>{convertErr}</p>}
                  <button onClick={convertToTask} disabled={converting}
                    className="btn-primary"
                    style={{ fontSize: 13, padding: "9px 18px", alignSelf: "flex-start" }}>
                    {converting ? "Criando..." : "Criar tarefa"}
                  </button>
                </div>
              )}
            </div>
          )}

          {err && <p style={{ fontSize: 13, color: "#EF4444" }}>{err}</p>}
        </div>

        {/* Footer actions */}
        <div style={{
          padding: "14px 22px", borderTop: "1px solid #F3F4F6",
          display: "flex", gap: 6, flexWrap: "wrap",
          justifyContent: "space-between", alignItems: "center", flexShrink: 0,
        }}>
          {mode === "view" ? (
            <>
              {/* Left actions */}
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                <ActionBtn onClick={() => setMode("edit")} icon={<Pencil size={12} />} label="Editar" />
                <ActionBtn
                  onClick={() => doAction("pin")}
                  loading={isLoading("pin")}
                  icon={note.isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                  label={note.isPinned ? "Desfixar" : "Fixar"}
                  active={note.isPinned}
                  activeBg="#FEF3C7" activeColor="#92400E"
                />
                <ActionBtn
                  onClick={() => doAction("archive")}
                  loading={isLoading("archive")}
                  icon={note.isArchived ? <ArchiveRestore size={12} /> : <Archive size={12} />}
                  label={note.isArchived ? "Desarquivar" : "Arquivar"}
                />
                <ActionBtn
                  onClick={() => doAction("duplicate")}
                  loading={isLoading("duplicate")}
                  icon={<Copy size={12} />}
                  label="Duplicar"
                />
              </div>

              {/* Right actions */}
              <div style={{ display: "flex", gap: 5 }}>
                <ActionBtn
                  onClick={() => { setShowConvert(!showConvert); setConvertSuccess(false); setConvertErr(""); }}
                  icon={<CheckCircle2 size={12} />}
                  label="Em tarefa"
                  active={showConvert}
                  activeBg="#ECFDF5" activeColor="#166534"
                />
                <ActionBtn
                  onClick={() => doAction("delete")}
                  loading={isLoading("delete")}
                  icon={<Trash2 size={12} />}
                  label="Excluir"
                  danger
                />
              </div>
            </>
          ) : (
            <>
              <button onClick={() => { setMode("view"); resetForm(); setErr(""); }}
                className="btn-secondary" style={{ fontSize: 13, padding: "9px 18px" }}>
                Cancelar
              </button>
              <button onClick={save} disabled={saving}
                className="btn-primary" style={{ fontSize: 13, padding: "9px 18px" }}>
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── ActionBtn helper ──────────────────────────────────────────────────────────

function ActionBtn({ onClick, icon, label, loading, active, activeBg, activeColor, danger }: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  loading?: boolean;
  active?: boolean;
  activeBg?: string;
  activeColor?: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        all: "unset", cursor: loading ? "wait" : "pointer",
        display: "flex", alignItems: "center", gap: 4,
        fontSize: 12.5, fontWeight: 600,
        padding: "7px 12px", borderRadius: 8,
        background: danger ? "#FEF2F2" : active ? (activeBg ?? "#EEF2FF") : "#F3F4F6",
        color: danger ? "#DC2626" : active ? (activeColor ?? "#4338CA") : "#374151",
        opacity: loading ? 0.6 : 1,
        transition: "background 0.12s",
      }}
    >
      {icon} {label}
    </button>
  );
}

// ── NotesModule ───────────────────────────────────────────────────────────────

export default function NotesModule({ user }: { user: AppUser | null }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterPinned, setFilterPinned] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/notes${showArchived ? "?archived=1" : ""}`;
      const [notesRes, projectsRes] = await Promise.all([
        fetch(url),
        fetch("/api/projects"),
      ]);
      if (notesRes.ok) {
        const d = await notesRes.json();
        setNotes(d.notes ?? []);
      }
      if (projectsRes.ok) {
        const d = await projectsRes.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setProjects((d.projects ?? []).map((p: any) => ({ id: p.id, name: p.name })));
      }
    } finally { setLoading(false); }
  }, [showArchived]);

  useEffect(() => { load(); }, [load]);

  const handlePin = async (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    await apiCall(`/api/notes/${note.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !note.isPinned }),
    });
    load();
  };

  const handleDelete = async (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    if (!confirm(`Excluir "${note.title}"?`)) return;
    await apiCall(`/api/notes/${note.id}`, { method: "DELETE" });
    if (selectedNote?.id === note.id) setSelectedNote(null);
    load();
  };

  // All unique tags from current notes
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags))).sort();

  // Client-side filtering
  const filtered = notes.filter((n) => {
    if (search) {
      const q = search.toLowerCase();
      if (!n.title.toLowerCase().includes(q) && !n.content.toLowerCase().includes(q)) return false;
    }
    if (filterTag && !n.tags.includes(filterTag)) return false;
    if (filterPinned && !n.isPinned) return false;
    return true;
  });

  const pinnedNotes = filtered.filter((n) => n.isPinned);
  const otherNotes = filtered.filter((n) => !n.isPinned);
  const anyFilter = !!(search || filterTag || filterPinned);

  const planLimit = user ? (PLANS[user.plan as keyof typeof PLANS]?.limits?.notes ?? 0) : 0;
  const atLimit = !!(user && notes.length >= planLimit);

  // Live note for drawer (updated after reload)
  const liveNote = selectedNote ? (notes.find((n) => n.id === selectedNote.id) ?? selectedNote) : null;

  const clearFilters = () => { setSearch(""); setFilterTag(null); setFilterPinned(false); };

  return (
    <div style={{ padding: 24, position: "relative" }}>
      {/* Create Modal */}
      {showCreateModal && (
        <CreateNoteModal
          projects={projects}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); load(); }}
        />
      )}

      {/* Note Drawer */}
      {liveNote && (
        <NoteDrawer
          note={liveNote}
          projects={projects}
          onClose={() => setSelectedNote(null)}
          onUpdate={load}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>
            {showArchived ? "Anotações Arquivadas" : "Anotações"}
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
            {notes.length} anotaç{notes.length === 1 ? "ão" : "ões"}
            {!showArchived && ` · limite: ${planLimit}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => { setShowArchived(!showArchived); setSelectedNote(null); clearFilters(); }}
            style={{
              all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              padding: "9px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600,
              background: showArchived ? "#F0F9FF" : "#F3F4F6",
              color: showArchived ? "#0369A1" : "#4B5563",
              border: `1.5px solid ${showArchived ? "#BAE6FD" : "transparent"}`,
            }}
          >
            {showArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
            {showArchived ? "Ver ativas" : "Arquivadas"}
          </button>
          {!showArchived && (
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={atLimit}
              className="btn-primary"
              style={{ fontSize: 13, padding: "9px 18px", display: "flex", alignItems: "center", gap: 6, opacity: atLimit ? 0.5 : 1 }}
            >
              <Plus size={14} /> Nova anotação
            </button>
          )}
        </div>
      </div>

      {/* Limit warning */}
      {atLimit && !showArchived && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#FEF3C7", borderRadius: 9, marginBottom: 14, fontSize: 13, color: "#92400E" }}>
          <AlertCircle size={14} /> Limite do plano atingido. Arquive notas antigas para liberar espaço.
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 360 }}>
          <Search size={13} color="#9CA3AF" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input
            className="input-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título ou conteúdo..."
            style={{ paddingLeft: 30, fontSize: 13 }}
          />
        </div>

        {allTags.length > 0 && (
          <select
            className="input-base"
            value={filterTag ?? ""}
            onChange={(e) => setFilterTag(e.target.value || null)}
            style={{ fontSize: 13, minWidth: 140 }}
          >
            <option value="">Todas as tags</option>
            {allTags.map((tag) => <option key={tag} value={tag}>#{tag}</option>)}
          </select>
        )}

        {!showArchived && (
          <button
            onClick={() => setFilterPinned(!filterPinned)}
            style={{
              all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              padding: "8px 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
              background: filterPinned ? "#FEF3C7" : "#F3F4F6",
              color: filterPinned ? "#92400E" : "#6B7280",
              border: `1.5px solid ${filterPinned ? "#FDE68A" : "transparent"}`,
            }}
          >
            <Pin size={12} fill={filterPinned ? "#F59E0B" : "none"} color={filterPinned ? "#F59E0B" : "#9CA3AF"} />
            Fixadas
          </button>
        )}

        {anyFilter && (
          <button onClick={clearFilters} style={{
            all: "unset", cursor: "pointer", fontSize: 12.5, color: "#6B7280",
            display: "flex", alignItems: "center", gap: 4, padding: "8px 10px",
            borderRadius: 8, background: "#F3F4F6",
          }}>
            <X size={12} /> Limpar
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ height: 140, borderRadius: 12, background: "#F3F4F6" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <StickyNote size={44} color="#E5E7EB" style={{ margin: "0 auto 14px", display: "block" }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>
            {anyFilter
              ? "Nenhuma anotação encontrada"
              : showArchived
                ? "Nenhuma anotação arquivada"
                : "Nenhuma anotação ainda"}
          </p>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            {anyFilter
              ? "Tente outros filtros"
              : showArchived
                ? "Anotações arquivadas aparecerão aqui"
                : "Clique em \"Nova anotação\" para começar"}
          </p>
        </div>
      ) : pinnedNotes.length > 0 && otherNotes.length > 0 ? (
        // Two sections: pinned + others
        <>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Pin size={12} color="#F59E0B" fill="#F59E0B" />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Fixadas
              </span>
            </div>
            <NoteGrid notes={pinnedNotes} onSelect={setSelectedNote} onPin={handlePin} onDelete={handleDelete} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <StickyNote size={12} color="#6B7280" />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Demais
              </span>
            </div>
            <NoteGrid notes={otherNotes} onSelect={setSelectedNote} onPin={handlePin} onDelete={handleDelete} />
          </div>
        </>
      ) : (
        // Single grid (all pinned or all unpinned)
        <NoteGrid notes={filtered} onSelect={setSelectedNote} onPin={handlePin} onDelete={handleDelete} />
      )}
    </div>
  );
}
