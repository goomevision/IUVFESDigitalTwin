# MANUS COMMAND — P15 MODERN 3D CONTROL ROOM

Execute this workstream only on `feature/control-room-ui` from the GitHub source-of-truth checkout.

## OBJECTIVE

Modernize the IUVFES Control Room visual presentation and `ProcessMachine3D` so the machine looks like a professional scientific/industrial digital twin: clearer geometry, better spatial hierarchy, better lighting/materials, readable process paths, smooth rotate/zoom/pan/focus, modern inspector and scientific overlays.

## IMPORTANT: DO NOT TOUCH

Do not modify physics, PID, safety/interlock logic, CausalFrame semantics, timestamp semantics, intended/effective command authority, experiment/session persistence, scientific evidence, provenance, database schema, migration chain, OAuth, backend deployment, or P10 lifecycle behavior.

Do not create experiment/session/telemetry/test data in production.
Do not bypass authentication.
Do not use synthetic scientific values to make the 3D scene look complete.

## EXECUTION MODE

1. Read `docs/P15_MODERN_3D_VISUALIZATION_SPEC.md`.
2. Inspect the existing `ProcessMachine3D.tsx` and current Control Room UI before changing anything.
3. Preserve existing authoritative CausalFrame mapping.
4. Improve visuals in one coherent pass.
5. Keep all visual controls UI-only.
6. If a desired improvement requires backend/database/OAuth/physics changes, STOP and report the dependency; do not improvise.

## PRIORITY ORDER

A. Overall scene composition and industrial geometry.
B. Reactor and cold-trap visual hierarchy.
C. Piping/process-path readability.
D. Professional lighting/material treatment.
E. Smooth orbit/zoom/pan/focus and camera presets.
F. Component selection and inspector readability.
G. Layer/view controls and scientific legend.
H. Subtle derived activity animation using existing authoritative values only.
I. Responsive layout and performance.

## SCIENTIFIC DISPLAY RULE

Every displayed value/activity must remain explicitly classified as:

- MEASURED — only when an authoritative measured field exists;
- SIMULATION — when from CausalFrame simulation;
- DERIVED — when presentation/calculation is derived from authoritative data;
- UNKNOWN — when no authoritative value exists.

Never convert animation into a claim of measured flow, laboratory validation, calibration, AI confidence, or uncertainty.

## 3D INTERACTION

Ensure the user can rotate, zoom, pan, reset, select, focus and use process-area presets without changing simulation state.

Required presets:
Default, Front, Top, Left, Right, Process Path, Reactor, Cold Traps, Vacuum, Cooling.

## VISUAL QUALITY TARGET

Aim for a premium scientific-control-room appearance rather than a game aesthetic:

- realistic industrial proportions;
- clean topology;
- useful depth;
- restrained reflections;
- clear piping;
- readable labels;
- coherent shadows;
- subtle atmospheric depth;
- strong but non-distracting hierarchy;
- no excessive neon/bloom/particles.

## VALIDATION

Run only the minimum necessary checks:

`pnpm check`
`pnpm test`
`pnpm build`
`git diff --check`

Then perform a browser visual smoke test from the GitHub source-of-truth checkout.

Verify:

- no React/DOM/WebGL console errors;
- scene renders;
- rotate/zoom/pan work;
- presets work;
- selection/focus work;
- layers/view modes work;
- scientific labels are truthful;
- no process/backend state is mutated by visual controls.

## GIT RULE

If all checks pass:

- commit the visual implementation;
- push only to `feature/control-room-ui`;
- update the Buku Besar with the exact commit and verification results;
- do not merge to `develop` or `main`.

If checks fail, do not claim completion. Record the exact failure and stop.

## FINAL REPORT FORMAT

Return only a concise report containing:

1. files changed;
2. visual improvements implemented;
3. scientific boundaries preserved;
4. tests/build results;
5. browser smoke-test result;
6. commit SHA;
7. push result;
8. remaining blockers.

Do not report P10 as verified. P10 remains blocked by infrastructure/authentication until its independent gates are satisfied.
