import type { CalculationOutput, CalculationResult, CalculationStep } from "@/lib/types/calculation";

export type TensionInput = {
  Fy: number;
  Fu: number;
  Ag: number;
  An: number;
  U: number;
  demandPu: number;
  blockShearNominal?: number;
};

const PHI_YIELD = 0.9;
const PHI_FRACTURE = 0.75;
const PHI_BLOCK = 0.75;

export function calculateTensionDesign(input: TensionInput): CalculationOutput {
  const { Fy, Fu, Ag, An, U, demandPu } = input;
  const Ae = An * U;
  const blockNominal = input.blockShearNominal ?? Number.POSITIVE_INFINITY;

  const phiYield = PHI_YIELD * Fy * Ag;
  const phiFracture = PHI_FRACTURE * Fu * Ae;
  const phiBlock = Number.isFinite(blockNominal) ? PHI_BLOCK * blockNominal : Number.POSITIVE_INFINITY;

  const results: Record<string, CalculationResult> = {
    grossYielding: { name: "Gross Section Yielding", phiPn: phiYield, unit: "kips" },
    netFracture: { name: "Net Section Fracture", phiPn: phiFracture, unit: "kips" },
    blockShear: { name: "Block Shear", phiPn: phiBlock, unit: "kips" },
  };

  const ordered = Object.entries(results).sort((a, b) => a[1].phiPn - b[1].phiPn);
  const governingCase = ordered[0][0];
  const controllingStrength = ordered[0][1].phiPn;

  const steps: CalculationStep[] = [
    { id: "s1", label: "Effective net area", formula: "Ae = An * U", value: Ae, unit: "in^2" },
    { id: "s2", label: "Yielding strength", formula: "phiPn = 0.9 * Fy * Ag", value: phiYield, unit: "kips" },
    { id: "s3", label: "Fracture strength", formula: "phiPn = 0.75 * Fu * Ae", value: phiFracture, unit: "kips" },
    {
      id: "s4",
      label: "Block shear strength",
      formula: "phiPn = 0.75 * Pn(block)",
      value: Number.isFinite(phiBlock) ? phiBlock : "Not provided",
      unit: Number.isFinite(phiBlock) ? "kips" : undefined,
      note: "Use AISC J4.3 with Agv, Anv, Agt, Ant for full calculation.",
    },
    { id: "s5", label: "Controlling design strength", formula: "phiPn = min(modes)", value: controllingStrength, unit: "kips" },
  ];

  return {
    steps,
    results,
    governingCase,
    controllingStrength,
    demand: demandPu,
    isSafe: controllingStrength >= demandPu,
  };
}
