# Plane-Group Knowledge Base

This vault is organized by the 17 two-dimensional crystallographic plane groups. Each group file records properties, the app preset, saved user motifs, and its validation state.

## Notation

The interface uses the familiar short wallpaper symbols (`pm`, `pmm`, `p4m`, `p6m`). Where International Tables notation expands the symmetry directions, the group file also gives that standard symbol (`p1m1`, `p2mm`, `p4mm`, `p6mm`).

## Group Index

| No. | Short symbol | Standard symbol | Lattice family | Point class | Entry |
| ---: | --- | --- | --- | --- | --- |
| 1 | p1 | p1 | oblique | 1 | [p1](groups/p1.md) |
| 2 | p2 | p2 | oblique | 2 | [p2](groups/p2.md) |
| 3 | pm | p1m1 | rectangular | m | [pm](groups/pm.md) |
| 4 | pg | p1g1 | rectangular | m | [pg](groups/pg.md) |
| 5 | cm | c1m1 | centered rectangular | m | [cm](groups/cm.md) |
| 6 | pmm | p2mm | rectangular | 2mm | [pmm](groups/pmm.md) |
| 7 | pmg | p2mg | rectangular | 2mm | [pmg](groups/pmg.md) |
| 8 | pgg | p2gg | rectangular | 2mm | [pgg](groups/pgg.md) |
| 9 | cmm | c2mm | centered rectangular | 2mm | [cmm](groups/cmm.md) |
| 10 | p4 | p4 | square | 4 | [p4](groups/p4.md) |
| 11 | p4m | p4mm | square | 4mm | [p4m](groups/p4m.md) |
| 12 | p4g | p4gm | square | 4mm | [p4g](groups/p4g.md) |
| 13 | p3 | p3 | hexagonal | 3 | [p3](groups/p3.md) |
| 14 | p3m1 | p3m1 | hexagonal | 3m | [p3m1](groups/p3m1.md) |
| 15 | p31m | p31m | hexagonal | 3m | [p31m](groups/p31m.md) |
| 16 | p6 | p6 | hexagonal | 6 | [p6](groups/p6.md) |
| 17 | p6m | p6mm | hexagonal | 6mm | [p6m](groups/p6m.md) |

## Motif Record Protocol

When a motif is developed and intentionally saved:

1. Export it from the app as JSON.
2. Add it under `knowledge-base/motifs/<group>/` using a descriptive name.
3. Append its filename, purpose, color semantics and computed symmetry result to the corresponding group page.
4. Mark whether the result is `exploratory`, `computed`, or `standard-certified`.

## Sources

- IUCr educational material, *Plane groups* and International Tables plane-group notation: https://www.iucr.org/education/pamphlets/13/full-text
- Bilbao Crystallographic Server, Plane groups: generators and general-position tools: https://www.cryst.ehu.es/cryst/get_plane_gen.html

These references establish nomenclature and standard-setting validation targets. The generated editable motifs in release 0.1 still require per-preset regression certification.
