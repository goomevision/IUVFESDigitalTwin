# P15 — Modern Scientific 3D Visualization Specification

## Purpose

Upgrade the visual presentation of the IUVFES Control Room so the digital twin is easier to understand, more modern, spatially convincing, and professionally presentable, while preserving the scientific runtime as the sole authority for process meaning.

## Scope

P15 is a **visual/presentation workstream**. It may improve `ProcessMachine3D`, Control Room layout, camera interaction, labels, lighting, materials, inspection UI, animation presentation, and explanatory overlays.

P15 MUST NOT change:

- physics or process equations;
- PID/controller logic;
- safety/interlock authority;
- CausalFrame schema or semantics;
- `timestampSeconds` semantics;
- `actuatorLevels` meaning;
- intended/effective command authority;
- experiment/session persistence;
- scientific evidence or provenance records;
- laboratory claims;
- authentication or deployment architecture as a visual workaround.

## Visual Target

The target is a **scientific industrial digital twin**, not a game and not a decorative 3D scene.

### 1. Spatial hierarchy

- Clear reactor/process core.
- Cold-trap/condenser bank visually separated.
- Vacuum path visually readable.
- Cooling loop visually readable.
- Equipment supports and industrial deck geometry.
- Consistent scale and alignment.
- Clean scene composition with useful negative space.

### 2. Modern rendering

- Physically plausible material appearance where supported by existing renderer.
- Controlled metallic/roughness treatment.
- Industrial glass/transparent treatment only where scientifically meaningful.
- Ambient/rim/key lighting hierarchy.
- Subtle shadows and depth cues.
- Avoid excessive bloom, neon effects, or game-like decoration.

### 3. Interaction

- Smooth orbit, pan, zoom and reset.
- Camera presets: Default, Front, Top, Left, Right, Process Path, Reactor, Cold Traps, Vacuum, Cooling.
- Click-to-select and focus.
- Clear selected-object highlight.
- Optional fullscreen presentation mode if compatible with existing UI.
- Keep all interactions reversible and UI-only.

### 4. Scientific overlays

Every visible process indicator must distinguish:

- `MEASURED` when a real measured field exists;
- `SIMULATION` when sourced from CausalFrame simulation;
- `DERIVED` when calculated/presentational from authoritative data;
- `UNKNOWN` when the source does not provide the value.

Never invent a flow rate, temperature, pressure, material property, confidence score, laboratory result, or uncertainty value.

### 5. Machine readability

Add a clean visual legend explaining:

- equipment;
- piping;
- process activity;
- sensors;
- actuators;
- material;
- provenance;
- diagnostics.

Use consistent labels and avoid overlapping text in the 3D viewport.

### 6. Inspector

The selected component inspector should clearly show, where available:

- component name;
- process stage;
- authoritative command state;
- actuator visual level;
- available sensor fields;
- simulation timestamp;
- provenance classification;
- UNKNOWN fields.

The inspector must never imply that a visual animation is a measured flow rate unless an authoritative measured field exists.

## Camera / Zoom Requirements

The user must be able to:

1. rotate around the machine;
2. zoom smoothly from full-system view to component view;
3. pan without losing orientation;
4. select an equipment component and focus it;
5. reset to a known camera state;
6. use predefined process-area views.

Camera movement must not alter process state or simulation time.

## Visual State Mapping

Use existing authoritative fields only.

```text
CausalFrame
  ├── actuatorLevels → visual actuator intensity
  ├── sensorAfter    → instrument presentation
  ├── timestampSeconds → simulation-time presentation
  ├── effectiveCommands → command/interlock meaning
  └── provenance      → scientific status label
```

Animation scheduling may use browser rendering frames, but scientific time must remain `CausalFrame.timestampSeconds`.

## UX Layout Target

Recommended desktop hierarchy:

```text
┌───────────────────────────────────────────────────────────────┐
│ IUVFES / Experiment / Simulation Time / Provenance            │
├───────────────┬───────────────────────────────┬───────────────┤
│ PROCESS        │                               │ INSPECTOR     │
│ NAVIGATION     │        3D DIGITAL TWIN        │               │
│               │                               │ Component     │
│ Views          │       Orbit / Zoom / Pan      │ Sensors       │
│ Layers         │       Select / Focus          │ Actuator      │
│ Presets        │                               │ Provenance    │
├───────────────┴───────────────────────────────┴───────────────┤
│ Timeline / Runtime status / Scientific boundary / Diagnostics │
└───────────────────────────────────────────────────────────────┘
```

The exact layout may adapt to the existing application architecture. Do not rebuild unrelated pages.

## Performance Requirements

- Preserve existing Quality Gate.
- Avoid unnecessary per-frame allocations.
- Prefer reusable geometries/materials.
- Avoid uncontrolled particle counts.
- Keep interaction responsive on ordinary desktop hardware.
- Treat bundle-size optimization as a separate concern unless a visual dependency is genuinely required.

## Acceptance Criteria

### Visual

- [ ] Reactor has clear industrial structure and depth.
- [ ] Cold traps/condenser area is visually legible.
- [ ] Piping/process path is immediately understandable.
- [ ] Lighting creates hierarchy without obscuring data.
- [ ] Materials remain coherent and scientific.
- [ ] Labels remain readable and non-overlapping.

### Interaction

- [ ] Orbit works.
- [ ] Zoom works smoothly.
- [ ] Pan works.
- [ ] Selection/focus works.
- [ ] Presets work.
- [ ] Reset works.
- [ ] Layers work.
- [ ] View modes remain renderer-only.

### Scientific integrity

- [ ] No synthetic telemetry.
- [ ] No synthetic CausalFrame.
- [ ] No physics change.
- [ ] No PID change.
- [ ] No safety change.
- [ ] No session/experiment creation for visual testing.
- [ ] SIMULATION/DERIVED/MEASURED/UNKNOWN labels remain truthful.
- [ ] Visual animation never becomes an unsupported measurement claim.

### Verification

- [ ] `pnpm check` passes.
- [ ] `pnpm test` passes.
- [ ] `pnpm build` passes.
- [ ] `git diff --check` passes.
- [ ] Browser visual smoke test passes on the source-of-truth checkout.
- [ ] No React/DOM/WebGL console errors in visual smoke test.
- [ ] Changes committed and pushed only to `feature/control-room-ui`.
- [ ] No merge to `develop` or `main`.

## Execution Rule for Manus

Work from the GitHub source-of-truth checkout on `feature/control-room-ui`.

First inspect the existing `ProcessMachine3D.tsx`, Control Room layout, Knowledge Center navigation, and current visual tests. Then make the **smallest coherent visual upgrade** rather than rebuilding the application.

Do not modify backend, database, OAuth, migration chain, physics, CausalFrame, or P10 lifecycle behavior.

If a requested visual improvement requires any of those areas, stop and report the dependency instead of improvising.
