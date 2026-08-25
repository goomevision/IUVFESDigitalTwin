export interface WhyThisValueProps {
  source: string;
  field: string;
  classification: "SIMULATION" | "DERIVED" | "UNKNOWN";
  meaning: string;
  notMeaning: string;
  frameLabel?: string;
}

export function WhyThisValue({ source, field, classification, meaning, notMeaning, frameLabel }: WhyThisValueProps) {
  return <details className="mt-2 border-t border-slate-800 pt-2 text-left"><summary className="cursor-pointer font-mono text-[7px] tracking-[0.12em] text-cyan-300 hover:text-cyan-100">WHY THIS VALUE?</summary><div className="mt-2 space-y-1.5 text-[9px] leading-relaxed text-slate-500"><p><span className="text-slate-600">SOURCE:</span> {source}</p><p><span className="text-slate-600">FIELD:</span> {field}</p><p><span className="text-slate-600">CLASSIFICATION:</span> <span className="text-cyan-200">{classification}</span></p>{frameLabel ? <p><span className="text-slate-600">RUNTIME:</span> {frameLabel}</p> : null}<p><span className="text-slate-600">MEANING:</span> {meaning}</p><p className="text-amber-200"><span className="text-amber-300/70">NOT:</span> {notMeaning}</p></div></details>;
}
