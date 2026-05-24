import { useMemo, useRef } from "react";
import type {
  CellDocument,
  EditorTool,
  FractionalPoint,
  PeriodicFace,
  TileOffset,
} from "../types";
import { addPoint } from "../math/lattice";
import { extractFaces, faceColor } from "../math/periodicGraph";

const WIDTH = 900;
const HEIGHT = 690;

interface VertexHit {
  vertexId: string;
  tile: TileOffset;
}

interface UnitCellCanvasProps {
  document: CellDocument;
  tool?: EditorTool;
  edgeStart?: VertexHit | null;
  selectedEdgeId?: string | null;
  preview?: boolean;
  onAddVertex?: (point: FractionalPoint) => void;
  onVertexHit?: (hit: VertexHit) => void;
  onColorFace?: (face: PeriodicFace) => void;
  onSelectEdge?: (edgeId: string) => void;
  onCoordinate?: (point: FractionalPoint | null) => void;
}

function displayTransform(document: CellDocument): {
  origin: { x: number; y: number };
  a: { x: number; y: number };
  b: { x: number; y: number };
} {
  const scale = document.lattice.type === "rectangular" ? 192 : 205;
  const radians = (document.lattice.angle * Math.PI) / 180;
  const a = { x: scale * document.lattice.a, y: 0 };
  const b = {
    x: scale * document.lattice.b * Math.cos(radians),
    y: scale * document.lattice.b * Math.sin(radians),
  };
  return {
    origin: {
      x: WIDTH / 2 - (a.x + b.x) / 2,
      y: HEIGHT / 2 - (a.y + b.y) / 2,
    },
    a,
    b,
  };
}

function toDisplay(
  point: FractionalPoint,
  transform: ReturnType<typeof displayTransform>,
): { x: number; y: number } {
  return {
    x: transform.origin.x + transform.a.x * point.u + transform.b.x * point.v,
    y: transform.origin.y + transform.a.y * point.u + transform.b.y * point.v,
  };
}

function fromDisplay(
  point: { x: number; y: number },
  transform: ReturnType<typeof displayTransform>,
): FractionalPoint {
  const x = point.x - transform.origin.x;
  const y = point.y - transform.origin.y;
  const det = transform.a.x * transform.b.y - transform.a.y * transform.b.x;
  return {
    u: (x * transform.b.y - y * transform.b.x) / det,
    v: (transform.a.x * y - transform.a.y * x) / det,
  };
}

function polygonPoints(
  points: FractionalPoint[],
  tile: TileOffset,
  transform: ReturnType<typeof displayTransform>,
): string {
  return points
    .map((point) => {
      const positioned = toDisplay(addPoint(point, tile), transform);
      return `${positioned.x},${positioned.y}`;
    })
    .join(" ");
}

function tiles(range: number): TileOffset[] {
  const values: TileOffset[] = [];
  for (let u = -range; u <= range; u += 1) {
    for (let v = -range; v <= range; v += 1) {
      values.push({ u, v });
    }
  }
  return values;
}

export function UnitCellCanvas({
  document,
  tool = "select",
  edgeStart,
  selectedEdgeId,
  preview = false,
  onAddVertex,
  onVertexHit,
  onColorFace,
  onSelectEdge,
  onCoordinate,
}: UnitCellCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const faces = useMemo(() => extractFaces(document), [document]);
  const transform = useMemo(() => displayTransform(document), [document]);
  const displayedTiles = tiles(preview ? 2 : 2);
  const edgeTiles = tiles(preview ? 2 : 1);

  const eventPoint = (event: React.PointerEvent<SVGSVGElement>): FractionalPoint => {
    const bounds = svgRef.current?.getBoundingClientRect();
    if (!bounds) {
      return { u: 0, v: 0 };
    }
    const display = {
      x: ((event.clientX - bounds.left) / bounds.width) * WIDTH,
      y: ((event.clientY - bounds.top) / bounds.height) * HEIGHT,
    };
    return fromDisplay(display, transform);
  };

  return (
    <svg
      ref={svgRef}
      className={`unit-canvas${preview ? " unit-canvas--preview" : ""}`}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      aria-label="Periodic unit-cell drawing canvas"
      onPointerMove={(event) => onCoordinate?.(eventPoint(event))}
      onPointerLeave={() => onCoordinate?.(null)}
      onPointerDown={(event) => {
        if (tool === "vertex") {
          onAddVertex?.(eventPoint(event));
        }
      }}
    >
      <rect className="canvas-paper" width={WIDTH} height={HEIGHT} />
      {displayedTiles.map((tile) => {
        const cell = [
          { u: tile.u, v: tile.v },
          { u: tile.u + 1, v: tile.v },
          { u: tile.u + 1, v: tile.v + 1 },
          { u: tile.u, v: tile.v + 1 },
        ];
        const central = tile.u === 0 && tile.v === 0;
        return (
          <polygon
            key={`cell-${tile.u}-${tile.v}`}
            className={central ? "cell-boundary cell-boundary--active" : "cell-boundary"}
            points={polygonPoints(cell, { u: 0, v: 0 }, transform)}
          />
        );
      })}
      <g className="canvas-faces">
        {displayedTiles.flatMap((tile) =>
          faces.map((face) => {
            const central = tile.u === 0 && tile.v === 0;
            return (
              <polygon
                key={`face-${face.signature}-${tile.u}-${tile.v}`}
                className={`periodic-face${central ? " periodic-face--active" : ""}${
                  tool === "color" ? " periodic-face--paintable" : ""
                }`}
                points={polygonPoints(face.points, tile, transform)}
                fill={faceColor(document, face.signature)}
                onPointerDown={(event) => {
                  if (tool === "color") {
                    event.stopPropagation();
                    onColorFace?.(face);
                  }
                }}
              />
            );
          }),
        )}
      </g>
      <polygon
        className="cell-outline-overlay"
        points={polygonPoints(
          [
            { u: 0, v: 0 },
            { u: 1, v: 0 },
            { u: 1, v: 1 },
            { u: 0, v: 1 },
          ],
          { u: 0, v: 0 },
          transform,
        )}
      />
      <g className="canvas-edges">
        {edgeTiles.flatMap((tile) =>
          document.edges.map((edge) => {
            const from = document.vertices.find((vertex) => vertex.id === edge.from);
            const to = document.vertices.find((vertex) => vertex.id === edge.to);
            if (!from || !to) {
              return null;
            }
            const start = toDisplay(addPoint(from, tile), transform);
            const end = toDisplay(
              addPoint(addPoint(to, edge.shift), tile),
              transform,
            );
            return (
              <line
                key={`${edge.id}-${tile.u}-${tile.v}`}
                className={`motif-edge${
                  tile.u === 0 && tile.v === 0 ? " motif-edge--active" : ""
                }${edge.id === selectedEdgeId ? " motif-edge--selected" : ""}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                onPointerDown={(event) => {
                  if (tool === "select" && tile.u === 0 && tile.v === 0) {
                    event.stopPropagation();
                    onSelectEdge?.(edge.id);
                  }
                }}
              />
            );
          }),
        )}
      </g>
      <g className="canvas-vertices">
        {edgeTiles.flatMap((tile) =>
          document.vertices.map((vertex) => {
            const positioned = toDisplay(addPoint(vertex, tile), transform);
            const starting =
              edgeStart?.vertexId === vertex.id &&
              edgeStart.tile.u === tile.u &&
              edgeStart.tile.v === tile.v;
            return (
              <circle
                key={`${vertex.id}-${tile.u}-${tile.v}`}
                className={`motif-vertex${starting ? " motif-vertex--start" : ""}`}
                cx={positioned.x}
                cy={positioned.y}
                r={starting ? 7 : 5}
                onPointerDown={(event) => {
                  if (tool === "edge") {
                    event.stopPropagation();
                    onVertexHit?.({ vertexId: vertex.id, tile });
                  }
                }}
              />
            );
          }),
        )}
      </g>
      {!preview && (
        <g className="axis-labels">
          <text
            x={toDisplay({ u: 1.08, v: 0 }, transform).x}
            y={toDisplay({ u: 1.08, v: 0 }, transform).y}
          >
            a
          </text>
          <text
            x={toDisplay({ u: 0, v: 1.1 }, transform).x}
            y={toDisplay({ u: 0, v: 1.1 }, transform).y}
          >
            b
          </text>
        </g>
      )}
    </svg>
  );
}
