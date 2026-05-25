import { useEffect, useMemo, useRef, useState } from "react";
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

interface CanvasViewport {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

interface PinchStart {
  distance: number;
  viewport: CanvasViewport;
  anchor: { x: number; y: number };
  ratio: { x: number; y: number };
}

interface ColorRollCandidate {
  face: PeriodicFace;
  pointerId: number;
  x: number;
  y: number;
}

interface ColorRollState {
  face: PeriodicFace;
  pointerId: number;
  anchor: { x: number; y: number };
  index: number;
  initialIndex: number;
  startX: number;
}

const DEFAULT_VIEWPORT: CanvasViewport = {
  x: 0,
  y: 0,
  width: WIDTH,
  height: HEIGHT,
  scale: 1,
};

function pointerDistance(points: { x: number; y: number }[]): number {
  return Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
}

function clampZoom(value: number): number {
  return Math.min(4, Math.max(1, value));
}

const COLOR_ROLL_HOLD_MS = 380;
const COLOR_ROLL_CANCEL_DISTANCE = 12;
const COLOR_ROLL_STEP_PX = 28;
const COLOR_ROLL_SLOT_WIDTH = 30;

interface UnitCellCanvasProps {
  document: CellDocument;
  tool?: EditorTool;
  edgeStart?: VertexHit | null;
  selectedEdgeId?: string | null;
  selectedSymmetryElements?: readonly SymmetryElement[];
  preview?: boolean;
  immersive?: boolean;
  enablePinchZoom?: boolean;
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
  colorRollColors?: readonly string[];
  selectedColor?: string;
  onRollColorFace?: (face: PeriodicFace, color: string) => void;
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
  selectedSymmetryElements = [],
  preview = false,
  immersive = false,
  enablePinchZoom = false,
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
  colorRollColors = [],
  selectedColor,
  onRollColorFace,
  onCycleColor,
  onSelectEdge,
  onDeleteEdge,
  onDeleteVertex,
}: UnitCellCanvasProps) {
  const swipeStart = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const suppressTouchClick = useRef(false);
  const touchPointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<PinchStart | null>(null);
  const pinchActive = useRef(false);
  const colorRollTimer = useRef<number | null>(null);
  const colorRollCandidate = useRef<ColorRollCandidate | null>(null);
  const colorRollActive = useRef<ColorRollState | null>(null);
  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT);
  const [colorRoll, setColorRoll] = useState<ColorRollState | null>(null);
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
  const activeViewport = enablePinchZoom ? viewport : DEFAULT_VIEWPORT;
  const paintSeamUnderlay = !showEdges;
  const colorRollEnabled =
    enablePinchZoom && tool === "color" && colorRollColors.length > 0 && Boolean(onRollColorFace);
  const clearColorRollTimer = () => {
    if (colorRollTimer.current !== null) {
      window.clearTimeout(colorRollTimer.current);
      colorRollTimer.current = null;
    }
  };
  const closeColorRoll = () => {
    clearColorRollTimer();
    colorRollCandidate.current = null;
    colorRollActive.current = null;
    setColorRoll(null);
  };
  const toViewportPoint = (svg: SVGSVGElement, clientX: number, clientY: number) => {
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return null;
    }
    return {
      point: {
        x: activeViewport.x + ((clientX - rect.left) / rect.width) * activeViewport.width,
        y: activeViewport.y + ((clientY - rect.top) / rect.height) * activeViewport.height,
      },
      rect,
    };
  };
  const beginColorRoll = (event: React.PointerEvent<SVGPathElement>, face: PeriodicFace) => {
    if (!colorRollEnabled || event.pointerType !== "touch") {
      return;
    }
    clearColorRollTimer();
    colorRollCandidate.current = {
      face,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) {
      return;
    }
    const pointerId = event.pointerId;
    colorRollTimer.current = window.setTimeout(() => {
      const candidate = colorRollCandidate.current;
      if (!candidate || candidate.pointerId !== pointerId || pinchActive.current) {
        return;
      }
      const positioned = toViewportPoint(svg, candidate.x, candidate.y);
      if (!positioned) {
        return;
      }
      const faceFill = faceColor(document, face.signature);
      const faceIndex = colorRollColors.indexOf(faceFill);
      const selectedIndex = selectedColor ? colorRollColors.indexOf(selectedColor) : -1;
      const initialIndex = faceIndex >= 0 ? faceIndex : Math.max(selectedIndex, 0);
      const inverseScale = 1 / activeViewport.scale;
      const rollerWidth = colorRollColors.length * COLOR_ROLL_SLOT_WIDTH + 20;
      const halfWidth = (rollerWidth / 2) * inverseScale;
      const above = candidate.y - positioned.rect.top > 72;
      const next: ColorRollState = {
        face,
        pointerId: candidate.pointerId,
        anchor: {
          x: Math.min(
            activeViewport.x + activeViewport.width - halfWidth,
            Math.max(activeViewport.x + halfWidth, positioned.point.x),
          ),
          y: positioned.point.y + (above ? -58 : 58) * inverseScale,
        },
        index: initialIndex,
        initialIndex,
        startX: candidate.x,
      };
      colorRollTimer.current = null;
      colorRollActive.current = next;
      setColorRoll(next);
      suppressTouchClick.current = true;
      swipeStart.current = null;
    }, COLOR_ROLL_HOLD_MS);
  };
  useEffect(() => {
    if (!colorRollEnabled) {
      clearColorRollTimer();
      colorRollCandidate.current = null;
      colorRollActive.current = null;
      setColorRoll(null);
    }
  }, [colorRollEnabled]);
  useEffect(
    () => () => {
      if (colorRollTimer.current !== null) {
        window.clearTimeout(colorRollTimer.current);
      }
    },
    [],
  );
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
  const beginPointerGesture = (event: React.PointerEvent<SVGSVGElement>) => {
    if (enablePinchZoom && event.pointerType === "touch") {
      event.currentTarget.setPointerCapture?.(event.pointerId);
      touchPointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (touchPointers.current.size >= 2) {
        closeColorRoll();
        const points = Array.from(touchPointers.current.values()).slice(0, 2);
        const rect = event.currentTarget.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const midpoint = {
            x: (points[0].x + points[1].x) / 2,
            y: (points[0].y + points[1].y) / 2,
          };
          const ratio = {
            x: (midpoint.x - rect.left) / rect.width,
            y: (midpoint.y - rect.top) / rect.height,
          };
          pinchStart.current = {
            distance: Math.max(pointerDistance(points), 1),
            viewport,
            ratio,
            anchor: {
              x: viewport.x + ratio.x * viewport.width,
              y: viewport.y + ratio.y * viewport.height,
            },
          };
          pinchActive.current = true;
          suppressTouchClick.current = true;
          swipeStart.current = null;
          event.preventDefault();
          event.stopPropagation();
          return;
        }
      }
    }
    beginColorSwipe(event);
  };
  const movePointerGesture = (event: React.PointerEvent<SVGSVGElement>) => {
    const activeRoll = colorRollActive.current;
    if (activeRoll && activeRoll.pointerId === event.pointerId) {
      const offset = Math.round((event.clientX - activeRoll.startX) / COLOR_ROLL_STEP_PX);
      const index = Math.min(
        colorRollColors.length - 1,
        Math.max(0, activeRoll.initialIndex + offset),
      );
      if (index !== activeRoll.index) {
        const next = { ...activeRoll, index };
        colorRollActive.current = next;
        setColorRoll(next);
      }
      suppressTouchClick.current = true;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const candidate = colorRollCandidate.current;
    if (candidate && candidate.pointerId === event.pointerId) {
      if (
        Math.hypot(event.clientX - candidate.x, event.clientY - candidate.y) >
        COLOR_ROLL_CANCEL_DISTANCE
      ) {
        clearColorRollTimer();
        colorRollCandidate.current = null;
      }
    }
    if (
      !enablePinchZoom ||
      event.pointerType !== "touch" ||
      !touchPointers.current.has(event.pointerId)
    ) {
      return;
    }
    touchPointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const start = pinchStart.current;
    if (!pinchActive.current || !start || touchPointers.current.size < 2) {
      return;
    }
    const points = Array.from(touchPointers.current.values()).slice(0, 2);
    const nextScale = clampZoom(start.viewport.scale * (pointerDistance(points) / start.distance));
    const width = WIDTH / nextScale;
    const height = HEIGHT / nextScale;
    setViewport({
      scale: nextScale,
      width,
      height,
      x: Math.min(WIDTH - width, Math.max(0, start.anchor.x - start.ratio.x * width)),
      y: Math.min(HEIGHT - height, Math.max(0, start.anchor.y - start.ratio.y * height)),
    });
    suppressTouchClick.current = true;
    event.preventDefault();
    event.stopPropagation();
  };
  const endPointerGesture = (event: React.PointerEvent<SVGSVGElement>) => {
    const activeRoll = colorRollActive.current;
    if (activeRoll && activeRoll.pointerId === event.pointerId) {
      const color = colorRollColors[activeRoll.index];
      closeColorRoll();
      touchPointers.current.delete(event.pointerId);
      suppressTouchClick.current = true;
      swipeStart.current = null;
      if (color) {
        onRollColorFace?.(activeRoll.face, color);
      }
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (colorRollCandidate.current?.pointerId === event.pointerId) {
      clearColorRollTimer();
      colorRollCandidate.current = null;
    }
    if (enablePinchZoom && event.pointerType === "touch") {
      const tracked = touchPointers.current.has(event.pointerId);
      if (tracked) {
        touchPointers.current.delete(event.pointerId);
      }
      if (pinchActive.current) {
        suppressTouchClick.current = true;
        swipeStart.current = null;
        if (touchPointers.current.size < 2) {
          pinchStart.current = null;
        }
        if (touchPointers.current.size === 0) {
          pinchActive.current = false;
        }
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }
    endColorSwipe(event);
  };
  const cancelPointerGesture = (event: React.PointerEvent<SVGSVGElement>) => {
    swipeStart.current = null;
    if (
      colorRollCandidate.current?.pointerId === event.pointerId ||
      colorRollActive.current?.pointerId === event.pointerId
    ) {
      closeColorRoll();
    }
    if (event.pointerType === "touch") {
      touchPointers.current.delete(event.pointerId);
      if (touchPointers.current.size < 2) {
        pinchStart.current = null;
      }
      if (touchPointers.current.size === 0) {
        pinchActive.current = false;
      }
    }
  };

  return (
    <svg
      className={`unit-canvas${preview ? " unit-canvas--preview" : ""}${
        immersive ? " unit-canvas--immersive" : ""
      }`}
      viewBox={`${activeViewport.x} ${activeViewport.y} ${activeViewport.width} ${activeViewport.height}`}
      data-zoom={enablePinchZoom ? viewport.scale.toFixed(2) : undefined}
      aria-label="Periodic unit-cell drawing canvas"
      onPointerDownCapture={beginPointerGesture}
      onPointerMoveCapture={movePointerGesture}
      onPointerUpCapture={endPointerGesture}
      onPointerCancelCapture={cancelPointerGesture}
      onContextMenu={(event) => {
        if (colorRollEnabled) {
          event.preventDefault();
        }
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
        showEdges &&
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
      {paintSeamUnderlay && (
        <g className="canvas-face-underlay" aria-hidden="true">
          {displayedTiles.flatMap((tile) =>
            faces.map((face) => (
              <path
                key={`face-underlay-${face.signature}-${tile.u}-${tile.v}`}
                className="periodic-face-underlay"
                d={facePath(face, tile, transform)}
                fill="none"
                fillRule="evenodd"
                stroke={faceColor(document, face.signature)}
              />
            )),
          )}
        </g>
      )}
      <g
        className={`canvas-faces${showEdges ? "" : " canvas-faces--edge-free"}`}
        shapeRendering={showEdges ? undefined : "crispEdges"}
      >
        {displayedTiles.flatMap((tile) =>
          faces.map((face) => {
            const central = tile.u === 0 && tile.v === 0;
            const transitioning = transitioningFaceSignatures?.has(face.signature) ?? false;
            const fill = faceColor(document, face.signature);
            const transitionStyle =
              transitioning && transitioningFromDocument
                ? ({
                    "--threshold-from-fill": faceColor(transitioningFromDocument, face.signature),
                    "--threshold-to-fill": fill,
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
                fill={fill}
                style={transitionStyle}
                onPointerDown={(event) => {
                  if (tool === "color" && event.pointerType !== "touch") {
                    event.stopPropagation();
                    onColorFace?.(face);
                  } else if (tool === "color" && event.pointerType === "touch") {
                    beginColorRoll(event, face);
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
      {!preview &&
        selectedSymmetryElements.map((element) => (
          <SymmetryOverlay
            key={`symmetry-overlay-${element.id}`}
            element={element}
            toDisplay={(point) => toDisplay(point, transform)}
          />
        ))}
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
      {colorRoll && (
        <g
          className="color-roller"
          aria-hidden="true"
          transform={`translate(${colorRoll.anchor.x} ${colorRoll.anchor.y}) scale(${
            1 / activeViewport.scale
          })`}
        >
          <rect
            className="color-roller-track"
            x={-(colorRollColors.length * COLOR_ROLL_SLOT_WIDTH + 20) / 2}
            y={-26}
            width={colorRollColors.length * COLOR_ROLL_SLOT_WIDTH + 20}
            height={52}
            rx={26}
          />
          {colorRollColors.map((color, index) => {
            const x = (index - (colorRollColors.length - 1) / 2) * COLOR_ROLL_SLOT_WIDTH;
            return (
              <g key={`color-roll-${color}`} transform={`translate(${x} 0)`}>
                {index === colorRoll.index ? (
                  <circle className="color-roller-selection" r={15} />
                ) : null}
                <circle className="color-roller-swatch" r={10.5} fill={color} />
              </g>
            );
          })}
        </g>
      )}
      </g>
    </svg>
  );
}
