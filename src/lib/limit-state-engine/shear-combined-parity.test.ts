import { describe, expect, it } from "vitest";
import { calculateShearDesign } from "@/lib/limit-state-engine/shear";
import { calculateCombinedDesign } from "@/lib/limit-state-engine/combined";

describe("PROGRAM-2 workbook parity — Shear (ANALYSIS)", () => {
  it("matches workbook capacity for W44X290 example", () => {
    // Workbook snapshot: d=43.6, tw=0.865, h/tw=45, Fy=50.
    const lrfd = calculateShearDesign({
      designMethod: "LRFD",
      Fy: 50,
      d: 43.6,
      tw: 0.865,
      hTw: 45,
      demandV: 0,
    });
    const asd = calculateShearDesign({
      designMethod: "ASD",
      Fy: 50,
      d: 43.6,
      tw: 0.865,
      hTw: 45,
      demandV: 0,
    });

    // Workbook row: Vn=1131.42, LRFD=1131.42, ASD=754.28.
    expect(lrfd.results.nominal.phiPn).toBeCloseTo(1131.42, 2);
    expect(lrfd.controllingStrength).toBeCloseTo(1131.42, 2);
    expect(asd.controllingStrength).toBeCloseTo(754.28, 2);
  });
});

describe("PROGRAM-2 workbook parity — Bending & Shear (DESIGN)", () => {
  it("includes beam self-weight in combined load effects", () => {
    const out = calculateCombinedDesign({
      designMethod: "LRFD",
      Fy: 36,
      deadLoadKft: 2,
      liveLoadKft: 18,
      spanFt: 7,
      cb: 1.14,
      selectedShapeName: "W14X30",
    });
    expect(out).not.toBeNull();
    if (!out) return;

    // Workbook pattern: include W/1000 into D before LRFD combo.
    const deadWithSelf = 2 + 30 / 1000;
    const expectedWu = Math.max(1.4 * deadWithSelf, 1.2 * deadWithSelf + 1.6 * 18);
    const expectedMu = (expectedWu * 7 * 7) / 8;
    const expectedVu = (expectedWu * 7) / 2;
    expect(out.demand.deadWithSelf).toBeCloseTo(deadWithSelf, 6);
    expect(out.demand.wStrength).toBeCloseTo(expectedWu, 6);
    expect(out.demand.Mu).toBeCloseTo(expectedMu, 6);
    expect(out.demand.Vu).toBeCloseTo(expectedVu, 6);
  });
});

