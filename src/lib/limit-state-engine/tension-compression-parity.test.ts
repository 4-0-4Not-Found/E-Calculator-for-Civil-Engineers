import { describe, expect, it } from "vitest";
import shapes from "@/data/aisc-shapes-v16.json";
import { calculateCompressionDesign } from "@/lib/limit-state-engine/compression";
import { calculateTensionDesign } from "@/lib/limit-state-engine/tension";
import type { AiscShape } from "@/lib/aisc/types";

function pickShape(name: string): AiscShape {
  const s = (shapes as AiscShape[]).find((x) => x.shape === name);
  if (!s) throw new Error(`Shape ${name} not found`);
  return s;
}

describe("Workbook parity — Tension (Analysis/Design sheets)", () => {
  it("matches benchmark strengths for A572 Gr.50 sample inputs", () => {
    const lrfd = calculateTensionDesign({
      designMethod: "LRFD",
      Fy: 50,
      Fu: 65,
      Ag: 38.6,
      An: 32,
      U: 0.9,
      demandPu: 900,
      Agv: 24,
      Anv: 20,
      Agt: 8,
      Ant: 6.5,
      ubs: 0.5,
    });
    const asd = calculateTensionDesign({
      designMethod: "ASD",
      Fy: 50,
      Fu: 65,
      Ag: 38.6,
      An: 32,
      U: 0.9,
      demandPu: 900,
      Agv: 24,
      Anv: 20,
      Agt: 8,
      Ant: 6.5,
      ubs: 0.5,
    });

    // Benchmarks used by workbook-aligned verification fixtures.
    expect(lrfd.results.grossYielding.phiPn).toBeCloseTo(1737, 2);
    expect(lrfd.results.netFracture.phiPn).toBeCloseTo(1404, 2);
    expect(lrfd.results.blockShear.phiPn).toBeCloseTo(698.438, 2);
    expect(lrfd.controllingStrength).toBeCloseTo(698.438, 2);
    expect(asd.controllingStrength).toBeCloseTo(465.625, 2);
  });
});

describe("Workbook parity — Compression (Analysis/Design sheets)", () => {
  it("matches benchmark capacity for W24X131 (A992) sample", () => {
    const w24 = pickShape("W24X131");
    const lrfd = calculateCompressionDesign({
      designMethod: "LRFD",
      Fy: 50,
      E: 29000,
      k: 1,
      L: 240,
      rx: w24.rx,
      ry: w24.ry,
      Ag: w24.A,
      lambdaFlange: w24.bf_2tf,
      lambdaWeb: w24.h_tw,
      demandPu: 700,
    });
    const asd = calculateCompressionDesign({
      designMethod: "ASD",
      Fy: 50,
      E: 29000,
      k: 1,
      L: 240,
      rx: w24.rx,
      ry: w24.ry,
      Ag: w24.A,
      lambdaFlange: w24.bf_2tf,
      lambdaWeb: w24.h_tw,
      demandPu: 700,
    });

    // Benchmarks used by workbook-aligned verification fixtures.
    expect(lrfd.controllingStrength).toBeCloseTo(1077.569, 2);
    expect(asd.controllingStrength).toBeCloseTo(716.945, 2);
    expect(lrfd.isSafe).toBe(true);
    expect(asd.isSafe).toBe(true);
  });
});
