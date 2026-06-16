import { useState, useEffect } from "react";
import CampagneImport from "./CampagneImport.jsx";
import CampagnePrenotato from "./CampagnePrenotato.jsx";
import CampagneFineCampagna from "./CampagneFineCampagna.jsx";

const SUPABASE_URL = "https://tdflwenlylhctxssatax.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZmx3ZW5seWxoY3R4c3NhdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMzgyNzYsImV4cCI6MjA5MTkxNDI3Nn0.l35qEL7LOvyYuI1McQlVqj4vbyTqmlevcmqWbTGYi2Q";

const sb = {
  auth: {
    signIn: async (email, password) => {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST", headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
        body: JSON.stringify({ email, password }),
      });
      return r.json();
    },
    getUser: async (token) => {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token}` } });
      return r.json();
    },
  },
};

const sbFetch = async (path, token) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token}`, "Accept": "application/json", "Range-Unit": "items", "Range": "0-499999" },
  });
  return r.json();
};

const sbPost = async (path, body, token, method = "POST") => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token}`, "Prefer": "return=representation" },
    body: JSON.stringify(body),
  });
  return r.json();
};

const T = {
  bg: "#1a2140", surface: "#212d54", border: "#2e3d6b", borderHi: "#3d4f82",
  text: "#f0f2f8", textMid: "#8b9cc8", textDim: "#4a5a8a",
  accent: "#7b9fe8", green: "#4caf7d", red: "#e05c5c", purple: "#9c6fcf",
};

const css = {
  app: { background: T.bg, color: T.text, minHeight: "100vh", fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif", fontSize: "13px" },
  sidebar: { width: 210, background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", flexShrink: 0 },
  main: { flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" },
  header: { borderBottom: `1px solid ${T.border}`, padding: "10px 20px", display: "flex", alignItems: "center", gap: 12, background: T.surface },
  btn: (v = "default") => ({ padding: "6px 14px", border: `1px solid ${v === "accent" ? T.accent : v === "danger" ? T.red : T.border}`, background: v === "accent" ? T.accent : v === "danger" ? T.red + "22" : "transparent", color: v === "accent" ? "#000" : v === "danger" ? T.red : T.text, cursor: "pointer", fontSize: "12px", fontFamily: "inherit", borderRadius: 3, fontWeight: v === "accent" ? "700" : "400", letterSpacing: "0.04em", transition: "all 0.15s" }),
  input: { background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "5px 10px", fontSize: "12px", fontFamily: "inherit", borderRadius: 3, outline: "none" },
};

// Moduli per ogni campagna selezionata
const MODULES = [
  { id: "fine", label: "Fine Campagna", icon: "⊞" },
  { id: "import", label: "Import Cedola", icon: "⬆" },
  { id: "prenotato", label: "Import Prenotato", icon: "📋" },
];

// ── Login ──────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true); setError("");
    const data = await sb.auth.signIn(email, password);
    if (data.access_token) {
      localStorage.setItem("campagne_token", data.access_token);
      onLogin(data.access_token, data.user);
    } else setError("Email o password errati.");
    setLoading(false);
  };

  return (
    <div style={{ ...css.app, display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 40, width: 340 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-block", background: "#fff", borderRadius: 8, padding: "8px 14px", marginBottom: 16 }}>
            <img src="https://albertospde.github.io/pde-hub/pde_logo.png" style={{ height: 32, display: "block" }} alt="PDE" />
          </div>
          <div style={{ color: T.accent, fontSize: "22px", fontWeight: "700", letterSpacing: "0.12em" }}>CAMPAGNE</div>
          <div style={{ color: T.textMid, fontSize: "10px", letterSpacing: "0.15em", marginTop: 4 }}>GESTIONE CAMPAGNE PROMOZIONALI</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: T.textMid, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Email</label>
          <input style={{ ...css.input, width: "100%", boxSizing: "border-box" }} type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ color: T.textMid, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Password</label>
          <input style={{ ...css.input, width: "100%", boxSizing: "border-box" }} type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>
        {error && <div style={{ color: T.red, fontSize: "12px", marginBottom: 16, textAlign: "center" }}>{error}</div>}
        <button style={{ ...css.btn("accent"), width: "100%", padding: "10px" }} onClick={handleLogin} disabled={loading}>{loading ? "Accesso..." : "Accedi"}</button>
        <div style={{ textAlign: "center", marginTop: 20, color: T.textDim, fontSize: "10px", letterSpacing: "0.06em" }}>Powered by PDE</div>
      </div>
    </div>
  );
}

// ── Modal nuova campagna ───────────────────────────────────────────────────

function NuovaCampagnaModal({ onSave, onClose, token }) {
  const [nome, setNome] = useState("");
  const [anno, setAnno] = useState(new Date().getFullYear());
  const [descrizione, setDescrizione] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!nome.trim()) return;
    setSaving(true);
    const res = await sbPost("campagne", { nome: nome.trim(), anno: Number(anno), descrizione: descrizione.trim() || null, created_at: new Date().toISOString() }, token);
    if (Array.isArray(res) && res[0]) { onSave(res[0]); onClose(); }
    else alert("Errore creazione campagna: " + JSON.stringify(res));
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: T.surface, border: `1px solid ${T.borderHi}`, borderRadius: 6, padding: 28, width: 400 }} onClick={e => e.stopPropagation()}>
        <div style={{ color: T.text, fontWeight: "700", marginBottom: 20, fontSize: "14px" }}>Nuova campagna</div>
        {[
          ["Nome campagna *", nome, setNome, "text", "es. Primavera 2025"],
          ["Anno *", anno, setAnno, "number", "2025"],
          ["Descrizione", descrizione, setDescrizione, "text", "Opzionale"],
        ].map(([label, val, setter, type, ph]) => (
          <div key={label} style={{ marginBottom: 16 }}>
            <label style={{ color: T.textMid, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>{label}</label>
            <input style={{ ...css.input, width: "100%", boxSizing: "border-box" }} type={type} value={val} placeholder={ph} onChange={e => setter(e.target.value)} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 24 }}>
          <button style={css.btn()} onClick={onClose}>Annulla</button>
          <button style={css.btn("accent")} onClick={handleSave} disabled={saving || !nome.trim()}>{saving ? "Salvataggio..." : "Crea campagna"}</button>
        </div>
      </div>
    </div>
  );
}

// ── App principale ─────────────────────────────────────────────────────────

export default function Campagne() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [campagne, setCampagne] = useState([]);
  const [campagnaSel, setCampagnaSel] = useState(null); // oggetto campagna selezionata
  const [activeModule, setActiveModule] = useState("fine");
  const [titoli, setTitoli] = useState([]);
  const [prenotato, setPrenotato] = useState([]);
  const [showNuova, setShowNuova] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filterAnno, setFilterAnno] = useState("");

  // Restore session
  useEffect(() => {
    const token = localStorage.getItem("campagne_token");
    if (token) {
      sb.auth.getUser(token).then(user => {
        if (user?.id) setSession({ token, user });
        else localStorage.removeItem("campagne_token");
        setLoading(false);
      });
    } else setLoading(false);
  }, []);

  // Carica lista campagne
  const refreshCampagne = async (token) => {
    const data = await sbFetch("campagne?select=*&order=anno.desc,nome.asc", token || session?.token);
    if (Array.isArray(data)) setCampagne(data);
  };

  useEffect(() => {
    if (session) refreshCampagne(session.token);
  }, [session]);

  // Carica titoli e prenotato della campagna selezionata
  const refreshTitoli = async () => {
    if (!campagnaSel || !session) return;
    const [t, p] = await Promise.all([
      sbFetch(`campagna_titoli?campagna_id=eq.${campagnaSel.id}&select=*&order=ranking_titolo.asc`, session.token),
      sbFetch(`campagna_prenotato?campagna_id=eq.${campagnaSel.id}&select=*`, session.token),
    ]);
    if (Array.isArray(t)) setTitoli(t);
    if (Array.isArray(p)) setPrenotato(p);
  };

  useEffect(() => {
    if (campagnaSel) refreshTitoli();
    else { setTitoli([]); setPrenotato([]); }
  }, [campagnaSel]);

  const handleLogin = (token, user) => setSession({ token, user });

  const handleLogout = () => {
    localStorage.removeItem("campagne_token");
    setSession(null);
  };

  const handleDeleteCampagna = async (id) => {
    if (!window.confirm("Eliminare questa campagna e tutti i suoi dati?")) return;
    setDeletingId(id);
    await fetch(`${SUPABASE_URL}/rest/v1/campagna_prenotato?campagna_id=eq.${id}`, { method: "DELETE", headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${session.token}` } });
    await fetch(`${SUPABASE_URL}/rest/v1/campagna_titoli?campagna_id=eq.${id}`, { method: "DELETE", headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${session.token}` } });
    await fetch(`${SUPABASE_URL}/rest/v1/campagne?id=eq.${id}`, { method: "DELETE", headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${session.token}` } });
    if (campagnaSel?.id === id) setCampagnaSel(null);
    setDeletingId(null);
    refreshCampagne(session.token);
  };

  if (loading) return <div style={{ ...css.app, display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}><span style={{ color: T.textMid }}>Caricamento...</span></div>;
  if (!session) return <LoginScreen onLogin={handleLogin} />;

  const anniDisp = [...new Set(campagne.map(c => c.anno))].sort((a, b) => b - a);
  const campagneFiltrate = campagne.filter(c => !filterAnno || String(c.anno) === filterAnno);

  return (
    <div style={{ ...css.app, display: "flex", height: "100vh" }}>
      {showNuova && <NuovaCampagnaModal token={session.token} onSave={(c) => { refreshCampagne(session.token); setCampagnaSel(c); setActiveModule("import"); }} onClose={() => setShowNuova(false)} />}

      {/* Sidebar */}
      <div style={css.sidebar}>
        {/* Logo */}
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "#fff", borderRadius: 6, padding: "3px 7px" }}>
            <img src="https://albertospde.github.io/pde-hub/pde_logo.png" style={{ height: 22, display: "block" }} alt="PDE" />
          </div>
          <span style={{ color: T.accent, fontWeight: "700", fontSize: "13px", letterSpacing: "0.1em" }}>CAMPAGNE</span>
        </div>

        {/* Lista campagne */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          <div style={{ padding: "6px 12px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: T.textDim, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Campagne</span>
            <button style={{ ...css.btn("accent"), padding: "3px 8px", fontSize: "11px" }} onClick={() => setShowNuova(true)} title="Nuova campagna">+</button>
          </div>

          {/* Filtro anno */}
          {anniDisp.length > 1 && (
            <div style={{ padding: "4px 12px 8px" }}>
              <select style={{ ...css.input, width: "100%", fontSize: "11px" }} value={filterAnno} onChange={e => setFilterAnno(e.target.value)}>
                <option value="">Tutti gli anni</option>
                {anniDisp.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          )}

          {campagneFiltrate.length === 0 && (
            <div style={{ padding: "20px 16px", color: T.textDim, fontSize: "11px", textAlign: "center" }}>
              Nessuna campagna.<br />Clicca + per crearne una.
            </div>
          )}

          {campagneFiltrate.map(c => (
            <div key={c.id} style={{ position: "relative", borderLeft: `2px solid ${campagnaSel?.id === c.id ? T.accent : "transparent"}`, background: campagnaSel?.id === c.id ? T.accent + "18" : "transparent" }}>
              <button
                onClick={() => { setCampagnaSel(c); setActiveModule("fine"); }}
                style={{ width: "100%", textAlign: "left", padding: "9px 14px 9px 12px", border: "none", background: "transparent", color: campagnaSel?.id === c.id ? T.accent : T.textMid, cursor: "pointer", fontFamily: "inherit", fontSize: "12px", display: "block" }}
              >
                <div style={{ fontWeight: "600", marginBottom: 2 }}>{c.nome}</div>
                <div style={{ fontSize: "10px", color: T.textDim }}>{c.anno}{c.descrizione ? ` · ${c.descrizione}` : ""}</div>
              </button>
              <button
                onClick={() => handleDeleteCampagna(c.id)}
                disabled={deletingId === c.id}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: T.textDim, cursor: "pointer", fontSize: "13px", padding: "2px 4px", opacity: 0.5 }}
                title="Elimina campagna"
              >✕</button>
            </div>
          ))}
        </div>

        {/* User/logout */}
        <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: T.textDim, fontSize: "10px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.user?.email}</span>
          <button style={{ ...css.btn(), padding: "3px 8px", fontSize: "10px" }} onClick={handleLogout}>Esci</button>
        </div>
      </div>

      {/* Main */}
      <div style={css.main}>
        {!campagnaSel ? (
          // Nessuna campagna selezionata — home
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: "48px" }}>📂</div>
            <div style={{ color: T.textMid, fontSize: "14px" }}>Seleziona una campagna dalla sidebar</div>
            <button style={css.btn("accent")} onClick={() => setShowNuova(true)}>+ Nuova campagna</button>
          </div>
        ) : (
          <>
            {/* Header campagna selezionata */}
            <div style={css.header}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                <span style={{ color: T.accent, fontWeight: "700", fontSize: "14px" }}>{campagnaSel.nome}</span>
                <span style={{ color: T.textDim, fontSize: "11px" }}>{campagnaSel.anno}</span>
                {campagnaSel.descrizione && <span style={{ color: T.textDim, fontSize: "11px" }}>· {campagnaSel.descrizione}</span>}
              </div>
              {/* Tab moduli */}
              <div style={{ display: "flex", gap: 4 }}>
                {MODULES.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setActiveModule(m.id)}
                    style={{ ...css.btn(activeModule === m.id ? "accent" : "default"), fontSize: "11px", padding: "5px 12px" }}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Moduli */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {activeModule === "fine" && (
                <CampagneFineCampagna
                  titoli={titoli}
                  prenotato={prenotato}
                  campagnaLabel={`${campagnaSel.nome} ${campagnaSel.anno}`}
                />
              )}
              {activeModule === "import" && (
                <CampagneImport
                  campagnaId={campagnaSel.id}
                  campagnaLabel={`${campagnaSel.nome} ${campagnaSel.anno}`}
                  token={session.token}
                  onImportDone={refreshTitoli}
                />
              )}
              {activeModule === "prenotato" && (
                <CampagnePrenotato
                  campagnaId={campagnaSel.id}
                  campagnaLabel={`${campagnaSel.nome} ${campagnaSel.anno}`}
                  token={session.token}
                  titoli={titoli}
                  onImportDone={refreshTitoli}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
