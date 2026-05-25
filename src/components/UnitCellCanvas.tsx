import { useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import type {
  CellDocument,
  EditorTool,
  FractionalPoint,
  Lattice,
  PeriodicFace,
  SymmetryElement,
  TileOffset,
} from "../types";
import { addPoint } from "../math/lattice";
import { extractFaces, faceColor } from "../math/periodicGraph";
import { vertexGridPoints } from "../math/vertexGrid";
import { SymmetryOverlay } from "./SymmetryOverlay";

const WIDTH = 900;
const HEIGHT = 690;

interface VertexHit {
  vertexId: string;
  tile: TileOffset;
}

interface ContentTransformAnimation {
  from: string;
  to: string;
  durationMs: number;
}

type ColorCycleDirection = -1 | 1;

interface UnitCellCanvasProps {
  document: CellDocument;
  tool?: EditorTool;
  edgeStart?: VertexHit | null;
  selectedEdgeId?: string | null;
  selectedSymmetryElement?: SymmetryElement | null;
  preview?: boolean;
  immersive?: boolean;
  showEdges?: boolean;
  showVertices?: boolean;
  latticeOverride?: Lattice;
  displayScaleOverride?: number;
  previewTileRange?: number;
  contentTransformAnimation?: ContentTransformAnimation;
  transitioningFaceSignatures?: ReadonlySet<string>;
  transitioningFromDocument?: CellDocument;
  onAddVertex?: (point: FractionalPoint) => void;
  onVertexHit?: (hit: VertexHit) => void;
  onColorFace?: (face: PeriodicFace) => void;
  onCycleColor?: (direction: ColorCycleDirection) => void;
  onSelectEdge?: (edgeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
  onDeleteVertex?: (vertexId: string) => void;
}

export function displayTransform(lattice: Lattice, displayScaleOverride?: number): {
  origin: { x: number; y: number };
  a: { x: number; y: number };
  b: { x: number; y: number };
} {
  const scale = displayScaleOverride ?? (lattice.type === "rectangular" ? 192 : 205);
  const radians = (lattice.angle * Math.PI) / 180;
  const a = { x: scale * lattice.a, y: 0 };
  const b = {
    x: scale * lattice.b * Math.cos(radians),
    y: scale * lattice.b * Math.sin(radians),
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

function polygonPath(
  points: FractionalPoint[],
  tile: TileOffset,
  transform: ReturnType<typeof displayTransform>,
): string {
  return points
    .map((point, index) => {
      const positioned = toDisplay(addPoint(point, tile), transform);
      return `${index === 0 ? "M" : "L"} ${positioned.x} ${positioned.y}`;
    })
    .join(" ")
    .concat(" Z");
}

function facePath(
  face: PeriodicFace,
  tile: TileOffset,
  transform: ReturnType<typeof displayTransform>,
): string {
  return [face.points, ...face.holes]
    .map((points) => polygonPath(points, tile, transform))
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
  selectedSymmetryElement,
  preview = false,
  immersive = false,
  showEdges = true,
  showVertices = true,
  latticeOverride,
  displayScaleOverride,
  previewTileRange,
  contentTransformAnimation,
  transitioningFaceSignatures,
  transitioningFromDocument,
  onAddVertex,
  onVertexHit,
  onColorFace,
  onCycleColor,
  onSelectEdge,
  onDeleteEdge,
  onDeleteVertex,
}: UnitCellCanvasProps) {
  const swipeStart = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const suppressTouchClick = useRef(false);
  const faces = useMemo(() => extractFaces(document), [document]);
  const displayLattice = latticeOverride ?? document.lattice;
  const transform = useMemo(
    () => displayTransform(displayLattice, displayScaleOverride),
    [displayLattice, displayScaleOverride],
  );
  const gridPoints = useMemo(
    () => vertexGridPoints(document.lattice.type),
    [document.lattice.type],
  );
  const displayedTiles = tiles(preview ? (previewTileRange ?? 4) : 2);
  const edgeTiles = tiles(preview ? (previewTileRange ?? 4) : 1);
  const beginColorSwipe = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.pointerType !== "touch" || tool !== "color" || !onCycleColor) {
      return;
    }
    suppressTouchClick.current = false;
    swipeStart.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  };
  const endColorSwipe = (event: React.PointerEvent<SVGSVGElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || start.pointerId !== event.pointerId) {
      return;
    }
    const horizontalDistance = event.clientX - start.x;
    const verticalDistance = event.clientY - start.y;
    if (
      Math.abs(verticalDistance) < 42 ||
      Math.abs(verticalDistance) <= Math.abs(horizontalDistance) * 1.15
    ) {
      return;
    }
    suppressTouchClick.current = true;
    event.preventDefault();
    event.stopPropagation();
    onCycleColor?.(verticalDistance < 0 ? 1 : -1);
  };

  return (
    <svg
      className={`unit-canvas${preview ? " unit-canvas--preview" : ""}${
        immersive ? " unit-canvas--immersive" : ""
      }`}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      aria-label="Periodic unit-cell drawing canvas"
      onPointerDownCapture={beginColorSwipe}
      onPointerUpCapture={endColorSwipe}
      onPointerCancel={() => {
        swipeStart.current = null;
      }}
      onClickCapture={(event) => {
        if (suppressTouchClick.current) {
          suppressTouchClick.current = false;
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <defs>
        <marker id="symmetry-arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 Z" />
        </marker>
      </defs>
      <rect className="canvas-paper" width={WIDTH} height={HEIGHT} />
      <g className="canvas-content">
        {contentTransformAnimation && (
          <animateTransform
            attributeName="transform"
            type="matrix"
            from={contentTransformAnimation.from}
            to={contentTransformAnimation.to}
            dur={`${contentTransformAnimation.durationMs}ms`}
            calcMode="spline"
            keyTimes="0;1"
            keySplines="0.45 0 0.55 1"
            fill="freeze"
          />
        )}
      {!preview &&
        displayedTiles.map((tile) => {
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
            const transitioning = transitioningFaceSignatures?.has(face.signature) ?? false;
            const transitionStyle =
              transitioning && transitioningFromDocument
                ? ({
                    "--threshold-from-fill": faceColor(transitioningFromDocument, face.signature),
                    "--threshold-to-fill": faceColor(document, face.signature),
                  } as CSSProperties)
                : undefined;
            return (
              <path
                key={`face-${face.signature}-${tile.u}-${tile.v}`}
                className={`periodic-face${
                  preview ? " periodic-face--preview" : central ? " periodic-face--active" : ""
                }${
                  tool === "color" ? " periodic-face--paintable" : ""
                }${immersive ? " periodic-face--immersive" : ""}${
                  transitioning ? " periodic-face--transitioning" : ""
                }`}
                d={facePath(face, tile, transform)}
                fillRule="evenodd"
                fill={faceColor(document, face.signature)}
                style={transitionStyle}
                onPointerDown={(event) => {
                  if (tool === "color" && event.pointerType !== "touch") {
                    event.stopPropagation();
                    onColorFace?.(face);
                  }
                }}
                onPointerUp={(event) => {
                  if (tool === "color" && event.pointerType === "touch") {
                    event.stopPropagation();
                    onColorFace?.(face);
                  }
                }}
              />
            );
          }),
        )}
      </g>
      {!preview && (
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
      )}
      {showEdges && (
        <g className="canvas-edges">
          {edgeTiles.flatMap((tile) =>
            document.edges.map((edge) => {
              const from = document.vertices.find((vertex) => vertex.id === edge.from);
              const to = document.vertices.find((vertex) => vertex.id === edge.to);
              if (!from || !to) {
                return null;
              }
              const start = toDisplay(addPoint(from, tile), transform);
              const end = toDisplay(addPoint(addPoint(to, edge.shift), tile), transform);
              return (
                <line
                  key={`${edge.id}-${tile.u}-${tile.v}`}
                  className={`motif-edge${
                    preview
                      ? " motif-edge--preview"
                      : tile.u === 0 && tile.v === 0
                        ? " motif-edge--active"
                        : ""
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
                  onDoubleClick={(event) => {
                    if (tool === "select") {
                      event.stopPropagation();
                      onDeleteEdge?.(edge.id);
                    }
                  }}
                />
              );
            }),
          )}
        </g>
      )}
      {!preview && showVertices && tool === "vertex" && (
        <g className="canvas-vertex-grid" aria-label="Permitted vertex grid">
          {gridPoints.map((point) => {
            const positioned = toDisplay(point, transform);
            return (
              <circle
                key={`grid-${point.u}-${point.v}`}
                className="vertex-grid-point"
                cx={positioned.x}
                cy={positioned.y}
                r={2.7}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  onAddVertex?.(point);
                }}
              />
            );
          })}
        </g>
      )}
      {showVertices && (
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
                  className={`motif-vertex${preview ? " motif-vertex--preview" : ""}${
                    starting ? " motif-vertex--start" : ""
                  }`}
                  cx={positioned.x}
                  cy={positioned.y}
                  r={starting ? 7 : 5}
                  onPointerDown={(event) => {
                    if (tool === "edge") {
                      event.stopPropagation();
                      onVertexHit?.({ vertexId: vertex.id, tile });
                    }
                  }}
                  onDoubleClick={(event) => {
                    if (tool === "select" || tool === "vertex") {
                      event.stopPropagation();
                      onDeleteVertex?.(vertex.id);
                    }
                  }}
                />
              );
            }),
          )}
        </g>
      )}
      {!preview && selectedSymmetryElement && (
        <SymmetryOverlay
          element={selectedSymmetryElement}
          toDisplay={(point) => toDisplay(point, transform)}
        />
      )}
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
      </g>
    </svg>
  );
}
