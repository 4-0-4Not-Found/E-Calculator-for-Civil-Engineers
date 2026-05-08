const xlsx = require("xlsx");

const wb = xlsx.readFile("C:/Users/ranol/Downloads/Steel-Program-1-2.xlsx", { cellFormula: true });
const targets = [
  "Analysis (Tension)",
  "Design (Tension)",
  "Analysis (Compression)",
  "Design (Compression)",
  "Analysis (Bending)",
  "Design (Bending)",
  "Analysis (Shear)",
  "Design (Shear)",
];

for (const name of targets) {
  const ws = wb.Sheets[name];
  if (!ws) {
    console.log(`-- ${name}: missing`);
    continue;
  }
  const ref = ws["!ref"] || "";
  console.log(`\n========== ${name} (${ref}) ==========`);
  const range = xlsx.utils.decode_range(ref);
  // Only first 80 rows × first 16 columns is enough to capture the input/output panel.
  const maxR = Math.min(range.e.r, range.s.r + 80);
  const maxC = Math.min(range.e.c, range.s.c + 16);
  for (let r = range.s.r; r <= maxR; r++) {
    const row = [];
    for (let c = range.s.c; c <= maxC; c++) {
      const addr = xlsx.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (!cell) continue;
      const v = cell.v != null ? String(cell.v) : "";
      const f = cell.f ? ` ={${cell.f}}` : "";
      row.push(`${addr}: ${v}${f}`);
    }
    if (row.length) console.log(row.join(" | "));
  }
}
