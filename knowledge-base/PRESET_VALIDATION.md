# Preset Validation Record

## Release 0.1 Browser Regression: 2026-05-24

Method: select each preset in the browser editor, read the computed colored-symmetry symbol, and verify the torus CW diagnostic displays `V - E + F = 0`.

| Preset | Computed | CW check |
| --- | --- | --- |
| p1 | p1 | 0 |
| p2 | p2 | 0 |
| pm | pm | 0 |
| pg | pg | 0 |
| cm | cm | 0 |
| pmm | pmm | 0 |
| pmg | pmg | 0 |
| pgg | pgg | 0 |
| cmm | cmm | 0 |
| p4 | p4 | 0 |
| p4m | p4m | 0 |
| p4g | p4g | 0 |
| p3 | p3 | 0 |
| p3m1 | p3m1 | 0 |
| p31m | p31m | 0 |
| p6 | p6 | 0 |
| p6m | p6m | 0 |

This verifies the application's own generated motives and classifier together. Standard-generator certification against crystallographic reference settings remains a separate validation stage.

## Minimal Decoration Presets: 2026-05-25

Method: retain each generated periodic mesh, search target-group face orbits for the smallest
non-background decoration that remains classified as the intended group, including alternatives
using two distinct marker colors, and then re-run the full classification sweep. The `p1`, `pm`
and `cm` witnesses use two colors because a single-color choice would retain additional symmetry
or require more painted faces.

| Preset | Computed | Painted faces | Non-background colors |
| --- | --- | ---: | ---: |
| p1 | p1 | 2 | 2 |
| p2 | p2 | 0 | 0 |
| pm | pm | 2 | 2 |
| pg | pg | 4 | 1 |
| cm | cm | 4 | 2 |
| pmm | pmm | 2 | 1 |
| pmg | pmg | 2 | 1 |
| pgg | pgg | 8 | 1 |
| cmm | cmm | 0 | 0 |
| p4 | p4 | 4 | 1 |
| p4m | p4m | 0 | 0 |
| p4g | p4g | 8 | 1 |
| p3 | p3 | 3 | 1 |
| p3m1 | p3m1 | 1 | 1 |
| p31m | p31m | 6 | 1 |
| p6 | p6 | 6 | 1 |
| p6m | p6m | 0 | 0 |

The older saved `p4m` release 0.1 JSON fixture remains an archival fully decorated example; the
current in-app `p4m` preset is the unfilled minimal witness listed above.
