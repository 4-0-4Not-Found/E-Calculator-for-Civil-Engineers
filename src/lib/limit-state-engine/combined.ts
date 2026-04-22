import { aiscShapes } from "@/lib/aisc/data";
import { calculateBendingShearDesign } from "@/lib/limit-state-engine/bending";
import type { CalculationOutput } from "@/lib/types/calculation";

export type CombinedInput = {
  designMethod: "LRFD" | "ASD";
  Fy: number;
  deadLoadKft: number;
  liveLoadKft: number;
  spanFt: number;
  cb: number;
  selectedShapeName?: string;
};

export type CombinedOutput = {
  selected: CalculationOutput & {
    shapeName: string;
    weightLbFt: number;
    loadEffects: { wStrength: number; wService: number; Mu: number; Vu: number; L: number; deadWithSelf: number };
  };
  recommended: (CalculationOutput & {
    shapeName: string;
    weightLbFt: number;
    loadEffects: { wStrength: number; wService: number; Mu: number; Vu: number; L: number; deadWithSelf: number };
  }) | null;
  demand: { wStrength: number; wService: number; Mu: number; Vu: number; L: number; deadWithSelf: number };
};

/**
 * Workbook parity: PROGRAM-2.xlsx "Bending & Shear (DESIGN)" load synthesis:
 * Wu = max(1.4(D+w_b), 1.2(D+w_b) + 1.6L), Wa = D + L + w_b, Mu = wL^2/8, Vu = wL/2.
 * where w_b is beam self-weight in kip/ft (= W/1000 from AISC database).
 */
export function calculateCombinedDesign(input: CombinedInput): CombinedOutput | null {
  if (input.deadLoadKft < 0 || input.liveLoadKft < 0 || input.spanFt <= 0 || input.Fy <= 0) return null;

  const Lin = input.spanFt * 12;
  const cbUse = Number.isFinite(input.cb) && input.cb > 0 ? input.cb : 1.14;

  const candidates = aiscShapes
    .filter((s) => s.type === "W")
    .map((s) => {
      const beamSelfWeight = s.W / 1000;
      const deadWithSelf = input.deadLoadKft + beamSelfWeight;
      const wStrength =
        input.designMethod === "LRFD"
          ? Math.max(1.4 * deadWithSelf, 1.2 * deadWithSelf + 1.6 * input.liveLoadKft)
          : deadWithSelf + input.liveLoadKft;
      const wService = deadWithSelf + input.liveLoadKft;
      const Mu = (wStrength * input.spanFt * input.spanFt) / 8;
      const Vu = (wStrength * input.spanFt) / 2;
      const h = s.h && s.h > 0 ? s.h : s.d - 2 * s.tf;
      const delta = (5 / 384) * (wService / 12) * Lin ** 4 / (29000 * (s.Ix || 1));
      const out = calculateBendingShearDesign({
        designMethod: input.designMethod,
        E: 29000,
        Fy: input.Fy,
        Zx: s.Zx,
        Sx: s.Sx,
        Ix: s.Ix,
        Iy: s.Iy,
        ry: s.ry,
        d: s.d,
        bf: s.bf,
        tf: s.tf,
        lambdaFlange: s.bf_2tf,
        lambdaWeb: s.h_tw,
        h,
        tw: s.tw,
        a: s.d,
        isStiffened: false,
        Mu,
        Vu,
        L: Lin,
        wLive: wService / 12,
        deflection: delta,
        deflectionAllowable: Lin / 360,
        Lb: Lin,
        Cb: cbUse,
        sectionProfile: "W",
      });
      return {
        ...out,
        shapeName: s.shape,
        weightLbFt: s.W,
        loadEffects: { wStrength, wService, Mu, Vu, L: Lin, deadWithSelf },
      };
    });

  const selected =
    candidates.find((c) => c.shapeName === input.selectedShapeName) ??
    candidates.find((c) => c.isSafe) ??
    candidates[0];
  const recommended = candidates.filter((c) => c.isSafe).sort((a, b) => a.weightLbFt - b.weightLbFt)[0] ?? null;
  if (!selected) return null;

  return {
    selected,
    recommended,
    demand: selected.loadEffects,
  };
}

