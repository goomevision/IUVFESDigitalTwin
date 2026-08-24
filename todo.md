# IUVFES Digital Twin Laboratory - Implementation TODO

## PHASE 1: Foundation & Opening Animation ✓
- [x] Dark sci-fi theme setup
- [x] Opening animation cinematic
- [x] 3D laboratory environment with equipment
- [x] Basic UI layout
- [x] Checkpoint: bf18f020 (Phase 1)
- [x] Checkpoint: 47ae2848 (Phase 2 - 3D Lab)

---

## PHASE 2: Input Form & Database Schema ✓

### Database Schema
- [x] Create materials table
- [x] Create experiments table
- [x] Create simulation_results table
- [x] Create control_logs table
- [x] Create reports table
- [x] Generate and apply migrations

### Setup Wizard UI (Screen 2-4) - REDESIGN REQUIRED
- [x] Redesign MaterialSelectionForm (Screen 2) to match mockup exactly
- [x] Redesign ProcessParametersForm (Screen 3) to match mockup
- [x] Redesign ReviewConfirmForm (Screen 4) to match mockup
- [x] Update SetupWizard container with new layout
- [x] Ensure form validation and error handling

### tRPC Procedures
- [x] Materials router (getMaterials, getMaterialById, createMaterial)
- [x] Experiments router (createExperiment, getExperiment, listExperiments, updateStatus)
- [x] Input validation with Zod schemas

### Testing
- [ ] Vitest tests for form validation
- [ ] Vitest tests for tRPC procedures
- [ ] Database operation tests

### Checkpoint
- [ ] Save Phase 2 checkpoint

---

## PHASE 3: Physics Simulation Engine (Backend) ✓

### Physics Models
- [x] PV=nRT model (Vacuum Drying)
- [x] Fick's Law model (Diffusion)
- [x] Ultrasonic Cavitation model
- [x] Heat Transfer model (Fourier's Law)
- [x] Hybrid model (combination)

### Simulation Engine
- [x] PhysicsSimulationEngine class
- [x] Real-time data collection
- [x] Simulation loop (60 steps per duration)
- [x] State calculation at each timestep

### tRPC Integration
- [x] simulation.run procedure
- [x] simulation.getResults procedure
- [x] Error handling
- [x] Result persistence

### Testing
- [ ] Physics model tests
- [ ] Calculation accuracy verification
- [ ] Edge case testing

### Checkpoint
- [ ] Save Phase 3 checkpoint

---

## PHASE 4: Live Control Room Dashboard (Frontend)

### Animated Gauges
- [ ] PressureGauge component
- [ ] TemperatureGauge component
- [ ] YieldMonitor component
- [ ] Smooth needle/fill animations

### Metric Cards
- [ ] EnergyCard component
- [ ] EfficiencyCard component
- [ ] WaterRemovedCard component

### 3D Lab Visualization
- [ ] Update Laboratory3D component
- [ ] Vibrating leaves animation
- [ ] Animated liquid flow in pipes
- [ ] Cold trap color gradient
- [ ] Vacuum pump rotation
- [ ] Sensor displays
- [ ] Particle effects

### Real-time Graphs
- [ ] Pressure vs Time graph
- [ ] Temperature vs Time graph
- [ ] Yield Accumulation graph
- [ ] Energy Consumption graph
- [ ] Smooth line drawing animation
- [ ] Hover tooltips

### Control Panel
- [ ] ControlButtons component (Pause, Resume, Stop, Emergency Stop)
- [ ] ParameterSliders component (Pressure, Temperature, Frequency)
- [ ] Apply Changes button
- [ ] Reset to Defaults button

### Main Dashboard Layout
- [ ] ControlRoomDashboard component
- [ ] Status bar
- [ ] Responsive layout
- [ ] Smooth transitions

### Real-time Data Integration
- [ ] WebSocket connection
- [ ] Live gauge updates
- [ ] Graph data points
- [ ] 3D visualization updates

### Testing
- [ ] Component tests
- [ ] Data binding tests
- [ ] Animation tests

### Checkpoint
- [ ] Save Phase 4 checkpoint

---

## PHASE 5: AI Brain Panel & Optimization

### Neural Network Visualization
- [ ] NeuralNetworkVisualization component
- [ ] Glowing nodes animation
- [ ] Connection lines
- [ ] Pulsing effects

### AI Status Display
- [ ] AIStatusPanel component
- [ ] Loading animation
- [ ] Status messages
- [ ] Progress indicator

### Optimization Suggestions
- [ ] SuggestionsPanel component
- [ ] Real-time suggestions
- [ ] Checkmark/warning icons
- [ ] Clickable suggestions

### Predictions
- [ ] PredictionBox component
- [ ] Yield prediction
- [ ] Confidence level
- [ ] Error range
- [ ] Recommendations

### AI Engine (Backend)
- [ ] AIOptimizer class
- [ ] Real-time analysis
- [ ] Trend detection
- [ ] Anomaly detection
- [ ] Yield prediction
- [ ] Suggestion generation

### tRPC Procedures
- [ ] getAISuggestions()
- [ ] applyAISuggestion()
- [ ] getPredictions()

### Testing
- [ ] AI logic tests
- [ ] Suggestion generation tests
- [ ] Prediction accuracy tests

### Checkpoint
- [ ] Save Phase 5 checkpoint

---

## PHASE 6: Results & Report Generation

### Results Screen (Screen 7)
- [ ] ResultsScreen component
- [ ] Status display
- [ ] Summary metrics
- [ ] 4 graphs in grid
- [ ] Mass Balance table
- [ ] Energy Balance table
- [ ] Composition Analysis
- [ ] Download/Export buttons

### Report Generation
- [ ] ReportGenerator class
- [ ] PDF generation
- [ ] Professional styling
- [ ] All required sections

### Data Export
- [ ] Export to PDF
- [ ] Export to Excel
- [ ] Export to CSV
- [ ] Shareable links

### Database Integration
- [ ] Save report records
- [ ] Store files in S3
- [ ] Link reports to experiments

### tRPC Procedures
- [ ] generateReport()
- [ ] downloadReport()
- [ ] exportData()
- [ ] shareReport()
- [ ] getReports()

### Testing
- [ ] Report generation tests
- [ ] PDF output tests
- [ ] Data export tests

### Checkpoint
- [ ] Save Phase 6 checkpoint

---

## PHASE 7: Testing, Optimization & Final Checkpoint

### Unit Testing
- [ ] Comprehensive Vitest tests
- [ ] Component tests
- [ ] Procedure tests
- [ ] >80% code coverage

### Integration Testing
- [ ] Full workflow tests
- [ ] Data persistence tests
- [ ] WebSocket communication tests

### Performance Optimization
- [ ] 3D rendering optimization (30-60 FPS target)
- [ ] Graph rendering optimization (30 FPS target)
- [ ] Bundle size optimization
- [ ] Lazy loading

### Bug Fixes & Polish
- [ ] Bug fixes
- [ ] UI/UX polish
- [ ] Animation improvements
- [ ] Micro-interactions

### Documentation
- [ ] Code documentation
- [ ] User guide
- [ ] API documentation
- [ ] Deployment guide

### Final Checkpoint
- [ ] Save final MVP checkpoint
- [ ] Prepare for production

---

## DEPLOYMENT & PUBLICATION

- [ ] Create final checkpoint
- [ ] Review all features
- [ ] Publish to production
- [ ] Setup monitoring
- [ ] Create user documentation

---

**Status:** Master Quality corrections complete locally; authenticated browser verification remains pending.
**Current Phase:** Quality Gate green; ready for review on `feature/control-room-ui`.
**Last Updated:** 25 August 2026
**Implementation Strategy:** Closed-loop causal frames, engine-bound visual telemetry, explicit simulation provenance, deterministic evidence, and experiment-identity preservation.

### UI Fixes (Reported 31 Jul 2026)
- [x] Fix Tailwind CSS px-4 error breaking all styling
- [x] Polish Material Selection screen to match mockup (proper spacing, borders, colors)
- [x] Verify all wizard screens render correctly after CSS fix

---

## BUKU BESAR BASELINE & QUALITY GATE (ACTIVE)

- [x] Publish the IUVFES Baseline Acknowledgement from the official Buku Besar.
- [x] Synchronize the local branch with the official remote `feature/control-room-ui` baseline.
- [x] Verify the current Quality Gate baseline: 19 test files / 52 tests passing locally.
- [x] Audit the ProcessSimulator data bindings against CausalFrame and session sources.
- [x] Record confirmed repository and architecture discrepancies in the Buku Besar.
- [x] Fix closed-loop reset authorization to validate the parent experiment rather than the session identifier.
- [x] Replace the ProcessSimulator's duplicated frame contract with tRPC-inferred closed-loop API types.
- [x] Poll and reconcile the known active Process Simulator session from the session API without fabricating telemetry.
- [x] Add a lifecycle API to discover a persisted session by experiment after a full browser reload.
- [x] Guard ProcessMachine3D renderer cleanup so React never removes a detached canvas node.

## PROCESS SIMULATOR — LIVING MACHINE REDESIGN (ACTIVE)

- [x] Recompose the Process Simulator into a control-room canvas with a live status top bar, operator rail, machine hero, and hardware rail.
- [x] Bind operating-input displays, simulation progress, and sensor instrumentation only to experiment inputs, session state, or CausalFrame data.
- [x] Surface engine-derived vacuum, cold-trap, ultrasonic, safety, and provenance diagnostics without creating synthetic telemetry.
- [x] Pass stored ultrasonic operator inputs into the closed-loop session configuration when they are available.
- [x] Preserve causal trace, replay, trend, and recorder interactions in the redesigned Control Room.

## REPLAY / EVIDENCE / PROVENANCE (ACTIVE)

- [x] Remove fabricated numeric fallbacks from persisted replay normalization and expose missing data as UNKNOWN.
- [x] Restrict scientific replay to structurally valid causal frames while clearly identifying unsupported legacy results.
- [x] Add a reproducible JSON evidence export for the selected persisted replay window with source and boundary metadata.

## QUALITY GATE VALIDATION — 2026-08-12

- [x] TypeScript validation passed (`pnpm check`).
- [x] Regression suite passed (20 test files, 53 tests).
- [x] Production build passed (`pnpm build`); non-blocking bundle-size warning documented.
- [x] GitHub Actions IUVFES Quality Gate passed for commit `ea3f7a0`.

## GITHUB DEVELOPMENT REVIEW — 2026-08-12

- [x] Review latest remote development, PR, and Quality Gate status with the project owner.
- [x] Agree the next implementation priority after reviewing current engineering gaps.

## P10 — INTERACTIVE SCIENTIFIC 3D DIGITAL TWIN (MASTER COMMAND)

- [x] Preserve the established 3D topology while exposing a single CausalFrame-derived visual state contract.
- [x] Bind heater, vacuum pump, extractor, condenser, and cooling visuals continuously to `frame.actuatorLevels`.
- [x] Add camera navigation, scientific presets, reset view, and non-engine-affecting view modes.
- [x] Add selection, focus, and a compact component inspector that distinguishes command, actuator, sensor, provenance, time, and UNKNOWN data.
- [x] Add equipment, piping, flow, particle, material, label, electrical, and diagnostics layer controls without altering engine state.
- [x] Preserve simulation time semantics and mark derived process animation as non-measured flow.
- [x] Add focused client-side regression tests and include them in the Quality Gate.
- [ ] Complete authenticated browser interaction and WebGL lifecycle verification using a real persisted experiment; OAuth preview session is currently blocked.
- [x] Complete TypeScript, full test, diff, and production build verification before commit.
- [x] Record the implemented interactive 3D Twin capability and browser-verification boundary in the Buku Besar.

## P10-RUNTIME-001 — AUTHENTICATED OPERATOR VERIFICATION

- [ ] Authenticate as an authorized IUVFES operator without bypassing OAuth.
- [ ] Open an existing persisted experiment and record its experimentId and canonical sessionId.
- [ ] Verify lifecycle continuity: Play, Pause, Resume, Refresh, Play Again without duplicate session creation.
- [ ] Verify camera rotation, zoom, pan, reset, and all declared presets.
- [ ] Verify selection, focus, and inspector coverage for all requested equipment targets.
- [ ] Verify Realistic, X-Ray, Wireframe, and all declared visual-layer controls.
- [ ] Verify distinct CausalFrame actuator visual states at LOW/MEDIUM/HIGH where existing real frames provide those levels.
- [ ] Verify simulation timestamp source, DOM/canvas uniqueness, WebGL health, and browser console.
- [ ] Record real browser evidence for every PASS; otherwise classify P10 as BLOCKED or FAIL.

## DEPLOYED INTAKE MATERIAL LIST DEFECT

- [x] Diagnose why the deployed Material / Batch selector returns no selectable material records.
- [x] Restore the existing material-list query path without seeding or fabricating material data.
- [x] Verify the deployed selector reports available data, a loading state, or an explicit empty-data state.
- [x] Deploy the existing GitHub CORS policy to the active Manus API service for the GitHub Pages origin.
- [x] Configure the GitHub Pages build with the verified public IUVFES API URL.
- [x] Ensure an environment CORS override cannot remove the required GitHub Pages origin from the production API allowlist.

## MASTER AUTONOMOUS QUALITY & COMPLETION

- [x] Perform non-destructive Git/GitHub forensics and record source-of-truth evidence.
- [x] Create the targeted master read map and evidence-backed IUVFES Gap Registry.
- [x] Create the Requirement Registry with implementation, test, runtime, and evidence status.
- [x] Verify session lifecycle, persistence, replay evidence, reports, material boundary, and 3D causal mapping.
- [x] Resolve only actionable gaps supported by the existing architecture and contracts.
- [x] Run all available static, test, build, CI, and authenticated browser gates; record blockers honestly.
- [x] Publish a final completion matrix with VERIFIED, PENDING, BLOCKED, and OUT_OF_SCOPE states.

## AUDIT-DISCOVERED DATA CONTRACT GAPS

- [x] Define one authorized handoff from a completed live closed-loop session to persisted causal replay/evidence data.
- [x] Quarantine or explicitly separate the legacy batch `simulation.run` output from the authoritative closed-loop replay contract.
- [x] Preserve the original IUVFES experiment identity when the scientific recorder creates research records and dataset manifests.
- [x] Remove the synthetic default sample identifier from scientific recording; require user input or preserve UNKNOWN.
- [x] Make canonical replay evidence checksums stable by excluding volatile export timestamps from the hashed body.
- [x] Make runtime recovery tests explicitly isolate id and experiment lookup mocks between cases.
