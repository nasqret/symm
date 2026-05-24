# Interface Design Reference

`unit-cell-designer-concept.png` is the primary-screen visual specification generated on 2026-05-24 for release 0.1.

## Extracted System

- Three-panel scientific editor: narrow construction panel, open periodic canvas, compact mathematical inspector.
- Warm drafting-paper background with charcoal line work, deep-teal active controls, and restrained mineral face colors.
- Controls remain compact and code-native; the canvas, not decorative chrome, is the focal point.
- Neighboring translated cells are visible to make boundary-crossing edges understandable.

## Verification Ledger

Update this list after rendered browser inspection:

| Comparison point | Concept requirement | Implementation evidence | Status |
| --- | --- | --- | --- |
| Layout | left tools, dominant canvas, right inspector | `implementation-editor.png` at 1536 x 1024 | pass |
| Color | paper/teal/mineral palette with dark chrome | `implementation-editor.png` | pass |
| Canvas | live repeated lattice outside active cell | visible tiled `p4m` motif and teal unit-cell outline | pass |
| Inspector | symmetry generators and CW counts | `p4m`; `T(a), T(b), C4, m`; Euler zero | pass |
| Controls | save/load/history/preview visible | header controls plus verified interactions | pass |
| Responsive | usable stacked small viewport | `implementation-mobile.png`; no horizontal overflow at 390 x 844 | pass |
| Preview | separate clean tiling view | `preview-window.png` synchronized after JSON load | pass |
| Colored edit | changing one face can remove symmetry | `interaction-color-breaks-symmetry.png`: `p4m` reduced to `p1` | pass |
| Periodic edge | adjacent translated endpoint is first-class | `interaction-periodic-edge.png`: Euler-zero edge addition | pass |

Supporting captures retained for traceability: `implementation-initial.png` records the first visual-QA state before the dark-shell/viewport corrections; `preset-p6m.png` records preset review during the 17-group sweep.

## Intentional Difference

The concept illustrates an asymmetric-looking `p2` canvas state. The implemented default render is the verified saved `p4m` starting motif so that the first screen demonstrates the standard-preset workflow. The shell, hierarchy, palette, highlighted periodic cell and inspector treatment follow the concept.
