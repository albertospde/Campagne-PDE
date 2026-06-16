import { useState, useMemo } from "react";

const T = {
  bg: "#1a2140", surface: "#212d54", border: "#2e3d6b", borderHi: "#3d4f82",
  text: "#f0f2f8", textMid: "#8b9cc8", textDim: "#4a5a8a",
  accent: "#7b9fe8", green: "#4caf7d", red: "#e05c5c", purple: "#9c6fcf",
};

const css = {
  btn: (v = "default") => ({ padding: "6px 14px", border: `1px solid ${v === "accent" ? T.accent : T.border}`, background: v === "accent" ? T.accent : "transparent", color: v === "accent" ? "#000" : T.text, cursor: "pointer", fontSize: "12px", fontFamily: "inherit", borderRadius: 3, fontWeight: v === "accent" ? "700" : "400" }),
  input: { background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "5px 10px", fontSize: "12px", fontFamily: "inherit", borderRadius: 3, outline: "none" },
  th: (sortable) => ({ padding: "8px 12px", textAlign: "left", color: T.textMid, fontWeight: "400", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap", background: T.surface, position: "sticky", top: 0, zIndex: 1, cursor: sortable ? "pointer" : "default" }),
  td: { padding: "8px 12px", borderBottom: `1px solid ${T.border}22`, verticalAlign: "middle", fontSize: "12px" },
};

const CANALI_LABELS = {
  FELTRINELLI: "Feltrinelli", GIUNTI: "Giunti al Punto", MONDADORI: "Mondadori",
  UBIK: "Ubik", LIBRACCIO: "Libraccio", INDIPENDENTI_ALTRE_CATENE: "Indipendenti",
  LIB_RELIGIOSE: "Lib. Religiose", LIB_COOP: "Librerie Coop", ALTRI_ONLINE: "On-line",
  AMAZON: "Amazon", IBS: "Stereo Online", FASTBOOK: "Fastbook+GD", GROSSISTI: "Grossisti",
  CENTROLIBRI: "Centro Libri",
};

const CANALI_ORDER = ["FELTRINELLI", "MONDADORI", "UBIK", "GIUNTI", "LIBRACCIO", "LIB_RELIGIOSE", "LIB_COOP", "INDIPENDENTI_ALTRE_CATENE", "FASTBOOK", "CENTROLIBRI", "GROSSISTI", "AMAZON", "IBS", "ALTRI_ONLINE"];

// Macrogruppi per il recap (stile GiroManager)
const MACROGRUPPI = [
  { id: "RETE", label: "Rete", canali: ["LIBRACCIO", "LIB_RELIGIOSE", "LIB_COOP", "INDIPENDENTI_ALTRE_CATENE"] },
  { id: "CATENE", label: "Catene Centralizzate", canali: ["FELTRINELLI", "MONDADORI", "UBIK", "GIUNTI"] },
  { id: "GROSSISTI", label: "Grossisti", canali: ["FASTBOOK", "CENTROLIBRI", "GROSSISTI"] },
  { id: "ONLINE", label: "Online", canali: ["AMAZON", "IBS", "ALTRI_ONLINE"] },
];

// Card recap macrogruppo
function RecapCard({ label, totPren, canali, canaliPresenti, totalePerCanale }) {
  const canaliCard = canali.filter(c => canaliPresenti.includes(c));
  const totCard = canaliCard.reduce((s, c) => s + (totalePerCanale[c] || 0), 0);

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "14px 18px", minWidth: 200, flex: 1 }}>
      <div style={{ color: T.textMid, fontSize: "10px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
        <span style={{ color: T.accent, fontSize: "22px", fontWeight: "700" }}>{totCard.toLocaleString("it")}</span>
        <span style={{ color: T.textDim, fontSize: "10px" }}>copie</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {canaliCard.map(c => {
          const q = totalePerCanale[c] || 0;
          return (
            <div key={c} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: T.textMid, fontSize: "11px" }}>{CANALI_LABELS[c] || c}</span>
              <span style={{ color: q > 0 ? T.green : T.textDim, fontWeight: q > 0 ? "700" : "400", fontSize: "12px" }}>
                {q > 0 ? q.toLocaleString("it") : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CampagneFineCampagna({ titoli, prenotato, campagnaLabel }) {
  const [search, setSearch] = useState("");
  const [filterEditore, setFilterEditore] = useState("");
  const [filterCanale, setFilterCanale] = useState("");
  const [soloPrenotati, setSoloPrenotati] = useState(false);
  const [sortKey, setSortKey] = useState("ranking_titolo");
  const [sortDir, setSortDir] = useState(1);

  // Aggrega prenotato per titolo_id → { canale_codice: qta }
  const prenMap = useMemo(() => {
    const m = {};
    prenotato.forEach(p => {
      if (!m[p.titolo_id]) m[p.titolo_id] = {};
      m[p.titolo_id][p.canale_codice] = (m[p.titolo_id][p.canale_codice] || 0) + p.quantita;
    });
    return m;
  }, [prenotato]);

  // Canali presenti nel prenotato (in ordine)
  const canaliPresenti = useMemo(() => {
    const set = new Set();
    prenotato.forEach(p => set.add(p.canale_codice));
    return CANALI_ORDER.filter(c => set.has(c));
  }, [prenotato]);

  // Totale per canale (su tutti i titoli, senza filtri — per il recap)
  const totalePerCanale = useMemo(() => {
    const m = {};
    prenotato.forEach(p => { m[p.canale_codice] = (m[p.canale_codice] || 0) + p.quantita; });
    return m;
  }, [prenotato]);

  const editori = useMemo(() => [...new Set(titoli.map(t => t.editore_nome).filter(Boolean))].sort(), [titoli]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => -d);
    else { setSortKey(key); setSortDir(1); }
  };
  const sortIcon = (key) => sortKey === key ? (sortDir === 1 ? " ↑" : " ↓") : "";

  const rows = useMemo(() => {
    return titoli
      .map(t => {
        const pranCanali = prenMap[t.id] || {};
        const totPren = Object.values(pranCanali).reduce((s, v) => s + v, 0);
        return { ...t, pranCanali, totPren };
      })
      .filter(t => {
        if (soloPrenotati && t.totPren === 0) return false;
        if (filterEditore && t.editore_nome !== filterEditore) return false;
        if (filterCanale && !(t.pranCanali[filterCanale] > 0)) return false;
        if (search) {
          const q = search.toLowerCase();
          return (t.titolo || "").toLowerCase().includes(q) || (t.ean || "").includes(q) || (t.autore || "").toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        let va = a[sortKey], vb = b[sortKey];
        if (["totPren", "ranking_titolo", "ranking_editore"].includes(sortKey)) {
          va = Number(va) || 0; vb = Number(vb) || 0;
        } else {
          va = String(va || ""); vb = String(vb || "");
        }
        if (va < vb) return -sortDir;
        if (va > vb) return sortDir;
        return 0;
      });
  }, [titoli, prenMap, search, filterEditore, filterCanale, soloPrenotati, sortKey, sortDir]);

  const kpi = useMemo(() => ({
    totTitoli: rows.length,
    totConPren: rows.filter(r => r.totPren > 0).length,
    totCopie: rows.reduce((s, r) => s + r.totPren, 0),
  }), [rows]);

  const exportExcel = () => {
    const XLSX = window.XLSX;
    const headers = [
      "Ranking", "EAN", "Titolo", "Autore", "Editore", "Prezzo", "Uscita", "Formato",
      ...canaliPresenti.map(c => CANALI_LABELS[c] || c),
      "TOTALE PRENOTATO",
    ];
    const dataRows = rows.map(r => [
      r.ranking_titolo, r.ean, r.titolo, r.autore, r.editore_nome, r.prezzo, r.uscita, r.formato,
      ...canaliPresenti.map(c => r.pranCanali[c] || 0),
      r.totPren,
    ]);
    const totRow = [
      "", "", "TOTALE", "", "", "", "", "",
      ...canaliPresenti.map(c => rows.reduce((s, r) => s + (r.pranCanali[c] || 0), 0)),
      kpi.totCopie,
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows, totRow]);
    ws["!cols"] = [
      { wch: 8 }, { wch: 14 }, { wch: 36 }, { wch: 22 }, { wch: 22 }, { wch: 8 }, { wch: 10 }, { wch: 10 },
      ...canaliPresenti.map(() => ({ wch: 13 })),
      { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CAMPAGNA");

    // Foglio riepilogo per editore
    const byEditore = {};
    rows.forEach(r => {
      if (!byEditore[r.editore_nome]) byEditore[r.editore_nome] = { pren: 0, titoli: 0 };
      byEditore[r.editore_nome].pren += r.totPren;
      byEditore[r.editore_nome].titoli += 1;
    });
    const wsR = XLSX.utils.aoa_to_sheet([
      ["Editore", "N. Titoli", "Prenotato"],
      ...Object.entries(byEditore).sort((a, b) => b[1].pren - a[1].pren).map(([e, v]) => [e, v.titoli, v.pren]),
    ]);
    XLSX.utils.book_append_sheet(wb, wsR, "RIEPILOGO EDITORI");
    XLSX.writeFile(wb, `CAMPAGNA_${campagnaLabel.replace(/\s+/g, "_")}.xlsx`);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* RECAP MACROGRUPPI */}
      {prenotato.length > 0 && (
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, background: T.bg }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {MACROGRUPPI.map(mg => (
              <RecapCard
                key={mg.id}
                label={mg.label}
                canali={mg.canali}
                canaliPresenti={canaliPresenti}
                totalePerCanale={totalePerCanale}
              />
            ))}
          </div>
        </div>
      )}

      {/* KPI bar */}
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
        {/* Filtri */}
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap", alignItems: "center" }}>
          <input
            style={{ ...css.input, width: 180 }}
            placeholder="Cerca titolo, EAN, autore…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select style={css.input} value={filterEditore} onChange={e => setFilterEditore(e.target.value)}>
            <option value="">Tutti gli editori</option>
            {editori.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select style={css.input} value={filterCanale} onChange={e => setFilterCanale(e.target.value)}>
            <option value="">Tutti i canali</option>
            {canaliPresenti.map(c => <option key={c} value={c}>{CANALI_LABELS[c] || c}</option>)}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 6, color: T.textMid, fontSize: "12px", cursor: "pointer" }}>
            <input type="checkbox" checked={soloPrenotati} onChange={e => setSoloPrenotati(e.target.checked)} />
            Solo prenotati
          </label>
          <button style={css.btn("accent")} onClick={exportExcel}>↓ Export Excel</button>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
          <thead>
            <tr>
              <th style={css.th(true)} onClick={() => toggleSort("ranking_titolo")}>Rk{sortIcon("ranking_titolo")}</th>
              <th style={css.th(false)}>EAN</th>
              <th style={css.th(true)} onClick={() => toggleSort("titolo")}>Titolo{sortIcon("titolo")}</th>
              <th style={css.th(true)} onClick={() => toggleSort("editore_nome")}>Editore{sortIcon("editore_nome")}</th>
              {/* Totale PRIMA dei canali */}
              <th style={{ ...css.th(true), color: T.accent }} onClick={() => toggleSort("totPren")}>Totale{sortIcon("totPren")}</th>
              {canaliPresenti.map(c => (
                <th key={c} style={css.th(false)} title={CANALI_LABELS[c] || c}>
                  {(CANALI_LABELS[c] || c).substring(0, 9)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id || i} style={{ background: i % 2 === 0 ? "transparent" : T.surface + "55" }}>
                <td style={{ ...css.td, color: T.textMid, textAlign: "center" }}>{r.ranking_titolo || ""}</td>
                <td style={{ ...css.td, fontFamily: "monospace", fontSize: "11px", color: T.textDim }}>{r.ean}</td>
                <td style={{ ...css.td, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: "600" }}>{r.titolo}</td>
                <td style={{ ...css.td, color: T.accent, whiteSpace: "nowrap" }}>{r.editore_nome}</td>
                {/* Totale prima */}
                <td style={{ ...css.td, color: r.totPren > 0 ? T.accent : T.textDim, fontWeight: "700", textAlign: "right" }}>
                  {r.totPren > 0 ? r.totPren.toLocaleString("it") : "—"}
                </td>
                {canaliPresenti.map(c => (
                  <td key={c} style={{ ...css.td, textAlign: "right", color: (r.pranCanali[c] || 0) > 0 ? T.green : T.textDim }}>
                    {(r.pranCanali[c] || 0) > 0 ? r.pranCanali[c].toLocaleString("it") : "—"}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5 + canaliPresenti.length} style={{ textAlign: "center", padding: 40, color: T.textDim }}>Nessun titolo trovato.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
