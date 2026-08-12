import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { CausalFrame } from "../../../server/closedLoopSimulation";

interface Props { frame?: CausalFrame; }

export interface ProcessMachineVisualState {
  hasFrame: boolean;
  stage: CausalFrame["safety"]["stage"] | undefined;
  timestampSeconds: number | undefined;
  commands: CausalFrame["effectiveCommands"] | undefined;
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
    hasFrame: false, stage: undefined, timestampSeconds: undefined, commands: undefined,
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

function connector(scene: THREE.Scene, position: THREE.Vector3, radius = 0.14, length = 0.28) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 20),
    new THREE.MeshStandardMaterial({ color: 0x516b83, metalness: 0.9, roughness: 0.18 }),
  );
  mesh.position.copy(position);
  mesh.rotation.z = Math.PI / 2;
  scene.add(mesh);
  return mesh;
}

function createParticles(scene: THREE.Scene, count: number, color: number) {
  const group = new THREE.Group();
  for (let i = 0; i < count; i += 1) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), new THREE.MeshBasicMaterial({ color }));
    p.userData.offset = i / count;
    group.add(p);
  }
  scene.add(group);
  return group;
}

export function ProcessMachine3D({ frame }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<CausalFrame | undefined>(frame);
  frameRef.current = frame;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020712);
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

    scene.add(new THREE.HemisphereLight(0x9ee7ff, 0x07111f, 1.5));
    const key = new THREE.PointLight(0x22d3ee, 18, 34);
    key.position.set(-4, 8, 7);
    scene.add(key);
    const fill = new THREE.PointLight(0x2563eb, 7, 30);
    fill.position.set(6, 4, -6);
    scene.add(fill);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(11, 64), new THREE.MeshBasicMaterial({ color: 0x06101c, transparent: true, opacity: 0.94 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.25;
    scene.add(floor);

    // -----------------------------------------------------------------------
    // AUTHORITATIVE VISUAL TOPOLOGY
    // Every process/utilities path terminates at an explicit connector.
    // No path is allowed to end in free space or pass through a component body.
    // -----------------------------------------------------------------------
    const reactor = new THREE.Group();
    reactor.position.set(-4.1, 0.55, 0);
    scene.add(reactor);
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
    const materialZone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.96, 0.96, 2.5, 36),
      new THREE.MeshStandardMaterial({ color: 0x7c3aed, metalness: 0.05, roughness: 0.4, transparent: true, opacity: 0.2, emissive: 0x2e1065 }),
    );
    materialZone.position.y = -0.25;
    reactor.add(materialZone);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.79, 1.79, 0.3, 48), new THREE.MeshStandardMaterial({ color: 0x25374c, metalness: 0.9, roughness: 0.18 }));
    top.position.y = 2.46;
    reactor.add(top);
    const bottom = top.clone();
    bottom.position.y = -2.46;
    reactor.add(bottom);

    const heaterRing = new THREE.Mesh(new THREE.TorusGeometry(1.51, 0.09, 12, 48), new THREE.MeshBasicMaterial({ color: 0x334155 }));
    heaterRing.rotation.x = Math.PI / 2;
    heaterRing.position.y = 1.04;
    reactor.add(heaterRing);

    const ultrasonic = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.58, 24), new THREE.MeshBasicMaterial({ color: 0x334155 }));
    ultrasonic.position.y = -1.68;
    reactor.add(ultrasonic);

    // Process connectors are defined in world coordinates so routes can be checked.
    const reactorVapor = new THREE.Vector3(-2.72, 3.01, 0);
    const reactorVacuum = new THREE.Vector3(-2.38, 0.55, 0.58);
    const heaterPower = new THREE.Vector3(-4.1, 1.59, 1.58);
    const ultrasonicPower = new THREE.Vector3(-4.1, -1.13, 1.58);
    connector(scene, reactorVapor, 0.16, 0.34);
    connector(scene, reactorVacuum, 0.12, 0.3);
    connector(scene, heaterPower, 0.08, 0.24);
    connector(scene, ultrasonicPower, 0.08, 0.24);

    const pump = new THREE.Group();
    pump.position.set(4.7, -0.55, 1.55);
    scene.add(pump);
    pump.add(new THREE.Mesh(new THREE.BoxGeometry(2.25, 1.5, 1.58), new THREE.MeshStandardMaterial({ color: 0x172033, metalness: 0.86, roughness: 0.24 })));
    const pumpRotor = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.16, 32), new THREE.MeshBasicMaterial({ color: 0x334155 }));
    pumpRotor.rotation.z = Math.PI / 2;
    pumpRotor.position.x = -1.07;
    pump.add(pumpRotor);
    const pumpInletLocal = new THREE.Vector3(-1.25, 0, 0);
    const pumpInlet = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.28, 24), new THREE.MeshStandardMaterial({ color: 0x263b52, metalness: 0.85, roughness: 0.2 }));
    pumpInlet.rotation.z = Math.PI / 2;
    pumpInlet.position.copy(pumpInletLocal);
    pump.add(pumpInlet);
    const pumpInletWorld = pumpInletLocal.clone().add(pump.position);
    const pumpPowerWorld = new THREE.Vector3(5.82, -1.3, 2.35);
    connector(scene, pumpPowerWorld, 0.08, 0.24);

    const trapGroups: THREE.Group[] = [];
    const trapBodies: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>[] = [];
    const trapCoils: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>[] = [];
    const trapInlets: THREE.Vector3[] = [];
    const trapOutlets: THREE.Vector3[] = [];
    const trapCoolingInlets: THREE.Vector3[] = [];
    const trapCoolingOutlets: THREE.Vector3[] = [];
    const trapIndicators: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>[] = [];

    for (let i = 0; i < 4; i += 1) {
      const group = new THREE.Group();
      group.position.set(-1.9 + i * 2.45, 3.35, -1.55);
      scene.add(group);
      trapGroups.push(group);

      const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 1.95, 32), new THREE.MeshStandardMaterial({ color: 0x15243a, metalness: 0.72, roughness: 0.24, transparent: true, opacity: 0.8, emissive: 0x061522 }));
      group.add(shell);
      trapBodies.push(shell);

      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.065, 10, 32), new THREE.MeshBasicMaterial({ color: 0x334155 }));
      coil.rotation.x = Math.PI / 2;
      coil.position.y = -0.15;
      group.add(coil);
      trapCoils.push(coil);

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.12, 32), new THREE.MeshStandardMaterial({ color: 0x203149, metalness: 0.85, roughness: 0.2 }));
      base.position.y = -1.04;
      group.add(base);

      const inlet = new THREE.Vector3(group.position.x - 0.84, group.position.y, group.position.z);
      const outlet = new THREE.Vector3(group.position.x + 0.84, group.position.y, group.position.z);
      const coolingIn = new THREE.Vector3(group.position.x - 0.84, group.position.y - 0.68, group.position.z - 0.08);
      const coolingOut = new THREE.Vector3(group.position.x + 0.84, group.position.y - 0.68, group.position.z - 0.08);
      trapInlets.push(inlet);
      trapOutlets.push(outlet);
      trapCoolingInlets.push(coolingIn);
      trapCoolingOutlets.push(coolingOut);
      connector(scene, inlet);
      connector(scene, outlet);
      connector(scene, coolingIn, 0.08, 0.2);
      connector(scene, coolingOut, 0.08, 0.2);

      const indicator = new THREE.Mesh(new THREE.RingGeometry(0.82, 0.9, 32), new THREE.MeshBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
      indicator.rotation.x = Math.PI / 2;
      indicator.position.y = 1.02;
      group.add(indicator);
      trapIndicators.push(indicator);
    }

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
    vaporPaths.forEach(path => scene.add(routedTube(path, 0.088, vaporMaterial)));

    // Vacuum is the same sealed process manifold, but its authoritative terminal is
    // the pump inlet. It is rendered as a separate state highlight, not a second pipe.
    const vacuumPath: THREE.Vector3[] = [
      reactorVacuum,
      new THREE.Vector3(-1.55, reactorVacuum.y, reactorVacuum.z),
      new THREE.Vector3(1.0, pumpInletWorld.y, pumpInletWorld.z),
      pumpInletWorld,
    ];
    scene.add(routedTube(vacuumPath, 0.1, vacuumMaterial));

    // ----------------------------- COOLING LOOP -----------------------------
    // A real closed utility loop: manifold -> each trap inlet -> outlet -> return.
    const coolingSupply = new THREE.Vector3(6.45, 1.95, -2.5);
    const coolingReturn = new THREE.Vector3(6.45, 0.95, -2.5);
    connector(scene, coolingSupply, 0.08, 0.24);
    connector(scene, coolingReturn, 0.08, 0.24);
    for (let i = 0; i < 4; i += 1) {
      scene.add(routedTube([
        coolingSupply,
        new THREE.Vector3(6.45, coolingInletsY(i), -2.5),
        new THREE.Vector3(trapCoolingInlets[i].x, trapCoolingInlets[i].y, -2.5),
        trapCoolingInlets[i],
      ], 0.062, coolingMaterial));
      scene.add(routedTube([
        trapCoolingOutlets[i],
        new THREE.Vector3(trapCoolingOutlets[i].x, trapCoolingOutlets[i].y, -2.5),
        new THREE.Vector3(6.9, trapCoolingOutlets[i].y, -2.5),
        coolingReturn,
      ], 0.062, coolingMaterial));
    }

    // ---------------------------- ELECTRICAL BUS ----------------------------
    const powerBus = new THREE.Vector3(6.2, -1.7, 2.8);
    connector(scene, powerBus, 0.1, 0.3);
    scene.add(routedTube([powerBus, new THREE.Vector3(1.8, -1.7, 2.8), pumpPowerWorld], 0.036, powerMaterial));
    scene.add(routedTube([powerBus, new THREE.Vector3(-1.0, -1.7, 2.8), heaterPower], 0.036, powerMaterial));
    scene.add(routedTube([powerBus, new THREE.Vector3(-2.0, -1.7, 2.8), ultrasonicPower], 0.036, powerMaterial));

    const vacuumParticles = createParticles(scene, 14, 0x22d3ee);
    const vaporParticles = createParticles(scene, 18, 0xfbbf24);
    const coolingParticles = createParticles(scene, 16, 0x60a5fa);
    const powerParticles = createParticles(scene, 10, 0xf59e0b);
    const chamberParticles = createParticles(scene, 32, 0x67e8f9);

    // Fixed utility point used only to make the four cooling branches evenly routed.
    function coolingInletsY(index: number) { return 1.0 + index * 0.35; }

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
      const commands = visual.commands;
      const time = finite(visual.timestampSeconds) ? visual.timestampSeconds! : 0;
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

      const stageColor = fault ? 0xef4444 : visual.stage === "CONDENSATION" ? 0x38bdf8 : visual.stage === "EXTRACTION" ? 0xfbbf24 : visual.stage === "HEAT_UP" ? 0xf97316 : visual.hasFrame ? 0x22d3ee : 0x334155;
      setColor(stageBand.material, stageColor);
      setColor(heaterRing.material, fault ? 0xef4444 : hot ? 0xf97316 : 0x334155);
      setEmissive(chamber.material, fault ? 0x5f1111 : hot ? 0x5a2108 : 0x07334a);
      setColor(ultrasonic.material, ultrasonicOn ? 0x8b5cf6 : 0x334155);
      key.color.setHex(fault ? 0xef4444 : hot ? 0xfb923c : 0x22d3ee);
      key.intensity = hot ? 30 : 18;
      setColor(pumpRotor.material, vacuum ? 0x22d3ee : 0x334155);
      setColor(vacuumMaterial, vacuum ? 0x22d3ee : 0x164e63);
      setColor(vaporMaterial, extracting || condensing ? 0x38bdf8 : 0x155e75);
      setColor(coolingMaterial, cooling ? 0x60a5fa : 0x1e3a5f);
      setColor(powerMaterial, hot || vacuum || extracting || condensing || cooling || ultrasonicOn ? 0xf59e0b : 0x334155);

      pumpRotor.rotation.x = vacuum ? time * 18 : 0;
      reactor.rotation.y = active ? Math.sin(time * 0.35) * 0.02 : 0;
      const materialFraction = finite(visual.materialInitialKg) && finite(visual.materialRemainingKg) && visual.materialInitialKg! > 0
        ? Math.max(0, Math.min(1, visual.materialRemainingKg! / visual.materialInitialKg!)) : undefined;
      materialZone.visible = materialFraction !== undefined && materialFraction > 0;
      if (materialFraction !== undefined) {
        materialZone.scale.y = 0.25 + materialFraction * 0.75;
        (materialZone.material as THREE.MeshStandardMaterial).opacity = 0.08 + materialFraction * 0.22;
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
        setEmissive(trapBodies[index].material, hasTemperature && (condensing || cooling) ? (coldFactor > 0.65 ? 0x082f49 : 0x10243a) : 0x061522);
        setColor(trapCoils[index].material, hasTemperature ? (cooling || condensing ? (coldFactor > 0.65 ? 0x60a5fa : 0x38bdf8) : 0x2563eb) : 0x334155);
        setColor(trapIndicators[index].material, hasCondensate ? 0x38bdf8 : hasTemperature ? 0x2563eb : 0x334155);
        trapIndicators[index].material.opacity = hasCondensate ? 0.9 : hasTemperature ? 0.7 : 0.45;
        group.position.y = 3.35 + (active ? Math.sin(time * 0.5 + index) * 0.015 : 0);
      });

      updateParticles(vacuumParticles, vacuumPath, vacuum, time, 0.18, 0.8 + vacuumLevel * 0.35);
      updateParticles(vaporParticles, vaporPaths[0], extracting || condensing, time, 0.1, 0.8 + thermal * 0.3);
      updateParticles(coolingParticles, [coolingSupply, trapCoolingInlets[0], trapCoolingOutlets[0], coolingReturn], cooling, time, 0.12, 0.7);
      updateParticles(powerParticles, [powerBus, heaterPower], hot || ultrasonicOn || vacuum, time, 0.2, 0.65);

      chamberParticles.children.forEach((child, index) => {
        const p = child as THREE.Mesh;
        const visible = active && finite(visual.pressureMbar) && (vacuum || extracting || hot);
        const offset = p.userData.offset as number;
        const t = visible ? (time * (vacuum || extracting ? 0.09 : 0.015) + offset) % 1 : 0;
        p.visible = visible;
        p.position.set(-1.0 + t * 1.9, -1.35 + ((index * 0.47) % 2.7), 0.4 + Math.sin(index * 1.7 + time) * 0.5);
        p.scale.setScalar(visible ? 0.45 + vacuumLevel * 0.9 + thermal * 0.5 : 0);
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
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
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  const visual = getProcessMachineVisualState(frame);
  const commands = visual.commands;
  const fault = visual.overTemperature === true;
  const hasFrame = visual.hasFrame;
  const connection = (active: boolean) => active ? "text-emerald-300" : "text-slate-600";

  return (
    <div className="relative h-[590px] overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950/90 shadow-2xl shadow-cyan-950/20">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-slate-950/95 via-slate-950/70 to-transparent p-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.25em] text-cyan-300"><span className={`h-2 w-2 rounded-full ${fault ? "bg-red-400" : hasFrame ? "bg-emerald-400" : "bg-slate-500"}`} />3D PROCESS MACHINE</div>
          <div className="mt-1 text-[10px] text-slate-500">CAUSAL FRAME → VALIDATED PHYSICAL TOPOLOGY</div>
        </div>
        <div className={`rounded-lg border px-3 py-2 font-mono text-[9px] ${fault ? "border-red-500/30 bg-red-500/10 text-red-300" : hasFrame ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300" : "border-slate-700 bg-slate-950/80 text-slate-500"}`}>{fault ? "SAFETY TRIP" : hasFrame ? visual.stage : "UNKNOWN / NO FRAME"}</div>
      </div>

      <div className="pointer-events-none absolute left-4 top-20 space-y-1.5 font-mono text-[9px]">
        <div className="rounded bg-slate-950/75 px-2 py-1 text-slate-400">REACTOR / CHAMBER</div>
        <div className="rounded bg-slate-950/75 px-2 py-1 text-slate-400">VAPOR → TRAP 1 → TRAP 2 → TRAP 3 → TRAP 4</div>
        <div className="rounded bg-slate-950/75 px-2 py-1 text-slate-400">TRAP 4 → VACUUM PUMP</div>
        <div className="rounded bg-slate-950/75 px-2 py-1 text-slate-400">COOLING SUPPLY → TRAPS → RETURN</div>
      </div>

      <div className="pointer-events-none absolute right-4 top-20 rounded-xl border border-white/10 bg-slate-950/85 p-3 font-mono text-[9px] shadow-xl backdrop-blur">
        <div className="mb-2 text-[8px] tracking-[0.2em] text-slate-500">EFFECTIVE CONNECTIONS</div>
        <div className="space-y-1.5 text-slate-400">
          <div><span className={connection(Boolean(commands?.vacuumPump))}>●</span> VACUUM → PUMP INLET</div>
          <div><span className={connection(Boolean(commands?.extractor || commands?.condenser))}>●</span> VAPOR → COLD TRAPS</div>
          <div><span className={connection(Boolean(commands?.cooling))}>●</span> COOLING LOOP</div>
          <div><span className={connection(Boolean(commands?.heater))}>●</span> POWER → HEATER</div>
          <div><span className={connection(Boolean(commands?.vacuumPump))}>●</span> POWER → PUMP</div>
          <div><span className={connection(Boolean(visual.ultrasonicEffectivePowerW && visual.ultrasonicEffectivePowerW > 0))}>●</span> POWER → ULTRASONIC</div>
        </div>
        <div className="mt-2 border-t border-white/10 pt-2 text-[8px] text-slate-600">ALL VISUAL PATHS TERMINATE AT EXPLICIT CONNECTORS.</div>
      </div>

      <div className="absolute bottom-3 left-3 right-3 grid grid-cols-2 gap-2 md:grid-cols-6">
        <div className="rounded-lg border border-cyan-500/20 bg-slate-950/90 p-2 font-mono backdrop-blur"><div className="text-[8px] text-slate-500">REACTOR</div><div className="text-sm text-cyan-300">{displayNumber(visual.temperatureC, 1, "°C")}</div></div>
        <div className="rounded-lg border border-cyan-500/20 bg-slate-950/90 p-2 font-mono backdrop-blur"><div className="text-[8px] text-slate-500">PRESSURE</div><div className="text-sm text-cyan-300">{displayNumber(visual.pressureMbar, 1, "mbar")}</div></div>
        <div className="rounded-lg border border-sky-500/20 bg-slate-950/90 p-2 font-mono backdrop-blur"><div className="text-[8px] text-slate-500">VACUUM</div><div className="text-sm text-sky-300">{visual.vacuumAchieved === undefined ? "UNKNOWN" : visual.vacuumAchieved ? "ACHIEVED" : "NOT YET"}</div></div>
        <div className="rounded-lg border border-blue-500/20 bg-slate-950/90 p-2 font-mono backdrop-blur"><div className="text-[8px] text-slate-500">CONDENSATE</div><div className="text-sm text-blue-300">{visual.condensedWaterKg ? `${visual.condensedWaterKg.reduce((sum, value) => sum + (finite(value) ? value : 0), 0).toFixed(3)} kg` : "UNKNOWN"}</div></div>
        <div className="rounded-lg border border-violet-500/20 bg-slate-950/90 p-2 font-mono backdrop-blur"><div className="text-[8px] text-slate-500">ULTRASONIC</div><div className="text-sm text-violet-300">{displayNumber(visual.ultrasonicEffectivePowerW, 0, "W")}</div></div>
        <div className="rounded-lg border border-amber-500/20 bg-slate-950/90 p-2 font-mono backdrop-blur"><div className="text-[8px] text-slate-500">MATERIAL LEFT</div><div className="text-sm text-amber-300">{displayNumber(visual.materialRemainingKg, 2, "kg")}</div></div>
      </div>
    </div>
  );
}
