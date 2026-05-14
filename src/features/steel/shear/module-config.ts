import { z } from "zod";
import { bendingDefaults } from "@/features/steel/bending/module-config";
import { calculateShearDesign } from "@/lib/limit-state-engine/shear";

type ShearDefaults = {
  designMethod: "LRFD" | "ASD";
  material: string;
  shapeName: string;
  Mu: string;
  Vu: string;
  L: string;
  wLive: string;
  deadLoadKft: string;
  liveLoadKft: string;
  spanFt: string;
  unbracedLbIn: string;
  cbFactor: string;
  stiffening: "unstiffened" | "stiffened";
  /** Clear distance between transverse stiffeners (in). Empty when unstiffened. */
  alpha: string;
  /** Analysis = known section check; Design = lightest passing W by weight. */
  mode: "check" | "design";
};

/** Member/load defaults identical to Bending-Shear; extra keys for PROGRAM-2 web shear only. */
export const shearDefaults: ShearDefaults = {
  designMethod: bendingDefaults.designMethod,
  material: bendingDefaults.material,
  shapeName: bendingDefaults.shapeName,
  Mu: bendingDefaults.Mu,
  Vu: bendingDefaults.Vu,
  L: bendingDefaults.L,
  wLive: bendingDefaults.wLive,
  deadLoadKft: bendingDefaults.deadLoadKft,
  liveLoadKft: bendingDefaults.liveLoadKft,
  spanFt: bendingDefaults.spanFt,
  unbracedLbIn: bendingDefaults.unbracedLbIn,
  cbFactor: bendingDefaults.cbFactor,
  mode: bendingDefaults.mode,
  stiffening: "unstiffened",
  alpha: "",
};

export const shearDraftSchema = z.object({
  designMethod: z.enum(["LRFD", "ASD"]).optional(),
  material: z.string().optional(),
  shapeName: z.string().optional(),
  demandV: z.string().optional(),
  Mu: z.string().optional(),
  Vu: z.string().optional(),
  L: z.string().optional(),
  wLive: z.string().optional(),
  deadLoadKft: z.string().optional(),
  liveLoadKft: z.string().optional(),
  spanFt: z.string().optional(),
  unbracedLbIn: z.string().optional(),
  cbFactor: z.string().optional(),
  stiffening: z.enum(["unstiffened", "stiffened"]).optional(),
  alpha: z.string().optional(),
  mode: z.enum(["check", "design"]).optional(),
});

export const evaluateShear = calculateShearDesign;
