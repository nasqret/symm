import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { buildPresetDocument } from "../data/wallpaperGroups";
import { useDisplaySettings } from "../state/useDisplaySettings";
import { UnitCellCanvas } from "./UnitCellCanvas";

interface DemoStage {
  symbol: string;
  description: string;
}

interface DemoBranch {
  id: string;
  title: string;
  stages: DemoStage[];
}

type Speed = "slow" | "medium" | "fast";

const SPEEDS: Record<Speed, { hold: number; fade: number; label: string }> = {
  slow: { hold: 5800, fade: 2200, label: "Slow" },
  medium: { hold: 4000, fade: 1500, label: "Medium" },
  fast: { hold: 2500, fade: 900, label: "Fast" },
};

const DEMO_BRANCHES: DemoBranch[] = [
  {
    id: "hexagonal",
    title: "Hexagonal descent",
    stages: [
      { symbol: "p6m", description: "six-fold rotations with mirrors" },
      { symbol: "p6", description: "rotations remain as mirrors disappear" },
      { symbol: "p3", description: "three-fold rotational subgroup" },
      { symbol: "p1", description: "translations alone" },
    ],
  },
  {
    id: "square",
    title: "Square descent",
    stages: [
      { symbol: "p4m", description: "four-fold rotations with mirrors" },
      { symbol: "p4", description: "four-fold rotational subgroup" },
      { symbol: "p2", description: "half-turn subgroup" },
      { symbol: "p1", description: "translations alone" },
    ],
  },
  {
    id: "rectangular",
    title: "Rectangular descent",
    stages: [
      { symbol: "cmm", description: "centered mirrors and half-turns" },
      { symbol: "pmm", description: "primitive perpendicular mirrors" },
      { symbol: "pm", description: "one mirror family remains" },
      { symbol: "p1", description: "translations alone" },
    ],
  },
];

function openEditor(): void {
  window.location.hash = "";
}

export function ExplorationDemo() {
  const [branchId, setBranchId] = useState(DEMO_BRANCHES[0].id);
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<Speed>("medium");
  const [ambient, setAmbient] = useState(false);
  const [display, toggleDisplay] = useDisplaySettings();
  const branch = DEMO_BRANCHES.find((entry) => entry.id === branchId) ?? DEMO_BRANCHES[0];
  const activeStage = branch.stages[activeIndex];
  const currentDocument = useMemo(
    () => buildPresetDocument(activeStage.symbol),
    [activeStage.symbol],
  );
  const previousDocument = useMemo(
    () => (previousIndex === null ? null : buildPresetDocument(branch.stages[previousIndex].symbol)),
    [branch, previousIndex],
  );
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

  const style = { "--demo-fade-duration": `${timing.fade}ms` } as CSSProperties;
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
          {DEMO_BRANCHES.map((entry) => (
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
        <div className="demo-stages" role="group" aria-label={`${branch.title} stages`}>
          {branch.stages.map((stage, index) => (
            <button
              type="button"
              key={stage.symbol}
              className={index === activeIndex ? "is-current" : ""}
              onClick={() => chooseStage(index)}
            >
              <strong>{stage.symbol}</strong>
              <span>{stage.description}</span>
            </button>
          ))}
        </div>
      </section>
      <div className="demo-viewport">
        {previousDocument && (
          <div className="demo-layer demo-layer--departing" key={`old-${branchId}-${previousIndex}`}>
            <UnitCellCanvas
              document={previousDocument}
              preview
              showEdges={display.showEdges}
              showVertices={display.showVertices}
            />
          </div>
        )}
        <div className="demo-layer demo-layer--arriving" key={`new-${branchId}-${activeIndex}`}>
          <UnitCellCanvas
            document={currentDocument}
            preview
            showEdges={display.showEdges}
            showVertices={display.showVertices}
          />
        </div>
        <div className="demo-caption" aria-live="polite">
          <span>{branch.title}</span>
          <strong>{activeStage.symbol}</strong>
          <p>{activeStage.description}</p>
        </div>
      </div>
    </main>
  );
}
