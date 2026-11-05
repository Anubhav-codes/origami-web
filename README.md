# Fold — The Complete Origami Textbook, interactive

A static website (no backend) that teaches origami in eight levels, from the first square to crease
patterns. Every lesson with step-by-step instructions is an **animated SVG diagram you can play like a
video, pause at any step, or scrub crease by crease** — and every animation is *simulated from the paper's
geometry*, not hand-keyed.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # geometric invariants for every model
npm run build      # pre-renders thumbnails, type-checks, builds to dist/
```

The build is plain static files with hash routing, so `dist/` can be served from any host or sub-path.

## How the animations work

`src/engine` is a small flat-folding simulator.

- **State.** A model is a stack of convex *facets*. Each facet keeps its outline on the unfolded sheet and a
  rigid 2D map to where it currently lies. Folding splits facets along the crease and reflects the moving
  side; the stack order is updated the way paper allows (valley folds land on top, mountain folds underneath,
  tucks slide into a named pocket).
- **Motion.** Every operation also provides a 3D motion between its start and end state: flaps rotate about
  their real crease lines, with perspective, lighting from the facet normal, a cast shadow and a fingertip
  showing where to hold the paper. Each step first draws its Yoshizawa–Randlett symbols, then folds.
- **Mechanisms.** Multi-crease moves are small kinematic models: the squash fold (spine kept in the plane of
  symmetry, `tan(φ/2) = cos(β/2)·cot θ`), petal fold and rabbit ear (degree-4 vertex solved by intersecting
  crease cones), base collapses (rigid 8-sector vertex, then the flaps turn like pages), the boat's
  open-and-flatten (a spherical rhombus linkage), and hinge rigs for the crane, masu box and Sonobe cube.
- **Rendering.** One SVG `<path>` per facet, updated in place; thumbnails and crease patterns are rendered
  ahead of time by `scripts/gen-thumbs.ts`.

## Verification

Because the simulator can only do what paper can do, building each lesson checked the original text. Steps
that could not be folded as written were corrected; every change is listed on the site's
**Verification notes** page (`src/content/notes.ts`). `tests/models.test.ts` checks, for every model, that
all placements stay rigid, paper area is conserved, each step starts where the last ended and every frame
renders — plus specific claims (the cup's triangle fits its pocket, the preliminary base alternates colours,
the bird base's point height, and so on).

The original textbook was written from origami.me; designer models in the practice lists link to their
creators' own tutorials.

## Layout

```
src/engine      geometry, flat-fold state, ops, mechanisms, renderer, player
src/models      one file per lesson (lazy-loaded), shared base sequences in bases.ts
src/content     textbook content, lesson catalogue, verification notes
src/app         pages and the tutorial player UI
scripts         thumbnail generator and debugging/screenshot helpers
```
