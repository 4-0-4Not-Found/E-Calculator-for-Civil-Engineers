import { z } from "zod";
import { calculateBendingShearDesign } from "@/lib/limit-state-engine/bending";
import type { ShearWorkbookWebStiffening } from "./excel-analysis-shear-workbook";

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
  /** Workbook `Analysis (Bending)` !L24 */
  includeSelfWeight: boolean;
  /** Workbook `Analysis (Bending)` !I26 (XLOOKUP key C65:C69) */
  bendingAnalysisLoadPattern: string;
  /** Workbook `Analysis (Bending)` deflection divisor !E16 when manual (e.g. 360) */
  deflectionLimitDivisor: string;
  /** Workbook `Analysis (Bending)` !F19 */
  deflectionBasis: "L" | "D+L";
  /** `Design (Bending)` !R9 — when false, deflection column CC/CI is always Safe */
  designCheckDeflection: boolean;
  /** `Analysis (Shear)` !B19 */
  shearWebStiffening: ShearWorkbookWebStiffening;
  /** `Analysis (Shear)` !E16 (in); blank uses span in inches */
  shearPanelLengthIn: string;
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
  includeSelfWeight: true,
  bendingAnalysisLoadPattern: "Simple Beam: Uniformly Distributed Load",
  deflectionLimitDivisor: "360",
  deflectionBasis: "L",
  designCheckDeflection: true,
  shearWebStiffening: "Unstiffened Webs",
  shearPanelLengthIn: "",
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
  includeSelfWeight: z.boolean().optional(),
  bendingAnalysisLoadPattern: z.string().optional(),
  deflectionLimitDivisor: z.string().optional(),
  deflectionBasis: z.enum(["L", "D+L"]).optional(),
  designCheckDeflection: z.boolean().optional(),
  shearWebStiffening: z.enum(["Unstiffened Webs", "Stiffened Webs"]).optional(),
  shearPanelLengthIn: z.string().optional(),
});

export const evaluateBending = calculateBendingShearDesign;
