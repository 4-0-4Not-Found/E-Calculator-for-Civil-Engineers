import { describe, expect, it } from "vitest";
import { aiscShapes } from "@/lib/aisc/data";
import {
  computeExcelDesignBendingSummary,
  designBendingBZCodeFromPattern,
  evaluateDesignBendingRow,
} from "./excel-design-bending";

describe("excel-design-bending", () => {
  it("maps load pattern to Sheet4 BZ code", () => {
    expect(designBendingBZCodeFromPattern("Simple Beam: Uniformly Distributed Load")).toBe(1);
    expect(designBendingBZCodeFromPattern("Beam Fixed at Both Ends: Uniformly Distributed Load")).toBe(15);
  });

  it("returns lightest passing W for zero loads (flexure and deflection trivially pass)", () => {
    const s = computeExcelDesignBendingSummary({
      Fy: 50,
      Eksi: 29000,
      deadKlf: 0,
      liveKlf: 0,
      spanFt: 20,
      includeSelfWeight: false,
      checkDeflection: true,
      deflectionBasis: "L",
      loadPattern: "Simple Beam: Uniformly Distributed Load",
      deflectionDivisor: 360,
      maxList: 5,
    });
    expect(s).not.toBeNull();
    expect(s!.lightestLrfdShape).toBeTruthy();
    const firstW = aiscShapes.filter((x) => x.type === "W").sort((a, b) => a.W - b.W)[0];
    expect(s!.lightestLrfdShape).toBe(firstW?.shape);
  });

  it("evaluateDesignBendingRow matches workbook-style AU and CD for uniform load", () => {
    const shape = aiscShapes.find((x) => x.shape === "W14X90")!;
    const row = evaluateDesignBendingRow(shape, {
      Fy: 50,
      Eksi: 29000,
      deadKlf: 0.8,
      liveKlf: 3.2,
      spanFt: 30,
      includeSelfWeight: true,
      checkDeflection: true,
      deflectionBasis: "L",
      loadPattern: "Simple Beam: Uniformly Distributed Load",
      deflectionDivisor: 360,
    });
    const AZ = Math.max(1.2 * (0.8 + shape.W / 1000) + 1.6 * 3.2, 1.4 * (0.8 + shape.W / 1000));
    expect(row.CD_kipFt).toBeCloseTo((AZ * 30 ** 2) / 8, 6);
    expect(row.AU_kipFt).toBeCloseTo(0.9 * row.AT_kipFt, 6);
  });
});
