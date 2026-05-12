import { aiscShapes } from "@/lib/aisc/data";
import { calculateBendingShearDesign } from "@/lib/limit-state-engine/bending";
import { calculateCompressionDesign } from "@/lib/limit-state-engine/compression";
import { calculateTensionDesign } from "@/lib/limit-state-engine/tension";
import { calculateShearDesign } from "@/lib/limit-state-engine/shear";
import type { CalculationOutput } from "@/lib/types/calculation";
import { normalizeSteelMaterialKey, steelMaterialMap, type SteelMaterialKey } from "@/lib/data/materials";

const toN = (v: string | undefined) => (v !== undefined ? Number(v) || 0 : 0);

export type TensionSummary =
  | { module: "tension"; ok: true; output: CalculationOutput; materialLabel: string }
  | { module: "tension"; ok: false; error: string };

export type CompressionSummary =
  | { module: "compression"; ok: true; output: CalculationOutput; shapeName: string; materialLabel: string }
  | { module: "compression"; ok: false; error: string };

export type BendingSummary =
  | {
      module: "bending";
      ok: true;
      output: CalculationOutput;
      shapeName: string;
      materialLabel: string;
      /** Rolled shape type from database (e.g. W vs HSS). */
      shapeFamilyLabel: string;
    }
  | { module: "bending"; ok: false; error: string };

export type ShearSummary =
  | {
      module: "shear";
      ok: true;
      output: CalculationOutput;
      shapeName: string;
      materialLabel: string;
      designMethod: "LRFD" | "ASD";
      stiffening: "unstiffened" | "stiffened";
      alphaIn?: number;
    }
  | { module: "shear"; ok: false; error: string };

export type ModuleSummary = TensionSummary | CompressionSummary | BendingSummary | ShearSummary;

export function summarizeTension(p: Record<string, string> | null): TensionSummary {
  if (!p || typeof p.material !== "string") {
    return { module: "tension", ok: false, error: "No saved tension inputs." };
  }
  try {
    const mat = steelMaterialMap[p.material as SteelMaterialKey];
    if (!mat) return { module: "tension", ok: false, error: "Invalid steel type." };
    const r = calculateTensionDesign({
      designMethod: p.designMethod === "ASD" ? "ASD" : "LRFD",
      Fy: mat.Fy,
      Fu: mat.Fu,
      Ag: toN(p.Ag),
      An: toN(p.An),
      U: toN(p.U),
      demandPu: toN(p.Pu),
      Agv: toN(p.Agv),
      Anv: toN(p.Anv),
      Agt: toN(p.Agt),
      Ant: toN(p.Ant),
      ubs: toN(p.ubs) || 1.0,
    });
    return {
      module: "tension",
      ok: true,
      output: r,
      materialLabel: p.material,
    };
  } catch (e) {
    return { module: "tension", ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export function summarizeCompression(p: Record<string, string> | null): CompressionSummary {
  if (!p || typeof p.shapeName !== "string") {
    return { module: "compression", ok: false, error: "No saved compression inputs." };
  }
  try {
    const shape = aiscShapes.find((s) => s.shape === p.shapeName);
    const mat = steelMaterialMap[(p.material as SteelMaterialKey) ?? "A992"];
    if (!shape) return { module: "compression", ok: false, error: "Shape not found." };
    const kBase = toN(p.k) || 1;
    const bu = typeof p.builtUpFactor === "string" ? Number(p.builtUpFactor) : Number(p.builtUpFactor);
    const kEff = Number.isFinite(bu) && bu > 0 ? kBase * bu : kBase;
    const out = calculateCompressionDesign({
      designMethod: p.designMethod === "ASD" ? "ASD" : "LRFD",
      Fy: mat.Fy,
      E: 29000,
      k: kEff,
      L: toN(p.L),
      rx: shape.rx,
      ry: shape.ry,
      Ag: shape.A,
      lambdaFlange: shape.bf_2tf,
      lambdaWeb: shape.h_tw,
      demandPu: toN(p.Pu),
    });
    return {
      module: "compression",
      ok: true,
      output: out,
      shapeName: p.shapeName,
      materialLabel: (p.material as SteelMaterialKey) ?? "A992",
    };
  } catch (e) {
    return { module: "compression", ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export function summarizeBending(p: Record<string, string> | null): BendingSummary {
  if (!p || typeof p.shapeName !== "string") {
    return { module: "bending", ok: false, error: "No saved beam inputs." };
  }
  try {
    const shape = aiscShapes.find((s) => s.shape === p.shapeName);
    const mat = steelMaterialMap[(p.material as SteelMaterialKey) ?? "A36"];
    if (!shape) return { module: "bending", ok: false, error: "Shape not found." };
    const mode = p.mode === "design" ? "design" : "check";
    if (shape.type !== "W" && shape.type !== "HSS") {
      return { module: "bending", ok: false, error: "W or HSS shape required." };
    }
    if (mode === "design" && shape.type !== "W") {
      return { module: "bending", ok: false, error: "Design mode summary requires a W-shape in saved data." };
    }
    const DL = toN(p.deadLoadKft);
    const LL = toN(p.liveLoadKft);
    const Lft = toN(p.spanFt);
    let Lin = toN(p.L);
    let w = toN(p.wLive);
    let muUse = toN(p.Mu);
    let vuUse = toN(p.Vu);
    if (Number.isFinite(DL) && Number.isFinite(LL) && Number.isFinite(Lft) && Lft > 0) {
      const wStr =
        p.designMethod === "ASD"
          ? DL + LL
          : Math.max(1.4 * DL, 1.2 * DL + 1.6 * LL);
      muUse = (wStr * Lft * Lft) / 8;
      vuUse = (wStr * Lft) / 2;
      w = (DL + LL) / 12;
      Lin = Lft * 12;
    }
    const hBeam = shape.h && shape.h > 0 ? shape.h : shape.d - 2 * shape.tf;
    const delta = (5 / 384) * w * Lin ** 4 / (29000 * (shape.Ix || 1));
    const lbParsed = toN(p.unbracedLbIn);
    const LbUse = p.unbracedLbIn?.trim() !== "" && lbParsed > 0 ? lbParsed : Lin;
    const CbUse = Math.max(0.1, toN(p.cbFactor) || 1);
    const out = calculateBendingShearDesign({
      designMethod: p.designMethod === "ASD" ? "ASD" : "LRFD",
      E: 29000,
      Fy: mat.Fy,
      Zx: shape.Zx,
      Sx: shape.Sx,
      Ix: shape.Ix,
      Iy: shape.Iy,
      ry: shape.ry,
      d: shape.d,
      bf: shape.bf,
      tf: shape.tf,
      lambdaFlange: shape.bf_2tf,
      lambdaWeb: shape.h_tw,
      h: hBeam,
      tw: shape.tw,
      a: shape.d,
      isStiffened: false,
      Mu: muUse,
      Vu: vuUse,
      L: Lin,
      wLive: w,
      deflection: delta,
      deflectionAllowable: Lin / 360,
      Lb: LbUse,
      Cb: CbUse,
      sectionProfile: mode === "design" ? "W" : shape.type === "HSS" ? "HSS" : "W",
    });
    return {
      module: "bending",
      ok: true,
      output: out,
      shapeName: p.shapeName,
      materialLabel: (p.material as SteelMaterialKey) ?? "A36",
      shapeFamilyLabel: shape.type,
    };
  } catch (e) {
    return { module: "bending", ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export function summarizeShear(p: Record<string, string> | null): ShearSummary {
  if (!p || typeof p.shapeName !== "string") {
    return { module: "shear", ok: false, error: "No saved shear inputs." };
  }
  try {
    const shape = aiscShapes.find((s) => s.shape === p.shapeName);
    if (!shape) return { module: "shear", ok: false, error: "Shape not found." };
    if (shape.type !== "W") {
      return { module: "shear", ok: false, error: "Shear module supports W-shapes only." };
    }
    const matKey = normalizeSteelMaterialKey(p.material) as SteelMaterialKey;
    const mat = steelMaterialMap[matKey];
    if (!mat) return { module: "shear", ok: false, error: "Invalid steel type." };

    const designMethod: "LRFD" | "ASD" = p.designMethod === "ASD" ? "ASD" : "LRFD";
    const stiffening: "unstiffened" | "stiffened" =
      p.stiffening === "stiffened" ? "stiffened" : "unstiffened";
    const alphaParsed = Number(p.alpha);
    const alphaIn =
      stiffening === "stiffened" && Number.isFinite(alphaParsed) && alphaParsed > 0 ? alphaParsed : undefined;

    const out = calculateShearDesign({
      designMethod,
      Fy: mat.Fy,
      d: shape.d,
      tw: shape.tw,
      hTw: shape.h_tw,
      demandV: toN(p.demandV),
      stiffening,
      alpha: alphaIn,
    });
    return {
      module: "shear",
      ok: true,
      output: out,
      shapeName: p.shapeName,
      materialLabel: mat.label,
      designMethod,
      stiffening,
      alphaIn,
    };
  } catch (e) {
    return { module: "shear", ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
