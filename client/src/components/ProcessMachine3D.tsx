import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { CausalFrame } from "../../../server/closedLoopSimulation";
import type { ControlRoomEventName, ControlRoomEventResult, FrameReference } from "@/lib/controlRoomObservability";

type MachineObservabilityEvent = Extract<ControlRoomEventName, "THREE_SCENE_INIT" | "THREE_RENDERER_INIT" | "THREE_DISPOSE" | "WEBGL_ERROR" | "FRAME_RENDERED" | "SELECT_COMPONENT" | "FOCUS_COMPONENT" | "CAMERA_PRESET" | "ZOOM" | "RESET_VIEW" | "LAYER_CHANGE" | "VIEW_MODE_CHANGE">;

interface Props {
  frame?: CausalFrame;
  onObservabilityEvent?: (input: { event: MachineObservabilityEvent; result: ControlRoomEventResult; componentId?: string; detail?: Record<string, unknown>; frameRef?: FrameReference }) => void;
}

type ViewMode = "REALISTIC" | "X_RAY" | "WIREFRAME";
type CameraPreset = "DEFAULT" | "FRONT" | "TOP" | "LEFT" | "RIGHT" | "PROCESS_PATH" | "REACTOR" | "COLD_TRAPS" | "VACUUM" | "COOLING";
type ComponentId = "REACTOR" | "HEATER" | "ULTRASONIC" | "VACUUM_PUMP" | "EXTRACTOR" | "CONDENSER" | "COOLING" | "COLD_TRAP_1" | "COLD_TRAP_2" | "COLD_TRAP_3" | "COLD_TRAP_4" | "VAPOR_PIPE" | "VACUUM_PIPE" | "COOLING_PIPE";
type LayerKey = "equipment" | "piping" | "flow" | "particle" | "material" | "label" | "instrument" | "electrical" | "structure" | "diagnostics";
type LayerState = Record<LayerKey, boolean>;

const DEFAULT_LAYERS: LayerState = { equipment: true, piping: true, flow: true, particle: true, material: true, label: true, instrument: true, electrical: true, structure: true, diagnostics: true };
const CAMERA_PRESETS: Record<CameraPreset, { position: [number, number, number]; target: [number, number, number] }> = {
  DEFAULT: { position: [11.8, 7.6, 17.5], target: [0.4, 0.9, -0.3] },
  FRONT: { position: [0.4, 3.8, 19], target: [0.4, 1.0, -0.8] },
  TOP: { position: [0.4, 20, 1], target: [0.4, 0.6, -0.8] },
  LEFT: { position: [-17, 4.8, 1.5], target: [0.4, 1.0, -0.6] },
  RIGHT: { position: [18, 4.8, 1.5], target: [0.4, 1.0, -0.6] },
  PROCESS_PATH: { position: [8.6, 8.2, 15.5], target: [0.8, 2.2, -1.2] },
  REACTOR: { position: [2.2, 4.8, 10], target: [-4.1, 0.55, 0] },
  COLD_TRAPS: { position: [5.1, 6.4, 11.8], target: [1.8, 3.35, -1.55] },
  VACUUM: { position: [9.4, 2.5, 9.5], target: [3.4, 0.2, 1.1] },
  COOLING: { position: [10.4, 5.6, 6.5], target: [3.2, 2.1, -2.35] },
};

const COMPONENT_PRESETS: Record<ComponentId, CameraPreset> = {
  REACTOR: "REACTOR", HEATER: "REACTOR", ULTRASONIC: "REACTOR", VACUUM_PUMP: "VACUUM", EXTRACTOR: "REACTOR", CONDENSER: "COLD_TRAPS", COOLING: "COOLING", COLD_TRAP_1: "COLD_TRAPS", COLD_TRAP_2: "COLD_TRAPS", COLD_TRAP_3: "COLD_TRAPS", COLD_TRAP_4: "COLD_TRAPS", VAPOR_PIPE: "PROCESS_PATH", VACUUM_PIPE: "VACUUM", COOLING_PIPE: "COOLING",
};

const COMPONENT_LABELS: Record<ComponentId, string> = {
  REACTOR: "EXTRACTION CHAMBER", HEATER: "HEATER", ULTRASONIC: "ULTRASONIC", VACUUM_PUMP: "VACUUM PUMP", EXTRACTOR: "EXTRACTOR", CONDENSER: "MULTI-STAGE CONDENSER", COOLING: "COOLING LOOP", COLD_TRAP_1: "COLD TRAP 1", COLD_TRAP_2: "COLD TRAP 2", COLD_TRAP_3: "COLD TRAP 3", COLD_TRAP_4: "COLD TRAP 4", VAPOR_PIPE: "VAPOR PIPE", VACUUM_PIPE: "VACUUM PIPE", COOLING_PIPE: "COOLING PIPE",
};

export interface ProcessMachineVisualState {
  hasFrame: boolean;
  stage: CausalFrame["safety"]["stage"] | undefined;
  timestampSeconds: number | undefined;
  commands: CausalFrame["effectiveCommands"] | undefined;
  actuatorLevels: CausalFrame["actuatorLevels"] | undefined;
  controlOutput: CausalFrame["controlOutput"] | undefined;
  temperatureC: number | undefined;
  pressureMbar: number | undefined;
  overTemperature: boolean | undefined;
  vacuumAchieved: boolean | undefined;
  coldTrapTemperaturesC: CausalFrame["hardwareDiagnostics"]["coldTrapTemperaturesC"] | undefined;
  condensedWaterKg: CausalFrame["hardwareDiagnostics"]["coldTrapStageCondensedWaterKg"] | undefined;
  materialRemainingKg: number | undefined;
  materialInitialKg: number | undefined;
  ultrasonicActivityIndex: number | undefined;
  ultrasonicEffectivePowerW: number | undefined;
}

export function getProcessMachineVisualState(frame?: CausalFrame): ProcessMachineVisualState {
  if (!frame) return {
    hasFrame: false, stage: undefined, timestampSeconds: undefined, commands: undefined, actuatorLevels: undefined, controlOutput: undefined,
    temperatureC: undefined, pressureMbar: undefined, overTemperature: undefined,
    vacuumAchieved: undefined, coldTrapTemperaturesC: undefined, condensedWaterKg: undefined,
    materialRemainingKg: undefined, materialInitialKg: undefined,
    ultrasonicActivityIndex: undefined, ultrasonicEffectivePowerW: undefined,
  };
  return {
    hasFrame: true,
    stage: frame.safety.stage,
    timestampSeconds: frame.timestampSeconds,
    commands: frame.effectiveCommands,
    actuatorLevels: frame.actuatorLevels,
    controlOutput: frame.controlOutput,
    temperatureC: frame.sensorAfter.temperatureC,
    pressureMbar: frame.sensorAfter.pressureMbar,
    overTemperature: frame.safety.overTemperature,
    vacuumAchieved: frame.safety.vacuumAchieved,
    coldTrapTemperaturesC: frame.hardwareDiagnostics.coldTrapTemperaturesC,
    condensedWaterKg: frame.hardwareDiagnostics.coldTrapStageCondensedWaterKg,
    materialRemainingKg: frame.materialInventory.remainingMassKg,
    materialInitialKg: frame.materialInventory.initialMassKg,
    ultrasonicActivityIndex: frame.ultrasonic.activityIndex,
    ultrasonicEffectivePowerW: frame.ultrasonic.effectivePowerW,
  };
}

export function getProcessMachineActuatorVisualLevels(frame?: CausalFrame) {
  return {
    heater: normalizedLevel(frame?.actuatorLevels.heater),
    vacuumPump: normalizedLevel(frame?.actuatorLevels.vacuumPump),
    extractor: normalizedLevel(frame?.actuatorLevels.extractor),
    condenser: normalizedLevel(frame?.actuatorLevels.condenser),
    cooling: normalizedLevel(frame?.actuatorLevels.cooling),
  };
}

function finite(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function displayNumber(value: number | undefined, digits: number, unit: string) {
  return finite(value) ? `${value.toFixed(digits)} ${unit}` : "UNKNOWN";
}

function setColor(material: THREE.Material, color: number) {
  if (material instanceof THREE.MeshBasicMaterial || material instanceof THREE.MeshStandardMaterial) material.color.setHex(color);
}

function setEmissive(material: THREE.Material, color: number) {
  if (material instanceof THREE.MeshStandardMaterial) material.emissive.setHex(color);
}

function setEmissiveIntensity(material: THREE.Material, color: number, intensity: number) {
  if (material instanceof THREE.MeshStandardMaterial) {
    material.emissive.setHex(color);
    material.emissiveIntensity = Math.max(0, intensity);
  }
}

function normalizedLevel(value: number | undefined) {
  return finite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function blendHex(idle: number, active: number, strength: number) {
  const source = new THREE.Color(idle);
  source.lerp(new THREE.Color(active), Math.max(0, Math.min(1, strength)));
  return source.getHex();
}

function tubeBetween(a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.MeshBasicMaterial) {
  const midpoint = a.clone().add(b).multiplyScalar(0.5);
  const direction = b.clone().sub(a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 12), material);
  mesh.position.copy(midpoint);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

function routedTube(points: THREE.Vector3[], radius: number, material: THREE.MeshBasicMaterial) {
  const group = new THREE.Group();
  for (let i = 0; i < points.length - 1; i += 1) group.add(tubeBetween(points[i], points[i + 1], radius, material));
  return group;
}

function connector(parent: THREE.Object3D, position: THREE.Vector3, radius = 0.14, length = 0.28) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 20),
    new THREE.MeshStandardMaterial({ color: 0x516b83, metalness: 0.9, roughness: 0.18 }),
  );
  mesh.position.copy(position);
  mesh.rotation.z = Math.PI / 2;
  parent.add(mesh);
  return mesh;
}

function createParticles(parent: THREE.Object3D, count: number, color: number) {
  const group = new THREE.Group();
  for (let i = 0; i < count; i += 1) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), new THREE.MeshBasicMaterial({ color }));
    p.userData.offset = i / count;
    group.add(p);
  }
  parent.add(group);
  return group;
}

export function ProcessMachine3D({ frame, onObservabilityEvent }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<CausalFrame | undefined>(frame);
  const sceneRuntimeRef = useRef<{
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    equipment: THREE.Group;
    piping: THREE.Group;
    flow: THREE.Group;
    particle: THREE.Group;
    material: THREE.Group;
    electrical: THREE.Group;
    structure: THREE.Group;
    selectables: Map<ComponentId, THREE.Object3D[]>;
  } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("REALISTIC");
  const [layers, setLayers] = useState<LayerState>(DEFAULT_LAYERS);
  const [selectedComponent, setSelectedComponent] = useState<ComponentId | null>(null);
  const [flowEnabled, setFlowEnabled] = useState(true);
  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const selectedComponentRef = useRef<ComponentId | null>(selectedComponent);
  const flowEnabledRef = useRef(flowEnabled);
  const particlesEnabledRef = useRef(particlesEnabled);
  const viewModeRef = useRef<ViewMode>(viewMode);
  const observabilityRef = useRef(onObservabilityEvent);
  const lastRenderedFrameStep = useRef<number | null>(null);
  selectedComponentRef.current = selectedComponent;
  flowEnabledRef.current = flowEnabled;
  particlesEnabledRef.current = particlesEnabled;
  viewModeRef.current = viewMode;
  observabilityRef.current = onObservabilityEvent;
  frameRef.current = frame;

  const applyPreset = useCallback((preset: CameraPreset) => {
    const runtime = sceneRuntimeRef.current;
    if (!runtime) return;
    const next = CAMERA_PRESETS[preset];
    runtime.camera.position.set(...next.position);
    runtime.controls.target.set(...next.target);
    runtime.controls.update();
    observabilityRef.current?.({ event: "CAMERA_PRESET", result: "SUCCESS", detail: { preset } });
  }, []);

  useEffect(() => {
    const runtime = sceneRuntimeRef.current;
    if (!runtime) return;
    const selectedObjects = selectedComponent ? runtime.selectables.get(selectedComponent) ?? [] : [];
    runtime.selectables.forEach((objects, id) => {
      const active = id === selectedComponent;
      objects.forEach(object => object.traverse(child => {
        if (!(child instanceof THREE.Mesh)) return;
        const material = child.material;
        const apply = (item: THREE.Material) => {
          if (item instanceof THREE.MeshStandardMaterial) {
            item.emissive.setHex(active ? 0xffffff : 0x000000);
            item.emissiveIntensity = active ? 0.62 : item.userData.baseEmissiveIntensity ?? item.emissiveIntensity;
          }
        };
        if (Array.isArray(material)) material.forEach(apply); else apply(material);
      }));
    });
    if (selectedComponent) observabilityRef.current?.({ event: "SELECT_COMPONENT", result: "SUCCESS", componentId: selectedComponent });
    if (selectedObjects.length) {
      applyPreset(COMPONENT_PRESETS[selectedComponent as ComponentId]);
      observabilityRef.current?.({ event: "FOCUS_COMPONENT", result: "SUCCESS", componentId: selectedComponent ?? undefined });
    }
  }, [selectedComponent, applyPreset]);

  useEffect(() => {
    const runtime = sceneRuntimeRef.current;
    if (!runtime) return;
    runtime.equipment.visible = layers.equipment;
    runtime.piping.visible = layers.piping;
    runtime.flow.visible = layers.flow;
    runtime.particle.visible = layers.particle && particlesEnabled;
    runtime.material.visible = layers.material;
    runtime.electrical.visible = layers.electrical;
    runtime.structure.visible = layers.structure;
    observabilityRef.current?.({ event: "LAYER_CHANGE", result: "SUCCESS", detail: { layers } });
  }, [layers, particlesEnabled]);

  useEffect(() => {
    const runtime = sceneRuntimeRef.current;
    if (!runtime) return;
    const xray = viewMode === "X_RAY";
    const wireframe = viewMode === "WIREFRAME";
    runtime.equipment.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const update = (material: THREE.Material) => {
        if (!(material instanceof THREE.MeshStandardMaterial)) return;
        material.wireframe = wireframe;
        material.transparent = xray || material.userData.baseTransparent === true;
        material.opacity = xray ? Math.min(material.userData.baseOpacity ?? 1, 0.22) : material.userData.baseOpacity ?? 1;
      };
      if (Array.isArray(object.material)) object.material.forEach(update); else update(object.material);
    });
    observabilityRef.current?.({ event: "VIEW_MODE_CHANGE", result: "SUCCESS", detail: { viewMode } });
  }, [viewMode]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    observabilityRef.current?.({ event: "THREE_SCENE_INIT", result: "SUCCESS" });
    scene.background = new THREE.Color(0x020712);
    scene.fog = new THREE.FogExp2(0x020712, 0.018);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(11.8, 7.6, 17.5);
    camera.lookAt(0.4, 0.9, -0.3);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);
    observabilityRef.current?.({ event: "THREE_RENDERER_INIT", result: "SUCCESS" });
    const onContextLost = () => observabilityRef.current?.({ event: "WEBGL_ERROR", result: "ERROR", detail: { type: "webglcontextlost" } });
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0.4, 0.9, -0.3);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 6;
    controls.maxDistance = 32;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.update();

    const equipmentLayer = new THREE.Group();
    const pipingLayer = new THREE.Group();
    const flowLayer = new THREE.Group();
    const particleLayer = new THREE.Group();
    const electricalLayer = new THREE.Group();
    const structureLayer = new THREE.Group();
    equipmentLayer.name = "EQUIPMENT";
    pipingLayer.name = "PIPING";
    flowLayer.name = "FLOW";
    particleLayer.name = "PARTICLE";
    electricalLayer.name = "ELECTRICAL";
    structureLayer.name = "STRUCTURE";
    flowLayer.add(particleLayer);
    scene.add(structureLayer, equipmentLayer, pipingLayer, flowLayer, electricalLayer);

    const selectables = new Map<ComponentId, THREE.Object3D[]>();
    const selectableMeshes = new Map<THREE.Object3D, ComponentId>();
    const registerSelectable = (id: ComponentId, object: THREE.Object3D) => {
      const current = selectables.get(id) ?? [];
      current.push(object);
      selectables.set(id, current);
      object.traverse(child => { if (child instanceof THREE.Mesh) selectableMeshes.set(child, id); });
    };

    scene.add(new THREE.HemisphereLight(0x9ee7ff, 0x07111f, 1.5));
    scene.add(new THREE.AmbientLight(0x14324a, 0.42));
    const key = new THREE.PointLight(0x22d3ee, 18, 34);
    key.position.set(-4, 8, 7);
    scene.add(key);
    const fill = new THREE.PointLight(0x2563eb, 7, 30);
    fill.position.set(6, 4, -6);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0x7dd3fc, 2.6);
    rim.position.set(-9, 7, -9);
    scene.add(rim);
    const overhead = new THREE.SpotLight(0xc7f9ff, 30, 28, Math.PI * 0.22, 0.5, 1.5);
    overhead.position.set(1, 14, 4);
    overhead.target.position.set(0, 0, -0.5);
    structureLayer.add(overhead, overhead.target);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(11, 64), new THREE.MeshBasicMaterial({ color: 0x06101c, transparent: true, opacity: 0.94 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.25;
    structureLayer.add(floor);
    const grid = new THREE.GridHelper(20, 20, 0x1e5d7a, 0x0b2637);
    grid.position.y = -2.23;
    grid.material.transparent = true;
    grid.material.opacity = 0.28;
    structureLayer.add(grid);
    const deckRing = new THREE.Mesh(new THREE.RingGeometry(8.5, 8.56, 96), new THREE.MeshBasicMaterial({ color: 0x1d84a8, transparent: true, opacity: 0.32, side: THREE.DoubleSide }));
    deckRing.rotation.x = -Math.PI / 2;
    deckRing.position.y = -2.2;
    structureLayer.add(deckRing);
    const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x102237, metalness: 0.78, roughness: 0.3 });
    const railingMaterial = new THREE.MeshStandardMaterial({ color: 0x3d6680, metalness: 0.86, roughness: 0.2 });
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(8.35, 8.35, 0.24, 96), platformMaterial);
    platform.position.y = -2.34;
    structureLayer.add(platform);
    const maintenanceDeck = new THREE.Mesh(new THREE.BoxGeometry(5.35, 0.13, 2.1), platformMaterial);
    maintenanceDeck.position.set(-1.05, -2.05, 2.75);
    structureLayer.add(maintenanceDeck);
    [-3.55, -1.85, -0.15, 1.55, 3.25].forEach(x => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.85, 10), railingMaterial);
      post.position.set(x, -1.63, 3.67);
      structureLayer.add(post);
    });
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(7.1, 0.05, 0.05), railingMaterial);
    topRail.position.set(-0.15, -1.22, 3.67);
    structureLayer.add(topRail);
    [-7.5, 7.5].forEach(x => {
      const column = new THREE.Mesh(new THREE.BoxGeometry(0.22, 6.9, 0.22), railingMaterial);
      column.position.set(x, 1.15, -4.8);
      structureLayer.add(column);
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), new THREE.MeshStandardMaterial({ color: 0x164e63, emissive: 0x22d3ee, emissiveIntensity: 0.7 }));
      beacon.position.set(x, 4.67, -4.8);
      structureLayer.add(beacon);
    });

    // -----------------------------------------------------------------------
    // AUTHORITATIVE VISUAL TOPOLOGY
    // Every process/utilities path terminates at an explicit connector.
    // No path is allowed to end in free space or pass through a component body.
    // -----------------------------------------------------------------------
    const reactor = new THREE.Group();
    reactor.position.set(-4.1, 0.55, 0);
    equipmentLayer.add(reactor);
    reactor.add(new THREE.Mesh(
      new THREE.CylinderGeometry(1.72, 1.72, 4.85, 48),
      new THREE.MeshStandardMaterial({ color: 0x18283b, metalness: 0.84, roughness: 0.2 }),
    ));
    const chamber = new THREE.Mesh(
      new THREE.CylinderGeometry(1.28, 1.28, 3.92, 48),
      new THREE.MeshStandardMaterial({ color: 0x0a1726, metalness: 0.25, roughness: 0.12, transparent: true, opacity: 0.56, emissive: 0x07334a }),
    );
    reactor.add(chamber);
    const stageBand = new THREE.Mesh(new THREE.TorusGeometry(1.36, 0.045, 10, 48), new THREE.MeshBasicMaterial({ color: 0x334155 }));
    stageBand.rotation.x = Math.PI / 2;
    stageBand.position.y = 1.9;
    reactor.add(stageBand);
    const materialLayer = new THREE.Group();
    reactor.add(materialLayer);
    const materialZone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.96, 0.96, 2.5, 36),
      new THREE.MeshStandardMaterial({ color: 0x7c3aed, metalness: 0.05, roughness: 0.4, transparent: true, opacity: 0.2, emissive: 0x2e1065 }),
    );
    materialZone.position.y = -0.25;
    materialLayer.add(materialZone);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.79, 1.79, 0.3, 48), new THREE.MeshStandardMaterial({ color: 0x25374c, metalness: 0.9, roughness: 0.18 }));
    top.position.y = 2.46;
    reactor.add(top);
    const bottom = top.clone();
    bottom.position.y = -2.46;
    reactor.add(bottom);
    for (let index = 0; index < 12; index += 1) {
      const angle = (index / 12) * Math.PI * 2;
      [-1, 1].forEach(side => {
        const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 12), new THREE.MeshStandardMaterial({ color: 0x6b8ca4, metalness: 0.95, roughness: 0.14 }));
        bolt.rotation.x = Math.PI / 2;
        bolt.position.set(Math.cos(angle) * 1.54, side * 2.63, Math.sin(angle) * 1.54);
        reactor.add(bolt);
      });
    }
    [-1.25, 0, 1.25].forEach(y => {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(1.76, 0.035, 8, 48), new THREE.MeshStandardMaterial({ color: 0x34516c, metalness: 0.92, roughness: 0.16 }));
      rib.rotation.x = Math.PI / 2;
      rib.position.y = y;
      reactor.add(rib);
    });
    [-1, 1].forEach(x => {
      const support = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.9, 0.22), new THREE.MeshStandardMaterial({ color: 0x27435d, metalness: 0.84, roughness: 0.22 }));
      support.position.set(x * 1.28, -2.9, 0.62);
      reactor.add(support);
    });

    const heaterRing = new THREE.Mesh(new THREE.TorusGeometry(1.51, 0.09, 12, 48), new THREE.MeshStandardMaterial({ color: 0x334155, emissive: 0x000000, emissiveIntensity: 0 }));
    heaterRing.rotation.x = Math.PI / 2;
    heaterRing.position.y = 1.04;
    reactor.add(heaterRing);

    const ultrasonic = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.58, 24), new THREE.MeshStandardMaterial({ color: 0x334155, emissive: 0x000000, emissiveIntensity: 0 }));
    ultrasonic.position.y = -1.68;
    reactor.add(ultrasonic);

    // Process connectors are defined in world coordinates so routes can be checked.
    const reactorVapor = new THREE.Vector3(-2.72, 3.01, 0);
    const reactorVacuum = new THREE.Vector3(-2.38, 0.55, 0.58);
    const heaterPower = new THREE.Vector3(-4.1, 1.59, 1.58);
    const ultrasonicPower = new THREE.Vector3(-4.1, -1.13, 1.58);
    connector(pipingLayer, reactorVapor, 0.16, 0.34);
    connector(pipingLayer, reactorVacuum, 0.12, 0.3);
    connector(electricalLayer, heaterPower, 0.08, 0.24);
    connector(electricalLayer, ultrasonicPower, 0.08, 0.24);

    const pump = new THREE.Group();
    pump.position.set(4.7, -0.55, 1.55);
    equipmentLayer.add(pump);
    pump.add(new THREE.Mesh(new THREE.BoxGeometry(2.25, 1.5, 1.58), new THREE.MeshStandardMaterial({ color: 0x172033, metalness: 0.86, roughness: 0.24 })));
    const pumpRotor = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.16, 32), new THREE.MeshStandardMaterial({ color: 0x334155, emissive: 0x000000, emissiveIntensity: 0 }));
    pumpRotor.rotation.z = Math.PI / 2;
    pumpRotor.position.x = -1.07;
    pump.add(pumpRotor);
    const pumpInletLocal = new THREE.Vector3(-1.25, 0, 0);
    const pumpInlet = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.28, 24), new THREE.MeshStandardMaterial({ color: 0x263b52, metalness: 0.85, roughness: 0.2 }));
    pumpInlet.rotation.z = Math.PI / 2;
    pumpInlet.position.copy(pumpInletLocal);
    pump.add(pumpInlet);
    const pumpSkid = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.16, 2.08), new THREE.MeshStandardMaterial({ color: 0x203149, metalness: 0.78, roughness: 0.25 }));
    pumpSkid.position.set(0, -0.87, 0);
    pump.add(pumpSkid);
    const motorShroud = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.94, 32), new THREE.MeshStandardMaterial({ color: 0x263b52, metalness: 0.84, roughness: 0.18 }));
    motorShroud.rotation.z = Math.PI / 2;
    motorShroud.position.set(0.46, 0.18, 0);
    pump.add(motorShroud);
    [-0.08, 0.16, 0.4, 0.64, 0.88].forEach(x => {
      const fin = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.022, 8, 24), new THREE.MeshStandardMaterial({ color: 0x486b83, metalness: 0.88, roughness: 0.16 }));
      fin.rotation.y = Math.PI / 2;
      fin.position.set(x, 0.18, 0);
      pump.add(fin);
    });
    const pumpInletWorld = pumpInletLocal.clone().add(pump.position);
    const pumpPowerWorld = new THREE.Vector3(5.82, -1.3, 2.35);
    connector(electricalLayer, pumpPowerWorld, 0.08, 0.24);

    const trapGroups: THREE.Group[] = [];
    const trapBodies: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>[] = [];
    const trapCoils: THREE.Mesh<THREE.TorusGeometry, THREE.MeshStandardMaterial>[] = [];
    const trapInlets: THREE.Vector3[] = [];
    const trapOutlets: THREE.Vector3[] = [];
    const trapCoolingInlets: THREE.Vector3[] = [];
    const trapCoolingOutlets: THREE.Vector3[] = [];
    const trapIndicators: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>[] = [];

    for (let i = 0; i < 4; i += 1) {
      const group = new THREE.Group();
      group.position.set(-1.9 + i * 2.45, 3.35, -1.55);
      equipmentLayer.add(group);
      trapGroups.push(group);

      const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 1.95, 32), new THREE.MeshStandardMaterial({ color: 0x15243a, metalness: 0.72, roughness: 0.24, transparent: true, opacity: 0.8, emissive: 0x061522 }));
      group.add(shell);
      trapBodies.push(shell);

      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.065, 10, 32), new THREE.MeshStandardMaterial({ color: 0x334155, emissive: 0x000000, emissiveIntensity: 0 }));
      coil.rotation.x = Math.PI / 2;
      coil.position.y = -0.15;
      group.add(coil);
      trapCoils.push(coil);

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.12, 32), new THREE.MeshStandardMaterial({ color: 0x203149, metalness: 0.85, roughness: 0.2 }));
      base.position.y = -1.04;
      group.add(base);
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.57, 0.57, 0.11, 28), new THREE.MeshStandardMaterial({ color: 0x365872, metalness: 0.9, roughness: 0.16 }));
      crown.position.y = 1.02;
      group.add(crown);

      const inlet = new THREE.Vector3(group.position.x - 0.84, group.position.y, group.position.z);
      const outlet = new THREE.Vector3(group.position.x + 0.84, group.position.y, group.position.z);
      const coolingIn = new THREE.Vector3(group.position.x - 0.84, group.position.y - 0.68, group.position.z - 0.08);
      const coolingOut = new THREE.Vector3(group.position.x + 0.84, group.position.y - 0.68, group.position.z - 0.08);
      trapInlets.push(inlet);
      trapOutlets.push(outlet);
      trapCoolingInlets.push(coolingIn);
      trapCoolingOutlets.push(coolingOut);
      connector(pipingLayer, inlet);
      connector(pipingLayer, outlet);
      connector(pipingLayer, coolingIn, 0.08, 0.2);
      connector(pipingLayer, coolingOut, 0.08, 0.2);

      const indicator = new THREE.Mesh(new THREE.RingGeometry(0.82, 0.9, 32), new THREE.MeshBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
      indicator.rotation.x = Math.PI / 2;
      indicator.position.y = 1.02;
      group.add(indicator);
      trapIndicators.push(indicator);
    }
    const condenserRack = new THREE.Group();
    const rackMaterial = new THREE.MeshStandardMaterial({ color: 0x27435d, metalness: 0.82, roughness: 0.22 });
    const rackBeam = new THREE.Mesh(new THREE.BoxGeometry(10.1, 0.14, 0.42), rackMaterial);
    rackBeam.position.set(1.78, 2.13, -1.55);
    condenserRack.add(rackBeam);
    [0, 3].forEach(index => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.15, 0.3), rackMaterial);
      leg.position.set(trapGroups[index].position.x, 1.58, -1.55);
      condenserRack.add(leg);
    });
    equipmentLayer.add(condenserRack);

    // --------------------------- PROCESS GAS PATH --------------------------
    const vacuumMaterial = new THREE.MeshBasicMaterial({ color: 0x164e63 });
    const vaporMaterial = new THREE.MeshBasicMaterial({ color: 0x155e75 });
    const coolingMaterial = new THREE.MeshBasicMaterial({ color: 0x1e3a5f });
    const powerMaterial = new THREE.MeshBasicMaterial({ color: 0x334155 });

    const vaporPaths: THREE.Vector3[][] = [];
    vaporPaths.push([
      reactorVapor,
      new THREE.Vector3(-2.72, 3.35, -0.55),
      new THREE.Vector3(trapInlets[0].x, 3.35, -1.55),
      trapInlets[0],
    ]);
    for (let i = 0; i < 3; i += 1) {
      vaporPaths.push([
        trapOutlets[i],
        new THREE.Vector3(trapOutlets[i].x + 0.35, trapOutlets[i].y, trapOutlets[i].z),
        new THREE.Vector3(trapInlets[i + 1].x - 0.35, trapInlets[i + 1].y, trapInlets[i + 1].z),
        trapInlets[i + 1],
      ]);
    }
    vaporPaths.push([
      trapOutlets[3],
      new THREE.Vector3(6.0, trapOutlets[3].y, trapOutlets[3].z),
      new THREE.Vector3(6.0, pumpInletWorld.y, pumpInletWorld.z),
      pumpInletWorld,
    ]);
    const vaporPipeLayer = new THREE.Group();
    pipingLayer.add(vaporPipeLayer);
    vaporPaths.forEach(path => vaporPipeLayer.add(routedTube(path, 0.088, vaporMaterial)));

    // Vacuum is the same sealed process manifold, but its authoritative terminal is
    // the pump inlet. It is rendered as a separate state highlight, not a second pipe.
    const vacuumPath: THREE.Vector3[] = [
      reactorVacuum,
      new THREE.Vector3(-1.55, reactorVacuum.y, reactorVacuum.z),
      new THREE.Vector3(1.0, pumpInletWorld.y, pumpInletWorld.z),
      pumpInletWorld,
    ];
    const vacuumPipeLayer = new THREE.Group();
    pipingLayer.add(vacuumPipeLayer);
    vacuumPipeLayer.add(routedTube(vacuumPath, 0.1, vacuumMaterial));

    // ----------------------------- COOLING LOOP -----------------------------
    // A real closed utility loop: manifold -> each trap inlet -> outlet -> return.
    const coolingSupply = new THREE.Vector3(6.45, 1.95, -2.5);
    const coolingReturn = new THREE.Vector3(6.45, 0.95, -2.5);
    connector(pipingLayer, coolingSupply, 0.08, 0.24);
    connector(pipingLayer, coolingReturn, 0.08, 0.24);
    const coolingPipeLayer = new THREE.Group();
    pipingLayer.add(coolingPipeLayer);
    for (let i = 0; i < 4; i += 1) {
      coolingPipeLayer.add(routedTube([
        coolingSupply,
        new THREE.Vector3(6.45, coolingInletsY(i), -2.5),
        new THREE.Vector3(trapCoolingInlets[i].x, trapCoolingInlets[i].y, -2.5),
        trapCoolingInlets[i],
      ], 0.062, coolingMaterial));
      coolingPipeLayer.add(routedTube([
        trapCoolingOutlets[i],
        new THREE.Vector3(trapCoolingOutlets[i].x, trapCoolingOutlets[i].y, -2.5),
        new THREE.Vector3(6.9, trapCoolingOutlets[i].y, -2.5),
        coolingReturn,
      ], 0.062, coolingMaterial));
    }

    // ---------------------------- ELECTRICAL BUS ----------------------------
    const powerBus = new THREE.Vector3(6.2, -1.7, 2.8);
    connector(electricalLayer, powerBus, 0.1, 0.3);
    electricalLayer.add(routedTube([powerBus, new THREE.Vector3(1.8, -1.7, 2.8), pumpPowerWorld], 0.036, powerMaterial));
    electricalLayer.add(routedTube([powerBus, new THREE.Vector3(-1.0, -1.7, 2.8), heaterPower], 0.036, powerMaterial));
    electricalLayer.add(routedTube([powerBus, new THREE.Vector3(-2.0, -1.7, 2.8), ultrasonicPower], 0.036, powerMaterial));

    const vacuumParticles = createParticles(particleLayer, 14, 0x22d3ee);
    const vaporParticles = createParticles(particleLayer, 18, 0xfbbf24);
    const coolingParticles = createParticles(particleLayer, 16, 0x60a5fa);
    const powerParticles = createParticles(particleLayer, 10, 0xf59e0b);
    const chamberParticles = createParticles(particleLayer, 32, 0x67e8f9);

    registerSelectable("REACTOR", reactor);
    registerSelectable("HEATER", heaterRing);
    registerSelectable("ULTRASONIC", ultrasonic);
    registerSelectable("VACUUM_PUMP", pump);
    registerSelectable("EXTRACTOR", vaporPipeLayer);
    trapGroups.forEach(trap => registerSelectable("CONDENSER", trap));
    registerSelectable("COOLING", coolingPipeLayer);
    trapGroups.forEach((trap, index) => registerSelectable((`COLD_TRAP_${index + 1}` as ComponentId), trap));
    registerSelectable("VAPOR_PIPE", vaporPipeLayer);
    registerSelectable("VACUUM_PIPE", vacuumPipeLayer);
    registerSelectable("COOLING_PIPE", coolingPipeLayer);

    // Fixed utility point used only to make the four cooling branches evenly routed.
    function coolingInletsY(index: number) { return 1.0 + index * 0.35; }

    equipmentLayer.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const remember = (material: THREE.Material) => {
        if (!(material instanceof THREE.MeshStandardMaterial)) return;
        material.userData.baseOpacity = material.opacity;
        material.userData.baseTransparent = material.transparent;
        material.userData.baseEmissiveIntensity = material.emissiveIntensity;
      };
      if (Array.isArray(object.material)) object.material.forEach(remember); else remember(object.material);
    });

    sceneRuntimeRef.current = {
      camera,
      controls,
      equipment: equipmentLayer,
      piping: pipingLayer,
      flow: flowLayer,
      particle: particleLayer,
      material: materialLayer,
      electrical: electricalLayer,
      structure: structureLayer,
      selectables,
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerStart: { x: number; y: number } | null = null;
    const onPointerDown = (event: PointerEvent) => { pointerStart = { x: event.clientX, y: event.clientY }; };
    const onPointerUp = (event: PointerEvent) => {
      if (!pointerStart || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const intersection = raycaster.intersectObjects([...selectableMeshes.keys()], false)[0];
      const id = intersection ? selectableMeshes.get(intersection.object) ?? null : null;
      setSelectedComponent(id);
      pointerStart = null;
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    let raf = 0;
    let resizeObserver: ResizeObserver | undefined;
    const resize = () => {
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    if (typeof ResizeObserver !== "undefined") { resizeObserver = new ResizeObserver(resize); resizeObserver.observe(mount); }
    else window.addEventListener("resize", resize);
    resize();

    const updateParticles = (group: THREE.Group, points: THREE.Vector3[], active: boolean, time: number, speed: number, scale = 1) => {
      const curve = new THREE.CatmullRomCurve3(points);
      group.children.forEach(child => {
        const p = child as THREE.Mesh;
        const offset = p.userData.offset as number;
        const t = active ? (time * speed + offset) % 1 : 0;
        p.visible = active;
        if (active) p.position.copy(curve.getPointAt(t));
        p.scale.setScalar(active ? scale : 0);
      });
    };

    const animate = () => {
      const visual = getProcessMachineVisualState(frameRef.current);
      const currentFrame = frameRef.current;
      if (currentFrame && currentFrame.step !== lastRenderedFrameStep.current) {
        lastRenderedFrameStep.current = currentFrame.step;
        observabilityRef.current?.({ event: "FRAME_RENDERED", result: "INFO", frameRef: { step: currentFrame.step, timestampSeconds: currentFrame.timestampSeconds, provenance: "SIMULATION" } });
      }
      const commands = visual.commands;
      const time = finite(visual.timestampSeconds) ? visual.timestampSeconds! : 0;
      const actuatorVisualLevels = getProcessMachineActuatorVisualLevels(frameRef.current);
      const heaterLevel = actuatorVisualLevels.heater;
      const vacuumActuatorLevel = actuatorVisualLevels.vacuumPump;
      const extractorLevel = actuatorVisualLevels.extractor;
      const condenserLevel = actuatorVisualLevels.condenser;
      const coolingLevel = actuatorVisualLevels.cooling;
      const hot = commands?.heater === true;
      const vacuum = commands?.vacuumPump === true;
      const extracting = commands?.extractor === true;
      const condensing = commands?.condenser === true;
      const cooling = commands?.cooling === true;
      const fault = visual.overTemperature === true;
      const active = Boolean(commands) && finite(visual.timestampSeconds);
      const thermal = finite(visual.temperatureC) ? Math.max(0, Math.min(1, (visual.temperatureC! - 25) / 125)) : 0;
      const vacuumLevel = finite(visual.pressureMbar) ? Math.max(0, Math.min(1, 1 - visual.pressureMbar! / 1013.25)) : 0;
      const ultrasonicActivity = finite(visual.ultrasonicActivityIndex) ? Math.max(0, Math.min(1, visual.ultrasonicActivityIndex!)) : 0;
      const ultrasonicOn = finite(visual.ultrasonicEffectivePowerW) ? visual.ultrasonicEffectivePowerW! > 0 : ultrasonicActivity > 0;
      const processAnimationEnabled = flowEnabledRef.current;
      const particlesAllowed = particlesEnabledRef.current;

      const stageColor = fault ? 0xef4444 : visual.stage === "CONDENSATION" ? 0x38bdf8 : visual.stage === "EXTRACTION" ? 0xfbbf24 : visual.stage === "HEAT_UP" ? 0xf97316 : visual.hasFrame ? 0x22d3ee : 0x334155;
      setColor(stageBand.material, stageColor);
      setColor(heaterRing.material, fault ? 0xef4444 : blendHex(0x334155, 0xf97316, heaterLevel));
      setEmissiveIntensity(heaterRing.material, fault ? 0x7f1d1d : 0xf97316, fault ? 1.6 : heaterLevel * 2.8);
      setEmissiveIntensity(chamber.material, fault ? 0x5f1111 : 0xf97316, fault ? 0.85 : heaterLevel * 0.28);
      setColor(ultrasonic.material, blendHex(0x334155, 0x8b5cf6, ultrasonicActivity));
      setEmissiveIntensity(ultrasonic.material, 0x8b5cf6, ultrasonicActivity * 1.7);
      key.color.setHex(fault ? 0xef4444 : blendHex(0x22d3ee, 0xfb923c, heaterLevel));
      key.intensity = fault ? 18 : 12 + heaterLevel * 22;
      setColor(pumpRotor.material, blendHex(0x334155, 0x22d3ee, vacuumActuatorLevel));
      setEmissiveIntensity(pumpRotor.material, 0x22d3ee, vacuumActuatorLevel * 1.3);
      setColor(vacuumMaterial, blendHex(0x164e63, 0x22d3ee, vacuumActuatorLevel));
      setColor(vaporMaterial, blendHex(0x155e75, 0x38bdf8, Math.max(extractorLevel, condenserLevel)));
      setColor(coolingMaterial, blendHex(0x1e3a5f, 0x60a5fa, coolingLevel));
      setColor(powerMaterial, blendHex(0x334155, 0xf59e0b, Math.max(heaterLevel, vacuumActuatorLevel, ultrasonicActivity)));

      pumpRotor.rotation.x = vacuumActuatorLevel > 0 ? time * (2 + vacuumActuatorLevel * 20) : 0;
      reactor.rotation.y = active ? Math.sin(time * 0.35) * 0.02 : 0;
      const materialFraction = finite(visual.materialInitialKg) && finite(visual.materialRemainingKg) && visual.materialInitialKg! > 0
        ? Math.max(0, Math.min(1, visual.materialRemainingKg! / visual.materialInitialKg!)) : undefined;
      materialZone.visible = materialFraction !== undefined && materialFraction > 0;
      if (materialFraction !== undefined) {
        materialZone.scale.y = 0.25 + materialFraction * 0.75;
        (materialZone.material as THREE.MeshStandardMaterial).opacity = viewModeRef.current === "X_RAY" ? Math.min(0.22, 0.08 + materialFraction * 0.22) : 0.08 + materialFraction * 0.22;
      } else {
        (materialZone.material as THREE.MeshStandardMaterial).opacity = 0;
      }
      ultrasonic.scale.setScalar(1 + ultrasonicActivity * 0.2);

      trapGroups.forEach((group, index) => {
        const trapTemperature = visual.coldTrapTemperaturesC?.[index];
        const condensate = visual.condensedWaterKg?.[index];
        const hasTemperature = finite(trapTemperature);
        const hasCondensate = finite(condensate) && condensate! > 0;
        const coldFactor = hasTemperature ? Math.max(0, Math.min(1, (25 - trapTemperature!) / 105)) : 0;
        const trapActivity = Math.max(condenserLevel, coolingLevel);
        setEmissiveIntensity(trapBodies[index].material, hasTemperature && trapActivity > 0 ? (coldFactor > 0.65 ? 0x082f49 : 0x10243a) : 0x061522, trapActivity * (hasTemperature ? 0.8 : 0));
        setColor(trapCoils[index].material, hasTemperature ? blendHex(0x334155, coldFactor > 0.65 ? 0x60a5fa : 0x38bdf8, trapActivity) : 0x334155);
        setEmissiveIntensity(trapCoils[index].material, coldFactor > 0.65 ? 0x60a5fa : 0x38bdf8, trapActivity * 1.35);
        setColor(trapIndicators[index].material, hasCondensate ? 0x38bdf8 : hasTemperature ? 0x2563eb : 0x334155);
        trapIndicators[index].material.opacity = hasCondensate ? 0.9 : hasTemperature ? 0.7 : 0.45;
        group.position.y = 3.35 + (active ? Math.sin(time * 0.5 + index) * 0.015 : 0);
      });

      updateParticles(vacuumParticles, vacuumPath, particlesAllowed && processAnimationEnabled && vacuumActuatorLevel > 0, time, 0.05 + vacuumActuatorLevel * 0.22, 0.3 + vacuumActuatorLevel * (0.7 + vacuumLevel * 0.35));
      updateParticles(vaporParticles, vaporPaths[0], particlesAllowed && processAnimationEnabled && Math.max(extractorLevel, condenserLevel) > 0, time, 0.03 + Math.max(extractorLevel, condenserLevel) * 0.14, 0.3 + Math.max(extractorLevel, condenserLevel) * (0.5 + thermal * 0.3));
      updateParticles(coolingParticles, [coolingSupply, trapCoolingInlets[0], trapCoolingOutlets[0], coolingReturn], particlesAllowed && processAnimationEnabled && coolingLevel > 0, time, 0.03 + coolingLevel * 0.16, 0.25 + coolingLevel * 0.65);
      updateParticles(powerParticles, [powerBus, heaterPower], particlesAllowed && processAnimationEnabled && Math.max(heaterLevel, vacuumActuatorLevel, ultrasonicActivity) > 0, time, 0.04 + Math.max(heaterLevel, vacuumActuatorLevel, ultrasonicActivity) * 0.2, 0.25 + Math.max(heaterLevel, vacuumActuatorLevel, ultrasonicActivity) * 0.55);

      chamberParticles.children.forEach((child, index) => {
        const p = child as THREE.Mesh;
        const visible = particlesAllowed && processAnimationEnabled && active && finite(visual.pressureMbar) && (vacuum || extracting || hot);
        const offset = p.userData.offset as number;
        const t = visible ? (time * (vacuum || extracting ? 0.09 : 0.015) + offset) % 1 : 0;
        p.visible = visible;
        p.position.set(-1.0 + t * 1.9, -1.35 + ((index * 0.47) % 2.7), 0.4 + Math.sin(index * 1.7 + time) * 0.5);
        p.scale.setScalar(visible ? 0.45 + vacuumLevel * 0.9 + thermal * 0.5 : 0);
      });

      const selected = selectedComponentRef.current;
      if (selected) {
        (selectables.get(selected) ?? []).forEach(object => object.traverse(child => {
          if (!(child instanceof THREE.Mesh)) return;
          const apply = (material: THREE.Material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
              material.emissive.lerp(new THREE.Color(0xffffff), 0.35);
              material.emissiveIntensity = Math.max(material.emissiveIntensity, 0.75);
            }
          };
          if (Array.isArray(child.material)) child.material.forEach(apply); else apply(child.material);
        }));
      }
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      resizeObserver?.disconnect();
      if (!resizeObserver) window.removeEventListener("resize", resize);
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        if (!geometries.has(object.geometry)) { geometries.add(object.geometry); object.geometry.dispose(); }
        const material = object.material;
        if (Array.isArray(material)) material.forEach(item => { if (!materials.has(item)) { materials.add(item); item.dispose(); } });
        else if (!materials.has(material)) { materials.add(material); material.dispose(); }
      });
      controls.dispose();
      renderer.dispose();
      if (sceneRuntimeRef.current?.camera === camera) sceneRuntimeRef.current = null;
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      observabilityRef.current?.({ event: "THREE_DISPOSE", result: "SUCCESS" });
    };
  }, []);

  const visual = getProcessMachineVisualState(frame);
  const commands = visual.commands;
  const fault = visual.overTemperature === true;
  const hasFrame = visual.hasFrame;
  const connection = (active: boolean) => active ? "text-emerald-300" : "text-slate-600";
  const actuatorFor = (component: ComponentId | null) => {
    if (!component) return undefined;
    if (component === "HEATER") return visual.actuatorLevels?.heater;
    if (component === "VACUUM_PUMP" || component === "VACUUM_PIPE") return visual.actuatorLevels?.vacuumPump;
    if (component === "EXTRACTOR" || component === "VAPOR_PIPE") return visual.actuatorLevels?.extractor;
    if (component === "CONDENSER" || component.startsWith("COLD_TRAP")) return visual.actuatorLevels?.condenser;
    if (component === "COOLING" || component === "COOLING_PIPE") return visual.actuatorLevels?.cooling;
    return undefined;
  };
  const commandFor = (component: ComponentId | null) => {
    if (!component) return undefined;
    if (component === "HEATER") return commands?.heater;
    if (component === "VACUUM_PUMP" || component === "VACUUM_PIPE") return commands?.vacuumPump;
    if (component === "EXTRACTOR" || component === "VAPOR_PIPE") return commands?.extractor;
    if (component === "CONDENSER" || component.startsWith("COLD_TRAP")) return commands?.condenser;
    if (component === "COOLING" || component === "COOLING_PIPE") return commands?.cooling;
    return undefined;
  };
  const trapIndex = selectedComponent?.startsWith("COLD_TRAP_") ? Number(selectedComponent.at(-1)) - 1 : undefined;
  const selectedSensor = trapIndex !== undefined
    ? displayNumber(visual.coldTrapTemperaturesC?.[trapIndex], 1, "°C")
    : selectedComponent === "VACUUM_PUMP" || selectedComponent === "VACUUM_PIPE"
      ? displayNumber(visual.pressureMbar, 1, "mbar")
      : displayNumber(visual.temperatureC, 1, "°C");
  const toggleLayer = (key: LayerKey) => setLayers(previous => ({ ...previous, [key]: !previous[key] }));

  return (
    <div className="relative h-[660px] overflow-hidden rounded-2xl border border-cyan-400/25 bg-slate-950/90 shadow-[0_28px_90px_rgba(2,132,199,0.16)]">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_15%,rgba(34,211,238,0.08),transparent_34%),radial-gradient(circle_at_76%_70%,rgba(59,130,246,0.08),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-slate-950/95 via-slate-950/70 to-transparent p-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.25em] text-cyan-300"><span className={`h-2 w-2 rounded-full shadow-[0_0_12px_currentColor] ${fault ? "bg-red-400 text-red-400" : hasFrame ? "bg-emerald-400 text-emerald-400" : "bg-slate-500 text-slate-500"}`} />3D PROCESS MACHINE</div>
          <div className="mt-1 text-[10px] text-slate-500">CAUSAL FRAME → AUTHORITATIVE PHYSICAL TOPOLOGY</div>
          <div className="mt-2 flex flex-wrap gap-1 font-mono text-[7px] tracking-[0.12em]">
            <span className="rounded border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 text-violet-200">SIMULATION / FRAME</span>
            <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-amber-200">DERIVED / FLOW ACTIVITY</span>
            <span className="rounded border border-slate-700 bg-slate-900/70 px-1.5 py-0.5 text-slate-400">MEASURED / NOT LOADED</span>
            <span className="rounded border border-slate-700 bg-slate-900/70 px-1.5 py-0.5 text-slate-500">UNKNOWN / DATA GAP</span>
          </div>
        </div>
        <div className={`rounded-lg border px-3 py-2 font-mono text-[9px] shadow-lg ${fault ? "border-red-500/30 bg-red-500/10 text-red-300" : hasFrame ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300" : "border-slate-700 bg-slate-950/80 text-slate-500"}`}><div className="text-[7px] tracking-[0.14em] opacity-70">AUTHORITATIVE STATUS</div><div className="mt-1">{fault ? "SAFETY TRIP" : hasFrame ? visual.stage : "UNKNOWN / NO FRAME"}</div></div>
      </div>

      {layers.label && <div className="pointer-events-none absolute left-4 top-28 space-y-1.5 font-mono text-[9px]">
        <div className="rounded border border-white/10 bg-slate-950/75 px-2 py-1 text-slate-300 shadow-lg">01 / REACTOR + CHAMBER</div>
        <div className="rounded border border-white/10 bg-slate-950/75 px-2 py-1 text-slate-400">02 / VAPOR → TRAP 1 → TRAP 2 → TRAP 3 → TRAP 4</div>
        <div className="rounded border border-white/10 bg-slate-950/75 px-2 py-1 text-slate-400">03 / TRAP 4 → VACUUM PUMP</div>
        <div className="rounded border border-white/10 bg-slate-950/75 px-2 py-1 text-slate-400">04 / COOLING SUPPLY → TRAPS → RETURN</div>
        <div className="rounded border border-amber-500/20 bg-amber-500/5 px-2 py-1 text-amber-200">FLOW ANIMATION = DERIVED ACTIVITY</div>
      </div>}

      {layers.diagnostics && <div className="pointer-events-none absolute right-4 top-20 rounded-xl border border-white/10 bg-slate-950/85 p-3 font-mono text-[9px] shadow-xl backdrop-blur">
        <div className="mb-2 text-[8px] tracking-[0.2em] text-slate-500">EFFECTIVE CONNECTIONS</div>
        <div className="space-y-1.5 text-slate-400">
          <div><span className={connection(Boolean(commands?.vacuumPump))}>●</span> VACUUM → PUMP INLET</div>
          <div><span className={connection(Boolean(commands?.extractor || commands?.condenser))}>●</span> VAPOR → COLD TRAPS</div>
          <div><span className={connection(Boolean(commands?.cooling))}>●</span> COOLING LOOP</div>
          <div><span className={connection(Boolean(commands?.heater))}>●</span> POWER → HEATER</div>
          <div><span className={connection(Boolean(commands?.vacuumPump))}>●</span> POWER → PUMP</div>
          <div><span className={connection(Boolean(visual.ultrasonicEffectivePowerW && visual.ultrasonicEffectivePowerW > 0))}>●</span> POWER → ULTRASONIC</div>
        </div>
        <div className="mt-2 border-t border-white/10 pt-2 text-[8px] text-slate-600">VISUAL PATHS TERMINATE AT EXPLICIT CONNECTORS. STRUCTURE LAYER IS VISUAL ONLY.</div>
      </div>}

      <div className="pointer-events-auto absolute right-4 top-48 w-52 rounded-xl border border-cyan-500/20 bg-slate-950/90 p-3 font-mono text-[9px] shadow-xl backdrop-blur">
        <div className="mb-2 text-[8px] tracking-[0.2em] text-cyan-300">3D NAVIGATION</div>
        <div className="grid grid-cols-3 gap-1">
          {(["DEFAULT", "FRONT", "TOP", "LEFT", "RIGHT", "PROCESS_PATH", "REACTOR", "COLD_TRAPS", "VACUUM", "COOLING"] as CameraPreset[]).map(preset => <button key={preset} onClick={() => applyPreset(preset)} className="rounded border border-slate-700 px-1 py-1 text-[7px] text-slate-300 hover:border-cyan-400 hover:text-cyan-200">{preset.replace("_", " ")}</button>)}
        </div>
        <button onClick={() => { setSelectedComponent(null); applyPreset("DEFAULT"); observabilityRef.current?.({ event: "RESET_VIEW", result: "SUCCESS" }); }} className="mt-2 w-full rounded border border-cyan-500/30 px-2 py-1 text-cyan-200 hover:bg-cyan-500/10">RESET VIEW</button>
        <div className="mt-3 text-[8px] tracking-[0.2em] text-slate-500">VIEW MODE</div>
        <div className="mt-1 grid grid-cols-3 gap-1">{(["REALISTIC", "X_RAY", "WIREFRAME"] as ViewMode[]).map(mode => <button key={mode} onClick={() => setViewMode(mode)} className={`rounded border px-1 py-1 text-[7px] ${viewMode === mode ? "border-cyan-400 bg-cyan-500/15 text-cyan-200" : "border-slate-700 text-slate-400"}`}>{mode.replace("_", " ")}</button>)}</div>
        <div className="mt-3 text-[8px] tracking-[0.2em] text-slate-500">VISUAL LAYERS</div>
        <div className="mt-1 grid grid-cols-2 gap-1">{(Object.keys(layers) as LayerKey[]).map(key => <button key={key} onClick={() => toggleLayer(key)} className={`rounded border px-1 py-1 text-[7px] ${layers[key] ? "border-emerald-500/35 text-emerald-200" : "border-slate-700 text-slate-500"}`}>{key.toUpperCase()}</button>)}</div>
        <div className="mt-2 grid grid-cols-2 gap-1"><button onClick={() => { setFlowEnabled(value => !value); observabilityRef.current?.({ event: "LAYER_CHANGE", result: "SUCCESS", detail: { layer: "flow" } }); }} className={`rounded border px-1 py-1 text-[7px] ${flowEnabled ? "border-amber-500/40 text-amber-200" : "border-slate-700 text-slate-500"}`}>FLOW {flowEnabled ? "ON" : "OFF"}</button><button onClick={() => { setParticlesEnabled(value => !value); observabilityRef.current?.({ event: "LAYER_CHANGE", result: "SUCCESS", detail: { layer: "particle" } }); }} className={`rounded border px-1 py-1 text-[7px] ${particlesEnabled ? "border-amber-500/40 text-amber-200" : "border-slate-700 text-slate-500"}`}>PARTICLE {particlesEnabled ? "ON" : "OFF"}</button></div>
        <div className="mt-2 rounded border border-slate-800 bg-slate-900/50 p-2 text-[7px] leading-relaxed text-slate-500">DRAG: ROTATE · SHIFT + DRAG: PAN · WHEEL: ZOOM · SELECT: FOCUS. Camera, layers, flow, and particles do not alter the simulation engine. Flow rate remains UNKNOWN.</div>
      </div>

      <div className="pointer-events-auto absolute bottom-28 left-4 w-60 rounded-xl border border-violet-500/20 bg-slate-950/90 p-3 font-mono text-[9px] shadow-xl backdrop-blur">
        <div className="flex items-center justify-between gap-2"><span className="text-[8px] tracking-[0.2em] text-violet-300">COMPONENT INSPECTOR</span><select aria-label="Select 3D component" value={selectedComponent ?? ""} onChange={event => setSelectedComponent((event.target.value || null) as ComponentId | null)} className="max-w-32 rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-[8px] text-slate-200"><option value="">SELECT</option>{(Object.keys(COMPONENT_LABELS) as ComponentId[]).map(id => <option value={id} key={id}>{COMPONENT_LABELS[id]}</option>)}</select></div>
        {selectedComponent ? <div className="mt-2 space-y-1.5 text-slate-400"><div className="text-xs text-violet-200">{COMPONENT_LABELS[selectedComponent]}</div><div className="grid grid-cols-2 gap-x-3 gap-y-1"><span>STATE</span><span className="text-right text-slate-200">{visual.stage ?? "UNKNOWN"}</span><span>COMMAND</span><span className="text-right text-slate-200">{commandFor(selectedComponent) === undefined ? "UNKNOWN" : commandFor(selectedComponent) ? "ON" : "OFF"}</span><span>ACTUATOR</span><span className="text-right text-cyan-200">{actuatorFor(selectedComponent) === undefined ? "UNKNOWN" : normalizedLevel(actuatorFor(selectedComponent)).toFixed(2)}</span><span>SENSOR</span><span className="text-right text-slate-200">{selectedSensor}</span><span>FLOW RATE</span><span className="text-right text-amber-200">UNKNOWN</span><span>SIM TIME</span><span className="text-right text-slate-200">{displayNumber(visual.timestampSeconds, 1, "s")}</span><span>PROVENANCE</span><span className="text-right text-violet-200">SIMULATION</span><span>MEASURED</span><span className="text-right text-slate-500">NOT LOADED</span></div></div> : <div className="mt-2 text-slate-500">Click a major 3D component or choose it here to focus the camera and inspect its authoritative frame values.</div>}
      </div>

      {layers.instrument && <div className="absolute bottom-3 left-3 right-3 grid grid-cols-2 gap-2 md:grid-cols-6">
        <div className="rounded-lg border border-cyan-500/20 bg-slate-950/90 p-2 font-mono backdrop-blur"><div className="text-[8px] text-slate-500">REACTOR</div><div className="text-sm text-cyan-300">{displayNumber(visual.temperatureC, 1, "°C")}</div></div>
        <div className="rounded-lg border border-cyan-500/20 bg-slate-950/90 p-2 font-mono backdrop-blur"><div className="text-[8px] text-slate-500">PRESSURE</div><div className="text-sm text-cyan-300">{displayNumber(visual.pressureMbar, 1, "mbar")}</div></div>
        <div className="rounded-lg border border-sky-500/20 bg-slate-950/90 p-2 font-mono backdrop-blur"><div className="text-[8px] text-slate-500">VACUUM</div><div className="text-sm text-sky-300">{visual.vacuumAchieved === undefined ? "UNKNOWN" : visual.vacuumAchieved ? "ACHIEVED" : "NOT YET"}</div></div>
        <div className="rounded-lg border border-blue-500/20 bg-slate-950/90 p-2 font-mono backdrop-blur"><div className="text-[8px] text-slate-500">CONDENSATE</div><div className="text-sm text-blue-300">{visual.condensedWaterKg ? `${visual.condensedWaterKg.reduce((sum, value) => sum + (finite(value) ? value : 0), 0).toFixed(3)} kg` : "UNKNOWN"}</div></div>
        <div className="rounded-lg border border-violet-500/20 bg-slate-950/90 p-2 font-mono backdrop-blur"><div className="text-[8px] text-slate-500">ULTRASONIC</div><div className="text-sm text-violet-300">{displayNumber(visual.ultrasonicEffectivePowerW, 0, "W")}</div></div>
        <div className="rounded-lg border border-amber-500/20 bg-slate-950/90 p-2 font-mono backdrop-blur"><div className="text-[8px] text-slate-500">MATERIAL LEFT</div><div className="text-sm text-amber-300">{displayNumber(visual.materialRemainingKg, 2, "kg")}</div></div>
      </div>}
    </div>
  );
}
