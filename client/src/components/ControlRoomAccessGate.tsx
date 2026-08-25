import { ShieldAlert, ShieldCheck, RefreshCw } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { recordControlRoomEvent, toOperatorReference } from "@/lib/controlRoomObservability";

export function ControlRoomAccessGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const previousAuthenticated = useRef<boolean | null>(null);

  useEffect(() => {
    if (auth.loading) return;
    const authenticated = auth.isAuthenticated;
    const previous = previousAuthenticated.current;
    previousAuthenticated.current = authenticated;
    if (authenticated) {
      recordControlRoomEvent({ event: "AUTH_SUCCESS", result: "SUCCESS", operator: toOperatorReference(auth.user) });
    } else {
      recordControlRoomEvent({
        event: previous ? "AUTH_SESSION_EXPIRED" : "AUTH_FAILURE",
        result: "BLOCKED",
        detail: { reason: auth.error instanceof Error ? auth.error.message : "auth.me returned no operator identity" },
      });
    }
  }, [auth.error, auth.isAuthenticated, auth.loading, auth.user]);

  if (auth.loading) {
    return <main className="grid min-h-screen place-items-center bg-[#020712] p-6 text-slate-100"><div className="border border-cyan-500/25 bg-slate-950/80 p-5 font-mono text-xs tracking-[0.16em] text-cyan-200">VERIFYING OPERATOR IDENTITY…</div></main>;
  }

  if (!auth.isAuthenticated) {
    return <main className="grid min-h-screen place-items-center bg-[#020712] p-6 text-slate-100"><section className="w-full max-w-xl border border-amber-500/35 bg-slate-950/90 p-6 shadow-[0_0_55px_rgba(245,158,11,0.12)]"><div className="flex items-center gap-3 text-amber-300"><ShieldAlert className="h-6 w-6" /><span className="font-mono text-xs tracking-[0.2em]">NOT AUTHENTICATED</span></div><h1 className="mt-4 text-2xl font-semibold">Operator session is required</h1><p className="mt-3 text-sm leading-relaxed text-slate-400">Experiment selection, canonical session recovery, Control Room operation, and 3D interaction remain unavailable until <code className="text-cyan-200">auth.me</code> returns a valid operator identity. No experiment, session, telemetry, or fallback identity has been created.</p><div className="mt-5 flex flex-wrap gap-2"><Button onClick={() => { recordControlRoomEvent({ event: "AUTH_ATTEMPT", result: "INFO" }); startLogin(); }} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"><ShieldCheck className="mr-2 h-4 w-4" />AUTHENTICATE OPERATOR</Button><Button variant="outline" onClick={() => void auth.refresh()} className="border-slate-700 text-slate-300"><RefreshCw className="mr-2 h-4 w-4" />RECHECK AUTH</Button></div><p className="mt-4 font-mono text-[10px] leading-relaxed text-slate-600">P10 remains AUTH BLOCKED until legitimate authentication succeeds on the active deployment.</p></section></main>;
  }

  return <>{children}</>;
}
