import React from "react";

export function ProcessMachine3D({ machine }: { machine?: any }) {
  const commands = machine?.commands ?? {};
  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold tracking-wider text-cyan-300">VIRTUAL MACHINE</h3>
        <span className="font-mono text-xs text-slate-500">DIGITAL TWIN</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {Object.entries(commands).map(([name, value]) => (
          <div key={name} className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
            <div className="text-[10px] uppercase tracking-widest text-slate-500">{name}</div>
            <div className="mt-1 font-mono text-sm text-cyan-300">{value ? "ON" : "OFF"}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
