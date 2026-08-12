import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { CausalFrame } from "../../../server/closedLoopSimulation";

interface Props {
  frame?: CausalFrame;
}

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
}

export function getProcessMachineVisualState(frame?: CausalFrame): ProcessMachineVisualState {
  if (!frame) {
    return {
      hasFrame: false,
      stage: undefined,
      timestampSeconds: undefined,
      commands: undefined,
      temperatureC: undefined,
      pressureMbar: undefined,
      overTemperature: undefined,
      vacuumAchieved: undefined,
      coldTrapTemperaturesC: undefined,
      condensedWaterKg: undefined,
    };
  }

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
  };
}

function tubeBetween(curve: THREE.Curve<THREE.Vector3>, radius: number, material: THREE.MeshBasicMaterial) {
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 40, radius, 12, false), material);
}

function setHex(material: THREE.Material, hex: number) {
  if (material instanceof THREE.MeshBasicMaterial || material instanceof THREE.MeshStandardMaterial) material.color.setHex(hex);
}

function setEmissive(material: THREE.Material, hex: number) {
  if (material instanceof THREE.MeshStandardMaterial) material.emissive.setHex(hex);
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
    camera.position.set(11.5, 7.2, 16.5);
    camera.lookAt(0.2, 0.7, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

    // Reactor hierarchy: shell -> chamber -> heater -> ultrasonic transducer.
    const reactor = new THREE.Group();
    reactor.position.set(-4.1, 0.55, 0);
    scene.add(reactor);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.72, 1.72, 4.85, 48), new THREE.MeshStandardMaterial({ color: 0x18283b, metalness: 0.84, roughness: 0.2 }));
    reactor.add(body);
    const chamber = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.28, 3.92, 48), new THREE.MeshStandardMaterial({ color: 0x0a1726, metalness: 0.25, roughness: 0.12, transparent: true, opacity: 0.56, emissive: 0x07334a }));
    reactor.add(chamber);
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

    // Vacuum hardware is separated from the reactor so the causal path is readable.
    const pump = new THREE.Group();
    pump.position.set(4.7, -0.55, 1.55);
    scene.add(pump);
    const pumpBody = new THREE.Mesh(new THREE.BoxGeometry(2.25, 1.5, 1.58), new THREE.MeshStandardMaterial({ color: 0x172033, metalness: 0.86, roughness: 0.24 }));
    pump.add(pumpBody);
    const pumpRotor = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.16, 32), new THREE.MeshBasicMaterial({ color: 0x334155 }));
    pumpRotor.rotation.z = Math.PI / 2;
    pumpRotor.position.x = -1.07;
    pump.add(pumpRotor);

    // Four traps map one-to-one to the engine hardware diagnostic tuple.
    const trapGroups: THREE.Group[] = [];
    const trapBodies: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>[] = [];
    const trapCoils: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>[] = [];
    for (let i = 0; i < 4; i += 1) {
      const group = new THREE.Group();
      group.position.set(-1.9 + i * 2.45, 3.35, -1.55);
      scene.add(group);
      trapGroups.push(group);
      const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 1.95, 32), new THREE.MeshStandardMaterial({ color: 0x15243a, metalness: 0.72, roughness: 0.24, transparent: true, opacity: 0.8, emissive: 0x061522 }));
      group.add(shell);
      trapBodies.push(shell);
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.065, 10, 32), new THREE.MeshBasicMaterial({ color: 0x2563eb }));
      coil.rotation.x = Math.PI / 2;
      coil.position.y = -0.15;
      group.add(coil);
      trapCoils.push(coil);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.12, 32), new THREE.MeshStandardMaterial({ color: 0x203149, metalness: 0.85, roughness: 0.2 }));
      base.position.y = -1.04;
      group.add(base);
    }

    const vacuumLineMaterial = new THREE.MeshBasicMaterial({ color: 0x164e63 });
    const vaporLineMaterial = new THREE.MeshBasicMaterial({ color: 0x155e75 });
    const coolingLineMaterial = new THREE.MeshBasicMaterial({ color: 0x1e3a5f });
    const powerCableMaterial = new THREE.MeshBasicMaterial({ color: 0x334155 });
    const vacuumCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-2.25, 0.15, 0.58), new THREE.Vector3(-0.1, 0.15, 0.58), new THREE.Vector3(2.35, -0.02, 1.22), new THREE.Vector3(3.62, -0.35, 1.55)]);
    const vaporCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-2.72, 2.48, 0), new THREE.Vector3(-0.8, 2.48, 0), new THREE.Vector3(0.45, 3.02, -0.92), new THREE.Vector3(5.25, 3.02, -1.55)]);
    const coolingCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(4.45, 1.62, -1.5), new THREE.Vector3(2.7, 1.62, -2.35), new THREE.Vector3(0, 1.7, -2.35), new THREE.Vector3(-2.05, 1.26, -0.82)]);
    const powerCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(5.75, -1.28, 2.58), new THREE.Vector3(4.5, -1.0, 2.58), new THREE.Vector3(2.0, 0, 1.9), new THREE.Vector3(-1.0, 0.2, 0.82), new THREE.Vector3(-3.42, 0.2, 0)]);
    scene.add(tubeBetween(vacuumCurve, 0.1, vacuumLineMaterial));
    scene.add(tubeBetween(vaporCurve, 0.088, vaporLineMaterial));
    scene.add(tubeBetween(coolingCurve, 0.072, coolingLineMaterial));
    scene.add(tubeBetween(powerCurve, 0.036, powerCableMaterial));

    const flowParticles = new THREE.Group();
    scene.add(flowParticles);
    for (let i = 0; i < 24; i += 1) {
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.046, 8, 8), new THREE.MeshBasicMaterial({ color: 0x67e8f9 }));
      particle.userData.offset = i / 24;
      flowParticles.add(particle);
    }
    const chamberParticles = new THREE.Group();
    scene.add(chamberParticles);
    for (let i = 0; i < 36; i += 1) {
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), new THREE.MeshBasicMaterial({ color: 0x67e8f9 }));
      particle.userData.offset = i / 36;
      chamberParticles.add(particle);
    }

    let raf = 0;
    const resize = () => {
      camera.aspect = mount.clientWidth / Math.max(mount.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", resize);
    resize();

    const animate = () => {
      const visual = getProcessMachineVisualState(frameRef.current);
      const commands = visual.commands;
      const timestamp = visual.timestampSeconds ?? 0;
      const temperature = visual.temperatureC;
      const pressure = visual.pressureMbar;
      const hasTemperature = typeof temperature === "number" && Number.isFinite(temperature);
      const hasPressure = typeof pressure === "number" && Number.isFinite(pressure);
      const vacuum = commands?.vacuumPump === true;
      const hot = commands?.heater === true;
      const extracting = commands?.extractor === true;
      const condensing = commands?.condenser === true;
      const cooling = commands?.cooling === true;
      const fault = visual.overTemperature === true;
      const vacuumLevel = hasPressure ? Math.max(0, Math.min(1, 1 - pressure! / 1013.25)) : 0;
      const thermal = hasTemperature ? Math.max(0, Math.min(1, (temperature! - 25) / 125)) : 0;
      const activeProcess = Boolean(commands);

      // Motion is derived from the persisted CausalFrame timestamp, not wall-clock time.
      // The same frame therefore produces the same visual state during live view and replay.
      pumpRotor.rotation.x = timestamp * (vacuum ? 18 : 1.2);
      reactor.rotation.y = Math.sin(timestamp * 0.35) * 0.02;
      setHex(heaterRing.material, fault ? 0xef4444 : hot ? 0xf97316 : 0x334155);
      setEmissive(chamber.material, fault ? 0x5f1111 : hot ? 0x5a2108 : 0x07334a);
      setHex(ultrasonic.material, extracting ? 0xa78bfa : 0x334155);
      key.color.setHex(fault ? 0xef4444 : hot ? 0xfb923c : 0x22d3ee);
      key.intensity = hot ? 30 : 18;
      setHex(pumpRotor.material, vacuum ? 0x22d3ee : 0x334155);
      setHex(vacuumLineMaterial, vacuum ? 0x22d3ee : 0x164e63);
      setHex(vaporLineMaterial, extracting || condensing ? 0x38bdf8 : 0x155e75);
      setHex(coolingLineMaterial, cooling ? 0x60a5fa : 0x1e3a5f);
      setHex(powerCableMaterial, hot || vacuum || extracting || condensing || cooling ? 0xf59e0b : 0x334155);

      trapGroups.forEach((group, index) => {
        const trapTemperature = visual.coldTrapTemperaturesC?.[index];
        const hasTrapTemperature = typeof trapTemperature === "number" && Number.isFinite(trapTemperature);
        const coldFactor = hasTrapTemperature ? Math.max(0, Math.min(1, (25 - trapTemperature!) / 105)) : 0;
        const active = condensing || cooling;
        setEmissive(trapBodies[index].material, active && hasTrapTemperature ? coldFactor > 0.65 ? 0x082f49 : 0x10243a : 0x061522);
        trapCoils[index].material.color.setHex(active && hasTrapTemperature ? coldFactor > 0.65 ? 0x60a5fa : 0x38bdf8 : 0x2563eb);
        group.position.y = 3.35 + Math.sin(timestamp * 0.5 + index) * 0.015;
      });

      chamberParticles.children.forEach((particle, index) => {
        const offset = particle.userData.offset as number;
        const travel = (timestamp * (vacuum || extracting ? 0.09 : 0.015) + offset) % 1;
        particle.position.set(-1.0 + travel * 1.9, -1.35 + ((index * 0.47) % 2.7), 0.4 + Math.sin(index * 1.7 + timestamp) * 0.5);
        particle.visible = activeProcess && hasPressure && (vacuum || extracting || hot);
        particle.scale.setScalar(0.45 + vacuumLevel * 1.2 + thermal * 0.7);
      });

      flowParticles.children.forEach((particle, index) => {
        const offset = particle.userData.offset as number;
        const active = vacuum || extracting || condensing || cooling;
        const curve = extracting || condensing ? vaporCurve : cooling ? coolingCurve : vacuumCurve;
        const travel = active ? (timestamp * (vacuum ? 0.18 : 0.1) + offset) % 1 : 0;
        particle.position.copy(active ? curve.getPointAt(travel) : new THREE.Vector3(0, -20, 0));
        particle.visible = active;
        particle.scale.setScalar(active ? 0.7 + thermal * 0.5 : 0);
        const material = (particle as THREE.Mesh).material as THREE.MeshBasicMaterial;
        material.color.setHex(cooling ? 0x60a5fa : vacuum ? 0x22d3ee : 0xfbbf24);
        if (index % 3 === 0 && condensing) particle.scale.multiplyScalar(0.7);
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) material.forEach(item => item.dispose());
          else material.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  const visual = getProcessMachineVisualState(frame);
  const stage = visual.stage;
  const fault = visual.overTemperature === true;
  const commands = visual.commands;
  const hasEngineFrame = visual.hasFrame;
  const traps = visual.coldTrapTemperaturesC;
  const condensed = visual.condensedWaterKg;

  return (
    <div className="relative h-[590px] overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950/90 shadow-2xl shadow-cyan-950/20">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-slate-950/95 via-slate-950/65 to-transparent p-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.25em] text-cyan-300">
            <span className={`h-2 w-2 rounded-full ${fault ? "bg-red-400" : hasEngineFrame ? "bg-emerald-400" : "bg-slate-500"}`} />
            3D PROCESS MACHINE
          </div>
          <div className="mt-1 text-[10px] text-slate-500">CAUSAL FRAME → PROCESS VISUAL MODEL</div>
        </div>
        <div className={`rounded-lg border px-3 py-2 font-mono text-[9px] ${fault ? "border-red-500/30 bg-red-500/10 text-red-300" : hasEngineFrame ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300" : "border-slate-700 bg-slate-950/80 text-slate-500"}`}>
          {fault ? "SAFETY TRIP" : hasEngineFrame ? stage : "UNKNOWN / NO FRAME"}
        </div>
      </div>
      <div className="pointer-events-none absolute left-4 top-20 space-y-1.5 font-mono text-[9px]">
        <div className="rounded bg-slate-950/70 px-2 py-1 text-slate-400">REACTOR / CHAMBER</div>
        <div className="rounded bg-slate-950/70 px-2 py-1 text-slate-400">ULTRASONIC</div>
        <div className="rounded bg-slate-950/70 px-2 py-1 text-slate-400">VAPOR → COLD TRAPS</div>
        <div className="rounded bg-slate-950/70 px-2 py-1 text-slate-400">VACUUM → PUMP</div>
      </div>
      <div className="pointer-events-none absolute right-4 top-20 rounded-xl border border-white/10 bg-slate-950/80 p-3 font-mono text-[9px] shadow-xl backdrop-blur">
        <div className="mb-2 text-[8px] tracking-[0.2em] text-slate-500">EFFECTIVE CONNECTIONS</div>
        <div className="space-y-1.5 text-slate-400">
          <div><span className={commands?.vacuumPump ? "text-cyan-300" : "text-slate-600"}>●</span> VACUUM LINE</div>
          <div><span className={commands?.extractor || commands?.condenser ? "text-sky-300" : "text-slate-600"}>●</span> VAPOR LINE</div>
          <div><span className={commands?.cooling ? "text-blue-300" : "text-slate-600"}>●</span> COOLING LINE</div>
          <div><span className={commands?.heater ? "text-amber-300" : "text-slate-600"}>●</span> HEAT / POWER</div>
        </div>
      </div>
      <div className="absolute bottom-3 left-3 right-3 grid grid-cols-2 gap-2 md:grid-cols-6">
        <div className="rounded-lg border border-cyan-500/20 bg-slate-950/85 p-2 font-mono backdrop-blur">
          <div className="text-[8px] text-slate-500">REACTOR</div>
          <div className="text-sm text-cyan-300">{typeof visual.temperatureC === "number" ? `${visual.temperatureC.toFixed(1)} °C` : "UNKNOWN"}</div>
        </div>
        <div className="rounded-lg border border-cyan-500/20 bg-slate-950/85 p-2 font-mono backdrop-blur">
          <div className="text-[8px] text-slate-500">PRESSURE</div>
          <div className="text-sm text-cyan-300">{typeof visual.pressureMbar === "number" ? `${visual.pressureMbar.toFixed(1)} mbar` : "UNKNOWN"}</div>
        </div>
        {[0, 1, 2, 3].map(index => (
          <div key={index} className="rounded-lg border border-slate-800 bg-slate-950/85 p-2 font-mono backdrop-blur">
            <div className="text-[8px] text-slate-500">COLD TRAP {index + 1}</div>
            <div className="text-sm text-sky-300">{typeof traps?.[index] === "number" ? `${traps[index].toFixed(1)} °C` : "UNKNOWN"}</div>
            <div className="text-[8px] text-slate-500">CONDENSED {typeof condensed?.[index] === "number" ? `${condensed[index].toFixed(3)} kg` : "UNKNOWN"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
