import { useState, useMemo } from "react";

const T = {
  bg: "#1a2140", surface: "#212d54", border: "#2e3d6b", borderHi: "#3d4f82",
  text: "#f0f2f8", textMid: "#8b9cc8", textDim: "#4a5a8a",
  accent: "#7b9fe8", green: "#4caf7d", red: "#e05c5c", yellow: "#f0c040",
};

const css = {
  btn: (v = "default") => ({ padding: "6px 14px", border: `1px solid ${v === "accent" ? T.accent : v === "danger" ? T.red : T.border}`, background: v === "accent" ? T.accent : "transparent", color: v === "accent" ? "#000" : v === "danger" ? T.red : T.text, cursor: "pointer", fontSize: "12px", fontFamily: "inherit", borderRadius: 3, fontWeight: v === "accent" ? "700" : "400" }),
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
  AMAZON: "Amazon", IBS: "IBS", FASTBOOK: "Fastbook+GD", GROSSISTI: "Grossisti",
  CENTROLIBRI: "Centrolibri",
};

function DeltaBadge({ delta }) {
  if (delta === 0) return <span style={{ color: T.green, fontWeight: "700" }}>✓ OK</span>;
  const color = T.red;
  const label = delta > 0 ? `+${delta} libri in eccesso` : `${delta} libri mancanti`;
  return <span style={{ color, fontWeight: "700" }}>{label}</span>;
}

export default function CampagneKit({ titoli, prenotato }) {
  const [eanKit, setEanKit] = useState("");
  const [pzPerKit, setPzPerKit] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [risultati, setRisultati] = useState(null);
  const [search, setSearch] = useState("");
  const [soloErrori, setSoloErrori] = useState(false);
  const [sortKey, setSortKey] = useState("nome_cliente");
  const [sortDir, setSortDir] = useState(1);

  const prop = parseInt(pzPerKit) || 0;
  const eanNorm = eanKit.trim().replace(/\D/g, "");

  // EAN titoli campagna con prezzo > 0.10 (libri validi per il kit)
  const eanLibriValidi = useMemo(() => {
    const set = new Set();
    titoli.forEach(t => {
      if ((t.prezzo || 0) > 0.10 && t.ean && t.ean !== eanNorm) set.add(t.ean);
    });
    return set;
  }, [titoli, eanNorm]);

  // titolo_id → ean map per lookup veloce
  const titoloIdToEan = useMemo(() => {
    const m = {};
    titoli.forEach(t => { m[t.id] = t.ean; });
    return m;
  }, [titoli]);

  const elabora = () => {
    if (!eanNorm || prop < 1) return;

    // Struttura: codice_cliente → { nome, canale, kit_ord, libri_ord }
    // prenotato ha: { titolo_id, canale_codice, quantita, ean }
    // Ma prenotato è aggregato per titolo_id+canale, non per cliente
    // → non abbiamo il dettaglio cliente nel prenotato Supabase
    // Usiamo i dati aggregati per canale, raggruppando per canale_codice

    // Aggregazione per canale: kit ordinati + libri ordinati
    const perCanale = {};

    prenotato.forEach(p => {
      const ean = p.ean || titoloIdToEan[p.titolo_id] || "";
      const canale = p.canale_codice;
      if (!perCanale[canale]) perCanale[canale] = { canale, kit_ord: 0, libri_ord: 0 };

      if (ean === eanNorm) {
        perCanale[canale].kit_ord += p.quantita;
      } else if (eanLibriValidi.has(ean)) {
        perCanale[canale].libri_ord += p.quantita;
      }
    });

    const res = Object.values(perCanale)
      .filter(r => r.kit_ord > 0 || r.libri_ord > 0)
      .map(r => {
        const libri_attesi = r.kit_ord * prop;
        const delta = r.libri_ord - libri_attesi;
        return { ...r, libri_attesi, delta };
      });

    setRisultati(res);
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => -d);
    else { setSortKey(key); setSortDir(1); }
  };
  const sortIcon = (key) => sortKey === key ? (sortDir === 1 ? " ↑" : " ↓") : "";

  const rows = useMemo(() => {
    if (!risultati) return [];
    return risultati
      .filter(r => {
        if (soloErrori && r.delta === 0) return false;
        if (search) {
          const q = search.toLowerCase();
          return (CANALI_LABELS[r.canale] || r.canale).toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        let va = a[sortKey], vb = b[sortKey];
        if (["kit_ord", "libri_attesi", "libri_ord", "delta"].includes(sortKey)) {
          va = Number(va); vb = Number(vb);
        } else {
          va = String(va || "").toLowerCase(); vb = String(vb || "").toLowerCase();
        }
        if (va < vb) return -sortDir;
        if (va > vb) return sortDir;
        return 0;
      });
  }, [risultati, search, soloErrori, sortKey, sortDir]);

  const totali = useMemo(() => ({
    kit: rows.reduce((s, r) => s + r.kit_ord, 0),
    attesi: rows.reduce((s, r) => s + r.libri_attesi, 0),
    effettivi: rows.reduce((s, r) => s + r.libri_ord, 0),
    delta: rows.reduce((s, r) => s + r.delta, 0),
    errori: rows.filter(r => r.delta !== 0).length,
  }), [rows]);

  const exportExcel = () => {
    if (!rows.length) return;
    const XLSX = window.XLSX;
    const headers = ["Canale", "Kit Ordinati", "Libri Attesi", "Libri Effettivi", "Delta"];
    const data = rows.map(r => [CANALI_LABELS[r.canale] || r.canale, r.kit_ord, r.libri_attesi, r.libri_ord, r.delta]);
    const totRow = ["TOTALE", totali.kit, totali.attesi, totali.effettivi, totali.delta];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data, totRow]);
    ws["!cols"] = [{ wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KIT");
    XLSX.writeFile(wb, `KIT_${eanNorm}.xlsx`);
  };

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
            <div style={{ color: T.textMid, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Descrizione kit</div>
            <input style={{ ...css.input, width: 220 }} placeholder="es. Borsa Adelphi Natale" value={descrizione} onChange={e => setDescrizione(e.target.value)} />
          </div>
          <button
            style={{ ...css.btn("accent"), padding: "7px 20px", alignSelf: "flex-end" }}
            onClick={elabora}
            disabled={!eanNorm || prop < 1}
          >
            Elabora
          </button>
        </div>

        {/* Info titoli validi */}
        {eanNorm && (
          <div style={{ marginTop: 10, color: T.textDim, fontSize: "11px" }}>
            {eanLibriValidi.size} titoli campagna con prezzo {">"} €0,10 considerati come libri del kit
            {descrizione && <span style={{ color: T.accent, marginLeft: 12 }}>· {descrizione}</span>}
          </div>
        )}
      </div>

      {/* Stato vuoto */}
      {!risultati && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: T.textDim }}>
          <div style={{ fontSize: "36px" }}>🧩</div>
          <div>Inserisci EAN kit e libri per kit, poi clicca <strong style={{ color: T.accent }}>Elabora</strong></div>
          <div style={{ fontSize: "11px" }}>Usa i dati già importati nel Prenotato — nessun file da caricare</div>
        </div>
      )}

      {risultati && risultati.length === 0 && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, color: T.textDim }}>
          <div style={{ fontSize: "36px" }}>🔍</div>
          <div>Nessun prenotato trovato per EAN <span style={{ color: T.accent, fontFamily: "monospace" }}>{eanNorm}</span></div>
          <div style={{ fontSize: "11px" }}>Verifica che l'EAN sia presente nel file Prenotato importato</div>
        </div>
      )}

      {risultati && risultati.length > 0 && (
        <>
          {/* KPI */}
          <div style={{ padding: "10px 20px", borderBottom: `1px solid ${T.border}`, background: T.bg, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
            {[
              ["Kit totali", totali.kit, T.accent],
              ["Libri attesi", totali.attesi, T.textMid],
              ["Libri effettivi", totali.effettivi, T.text],
              ["Delta totale", (totali.delta > 0 ? "+" : "") + totali.delta, totali.delta === 0 ? T.green : T.red],
              ["Canali con errori", totali.errori, totali.errori === 0 ? T.green : T.red],
            ].map(([label, val, color]) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ color: T.textMid, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
                <span style={{ color, fontWeight: "700", fontSize: "16px" }}>{val}</span>
              </div>
            ))}

            {/* Toolbar */}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <input style={{ ...css.input, width: 160 }} placeholder="Cerca canale…" value={search} onChange={e => setSearch(e.target.value)} />
              <label style={{ display: "flex", alignItems: "center", gap: 6, color: T.textMid, fontSize: "12px", cursor: "pointer" }}>
                <input type="checkbox" checked={soloErrori} onChange={e => setSoloErrori(e.target.checked)} />
                Solo errori
              </label>
              <button style={css.btn("accent")} onClick={exportExcel}>↓ Export</button>
            </div>
          </div>

          {/* TABELLA */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...css.th, cursor: "pointer" }} onClick={() => toggleSort("canale")}>Canale{sortIcon("canale")}</th>
                  <th style={{ ...css.th, cursor: "pointer", textAlign: "right" }} onClick={() => toggleSort("kit_ord")}>Kit Ordinati{sortIcon("kit_ord")}</th>
                  <th style={{ ...css.th, cursor: "pointer", textAlign: "right" }} onClick={() => toggleSort("libri_attesi")}>Libri Attesi{sortIcon("libri_attesi")}</th>
                  <th style={{ ...css.th, cursor: "pointer", textAlign: "right" }} onClick={() => toggleSort("libri_ord")}>Libri Effettivi{sortIcon("libri_ord")}</th>
                  <th style={{ ...css.th, cursor: "pointer", textAlign: "right" }} onClick={() => toggleSort("delta")}>Delta{sortIcon("delta")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.canale} style={{ background: r.delta !== 0 ? T.red + "0d" : i % 2 === 0 ? "transparent" : T.surface + "55" }}>
                    <td style={{ ...css.td, fontWeight: "600" }}>{CANALI_LABELS[r.canale] || r.canale}</td>
                    <td style={{ ...css.td, textAlign: "right", color: T.accent, fontWeight: "700" }}>{r.kit_ord.toLocaleString("it")}</td>
                    <td style={{ ...css.td, textAlign: "right", color: T.textMid }}>{r.libri_attesi.toLocaleString("it")}</td>
                    <td style={{ ...css.td, textAlign: "right", color: T.text, fontWeight: "600" }}>{r.libri_ord.toLocaleString("it")}</td>
                    <td style={{ ...css.td, textAlign: "right" }}><DeltaBadge delta={r.delta} /></td>
                  </tr>
                ))}
                {/* Totali */}
                <tr style={{ background: T.surface, borderTop: `2px solid ${T.border}` }}>
                  <td style={{ ...css.td, fontWeight: "700", color: T.textMid }}>TOTALE</td>
                  <td style={{ ...css.td, textAlign: "right", fontWeight: "700", color: T.accent }}>{totali.kit.toLocaleString("it")}</td>
                  <td style={{ ...css.td, textAlign: "right", fontWeight: "700", color: T.textMid }}>{totali.attesi.toLocaleString("it")}</td>
                  <td style={{ ...css.td, textAlign: "right", fontWeight: "700", color: T.text }}>{totali.effettivi.toLocaleString("it")}</td>
                  <td style={{ ...css.td, textAlign: "right" }}><DeltaBadge delta={totali.delta} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
