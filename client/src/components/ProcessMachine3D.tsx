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

function tubeBetween(curve: THREE.Curve<THREE.Vector3>, radius: number, material: THREE.MeshBasicMaterial) {
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 48, radius, 12, false), material);
}
function finite(value: number | undefined): value is number { return typeof value === "number" && Number.isFinite(value); }
function setHex(material: THREE.Material, hex: number) {
  if (material instanceof THREE.MeshBasicMaterial || material instanceof THREE.MeshStandardMaterial) material.color.setHex(hex);
}
function setEmissive(material: THREE.Material, hex: number) { if (material instanceof THREE.MeshStandardMaterial) material.emissive.setHex(hex); }
function displayNumber(value: number | undefined, digits: number, unit: string) { return finite(value) ? `${value.toFixed(digits)} ${unit}` : "UNKNOWN"; }

function createPathParticles(scene: THREE.Scene, count: number, color: number) {
  const group = new THREE.Group();
  for (let i = 0; i < count; i += 1) {
    const particle = new THREE.Mesh(new THREE.SphereGeometry(0.044, 8, 8), new THREE.MeshBasicMaterial({ color }));
    particle.userData.offset = i / count;
    group.add(particle);
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
    camera.position.set(11.8, 7.4, 16.8);
    camera.lookAt(0.3, 0.75, -0.15);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0x9ee7ff, 0x07111f, 1.45));
    const key = new THREE.PointLight(0x22d3ee, 18, 32);
    key.position.set(-3, 8, 7);
    scene.add(key);
    const fill = new THREE.PointLight(0x2563eb, 7, 28);
    fill.position.set(6, 3, -6);
    scene.add(fill);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(10, 64), new THREE.MeshBasicMaterial({ color: 0x06101c, transparent: true, opacity: 0.92 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.25;
    scene.add(floor);

    // MACHINE HIERARCHY: reactor -> vapor header -> cold traps -> vacuum pump.
    const reactor = new THREE.Group();
    reactor.position.set(-4.1, 0.55, 0);
    scene.add(reactor);
    const reactorShell = new THREE.Mesh(new THREE.CylinderGeometry(1.72, 1.72, 4.85, 48), new THREE.MeshStandardMaterial({ color: 0x18283b, metalness: 0.84, roughness: 0.2 }));
    reactor.add(reactorShell);
    const chamber = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.28, 3.92, 48), new THREE.MeshStandardMaterial({ color: 0x0a1726, metalness: 0.25, roughness: 0.12, transparent: true, opacity: 0.56, emissive: 0x07334a }));
    reactor.add(chamber);
    const stageBand = new THREE.Mesh(new THREE.TorusGeometry(1.36, 0.045, 10, 48), new THREE.MeshBasicMaterial({ color: 0x334155 }));
    stageBand.rotation.x = Math.PI / 2;
    stageBand.position.y = 1.9;
    reactor.add(stageBand);
    const materialZone = new THREE.Mesh(new THREE.CylinderGeometry(0.96, 0.96, 2.5, 36), new THREE.MeshStandardMaterial({ color: 0x7c3aed, metalness: 0.05, roughness: 0.4, transparent: true, opacity: 0.2, emissive: 0x2e1065 }));
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

    const pump = new THREE.Group();
    pump.position.set(4.7, -0.55, 1.55);
    scene.add(pump);
    pump.add(new THREE.Mesh(new THREE.BoxGeometry(2.25, 1.5, 1.58), new THREE.MeshStandardMaterial({ color: 0x172033, metalness: 0.86, roughness: 0.24 })));
    const pumpRotor = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.16, 32), new THREE.MeshBasicMaterial({ color: 0x334155 }));
    pumpRotor.rotation.z = Math.PI / 2;
    pumpRotor.position.x = -1.07;
    pump.add(pumpRotor);
    const pumpInlet = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.28, 24), new THREE.MeshStandardMaterial({ color: 0x263b52, metalness: 0.85, roughness: 0.2 }));
    pumpInlet.rotation.z = Math.PI / 2;
    pumpInlet.position.x = -1.25;
    pump.add(pumpInlet);

    const trapGroups: THREE.Group[] = [];
    const trapBodies: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>[] = [];
    const trapCoils: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>[] = [];
    const trapPorts: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>[] = [];
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
      const port = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.42, 20), new THREE.MeshStandardMaterial({ color: 0x31465e, metalness: 0.85, roughness: 0.2 }));
      port.rotation.z = Math.PI / 2;
      port.position.set(-0.78, 0.3, 0);
      group.add(port);
      trapPorts.push(port);
      const indicator = new THREE.Mesh(new THREE.RingGeometry(0.82, 0.9, 32), new THREE.MeshBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
      indicator.rotation.x = Math.PI / 2;
      indicator.position.y = 1.02;
      group.add(indicator);
      trapIndicators.push(indicator);
    }

    const vacuumLineMaterial = new THREE.MeshBasicMaterial({ color: 0x164e63 });
    const vaporLineMaterial = new THREE.MeshBasicMaterial({ color: 0x155e75 });
    const coolingLineMaterial = new THREE.MeshBasicMaterial({ color: 0x1e3a5f });
    const powerCableMaterial = new THREE.MeshBasicMaterial({ color: 0x334155 });
    const vacuumCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-2.25, 0.15, 0.58), new THREE.Vector3(-0.1, 0.15, 0.58), new THREE.Vector3(2.35, -0.02, 1.22), new THREE.Vector3(3.62, -0.35, 1.55)]);
    const vaporCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-2.72, 2.48, 0), new THREE.Vector3(-2.68, 3.65, -1.55), new THREE.Vector3(-0.23, 3.65, -1.55), new THREE.Vector3(2.22, 3.65, -1.55), new THREE.Vector3(4.67, 3.65, -1.55), new THREE.Vector3(5.25, 3.02, -1.55)]);
    const coolingCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(4.45, 1.62, -1.5), new THREE.Vector3(2.7, 1.62, -2.35), new THREE.Vector3(0, 1.7, -2.35), new THREE.Vector3(-2.05, 1.26, -0.82)]);
    const powerCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(5.75, -1.28, 2.58), new THREE.Vector3(4.5, -1.0, 2.58), new THREE.Vector3(2.0, 0, 1.9), new THREE.Vector3(-1.0, 0.2, 0.82), new THREE.Vector3(-3.42, 0.2, 0)]);
    scene.add(tubeBetween(vacuumCurve, 0.1, vacuumLineMaterial), tubeBetween(vaporCurve, 0.088, vaporLineMaterial), tubeBetween(coolingCurve, 0.072, coolingLineMaterial), tubeBetween(powerCurve, 0.036, powerCableMaterial));

    const vacuumParticles = createPathParticles(scene, 12, 0x22d3ee);
    const vaporParticles = createPathParticles(scene, 16, 0xfbbf24);
    const coolingParticles = createPathParticles(scene, 12, 0x60a5fa);
    const chamberParticles = createPathParticles(scene, 36, 0x67e8f9);

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

    const animate = () => {
      const visual = getProcessMachineVisualState(frameRef.current);
      const commands = visual.commands;
      const timestamp = visual.timestampSeconds;
      const time = finite(timestamp) ? timestamp : 0;
      const temperature = visual.temperatureC;
      const pressure = visual.pressureMbar;
      const hasTemperature = finite(temperature);
      const hasPressure = finite(pressure);
      const vacuum = commands?.vacuumPump === true;
      const hot = commands?.heater === true;
      const extracting = commands?.extractor === true;
      const condensing = commands?.condenser === true;
      const cooling = commands?.cooling === true;
      const fault = visual.overTemperature === true;
      const activeProcess = Boolean(commands) && finite(timestamp);
      const vacuumLevel = hasPressure ? Math.max(0, Math.min(1, 1 - pressure! / 1013.25)) : undefined;
      const thermal = hasTemperature ? Math.max(0, Math.min(1, (temperature! - 25) / 125)) : undefined;
      const ultrasonicActivity = finite(visual.ultrasonicActivityIndex) ? Math.max(0, Math.min(1, visual.ultrasonicActivityIndex!)) : undefined;
      const ultrasonicActive = finite(visual.ultrasonicEffectivePowerW) ? visual.ultrasonicEffectivePowerW! > 0 : ultrasonicActivity !== undefined && ultrasonicActivity > 0;

      pumpRotor.rotation.x = vacuum && finite(timestamp) ? time * 18 : 0;
      reactor.rotation.y = activeProcess ? Math.sin(time * 0.35) * 0.02 : 0;
      const stage = visual.stage;
      const stageColor = fault ? 0xef4444 : stage === "CONDENSATION" ? 0x38bdf8 : stage === "EXTRACTION" ? 0xfbbf24 : stage === "HEAT_UP" ? 0xf97316 : visual.hasFrame ? 0x22d3ee : 0x334155;
      setHex(stageBand.material, stageColor);
      setHex(heaterRing.material, fault ? 0xef4444 : hot ? 0xf97316 : 0x334155);
      setEmissive(chamber.material, fault ? 0x5f1111 : hot ? 0x5a2108 : 0x07334a);
      setHex(ultrasonic.material, ultrasonicActive ? 0x8b5cf6 : 0x334155);
      key.color.setHex(fault ? 0xef4444 : hot ? 0xfb923c : 0x22d3ee);
      key.intensity = hot ? 30 : 18;
      setHex(pumpRotor.material, vacuum ? 0x22d3ee : 0x334155);
      setHex(vacuumLineMaterial, vacuum ? 0x22d3ee : 0x164e63);
      setHex(vaporLineMaterial, extracting || condensing ? 0x38bdf8 : 0x155e75);
      setHex(coolingLineMaterial, cooling ? 0x60a5fa : 0x1e3a5f);
      setHex(powerCableMaterial, hot || vacuum || extracting || condensing || cooling ? 0xf59e0b : 0x334155);

      const materialInitial = visual.materialInitialKg;
      const materialRemaining = visual.materialRemainingKg;
      const materialFraction = finite(materialInitial) && finite(materialRemaining) && materialInitial! > 0 ? Math.max(0, Math.min(1, materialRemaining! / materialInitial!)) : undefined;
      materialZone.visible = finite(materialFraction) ? materialFraction! > 0 : false;
      if (finite(materialFraction)) { materialZone.scale.y = 0.25 + materialFraction! * 0.75; (materialZone.material as THREE.MeshStandardMaterial).opacity = 0.08 + materialFraction! * 0.22; }
      else { materialZone.scale.y = 1; (materialZone.material as THREE.MeshStandardMaterial).opacity = 0; }
      ultrasonic.scale.setScalar(1 + (ultrasonicActivity ?? 0) * 0.2);

      trapGroups.forEach((group, index) => {
        const trapTemperature = visual.coldTrapTemperaturesC?.[index];
        const condensate = visual.condensedWaterKg?.[index];
        const hasTrapTemperature = finite(trapTemperature);
        const hasCondensate = finite(condensate) && condensate! > 0;
        const coldFactor = hasTrapTemperature ? Math.max(0, Math.min(1, (25 - trapTemperature!) / 105)) : undefined;
        const active = condensing || cooling;
        const trapDataAvailable = hasTrapTemperature || finite(condensate);
        setEmissive(trapBodies[index].material, active && coldFactor !== undefined ? (coldFactor > 0.65 ? 0x082f49 : 0x10243a) : 0x061522);
        trapCoils[index].material.color.setHex(active && hasTrapTemperature ? (coldFactor! > 0.65 ? 0x60a5fa : 0x38bdf8) : trapDataAvailable ? 0x2563eb : 0x334155);
        setHex(trapPorts[index].material, active ? 0x3b82f6 : trapDataAvailable ? 0x31465e : 0x202a38);
        setHex(trapIndicators[index].material, hasCondensate ? 0x38bdf8 : hasTrapTemperature ? 0x2563eb : 0x334155);
        trapIndicators[index].material.opacity = hasCondensate ? 0.9 : hasTrapTemperature ? 0.7 : 0.45;
        group.position.y = activeProcess ? 3.35 + Math.sin(time * 0.5 + index) * 0.015 : 3.35;
      });

      chamberParticles.children.forEach((particle, index) => {
        const offset = particle.userData.offset as number;
        const visible = activeProcess && hasPressure && (vacuum || extracting || hot);
        const travel = visible ? (time * (vacuum || extracting ? 0.09 : 0.015) + offset) % 1 : 0;
        particle.position.set(-1.0 + travel * 1.9, -1.35 + ((index * 0.47) % 2.7), 0.4 + Math.sin(index * 1.7 + time) * 0.5);
        particle.visible = visible;
        particle.scale.setScalar(visible && vacuumLevel !== undefined && thermal !== undefined ? 0.45 + vacuumLevel * 1.2 + thermal * 0.7 : 0);
      });

      const updatePath = (group: THREE.Group, curve: THREE.CatmullRomCurve3, active: boolean, speed: number) => {
        group.children.forEach((particle) => {
          const mesh = particle as THREE.Mesh;
          const offset = mesh.userData.offset as number;
          const travel = active && finite(timestamp) ? (time * speed + offset) % 1 : 0;
          mesh.position.copy(active ? curve.getPointAt(travel) : new THREE.Vector3(0, -20, 0));
          mesh.visible = active;
          mesh.scale.setScalar(active ? 0.7 + (thermal ?? 0) * 0.35 : 0);
        });
      };
      updatePath(vacuumParticles, vacuumCurve, vacuum, 0.18);
      updatePath(vaporParticles, vaporCurve, extracting || condensing, 0.1);
      updatePath(coolingParticles, coolingCurve, cooling, 0.1);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      if (!resizeObserver) window.removeEventListener("resize", resize);
      const disposedGeometries = new Set<THREE.BufferGeometry>();
      const disposedMaterials = new Set<THREE.Material>();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          if (!disposedGeometries.has(object.geometry)) {
            disposedGeometries.add(object.geometry);
            object.geometry.dispose();
          }
          const material = object.material;
          if (Array.isArray(material)) {
            material.forEach(item => {
              if (!disposedMaterials.has(item)) {
                disposedMaterials.add(item);
                item.dispose();
              }
            });
          } else if (!disposedMaterials.has(material)) {
            disposedMaterials.add(material);
            material.dispose();
          }
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  const visual = getProcessMachineVisualState(frame);
  const fault = visual.overTemperature === true;
  const commands = visual.commands;
  const traps = visual.coldTrapTemperaturesC;
  const condensed = visual.condensedWaterKg;
  const hasEngineFrame = visual.hasFrame;
  const ultrasonicModelled = finite(visual.ultrasonicEffectivePowerW) || finite(visual.ultrasonicActivityIndex);

  return (
    <div className="relative h-[590px] overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950/90 shadow-2xl shadow-cyan-950/20">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-slate-950/95 via-slate-950/65 to-transparent p-4">
        <div><div className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.25em] text-cyan-300"><span className={`h-2 w-2 rounded-full ${fault ? "bg-red-400" : hasEngineFrame ? "bg-emerald-400" : "bg-slate-500"}`} />3D PROCESS MACHINE</div><div className="mt-1 text-[10px] text-slate-500">CAUSAL FRAME → PROCESS VISUAL MODEL</div></div>
        <div className={`rounded-lg border px-3 py-2 font-mono text-[9px] ${fault ? "border-red-500/30 bg-red-500/10 text-red-300" : hasEngineFrame ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300" : "border-slate-700 bg-slate-950/80 text-slate-500"}`}>{fault ? "SAFETY TRIP" : hasEngineFrame ? visual.stage : "UNKNOWN / NO FRAME"}</div>
      </div>
      <div className="pointer-events-none absolute left-4 top-20 space-y-1.5 font-mono text-[9px]"><div className="rounded bg-slate-950/70 px-2 py-1 text-slate-400">REACTOR / CHAMBER</div><div className="rounded bg-slate-950/70 px-2 py-1 text-slate-400">MATERIAL / ULTRASONIC</div><div className="rounded bg-slate-950/70 px-2 py-1 text-slate-400">VAPOR → COLD TRAPS</div><div className="rounded bg-slate-950/70 px-2 py-1 text-slate-400">VACUUM → PUMP</div></div>
      <div className="pointer-events-none absolute right-4 top-20 rounded-xl border border-white/10 bg-slate-950/80 p-3 font-mono text-[9px] shadow-xl backdrop-blur"><div className="mb-2 text-[8px] tracking-[0.2em] text-slate-500">EFFECTIVE CONNECTIONS</div><div className="space-y-1.5 text-slate-400"><div><span className={commands?.vacuumPump ? "text-cyan-300" : "text-slate-600"}>●</span> VACUUM PATH</div><div><span className={commands?.extractor || commands?.condenser ? "text-sky-300" : "text-slate-600"}>●</span> VAPOR PATH</div><div><span className={commands?.cooling ? "text-blue-300" : "text-slate-600"}>●</span> COOLING PATH</div><div><span className={commands?.heater ? "text-amber-300" : "text-slate-600"}>●</span> HEAT / POWER</div></div><div className="mt-2 border-t border-white/10 pt-2 text-[8px] text-slate-600">FLOW PARTICLES = EFFECTIVE PATH STATE, NOT FLOW-RATE MEASUREMENT</div></div>
      <div className="absolute bottom-3 left-3 right-3 grid grid-cols-2 gap-2 md:grid-cols-6"><div className="rounded-lg border border-cyan-500/20 bg-slate-950/85 p-2 font-mono backdrop-blur"><div className="text-[8px] text-slate-500">REACTOR</div><div className="text-sm text-cyan-300">{displayNumber(visual.temperatureC, 1, "°C")}</div></div><div className="rounded-lg border border-cyan-500/20 bg-slate-950/85 p-2 font-mono backdrop-blur"><div className="text-[8px] text-slate-500">PRESSURE</div><div className="text-sm text-cyan-300">{displayNumber(visual.pressureMbar, 1, "mbar")}</div></div>{[0,1,2,3].map(index => <div key={index} className="rounded-lg border border-slate-800 bg-slate-950/85 p-2 font-mono backdrop-blur"><div className="text-[8px] text-slate-500">COLD TRAP {index + 1}</div><div className="text-sm text-sky-300">{displayNumber(traps?.[index], 1, "°C")}</div><div className="text-[8px] text-slate-500">CONDENSED {displayNumber(condensed?.[index], 3, "kg")}</div></div>)}</div>
      <div className="pointer-events-none absolute bottom-[102px] left-4 rounded-lg border border-violet-500/20 bg-slate-950/80 px-3 py-2 font-mono text-[8px] backdrop-blur"><div className="text-slate-600">ULTRASONIC</div><div className="mt-1 text-violet-300">{ultrasonicModelled ? displayNumber(visual.ultrasonicEffectivePowerW, 0, "W") : "UNKNOWN"}</div><div className="text-slate-600">MODELLED / EXPERIMENTAL-DATA-LIMITED</div></div>
    </div>
  );
}
