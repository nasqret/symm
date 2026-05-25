import { useEffect } from "react";

interface StartOverlayProps {
  onClose: () => void;
  onOpenAbout: () => void;
}

export function StartOverlay({ onClose, onOpenAbout }: StartOverlayProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="start-overlay">
      <section
        className="start-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-dialog-title"
      >
        <div className="start-heading">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <h2 id="start-dialog-title">Unit Cell Designer</h2>
            <p>Construct periodic patterns and read their surviving symmetry.</p>
          </div>
        </div>
        <p className="start-description">
          Choose a lattice, add vertices and periodic edges, then color the resulting faces.
          The canvas repeats the cell while the right panel identifies the wallpaper group
          preserved by both geometry and color.
        </p>
        <div className="start-steps">
          <article>
            <strong>Build</strong>
            <span>Create a motif on a generic, rectangular, square or hexagonal lattice.</span>
          </article>
          <article>
            <strong>Color</strong>
            <span>Paint faces and watch which rotations, mirrors and glides remain valid.</span>
          </article>
          <article>
            <strong>Present</strong>
            <span>Preview, export or explore the subgroup walk as an animated tiling.</span>
          </article>
        </div>
        <p className="start-symmetry">
          <strong>Symmetric editing begins on.</strong> Each edit is propagated while retaining
          the current group exactly. Turn off <em>Preserve symmetry</em> to explore symmetry
          breaking freely.
        </p>
        <div className="start-actions">
          <button type="button" className="secondary-action" onClick={onOpenAbout}>
            About the app
          </button>
          <button type="button" className="start-primary" onClick={onClose}>
            Start designing
          </button>
        </div>
      </section>
    </div>
  );
}

export function AboutPage() {
  return (
    <main className="about-page">
      <header className="about-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <h1>Unit Cell Designer</h1>
            <p>About</p>
          </div>
        </div>
        <nav className="about-actions" aria-label="About page navigation">
          <button type="button" onClick={() => (window.location.hash = "")}>
            Open editor
          </button>
          <button
            type="button"
            onClick={() => window.open(`${window.location.pathname}#preview`, "tiling-preview")}
          >
            Open preview
          </button>
        </nav>
      </header>
      <div className="about-content">
        <section className="about-introduction">
          <h2>Design repeating cells. See symmetry respond.</h2>
          <p>
            Unit Cell Designer is an interactive browser application for constructing periodic
            two-dimensional colored tilings. A motif is drawn in one unit cell and repeated
            throughout the plane, including geometry that crosses cell boundaries.
          </p>
        </section>
        <section className="about-columns" aria-label="Application description">
          <article>
            <h3>Construct</h3>
            <p>
              Select a lattice family, place vertices on the construction grid, connect
              periodic edges and color bounded faces. Save and load designs as JSON.
            </p>
          </article>
          <article>
            <h3>Analyze</h3>
            <p>
              The app computes the current wallpaper symmetry from geometry and face coloring.
              Select generators to display translations, rotations, mirrors and glides.
            </p>
          </article>
          <article>
            <h3>Explore</h3>
            <p>
              Symmetric editing is enabled initially so edits retain the current wallpaper
              group. Preview/export tools and the subgroup animation support presentation and
              investigation.
            </p>
          </article>
        </section>
        <section className="about-scope">
          <h3>Mathematical scope</h3>
          <p>
            The editor models a colored periodic cell complex and tests lattice-compatible
            transformations against its vertices, edges and face colors. Editable starter
            motifs are supplied for all 17 wallpaper groups.
          </p>
        </section>
        <footer className="about-footer">Copyright Bartosz Naskrecki 2026</footer>
      </div>
    </main>
  );
}
