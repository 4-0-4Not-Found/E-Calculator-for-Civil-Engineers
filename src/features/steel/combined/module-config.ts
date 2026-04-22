import { z } from "zod";
import { calculateCombinedDesign } from "@/lib/limit-state-engine/combined";

type CombinedDefaults = {
  designMethod: "LRFD" | "ASD";
  material: string;
  deadLoadKft: string;
  liveLoadKft: string;
  spanFt: string;
  cbFactor: string;
  shapeName: string;
};

export const combinedDefaults: CombinedDefaults = {
  designMethod: "LRFD",
  material: "A36",
  deadLoadKft: "8",
  liveLoadKft: "12",
  spanFt: "7",
  cbFactor: "1.14",
  shapeName: "W14X30",
};

export const combinedDraftSchema = z.object({
  designMethod: z.enum(["LRFD", "ASD"]).optional(),
  material: z.string().optional(),
  deadLoadKft: z.string().optional(),
  liveLoadKft: z.string().optional(),
  spanFt: z.string().optional(),
  cbFactor: z.string().optional(),
  shapeName: z.string().optional(),
});

export const evaluateCombined = calculateCombinedDesign;

