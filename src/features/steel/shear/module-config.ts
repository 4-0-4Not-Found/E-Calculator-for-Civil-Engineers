import { z } from "zod";
import { calculateShearDesign } from "@/lib/limit-state-engine/shear";

type ShearDefaults = {
  designMethod: "LRFD" | "ASD";
  material: string;
  shapeName: string;
  demandV: string;
  stiffening: "unstiffened" | "stiffened";
  /** Clear distance between transverse stiffeners (in). Empty when unstiffened. */
  alpha: string;
};

export const shearDefaults: ShearDefaults = {
  designMethod: "LRFD",
  material: "A572_GR_50",
  shapeName: "W44X290",
  demandV: "900",
  stiffening: "unstiffened",
  alpha: "",
};

export const shearDraftSchema = z.object({
  designMethod: z.enum(["LRFD", "ASD"]).optional(),
  material: z.string().optional(),
  shapeName: z.string().optional(),
  demandV: z.string().optional(),
  stiffening: z.enum(["unstiffened", "stiffened"]).optional(),
  alpha: z.string().optional(),
});

export const evaluateShear = calculateShearDesign;

