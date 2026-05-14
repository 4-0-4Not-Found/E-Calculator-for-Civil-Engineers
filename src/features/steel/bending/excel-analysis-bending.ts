/**
 * Mirrors **Analysis (Bending)** worksheet logic from `Steel-Program-1-2` workbooks:
 * LRFD factored uniform load `MAX(1.2*D+1.6*L, 1.4*D)` (and self-weight path E27),
 * ASD service `D+L` (G26/G27), load-pattern table rows 65–69 (C65:C69),
 * AISC F6-style flange local buckling nominal M_n only (cells E37–E45 — workbook does not chain LTB there),
 * deflection expressions L65–M69 (w in klf, L in ft, E ksi, I in in⁴ → inches).
 *
 * Also includes **F2 LTB** (same equations as `bending.ts`, not present on the Bending analysis XLSX tab)
 * and **Analysis (Shear)** G2 strength (`excel-analysis-shear-workbook.ts`) for rolled W-type members.
 */

import {
  workbookAnalysisShearG2,
  type ShearWorkbookWebStiffening,
  type WorkbookShearSnapshot,
} from "./excel-analysis-shear-workbook";

export type { ShearWorkbookWebStiffening };
export const BENDING_ANALYSIS_LOAD_PATTERNS = [
  "Simple Beam: Uniformly Distributed Load",
  "Simple Beam: Load Increasing Uniformly to one End",
  "Simple Beam: Load Increasing Uniformly to Center",
  "Beam Fixed at One End, Supported at the other: Uniformly Distributed Load",
  "Beam Fixed at Both Ends: Uniformly Distributed Load",
] as const;

export type BendingAnalysisLoadPattern = (typeof BENDING_ANALYSIS_LOAD_PATTERNS)[number];

export function bendingAnalysisPatternIndex(pattern: string): number {
  const i = BENDING_ANALYSIS_LOAD_PATTERNS.indexOf(pattern as BendingAnalysisLoadPattern);
  return i >= 0 ? i : 0;
}

/** LRFD factored uniform load (klf) — cells E26 / E27 (dead + live only). */
export function excelBendingFactoredUniformKlf(deadKlf: number, liveKlf: number, selfWeightKlf = 0): number {
  const D = deadKlf + selfWeightKlf;
  const L = liveKlf;
  return Math.max(1.2 * D + 1.6 * L, 1.4 * D);
}

/** ASD / service uniform load (klf) — cells G26 / G27. */
export function excelBendingServiceUniformKlf(deadKlf: number, liveKlf: number, selfWeightKlf = 0): number {
  return deadKlf + selfWeightKlf + liveKlf;
}

export type FlangeFlexureClassExcel = "Compact" | "Non-compact" | "Slender";

export type ExcelFlbMnResult = {
  lambdaF: number;
  lambdaPf: number;
  lambdaRf: number;
  kc: number;
  flangeClass: FlangeFlexureClassExcel;
  /** Nominal M_n from F6 flange local buckling only (kip·ft). */
  MnKipFt: number;
  MpKipFt: number;
};

/**
 * AISC 360-16 Table B4.1b rolled I-shape flange + F6 — same structure as workbook cells L37, L38, L40, E37–E39, F40.
 */
export function excelBendingFlbNominalMnKipFt(input: {
  E: number;
  Fy: number;
  Zx: number;
  Sx: number;
  lambdaFlangeBf2tf: number;
  lambdaWebHtw: number;
}): ExcelFlbMnResult {
  const { E, Fy, Zx, Sx } = input;
  const lf = Math.max(input.lambdaFlangeBf2tf, 1e-9);
  const λw = Math.max(input.lambdaWebHtw, 1e-9);

  const lambdaPf = 0.38 * Math.sqrt(E / Fy);
  const lambdaRf = 1 * Math.sqrt(E / Fy);
  const kc = Math.min(0.76, Math.max(0.35, 4 / Math.sqrt(λw)));

  const MpKipFt = (Fy * Zx) / 12;

  let flangeClass: FlangeFlexureClassExcel;
  if (lf < lambdaPf) flangeClass = "Compact";
  else if (lf < lambdaRf) flangeClass = "Non-compact";
  else flangeClass = "Slender";

  let MnKipFt: number;
  if (flangeClass === "Compact") {
    MnKipFt = MpKipFt;
  } else if (flangeClass === "Non-compact") {
    const denom = lambdaRf - lambdaPf;
    if (denom <= 1e-12) {
      MnKipFt = MpKipFt;
    } else {
      MnKipFt =
        MpKipFt -
        (MpKipFt - (0.7 * Fy * Sx) / 12) * ((lf - lambdaPf) / denom);
    }
  } else {
    const MnSlenderKipIn = (0.9 * E * kc * Sx) / (lf * lf);
    MnKipFt = Math.min(MpKipFt, MnSlenderKipIn / 12);
  }

  return {
    lambdaF: lf,
    lambdaPf,
    lambdaRf,
    kc,
    flangeClass,
    MnKipFt,
    MpKipFt,
  };
}

function rolledWShapeJ(bf: number, tf: number, hw: number, tw: number): number {
  return (2 * bf * tf ** 3) / 3 + (hw * tw ** 3) / 3;
}

/**
 * AISC 360-16 Chapter F2 lateral-torsional buckling + min with F6 flange nominal (same logic as `bending.ts`).
 * Returns nominal strengths in kip·ft.
 */
export function excelBendingF2GovernedNominalMnKipFt(input: {
  E: number;
  Fy: number;
  Zx: number;
  Sx: number;
  Iy: number;
  ry: number;
  d: number;
  bf: number;
  tf: number;
  tw: number;
  h: number;
  lambdaFlangeBf2tf: number;
  lambdaWebHtw: number;
  Lb: number;
  Cb: number;
}): {
  MnFlbKipFt: number;
  MnLtbKipFt: number;
  MnGovernKipFt: number;
  flexureControl: "FLB" | "LTB";
  LpIn: number;
  LrIn: number;
  MpKipFt: number;
} {
  const flb = excelBendingFlbNominalMnKipFt({
    E: input.E,
    Fy: input.Fy,
    Zx: input.Zx,
    Sx: input.Sx,
    lambdaFlangeBf2tf: input.lambdaFlangeBf2tf,
    lambdaWebHtw: input.lambdaWebHtw,
  });
  const MnFlb_kipin = flb.MnKipFt * 12;
  const Mp_kipin = input.Fy * input.Zx;
  const ho = input.d - input.tf;
  const hw = input.d - 2 * input.tf;
  const J = rolledWShapeJ(input.bf, input.tf, hw, input.tw);
  if (ho <= 1e-6 || J <= 1e-12) {
    return {
      MnFlbKipFt: flb.MnKipFt,
      MnLtbKipFt: flb.MpKipFt,
      MnGovernKipFt: flb.MnKipFt,
      flexureControl: "FLB",
      LpIn: 0,
      LrIn: 0,
      MpKipFt: flb.MpKipFt,
    };
  }
  const r_ts = Math.sqrt((input.Iy * ho) / (2 * input.Sx));
  const Lp = 1.76 * input.ry * Math.sqrt(input.E / input.Fy);
  const sxHoOverJ = (input.Sx * ho) / J;
  const inner = 6.76 * ((0.7 * input.Fy) / input.E * sxHoOverJ) ** 2;
  const Lr =
    1.95 *
    r_ts *
    (input.E / (0.7 * input.Fy)) *
    Math.sqrt(J / (input.Sx * ho)) *
    Math.sqrt(1 + Math.sqrt(1 + inner));

  const Lb = Math.max(0, input.Lb);
  const Cb = Math.max(0.1, input.Cb);

  let MnLtb_kipin: number;
  if (Lb <= Lp) {
    MnLtb_kipin = Mp_kipin;
  } else if (Lb <= Lr) {
    const denom = Lr - Lp;
    if (denom <= 1e-9) {
      MnLtb_kipin = Mp_kipin;
    } else {
      MnLtb_kipin = Math.min(
        Mp_kipin,
        Cb * (Mp_kipin - (Mp_kipin - 0.7 * input.Fy * input.Sx) * ((Lb - Lp) / denom)),
      );
    }
  } else {
    const lbRts = Lb / r_ts;
    const Fcr_ltb =
      ((Cb * Math.PI ** 2 * input.E) / (lbRts * lbRts)) *
      Math.sqrt(1 + 0.078 * (J / (input.Sx * ho)) * lbRts * lbRts);
    MnLtb_kipin = Math.min(Mp_kipin, Fcr_ltb * input.Sx);
  }

  const MnLtbKipFt = MnLtb_kipin / 12;
  const MnGovern_kipin = Math.min(MnFlb_kipin, MnLtb_kipin);
  const flexureControl: "FLB" | "LTB" = MnFlb_kipin <= MnLtb_kipin ? "FLB" : "LTB";

  return {
    MnFlbKipFt: flb.MnKipFt,
    MnLtbKipFt: MnLtbKipFt,
    MnGovernKipFt: MnGovern_kipin / 12,
    flexureControl,
    LpIn: Lp,
    LrIn: Lr,
    MpKipFt: flb.MpKipFt,
  };
}

export type PatternDemandRow = {
  /** Factored shear demand (kips) — column H (`H65`…). */
  VfactoredKips: number;
  /** Service shear demand (kips) — column I (`I65`…), workbook `G27` / `J57`. */
  VserviceKips: number;
  /** Factored moment demand (kip·ft) — column J (LRFD row lookup E28). */
  MfactoredKipFt: number;
  /** Service moment (kip·ft) — column K (ASD row lookup G28). */
  MserviceKipFt: number;
  /** Live-load deflection (in) — column L. */
  deflectionLiveIn: number;
  /** D+L service deflection (in) — column M. */
  deflectionDlPlusLIn: number;
};

/**
 * Replicates `Analysis (Bending)` rows 65–69 for a given pattern index (0 = C65 … 4 = C69).
 * `wFactoredKlf` = H62, `wServiceKlf` = I62, `spanFt` = K61 (= E15), `Eksi` = M62 (= K10), `Ix` = M61 (= L21).
 * `deadKlf` / `liveKlf` = E13 / E14 for deflection numerators.
 */
export function excelBendingPatternRow(
  patternIndex: number,
  wFactoredKlf: number,
  wServiceKlf: number,
  spanFt: number,
  deadKlf: number,
  liveKlf: number,
  Eksi: number,
  Ix: number,
): PatternDemandRow {
  const wu = wFactoredKlf;
  const ws = wServiceKlf;
  const L = spanFt;
  const E = Eksi;
  const I = Ix;
  const D = deadKlf;
  const LL = liveKlf;

  const denomEI = 384 * E * 12 ** 2 * I * (1 / 12 ** 5);

  const deflUniform = (w: number) => (5 * w * L ** 4) / denomEI;

  switch (patternIndex) {
    case 0: {
      return {
        VfactoredKips: (wu * L) / 2,
        VserviceKips: (ws * L) / 2,
        MfactoredKipFt: (wu * L ** 2) / 8,
        MserviceKipFt: (ws * L ** 2) / 8,
        deflectionLiveIn: deflUniform(LL),
        deflectionDlPlusLIn: deflUniform(D + LL),
      };
    }
    case 1: {
      const coeffM = (2 / (9 * Math.sqrt(3))) * 0.5;
      return {
        VfactoredKips: (2 / 3) * 0.5 * (wu * L),
        VserviceKips: (2 / 3) * 0.5 * (ws * L),
        MfactoredKipFt: coeffM * (wu * L ** 2),
        MserviceKipFt: coeffM * (ws * L ** 2),
        deflectionLiveIn: (0.01304 * ((LL / 2) * L ** 4) * 12 ** 3) / (E * I),
        deflectionDlPlusLIn: (0.01304 * (((D + LL) / 2) * L ** 4) * 12 ** 3) / (E * I),
      };
    }
    case 2: {
      return {
        VfactoredKips: (wu * L) / 4,
        VserviceKips: (ws * L) / 4,
        MfactoredKipFt: (0.5 * (wu * L ** 2)) / 6,
        MserviceKipFt: (0.5 * (ws * L ** 2)) / 6,
        deflectionLiveIn: ((LL / 2) * L ** 4 * 12 ** 3) / (60 * E * I),
        deflectionDlPlusLIn: (((D + LL) / 2) * L ** 4 * 12 ** 3) / (60 * E * I),
      };
    }
    case 3: {
      return {
        VfactoredKips: (5 * wu * L) / 8,
        VserviceKips: (5 * ws * L) / 8,
        MfactoredKipFt: (wu * L ** 2) / 8,
        MserviceKipFt: (ws * L ** 2) / 8,
        deflectionLiveIn: (LL * L ** 4) / (185 * E * 12 ** 2 * I * (1 / 12 ** 5)),
        deflectionDlPlusLIn: ((D + LL) * L ** 4) / (185 * E * 12 ** 2 * I * (1 / 12 ** 5)),
      };
    }
    case 4: {
      return {
        VfactoredKips: (wu * L) / 2,
        VserviceKips: (ws * L) / 2,
        MfactoredKipFt: (wu * L ** 2) / 12,
        MserviceKipFt: (ws * L ** 2) / 12,
        deflectionLiveIn: (LL * L ** 4) / (384 * E * 12 ** 2 * I * (1 / 12 ** 5)),
        deflectionDlPlusLIn: ((D + LL) * L ** 4) / (384 * E * 12 ** 2 * I * (1 / 12 ** 5)),
      };
    }
    default:
      return excelBendingPatternRow(0, wu, ws, L, D, LL, E, I);
  }
}

export type ExcelBendingAnalysisSnapshot = {
  selfWeightPlf: number;
  selfWeightKlf: number;
  wFactoredNoSwKlf: number;
  wFactoredWithSwKlf: number;
  wServiceNoSwKlf: number;
  wServiceWithSwKlf: number;
  wFactoredUsedKlf: number;
  wServiceUsedKlf: number;
  patternLabel: string;
  patternIndex: number;
  pattern: PatternDemandRow;
  flb: ExcelFlbMnResult;
  phiB: number;
  omegaB: number;
  phiMnLrfdKipFt: number;
  mnOverOmegaKipFt: number;
  /** Workbook E28 / G28 style demands (kip·ft). */
  MrLrfdKipFt: number;
  MsAsdKipFt: number;
  /** Workbook E48 / J48 — compares φM_n to M_req (LRFD) and M_n/Ω to M_s (ASD). */
  flexureLrfdSafe: boolean;
  flexureAsdSafe: boolean;
  /** Allowable deflection (in) — workbook D17 = (E15/E16)*12 when not manual. */
  deflectionAllowableIn: number;
  /** Service deflection to compare — L33 = E34 (live) or G34 (D+L) from workbook. */
  deflectionDemandIn: number;
  deflectionSafe: boolean;
  deflectionBasis: "L" | "D+L";
  /** AISC F2 LTB nominal M_n and L_p, L_r (aligned with main engine). */
  ltb: {
    LpIn: number;
    LrIn: number;
    MnLtbKipFt: number;
    MnMinFlbLtbKipFt: number;
    flexureControl: "FLB" | "LTB";
  };
  /** LRFD / ASD using φ_b=0.9, Ω_b=1.67 on min(M_n,FLB, M_n,LTB). */
  flexureFlbLtbLrfd: { phiMnKipFt: number; demandKipFt: number; safe: boolean };
  flexureFlbLtbAsd: { mnOverOmegaKipFt: number; demandKipFt: number; safe: boolean };
  /** `Analysis (Shear)` G2 + pattern shear demands (H / I columns). */
  shear: WorkbookShearSnapshot & {
    VuKips: number;
    VsKips: number;
    shearLrfdSafe: boolean;
    shearAsdSafe: boolean;
  };
};

export function buildExcelBendingAnalysisSnapshot(input: {
  deadLoadKlf: number;
  liveLoadKlf: number;
  spanFt: number;
  /** Section weight (lb/ft) — workbook L16. */
  weightPlf: number;
  includeSelfWeight: boolean;
  pattern: string;
  Eksi: number;
  Fy: number;
  Zx: number;
  Sx: number;
  lambdaFlangeBf2tf: number;
  lambdaWebHtw: number;
  Ix: number;
  /** Span / deflection divisor (e.g. 360 for L/360) — workbook E16 path. */
  deflectionSpanDivisor: number;
  /** Workbook F19: "L" uses live-only deflection column; "D+L" uses total service column. */
  deflectionBasis: "L" | "D+L";
  /** Unbraced length L_b (in) — AISC F2; workbook member checks. */
  LbIn: number;
  Cb: number;
  d: number;
  bf: number;
  tf: number;
  tw: number;
  h: number;
  Iy: number;
  ry: number;
  /** Workbook `Analysis (Shear)` !K13 style token (`W`, `WT`, …). */
  aiscTypeToken: string;
  shearWebStiffening: ShearWorkbookWebStiffening;
  /** Workbook `Analysis (Shear)` !E16 (in). When null, uses span in inches. */
  shearPanelLengthIn: number | null;
}): ExcelBendingAnalysisSnapshot | null {
  const Lft = input.spanFt;
  if (!Number.isFinite(Lft) || Lft <= 0) return null;
  const D = Number.isFinite(input.deadLoadKlf) ? input.deadLoadKlf : 0;
  const LL = Number.isFinite(input.liveLoadKlf) ? input.liveLoadKlf : 0;
  const swKlf = input.includeSelfWeight ? input.weightPlf / 1000 : 0;

  const wFactoredNoSw = excelBendingFactoredUniformKlf(D, LL, 0);
  const wFactoredWithSw = excelBendingFactoredUniformKlf(D, LL, swKlf);
  const wServiceNoSw = excelBendingServiceUniformKlf(D, LL, 0);
  const wServiceWithSw = excelBendingServiceUniformKlf(D, LL, swKlf);

  const wFactoredUsed = input.includeSelfWeight ? wFactoredWithSw : wFactoredNoSw;
  const wServiceUsed = input.includeSelfWeight ? wServiceWithSw : wServiceNoSw;

  const patternIndex = bendingAnalysisPatternIndex(input.pattern);
  const patternLabel = BENDING_ANALYSIS_LOAD_PATTERNS[patternIndex] ?? BENDING_ANALYSIS_LOAD_PATTERNS[0];

  const pattern = excelBendingPatternRow(
    patternIndex,
    wFactoredUsed,
    wServiceUsed,
    Lft,
    D,
    LL,
    input.Eksi,
    input.Ix,
  );

  const flb = excelBendingFlbNominalMnKipFt({
    E: input.Eksi,
    Fy: input.Fy,
    Zx: input.Zx,
    Sx: input.Sx,
    lambdaFlangeBf2tf: input.lambdaFlangeBf2tf,
    lambdaWebHtw: input.lambdaWebHtw,
  });

  const phiB = 0.9;
  const omegaB = 1.67;
  const phiMnLrfd = phiB * flb.MnKipFt;
  const mnOverOmega = flb.MnKipFt / omegaB;

  const MrLrfd = pattern.MfactoredKipFt;
  const MsAsd = pattern.MserviceKipFt;

  const flexureLrfdSafe = phiMnLrfd >= MrLrfd;
  const flexureAsdSafe = mnOverOmega >= MsAsd;

  const spanIn = Lft * 12;
  const ltb = excelBendingF2GovernedNominalMnKipFt({
    E: input.Eksi,
    Fy: input.Fy,
    Zx: input.Zx,
    Sx: input.Sx,
    Iy: input.Iy,
    ry: input.ry,
    d: input.d,
    bf: input.bf,
    tf: input.tf,
    tw: input.tw,
    h: input.h,
    lambdaFlangeBf2tf: input.lambdaFlangeBf2tf,
    lambdaWebHtw: input.lambdaWebHtw,
    Lb: input.LbIn,
    Cb: input.Cb,
  });

  const phiMnFlbLtb = phiB * ltb.MnGovernKipFt;
  const mnOverOmegaFlbLtb = ltb.MnGovernKipFt / omegaB;
  const flexureFlbLtbLrfd = {
    phiMnKipFt: phiMnFlbLtb,
    demandKipFt: MrLrfd,
    safe: phiMnFlbLtb >= MrLrfd,
  };
  const flexureFlbLtbAsd = {
    mnOverOmegaKipFt: mnOverOmegaFlbLtb,
    demandKipFt: MsAsd,
    safe: mnOverOmegaFlbLtb >= MsAsd,
  };

  const panelLen = input.shearPanelLengthIn ?? spanIn;
  const shearCore = workbookAnalysisShearG2({
    Fy: input.Fy,
    E: input.Eksi,
    d: input.d,
    tw: input.tw,
    hTw: input.lambdaWebHtw,
    hClearIn: input.h,
    webStiffening: input.shearWebStiffening,
    panelLengthIn: panelLen,
    aiscTypeToken: input.aiscTypeToken,
  });
  const Vu = pattern.VfactoredKips;
  const Vs = pattern.VserviceKips;
  const shear = {
    ...shearCore,
    VuKips: Vu,
    VsKips: Vs,
    shearLrfdSafe: shearCore.phiVnKips >= Vu,
    shearAsdSafe: shearCore.vnOverOmegaKips >= Vs,
  };

  const deflectionAllowableIn = (Lft / input.deflectionSpanDivisor) * 12;
  const deflectionDemandIn = input.deflectionBasis === "L" ? pattern.deflectionLiveIn : pattern.deflectionDlPlusLIn;
  const deflectionSafe = deflectionAllowableIn >= deflectionDemandIn;

  return {
    selfWeightPlf: input.weightPlf,
    selfWeightKlf: swKlf,
    wFactoredNoSwKlf: wFactoredNoSw,
    wFactoredWithSwKlf: wFactoredWithSw,
    wServiceNoSwKlf: wServiceNoSw,
    wServiceWithSwKlf: wServiceWithSw,
    wFactoredUsedKlf: wFactoredUsed,
    wServiceUsedKlf: wServiceUsed,
    patternLabel,
    patternIndex,
    pattern,
    flb,
    phiB,
    omegaB,
    phiMnLrfdKipFt: phiMnLrfd,
    mnOverOmegaKipFt: mnOverOmega,
    MrLrfdKipFt: MrLrfd,
    MsAsdKipFt: MsAsd,
    flexureLrfdSafe,
    flexureAsdSafe,
    deflectionAllowableIn,
    deflectionDemandIn,
    deflectionSafe,
    deflectionBasis: input.deflectionBasis,
    ltb: {
      LpIn: ltb.LpIn,
      LrIn: ltb.LrIn,
      MnLtbKipFt: ltb.MnLtbKipFt,
      MnMinFlbLtbKipFt: ltb.MnGovernKipFt,
      flexureControl: ltb.flexureControl,
    },
    flexureFlbLtbLrfd,
    flexureFlbLtbAsd,
    shear,
  };
}
