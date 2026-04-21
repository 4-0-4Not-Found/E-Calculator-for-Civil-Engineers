import { z } from "zod";
import { calculateTensionDesign } from "@/lib/limit-state-engine/tension";

type TensionDefaults = {
  material: string;
  shapeName: string;
  Ag: string;
  An: string;
  U: string;
  Pu: string;
  Agv: string;
  Anv: string;
  Agt: string;
  Ant: string;
  ubs: string;
  stagW: string;
  stagDh: string;
  stagN: string;
  stagS: string;
  stagG: string;
  stagT: string;
  shapeFamily: string;
  designMethod: "LRFD" | "ASD";
  mode: "check" | "design";
};

export const tensionDefaults: TensionDefaults = {
  material: "A992",
  shapeName: "W24X131",
  Ag: "38.5",
  An: "32",
  U: "0.9",
  Pu: "900",
  Agv: "24",
  Anv: "20",
  Agt: "8",
  Ant: "6.5",
  ubs: "0.5",
  stagW: "",
  stagDh: "0.875",
  stagN: "2",
  stagS: "3",
  stagG: "3",
  stagT: "0.75",
  shapeFamily: "all",
  designMethod: "LRFD",
  mode: "check",
};

export const tensionDraftSchema = z.object({
  material: z.string().optional(),
  shapeName: z.string().optional(),
  Ag: z.string().optional(),
  An: z.string().optional(),
  U: z.string().optional(),
  Pu: z.string().optional(),
  Agv: z.string().optional(),
  Anv: z.string().optional(),
  Agt: z.string().optional(),
  Ant: z.string().optional(),
  ubs: z.string().optional(),
  stagW: z.string().optional(),
  stagDh: z.string().optional(),
  stagN: z.string().optional(),
  stagS: z.string().optional(),
  stagG: z.string().optional(),
  stagT: z.string().optional(),
  shapeFamily: z.string().optional(),
  designMethod: z.enum(["LRFD", "ASD"]).optional(),
  mode: z.enum(["check", "design"]).optional(),
});

export const evaluateTension = calculateTensionDesign;
