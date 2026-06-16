import { useState, useMemo } from "react";

const T = {
  bg: "#1a2140", surface: "#212d54", border: "#2e3d6b", borderHi: "#3d4f82",
  text: "#f0f2f8", textMid: "#8b9cc8", textDim: "#4a5a8a",
  accent: "#7b9fe8", green: "#4caf7d", red: "#e05c5c", purple: "#9c6fcf",
};

const css = {
  btn: (v = "default") => ({ padding: "6px 14px", border: `1px solid ${v === "accent" ? T.accent : v === "danger" ? T.red : T.border}`, background: v === "accent" ? T.accent : "transparent", color: v === "accent" ? "#000" : T.text, cursor: "pointer", fontSize: "12px", fontFamily: "inherit", borderRadius: 3, fontWeight: v === "accent" ? "700" : "400" }),
  input: { background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "5px 10px", fontSize: "12px", fontFamily: "inherit", borderRadius: 3, outline: "none" },
  th: (sortable) => ({ padding: "8px 12px", textAlign: "left", color: T.textMid, fontWeight: "400", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap", background: T.surface, position: "sticky", top: 0, zIndex: 1, cursor: sortable ? "pointer" : "default" }),
  td: { padding: "8px 12px", borderBottom: `1px solid ${T.border}22`, verticalAlign: "middle", fontSize: "12px" },
};

const CANALI_LABELS = {
  FELTRINELLI: "Feltrinelli", GIUNTI: "Giunti al Punto", MONDADORI: "Mondadori",
  UBIK: "Ubik", LIBRACCIO: "Libraccio", INDIPENDENTI_ALTRE_CATENE: "Indipendenti",
  LIB_RELIGIOSE: "Lib. Religiose", LIB_COOP: "Lib. Coop", ALTRI_ONLINE: "On-line",
  AMAZON: "Amazon", IBS: "Stereo Online", FASTBOOK: "Fastbook+GD", GROSSISTI: "Grossisti",
  CENTROLIBRI: "Centro Libri",
};

const CANALI_ORDER = ["FELTRINELLI", "MONDADORI", "UBIK", "GIUNTI", "LIBRACCIO", "LIB_RELIGIOSE", "LIB_COOP", "INDIPENDENTI_ALTRE_CATENE", "FASTBOOK", "CENTROLIBRI", "GROSSISTI", "AMAZON", "IBS", "ALTRI_ONLINE"];

export default function CampagneFineCampagna({ titoli, prenotato, campagnaLabel }) {
  const [search, setSearch] = useState("");
  const [filterEditore, setFilterEditore] = useState("");
  const [filterFormato, setFilterFormato] = useState("");
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

  // Canali presenti nel prenotato
  const canaliPresenti = useMemo(() => {
    const set = new Set();
    prenotato.forEach(p => set.add(p.canale_codice));
    return CANALI_ORDER.filter(c => set.has(c));
  }, [prenotato]);

  const editori = useMemo(() => [...new Set(titoli.map(t => t.editore_nome).filter(Boolean))].sort(), [titoli]);
  const formati = useMemo(() => [...new Set(titoli.map(t => t.formato).filter(Boolean))].sort(), [titoli]);

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
        if (filterFormato && t.formato !== filterFormato) return false;
        if (search) {
          const q = search.toLowerCase();
          return (t.titolo || "").toLowerCase().includes(q) || (t.ean || "").includes(q) || (t.autore || "").toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        let va = a[sortKey], vb = b[sortKey];
        if (sortKey === "totPren" || sortKey === "obiettivo_assegnato" || sortKey === "ranking_titolo" || sortKey === "ranking_editore") {
          va = Number(va) || 0; vb = Number(vb) || 0;
        } else {
          va = String(va || ""); vb = String(vb || "");
        }
        if (va < vb) return -sortDir;
        if (va > vb) return sortDir;
        return 0;
      });
  }, [titoli, prenMap, search, filterEditore, filterFormato, soloPrenotati, sortKey, sortDir]);

  const kpi = useMemo(() => {
    const totTitoli = rows.length;
    const totConPren = rows.filter(r => r.totPren > 0).length;
    const totCopie = rows.reduce((s, r) => s + r.totPren, 0);
    const totObj = rows.reduce((s, r) => s + (r.obiettivo_assegnato || 0), 0);
    return { totTitoli, totConPren, totCopie, totObj };
  }, [rows]);

  const exportExcel = () => {
    const XLSX = window.XLSX;
    const headers = [
      "Ranking Editore", "Ranking Titolo", "EAN", "Titolo", "Autore", "Editore",
      "Prezzo", "Uscita", "Formato", "Obiettivo", "▲", "★",
      ...canaliPresenti.map(c => CANALI_LABELS[c] || c),
      "TOTALE PRENOTATO",
    ];
    const dataRows = rows.map(r => [
      r.ranking_editore, r.ranking_titolo, r.ean, r.titolo, r.autore, r.editore_nome,
      r.prezzo, r.uscita, r.formato, r.obiettivo_assegnato || 0,
      r.il_triangolo ? "SI" : "", r.top_100 ? "SI" : "",
      ...canaliPresenti.map(c => r.pranCanali[c] || 0),
      r.totPren,
    ]);

    // Riga riepilogo totali
    const riepilogoRow = [
      "", "", "", "TOTALE", "", "",
      "", "", "", kpi.totObj,
      "", "",
      ...canaliPresenti.map(c => rows.reduce((s, r) => s + (r.pranCanali[c] || 0), 0)),
      kpi.totCopie,
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows, riepilogoRow]);

    // Larghezze colonne
    ws["!cols"] = [
      { wch: 8 }, { wch: 8 }, { wch: 14 }, { wch: 36 }, { wch: 22 }, { wch: 22 },
      { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 4 }, { wch: 4 },
      ...canaliPresenti.map(() => ({ wch: 12 })),
      { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CAMPAGNA");

    // Foglio riepilogo per editore
    const byEditore = {};
    rows.forEach(r => {
      if (!byEditore[r.editore_nome]) byEditore[r.editore_nome] = { obj: 0, pren: 0, titoli: 0 };
      byEditore[r.editore_nome].obj += r.obiettivo_assegnato || 0;
      byEditore[r.editore_nome].pren += r.totPren;
      byEditore[r.editore_nome].titoli += 1;
    });
    const riepilogoEditore = [
      ["Editore", "N. Titoli", "Obiettivo", "Prenotato", "% su Obj"],
      ...Object.entries(byEditore)
        .sort((a, b) => b[1].pren - a[1].pren)
        .map(([editore, v]) => [
          editore, v.titoli, v.obj, v.pren,
          v.obj > 0 ? Math.round((v.pren / v.obj) * 100) + "%" : "—",
        ]),
    ];
    const wsR = XLSX.utils.aoa_to_sheet(riepilogoEditore);
    XLSX.utils.book_append_sheet(wb, wsR, "RIEPILOGO EDITORI");

    XLSX.writeFile(wb, `CAMPAGNA_${campagnaLabel.replace(/\s+/g, "_")}.xlsx`);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* KPI bar */}
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 16, flexWrap: "wrap", background: T.surface }}>
        {[
          ["Titoli", kpi.totTitoli, T.text],
          ["Con prenotato", kpi.totConPren, T.green],
          ["Totale copie", kpi.totCopie.toLocaleString("it"), T.accent],
          ["Totale obiettivo", kpi.totObj.toLocaleString("it"), T.purple],
        ].map(([label, val, color]) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ color: T.textMid, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
            <span style={{ color, fontWeight: "700", fontSize: "18px" }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ padding: "10px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input
          style={{ ...css.input, width: 200 }}
          placeholder="Cerca titolo, EAN, autore…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select style={{ ...css.input }} value={filterEditore} onChange={e => setFilterEditore(e.target.value)}>
          <option value="">Tutti gli editori</option>
          {editori.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select style={{ ...css.input }} value={filterFormato} onChange={e => setFilterFormato(e.target.value)}>
          <option value="">Tutti i formati</option>
          {formati.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 6, color: T.textMid, fontSize: "12px", cursor: "pointer" }}>
          <input type="checkbox" checked={soloPrenotati} onChange={e => setSoloPrenotati(e.target.checked)} />
          Solo prenotati
        </label>
        <button style={{ ...css.btn("accent"), marginLeft: "auto" }} onClick={exportExcel}>↓ Export Excel</button>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr>
              <th style={css.th(true)} onClick={() => toggleSort("ranking_editore")}>Rk E{sortIcon("ranking_editore")}</th>
              <th style={css.th(true)} onClick={() => toggleSort("ranking_titolo")}>Rk T{sortIcon("ranking_titolo")}</th>
              <th style={css.th(false)}>EAN</th>
              <th style={css.th(true)} onClick={() => toggleSort("titolo")}>Titolo{sortIcon("titolo")}</th>
              <th style={css.th(true)} onClick={() => toggleSort("editore_nome")}>Editore{sortIcon("editore_nome")}</th>
              <th style={css.th(false)}>Fmt</th>
              <th style={css.th(true)} onClick={() => toggleSort("obiettivo_assegnato")}>Obj{sortIcon("obiettivo_assegnato")}</th>
              {canaliPresenti.map(c => (
                <th key={c} style={css.th(false)} title={CANALI_LABELS[c] || c}>
                  {(CANALI_LABELS[c] || c).substring(0, 8)}
                </th>
              ))}
              <th style={{ ...css.th(true), color: T.accent }} onClick={() => toggleSort("totPren")}>Totale{sortIcon("totPren")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id || i} style={{ background: i % 2 === 0 ? "transparent" : T.surface + "55" }}>
                <td style={{ ...css.td, color: T.textMid, textAlign: "center" }}>{r.ranking_editore || ""}</td>
                <td style={{ ...css.td, color: T.textMid, textAlign: "center" }}>{r.ranking_titolo || ""}</td>
                <td style={{ ...css.td, fontFamily: "monospace", fontSize: "11px", color: T.textDim }}>{r.ean}</td>
                <td style={{ ...css.td, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: "600" }}>
                  {r.il_triangolo && <span style={{ color: T.green, marginRight: 4 }}>▲</span>}
                  {r.top_100 && <span style={{ color: T.accent, marginRight: 4 }}>★</span>}
                  {r.titolo}
                </td>
                <td style={{ ...css.td, color: T.accent, whiteSpace: "nowrap" }}>{r.editore_nome}</td>
                <td style={{ ...css.td, color: T.textMid }}>{r.formato}</td>
                <td style={{ ...css.td, color: T.purple, textAlign: "right" }}>{r.obiettivo_assegnato || 0}</td>
                {canaliPresenti.map(c => (
                  <td key={c} style={{ ...css.td, textAlign: "right", color: (r.pranCanali[c] || 0) > 0 ? T.green : T.textDim }}>
                    {(r.pranCanali[c] || 0) > 0 ? r.pranCanali[c].toLocaleString("it") : "—"}
                  </td>
                ))}
                <td style={{ ...css.td, color: r.totPren > 0 ? T.accent : T.textDim, fontWeight: "700", textAlign: "right" }}>
                  {r.totPren > 0 ? r.totPren.toLocaleString("it") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: T.textDim }}>
            Nessun titolo trovato con i filtri attivi.
          </div>
        )}
      </div>
    </div>
  );
}
