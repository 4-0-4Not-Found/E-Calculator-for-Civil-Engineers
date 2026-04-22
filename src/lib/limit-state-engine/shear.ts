import type { CalculationOutput } from "@/lib/types/calculation";

export type ShearInput = {
  designMethod: "LRFD" | "ASD";
  Fy: number;
  d: number;
  tw: number;
  hTw: number;
  demandV: number;
};

function safeRatio(demand: number, capacity: number): number {
  if (!Number.isFinite(capacity) || capacity <= 0) return demand > 0 ? 999 : 0;
  return demand / capacity;
}

/**
 * Workbook parity: PROGRAM-2.xlsx, "Shear (ANALYSIS)".
 * Uses E = 29000 ksi and k_v = 5 for unstiffened webs.
 */
export function calculateShearDesign(input: ShearInput): CalculationOutput {
  const E = 29000;
  const kv = 5;
  if (input.Fy <= 0 || input.d <= 0 || input.tw <= 0 || input.hTw <= 0) {
    return {
      steps: [{ id: "s-err", label: "Invalid input", value: "Fy, d, t_w, and h/t_w must be positive." }],
      results: { shear: { name: "Shear capacity", phiPn: 0, unit: "kips" } },
      governingCase: "invalid_geometry",
      controllingStrength: 0,
      demand: input.demandV,
      isSafe: false,
    };
  }

  const lambda1 = 2.24 * Math.sqrt(E / input.Fy);
  const lambda2 = 1.1 * Math.sqrt((kv * E) / input.Fy);
  const lambda3 = 1.37 * Math.sqrt((kv * E) / input.Fy);

  let cv = 1;
  let cvCase = "Case 1";
  if (input.hTw <= lambda1) {
    cv = 1;
    cvCase = "Case 1";
  } else if (input.hTw <= lambda2) {
    cv = 1;
    cvCase = "Case 2a";
  } else if (input.hTw <= lambda3) {
    cv = lambda2 / input.hTw;
    cvCase = "Case 2b";
  } else {
    // Workbook sheet uses 1.51 coefficient in this region.
    cv = (1.51 * E * kv) / (input.hTw ** 2 * input.Fy);
    cvCase = "Case 2c";
  }

  const phi = input.hTw <= lambda1 ? 1 : 0.9;
  const omega = input.hTw <= lambda1 ? 1.5 : 1.67;
  const vn = 0.6 * input.Fy * input.d * input.tw * cv;
  const capacity = input.designMethod === "LRFD" ? phi * vn : vn / omega;
  const ratio = safeRatio(input.demandV, capacity);

  return {
    steps: [
      { id: "s1", label: "Web slenderness λ_w", formula: "h/t_w", value: input.hTw },
      { id: "s2", label: "Shear buckling coefficient k_v", value: kv },
      { id: "s3", label: "Shear coefficient C_v", formula: "Workbook Shear (ANALYSIS) logic", value: cv, note: cvCase },
      { id: "s4", label: "Nominal shear V_n", formula: "0.6 F_y d t_w C_v", value: vn, unit: "kips" },
      {
        id: "s5",
        label: input.designMethod === "LRFD" ? "Design shear φV_n" : "Allowable shear V_n/Ω",
        formula: input.designMethod === "LRFD" ? "φ = 1.0 or 0.9" : "Ω = 1.5 or 1.67",
        value: capacity,
        unit: "kips",
      },
    ],
    results: {
      shear: { name: input.designMethod === "LRFD" ? "φV_n" : "V_n / Ω", phiPn: capacity, unit: "kips" },
      nominal: { name: "V_n", phiPn: vn, unit: "kips" },
    },
    governingCase: cvCase,
    controllingStrength: capacity,
    demand: input.demandV,
    isSafe: ratio <= 1,
  };
}

