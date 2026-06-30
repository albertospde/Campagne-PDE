import { useState, useMemo } from "react";

const T = {
  bg: "#1a2140", surface: "#212d54", border: "#2e3d6b", borderHi: "#3d4f82",
  text: "#f0f2f8", textMid: "#8b9cc8", textDim: "#4a5a8a",
  accent: "#7b9fe8", green: "#4caf7d", red: "#e05c5c",
};

const css = {
  btn: (v = "default") => ({ padding: "6px 14px", border: `1px solid ${v === "accent" ? T.accent : v === "red" ? T.red : T.border}`, background: v === "accent" ? T.accent : "transparent", color: v === "accent" ? "#000" : v === "red" ? T.red : T.text, cursor: "pointer", fontSize: "12px", fontFamily: "inherit", borderRadius: 3, fontWeight: v === "accent" ? "700" : "400" }),
  input: { background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "5px 10px", fontSize: "12px", fontFamily: "inherit", borderRadius: 3, outline: "none" },
  th: (sortable) => ({ padding: "6px 10px", textAlign: "left", color: T.textMid, fontWeight: "400", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, whiteSpace: "normal", lineHeight: 1.2, maxWidth: 70, background: T.surface, position: "sticky", top: 0, zIndex: 1, cursor: sortable ? "pointer" : "default" }),
  td: { padding: "8px 10px", borderBottom: `1px solid ${T.border}22`, verticalAlign: "middle", fontSize: "12px" },
};

// Nomi canali identici a GiroManager (da tabella canali Supabase)
const CANALI_LABELS = {
  LIBRACCIO: "Libraccio",
  LIB_RELIGIOSE: "Librerie Religiose",
  LIB_COOP: "Librerie Coop",
  INDIPENDENTI_ALTRE_CATENE: "Indipenden.",
  FELTRINELLI: "Feltrinel.",
  MONDADORI: "Mondadori",
  UBIK: "Ubik",
  GIUNTI: "Giunti al Punto",
  FASTBOOK: "Fastbook + GD",
  CENTROLIBRI: "Centrolibri",
  GROSSISTI: "Grossisti",
  AMAZON: "Amazon",
  IBS: "IBS",
  ALTRI_ONLINE: "Librerie On-line",
};

const CANALI_ORDER = ["LIBRACCIO", "LIB_RELIGIOSE", "LIB_COOP", "INDIPENDENTI_ALTRE_CATENE", "FELTRINELLI", "MONDADORI", "UBIK", "GIUNTI", "FASTBOOK", "CENTROLIBRI", "GROSSISTI", "AMAZON", "IBS", "ALTRI_ONLINE"];

const MACROGRUPPI = [
  { id: "RETE", label: "Rete", canali: ["LIBRACCIO", "LIB_RELIGIOSE", "LIB_COOP", "INDIPENDENTI_ALTRE_CATENE"] },
  { id: "CATENE", label: "Catene Centralizzate", canali: ["FELTRINELLI", "MONDADORI", "UBIK", "GIUNTI"] },
  { id: "GROSSISTI", label: "Grossisti", canali: ["FASTBOOK", "CENTROLIBRI", "GROSSISTI"] },
  { id: "ONLINE", label: "Online", canali: ["AMAZON", "IBS", "ALTRI_ONLINE"] },
];

function RecapCard({ label, canali, canaliPresenti, totalePerCanale }) {
  const canaliCard = canali.filter(c => canaliPresenti.includes(c));
  const totCard = canaliCard.reduce((s, c) => s + (totalePerCanale[c] || 0), 0);
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "14px 18px", flex: 1, minWidth: 180 }}>
      <div style={{ color: T.textMid, fontSize: "10px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ color: T.accent, fontSize: "22px", fontWeight: "700", marginBottom: 10 }}>{totCard.toLocaleString("it")}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {canaliCard.map(c => {
          const q = totalePerCanale[c] || 0;
          return (
            <div key={c} style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: T.textMid, fontSize: "11px" }}>{CANALI_LABELS[c] || c}</span>
              <span style={{ color: q > 0 ? T.green : T.textDim, fontWeight: q > 0 ? "700" : "400", fontSize: "12px" }}>{q > 0 ? q.toLocaleString("it") : "—"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CanaliMultiSelect({ canaliPresenti, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = canaliPresenti.filter(c => (CANALI_LABELS[c] || c).toLowerCase().includes(search.toLowerCase()));
  const toggleCanale = (c) => onChange(selected.includes(c) ? selected.filter(x => x !== c) : [...selected, c]);
  const label = selected.length === 0 ? "Tutti i canali" : selected.length === 1 ? CANALI_LABELS[selected[0]] || selected[0] : `${selected.length} canali`;
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{ ...css.input, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, minWidth: 160, justifyContent: "space-between" }}>
        <span style={{ color: selected.length > 0 ? T.accent : T.textMid }}>{label}</span>
        <span style={{ color: T.textDim, fontSize: "10px" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 50, background: T.surface, border: `1px solid ${T.borderHi}`, borderRadius: 4, marginTop: 4, width: 220, boxShadow: "0 4px 16px #0006" }}>
          <div style={{ padding: "8px 8px 4px" }}>
            <input autoFocus style={{ ...css.input, width: "100%", boxSizing: "border-box" }} placeholder="Cerca canale…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {selected.length > 0 && (
            <div style={{ padding: "2px 8px 4px" }}>
              <button onClick={() => { onChange([]); setOpen(false); }} style={{ ...css.btn("red"), fontSize: "10px", padding: "2px 8px" }}>Deseleziona tutti</button>
            </div>
          )}
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {filtered.map(c => (
              <label key={c} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", cursor: "pointer", background: selected.includes(c) ? T.accent + "18" : "transparent" }}>
                <input type="checkbox" checked={selected.includes(c)} onChange={() => toggleCanale(c)} style={{ accentColor: T.accent }} />
                <span style={{ color: selected.includes(c) ? T.accent : T.text, fontSize: "12px" }}>{CANALI_LABELS[c] || c}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      {open && <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />}
    </div>
  );
}

export default function CampagneRiepilogo({ titoli, prenotato, prenotatoClienti = [], campagnaLabel }) {
  const [search, setSearch] = useState("");
  const [filterEditore, setFilterEditore] = useState("");
  const [canaliVisibili, setCanaliVisibili] = useState([]);
  const [soloPrenotati, setSoloPrenotati] = useState(false);
  const [sortKey, setSortKey] = useState("ranking_titolo");
  const [sortDir, setSortDir] = useState(1);
  const [eanEsclusi, setEanEsclusi] = useState(new Set()); // EAN esclusi dal totale/export

  const prenMap = useMemo(() => {
    const m = {};
    prenotato.forEach(p => {
      if (!m[p.titolo_id]) m[p.titolo_id] = {};
      m[p.titolo_id][p.canale_codice] = (m[p.titolo_id][p.canale_codice] || 0) + p.quantita;
    });
    return m;
  }, [prenotato]);

  const canaliPresenti = useMemo(() => {
    const set = new Set();
    prenotato.forEach(p => set.add(p.canale_codice));
    return CANALI_ORDER.filter(c => set.has(c));
  }, [prenotato]);

  const canaliColonne = useMemo(() =>
    canaliVisibili.length > 0 ? canaliVisibili : canaliPresenti,
    [canaliVisibili, canaliPresenti]
  );

  // Totale per canale calcolato SOLO sui titoli NON esclusi (per il recap)
  const totalePerCanale = useMemo(() => {
    const m = {};
    titoli.forEach(t => {
      if (eanEsclusi.has(t.ean)) return;
      const pranCanali = prenMap[t.id] || {};
      Object.entries(pranCanali).forEach(([c, q]) => { m[c] = (m[c] || 0) + q; });
    });
    return m;
  }, [prenotato, titoli, eanEsclusi, prenMap]);

  const editori = useMemo(() => [...new Set(titoli.map(t => t.editore_nome).filter(Boolean))].sort(), [titoli]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => -d);
    else { setSortKey(key); setSortDir(1); }
  };
  const sortIcon = (key) => sortKey === key ? (sortDir === 1 ? " ↑" : " ↓") : "";

  const toggleEscludi = (ean) => {
    setEanEsclusi(prev => {
      const next = new Set(prev);
      if (next.has(ean)) next.delete(ean);
      else next.add(ean);
      return next;
    });
  };

  const rows = useMemo(() => {
    return titoli
      .map(t => {
        const pranCanali = prenMap[t.id] || {};
        const totPren = canaliColonne.reduce((s, c) => s + (pranCanali[c] || 0), 0);
        const totPrenAll = Object.values(pranCanali).reduce((s, v) => s + v, 0);
        const escluso = eanEsclusi.has(t.ean);
        return { ...t, pranCanali, totPren, totPrenAll, escluso };
      })
      .filter(t => {
        if (soloPrenotati && t.totPrenAll === 0) return false;
        if (filterEditore && t.editore_nome !== filterEditore) return false;
        if (search) {
          const q = search.toLowerCase();
          return (t.titolo || "").toLowerCase().includes(q) || (t.ean || "").includes(q) || (t.autore || "").toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        let va = a[sortKey], vb = b[sortKey];
        if (["totPren", "ranking_titolo"].includes(sortKey)) { va = Number(va) || 0; vb = Number(vb) || 0; }
        else { va = String(va || ""); vb = String(vb || ""); }
        if (va < vb) return -sortDir;
        if (va > vb) return sortDir;
        return 0;
      });
  }, [titoli, prenMap, search, filterEditore, soloPrenotati, sortKey, sortDir, canaliColonne, eanEsclusi]);

  const kpi = useMemo(() => ({
    totTitoli: rows.filter(r => !r.escluso).length,
    totConPren: rows.filter(r => !r.escluso && r.totPrenAll > 0).length,
    totCopie: rows.filter(r => !r.escluso).reduce((s, r) => s + r.totPren, 0),
    nEsclusi: eanEsclusi.size,
  }), [rows, eanEsclusi]);

  const exportExcel = () => {
    const XLSX = window.XLSX;
    const rowsExport = rows.filter(r => !r.escluso);
    const wb = XLSX.utils.book_new();

    // ── FOGLIO 1: DETTAGLIO TITOLI ──────────────────────────────────────
    const headers = ["Ranking", "EAN", "Titolo", "Autore", "Editore", "Prezzo", "Uscita",
      ...canaliColonne.map(c => CANALI_LABELS[c] || c), "TOTALE"];
    const dataRows = rowsExport.map(r => [
      r.ranking_titolo, r.ean, r.titolo, r.autore, r.editore_nome, r.prezzo, r.uscita,
      ...canaliColonne.map(c => r.pranCanali[c] || 0),
      r.totPren,
    ]);
    const totRow = ["", "", "TOTALE", "", "", "", "",
      ...canaliColonne.map(c => rowsExport.reduce((s, r) => s + (r.pranCanali[c] || 0), 0)),
      rowsExport.reduce((s, r) => s + r.totPren, 0),
    ];
    const ws1 = XLSX.utils.aoa_to_sheet([headers, ...dataRows, totRow]);
    ws1["!cols"] = [{ wch: 8 }, { wch: 14 }, { wch: 36 }, { wch: 22 }, { wch: 22 }, { wch: 8 }, { wch: 10 },
      ...canaliColonne.map(() => ({ wch: 13 })), { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws1, "RIEPILOGO");

    // ── FOGLIO 2: DASHBOARD CANALI ──────────────────────────────────────
    const totCopie = rowsExport.reduce((s, r) => s + r.totPren, 0);
    const nTitoli = rowsExport.length;
    const nConPren = rowsExport.filter(r => r.totPren > 0).length;

    // Macrogruppi
    const MACROGRUPPI_EXP = [
      { label: "Rete", canali: ["LIBRACCIO", "LIB_RELIGIOSE", "LIB_COOP", "INDIPENDENTI_ALTRE_CATENE"] },
      { label: "Catene Centralizzate", canali: ["FELTRINELLI", "MONDADORI", "UBIK", "GIUNTI"] },
      { label: "Grossisti", canali: ["FASTBOOK", "CENTROLIBRI", "GROSSISTI"] },
      { label: "Online", canali: ["AMAZON", "IBS", "ALTRI_ONLINE"] },
    ];

    const dashData = [];
    // Intestazione
    dashData.push([campagnaLabel, "", "", ""]);
    dashData.push([`Titoli: ${nTitoli}`, `Con prenotato: ${nConPren}`, `Totale copie: ${totCopie}`, eanEsclusi.size > 0 ? `EAN esclusi: ${eanEsclusi.size}` : ""]);
    dashData.push([]);

    // Riepilogo per macrogruppo
    dashData.push(["MACROGRUPPO", "TOTALE COPIE", "", ""]);
    MACROGRUPPI_EXP.forEach(mg => {
      const canaliMg = mg.canali.filter(c => canaliColonne.includes(c));
      const tot = canaliMg.reduce((s, c) => s + rowsExport.reduce((ss, r) => ss + (r.pranCanali[c] || 0), 0), 0);
      dashData.push([mg.label, tot, "", ""]);
    });
    dashData.push([]);

    // Dettaglio per canale
    dashData.push(["CANALE", "COPIE", "% SUL TOTALE", ""]);
    canaliColonne.forEach(c => {
      const tot = rowsExport.reduce((s, r) => s + (r.pranCanali[c] || 0), 0);
      const pct = totCopie > 0 ? ((tot / totCopie) * 100).toFixed(1) + "%" : "0%";
      dashData.push([CANALI_LABELS[c] || c, tot, pct, ""]);
    });
    dashData.push(["TOTALE", totCopie, "100%", ""]);
    dashData.push([]);

    // Top 10 titoli per prenotato
    dashData.push(["TOP 10 TITOLI PER PRENOTATO", "", "", ""]);
    dashData.push(["Titolo", "Editore", "EAN", "Copie"]);
    [...rowsExport].sort((a, b) => b.totPren - a.totPren).slice(0, 10).forEach(r => {
      dashData.push([r.titolo, r.editore_nome, r.ean, r.totPren]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(dashData);
    ws2["!cols"] = [{ wch: 36 }, { wch: 16 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws2, "DASHBOARD");

    // ── FOGLIO 3: DETTAGLIO PRENOTATO (per libreria) ───────────────────
    const eanValidi = new Set(rowsExport.map(r => r.ean)); // rispetta gli EAN esclusi
    const titoloByEan = Object.fromEntries(rowsExport.map(r => [r.ean, r.titolo]));

    const dettRows = prenotatoClienti
      .filter(p => eanValidi.has(p.ean))
      .map(p => [
        p.nome_cliente, p.codice_cliente, p.ean, titoloByEan[p.ean] || "", CANALI_LABELS[p.canale_codice] || p.canale_codice, p.quantita,
      ])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])) || String(a[2]).localeCompare(String(b[2])));

    const dettHeaders = ["Libreria", "Codice Cliente", "EAN", "Titolo", "Canale", "Quantità"];
    const dettTotRow = ["", "", "", "", "TOTALE", dettRows.reduce((s, r) => s + r[5], 0)];
    const ws3 = XLSX.utils.aoa_to_sheet([dettHeaders, ...dettRows, dettTotRow]);
    ws3["!cols"] = [{ wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 36 }, { wch: 18 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws3, "DETTAGLIO PRENOTATO");

    XLSX.writeFile(wb, `RIEPILOGO_${campagnaLabel.replace(/\s+/g, "_")}.xlsx`);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* RECAP MACROGRUPPI */}
      {prenotato.length > 0 && (
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, background: T.bg }}>
          {eanEsclusi.size > 0 && (
            <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: T.red, fontSize: "11px" }}>⚠ {eanEsclusi.size} EAN esclusi dal totale</span>
              <button style={{ ...css.btn("red"), fontSize: "10px", padding: "2px 8px" }} onClick={() => setEanEsclusi(new Set())}>Reimposta</button>
            </div>
          )}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {MACROGRUPPI.map(mg => (
              <RecapCard key={mg.id} label={mg.label} canali={mg.canali} canaliPresenti={canaliPresenti} totalePerCanale={totalePerCanale} />
            ))}
          </div>
        </div>
      )}

      {/* KPI + FILTRI */}
      <div style={{ padding: "10px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 20, flexWrap: "wrap", background: T.surface, alignItems: "center" }}>
        {[
          ["Titoli", kpi.totTitoli, T.text],
          ["Con prenotato", kpi.totConPren, T.green],
          ["Totale copie", kpi.totCopie.toLocaleString("it"), T.accent],
        ].map(([label, val, color]) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ color: T.textMid, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
            <span style={{ color, fontWeight: "700", fontSize: "16px" }}>{val}</span>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap", alignItems: "center" }}>
          <input style={{ ...css.input, width: 180 }} placeholder="Cerca titolo, EAN, autore…" value={search} onChange={e => setSearch(e.target.value)} />
          <select style={css.input} value={filterEditore} onChange={e => setFilterEditore(e.target.value)}>
            <option value="">Tutti gli editori</option>
            {editori.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <CanaliMultiSelect canaliPresenti={canaliPresenti} selected={canaliVisibili} onChange={setCanaliVisibili} />
          <label style={{ display: "flex", alignItems: "center", gap: 6, color: T.textMid, fontSize: "12px", cursor: "pointer" }}>
            <input type="checkbox" checked={soloPrenotati} onChange={e => setSoloPrenotati(e.target.checked)} />
            Solo prenotati
          </label>
          <button style={css.btn("accent")} onClick={exportExcel}>↓ Export Excel</button>
        </div>
      </div>

      {/* TABELLA */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
          <thead>
            <tr>
              {/* Colonna escludi */}
              <th style={css.th(false)} title="Escludi dal totale">✕</th>
              <th style={css.th(true)} onClick={() => toggleSort("ranking_titolo")}>Rk{sortIcon("ranking_titolo")}</th>
              <th style={css.th(false)}>EAN</th>
              <th style={css.th(true)} onClick={() => toggleSort("titolo")}>Titolo{sortIcon("titolo")}</th>
              <th style={css.th(true)} onClick={() => toggleSort("editore_nome")}>Editore{sortIcon("editore_nome")}</th>
              <th style={{ ...css.th(true), color: T.accent }} onClick={() => toggleSort("totPren")}>Totale{sortIcon("totPren")}</th>
              {canaliColonne.map(c => (
                <th key={c} style={css.th(false)}>{CANALI_LABELS[c] || c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id || i} style={{ background: r.escluso ? T.red + "0a" : i % 2 === 0 ? "transparent" : T.surface + "55", opacity: r.escluso ? 0.5 : 1 }}>
                <td style={{ ...css.td, textAlign: "center", padding: "8px 6px" }}>
                  <button
                    onClick={() => toggleEscludi(r.ean)}
                    title={r.escluso ? "Reinclude" : "Escludi dal totale"}
                    style={{ background: "transparent", border: `1px solid ${r.escluso ? T.green : T.red + "66"}`, color: r.escluso ? T.green : T.red, cursor: "pointer", borderRadius: 3, padding: "1px 6px", fontSize: "11px", fontFamily: "inherit" }}
                  >
                    {r.escluso ? "↩" : "✕"}
                  </button>
                </td>
                <td style={{ ...css.td, color: T.textMid, textAlign: "center" }}>{r.ranking_titolo || ""}</td>
                <td style={{ ...css.td, fontFamily: "monospace", fontSize: "11px", color: T.textDim }}>{r.ean}</td>
                <td style={{ ...css.td, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: "600" }}>{r.titolo}</td>
                <td style={{ ...css.td, color: T.accent, whiteSpace: "nowrap" }}>{r.editore_nome}</td>
                <td style={{ ...css.td, color: r.escluso ? T.textDim : r.totPren > 0 ? T.accent : T.textDim, fontWeight: "700", textAlign: "right" }}>
                  {r.totPren > 0 ? r.totPren.toLocaleString("it") : "—"}
                </td>
                {canaliColonne.map(c => (
                  <td key={c} style={{ ...css.td, textAlign: "right", color: (r.pranCanali[c] || 0) > 0 ? T.green : T.textDim }}>
                    {(r.pranCanali[c] || 0) > 0 ? r.pranCanali[c].toLocaleString("it") : "—"}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6 + canaliColonne.length} style={{ textAlign: "center", padding: 40, color: T.textDim }}>Nessun titolo trovato.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
