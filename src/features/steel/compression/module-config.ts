import { z } from "zod";
import { calculateCompressionDesign } from "@/lib/limit-state-engine/compression";

type CompressionDefaults = {
  material: string;
  shapeFamily: string;
  shapeName: string;
  k: string;
  builtUpFactor: string;
  L: string;
  Pu: string;
  deadLoad: string;
  liveLoad: string;
  designMethod: "LRFD" | "ASD";
  mode: "check" | "design";
};

export const compressionDefaults: CompressionDefaults = {
  material: "A992",
  shapeFamily: "W",
  shapeName: "W24X131",
  k: "1.0",
  builtUpFactor: "1.0",
  L: "240",
  Pu: "700",
  deadLoad: "400",
  liveLoad: "200",
  designMethod: "LRFD",
  mode: "check",
};

export const compressionDraftSchema = z.object({
  material: z.string().optional(),
  shapeFamily: z.string().optional(),
  shapeName: z.string().optional(),
  k: z.string().optional(),
  builtUpFactor: z.string().optional(),
  L: z.string().optional(),
  Pu: z.string().optional(),
  deadLoad: z.string().optional(),
  liveLoad: z.string().optional(),
  designMethod: z.enum(["LRFD", "ASD"]).optional(),
  mode: z.enum(["check", "design"]).optional(),
});

export const evaluateCompression = calculateCompressionDesign;
