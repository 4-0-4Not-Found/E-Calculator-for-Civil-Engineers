import { describe, expect, it } from "vitest";
import {
  buildExcelBendingAnalysisSnapshot,
  excelBendingFactoredUniformKlf,
  excelBendingFlbNominalMnKipFt,
  excelBendingPatternRow,
  excelBendingServiceUniformKlf,
} from "./excel-analysis-bending";

describe("excel-analysis-bending", () => {
  it("matches workbook LRFD / service uniform combinations (no self-weight)", () => {
    expect(excelBendingFactoredUniformKlf(0.8, 3.2, 0)).toBeCloseTo(Math.max(1.2 * 0.8 + 1.6 * 3.2, 1.4 * 0.8), 10);
    expect(excelBendingServiceUniformKlf(0.8, 3.2, 0)).toBeCloseTo(4.0, 10);
  });

  it("replicates simple-beam uniform row (pattern 0)", () => {
    const r = excelBendingPatternRow(0, 0.126, 0.09, 30, 0, 0, 29000, 999);
    expect(r.VfactoredKips).toBeCloseTo((0.126 * 30) / 2, 8);
    expect(r.VserviceKips).toBeCloseTo((0.09 * 30) / 2, 8);
    expect(r.MfactoredKipFt).toBeCloseTo((0.126 * 30 ** 2) / 8, 8);
    expect(r.MserviceKipFt).toBeCloseTo((0.09 * 30 ** 2) / 8, 8);
  });

  it("F6 flange local buckling matches W14×90 sample from workbook (Fy=50, non-compact)", () => {
    const flb = excelBendingFlbNominalMnKipFt({
      E: 29000,
      Fy: 50,
      Zx: 157,
      Sx: 143,
      lambdaFlangeBf2tf: 10.2,
      lambdaWebHtw: 25.9,
    });
    expect(flb.flangeClass).toBe("Non-compact");
    expect(flb.MnKipFt).toBeCloseTo(637.5203776965268, 4);
    expect(flb.MpKipFt).toBeCloseTo(654.1666666666666, 4);
  });

  it("buildExcelBendingAnalysisSnapshot flexure LRFD matches E46 vs E28 logic", () => {
    const h = 14 - 2 * 0.71;
    const snap = buildExcelBendingAnalysisSnapshot({
      deadLoadKlf: 0.8,
      liveLoadKlf: 3.2,
      spanFt: 30,
      weightPlf: 90,
      includeSelfWeight: true,
      pattern: "Simple Beam: Uniformly Distributed Load",
      Eksi: 29000,
      Fy: 50,
      Zx: 157,
      Sx: 143,
      lambdaFlangeBf2tf: 10.2,
      lambdaWebHtw: 25.9,
      Ix: 999,
      deflectionSpanDivisor: 360,
      deflectionBasis: "L",
      LbIn: 360,
      Cb: 1.14,
      d: 14,
      bf: 14.5,
      tf: 0.71,
      tw: 0.44,
      h,
      Iy: 362,
      ry: 3.7,
      aiscTypeToken: "W",
      shearWebStiffening: "Unstiffened Webs",
      shearPanelLengthIn: 360,
    });
    expect(snap).not.toBeNull();
    expect(snap!.phiMnLrfdKipFt).toBeCloseTo(0.9 * 637.5203776965268, 3);
    expect(snap!.MrLrfdKipFt).toBeCloseTo((snap!.wFactoredUsedKlf * 30 ** 2) / 8, 4);
    expect(snap!.shear.phiVnKips).toBeGreaterThan(100);
    expect(snap!.ltb.LpIn).toBeGreaterThan(0);
  });
});
