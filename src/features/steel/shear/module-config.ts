import { z } from "zod";
import { calculateShearDesign } from "@/lib/limit-state-engine/shear";

type ShearDefaults = {
  designMethod: "LRFD" | "ASD";
  material: string;
  shapeName: string;
  demandV: string;
};

export const shearDefaults: ShearDefaults = {
  designMethod: "LRFD",
  material: "A572",
  shapeName: "W44X290",
  demandV: "900",
};

export const shearDraftSchema = z.object({
  designMethod: z.enum(["LRFD", "ASD"]).optional(),
  material: z.string().optional(),
  shapeName: z.string().optional(),
  demandV: z.string().optional(),
});

export const evaluateShear = calculateShearDesign;

