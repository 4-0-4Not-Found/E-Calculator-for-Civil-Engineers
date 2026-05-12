import { describe, expect, it } from "vitest";
import { calculateShearDesign } from "@/lib/limit-state-engine/shear";

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
