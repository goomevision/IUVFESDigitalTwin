import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { ProcessStage } from "../../../server/processStateEngine";

interface MachineState3D { stage: ProcessStage; commands: { vacuumPump: boolean; heater: boolean; extractor: boolean; condenser: boolean; cooling: boolean }; sensors: { pressureMbar: number; temperatureC: number }; interlocks: { vacuumAchieved: boolean; overTemperature: boolean }; }
interface Props { machine?: MachineState3D; }

export function ProcessMachine3D({ machine }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef(machine); stateRef.current = machine;
  useEffect(() => {
    const mount = mountRef.current; if (!mount) return;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x030712);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100); camera.position.set(8, 5, 10); camera.lookAt(0, 1, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); mount.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0x9ee7ff, 0x08111f, 1.5));
    const key = new THREE.PointLight(0x22d3ee, 18, 25); key.position.set(3, 7, 5); scene.add(key);
    const reactor = new THREE.Group(); reactor.position.set(-2.7, 1, 0); scene.add(reactor);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 4.6, 40), new THREE.MeshStandardMaterial({ color: 0x16263b, metalness: .8, roughness: .22 })); reactor.add(body);
    const chamber = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 3.7, 40), new THREE.MeshStandardMaterial({ color: 0x0a1524, metalness: .35, roughness: .15, transparent: true, opacity: .65, emissive: 0x07334a })); reactor.add(chamber);
    const heaterRing = new THREE.Mesh(new THREE.TorusGeometry(1.45, .08, 12, 40), new THREE.MeshBasicMaterial({ color: 0x334155 })); heaterRing.rotation.x = Math.PI / 2; heaterRing.position.y = 1.1; reactor.add(heaterRing);
    const pump = new THREE.Group(); pump.position.set(2.3, -.1, 1.3); scene.add(pump);
    const pumpBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 1.5), new THREE.MeshStandardMaterial({ color: 0x172033, metalness: .85, roughness: .25 })); pump.add(pumpBody);
    const rotor = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .15, 28), new THREE.MeshBasicMaterial({ color: 0x334155 })); rotor.rotation.z = Math.PI / 2; rotor.position.x = -1.05; pump.add(rotor);
    const condenser = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, 2.8, 28), new THREE.MeshStandardMaterial({ color: 0x18263c, metalness: .75, roughness: .25, emissive: 0x061522 })); condenser.position.set(2.6, 2.8, -1.8); scene.add(condenser);
    const line = (points: [number,number,number][], color: number) => { const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))); return new THREE.Mesh(new THREE.TubeGeometry(curve, 24, .075, 10, false), new THREE.MeshBasicMaterial({ color })); };
    const vacuumLine = line([[-1.15,.35,.7],[0,.35,.7],[1.2,.1,1.05],[1.25,-.1,1.3]],0x164e63);
    const vaporLine = line([[-1.05,2.4,.1],[-.1,2.4,.1],[1.2,2.5,-.8],[2.45,2.45,-1.55]],0x155e75);
    const coolingLine = line([[2.35,1.6,-1.55],[1.55,1.6,-2.3],[.2,1.4,-2.3],[-1.2,1.25,-.95]],0x1e3a5f);
    scene.add(vacuumLine,vaporLine,coolingLine);
    const resize = () => { camera.aspect = mount.clientWidth / Math.max(mount.clientHeight,1); camera.updateProjectionMatrix(); renderer.setSize(mount.clientWidth,mount.clientHeight); }; resize(); window.addEventListener("resize",resize);
    let raf = 0; let t = 0;
    const animate = () => { const s = stateRef.current; const c=s?.commands; const hot=!!c?.heater; const vacuum=!!c?.vacuumPump; const active=!!(c?.extractor||c?.condenser); const cooling=!!c?.cooling; const fault=!!s?.interlocks.overTemperature; heaterRing.material.color.setHex(fault?0xef4444:hot?0xf97316:0x334155); chamber.material.emissive.setHex(fault?0x5f1111:hot?0x5a2108:0x07334a); key.color.setHex(fault?0xef4444:hot?0xfb923c:0x22d3ee); key.intensity=hot?28:18; rotor.rotation.x += vacuum?.28:.02; rotor.material.color.setHex(vacuum?0x22d3ee:0x334155); condenser.material.emissive.setHex(c?.condenser?0x082f49:0x061522); reactor.rotation.y=Math.sin(t*.35)*.025; t+=.016; renderer.render(scene,camera); raf=requestAnimationFrame(animate); }; animate();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize",resize); renderer.dispose(); mount.removeChild(renderer.domElement); };
  }, []);
  const commands = machine?.commands; const fault = machine?.interlocks.overTemperature; return <div className="relative h-[500px] overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950/90"><div ref={mountRef} className="absolute inset-0" /><div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between bg-gradient-to-b from-slate-950/95 to-transparent p-4"><div><div className="font-mono text-[10px] tracking-[.25em] text-cyan-300">3D MACHINE DIGITAL TWIN</div><div className="text-[10px] text-slate-500">ENGINE STATE → EFFECTIVE ACTUATION → VISUAL MODEL</div></div><div className={`rounded-lg border px-3 py-2 font-mono text-[9px] ${fault?"border-red-500/30 text-red-300":"border-emerald-500/20 text-emerald-300"}`}>{fault?"SAFETY TRIP":machine?"LIVE ENGINE FRAME":"WAITING FOR ENGINE FRAME"}</div></div><div className="pointer-events-none absolute bottom-4 left-4 rounded-xl border border-white/10 bg-slate-950/80 p-3 font-mono text-[9px] text-slate-400"><div>PRESSURE {machine?.sensors.pressureMbar.toFixed(1) ?? "—"} mbar</div><div>TEMPERATURE {machine?.sensors.temperatureC.toFixed(1) ?? "—"} °C</div><div>VACUUM {commands?.vacuumPump?"ACTIVE":"OFF"} · HEATER {commands?.heater?"ACTIVE":"OFF"}</div><div>EXTRACTOR {commands?.extractor?"ACTIVE":"OFF"} · CONDENSER {commands?.condenser?"ACTIVE":"OFF"}</div><div>COOLING {commands?.cooling?"ACTIVE":"OFF"}</div></div></div>;
}
