export type CalculationStep = {
  id: string;
  label: string;
  formula?: string;
  value: number | string;
  unit?: string;
  note?: string;
};

export type CalculationResult = {
  name: string;
  phiPn: number;
  unit: string;
};

export type CalculationOutput = {
  steps: CalculationStep[];
  results: Record<string, CalculationResult>;
  governingCase: string;
  controllingStrength: number;
  demand: number;
  isSafe: boolean;
};
export type CalculationStep = {
  id: string;
  label: string;
  formula?: string;
  value: number | string;
  unit?: string;
  note?: string;
};

export type CalculationResult = {
  name: string;
  phiPn: number;
  unit: string;
};

export type CalculationOutput = {
  steps: CalculationStep[];
  results: Record<string, CalculationResult>;
  governingCase: string;
  controllingStrength: number;
  demand: number;
  isSafe: boolean;
};
