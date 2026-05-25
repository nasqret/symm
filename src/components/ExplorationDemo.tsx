import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { Lattice, LatticeType } from "../types";
import { LATTICES } from "../math/lattice";
import { lookupGroup } from "../data/wallpaperGroups";
import {
  buildImmersiveStage,
  EXPLORER_FAMILIES,
  EXPLORER_GRAPH_EDGES,
  EXPLORER_GRAPH_NODES,
  primaryFamilyForSymbol,
  supportsFamilySymbol,
  type ExplorerFamily,
} from "../data/subgroupExplorer";
import { useDisplaySettings } from "../state/useDisplaySettings";
import { UnitCellCanvas } from "./UnitCellCanvas";

type Speed = "slow" | "medium" | "fast";

interface ExplorerSelection {
  symbol: string;
  family: LatticeType;
}

interface LatticeBridge {
  fromFamily: LatticeType;
  toFamily: LatticeType;
  targetSymbol: string;
}

interface BridgeRequest {
  toFamily: LatticeType;
  targetSymbol: string;
}

const SPEEDS: Record<Speed, { hold: number; fade: number; label: string }> = {
  slow: { hold: 5800, fade: 2200, label: "Slow" },
  medium: { hold: 4000, fade: 1500, label: "Medium" },
  fast: { hold: 2500, fade: 900, label: "Fast" },
};

const INITIAL_SELECTION: ExplorerSelection = { symbol: "p6m", family: "hexagonal" };
const GRAPH_POSITIONS = new Map(
  EXPLORER_GRAPH_NODES.map((node) => [node.symbol, { x: node.x, y: node.y }]),
);

function familyFor(id: LatticeType): ExplorerFamily {
  return EXPLORER_FAMILIES.find((family) => family.id === id) ?? EXPLORER_FAMILIES[0];
}

function interpolateLattice(from: Lattice, to: Lattice, progress: number): Lattice {
  const interpolate = (left: number, right: number) => left + (right - left) * progress;
  return {
    type: progress < 0.5 ? from.type : to.type,
    a: interpolate(from.a, to.a),
    b: interpolate(from.b, to.b),
    angle: interpolate(from.angle, to.angle),
  };
}

function displayScaleFor(family: LatticeType): number {
  return family === "rectangular" ? 192 : 205;
}

interface SubgroupGraphProps {
  selection: ExplorerSelection;
  bridge: LatticeBridge | null;
  onSelectSymbol: (symbol: string) => void;
}

function SubgroupGraph({ selection, bridge, onSelectSymbol }: SubgroupGraphProps) {
  const outgoing = EXPLORER_GRAPH_EDGES.filter((edge) => edge.from === selection.symbol);
  const connectedSymbols = new Set(outgoing.map((edge) => edge.to));

  return (
    <aside className="subgroup-graph" aria-label="Full wallpaper subgroup type graph">
      <header className="subgroup-graph-heading">
        <div>
          <p>Subgroup type graph</p>
          <h2>{bridge ? "p1" : selection.symbol}</h2>
        </div>
        <strong>17 types</strong>
      </header>
      <p className="subgroup-route">
        {bridge
          ? `${familyFor(bridge.fromFamily).title} to ${familyFor(bridge.toFamily).title}`
          : `${familyFor(selection.family).title} / fixed geometry`}
      </p>
      <div className="subgroup-map">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          {EXPLORER_GRAPH_EDGES.map((edge) => {
            const from = GRAPH_POSITIONS.get(edge.from);
            const to = GRAPH_POSITIONS.get(edge.to);
            if (!from || !to) {
              return null;
            }
            const active = edge.from === selection.symbol;
            const fixed =
              supportsFamilySymbol(selection.family, edge.from) &&
              supportsFamilySymbol(selection.family, edge.to);
            return (
              <line
                key={`${edge.from}-${edge.to}`}
                className={`subgroup-edge${fixed ? " is-fixed" : ""}${active ? " is-focus" : ""}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
              >
                <title>{`${edge.from} -> ${edge.to} / index ${edge.index}`}</title>
              </line>
            );
          })}
        </svg>
        {EXPLORER_GRAPH_NODES.map((node) => {
          const isCurrent = node.symbol === selection.symbol && !bridge;
          return (
            <button
              type="button"
              key={node.symbol}
              className={`subgroup-node${connectedSymbols.has(node.symbol) ? " is-related" : ""}${
                isCurrent ? " is-current" : ""
              }`}
              style={
                {
                  "--node-x": `${node.x}%`,
                  "--node-y": `${node.y}%`,
                } as CSSProperties
              }
              aria-current={isCurrent ? "step" : undefined}
              onClick={() => onSelectSymbol(node.symbol)}
            >
              {node.symbol}
            </button>
          );
        })}
      </div>
      <div className="subgroup-legend" aria-label="Connection legend">
        <span className="is-color">color-only in active lattice</span>
        <span className="is-type">possible type relation</span>
      </div>
      <p className="subgroup-connections">
        <strong>{selection.symbol} subgroups:</strong>{" "}
        {outgoing.length
          ? outgoing.map((edge) => `${edge.to} (i${edge.index})`).join(", ")
          : "no lower type other than finite-index copies of itself"}
      </p>
      <p className="subgroup-note">
        Type quotient shown: translation-index copies are suppressed. Cross-lattice selections
        pass through a p1 homotopy.
      </p>
    </aside>
  );
}

function openEditor(): void {
  window.location.hash = "";
}

export function ExplorationDemo() {
  const [selection, setSelection] = useState<ExplorerSelection>(INITIAL_SELECTION);
  const [leaving, setLeaving] = useState<ExplorerSelection | null>(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<Speed>("medium");
  const [ambient, setAmbient] = useState(false);
  const [pendingBridge, setPendingBridge] = useState<BridgeRequest | null>(null);
  const [pendingAscent, setPendingAscent] = useState<ExplorerSelection | null>(null);
  const [bridge, setBridge] = useState<LatticeBridge | null>(null);
  const [bridgeProgress, setBridgeProgress] = useState(0);
  const [display, toggleDisplay] = useDisplaySettings();
  const family = familyFor(selection.family);
  const timing = SPEEDS[speed];
  const immersiveStage = useMemo(
    () => buildImmersiveStage(selection.symbol, selection.family),
    [selection.family, selection.symbol],
  );
  const leavingStage = useMemo(
    () => (leaving ? buildImmersiveStage(leaving.symbol, leaving.family) : null),
    [leaving],
  );
  const bridgeFrom = useMemo(
    () => (bridge ? buildImmersiveStage("p1", bridge.fromFamily) : null),
    [bridge],
  );
  const bridgeTo = useMemo(
    () => (bridge ? buildImmersiveStage("p1", bridge.toFamily) : null),
    [bridge],
  );
  const interpolatedLattice = bridge
    ? interpolateLattice(LATTICES[bridge.fromFamily], LATTICES[bridge.toFamily], bridgeProgress)
    : null;
  const interpolatedScale = bridge
    ? displayScaleFor(bridge.fromFamily) +
      (displayScaleFor(bridge.toFamily) - displayScaleFor(bridge.fromFamily)) * bridgeProgress
    : undefined;

  const transitionColor = (next: ExplorerSelection) => {
    if (next.symbol === selection.symbol && next.family === selection.family) {
      return;
    }
    setLeaving(selection);
    setSelection(next);
  };

  const beginBridge = (request: BridgeRequest) => {
    setLeaving(null);
    setPendingBridge(null);
    setBridgeProgress(0);
    setBridge({
      fromFamily: selection.family,
      toFamily: request.toFamily,
      targetSymbol: request.targetSymbol,
    });
  };

  const navigateTo = (
    symbol: string,
    requestedFamily?: LatticeType,
    pausePlayback = true,
  ) => {
    if (pausePlayback) {
      setPlaying(false);
    }
    const targetFamily =
      requestedFamily ??
      (supportsFamilySymbol(selection.family, symbol)
        ? selection.family
        : primaryFamilyForSymbol(symbol));
    if (targetFamily === selection.family) {
      setPendingBridge(null);
      transitionColor({ symbol, family: selection.family });
      return;
    }
    const request = { toFamily: targetFamily, targetSymbol: symbol };
    if (selection.symbol === "p1") {
      beginBridge(request);
      return;
    }
    setPendingBridge(request);
    transitionColor({ symbol: "p1", family: selection.family });
  };

  useEffect(() => {
    if (!leaving || bridge) {
      return;
    }
    const timeout = window.setTimeout(() => setLeaving(null), timing.fade);
    return () => window.clearTimeout(timeout);
  }, [bridge, leaving, timing.fade]);

  useEffect(() => {
    if (!pendingBridge || selection.symbol !== "p1" || bridge || leaving) {
      return;
    }
    const timeout = window.setTimeout(() => beginBridge(pendingBridge), 90);
    return () => window.clearTimeout(timeout);
  });

  useEffect(() => {
    if (!bridge) {
      return;
    }
    const duration = Math.max(1250, Math.round(timing.fade * 1.3));
    const started = performance.now();
    let animationFrame = 0;
    let previousPaint = 0;
    const draw = (timestamp: number) => {
      const linear = Math.min(1, (timestamp - started) / duration);
      const eased = linear * linear * (3 - 2 * linear);
      if (timestamp - previousPaint > 28 || linear === 1) {
        previousPaint = timestamp;
        setBridgeProgress(eased);
      }
      if (linear < 1) {
        animationFrame = window.requestAnimationFrame(draw);
        return;
      }
      setSelection({ symbol: "p1", family: bridge.toFamily });
      setBridge(null);
      setBridgeProgress(0);
      if (bridge.targetSymbol !== "p1") {
        setPendingAscent({ symbol: bridge.targetSymbol, family: bridge.toFamily });
      }
    };
    animationFrame = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [bridge, timing.fade]);

  useEffect(() => {
    if (!pendingAscent || bridge || selection.symbol !== "p1") {
      return;
    }
    const timeout = window.setTimeout(() => {
      setLeaving(selection);
      setSelection(pendingAscent);
      setPendingAscent(null);
    }, 140);
    return () => window.clearTimeout(timeout);
  }, [bridge, pendingAscent, selection]);

  useEffect(() => {
    if (!playing || bridge || pendingBridge || pendingAscent) {
      return;
    }
    const timeout = window.setTimeout(() => {
      const pathIndex = family.tour.indexOf(selection.symbol);
      if (pathIndex >= 0 && pathIndex < family.tour.length - 1) {
        navigateTo(family.tour[pathIndex + 1], selection.family, false);
        return;
      }
      if (selection.symbol !== "p1") {
        navigateTo("p1", selection.family, false);
        return;
      }
      const familyIndex = EXPLORER_FAMILIES.findIndex((entry) => entry.id === selection.family);
      const nextFamily = EXPLORER_FAMILIES[(familyIndex + 1) % EXPLORER_FAMILIES.length];
      navigateTo(nextFamily.tour[0], nextFamily.id, false);
    }, timing.hold);
    return () => window.clearTimeout(timeout);
  });

  const style = {
    "--demo-fade-duration": `${timing.fade}ms`,
    "--branch-accent": family.accent,
    "--branch-glow": family.glow,
  } as CSSProperties;
  const groupDescription = lookupGroup(selection.symbol)?.feature ?? "Translations only.";

  return (
    <main className={ambient ? "demo-page is-ambient" : "demo-page"} style={style}>
      <header className="demo-header">
        <div className="demo-heading">
          <p>Animated subgroup exploration</p>
          <h1>Color descent on a fixed lattice</h1>
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
        <div className="demo-branches">
          {EXPLORER_FAMILIES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={entry.id === selection.family ? "is-selected" : ""}
              onClick={() => navigateTo(entry.tour[0], entry.id)}
            >
              {entry.title}
            </button>
          ))}
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
          <strong>{bridge ? "Lattice homotopy" : "Color-only transition"}</strong>
          <span>
            {bridge
              ? "Edges contract and regrow while p1 changes its cell."
              : `${family.title} geometry is preserved while color orbits change.`}
          </span>
        </div>
      </section>
      <section className="demo-experience">
        <SubgroupGraph selection={selection} bridge={bridge} onSelectSymbol={navigateTo} />
        <div className="demo-viewport is-chromatic">
          {bridge && bridgeFrom && bridgeTo && interpolatedLattice ? (
            <>
              <div
                className="demo-layer demo-layer--homotopy"
                style={
                  {
                    "--edge-scale": Math.max(0.018, 1 - bridgeProgress),
                    opacity: 1 - bridgeProgress,
                  } as CSSProperties
                }
              >
                <UnitCellCanvas
                  document={bridgeFrom.document}
                  preview
                  immersive
                  latticeOverride={interpolatedLattice}
                  displayScaleOverride={interpolatedScale}
                  showEdges={display.showEdges}
                  showVertices={display.showVertices}
                />
              </div>
              <div
                className="demo-layer demo-layer--homotopy"
                style={
                  {
                    "--edge-scale": Math.max(0.018, bridgeProgress),
                    opacity: bridgeProgress,
                  } as CSSProperties
                }
              >
                <UnitCellCanvas
                  document={bridgeTo.document}
                  preview
                  immersive
                  latticeOverride={interpolatedLattice}
                  displayScaleOverride={interpolatedScale}
                  showEdges={display.showEdges}
                  showVertices={display.showVertices}
                />
              </div>
            </>
          ) : (
            <>
              {leavingStage && (
                <div className="demo-layer demo-layer--departing" key={`old-${leaving?.family}-${leaving?.symbol}`}>
                  <UnitCellCanvas
                    document={leavingStage.document}
                    preview
                    immersive
                    showEdges={display.showEdges}
                    showVertices={display.showVertices}
                  />
                </div>
              )}
              <div
                className={`demo-layer${leavingStage ? " demo-layer--arriving" : ""}`}
                key={`new-${selection.family}-${selection.symbol}`}
              >
                <UnitCellCanvas
                  document={immersiveStage.document}
                  preview
                  immersive
                  showEdges={display.showEdges}
                  showVertices={display.showVertices}
                />
              </div>
            </>
          )}
          <div className="demo-caption" aria-live="polite">
            <span>
              {bridge
                ? `${bridge.fromFamily} to ${bridge.toFamily} / p1 bridge`
                : `${family.title} / fixed lattice`}
            </span>
            <strong>{bridge ? "p1" : selection.symbol}</strong>
            <p>
              {bridge
                ? "The coloring stays free while old edges collapse into the new cell geometry."
                : groupDescription}
            </p>
            <small>
              {bridge
                ? "smooth metric change / contracting and expanding motif edges"
                : `${immersiveStage.orbitCount} color orbits / detected symmetry ${immersiveStage.computedSymbol}`}
            </small>
          </div>
        </div>
      </section>
    </main>
  );
}
