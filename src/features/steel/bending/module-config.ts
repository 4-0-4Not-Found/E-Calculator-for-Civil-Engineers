import { z } from "zod";
import { calculateBendingShearDesign } from "@/lib/limit-state-engine/bending";

type BendingDefaults = {
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
  mode: "check" | "design";
};

export const bendingDefaults: BendingDefaults = {
  designMethod: "LRFD",
  material: "A36",
  shapeName: "W30X90",
  Mu: "450",
  Vu: "120",
  L: "360",
  wLive: "0.1",
  deadLoadKft: "",
  liveLoadKft: "",
  spanFt: "",
  unbracedLbIn: "",
  cbFactor: "1.14",
  mode: "check",
};

export const bendingDraftSchema = z.object({
  designMethod: z.enum(["LRFD", "ASD"]).optional(),
  material: z.string().optional(),
  shapeName: z.string().optional(),
  Mu: z.string().optional(),
  Vu: z.string().optional(),
  L: z.string().optional(),
  wLive: z.string().optional(),
  deadLoadKft: z.string().optional(),
  liveLoadKft: z.string().optional(),
  spanFt: z.string().optional(),
  unbracedLbIn: z.string().optional(),
  cbFactor: z.string().optional(),
  mode: z.enum(["check", "design"]).optional(),
});

export const evaluateBending = calculateBendingShearDesign;
