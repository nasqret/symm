import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { buildPresetDocument } from "../data/wallpaperGroups";
import {
  buildImmersiveStage,
  EXPLORER_BRANCHES,
  EXPLORER_GRAPH_EDGES,
  EXPLORER_GRAPH_NODES,
  type ExplorerBranch,
} from "../data/subgroupExplorer";
import { useDisplaySettings } from "../state/useDisplaySettings";
import { UnitCellCanvas } from "./UnitCellCanvas";

type Speed = "slow" | "medium" | "fast";

const SPEEDS: Record<Speed, { hold: number; fade: number; label: string }> = {
  slow: { hold: 5800, fade: 2200, label: "Slow" },
  medium: { hold: 4000, fade: 1500, label: "Medium" },
  fast: { hold: 2500, fade: 900, label: "Fast" },
};

const GRAPH_POSITIONS = new Map(
  EXPLORER_GRAPH_NODES.map((node) => [node.symbol, { x: node.x, y: node.y }]),
);

interface SubgroupGraphProps {
  branch: ExplorerBranch;
  activeIndex: number;
  onSelectSymbol: (symbol: string) => void;
}

function SubgroupGraph({ branch, activeIndex, onSelectSymbol }: SubgroupGraphProps) {
  const currentSymbol = branch.stages[activeIndex].symbol;
  const routeIndex = new Map(branch.stages.map((stage, index) => [stage.symbol, index]));

  return (
    <aside className="subgroup-graph" aria-label="Position in guided subgroup graph">
      <header className="subgroup-graph-heading">
        <div>
          <p>Subgroup position</p>
          <h2>{currentSymbol}</h2>
        </div>
        <strong>
          node {activeIndex + 1}/{branch.stages.length}
        </strong>
      </header>
      <p className="subgroup-route">{branch.title}</p>
      <div className="subgroup-map">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          {EXPLORER_GRAPH_EDGES.map((edge) => {
            const from = GRAPH_POSITIONS.get(edge.from);
            const to = GRAPH_POSITIONS.get(edge.to);
            const index = edge.branchId === branch.id ? routeIndex.get(edge.from) : undefined;
            if (!from || !to) {
              return null;
            }
            return (
              <line
                key={`${edge.branchId}-${edge.from}-${edge.to}`}
                className={`subgroup-edge${edge.branchId === branch.id ? " is-route" : ""}${
                  index !== undefined && index < activeIndex ? " is-traversed" : ""
                }`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
              />
            );
          })}
        </svg>
        {EXPLORER_GRAPH_NODES.map((node) => {
          const index = routeIndex.get(node.symbol);
          const onRoute = index !== undefined;
          const isCurrent = node.symbol === currentSymbol;
          const wasVisited = index !== undefined && index <= activeIndex;
          return (
            <button
              type="button"
              key={node.symbol}
              className={`subgroup-node${onRoute ? " is-route" : ""}${
                wasVisited ? " is-visited" : ""
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
              {node.symbol}
            </button>
          );
        })}
      </div>
      <p className="subgroup-note">Guided inclusion routes shown; select a node to move there.</p>
    </aside>
  );
}

function openEditor(): void {
  window.location.hash = "";
}

export function ExplorationDemo() {
  const [branchId, setBranchId] = useState(EXPLORER_BRANCHES[0].id);
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<Speed>("medium");
  const [ambient, setAmbient] = useState(false);
  const [chromatic, setChromatic] = useState(true);
  const [display, toggleDisplay] = useDisplaySettings();
  const branch = EXPLORER_BRANCHES.find((entry) => entry.id === branchId) ?? EXPLORER_BRANCHES[0];
  const activeStage = branch.stages[activeIndex];
  const immersiveStage = useMemo(
    () => buildImmersiveStage(activeStage.symbol),
    [activeStage.symbol],
  );
  const currentDocument = useMemo(
    () => (chromatic ? immersiveStage.document : buildPresetDocument(activeStage.symbol)),
    [activeStage.symbol, chromatic, immersiveStage.document],
  );
  const previousDocument = useMemo(() => {
    if (previousIndex === null) {
      return null;
    }
    const symbol = branch.stages[previousIndex].symbol;
    return chromatic ? buildImmersiveStage(symbol).document : buildPresetDocument(symbol);
  }, [branch, chromatic, previousIndex]);
  const timing = SPEEDS[speed];

  useEffect(() => {
    if (!playing) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setPreviousIndex(activeIndex);
      setActiveIndex((activeIndex + 1) % branch.stages.length);
    }, timing.hold);
    return () => window.clearTimeout(timeout);
  }, [activeIndex, branch.stages.length, playing, timing.hold]);

  useEffect(() => {
    if (previousIndex === null) {
      return;
    }
    const timeout = window.setTimeout(() => setPreviousIndex(null), timing.fade);
    return () => window.clearTimeout(timeout);
  }, [previousIndex, timing.fade]);

  const chooseBranch = (id: string) => {
    setBranchId(id);
    setActiveIndex(0);
    setPreviousIndex(null);
  };

  const chooseStage = (index: number) => {
    if (index !== activeIndex) {
      setPreviousIndex(activeIndex);
      setActiveIndex(index);
    }
  };

  const chooseGraphNode = (symbol: string) => {
    const currentIndex = branch.stages.findIndex((stage) => stage.symbol === symbol);
    if (currentIndex >= 0) {
      chooseStage(currentIndex);
      return;
    }
    const targetBranch = EXPLORER_BRANCHES.find((entry) =>
      entry.stages.some((stage) => stage.symbol === symbol),
    );
    if (targetBranch) {
      setBranchId(targetBranch.id);
      setActiveIndex(targetBranch.stages.findIndex((stage) => stage.symbol === symbol));
      setPreviousIndex(null);
    }
  };

  const style = {
    "--demo-fade-duration": `${timing.fade}ms`,
    "--branch-accent": branch.accent,
    "--branch-glow": branch.glow,
  } as CSSProperties;

  return (
    <main className={ambient ? "demo-page is-ambient" : "demo-page"} style={style}>
      <header className="demo-header">
        <div className="demo-heading">
          <p>Animated subgroup exploration</p>
          <h1>From symmetry to freedom</h1>
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
          {EXPLORER_BRANCHES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={entry.id === branchId ? "is-selected" : ""}
              onClick={() => chooseBranch(entry.id)}
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
          <button
            type="button"
            className={chromatic ? "is-selected" : ""}
            aria-pressed={chromatic}
            onClick={() => setChromatic((active) => !active)}
          >
            Chromatic field
          </button>
          <span>{chromatic ? "Group-invariant color orbits" : "Source motif colors"}</span>
        </div>
      </section>
      <section className="demo-experience">
        <SubgroupGraph branch={branch} activeIndex={activeIndex} onSelectSymbol={chooseGraphNode} />
        <div className={`demo-viewport${chromatic ? " is-chromatic" : ""}`}>
          {previousDocument && (
            <div className="demo-layer demo-layer--departing" key={`old-${branchId}-${previousIndex}`}>
              <UnitCellCanvas
                document={previousDocument}
                preview
                immersive={chromatic}
                showEdges={display.showEdges}
                showVertices={display.showVertices}
              />
            </div>
          )}
          <div className="demo-layer demo-layer--arriving" key={`new-${branchId}-${activeIndex}`}>
            <UnitCellCanvas
              document={currentDocument}
              preview
              immersive={chromatic}
              showEdges={display.showEdges}
              showVertices={display.showVertices}
            />
          </div>
          <div className="demo-caption" aria-live="polite">
            <span>
              {branch.title} / node {activeIndex + 1}
            </span>
            <strong>{activeStage.symbol}</strong>
            <p>{activeStage.description}</p>
            <small>
              {chromatic && immersiveStage.enriched
                ? `${immersiveStage.orbitCount} luminous face orbits / colored symmetry ${immersiveStage.computedSymbol}`
                : `source motif / colored symmetry ${activeStage.symbol}`}
            </small>
          </div>
        </div>
      </section>
    </main>
  );
}
