"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { aiscShapes } from "@/lib/aisc/data";
import { steelMaterialMap, steelMaterials, type SteelMaterialKey } from "@/lib/data/materials";
import { calculateTensionDesign } from "@/lib/calculations/tension";

const toNumber = (v: string) => Number(v) || 0;

export default function TensionModulePage() {
  const [material, setMaterial] = useState<SteelMaterialKey>("A992");
  const [shapeName, setShapeName] = useState("W24X131");
  const [Ag, setAg] = useState("38.5");
  const [An, setAn] = useState("32");
  const [U, setU] = useState("0.9");
  const [Pu, setPu] = useState("900");
  const [blockPn, setBlockPn] = useState("1300");

  const selectedMaterial = steelMaterialMap[material];
  const shape = aiscShapes.find((s) => s.shape === shapeName);

  const result = useMemo(() => {
    return calculateTensionDesign({
      Fy: selectedMaterial.Fy,
      Fu: selectedMaterial.Fu,
      Ag: toNumber(Ag),
      An: toNumber(An),
      U: toNumber(U),
      demandPu: toNumber(Pu),
      blockShearNominal: toNumber(blockPn),
    });
  }, [selectedMaterial, Ag, An, U, Pu, blockPn]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 p-6 md:p-10">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">Tension Analysis & Design</h1>
          <Link href="/" className="text-sm font-medium text-blue-700 hover:underline">Back to modules</Link>
        </div>
        <p className="mt-2 text-slate-600">AISC D2 + J4 checks: gross yielding, net fracture, and block shear.</p>
      </header>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-blue-700">Steel Type</span>
          <select className="rounded-md border border-slate-300 p-2" value={material} onChange={(e) => setMaterial(e.target.value as SteelMaterialKey)}>
            {steelMaterials.map((m) => (
              <option key={m.key} value={m.key}>{m.label} (Fy={m.Fy}, Fu={m.Fu})</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-blue-700">AISC Shape</span>
          <select className="rounded-md border border-slate-300 p-2" value={shapeName} onChange={(e) => {
            const selected = aiscShapes.find((s) => s.shape === e.target.value);
            setShapeName(e.target.value);
            if (selected) setAg(String(selected.A));
          }}>
            {aiscShapes.map((s) => (
              <option key={s.shape} value={s.shape}>{s.shape}</option>
            ))}
          </select>
        </label>
        <LabeledInput label="Ag (gross area, in^2)" value={Ag} onChange={setAg} />
        <LabeledInput label="An (net area, in^2)" value={An} onChange={setAn} />
        <LabeledInput label="U (shear lag factor)" value={U} onChange={setU} />
        <LabeledInput label="Pu (required tension, kips)" value={Pu} onChange={setPu} />
        <LabeledInput label="Pn block (nominal block, kips)" value={blockPn} onChange={setBlockPn} />
      </section>

      {shape ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Selected Section Snapshot</h2>
          <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-3">
            <div>d = {shape.d} in</div>
            <div>bf = {shape.bf} in</div>
            <div>tf = {shape.tf} in</div>
            <div>tw = {shape.tw} in</div>
            <div>rx = {shape.rx} in</div>
            <div>ry = {shape.ry} in</div>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Step-by-Step</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2">Step</th><th className="py-2">Formula</th><th className="py-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {result.steps.map((step) => (
                <tr key={step.id} className="border-b border-slate-100">
                  <td className="py-2">{step.label}</td>
                  <td className="py-2 font-mono text-xs text-slate-600">{step.formula ?? "-"}</td>
                  <td className="py-2 font-semibold">{typeof step.value === "number" ? step.value.toFixed(2) : step.value} {step.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Final Results</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {Object.entries(result.results).map(([key, value]) => (
            <div key={key} className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs uppercase text-slate-500">{value.name}</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{value.phiPn.toFixed(2)} {value.unit}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">Governing case: <span className="font-semibold text-slate-900">{result.governingCase}</span></p>
          <p className="text-sm text-slate-600">Controlling strength: <span className="font-semibold text-slate-900">{result.controllingStrength.toFixed(2)} kips</span></p>
          <p className="text-sm text-slate-600">Demand: <span className="font-semibold text-slate-900">{result.demand.toFixed(2)} kips</span></p>
          <p className={`mt-2 text-lg font-bold ${result.isSafe ? "text-green-700" : "text-red-700"}`}>{result.isSafe ? "SAFE" : "NOT SAFE"}</p>
        </div>
      </section>
    </main>
  );
}

function LabeledInput(props: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-blue-700">{props.label}</span>
      <input className="rounded-md border border-slate-300 p-2" value={props.value} onChange={(e) => props.onChange(e.target.value)} />
    </label>
  );
}
