import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { ProcessStage } from "../../../server/processStateEngine";

interface MachineState3D {
  stage: ProcessStage;
  commands: { vacuumPump: boolean; heater: boolean; extractor: boolean; condenser: boolean; cooling: boolean };
  sensors: { pressureMbar: number; temperatureC: number };
  interlocks: { vacuumAchieved: boolean; overTemperature: boolean };
}

interface Props { machine?: MachineState3D; }

function tubeBetween(curve: THREE.Curve<THREE.Vector3>, radius: number, material: THREE.MeshBasicMaterial) {
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 10, false), material);
}

export function ProcessMachine3D({ machine }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef(machine);
  stateRef.current = machine;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(8, 6, 11);
    camera.lookAt(0, 1, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0x9ee7ff, 0x08111f, 1.6));
    const key = new THREE.PointLight(0x22d3ee, 20, 25);
    key.position.set(3, 7, 5); scene.add(key);

    const floor = new THREE.Mesh(new THREE.CircleGeometry(7, 64), new THREE.MeshBasicMaterial({ color: 0x07111e, transparent: true, opacity: 0.9 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -1.5; scene.add(floor);

    const reactor = new THREE.Group(); reactor.position.set(-2.7, 1, 0); scene.add(reactor);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 4.6, 48), new THREE.MeshStandardMaterial({ color: 0x16263b, metalness: 0.8, roughness: 0.22 }));
    reactor.add(body);
    const chamber = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 3.7, 48), new THREE.MeshStandardMaterial({ color: 0x0a1524, metalness: 0.35, roughness: 0.15, transparent: true, opacity: 0.62, emissive: 0x07334a }));
    reactor.add(chamber);
    const heaterRing = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.08, 12, 48), new THREE.MeshBasicMaterial({ color: 0x334155 }));
    heaterRing.rotation.x = Math.PI / 2; heaterRing.position.y = 1.1; reactor.add(heaterRing);

    const pump = new THREE.Group(); pump.position.set(2.3, -0.1, 1.3); scene.add(pump);
    const pumpBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 1.5), new THREE.MeshStandardMaterial({ color: 0x172033, metalness: 0.85, roughness: 0.25 })); pump.add(pumpBody);
    const pumpRotor = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.15, 32), new THREE.MeshBasicMaterial({ color: 0x22d3ee })); pumpRotor.rotation.z = Math.PI / 2; pumpRotor.position.x = -1.05; pump.add(pumpRotor);

    const condenser = new THREE.Group(); condenser.position.set(2.6, 2.8, -1.8); scene.add(condenser);
    const condenserBody = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2.8, 32), new THREE.MeshStandardMaterial({ color: 0x18263c, metalness: 0.75, roughness: 0.25 })); condenser.add(condenserBody);

    // Explicit process connections: these are visualized from the same effective actuator state as the engine frame.
    const vacuumLineMaterial = new THREE.MeshBasicMaterial({ color: 0x164e63 });
    const vaporLineMaterial = new THREE.MeshBasicMaterial({ color: 0x155e75 });
    const coolingLineMaterial = new THREE.MeshBasicMaterial({ color: 0x1e3a5f });
    const powerCableMaterial = new THREE.MeshBasicMaterial({ color: 0x334155 });

    const vacuumCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.15, 0.35, 0.7),
      new THREE.Vector3(0.0, 0.35, 0.7),
      new THREE.Vector3(1.2, 0.1, 1.05),
      new THREE.Vector3(1.25, -0.1, 1.3),
    ]);
    const vaporCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.05, 2.4, 0.1),
      new THREE.Vector3(-0.1, 2.4, 0.1),
      new THREE.Vector3(1.2, 2.5, -0.8),
      new THREE.Vector3(2.45, 2.45, -1.55),
    ]);
    const coolingCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(2.35, 1.6, -1.55),
      new THREE.Vector3(1.55, 1.6, -2.3),
      new THREE.Vector3(0.2, 1.4, -2.3),
      new THREE.Vector3(-1.2, 1.25, -0.95),
    ]);
    const powerCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(5.0, -1.1, 2.2),
      new THREE.Vector3(3.8, -0.8, 2.2),
      new THREE.Vector3(2.2, 0.2, 1.8),
      new THREE.Vector3(0.0, 0.0, 0.8),
      new THREE.Vector3(-1.8, 0.4, 0.0),
    ]);

    const vacuumLine = tubeBetween(vacuumCurve, 0.09, vacuumLineMaterial);
    const vaporLine = tubeBetween(vaporCurve, 0.085, vaporLineMaterial);
    const coolingLine = tubeBetween(coolingCurve, 0.07, coolingLineMaterial);
    const powerCable = tubeBetween(powerCurve, 0.035, powerCableMaterial);
    scene.add(vacuumLine, vaporLine, coolingLine, powerCable);

    const connectionNodes = [
      [-1.15, 0.35, 0.7], [1.25, -0.1, 1.3],
      [-1.05, 2.4, 0.1], [2.45, 2.45, -1.55],
      [2.35, 1.6, -1.55], [-1.2, 1.25, -0.95],
    ];
    connectionNodes.forEach(([x, y, z]) => {
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), new THREE.MeshBasicMaterial({ color: 0x334155 }));
      node.position.set(x, y, z); node.userData.connection = true; scene.add(node);
    });

    const flowParticles = new THREE.Group(); scene.add(flowParticles);
    for (let i = 0; i < 12; i++) {
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), new THREE.MeshBasicMaterial({ color: 0x67e8f9 }));
      particle.userData.offset = i / 12; flowParticles.add(particle);
    }

    const particles = new THREE.Group(); scene.add(particles);
    const particleMaterial = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
    for (let i = 0; i < 28; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), particleMaterial);
      p.userData.offset = i / 28; particles.add(p);
    }

    let frame = 0;
    let raf = 0;
    const resize = () => { if (!mount) return; camera.aspect = mount.clientWidth / Math.max(mount.clientHeight, 1); camera.updateProjectionMatrix(); renderer.setSize(mount.clientWidth, mount.clientHeight); };
    window.addEventListener("resize", resize); resize();

    const animate = () => {
      const state = stateRef.current;
      const commands = state?.commands;
      const temperature = state?.sensors.temperatureC ?? 25;
      const pressure = state?.sensors.pressureMbar ?? 1013;
      const hot = commands?.heater ?? false;
      const vacuum = commands?.vacuumPump ?? false;
      const extracting = commands?.extractor ?? false;
      const condensing = commands?.condenser ?? false;
      const cooling = commands?.cooling ?? false;
      const fault = state?.interlocks.overTemperature ?? false;
      const time = frame++ / 60;

      heaterRing.material.color.setHex(fault ? 0xef4444 : hot ? 0xf97316 : 0x334155);
      chamber.material.emissive.setHex(fault ? 0x5f1111 : hot ? 0x5a2108 : 0x07334a);
      key.color.setHex(fault ? 0xef4444 : hot ? 0xfb923c : 0x22d3ee);
      key.intensity = hot ? 30 : 18;
      pumpRotor.rotation.x += vacuum ? 0.28 : 0.02;
      pumpRotor.material.color.setHex(vacuum ? 0x22d3ee : 0x334155);
      condenserBody.material.emissive.setHex(condensing ? 0x082f49 : 0x061522);

      // Connection status follows effective commands; no visual cable is presented as active unless its actuator is active.
      vacuumLineMaterial.color.setHex(vacuum ? 0x22d3ee : 0x164e63);
      vaporLineMaterial.color.setHex(extracting || condensing ? 0x38bdf8 : 0x155e75);
      coolingLineMaterial.color.setHex(cooling ? 0x60a5fa : 0x1e3a5f);
      powerCableMaterial.color.setHex(hot || vacuum || extracting || condensing || cooling ? 0xf59e0b : 0x334155);

      reactor.rotation.y = Math.sin(time * 0.35) * 0.025;
      const vacuumLevel = Math.max(0, Math.min(1, 1 - pressure / 1013.25));
      const thermal = Math.max(0, Math.min(1, (temperature - 25) / 125));

      flowParticles.children.forEach((particle, i) => {
        const offset = particle.userData.offset as number;
        const active = vacuum || extracting || condensing || cooling;
        const travel = (time * (active ? 0.18 : 0.0) + offset) % 1;
        const point = active ? (vacuum ? vacuumCurve : extracting || condensing ? vaporCurve : coolingCurve).getPointAt(travel) : new THREE.Vector3(0, -10, 0);
        particle.position.copy(point);
        particle.visible = active;
        particle.scale.setScalar(active ? 0.8 + thermal * 0.6 : 0);
        const material = particle.material as THREE.MeshBasicMaterial;
        material.color.setHex(vacuum ? 0x22d3ee : cooling ? 0x60a5fa : 0xfbbf24);
        if (i % 2 === 0 && condensing) particle.scale.multiplyScalar(0.8);
      });

      particles.children.forEach((p, i) => {
        const offset = p.userData.offset as number;
        const travel = (time * (vacuum ? 0.16 : extracting ? 0.08 : 0.03) + offset) % 1;
        p.position.set(-1.1 + travel * 5.2, 1.1 + Math.sin(i * 1.7 + time) * 0.18, 0.5 + Math.cos(i * 1.2) * 0.55);
        p.visible = vacuum || extracting || condensing;
        p.scale.setScalar(0.5 + vacuumLevel * 1.5 + thermal * 0.8);
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); renderer.dispose(); mount.removeChild(renderer.domElement); };
  }, []);

  const stage = machine?.stage ?? "PRE_FLIGHT";
  const fault = machine?.interlocks.overTemperature;
  const commands = machine?.commands;
  return <div className="relative h-[460px] overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950/80">
    <div ref={mountRef} className="absolute inset-0" />
    <div className="pointer-events-none absolute left-4 top-4 font-mono text-[10px] tracking-[0.25em] text-cyan-400">3D MACHINE DIGITAL TWIN</div>
    <div className="pointer-events-none absolute right-4 top-4 rounded border border-cyan-500/20 bg-slate-950/85 px-3 py-2 font-mono text-[9px] text-slate-400">VISUAL LINK: EFFECTIVE COMMANDS</div>
    <div className="pointer-events-none absolute left-4 top-11 grid gap-1 font-mono text-[9px] text-slate-500">
      <span>VACUUM LINE {commands?.vacuumPump ? "● ACTIVE" : "○ STANDBY"}</span>
      <span>VAPOR LINE {commands?.extractor || commands?.condenser ? "● ACTIVE" : "○ STANDBY"}</span>
      <span>COOLING LINE {commands?.cooling ? "● ACTIVE" : "○ STANDBY"}</span>
    </div>
    <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 font-mono text-[10px]">
      <span className="rounded border border-slate-700 bg-slate-950/80 px-2 py-1 text-slate-400">STAGE: {stage}</span>
      <span className={`rounded border px-2 py-1 ${fault ? "border-red-500/50 text-red-300" : "border-emerald-500/30 text-emerald-300"}`}>{fault ? "SAFETY TRIP" : "INTERLOCKS OK"}</span>
      <span className="rounded border border-slate-700 bg-slate-950/80 px-2 py-1 text-slate-400">P {machine?.sensors.pressureMbar.toFixed(1) ?? "—"} mbar</span>
      <span className="rounded border border-slate-700 bg-slate-950/80 px-2 py-1 text-slate-400">T {machine?.sensors.temperatureC.toFixed(1) ?? "—"} °C</span>
      <span className="rounded border border-cyan-500/20 bg-slate-950/80 px-2 py-1 text-cyan-300">ENGINE → VISUAL</span>
    </div>
  </div>;
}
