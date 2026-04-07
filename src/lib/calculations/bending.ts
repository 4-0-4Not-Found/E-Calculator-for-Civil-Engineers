import type { CalculationOutput } from "@/lib/types/calculation";

export type BendingInput = {
  Fy: number;
  Zx: number;
  Vu: number;
  Vn: number;
  Mu: number;
  deflection: number;
  deflectionAllowable: number;
};

export function calculateBendingShearDesign(input: BendingInput): CalculationOutput {
  const phiMn = 0.9 * input.Fy * input.Zx;
  const phiVn = 0.9 * input.Vn;
  const controllingStrength = Math.min(phiMn, phiVn);
  const demand = Math.max(input.Mu, input.Vu);
  const isSafe = phiMn >= input.Mu && phiVn >= input.Vu && input.deflection <= input.deflectionAllowable;

  return {
    steps: [
      { id: "b1", label: "Flexural strength", formula: "phiMn = 0.9 Fy Zx", value: phiMn, unit: "kip-in" },
      { id: "b2", label: "Shear strength", formula: "phiVn = 0.9 Vn", value: phiVn, unit: "kips" },
      { id: "b3", label: "Deflection check", formula: "delta <= delta_allow", value: `${input.deflection} <= ${input.deflectionAllowable}` },
    ],
    results: {
      bending: { name: "Bending Capacity", phiPn: phiMn, unit: "kip-in" },
      shear: { name: "Shear Capacity", phiPn: phiVn, unit: "kips" },
    },
    governingCase: phiMn <= phiVn ? "bending" : "shear",
    controllingStrength,
    demand,
    isSafe,
  };
}
