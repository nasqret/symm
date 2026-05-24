# Project Memory

This file records reusable decisions and discoveries for future Unit Cell Designer work. It is not a substitute for the dated journal.

## Stable Conventions

- The motif model is periodic: vertex coordinates live modulo the lattice basis and each edge may carry an integer endpoint translation.
- Faces and symmetries must be evaluated on the decorated complex, not only on the uncolored graph.
- A standard group preset is a starting motif plus documentation entry; it should not be marked certified until its computed generators have been checked against a standard crystallographic setting.
- Any new saved motif belongs in `knowledge-base/groups/<group>.md` or a linked manifest entry with the state export filename, purpose and validation state.

## Potentially Reusable Features

- Fractional-coordinate periodic graph serialization can support textile, lattice, wallpaper and mesh editors.
- Face-cycle extraction over a repeated lift supplies both SVG fills and CW-complex diagnostics.
- Candidate affine-operation testing gives an explainable colored-symmetry engine: accepted generators can be presented directly to learners.
- A separate preview window synchronized by browser storage is useful for live presentation without exposing editor chrome.
- For a preset library whose colors define exact subgroups, each color orbit must be distinct enough to break unintended supergroups; a coarse symmetric mesh silently preserves larger groups.
- Cache extracted faces once per symmetry computation: candidate-operation loops otherwise turn an interactive edit into repeated geometry reconstruction.
- Topology deletion should paint only newly created face signatures located at the removed edge
  midpoint or vertex position, while dropping color records for faces that no longer exist.
- A disconnected boundary contained inside another bounded cycle produces a face with a hole.
  Render it as an even-odd path, exclude holes during hit-testing, and select an interior point
  away from holes for symmetry matching because an enclosing polygon centroid can lie in the hole.
- Vertex construction should expose its permitted lattice points directly in the canvas. Keep
  insertion snapped through the mutation layer as well, so imported/programmatic actions cannot
  bypass the same grid invariant.

## Validation Debt

- Centered rectangular conventional cells and all plane-group preset settings need standard-generator regression checks.
- Robust handling for self-intersections, disconnected embedded graphs and user-created non-cellular complexes is future work.
- Keep generator display keys positional or operation-identity based; repeated textual generator descriptions otherwise leave stale DOM rows when switching groups.
