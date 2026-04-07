import type { CalculationOutput } from "@/lib/types/calculation";

export type CompressionInput = {
  Fy: number;
  E: number;
  k: number;
  L: number;
  r: number;
  Ag: number;
  demandPu: number;
};

export function calculateCompressionDesign(input: CompressionInput): CalculationOutput {
  const KLr = (input.k * input.L) / input.r;
  const Fe = (Math.PI ** 2 * input.E) / (KLr ** 2);
  const limit = 4.71 * Math.sqrt(input.E / input.Fy);
  const Fcr =
    KLr <= limit
      ? (0.658 ** (input.Fy / Fe)) * input.Fy
      : 0.877 * Fe;
  const phiPn = 0.9 * Fcr * input.Ag;

  return {
    steps: [
      { id: "c1", label: "Member slenderness", formula: "KL/r", value: KLr, unit: "-" },
      { id: "c2", label: "Elastic buckling stress", formula: "Fe = pi^2 E / (KL/r)^2", value: Fe, unit: "ksi" },
      { id: "c3", label: "Critical stress", formula: "AISC E3", value: Fcr, unit: "ksi" },
      { id: "c4", label: "Design compressive strength", formula: "phiPn = 0.9 Fcr Ag", value: phiPn, unit: "kips" },
    ],
    results: {
      compression: { name: "Compression Capacity", phiPn, unit: "kips" },
    },
    governingCase: "compression",
    controllingStrength: phiPn,
    demand: input.demandPu,
    isSafe: phiPn >= input.demandPu,
  };
}
