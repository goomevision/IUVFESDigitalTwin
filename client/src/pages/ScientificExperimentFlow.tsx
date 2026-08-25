import { useState } from "react";
import { ScientificExperimentIntake } from "@/components/ScientificExperimentIntake";
import { ProcessSimulator } from "@/components/ProcessSimulator";
import { ControlRoomAccessGate } from "@/components/ControlRoomAccessGate";

export default function ScientificExperimentFlow() {
  const [experimentId, setExperimentId] = useState<string | null>(null);

  return <ControlRoomAccessGate>{experimentId
    ? <ProcessSimulator experimentId={experimentId} onExit={() => setExperimentId(null)} />
    : <ScientificExperimentIntake onComplete={setExperimentId} />}</ControlRoomAccessGate>;
}
