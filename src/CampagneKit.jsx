import { useState, useMemo, useEffect } from "react";

const SUPABASE_URL = "https://tdflwenlylhctxssatax.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZmx3ZW5seWxoY3R4c3NhdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMzgyNzYsImV4cCI6MjA5MTkxNDI3Nn0.l35qEL7LOvyYuI1McQlVqj4vbyTqmlevcmqWbTGYi2Q";

const T = {
  bg: "#1a2140", surface: "#212d54", border: "#2e3d6b", borderHi: "#3d4f82",
  text: "#f0f2f8", textMid: "#8b9cc8", textDim: "#4a5a8a",
  accent: "#7b9fe8", green: "#4caf7d", red: "#e05c5c", yellow: "#f0c040",
};

const css = {
  btn: (v = "default") => ({ padding: "6px 14px", border: `1px solid ${v === "accent" ? T.accent : T.border}`, background: v === "accent" ? T.accent : "transparent", color: v === "accent" ? "#000" : T.text, cursor: "pointer", fontSize: "12px", fontFamily: "inherit", borderRadius: 3, fontWeight: v === "accent" ? "700" : "400" }),
  input: { background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "5px 10px", fontSize: "12px", fontFamily: "inherit", borderRadius: 3, outline: "none" },
  th: { padding: "8px 12px", textAlign: "left", color: T.textMid, fontWeight: "400", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap", background: T.surface, position: "sticky", top: 0, zIndex: 1 },
  td: { padding: "8px 12px", borderBottom: `1px solid ${T.border}22`, verticalAlign: "middle", fontSize: "12px" },
};

const CANALI_LABELS = {
  FELTRINELLI: "Feltrinelli", GIUNTI: "Giunti al Punto", MONDADORI: "Mondadori",
  UBIK: "Ubik", LIBRACCIO: "Libraccio", INDIPENDENTI_ALTRE_CATENE: "Indipendenti",
  LIB_RELIGIOSE: "Librerie Religiose", LIB_COOP: "Librerie Coop", ALTRI_ONLINE: "Librerie On-line",
  AMAZON: "Amazon", IBS: "IBS", FASTBOOK: "Fastbook + GD", GROSSISTI: "Grossisti",
  CENTROLIBRI: "Centrolibri",
};

function DeltaBadge({ delta_kit, prop_errata }) {
  if (delta_kit === 0 && !prop_errata) return <span style={{ color: T.green, fontWeight: "700" }}>✓ OK</span>;
  const color = T.red;
  const label = delta_kit > 0 ? `+${delta_kit} kit mancanti` : `${delta_kit} kit in eccesso`;
  return (
    <span style={{ color, fontWeight: "700" }}>
      {label}{prop_errata ? <span style={{ color: T.yellow, fontSize: "10px", marginLeft: 6 }}>⚠ proporzione errata</span> : ""}
    </span>
  );
}

export default function CampagneKit({ campagnaId, token, titoli }) {
  const [eanKit, setEanKit] = useState("");
  const [pzPerKit, setPzPerKit] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [righeClienti, setRigheClienti] = useState([]); // da campagna_prenotato_clienti
  const [loadingClienti, setLoadingClienti] = useState(false);
  const [risultati, setRisultati] = useState(null);
  const [espansi, setEspansi] = useState(new Set()); // canali espansi
  const [search, setSearch] = useState("");
  const [soloErrori, setSoloErrori] = useState(false);

  const prop = parseInt(pzPerKit) || 0;
  const eanNorm = eanKit.trim().replace(/\D/g, "");

  // Carica dettaglio clienti da Supabase quando cambia campagna
  useEffect(() => {
    if (!campagnaId || !token) return;
    setLoadingClienti(true);
    fetch(`${SUPABASE_URL}/rest/v1/campagna_prenotato_clienti?campagna_id=eq.${campagnaId}&select=*&limit=500000`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token}`, "Range-Unit": "items", "Range": "0-499999" },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRigheClienti(data); })
      .catch(() => {})
      .finally(() => setLoadingClienti(false));
  }, [campagnaId, token]);

  // EAN libri validi (prezzo > 0.10, escluso EAN kit)
  const eanLibriValidi = useMemo(() => {
    const set = new Set();
    titoli.forEach(t => { if ((t.prezzo || 0) > 0.10 && t.ean && t.ean !== eanNorm) set.add(t.ean); });
    return set;
  }, [titoli, eanNorm]);

  const elabora = () => {
    if (!eanNorm || prop < 1 || righeClienti.length === 0) return;

    // Raggruppa per canale → per cliente
    // Struttura: { [canale]: { [codice_cliente]: { nome, kit_ord, libri_ord } } }
    const perCanale = {};

    righeClienti.forEach(r => {
      const ean = String(r.ean || "").trim().replace(/\D/g, "");
      const qta = parseInt(r.quantita) || 0;
      const canale = r.canale_codice;
      const codice = r.codice_cliente;
      const nome = r.nome_cliente;
      if (!ean || qta === 0) return;

      if (!perCanale[canale]) perCanale[canale] = {};
      if (!perCanale[canale][codice]) perCanale[canale][codice] = { codice, nome, kit_ord: 0, libri_ord: 0 };

      if (ean === eanNorm) perCanale[canale][codice].kit_ord += qta;
      else if (eanLibriValidi.has(ean)) perCanale[canale][codice].libri_ord += qta;
    });

    // Calcola delta per ogni cliente e aggrega per canale
    const risultatiCanale = Object.entries(perCanale)
      .map(([canale, clientiMap]) => {
        const clienti = Object.values(clientiMap)
          .filter(c => c.kit_ord > 0 || c.libri_ord > 0)
          .map(c => {
            const libri_attesi = c.kit_ord * prop;
            const delta_libri = c.libri_ord - libri_attesi;
            const delta_kit = delta_libri !== 0 ? Math.round(delta_libri / prop) : 0;
            const prop_errata = delta_libri !== 0 && delta_libri % prop !== 0;
            return { ...c, libri_attesi, delta_libri, delta_kit, prop_errata };
          })
          .sort((a, b) => a.nome.localeCompare(b.nome));

        const tot_kit = clienti.reduce((s, c) => s + c.kit_ord, 0);
        const tot_libri_attesi = clienti.reduce((s, c) => s + c.libri_attesi, 0);
        const tot_libri_ord = clienti.reduce((s, c) => s + c.libri_ord, 0);
        const tot_delta_kit = clienti.reduce((s, c) => s + c.delta_kit, 0);
        const n_errori = clienti.filter(c => c.delta_kit !== 0 || c.prop_errata).length;
        const has_prop_errata = clienti.some(c => c.prop_errata);

        return { canale, clienti, tot_kit, tot_libri_attesi, tot_libri_ord, tot_delta_kit, n_errori, has_prop_errata };
      })
      .filter(r => r.tot_kit > 0 || r.tot_libri_ord > 0)
      .sort((a, b) => b.tot_kit - a.tot_kit);

    setRisultati(risultatiCanale);
    setEspansi(new Set());
  };

  const toggleEspanso = (canale) => {
    setEspansi(prev => {
      const next = new Set(prev);
      if (next.has(canale)) next.delete(canale);
      else next.add(canale);
      return next;
    });
  };

  const rows = useMemo(() => {
    if (!risultati) return [];
    return risultati.filter(r => {
      if (soloErrori && r.n_errori === 0) return false;
      if (search) return (CANALI_LABELS[r.canale] || r.canale).toLowerCase().includes(search.toLowerCase());
      return true;
    });
  }, [risultati, search, soloErrori]);

  const totali = useMemo(() => ({
    kit: rows.reduce((s, r) => s + r.tot_kit, 0),
    attesi: rows.reduce((s, r) => s + r.tot_libri_attesi, 0),
    effettivi: rows.reduce((s, r) => s + r.tot_libri_ord, 0),
    delta: rows.reduce((s, r) => s + r.tot_delta_kit, 0),
    errori: rows.reduce((s, r) => s + r.n_errori, 0),
  }), [rows]);

  const exportExcel = () => {
    if (!rows.length) return;
    const XLSX = window.XLSX;
    const sheetData = [];
    sheetData.push(["Canale", "Cod. Cliente", "Nome Cliente", "Kit Ordinati", "Libri Attesi", "Libri Effettivi", "Delta (kit)", "Note"]);
    rows.forEach(r => {
      // Riga canale totale
      sheetData.push([CANALI_LABELS[r.canale] || r.canale, "", "TOTALE CANALE", r.tot_kit, r.tot_libri_attesi, r.tot_libri_ord, r.tot_delta_kit]);
      // Righe clienti
      r.clienti.forEach(c => {
        sheetData.push(["", c.codice, c.nome, c.kit_ord, c.libri_attesi, c.libri_ord, c.delta_kit, c.prop_errata ? "PROPORZIONE ERRATA" : ""]);
      });
    });
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 34 }, { wch: 13 }, { wch: 13 }, { wch: 15 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KIT");
    XLSX.writeFile(wb, `KIT_${eanNorm}.xlsx`);
  };

  const hasData = righeClienti.length > 0;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* CONFIG */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <div style={{ color: T.textMid, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>EAN Codice Kit *</div>
            <input style={{ ...css.input, width: 170, fontFamily: "monospace" }} placeholder="es. 9788812345678" value={eanKit} onChange={e => setEanKit(e.target.value)} />
          </div>
          <div>
            <div style={{ color: T.textMid, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Libri per Kit *</div>
            <input style={{ ...css.input, width: 90, textAlign: "center" }} placeholder="es. 30" type="number" min="1" value={pzPerKit} onChange={e => setPzPerKit(e.target.value)} />
          </div>
          <div>
            <div style={{ color: T.textMid, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Descrizione</div>
            <input style={{ ...css.input, width: 220 }} placeholder="es. Borsa Adelphi Natale" value={descrizione} onChange={e => setDescrizione(e.target.value)} />
          </div>
          <button style={{ ...css.btn("accent"), padding: "7px 20px", alignSelf: "flex-end" }} onClick={elabora} disabled={!eanNorm || prop < 1 || !hasData}>
            Elabora
          </button>
        </div>
        <div style={{ marginTop: 10, fontSize: "11px", color: loadingClienti ? T.yellow : hasData ? T.green : T.red }}>
          {loadingClienti ? "⏳ Caricamento dati clienti..." : hasData ? `✓ ${righeClienti.length.toLocaleString("it")} righe dettaglio cliente disponibili · ${eanLibriValidi.size} titoli validi` : "⚠ Nessun dettaglio cliente — prima esegui Import Prenotato"}
        </div>
      </div>

      {/* Stato vuoto */}
      {!risultati && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: T.textDim }}>
          <div style={{ fontSize: "36px" }}>🧩</div>
          <div>Inserisci EAN kit e libri per kit, poi clicca <strong style={{ color: T.accent }}>Elabora</strong></div>
        </div>
      )}

      {risultati && risultati.length === 0 && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, color: T.textDim }}>
          <div style={{ fontSize: "36px" }}>🔍</div>
          <div>Nessun dato trovato per EAN <span style={{ color: T.accent, fontFamily: "monospace" }}>{eanNorm}</span></div>
        </div>
      )}

      {risultati && risultati.length > 0 && (
        <>
          {/* KPI + toolbar */}
          <div style={{ padding: "10px 20px", borderBottom: `1px solid ${T.border}`, background: T.bg, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
            {[
              ["Kit totali", totali.kit, T.accent],
              ["Libri attesi", totali.attesi, T.textMid],
              ["Libri effettivi", totali.effettivi, T.text],
              ["Delta totale (kit)", (totali.delta > 0 ? "+" : "") + totali.delta + " kit", totali.delta === 0 ? T.green : T.red],
              ["Clienti con errori", totali.errori, totali.errori === 0 ? T.green : T.red],
            ].map(([label, val, color]) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ color: T.textMid, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
                <span style={{ color, fontWeight: "700", fontSize: "16px" }}>{val}</span>
              </div>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <input style={{ ...css.input, width: 160 }} placeholder="Cerca canale…" value={search} onChange={e => setSearch(e.target.value)} />
              <label style={{ display: "flex", alignItems: "center", gap: 6, color: T.textMid, fontSize: "12px", cursor: "pointer" }}>
                <input type="checkbox" checked={soloErrori} onChange={e => setSoloErrori(e.target.checked)} />
                Solo errori
              </label>
              <button style={css.btn("accent")} onClick={exportExcel}>↓ Export</button>
            </div>
          </div>

          {/* TABELLA con espansione */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...css.th, width: 32 }}></th>
                  <th style={css.th}>Canale</th>
                  <th style={{ ...css.th, textAlign: "right" }}>Kit Ord.</th>
                  <th style={{ ...css.th, textAlign: "right" }}>Libri Attesi</th>
                  <th style={{ ...css.th, textAlign: "right" }}>Libri Effettivi</th>
                  <th style={{ ...css.th, textAlign: "right" }}>Delta</th>
                  <th style={{ ...css.th, textAlign: "center" }}>Clienti</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const aperto = espansi.has(r.canale);
                  return (
                    <>
                      {/* Riga canale */}
                      <tr key={r.canale} style={{ background: r.tot_delta_kit !== 0 || r.has_prop_errata ? T.red + "0d" : i % 2 === 0 ? "transparent" : T.surface + "55", cursor: "pointer" }} onClick={() => toggleEspanso(r.canale)}>
                        <td style={{ ...css.td, textAlign: "center", padding: "8px 6px" }}>
                          <span style={{ color: T.accent, fontSize: "14px", fontWeight: "700" }}>{aperto ? "−" : "+"}</span>
                        </td>
                        <td style={{ ...css.td, fontWeight: "700", color: T.text }}>{CANALI_LABELS[r.canale] || r.canale}</td>
                        <td style={{ ...css.td, textAlign: "right", color: T.accent, fontWeight: "700" }}>{r.tot_kit.toLocaleString("it")}</td>
                        <td style={{ ...css.td, textAlign: "right", color: T.textMid }}>{r.tot_libri_attesi.toLocaleString("it")}</td>
                        <td style={{ ...css.td, textAlign: "right", color: T.text, fontWeight: "600" }}>{r.tot_libri_ord.toLocaleString("it")}</td>
                        <td style={{ ...css.td, textAlign: "right" }}><DeltaBadge delta_kit={r.tot_delta_kit} prop_errata={r.has_prop_errata} /></td>
                        <td style={{ ...css.td, textAlign: "center", color: T.textMid, fontSize: "11px" }}>{r.clienti.length}</td>
                      </tr>

                      {/* Righe clienti espanse */}
                      {aperto && r.clienti.map(c => (
                        <tr key={`${r.canale}_${c.codice}`} style={{ background: c.delta_kit !== 0 || c.prop_errata ? T.red + "08" : T.surface + "33" }}>
                          <td style={{ ...css.td, padding: "6px 6px" }}></td>
                          <td style={{ ...css.td, paddingLeft: 28 }}>
                            <span style={{ color: T.textDim, fontFamily: "monospace", fontSize: "11px", marginRight: 8 }}>{c.codice}</span>
                            <span style={{ color: T.textMid }}>{c.nome}</span>
                          </td>
                          <td style={{ ...css.td, textAlign: "right", color: T.accent }}>{c.kit_ord > 0 ? c.kit_ord : "—"}</td>
                          <td style={{ ...css.td, textAlign: "right", color: T.textDim }}>{c.libri_attesi > 0 ? c.libri_attesi : "—"}</td>
                          <td style={{ ...css.td, textAlign: "right", color: T.text }}>{c.libri_ord > 0 ? c.libri_ord : "—"}</td>
                          <td style={{ ...css.td, textAlign: "right" }}><DeltaBadge delta_kit={c.delta_kit} prop_errata={c.prop_errata} /></td>
                          <td></td>
                        </tr>
                      ))}
                    </>
                  );
                })}
                {/* Totali */}
                <tr style={{ background: T.surface, borderTop: `2px solid ${T.border}` }}>
                  <td></td>
                  <td style={{ ...css.td, fontWeight: "700", color: T.textMid }}>TOTALE</td>
                  <td style={{ ...css.td, textAlign: "right", fontWeight: "700", color: T.accent }}>{totali.kit.toLocaleString("it")}</td>
                  <td style={{ ...css.td, textAlign: "right", fontWeight: "700", color: T.textMid }}>{totali.attesi.toLocaleString("it")}</td>
                  <td style={{ ...css.td, textAlign: "right", fontWeight: "700", color: T.text }}>{totali.effettivi.toLocaleString("it")}</td>
                  <td style={{ ...css.td, textAlign: "right" }}><DeltaBadge delta_kit={totali.delta} prop_errata={false} /></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
