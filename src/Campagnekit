import { useState, useCallback, useMemo } from "react";

const T = {
  bg: "#1a2140", surface: "#212d54", border: "#2e3d6b", borderHi: "#3d4f82",
  text: "#f0f2f8", textMid: "#8b9cc8", textDim: "#4a5a8a",
  accent: "#7b9fe8", green: "#4caf7d", red: "#e05c5c", yellow: "#f0c040",
};

const css = {
  btn: (v = "default") => ({ padding: "6px 14px", border: `1px solid ${v === "accent" ? T.accent : v === "danger" ? T.red : T.border}`, background: v === "accent" ? T.accent : "transparent", color: v === "accent" ? "#000" : T.text, cursor: "pointer", fontSize: "12px", fontFamily: "inherit", borderRadius: 3, fontWeight: v === "accent" ? "700" : "400" }),
  input: { background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "5px 10px", fontSize: "12px", fontFamily: "inherit", borderRadius: 3, outline: "none" },
  th: { padding: "8px 12px", textAlign: "left", color: T.textMid, fontWeight: "400", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap", background: T.surface, position: "sticky", top: 0, zIndex: 1 },
  td: { padding: "8px 12px", borderBottom: `1px solid ${T.border}22`, verticalAlign: "middle", fontSize: "12px" },
};

const GRUPPI_CANALE = {
  2: "FELTRINELLI", 23: "FELTRINELLI", 59: "FELTRINELLI", 77: "FELTRINELLI",
  8: "MONDADORI", 34: "MONDADORI", 80: "MONDADORI",
  83: "UBIK", 32: "GIUNTI",
  11: "LIBRACCIO", 56: "LIBRACCIO", 88: "LIBRACCIO", 90: "LIBRACCIO", 91: "LIBRACCIO", 92: "LIBRACCIO",
  6: "LIB_RELIGIOSE", 18: "LIB_RELIGIOSE", 19: "LIB_RELIGIOSE", 21: "LIB_RELIGIOSE", 57: "LIB_RELIGIOSE",
  36: "LIB_COOP",
  4: "INDIPENDENTI_ALTRE_CATENE", 22: "INDIPENDENTI_ALTRE_CATENE", 24: "INDIPENDENTI_ALTRE_CATENE", 60: "INDIPENDENTI_ALTRE_CATENE",
  28: "FASTBOOK", 63: "CENTROLIBRI",
  25: "GROSSISTI", 30: "GROSSISTI", 94: "GROSSISTI",
  82: "AMAZON", 58: "IBS", 33: "ALTRI_ONLINE",
};

const CANALI_LABELS = {
  FELTRINELLI: "Feltrinelli", GIUNTI: "Giunti al Punto", MONDADORI: "Mondadori",
  UBIK: "Ubik", LIBRACCIO: "Libraccio", INDIPENDENTI_ALTRE_CATENE: "Indipendenti",
  LIB_RELIGIOSE: "Lib. Religiose", LIB_COOP: "Librerie Coop", ALTRI_ONLINE: "On-line",
  AMAZON: "Amazon", IBS: "Stereo Online", FASTBOOK: "Fastbook+GD", GROSSISTI: "Grossisti",
  CENTROLIBRI: "Centro Libri",
};

function DeltaBadge({ delta }) {
  if (delta === 0) return <span style={{ color: T.green, fontWeight: "700" }}>✓ 0</span>;
  const color = delta > 0 ? T.yellow : T.red;
  const label = delta > 0 ? `+${delta} da togliere` : `${delta} da aggiungere`;
  return <span style={{ color, fontWeight: "700" }}>{label}</span>;
}

export default function CampagneKit({ campagnaLabel }) {
  // Step 1: configurazione kit
  const [eanKit, setEanKit] = useState("");
  const [proporzione, setProporzione] = useState("");
  const [nomeKit, setNomeKit] = useState("");

  // Step 2: file pianifica visite
  const [righe, setRighe] = useState([]); // righe grezze dal file
  const [fileName, setFileName] = useState("");

  // Filtri tabella
  const [search, setSearch] = useState("");
  const [filterCanale, setFilterCanale] = useState("");
  const [soloConDelta, setSoloConDelta] = useState(false);
  const [sortKey, setSortKey] = useState("nome_cliente");
  const [sortDir, setSortDir] = useState(1);

  const prop = parseInt(proporzione) || 0;
  const configured = eanKit.trim().length > 0 && prop > 0;

  const handleFile = useCallback((e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFileName(f.name);
    const XLSX = window.XLSX;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: "array" });
        const sheetName = wb.SheetNames.find(n => n.toLowerCase().includes("pianifica")) || wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
        setRighe(data);
      } catch (err) {
        alert("Errore lettura file: " + err.message);
      }
    };
    reader.readAsArrayBuffer(f);
  }, []);

  // Aggrega righe per codice cliente, filtrando per EAN kit
  const clienti = useMemo(() => {
    if (!configured || righe.length === 0) return [];

    const eanNorm = eanKit.trim().replace(/\D/g, "");
    const map = {};

    righe.forEach(row => {
      const ean = String(row["EAN"] || "").trim().replace(/\D/g, "");
      if (ean !== eanNorm) return;

      const qta = parseInt(row["Pren (Qtà)"]) || 0;
      if (qta === 0) return;

      const codice = String(row["Codice cliente"] || "").trim();
      const nome = String(row["Nome Cliente"] || "").trim();
      const gruppoRaw = row["Gruppo cliente"];

      let canale = "INDIPENDENTI_ALTRE_CATENE";
      if (gruppoRaw !== "" && gruppoRaw !== null && gruppoRaw !== undefined) {
        const g = parseInt(parseFloat(gruppoRaw));
        if (!isNaN(g) && g !== 0) canale = GRUPPI_CANALE[g] || "INDIPENDENTI_ALTRE_CATENE";
      }

      const key = `${codice}__${canale}`;
      if (!map[key]) map[key] = { codice_cliente: codice, nome_cliente: nome, canale, qta_prenotata: 0 };
      map[key].qta_prenotata += qta;
    });

    return Object.values(map).map(r => {
      const kit = Math.floor(r.qta_prenotata / prop);
      const copie_previste = kit * prop;
      const delta = r.qta_prenotata - copie_previste;
      return { ...r, kit_assegnati: kit, copie_previste, delta };
    });
  }, [righe, eanKit, prop, configured]);

  // Totali
  const totali = useMemo(() => ({
    prenotate: clienti.reduce((s, r) => s + r.qta_prenotata, 0),
    kit: clienti.reduce((s, r) => s + r.kit_assegnati, 0),
    previste: clienti.reduce((s, r) => s + r.copie_previste, 0),
    delta: clienti.reduce((s, r) => s + r.delta, 0),
  }), [clienti]);

  const canaliPresenti = useMemo(() => [...new Set(clienti.map(r => r.canale))].sort(), [clienti]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => -d);
    else { setSortKey(key); setSortDir(1); }
  };
  const sortIcon = (key) => sortKey === key ? (sortDir === 1 ? " ↑" : " ↓") : "";

  const rows = useMemo(() => {
    return clienti
      .filter(r => {
        if (filterCanale && r.canale !== filterCanale) return false;
        if (soloConDelta && r.delta === 0) return false;
        if (search) {
          const q = search.toLowerCase();
          return r.nome_cliente.toLowerCase().includes(q) || r.codice_cliente.includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        let va = a[sortKey], vb = b[sortKey];
        if (["qta_prenotata", "kit_assegnati", "copie_previste", "delta"].includes(sortKey)) {
          va = Number(va); vb = Number(vb);
        } else {
          va = String(va || "").toLowerCase(); vb = String(vb || "").toLowerCase();
        }
        if (va < vb) return -sortDir;
        if (va > vb) return sortDir;
        return 0;
      });
  }, [clienti, search, filterCanale, soloConDelta, sortKey, sortDir]);

  const exportExcel = () => {
    if (rows.length === 0) return;
    const XLSX = window.XLSX;
    const headers = ["Cod. Cliente", "Nome Cliente", "Canale", "Copie Prenotate", "Kit Assegnati", "Copie Previste", "Delta"];
    const data = rows.map(r => [r.codice_cliente, r.nome_cliente, CANALI_LABELS[r.canale] || r.canale, r.qta_prenotata, r.kit_assegnati, r.copie_previste, r.delta]);
    const totRow = ["", "TOTALE", "", totali.prenotate, totali.kit, totali.previste, totali.delta];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data, totRow]);
    ws["!cols"] = [{ wch: 12 }, { wch: 32 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KIT");
    XLSX.writeFile(wb, `KIT_${(eanKit || "").trim()}_${campagnaLabel.replace(/\s+/g, "_")}.xlsx`);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* CONFIG KIT */}
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <div style={{ color: T.textMid, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>EAN Codice Kit *</div>
            <input
              style={{ ...css.input, width: 160, fontFamily: "monospace" }}
              placeholder="es. 9788812345678"
              value={eanKit}
              onChange={e => setEanKit(e.target.value)}
            />
          </div>
          <div>
            <div style={{ color: T.textMid, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Pz per Kit *</div>
            <input
              style={{ ...css.input, width: 80, textAlign: "center" }}
              placeholder="es. 3"
              type="number"
              min="1"
              value={proporzione}
              onChange={e => setProporzione(e.target.value)}
            />
          </div>
          <div>
            <div style={{ color: T.textMid, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Nome Kit (opz.)</div>
            <input
              style={{ ...css.input, width: 200 }}
              placeholder="es. Kit Natale Adelphi"
              value={nomeKit}
              onChange={e => setNomeKit(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <div>
              <div style={{ color: T.textMid, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
                File Pianifica Visite
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="file" accept=".xlsx" onChange={handleFile} style={{ display: "none" }} id="kit-pv-file" />
                <label htmlFor="kit-pv-file" style={{ ...css.btn(righe.length > 0 ? "default" : "accent"), cursor: "pointer" }}>
                  {righe.length > 0 ? "Ricarica file" : "Carica .xlsx"}
                </label>
                {fileName && <span style={{ color: T.green, fontSize: "11px" }}>✓ {fileName}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Info configurazione */}
        {configured && righe.length > 0 && (
          <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              ["EAN Kit", eanKit.trim()],
              ["Proporzione", `${prop} pz/kit`],
              ["Clienti trovati", clienti.length],
              ["Totale prenotato", totali.prenotate.toLocaleString("it") + " pz"],
              ["Kit totali", totali.kit.toLocaleString("it")],
              ["Copie previste", totali.previste.toLocaleString("it") + " pz"],
              ["Delta totale", (totali.delta > 0 ? "+" : "") + totali.delta + " pz"],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ color: T.textDim, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
                <span style={{ color: label === "Delta totale" ? (totali.delta === 0 ? T.green : T.yellow) : T.text, fontWeight: "600", fontSize: "13px" }}>{val}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stato vuoto */}
      {!configured && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: T.textDim }}>
          <div style={{ fontSize: "36px" }}>🧩</div>
          <div>Inserisci EAN del kit e proporzione per iniziare</div>
        </div>
      )}

      {configured && righe.length === 0 && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: T.textDim }}>
          <div style={{ fontSize: "36px" }}>📂</div>
          <div>Carica il file Pianifica Visite per vedere i clienti</div>
        </div>
      )}

      {configured && righe.length > 0 && clienti.length === 0 && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, color: T.textDim }}>
          <div style={{ fontSize: "36px" }}>🔍</div>
          <div>Nessun cliente trovato per EAN <span style={{ color: T.accent, fontFamily: "monospace" }}>{eanKit.trim()}</span></div>
          <div style={{ fontSize: "11px" }}>Verifica che l'EAN sia corretto e presente nel file</div>
        </div>
      )}

      {configured && clienti.length > 0 && (
        <>
          {/* TOOLBAR */}
          <div style={{ padding: "10px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              style={{ ...css.input, width: 200 }}
              placeholder="Cerca cliente…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select style={css.input} value={filterCanale} onChange={e => setFilterCanale(e.target.value)}>
              <option value="">Tutti i canali</option>
              {canaliPresenti.map(c => <option key={c} value={c}>{CANALI_LABELS[c] || c}</option>)}
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: 6, color: T.textMid, fontSize: "12px", cursor: "pointer" }}>
              <input type="checkbox" checked={soloConDelta} onChange={e => setSoloConDelta(e.target.checked)} />
              Solo con delta ≠ 0
            </label>
            <span style={{ color: T.textDim, fontSize: "11px", marginLeft: 4 }}>{rows.length} clienti</span>
            <button style={{ ...css.btn("accent"), marginLeft: "auto" }} onClick={exportExcel}>↓ Export Excel</button>
          </div>

          {/* TABELLA */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
              <thead>
                <tr>
                  <th style={{ ...css.th, cursor: "pointer" }} onClick={() => toggleSort("codice_cliente")}>Cod. Cliente{sortIcon("codice_cliente")}</th>
                  <th style={{ ...css.th, cursor: "pointer" }} onClick={() => toggleSort("nome_cliente")}>Nome Cliente{sortIcon("nome_cliente")}</th>
                  <th style={{ ...css.th, cursor: "pointer" }} onClick={() => toggleSort("canale")}>Canale{sortIcon("canale")}</th>
                  <th style={{ ...css.th, cursor: "pointer", textAlign: "right" }} onClick={() => toggleSort("qta_prenotata")}>Copie Prenotate{sortIcon("qta_prenotata")}</th>
                  <th style={{ ...css.th, cursor: "pointer", textAlign: "right" }} onClick={() => toggleSort("kit_assegnati")}>Kit Assegnati{sortIcon("kit_assegnati")}</th>
                  <th style={{ ...css.th, cursor: "pointer", textAlign: "right" }} onClick={() => toggleSort("copie_previste")}>Copie Previste{sortIcon("copie_previste")}</th>
                  <th style={{ ...css.th, cursor: "pointer", textAlign: "right" }} onClick={() => toggleSort("delta")}>Delta{sortIcon("delta")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.codice_cliente}_${r.canale}`} style={{ background: i % 2 === 0 ? "transparent" : T.surface + "55" }}>
                    <td style={{ ...css.td, fontFamily: "monospace", fontSize: "11px", color: T.textDim }}>{r.codice_cliente}</td>
                    <td style={{ ...css.td, fontWeight: "600", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.nome_cliente}</td>
                    <td style={{ ...css.td, color: T.accent }}>{CANALI_LABELS[r.canale] || r.canale}</td>
                    <td style={{ ...css.td, textAlign: "right", color: T.text }}>{r.qta_prenotata.toLocaleString("it")}</td>
                    <td style={{ ...css.td, textAlign: "right", color: T.accent, fontWeight: "700" }}>{r.kit_assegnati.toLocaleString("it")}</td>
                    <td style={{ ...css.td, textAlign: "right", color: T.textMid }}>{r.copie_previste.toLocaleString("it")}</td>
                    <td style={{ ...css.td, textAlign: "right" }}><DeltaBadge delta={r.delta} /></td>
                  </tr>
                ))}
                {/* Riga totali */}
                <tr style={{ background: T.surface, borderTop: `2px solid ${T.border}` }}>
                  <td style={{ ...css.td, color: T.textMid, fontWeight: "700", fontSize: "11px" }} colSpan={3}>TOTALE ({rows.length} clienti)</td>
                  <td style={{ ...css.td, textAlign: "right", fontWeight: "700", color: T.text }}>{rows.reduce((s, r) => s + r.qta_prenotata, 0).toLocaleString("it")}</td>
                  <td style={{ ...css.td, textAlign: "right", fontWeight: "700", color: T.accent }}>{rows.reduce((s, r) => s + r.kit_assegnati, 0).toLocaleString("it")}</td>
                  <td style={{ ...css.td, textAlign: "right", fontWeight: "700", color: T.textMid }}>{rows.reduce((s, r) => s + r.copie_previste, 0).toLocaleString("it")}</td>
                  <td style={{ ...css.td, textAlign: "right" }}>
                    <DeltaBadge delta={rows.reduce((s, r) => s + r.delta, 0)} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
