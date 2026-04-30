export type SteelMaterial = {
  key: string;
  label: string;
  Fy: number;
  Fu: number;
};

export const steelMaterials = [
  { key: "A36", label: "ASTM A36", Fy: 36, Fu: 58 },
  { key: "A53_GR_B", label: "ASTM A53 Gr. B", Fy: 35, Fu: 60 },
  { key: "A500_GR_B_42", label: "ASTM A500 Gr. B (Fy 42)", Fy: 42, Fu: 58 },
  { key: "A500_GR_B_46", label: "ASTM A500 Gr. B (Fy 46)", Fy: 46, Fu: 58 },
  { key: "A500_GR_C_46", label: "ASTM A500 Gr. C (Fy 46)", Fy: 46, Fu: 62 },
  { key: "A500_GR_C_50", label: "ASTM A500 Gr. C (Fy 50)", Fy: 50, Fu: 62 },
  { key: "A501_GR_A", label: "ASTM A501 Gr. A", Fy: 36, Fu: 58 },
  { key: "A501_GR_B", label: "ASTM A501 Gr. B", Fy: 50, Fu: 70 },
  { key: "A529_GR_50", label: "ASTM A529 Gr. 50", Fy: 50, Fu: 65 },
  { key: "A529_GR_55", label: "ASTM A529 Gr. 55", Fy: 55, Fu: 70 },
  { key: "A709_36", label: "ASTM A709 36", Fy: 36, Fu: 58 },
  { key: "A1043_36", label: "ASTM A1043 36", Fy: 36, Fu: 58 },
  { key: "A1043_50", label: "ASTM A1043 50", Fy: 50, Fu: 65 },
  { key: "A1085_GR_A", label: "ASTM A1085 Gr. A", Fy: 50, Fu: 65 },
  { key: "A572_GR_42", label: "ASTM A572 Gr. 42", Fy: 42, Fu: 60 },
  { key: "A572_GR_50", label: "ASTM A572 Gr. 50", Fy: 50, Fu: 65 },
  { key: "A572_GR_55", label: "ASTM A572 Gr. 55", Fy: 55, Fu: 70 },
  { key: "A572_GR_60", label: "ASTM A572 Gr. 60", Fy: 60, Fu: 75 },
  { key: "A572_GR_65", label: "ASTM A572 Gr. 65", Fy: 65, Fu: 80 },
  { key: "A618_GR_IA", label: "ASTM A618 Gr. Ia", Fy: 50, Fu: 70 },
  { key: "A618_GR_IB", label: "ASTM A618 Gr. Ib", Fy: 50, Fu: 70 },
  { key: "A618_GR_II", label: "ASTM A618 Gr. II", Fy: 50, Fu: 70 },
  { key: "A618_GR_III", label: "ASTM A618 Gr. III", Fy: 50, Fu: 65 },
  { key: "A709_50", label: "ASTM A709 50", Fy: 50, Fu: 65 },
  { key: "A709_50S", label: "ASTM A709 50S", Fy: 50, Fu: 65 },
  { key: "A709_50W", label: "ASTM A709 50W", Fy: 50, Fu: 70 },
  { key: "A913_50", label: "ASTM A913 50", Fy: 50, Fu: 65 },
  { key: "A913_60", label: "ASTM A913 60", Fy: 60, Fu: 75 },
  { key: "A913_65", label: "ASTM A913 65", Fy: 65, Fu: 80 },
  { key: "A913_70", label: "ASTM A913 70", Fy: 70, Fu: 90 },
  { key: "A992", label: "ASTM A992", Fy: 50, Fu: 65 },
  { key: "A1065_GR_50", label: "ASTM A1065 Gr. 50", Fy: 50, Fu: 60 },
  { key: "A1065_GR_50W", label: "ASTM A1065 Gr. 50W", Fy: 50, Fu: 70 },
  { key: "A588", label: "ASTM A588", Fy: 50, Fu: 70 },
  { key: "A847", label: "ASTM A847", Fy: 50, Fu: 70 },
  { key: "A514_GR_100", label: "ASTM A514 Gr. 100", Fy: 100, Fu: 110 },
];

export type SteelMaterialKey = (typeof steelMaterials)[number]["key"];

export const steelMaterialMap = Object.fromEntries(
  steelMaterials.map((material) => [material.key, material]),
) as Record<SteelMaterialKey, SteelMaterial>;

const legacySteelKeyMap: Record<string, SteelMaterialKey> = {
  A572: "A572_GR_50",
  A500: "A500_GR_C_50",
};

export function normalizeSteelMaterialKey(value: string, fallback: SteelMaterialKey = "A992"): SteelMaterialKey {
  if (value in steelMaterialMap) return value as SteelMaterialKey;
  const mapped = legacySteelKeyMap[value];
  if (mapped) return mapped;
  return fallback;
}
