import type {
  CellDocument,
  FractionalPoint,
  LatticeType,
  PeriodicEdge,
  PeriodicFace,
  TileOffset,
} from "../types";
import { buildBlankDocument } from "../data/wallpaperGroups";
import { pointsEqual } from "../math/lattice";
import {
  canonicalEdgeKey,
  extractFaces,
  FACE_BACKGROUND_COLOR,
  findFaceAtPoint,
} from "../math/periodicGraph";
import { snapVertexToGrid } from "../math/vertexGrid";

function stamped(document: CellDocument): CellDocument {
  return {
    ...document,
    presetGroup: undefined,
    modifiedAt: new Date().toISOString(),
  };
}

function nextId(prefix: string, ids: string[]): string {
  let index = ids.length + 1;
  while (ids.includes(`${prefix}_${index}`)) {
    index += 1;
  }
  return `${prefix}_${index}`;
}

export function changeLattice(_document: CellDocument, latticeType: LatticeType): CellDocument {
  return buildBlankDocument(latticeType);
}

export function addVertex(document: CellDocument, point: FractionalPoint): CellDocument {
  const canonical = snapVertexToGrid(point, document.lattice.type);
  if (document.vertices.some((vertex) => pointsEqual(vertex, canonical))) {
    return document;
  }
  return stamped({
    ...document,
    vertices: [
      ...document.vertices,
      {
        id: nextId(
          "v",
          document.vertices.map((vertex) => vertex.id),
        ),
        ...canonical,
      },
    ],
  });
}

export function addEdge(
  document: CellDocument,
  from: { vertexId: string; tile: TileOffset },
  to: { vertexId: string; tile: TileOffset },
): CellDocument {
  const edge = {
    from: from.vertexId,
    to: to.vertexId,
    shift: { u: to.tile.u - from.tile.u, v: to.tile.v - from.tile.v },
  };
  const key = canonicalEdgeKey(edge);
  if (
    (from.vertexId === to.vertexId && edge.shift.u === 0 && edge.shift.v === 0) ||
    document.edges.some((entry) => canonicalEdgeKey(entry) === key)
  ) {
    return document;
  }
  return stamped({
    ...document,
    edges: [
      ...document.edges,
      {
        id: nextId(
          "e",
          document.edges.map((entry) => entry.id),
        ),
        ...edge,
      },
    ],
  });
}

function colorNewFacesAtMarkers(
  document: CellDocument,
  changed: CellDocument,
  markers: FractionalPoint[],
  color: string,
): CellDocument {
  const previousSignatures = new Set(extractFaces(document).map((face) => face.signature));
  const nextFaces = extractFaces(changed);
  const validSignatures = new Set(nextFaces.map((face) => face.signature));
  const newSignatures = new Set<string>();

  for (const marker of markers) {
    const face = findFaceAtPoint(nextFaces, marker);
    if (face && !previousSignatures.has(face.signature)) {
      newSignatures.add(face.signature);
    }
  }

  return stamped({
    ...changed,
    faceColors: [
      ...document.faceColors.filter(
        (entry) => validSignatures.has(entry.signature) && !newSignatures.has(entry.signature),
      ),
      ...(color === FACE_BACKGROUND_COLOR
        ? []
        : [...newSignatures].map((signature) => ({ signature, color }))),
    ],
  });
}

function edgeMidpoint(document: CellDocument, edge: PeriodicEdge): FractionalPoint[] {
  const from = document.vertices.find((vertex) => vertex.id === edge.from);
  const to = document.vertices.find((vertex) => vertex.id === edge.to);
  if (!from || !to) {
    return [];
  }
  return [
    {
      u: (from.u + to.u + edge.shift.u) / 2,
      v: (from.v + to.v + edge.shift.v) / 2,
    },
  ];
}

export function deleteEdge(
  document: CellDocument,
  edgeId: string,
  mergedFaceColor: string,
): CellDocument {
  const edge = document.edges.find((entry) => entry.id === edgeId);
  if (!edge) {
    return document;
  }
  return colorNewFacesAtMarkers(
    document,
    {
      ...document,
      edges: document.edges.filter((entry) => entry.id !== edgeId),
    },
    edgeMidpoint(document, edge),
    mergedFaceColor,
  );
}

export function deleteVertex(
  document: CellDocument,
  vertexId: string,
  mergedFaceColor: string,
): CellDocument {
  const vertex = document.vertices.find((entry) => entry.id === vertexId);
  if (!vertex) {
    return document;
  }
  return colorNewFacesAtMarkers(
    document,
    {
      ...document,
      vertices: document.vertices.filter((entry) => entry.id !== vertexId),
      edges: document.edges.filter((edge) => edge.from !== vertexId && edge.to !== vertexId),
    },
    [vertex],
    mergedFaceColor,
  );
}

export function colorFace(
  document: CellDocument,
  face: PeriodicFace,
  color: string,
): CellDocument {
  if (color === FACE_BACKGROUND_COLOR) {
    return clearFaceColor(document, face);
  }
  return stamped({
    ...document,
    faceColors: [
      ...document.faceColors.filter((entry) => entry.signature !== face.signature),
      { signature: face.signature, color },
    ],
  });
}

export function clearFaceColor(document: CellDocument, face: PeriodicFace): CellDocument {
  const faceColors = document.faceColors.filter((entry) => entry.signature !== face.signature);
  if (faceColors.length === document.faceColors.length) {
    return document;
  }
  return stamped({
    ...document,
    faceColors,
  });
}
