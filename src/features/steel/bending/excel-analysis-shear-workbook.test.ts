import { describe, expect, it } from "vitest";
import { workbookAnalysisShearG2 } from "./excel-analysis-shear-workbook";

describe("excel-analysis-shear-workbook", () => {
  it("matches Analysis (Shear) template for W16×26 (Cv, V_n, φV_n)", () => {
    const s = workbookAnalysisShearG2({
      Fy: 50,
      E: 29000,
      d: 15.7,
      tw: 0.25,
      hTw: 56.8,
      hClearIn: 14.2,
      webStiffening: "Unstiffened Webs",
      panelLengthIn: 50,
      aiscTypeToken: "W",
    });
    /** AISC G2 limits with Fy = 50 ksi; workbook cell snapshot may differ if Fy in K8 differs (e.g. 60 ksi gives D41 ≈ 49.2). */
    expect(s.lambdaV1).toBeCloseTo(2.24 * Math.sqrt(29000 / 50), 4);
    expect(s.shearCase).toBe(1);
    expect(s.Cv).toBe(1);
    expect(s.VnKips).toBeCloseTo(0.6 * 50 * 15.7 * 0.25 * 1, 4);
    expect(s.phiLrfd).toBe(0.9);
    expect(s.phiVnKips).toBeCloseTo(0.9 * s.VnKips, 4);
    expect(s.omegaAsd).toBe(1.67);
  });
});
