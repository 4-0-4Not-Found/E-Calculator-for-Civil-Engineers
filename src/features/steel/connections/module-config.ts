import { z } from "zod";

type ConnectionsDefaults = {
  designMethod: "LRFD" | "ASD";
  shearMode: "bearing" | "slip";
  surfaceClass: "A" | "B";
  slipHf: string;
  vu: string;
  tu: string;
  boltGroup: string;
  dBolt: string;
  nBolts: string;
  shearPlanes: "1" | "2";
  threadMode: string;
  checkBearing: boolean;
  plateFu: string;
  plateT: string;
  lcMin: string;
  fexx: string;
  legIn: string;
  weldLen: string;
  weldDemand: string;
  grooveThroatIn: string;
  grooveLenIn: string;
  grooveDemand: string;
  pryingTPerBoltOverride: string;
  pryingBPrimeIn: string;
  pryingStripWidthIn: string;
  pryingFyKsi: string;
};

export const connectionsDefaults: ConnectionsDefaults = {
  designMethod: "LRFD",
  shearMode: "bearing",
  surfaceClass: "A",
  slipHf: "1",
  vu: "120",
  tu: "0",
  boltGroup: "A325",
  dBolt: "0.75",
  nBolts: "4",
  shearPlanes: "2",
  threadMode: "N",
  checkBearing: true,
  plateFu: "65",
  plateT: "0.5",
  lcMin: "1.25",
  fexx: "70",
  legIn: "0.25",
  weldLen: "4",
  weldDemand: "50",
  grooveThroatIn: "0.25",
  grooveLenIn: "4",
  grooveDemand: "50",
  pryingTPerBoltOverride: "",
  pryingBPrimeIn: "1.5",
  pryingStripWidthIn: "4",
  pryingFyKsi: "50",
};

export const connectionsDraftSchema = z.object({
  designMethod: z.enum(["LRFD", "ASD"]).optional(),
  shearMode: z.enum(["bearing", "slip"]).optional(),
  surfaceClass: z.enum(["A", "B"]).optional(),
  slipHf: z.string().optional(),
  vu: z.string().optional(),
  tu: z.string().optional(),
  boltGroup: z.string().optional(),
  dBolt: z.string().optional(),
  nBolts: z.string().optional(),
  shearPlanes: z.enum(["1", "2"]).optional(),
  threadMode: z.string().optional(),
  checkBearing: z.boolean().optional(),
  plateFu: z.string().optional(),
  plateT: z.string().optional(),
  lcMin: z.string().optional(),
  fexx: z.string().optional(),
  legIn: z.string().optional(),
  weldLen: z.string().optional(),
  weldDemand: z.string().optional(),
  grooveThroatIn: z.string().optional(),
  grooveLenIn: z.string().optional(),
  grooveDemand: z.string().optional(),
  pryingTPerBoltOverride: z.string().optional(),
  pryingBPrimeIn: z.string().optional(),
  pryingStripWidthIn: z.string().optional(),
  pryingFyKsi: z.string().optional(),
});
