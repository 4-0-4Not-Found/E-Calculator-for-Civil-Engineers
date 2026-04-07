export type SteelMaterialKey = "A36" | "A992" | "A572";

export type SteelMaterial = {
  key: SteelMaterialKey;
  label: string;
  Fy: number;
  Fu: number;
};

export const steelMaterials: SteelMaterial[] = [
  { key: "A36", label: "ASTM A36", Fy: 36, Fu: 58 },
  { key: "A992", label: "ASTM A992", Fy: 50, Fu: 65 },
  { key: "A572", label: "ASTM A572 Gr.50", Fy: 50, Fu: 65 },
];

export const steelMaterialMap = Object.fromEntries(
  steelMaterials.map((material) => [material.key, material]),
) as Record<SteelMaterialKey, SteelMaterial>;
