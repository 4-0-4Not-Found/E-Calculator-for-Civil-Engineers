/**
 * Mirrors **Analysis (Shear)** worksheet (`Steel-Program-1-2` workbooks):
 * `G31`–`H36` (k_v), `D40`–`L46` (λ and C_v cases), `E50` nominal V_n,
 * LRFD φ_v and ASD Ω_v (`E46`, `I46`), capacities `E56` / `J56`.
 */

export type ShearWorkbookWebStiffening = "Unstiffened Webs" | "Stiffened Webs";

export type WorkbookShearSnapshot = {
  G31MonoFamily: boolean;
  H32: number;
  H33: number;
  H34: number;
  H35: number;
  H36: number;
  lambdaWeb: number;
  lambdaV1: number;
  lambdaV2: number;
  lambdaV3: number;
  shearCase: 1 | 2 | 3;
  Cv: number;
  AwIn2: number;
  VnKips: number;
  phiLrfd: number;
  omegaAsd: number;
  phiVnKips: number;
  vnOverOmegaKips: number;
};

/** True when workbook `G31` resolves to `"Yes"` (MT/ST/WT families). */
export function workbookShearIsMonoOrTeeFamily(aiscTypeToken: string): boolean {
  const t = aiscTypeToken.trim();
  return /^(MT|MTm|ST|STm|WT|WTm)$/i.test(t);
}

/**
 * Replicates `Analysis (Shear)` cells `G31`–`H36`, `D40`–`D41`, `J40`–`J41`, `M41`, `L46`, `E50`, `E46`, `I46`.
 * `panelLengthIn` = workbook `E16` (stiffener spacing / panel length in.). `hClearIn` = workbook `E17` = `L19*L18` = web depth.
 */
export function workbookAnalysisShearG2(input: {
  Fy: number;
  E: number;
  d: number;
  tw: number;
  /** h/t_w — workbook `L19` / `D40`. */
  hTw: number;
  /** Clear web depth h (in.) — workbook `E17`. */
  hClearIn: number;
  /** Workbook `B19`. */
  webStiffening: ShearWorkbookWebStiffening;
  /** Workbook `E16` — used with `E17` for stiffened-web k_v (`H33`–`H35`). */
  panelLengthIn: number;
  /** Workbook `K13` token (e.g. `W`, `WT`). */
  aiscTypeToken: string;
}): WorkbookShearSnapshot {
  const Fy = input.Fy;
  const E = input.E;
  const L19 = Math.max(input.hTw, 1e-9);
  const mono = workbookShearIsMonoOrTeeFamily(input.aiscTypeToken);
  const G31Yes = mono;

  let H32: number;
  if (G31Yes) H32 = 1.2;
  else if (L19 < 260) H32 = 5;
  else H32 = 5;

  const E16 = Math.max(input.panelLengthIn, 1e-6);
  const E17 = Math.max(input.hClearIn, 1e-6);
  const H33 = E16 / E17;
  const H34 = (260 / L19) ** 2;
  const H35 = H33 > 3 || H33 > H34 ? 5 : 5 + 5 / (H33 * H33);
  const H36 = input.webStiffening === "Unstiffened Webs" ? H32 : H35;

  const D40 = L19;
  const D41 = 2.24 * Math.sqrt(E / Fy);
  const J40 = 1.1 * Math.sqrt((H36 * E) / Fy);
  const J41 = 1.37 * Math.sqrt((H36 * E) / Fy);

  let shearCase: 1 | 2 | 3;
  let Cv: number;
  if (D40 <= D41) {
    shearCase = 1;
    Cv = 1;
  } else if (D40 <= J40) {
    shearCase = 1;
    Cv = 1;
  } else if (D40 <= J41) {
    shearCase = 2;
    Cv = J40 / D40;
  } else {
    shearCase = 3;
    Cv = (1.51 * E * H36) / (D40 ** 2 * Fy);
  }

  const AwIn2 = Math.max(input.d * input.tw, 1e-9);
  const VnKips = 0.6 * Fy * AwIn2 * Cv;

  const phiLrfd = D40 <= D41 ? 1.0 : 0.9;
  const omegaAsd = D40 <= D41 ? 1.5 : 1.67;
  const phiVnKips = phiLrfd * VnKips;
  const vnOverOmegaKips = VnKips / omegaAsd;

  return {
    G31MonoFamily: G31Yes,
    H32,
    H33,
    H34,
    H35,
    H36,
    lambdaWeb: D40,
    lambdaV1: D41,
    lambdaV2: J40,
    lambdaV3: J41,
    shearCase,
    Cv,
    AwIn2,
    VnKips,
    phiLrfd,
    omegaAsd,
    phiVnKips,
    vnOverOmegaKips,
  };
}
