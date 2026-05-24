import type { FractionalPoint, LatticeType } from "../types";
import { normalizePoint } from "./lattice";

const GRID_DIVISIONS: Record<LatticeType, number> = {
  generic: 16,
  rectangular: 16,
  square: 16,
  hexagonal: 10,
};

export function vertexGridDivisions(latticeType: LatticeType): number {
  return GRID_DIVISIONS[latticeType];
}

export function vertexGridPoints(latticeType: LatticeType): FractionalPoint[] {
  const divisions = vertexGridDivisions(latticeType);
  const points: FractionalPoint[] = [];

  for (let u = 0; u <= divisions; u += 1) {
    for (let v = 0; v <= divisions; v += 1) {
      points.push({ u: u / divisions, v: v / divisions });
    }
  }

  return points;
}

export function snapVertexToGrid(
  point: FractionalPoint,
  latticeType: LatticeType,
): FractionalPoint {
  const divisions = vertexGridDivisions(latticeType);
  return normalizePoint({
    u: Math.round(point.u * divisions) / divisions,
    v: Math.round(point.v * divisions) / divisions,
  });
}
