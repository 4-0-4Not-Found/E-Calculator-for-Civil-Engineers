export type AiscShapeType = "W" | "HSS" | "C" | "L" | "OTHER";

export type AiscShape = {
  shape: string;
  type: AiscShapeType;
  A: number;
  d: number;
  bf: number;
  tf: number;
  tw: number;
  Ix: number;
  Iy: number;
  Zx: number;
  Zy: number;
  rx: number;
  ry: number;
  bf_2tf: number;
  h_tw: number;
};
