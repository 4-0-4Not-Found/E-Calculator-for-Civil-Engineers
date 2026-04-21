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
  designMethod: "LRFD" | "ASD";
};

export const compressionDefaults: CompressionDefaults = {
  material: "A992",
  shapeFamily: "W",
  shapeName: "W24X131",
  k: "1.0",
  builtUpFactor: "1.0",
  L: "240",
  Pu: "700",
  designMethod: "LRFD",
};

export const compressionDraftSchema = z.object({
  material: z.string().optional(),
  shapeFamily: z.string().optional(),
  shapeName: z.string().optional(),
  k: z.string().optional(),
  builtUpFactor: z.string().optional(),
  L: z.string().optional(),
  Pu: z.string().optional(),
  designMethod: z.enum(["LRFD", "ASD"]).optional(),
});

export const evaluateCompression = calculateCompressionDesign;
