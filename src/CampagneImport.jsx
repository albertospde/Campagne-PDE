import { useState, useCallback } from "react";

const SUPABASE_URL = "https://tdflwenlylhctxssatax.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZmx3ZW5seWxoY3R4c3NhdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMzgyNzYsImV4cCI6MjA5MTkxNDI3Nn0.l35qEL7LOvyYuI1McQlVqj4vbyTqmlevcmqWbTGYi2Q";

const T = {
  bg: "#1a2140", surface: "#212d54", border: "#2e3d6b", borderHi: "#3d4f82",
  text: "#f0f2f8", textMid: "#8b9cc8", textDim: "#4a5a8a",
  accent: "#7b9fe8", green: "#4caf7d", red: "#e05c5c",
};

const css = {
  btn: (v = "default") => ({ padding: "6px 14px", border: `1px solid ${v === "accent" ? T.accent : v === "danger" ? T.red : T.border}`, background: v === "accent" ? T.accent : v === "danger" ? T.red + "22" : "transparent", color: v === "accent" ? "#000" : v === "danger" ? T.red : T.text, cursor: "pointer", fontSize: "12px", fontFamily: "inherit", borderRadius: 3, fontWeight: v === "accent" ? "700" : "400" }),
  input: { background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "5px 10px", fontSize: "12px", fontFamily: "inherit", borderRadius: 3, outline: "none" },
  th: { padding: "8px 12px", textAlign: "left", color: T.textMid, fontWeight: "400", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap", background: T.surface },
  td: { padding: "7px 12px", borderBottom: `1px solid ${T.border}22`, verticalAlign: "middle", fontSize: "12px" },
};

// Colonne template campagne (riga 4 = header, dati da riga 5)
// Col 0=RANKING, 1=EAN, 2=TITOLO, 3=AUTORE, 4=EDITORE, 5=PREZZO, 6=USCITA, 7=FORMATO, 8=ETA
const COL_MAP = {
  0: "ranking_titolo",
  1: "ean",
  2: "titolo",
  3: "autore",
  4: "editore_nome",
  5: "prezzo",
  6: "uscita",
  7: "formato",
  8: "eta",
};

const REQUIRED = ["ean", "titolo", "editore_nome", "prezzo"];

export default function CampagneImport({ campagnaId, campagnaLabel, token, onImportDone }) {
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(null);
  const [step, setStep] = useState("upload");

  const handleFile = useCallback((e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const XLSX = window.XLSX;
        const wb = XLSX.read(evt.target.result, { type: "array" });
        const ws = wb.Sheets["CEDOLA"] || wb.Sheets[wb.SheetNames[0]];
        if (!ws) { alert("Foglio 'CEDOLA' non trovato."); return; }
        // Header riga 4 (indice 3), dati da riga 5 (indice 4)
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        const dataRows = data.slice(4).filter(r => r.some(v => v !== ""));

        const parsed = [];
        const errs = [];
        dataRows.forEach((row, idx) => {
          const obj = {};
          Object.entries(COL_MAP).forEach(([colIdx, field]) => {
            let val = row[parseInt(colIdx)] ?? "";
            if (field === "ean") val = val ? String(val).replace(/\D/g, "") : null;
            else if (field === "prezzo") val = parseFloat(String(val).replace(",", ".")) || null;
            else if (field === "ranking_titolo") val = parseInt(val) || null;
            else val = val === "" ? null : String(val).trim();
            obj[field] = val === "" ? null : val;
          });
          obj.campagna_id = campagnaId;

          const rowErrs = [];
          REQUIRED.forEach(f => { if (!obj[f]) rowErrs.push(f); });
          if (obj.ean && obj.ean.length !== 13) rowErrs.push("EAN non valido");
          if (rowErrs.length) errs.push({ row: idx + 5, fields: rowErrs });
          parsed.push(obj);
        });

        setRows(parsed);
        setErrors(errs);
        setStep("preview");
      } catch (err) {
        alert("Errore lettura file: " + err.message);
      }
    };
    reader.readAsArrayBuffer(f);
  }, [campagnaId]);

  const handleImport = async () => {
    if (!campagnaId) return;
    setImporting(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/campagna_titoli`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${token}`,
          "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(rows.map(r => ({ ...r, campagna_id: campagnaId }))),
      });
      if (res.ok) {
        setDone({ ok: rows.length });
        setStep("result");
        onImportDone && onImportDone();
      } else {
        const err = await res.json();
        alert("Errore import: " + JSON.stringify(err));
      }
    } catch (e) {
      alert("Errore di rete: " + e.message);
    }
    setImporting(false);
  };

  const reset = () => { setFile(null); setRows([]); setErrors([]); setDone(null); setStep("upload"); };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
      <div style={{ marginBottom: 20, padding: "10px 16px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: T.textMid, fontSize: "11px" }}>Campagna</span>
        <span style={{ color: T.accent, fontWeight: "700" }}>{campagnaLabel}</span>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, alignItems: "center" }}>
        {["upload", "preview", "result"].map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: step === s ? T.accent : T.borderHi, color: step === s ? "#000" : T.textMid, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700" }}>{i + 1}</div>
            <span style={{ color: step === s ? T.accent : T.textMid, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {s === "upload" ? "Carica file" : s === "preview" ? "Verifica" : "Completato"}
            </span>
            {i < 2 && <span style={{ color: T.textDim }}>›</span>}
          </div>
        ))}
      </div>

      {step === "upload" && (
        <div style={{ maxWidth: 500 }}>
          <div style={{ border: `2px dashed ${T.borderHi}`, borderRadius: 6, padding: 40, textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: "32px", marginBottom: 12 }}>📂</div>
            <div style={{ color: T.text, marginBottom: 8 }}>Carica il template Cedola Campagne</div>
            <div style={{ color: T.textMid, fontSize: "11px", marginBottom: 20 }}>
              File .xlsx — foglio "CEDOLA", dati da riga 5
            </div>
            <input type="file" accept=".xlsx" onChange={handleFile} style={{ display: "none" }} id="camp-cedola-file" />
            <label htmlFor="camp-cedola-file" style={{ ...css.btn("accent"), cursor: "pointer", padding: "8px 20px" }}>Scegli file .xlsx</label>
          </div>
          <div style={{ color: T.textMid, fontSize: "11px" }}>
            Non hai il template?{" "}
            <a href="/Campagne-PDE/template_cedola_campagne.xlsx" download style={{ color: T.accent }}>
              Scaricalo qui
            </a>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 16px" }}>
              <span style={{ color: T.textMid, fontSize: "11px" }}>Righe lette: </span>
              <span style={{ color: T.text, fontWeight: "700" }}>{rows.length}</span>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${errors.length > 0 ? T.red : T.green}`, borderRadius: 4, padding: "10px 16px" }}>
              <span style={{ color: T.textMid, fontSize: "11px" }}>Errori: </span>
              <span style={{ color: errors.length > 0 ? T.red : T.green, fontWeight: "700" }}>{errors.length}</span>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button style={css.btn()} onClick={reset}>← Ricarica</button>
              <button style={css.btn("accent")} onClick={handleImport} disabled={importing || errors.length > 0}>
                {importing ? "Import in corso..." : `Importa ${rows.length} titoli`}
              </button>
            </div>
          </div>

          {errors.length > 0 && (
            <div style={{ background: T.red + "11", border: `1px solid ${T.red}44`, borderRadius: 4, padding: 16, marginBottom: 16 }}>
              <div style={{ color: T.red, fontWeight: "700", marginBottom: 8, fontSize: "12px" }}>⚠ Correggi gli errori prima di importare</div>
              {errors.map((e, i) => <div key={i} style={{ color: T.textMid, fontSize: "11px" }}>Riga {e.row}: {e.fields.join(", ")}</div>)}
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>{["Rk", "EAN", "Titolo", "Autore", "Editore", "Prezzo", "Uscita", "Formato"].map(h => <th key={h} style={css.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const hasErr = errors.find(e => e.row === i + 5);
                  return (
                    <tr key={i} style={{ background: hasErr ? T.red + "11" : i % 2 === 0 ? "transparent" : T.surface + "66" }}>
                      <td style={{ ...css.td, color: T.textMid, textAlign: "center" }}>{r.ranking_titolo}</td>
                      <td style={{ ...css.td, fontFamily: "monospace", fontSize: "11px", color: T.textMid }}>{r.ean}</td>
                      <td style={{ ...css.td, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: "600" }}>{r.titolo}</td>
                      <td style={{ ...css.td, color: T.textMid }}>{r.autore}</td>
                      <td style={{ ...css.td, color: T.accent }}>{r.editore_nome}</td>
                      <td style={css.td}>€ {r.prezzo}</td>
                      <td style={{ ...css.td, color: T.textMid }}>{r.uscita}</td>
                      <td style={css.td}>{r.formato}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === "result" && done && (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: "48px", marginBottom: 16 }}>✅</div>
          <div style={{ color: T.green, fontSize: "20px", fontWeight: "700", marginBottom: 8 }}>Import completato</div>
          <div style={{ color: T.textMid, marginBottom: 32 }}>{done.ok} titoli importati nella campagna</div>
          <button style={css.btn("accent")} onClick={reset}>Nuovo import</button>
        </div>
      )}
    </div>
  );
}
