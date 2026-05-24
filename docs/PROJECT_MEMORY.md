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

## Validation Debt

- Centered rectangular conventional cells and all plane-group preset settings need standard-generator regression checks.
- Robust handling for self-intersections, disconnected embedded graphs and user-created non-cellular complexes is future work.
- Keep generator display keys positional or operation-identity based; repeated textual generator descriptions otherwise leave stale DOM rows when switching groups.
