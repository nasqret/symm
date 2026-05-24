import type {
  CellDocument,
  FractionalPoint,
  LiftedVertex,
  PeriodicEdge,
  PeriodicFace,
  TileOffset,
} from "../types";
import {
  EPSILON,
  addPoint,
  fractionalToWorld,
  pointInPolygon,
  polygonCentroid,
  signedArea,
} from "./lattice";

interface LiftedGraph {
  nodes: Map<string, LiftedVertex>;
  adjacency: Map<string, Set<string>>;
}

export const FACE_BACKGROUND_COLOR = "#f5f1e8";

function nodeKey(vertexId: string, tile: TileOffset): string {
  return `${vertexId}@${tile.u},${tile.v}`;
}

function getOrCreateNode(
  graph: LiftedGraph,
  document: CellDocument,
  vertexId: string,
  tile: TileOffset,
): LiftedVertex {
  const key = nodeKey(vertexId, tile);
  const existing = graph.nodes.get(key);
  if (existing) {
    return existing;
  }
  const vertex = document.vertices.find((item) => item.id === vertexId);
  if (!vertex) {
    throw new Error(`Unknown vertex ${vertexId}`);
  }
  const node: LiftedVertex = {
    key,
    vertexId,
    tile,
    point: addPoint(vertex, tile),
  };
  graph.nodes.set(key, node);
  graph.adjacency.set(key, new Set());
  return node;
}

function connect(graph: LiftedGraph, from: LiftedVertex, to: LiftedVertex): void {
  if (from.key === to.key) {
    return;
  }
  graph.adjacency.get(from.key)?.add(to.key);
  graph.adjacency.get(to.key)?.add(from.key);
}

function liftGraph(document: CellDocument, range = 2): LiftedGraph {
  const graph: LiftedGraph = {
    nodes: new Map(),
    adjacency: new Map(),
  };
  for (const edge of document.edges) {
    for (let u = -range; u <= range; u += 1) {
      for (let v = -range; v <= range; v += 1) {
        const fromTile = { u, v };
        const toTile = { u: u + edge.shift.u, v: v + edge.shift.v };
        const from = getOrCreateNode(graph, document, edge.from, fromTile);
        const to = getOrCreateNode(graph, document, edge.to, toTile);
        connect(graph, from, to);
      }
    }
  }
  return graph;
}

function translatedCycleSignature(nodes: LiftedVertex[]): string {
  const variants = nodes.map((_, start) => {
    const rotated = [...nodes.slice(start), ...nodes.slice(0, start)];
    const base = rotated[0].tile;
    return rotated
      .map(
        (node) =>
          `${node.vertexId}:${node.tile.u - base.u},${node.tile.v - base.v}`,
      )
      .join("|");
  });
  return variants.sort()[0];
}

function traceCycles(document: CellDocument): LiftedVertex[][] {
  const graph = liftGraph(document);
  const visited = new Set<string>();
  const cycles: LiftedVertex[][] = [];
  const directedKey = (from: string, to: string) => `${from}>${to}`;

  for (const [fromKey, adjacent] of graph.adjacency.entries()) {
    for (const toKey of adjacent) {
      const initialKey = directedKey(fromKey, toKey);
      if (visited.has(initialKey)) {
        continue;
      }
      const cycle: LiftedVertex[] = [];
      let from = fromKey;
      let to = toKey;
      let steps = 0;
      while (steps < graph.nodes.size * 2) {
        const stepKey = directedKey(from, to);
        if (visited.has(stepKey)) {
          break;
        }
        visited.add(stepKey);
        const current = graph.nodes.get(from);
        const pivot = graph.nodes.get(to);
        if (!current || !pivot) {
          break;
        }
        cycle.push(current);
        const neighbors = [...(graph.adjacency.get(to) ?? [])].sort((left, right) => {
          const leftNode = graph.nodes.get(left);
          const rightNode = graph.nodes.get(right);
          if (!leftNode || !rightNode) {
            return 0;
          }
          const leftWorld = fractionalToWorld(
            {
              u: leftNode.point.u - pivot.point.u,
              v: leftNode.point.v - pivot.point.v,
            },
            document.lattice,
          );
          const rightWorld = fractionalToWorld(
            {
              u: rightNode.point.u - pivot.point.u,
              v: rightNode.point.v - pivot.point.v,
            },
            document.lattice,
          );
          return Math.atan2(leftWorld.v, leftWorld.u) - Math.atan2(rightWorld.v, rightWorld.u);
        });
        const incomingIndex = neighbors.indexOf(from);
        if (incomingIndex < 0 || neighbors.length < 2) {
          break;
        }
        const next = neighbors[(incomingIndex - 1 + neighbors.length) % neighbors.length];
        from = to;
        to = next;
        steps += 1;
        if (from === fromKey && to === toKey) {
          cycles.push(cycle);
          break;
        }
      }
    }
  }
  return cycles;
}

export function extractFaces(document: CellDocument): PeriodicFace[] {
  const candidates = traceCycles(document)
    .filter((cycle) => cycle.length >= 3)
    .map((cycle) => {
      const points = cycle.map((node) => node.point);
      return {
        signature: translatedCycleSignature(cycle),
        points,
        centroid: polygonCentroid(points),
        area: signedArea(points, document.lattice),
      };
    })
    .filter((face) => face.area > EPSILON)
    .filter(
      (face) =>
        face.centroid.u >= -EPSILON &&
        face.centroid.u < 1 - EPSILON &&
        face.centroid.v >= -EPSILON &&
        face.centroid.v < 1 - EPSILON,
    );

  return [...new Map(candidates.map((face) => [face.signature, face])).values()].sort(
    (left, right) =>
      left.centroid.v - right.centroid.v || left.centroid.u - right.centroid.u,
  );
}

export function findFaceAtPoint(
  faces: PeriodicFace[],
  point: FractionalPoint,
): PeriodicFace | undefined {
  for (const face of faces) {
    for (let u = -2; u <= 2; u += 1) {
      for (let v = -2; v <= 2; v += 1) {
        const translated = face.points.map((vertex) => ({
          u: vertex.u + u,
          v: vertex.v + v,
        }));
        if (pointInPolygon(point, translated)) {
          return face;
        }
      }
    }
  }
  return undefined;
}

export function faceColor(document: CellDocument, signature: string): string {
  return (
    document.faceColors.find((entry) => entry.signature === signature)?.color ??
    FACE_BACKGROUND_COLOR
  );
}

export function canonicalEdgeKey(edge: Omit<PeriodicEdge, "id">): string {
  const direct = `${edge.from}>${edge.to}@${edge.shift.u},${edge.shift.v}`;
  const reverse = `${edge.to}>${edge.from}@${-edge.shift.u},${-edge.shift.v}`;
  return direct < reverse ? direct : reverse;
}
