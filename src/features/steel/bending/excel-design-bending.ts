/**
 * Mirrors **`Design (Bending)`** in `Steel-Program-1-2` workbooks (rows 9–732):
 * per-W row AG–CL logic, then **P14** / **X14** style `SORTBY(FILTER(…), weight, 1)` lightest picks.
 * Flexure uses **F6 flange-only** nominal `M_n` with **AU = 0.9·M_n**, **AV = M_n/1.67** (same as column AT/AV).
 * Demands **CD** / **CJ** use factored / service uniform loads **AZ** / **BC** with the **Sheet4 Q26:R30** load-pattern map.
 */

import type { AiscShape } from "@/lib/aisc/types";
import { aiscShapes } from "@/lib/aisc/data";
import {
  bendingAnalysisPatternIndex,
  excelBendingFactoredUniformKlf,
  excelBendingFlbNominalMnKipFt,
  excelBendingPatternRow,
  excelBendingServiceUniformKlf,
} from "./excel-analysis-bending";

/** Sheet4 `Q26:Q30` → `R26:R30` BZ codes (1, 2, 3, 12, 15). */
export function designBendingBZCodeFromPattern(pattern: string): number {
  const m: Record<string, number> = {
    "Simple Beam: Uniformly Distributed Load": 1,
    "Simple Beam: Load Increasing Uniformly to one End": 2,
    "Simple Beam: Load Increasing Uniformly to Center": 3,
    "Beam Fixed at One End, Supported at the other: Uniformly Distributed Load": 12,
    "Beam Fixed at Both Ends: Uniformly Distributed Load": 15,
  };
  return m[pattern] ?? 1;
}

export type DesignBendingRow = {
  shapeName: string;
  weightPlf: number;
  /** Workbook `AO` flange class label. */
  flangeClassLabel: string;
  AT_kipFt: number;
  AU_kipFt: number;
  AV_kipFt: number;
  CD_kipFt: number;
  CJ_kipFt: number;
  CB_in: number;
  BD_allow_in: number;
  /** Workbook `CC` — `"Safe"` or `""`. */
  ccDeflection: "" | "Safe";
  ciDeflection: "" | "Safe";
  CE_value: number | null;
  CK_value: number | null;
  CF_shape: string | null;
  CL_shape: string | null;
};

function flangeClassLabel(lf: number, lpf: number, lrf: number): string {
  if (lf < lpf) return "Compact Flange";
  if (lf < lrf) return "Non-compact Flange";
  return "Slender Flange";
}

export function evaluateDesignBendingRow(
  s: AiscShape,
  input: {
    Fy: number;
    Eksi: number;
    deadKlf: number;
    liveKlf: number;
    spanFt: number;
    /** `R8` — include self-weight in AZ/BC. */
    includeSelfWeight: boolean;
    /** `R9` — when false, deflection always `"Safe"` (skip CB check). */
    checkDeflection: boolean;
    deflectionBasis: "L" | "D+L";
    loadPattern: string;
    /** `X10` divisor — allowable δ = (span ft ÷ divisor) × 12 in (`AB10` / `BD`). */
    deflectionDivisor: number;
  },
): DesignBendingRow {
  const swKlf = input.includeSelfWeight ? s.W / 1000 : 0;
  const AZ = excelBendingFactoredUniformKlf(input.deadKlf, input.liveKlf, input.includeSelfWeight ? swKlf : 0);
  const BC = excelBendingServiceUniformKlf(input.deadKlf, input.liveKlf, input.includeSelfWeight ? swKlf : 0);

  const pIdx = bendingAnalysisPatternIndex(input.loadPattern);
  const pat = excelBendingPatternRow(
    pIdx,
    AZ,
    BC,
    input.spanFt,
    input.deadKlf,
    input.liveKlf,
    input.Eksi,
    s.Ix,
  );

  const flb = excelBendingFlbNominalMnKipFt({
    E: input.Eksi,
    Fy: input.Fy,
    Zx: s.Zx,
    Sx: s.Sx,
    lambdaFlangeBf2tf: s.bf_2tf,
    lambdaWebHtw: s.h_tw,
  });
  const AT = flb.MnKipFt;
  const AU = 0.9 * AT;
  const AV = AT / 1.67;

  const CD = pat.MfactoredKipFt;
  const CJ = pat.MserviceKipFt;

  const CB = input.deflectionBasis === "L" ? pat.deflectionLiveIn : pat.deflectionDlPlusLIn;
  const div = input.deflectionDivisor > 0 ? input.deflectionDivisor : 360;
  const BD = (input.spanFt / div) * 12;

  const ccDeflection: "" | "Safe" = !input.checkDeflection ? "Safe" : BD >= CB ? "Safe" : "";
  const ciDeflection = ccDeflection;

  const CE_value = ccDeflection === "Safe" && AU >= CD ? AU : null;
  const CK_value = ciDeflection === "Safe" && AV >= CJ ? AV : null;

  return {
    shapeName: s.shape,
    weightPlf: s.W,
    flangeClassLabel: flangeClassLabel(flb.lambdaF, flb.lambdaPf, flb.lambdaRf),
    AT_kipFt: AT,
    AU_kipFt: AU,
    AV_kipFt: AV,
    CD_kipFt: CD,
    CJ_kipFt: CJ,
    CB_in: CB,
    BD_allow_in: BD,
    ccDeflection,
    ciDeflection,
    CE_value,
    CK_value,
    CF_shape: CE_value !== null ? s.shape : null,
    CL_shape: CK_value !== null ? s.shape : null,
  };
}

export type ExcelDesignBendingSummary = {
  bzCode: number;
  /** Lightest W with non-blank `CF` (LRFD), workbook **P14** first entry. */
  lightestLrfdShape: string | null;
  lightestLrfdWeight: number | null;
  /** Lightest W with non-blank `CL` (ASD), workbook **X14** first entry. */
  lightestAsdShape: string | null;
  lightestAsdWeight: number | null;
  /** Passing rows sorted by weight (LRFD track), capped for UI. */
  lrfdPassing: DesignBendingRow[];
  asdPassing: DesignBendingRow[];
};

export function computeExcelDesignBendingSummary(input: {
  Fy: number;
  Eksi: number;
  deadKlf: number;
  liveKlf: number;
  spanFt: number;
  includeSelfWeight: boolean;
  checkDeflection: boolean;
  deflectionBasis: "L" | "D+L";
  loadPattern: string;
  deflectionDivisor: number;
  /** Max rows to return in each passing list (workbook `R7` can be large). */
  maxList: number;
}): ExcelDesignBendingSummary | null {
  const Lft = input.spanFt;
  if (!Number.isFinite(Lft) || Lft <= 0) return null;
  const bz = designBendingBZCodeFromPattern(input.loadPattern);

  const wShapes = aiscShapes.filter((s) => s.type === "W").sort((a, b) => a.W - b.W);

  const lrfdPassing: DesignBendingRow[] = [];
  const asdPassing: DesignBendingRow[] = [];

  for (const s of wShapes) {
    const row = evaluateDesignBendingRow(s, {
      Fy: input.Fy,
      Eksi: input.Eksi,
      deadKlf: input.deadKlf,
      liveKlf: input.liveKlf,
      spanFt: Lft,
      includeSelfWeight: input.includeSelfWeight,
      checkDeflection: input.checkDeflection,
      deflectionBasis: input.deflectionBasis,
      loadPattern: input.loadPattern,
      deflectionDivisor: input.deflectionDivisor,
    });
    if (row.CF_shape) lrfdPassing.push(row);
    if (row.CL_shape) asdPassing.push(row);
  }

  const cap = Math.max(1, Math.min(input.maxList, 500));
  const lrfdCapped = lrfdPassing.slice(0, cap);
  const asdCapped = asdPassing.slice(0, cap);

  const lr0 = lrfdPassing[0] ?? null;
  const as0 = asdPassing[0] ?? null;

  return {
    bzCode: bz,
    lightestLrfdShape: lr0?.shapeName ?? null,
    lightestLrfdWeight: lr0?.weightPlf ?? null,
    lightestAsdShape: as0?.shapeName ?? null,
    lightestAsdWeight: as0?.weightPlf ?? null,
    lrfdPassing: lrfdCapped,
    asdPassing: asdCapped,
  };
}
