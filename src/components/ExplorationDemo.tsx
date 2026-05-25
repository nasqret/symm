import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { LatticeType } from "../types";
import { LATTICES } from "../math/lattice";
import { extractFaces, faceColor } from "../math/periodicGraph";
import { lookupGroup } from "../data/wallpaperGroups";
import {
  buildImmersiveStage,
  EXPLORER_FAMILIES,
  EXPLORER_GRAPH_EDGES,
  EXPLORER_GRAPH_NODES,
  FEATURED_WALK,
  primaryFamilyForSymbol,
  supportsFamilySymbol,
  type ExplorerFamily,
} from "../data/subgroupExplorer";
import { useDisplaySettings } from "../state/useDisplaySettings";
import { displayTransform, UnitCellCanvas } from "./UnitCellCanvas";

type Speed = "slow" | "medium" | "fast";

interface ExplorerSelection {
  symbol: string;
  family: LatticeType;
}

interface LatticeBridge {
  fromFamily: LatticeType;
  toFamily: LatticeType;
  targetSymbol: string;
  settleWalkIndex?: number;
}

interface BridgeRequest {
  toFamily: LatticeType;
  targetSymbol: string;
  settleWalkIndex?: number;
}

interface PendingAscent extends ExplorerSelection {
  settleWalkIndex?: number;
}

interface ColorTransition {
  from: ExplorerSelection;
  to: ExplorerSelection;
  settleWalkIndex?: number;
}

const SPEEDS: Record<Speed, { hold: number; fade: number; label: string }> = {
  slow: { hold: 5800, fade: 2200, label: "Slow" },
  medium: { hold: 4000, fade: 1500, label: "Medium" },
  fast: { hold: 2500, fade: 900, label: "Fast" },
};

const INITIAL_SELECTION: ExplorerSelection = FEATURED_WALK[0];
const GRAPH_POSITIONS = new Map(
  EXPLORER_GRAPH_NODES.map((node) => [node.symbol, { x: node.x, y: node.y }]),
);
const GRAPH_LABELS = new Map(EXPLORER_GRAPH_NODES.map((node) => [node.symbol, node.label]));

function graphLabel(symbol: string): string {
  return GRAPH_LABELS.get(symbol) ?? symbol;
}

function edgeKey(left: string, right: string): string {
  return [left, right].sort().join(":");
}

const WALK_EDGES = new Set(
  FEATURED_WALK.slice(1)
    .map((step, index) => [FEATURED_WALK[index].symbol, step.symbol] as const)
    .filter(([from, to]) => from !== to)
    .map(([from, to]) => edgeKey(from, to)),
);

function familyFor(id: LatticeType): ExplorerFamily {
  return EXPLORER_FAMILIES.find((family) => family.id === id) ?? EXPLORER_FAMILIES[0];
}

function displayScaleFor(family: LatticeType): number {
  return family === "rectangular" ? 192 : 205;
}

function latticeTransform(fromFamily: LatticeType, toFamily: LatticeType): string {
  const from = displayTransform(LATTICES[fromFamily], displayScaleFor(fromFamily));
  const to = displayTransform(LATTICES[toFamily], displayScaleFor(toFamily));
  const det = from.a.x * from.b.y - from.a.y * from.b.x;
  const a = (to.a.x * from.b.y - to.b.x * from.a.y) / det;
  const b = (to.a.y * from.b.y - to.b.y * from.a.y) / det;
  const c = (-to.a.x * from.b.x + to.b.x * from.a.x) / det;
  const d = (-to.a.y * from.b.x + to.b.y * from.a.x) / det;
  const e = to.origin.x - a * from.origin.x - c * from.origin.y;
  const f = to.origin.y - b * from.origin.x - d * from.origin.y;
  return [a, b, c, d, e, f].map((value) => value.toFixed(6)).join(" ");
}

function changedFaceSignatures(from: ReturnType<typeof buildImmersiveStage>, to: ReturnType<typeof buildImmersiveStage>) {
  return new Set(
    extractFaces(from.document)
      .filter(
        (face) =>
          faceColor(from.document, face.signature) !== faceColor(to.document, face.signature),
      )
      .map((face) => face.signature),
  );
}

interface SubgroupGraphProps {
  selection: ExplorerSelection;
  bridge: LatticeBridge | null;
  walkIndex: number | null;
  onSelectSymbol: (symbol: string) => void;
}

function SubgroupGraph({ selection, bridge, walkIndex, onSelectSymbol }: SubgroupGraphProps) {
  const currentSymbol = bridge ? "p1" : selection.symbol;
  const connectedSymbols = new Set(
    EXPLORER_GRAPH_EDGES.flatMap((edge) =>
      edge.from === currentSymbol ? [edge.to] : edge.to === currentSymbol ? [edge.from] : [],
    ),
  );
  const traversedEdges = new Set(
    walkIndex === null
      ? []
      : FEATURED_WALK.slice(1, walkIndex + 1)
          .map((step, index) => [FEATURED_WALK[index].symbol, step.symbol] as const)
          .filter(([from, to]) => from !== to)
          .map(([from, to]) => edgeKey(from, to)),
  );
  const activeStep = walkIndex === null ? null : FEATURED_WALK[walkIndex];

  return (
    <aside className="subgroup-graph" aria-label="Wallpaper subgroup hierarchy">
      <header className="subgroup-graph-heading">
        <div>
          <p>Plane-group hierarchy</p>
          <h2>{graphLabel(currentSymbol)}</h2>
        </div>
        <strong>{walkIndex === null ? "free exploration" : `walk ${walkIndex + 1}/${FEATURED_WALK.length}`}</strong>
      </header>
      <p className="subgroup-route">
        {bridge
          ? "p1 lattice homotopy in progress"
          : activeStep?.chapter ?? `${familyFor(selection.family).title} / free selection`}
      </p>
      <div className="subgroup-map">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          {EXPLORER_GRAPH_EDGES.map((edge) => {
            const from = GRAPH_POSITIONS.get(edge.from);
            const to = GRAPH_POSITIONS.get(edge.to);
            if (!from || !to) {
              return null;
            }
            const key = edgeKey(edge.from, edge.to);
            const onWalk = WALK_EDGES.has(key);
            const traversed = traversedEdges.has(key);
            const active = edge.from === currentSymbol || edge.to === currentSymbol;
            return (
              <line
                key={`${edge.from}-${edge.to}`}
                className={`subgroup-edge${onWalk ? " is-walk" : ""}${
                  traversed ? " is-traversed" : ""
                }${active ? " is-focus" : ""}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
              />
            );
          })}
        </svg>
        {EXPLORER_GRAPH_NODES.map((node) => {
          const isCurrent = node.symbol === currentSymbol;
          const onWalk = FEATURED_WALK.some((step) => step.symbol === node.symbol);
          return (
            <button
              type="button"
              key={node.symbol}
              className={`subgroup-node${onWalk ? " is-walk" : ""}${
                connectedSymbols.has(node.symbol) ? " is-related" : ""
              }${isCurrent ? " is-current" : ""}`}
              style={
                {
                  "--node-x": `${node.x}%`,
                  "--node-y": `${node.y}%`,
                } as CSSProperties
              }
              aria-current={isCurrent ? "step" : undefined}
              onClick={() => onSelectSymbol(node.symbol)}
            >
              {node.label}
            </button>
          );
        })}
      </div>
      <div className="subgroup-legend" aria-label="Connection legend">
        <span className="is-current">current group</span>
        <span className="is-path">authored walk</span>
        <span className="is-type">hierarchy connection</span>
      </div>
      <div className="subgroup-walk" aria-label="Authored exploration walk">
        <p>Featured walk</p>
        <div className="subgroup-walk-track">
          {FEATURED_WALK.map((step, index) => (
            <span key={`${step.symbol}-${step.family}-${index}`} className={index === walkIndex ? "is-current" : ""}>
              {graphLabel(step.symbol)}
            </span>
          ))}
        </div>
      </div>
      <p className="subgroup-note">
        Standard labels follow the supplied hierarchy. Translation-index copies are suppressed;
        the colored frame marks the live pattern.
      </p>
    </aside>
  );
}

function openEditor(): void {
  window.location.hash = "";
}

export function ExplorationDemo() {
  const [selection, setSelection] = useState<ExplorerSelection>(INITIAL_SELECTION);
  const [walkIndex, setWalkIndex] = useState<number | null>(0);
  const [colorTransition, setColorTransition] = useState<ColorTransition | null>(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<Speed>("medium");
  const [ambient, setAmbient] = useState(false);
  const [pendingBridge, setPendingBridge] = useState<BridgeRequest | null>(null);
  const [pendingAscent, setPendingAscent] = useState<PendingAscent | null>(null);
  const [bridge, setBridge] = useState<LatticeBridge | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [display, toggleDisplay] = useDisplaySettings();
  const family = familyFor(selection.family);
  const timing = SPEEDS[speed];
  const immersiveStage = useMemo(
    () => buildImmersiveStage(selection.symbol, selection.family),
    [selection.family, selection.symbol],
  );
  const colorFromStage = useMemo(
    () =>
      colorTransition
        ? buildImmersiveStage(colorTransition.from.symbol, colorTransition.from.family)
        : null,
    [colorTransition],
  );
  const colorToStage = useMemo(
    () =>
      colorTransition
        ? buildImmersiveStage(colorTransition.to.symbol, colorTransition.to.family)
        : null,
    [colorTransition],
  );
  const changingSignatures = useMemo(
    () =>
      colorFromStage && colorToStage
        ? changedFaceSignatures(colorFromStage, colorToStage)
        : new Set<string>(),
    [colorFromStage, colorToStage],
  );
  const bridgeFrom = useMemo(
    () => (bridge ? buildImmersiveStage("p1", bridge.fromFamily) : null),
    [bridge],
  );
  const bridgeTo = useMemo(
    () => (bridge ? buildImmersiveStage("p1", bridge.toFamily) : null),
    [bridge],
  );
  const bridgeTransforms = bridge
    ? {
        fromTo: latticeTransform(bridge.fromFamily, bridge.toFamily),
        toFrom: latticeTransform(bridge.toFamily, bridge.fromFamily),
      }
    : null;

  const transitionColor = (next: ExplorerSelection, settleWalkIndex?: number) => {
    if (next.symbol === selection.symbol && next.family === selection.family) {
      if (settleWalkIndex !== undefined) {
        setWalkIndex(settleWalkIndex);
      }
      return;
    }
    setColorTransition({ from: selection, to: next, settleWalkIndex });
  };

  const beginBridge = (request: BridgeRequest) => {
    setColorTransition(null);
    setPendingBridge(null);
    setBridge({
      fromFamily: selection.family,
      toFamily: request.toFamily,
      targetSymbol: request.targetSymbol,
      settleWalkIndex: request.settleWalkIndex,
    });
  };

  const clearTransientMotion = () => {
    setColorTransition(null);
    setPendingBridge(null);
    setPendingAscent(null);
    setBridge(null);
  };

  const navigateTo = (
    symbol: string,
    requestedFamily?: LatticeType,
    pausePlayback = true,
    settleWalkIndex?: number,
  ) => {
    if (pausePlayback) {
      setPlaying(false);
      setWalkIndex(null);
      clearTransientMotion();
    }
    const targetFamily =
      requestedFamily ??
      (supportsFamilySymbol(selection.family, symbol)
        ? selection.family
        : primaryFamilyForSymbol(symbol));
    if (targetFamily === selection.family) {
      setPendingBridge(null);
      transitionColor({ symbol, family: selection.family }, settleWalkIndex);
      return;
    }
    const request = { toFamily: targetFamily, targetSymbol: symbol, settleWalkIndex };
    if (selection.symbol === "p1") {
      beginBridge(request);
      return;
    }
    setPendingBridge(request);
    transitionColor({ symbol: "p1", family: selection.family });
  };

  const advanceWalk = (nextIndex: number) => {
    const target = FEATURED_WALK[nextIndex];
    navigateTo(target.symbol, target.family, false, nextIndex);
  };

  const restartWalk = () => {
    setPlaying(false);
    setWalkIndex(null);
    clearTransientMotion();
    advanceWalk(0);
  };

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReducedMotion(preference.matches);
    syncPreference();
    preference.addEventListener("change", syncPreference);
    return () => preference.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    if (!colorTransition || bridge) {
      return;
    }
    const settle = () => {
      setSelection(colorTransition.to);
      if (colorTransition.settleWalkIndex !== undefined) {
        setWalkIndex(colorTransition.settleWalkIndex);
      }
      setColorTransition(null);
    };
    if (reducedMotion) {
      const timeout = window.setTimeout(settle, 100);
      return () => window.clearTimeout(timeout);
    }
    const duration = Math.max(1250, Math.round(timing.fade * 1.55));
    const timeout = window.setTimeout(settle, duration);
    return () => window.clearTimeout(timeout);
  }, [bridge, colorTransition, reducedMotion, timing.fade]);

  useEffect(() => {
    if (!pendingBridge || selection.symbol !== "p1" || bridge || colorTransition) {
      return;
    }
    const timeout = window.setTimeout(() => beginBridge(pendingBridge), 90);
    return () => window.clearTimeout(timeout);
  }, [bridge, colorTransition, pendingBridge, selection.symbol]);

  useEffect(() => {
    if (!bridge) {
      return;
    }
    const duration = Math.max(2200, Math.round(timing.fade * 1.85));
    const timeout = window.setTimeout(() => {
      setSelection({ symbol: "p1", family: bridge.toFamily });
      if (bridge.settleWalkIndex !== undefined) {
        setWalkIndex(bridge.settleWalkIndex);
      }
      setBridge(null);
      if (bridge.targetSymbol !== "p1") {
        setPendingAscent({
          symbol: bridge.targetSymbol,
          family: bridge.toFamily,
          settleWalkIndex: bridge.settleWalkIndex,
        });
      }
    }, duration);
    return () => window.clearTimeout(timeout);
  }, [bridge, timing.fade]);

  useEffect(() => {
    if (!pendingAscent || bridge || selection.symbol !== "p1") {
      return;
    }
    const timeout = window.setTimeout(() => {
      transitionColor(pendingAscent, pendingAscent.settleWalkIndex);
      setPendingAscent(null);
    }, 140);
    return () => window.clearTimeout(timeout);
  }, [bridge, pendingAscent, selection]);

  useEffect(() => {
    if (!playing || bridge || colorTransition || pendingBridge || pendingAscent || walkIndex === null) {
      return;
    }
    const timeout = window.setTimeout(() => {
      advanceWalk((walkIndex + 1) % FEATURED_WALK.length);
    }, timing.hold);
    return () => window.clearTimeout(timeout);
  }, [bridge, colorTransition, pendingAscent, pendingBridge, playing, timing.hold, walkIndex]);

  const style = {
    "--branch-accent": family.accent,
  } as CSSProperties;
  const groupDescription = lookupGroup(selection.symbol)?.feature ?? "Translations only.";
  const activeNarrative =
    walkIndex === null ? groupDescription : FEATURED_WALK[walkIndex].narrative;
  const incomingLabel = colorTransition ? graphLabel(colorTransition.to.symbol) : null;
  const thresholdDuration = Math.max(1250, Math.round(timing.fade * 1.55));
  const bridgeDuration = Math.max(2200, Math.round(timing.fade * 1.85));

  return (
    <main className={ambient ? "demo-page is-ambient" : "demo-page"} style={style}>
      <header className="demo-header">
        <div className="demo-heading">
          <p>Animated subgroup exploration</p>
          <h1>A continuous walk through symmetry</h1>
        </div>
        <nav className="demo-actions" aria-label="Exploration actions">
          <button type="button" onClick={() => setAmbient((active) => !active)}>
            {ambient ? "Exit ambient" : "Ambient mode"}
          </button>
          <button type="button" onClick={openEditor}>
            Return to editor
          </button>
        </nav>
      </header>
      <section className="demo-controls" aria-label="Animation controls">
        <div className="demo-branches demo-walk-control">
          <button type="button" className={walkIndex !== null ? "is-selected" : ""} onClick={restartWalk}>
            Restart featured walk
          </button>
          <span>p6mm to p1 to p4mm, returning through p4gm</span>
        </div>
        <div className="demo-playback">
          <button type="button" className="play-toggle" onClick={() => setPlaying((active) => !active)}>
            {playing ? "Pause" : "Play"}
          </button>
          <label>
            Speed
            <select
              aria-label="Animation speed"
              value={speed}
              onChange={(event) => setSpeed(event.target.value as Speed)}
            >
              {(Object.entries(SPEEDS) as [Speed, (typeof SPEEDS)[Speed]][]).map(
                ([value, entry]) => (
                  <option key={value} value={value}>
                    {entry.label}
                  </option>
                ),
              )}
            </select>
          </label>
          <div className="presentation-layers" role="group" aria-label="Visible tiling layers">
            <button
              type="button"
              className={display.showEdges ? "is-selected" : ""}
              aria-pressed={display.showEdges}
              onClick={() => toggleDisplay("showEdges")}
            >
              Edges
            </button>
            <button
              type="button"
              className={display.showVertices ? "is-selected" : ""}
              aria-pressed={display.showVertices}
              onClick={() => toggleDisplay("showVertices")}
            >
              Vertices
            </button>
          </div>
        </div>
        <div className="demo-visual-mode">
          <strong>
            {bridge ? "Lattice homotopy" : colorTransition ? "Symmetry threshold" : "Smooth color transition"}
          </strong>
          <span>
            {bridge
              ? "Edges contract and regrow while p1 changes its cell."
              : colorTransition
                ? `${changingSignatures.size} changing regions flicker faster until ${incomingLabel} locks in.`
                : `${family.title} geometry is preserved while accent witnesses change.`}
          </span>
        </div>
      </section>
      <section className="demo-experience">
        <SubgroupGraph
          selection={selection}
          bridge={bridge}
          walkIndex={walkIndex}
          onSelectSymbol={navigateTo}
        />
        <div className="demo-viewport">
          {bridge && bridgeFrom && bridgeTo && bridgeTransforms ? (
            <>
              <div
                className="demo-layer demo-layer--homotopy demo-layer--homotopy-from"
                style={{ "--homotopy-duration": `${bridgeDuration}ms` } as CSSProperties}
              >
                <UnitCellCanvas
                  document={bridgeFrom.document}
                  preview
                  immersive
                  previewTileRange={2}
                  contentTransformAnimation={{
                    from: "1 0 0 1 0 0",
                    to: bridgeTransforms.fromTo,
                    durationMs: bridgeDuration,
                  }}
                  showEdges={display.showEdges}
                  showVertices={display.showVertices}
                />
              </div>
              <div
                className="demo-layer demo-layer--homotopy demo-layer--homotopy-to"
                style={{ "--homotopy-duration": `${bridgeDuration}ms` } as CSSProperties}
              >
                <UnitCellCanvas
                  document={bridgeTo.document}
                  preview
                  immersive
                  previewTileRange={2}
                  contentTransformAnimation={{
                    from: bridgeTransforms.toFrom,
                    to: "1 0 0 1 0 0",
                    durationMs: bridgeDuration,
                  }}
                  showEdges={display.showEdges}
                  showVertices={display.showVertices}
                />
              </div>
            </>
          ) : colorTransition && colorFromStage && colorToStage ? (
            <div
              className="demo-layer demo-layer--threshold"
              style={{ "--threshold-duration": `${thresholdDuration}ms` } as CSSProperties}
            >
              <UnitCellCanvas
                document={colorToStage.document}
                preview
                immersive
                transitioningFaceSignatures={changingSignatures}
                transitioningFromDocument={colorFromStage.document}
                showEdges={display.showEdges}
                showVertices={display.showVertices}
              />
            </div>
          ) : (
              <div className="demo-layer" key={`new-${selection.family}-${selection.symbol}`}>
                <UnitCellCanvas
                  document={immersiveStage.document}
                  preview
                  immersive
                  showEdges={display.showEdges}
                  showVertices={display.showVertices}
                />
              </div>
          )}
          <div className="demo-caption" aria-live="polite">
            <span>
              {bridge
                ? `${bridge.fromFamily} to ${bridge.toFamily} / p1 bridge`
                : colorTransition
                  ? `${family.title} / symmetry threshold in progress`
                  : `${family.title} / fixed lattice`}
            </span>
            <strong>
              {colorTransition
                ? `${graphLabel(selection.symbol)} -> ${incomingLabel}`
                : graphLabel(bridge ? "p1" : selection.symbol)}
            </strong>
            <p>
              {bridge
                ? "The coloring stays free while old edges collapse into the new cell geometry."
                : colorTransition
                  ? "Only changing tiles pulse; their blink frequency accelerates until the target symmetry is established."
                  : activeNarrative}
            </p>
            <small>
              {bridge
                ? "smooth metric change / contracting and expanding motif edges"
                : colorTransition
                  ? `${changingSignatures.size} changing face regions / lattice and edges fixed`
                  : `${immersiveStage.orbitCount} accent orbits / detected symmetry ${graphLabel(immersiveStage.computedSymbol)}`}
            </small>
          </div>
        </div>
      </section>
    </main>
  );
}
