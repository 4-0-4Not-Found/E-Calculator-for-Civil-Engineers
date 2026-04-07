import fs from "node:fs";
import path from "node:path";
import xlsx from "xlsx";

type AnyRow = Record<string, unknown>;

const sourcePath = process.argv[2];
const outputPath = process.argv[3] ?? "src/data/aisc-shapes-v16.json";

if (!sourcePath) {
  throw new Error("Usage: npm run aisc:convert -- <path-to-excel> [output-json-path]");
}

const workbook = xlsx.readFile(sourcePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json<AnyRow>(sheet, { defval: null });

const mapped = rows.map((row) => ({
  shape: String(row["AISC_Manual_Label"] ?? row["shape"] ?? ""),
  type: String(row["Type"] ?? "OTHER"),
  A: Number(row["A"] ?? 0),
  d: Number(row["d"] ?? 0),
  bf: Number(row["bf"] ?? 0),
  tf: Number(row["tf"] ?? 0),
  tw: Number(row["tw"] ?? 0),
  Ix: Number(row["Ix"] ?? 0),
  Iy: Number(row["Iy"] ?? 0),
  Zx: Number(row["Zx"] ?? 0),
  Zy: Number(row["Zy"] ?? 0),
  rx: Number(row["rx"] ?? 0),
  ry: Number(row["ry"] ?? 0),
  bf_2tf: Number(row["bf/2tf"] ?? 0),
  h_tw: Number(row["h/tw"] ?? 0),
})).filter((row) => row.shape.length > 0);

const target = path.resolve(outputPath);
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(mapped, null, 2), "utf8");

console.log(`Converted ${mapped.length} shapes to ${target}`);
