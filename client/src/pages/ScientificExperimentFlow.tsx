import { useState } from "react";
import { ScientificExperimentIntake } from "@/components/ScientificExperimentIntake";
import { ProcessSimulator } from "@/components/ProcessSimulator";

export default function ScientificExperimentFlow() {
  const [experimentId, setExperimentId] = useState<string | null>(null);

  if (experimentId) {
    return <ProcessSimulator experimentId={experimentId} onExit={() => setExperimentId(null)} />;
  }

  return <ScientificExperimentIntake onComplete={setExperimentId} />;
}
