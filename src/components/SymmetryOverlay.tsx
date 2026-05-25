import type { AffineOperation, FractionalPoint, SymmetryElement } from "../types";
import {
  EPSILON,
  applyOperation,
  determinant,
  normalizePoint,
  pointsEqual,
} from "../math/lattice";

interface DisplayPoint {
  x: number;
  y: number;
}

interface Segment {
  from: FractionalPoint;
  to: FractionalPoint;
}

interface SymmetryOverlayProps {
  element: SymmetryElement;
  toDisplay: (point: FractionalPoint) => DisplayPoint;
}

function segmentKey(segment: Segment): string {
  const endpoints = [segment.from, segment.to]
    .map((point) => `${point.u.toFixed(5)},${point.v.toFixed(5)}`)
    .sort();
  return endpoints.join("|");
}

function clippedLine(a: number, b: number, c: number): Segment | undefined {
  const points: FractionalPoint[] = [];
  const addIfInCell = (point: FractionalPoint) => {
    if (
      point.u >= -EPSILON &&
      point.u <= 1 + EPSILON &&
      point.v >= -EPSILON &&
      point.v <= 1 + EPSILON &&
      !points.some(
        (entry) => Math.abs(entry.u - point.u) < EPSILON && Math.abs(entry.v - point.v) < EPSILON,
      )
    ) {
      points.push(point);
    }
  };
  if (Math.abs(b) > EPSILON) {
    addIfInCell({ u: 0, v: c / b });
    addIfInCell({ u: 1, v: (c - a) / b });
  }
  if (Math.abs(a) > EPSILON) {
    addIfInCell({ u: c / a, v: 0 });
    addIfInCell({ u: (c - b) / a, v: 1 });
  }
  return points.length >= 2 ? { from: points[0], to: points[1] } : undefined;
}

function mirrorSegments(operation: AffineOperation): Segment[] {
  const rows = [
    { a: 1 - operation.matrix.a, b: -operation.matrix.b, shift: operation.shift.u },
    { a: -operation.matrix.c, b: 1 - operation.matrix.d, shift: operation.shift.v },
  ];
  const segments = new Map<string, Segment>();
  for (let u = -2; u <= 2; u += 1) {
    for (let v = -2; v <= 2; v += 1) {
      const integers = [u, v];
      const row =
        rows.find((entry) => Math.abs(entry.a) > EPSILON || Math.abs(entry.b) > EPSILON) ??
        rows[0];
      const index = row === rows[0] ? 0 : 1;
      const segment = clippedLine(row.a, row.b, row.shift - integers[index]);
      if (!segment) {
        continue;
      }
      const midpoint = {
        u: (segment.from.u + segment.to.u) / 2,
        v: (segment.from.v + segment.to.v) / 2,
      };
      if (pointsEqual(applyOperation(operation, midpoint), midpoint)) {
        segments.set(segmentKey(segment), segment);
      }
    }
  }
  return [...segments.values()];
}

function fixedRotationPoints(operation: AffineOperation): FractionalPoint[] {
  const a = 1 - operation.matrix.a;
  const b = -operation.matrix.b;
  const c = -operation.matrix.c;
  const d = 1 - operation.matrix.d;
  const det = a * d - b * c;
  if (Math.abs(det) < EPSILON) {
    return [];
  }
  const points: FractionalPoint[] = [];
  for (let u = -2; u <= 2; u += 1) {
    for (let v = -2; v <= 2; v += 1) {
      const rhsU = operation.shift.u - u;
      const rhsV = operation.shift.v - v;
      const point = normalizePoint({
        u: (rhsU * d - b * rhsV) / det,
        v: (a * rhsV - rhsU * c) / det,
      });
      if (
        pointsEqual(applyOperation(operation, point), point) &&
        !points.some((entry) => pointsEqual(entry, point))
      ) {
        points.push(point);
      }
    }
  }
  return points;
}

function glideAxes(operation: AffineOperation): Array<Segment & { vector: FractionalPoint }> {
  const { matrix } = operation;
  if (matrix.a === 1 && matrix.b === 0 && matrix.c === 0 && matrix.d === -1) {
    return [0, 0.5].map((v) => ({
      from: { u: 0, v },
      to: { u: 1, v },
      vector: { u: 0.22, v: 0 },
    }));
  }
  if (matrix.a === -1 && matrix.b === 0 && matrix.c === 0 && matrix.d === 1) {
    return [0, 0.5].map((u) => ({
      from: { u, v: 0 },
      to: { u, v: 1 },
      vector: { u: 0, v: 0.22 },
    }));
  }
  return [];
}

function arcPath(center: DisplayPoint): string {
  const radius = 19;
  return `M ${center.x + radius} ${center.y} A ${radius} ${radius} 0 1 1 ${
    center.x - 3
  } ${center.y - radius + 1}`;
}

function TranslationOverlay({
  element,
  toDisplay,
}: SymmetryOverlayProps) {
  const vector = element.vector ?? element.operation?.shift ?? { u: 0, v: 0 };
  const fromPoint = element.kind === "centering" ? { u: 0.17, v: 0.18 } : { u: 0.16, v: 0.15 };
  const scale = element.kind === "centering" ? 1 : 0.7;
  const toPoint = {
    u: fromPoint.u + vector.u * scale,
    v: fromPoint.v + vector.v * scale,
  };
  const from = toDisplay(fromPoint);
  const to = toDisplay(toPoint);
  return (
    <>
      <line className="symmetry-translation" x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
      <text className="symmetry-label" x={to.x + 7} y={to.y - 7}>
        {element.label}
      </text>
    </>
  );
}

export function SymmetryOverlay({ element, toDisplay }: SymmetryOverlayProps) {
  if (element.kind === "translation" || element.kind === "centering") {
    return (
      <g className="symmetry-overlay" aria-label={`Visible symmetry ${element.label}`}>
        <TranslationOverlay element={element} toDisplay={toDisplay} />
      </g>
    );
  }
  if (!element.operation) {
    return null;
  }
  if (element.kind === "rotation" && determinant(element.operation.matrix) > 0) {
    return (
      <g className="symmetry-overlay" aria-label={`Visible symmetry ${element.label}`}>
        {fixedRotationPoints(element.operation).map((point) => {
          const center = toDisplay(point);
          return (
            <g key={`${point.u}-${point.v}`}>
              <circle className="symmetry-center" cx={center.x} cy={center.y} r={4} />
              <path className="symmetry-rotation" d={arcPath(center)} />
            </g>
          );
        })}
      </g>
    );
  }
  if (element.kind === "mirror") {
    return (
      <g className="symmetry-overlay" aria-label={`Visible symmetry ${element.label}`}>
        {mirrorSegments(element.operation).map((segment) => {
          const from = toDisplay(segment.from);
          const to = toDisplay(segment.to);
          return (
            <line
              key={segmentKey(segment)}
              className="symmetry-mirror"
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
            />
          );
        })}
      </g>
    );
  }
  return (
    <g className="symmetry-overlay" aria-label={`Visible symmetry ${element.label}`}>
      {glideAxes(element.operation).map((axis) => {
        const from = toDisplay(axis.from);
        const to = toDisplay(axis.to);
        const arrowStartPoint = {
          u: axis.from.u + (axis.to.u - axis.from.u) * 0.34,
          v: axis.from.v + (axis.to.v - axis.from.v) * 0.34,
        };
        const arrowStart = toDisplay(arrowStartPoint);
        const arrowEnd = toDisplay({
          u: arrowStartPoint.u + axis.vector.u,
          v: arrowStartPoint.v + axis.vector.v,
        });
        return (
          <g key={segmentKey(axis)}>
            <line className="symmetry-glide" x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
            <line
              className="symmetry-glide-arrow"
              x1={arrowStart.x}
              y1={arrowStart.y}
              x2={arrowEnd.x}
              y2={arrowEnd.y}
            />
          </g>
        );
      })}
    </g>
  );
}
