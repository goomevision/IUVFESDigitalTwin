import type { ExperimentCloseout, ExperimentNotebook, ExperimentStartRequest } from '@shared/experimentNotebook';

/** In-memory research notebook adapter. Replace with persistent DB/object-store adapter before production use. */
export class ExperimentNotebookStore {
  private readonly experiments = new Map<string, ExperimentNotebook>();

  start(request: ExperimentStartRequest, now = new Date()): ExperimentNotebook {
    const timestamp = now.toISOString();
    const experiment: ExperimentNotebook = {
      experimentId: `IUVFES-EXP-${now.getTime()}`,
      ...request,
      status: 'ready',
      notes: [],
      observations: [],
      datasetIds: [],
      simulationIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.experiments.set(experiment.experimentId, experiment);
    return this.clone(experiment);
  }

  begin(experimentId: string): ExperimentNotebook {
    return this.update(experimentId, { status: 'running' });
  }

  pause(experimentId: string): ExperimentNotebook { return this.update(experimentId, { status: 'paused' }); }

  addObservation(experimentId: string, observation: ExperimentNotebook['observations'][number]): ExperimentNotebook {
    const current = this.require(experimentId);
    current.observations.push({ ...observation });
    current.updatedAt = new Date().toISOString();
    return this.clone(current);
  }

  addNote(experimentId: string, note: ExperimentNotebook['notes'][number]): ExperimentNotebook {
    const current = this.require(experimentId);
    current.notes.push({ ...note });
    current.updatedAt = new Date().toISOString();
    return this.clone(current);
  }

  attachDataset(experimentId: string, datasetId: string, origin: DataOriginForAttachment): ExperimentNotebook {
    const current = this.require(experimentId);
    if (!current.datasetIds.includes(datasetId)) current.datasetIds.push(datasetId);
    current.notes.push({ timestamp: new Date().toISOString(), authorId: 'SYSTEM', text: `Attached ${origin} dataset ${datasetId}.` });
    current.updatedAt = new Date().toISOString();
    return this.clone(current);
  }

  attachSimulation(experimentId: string, simulationId: string): ExperimentNotebook {
    const current = this.require(experimentId);
    if (!current.simulationIds.includes(simulationId)) current.simulationIds.push(simulationId);
    current.updatedAt = new Date().toISOString();
    return this.clone(current);
  }

  close(closeout: ExperimentCloseout): ExperimentNotebook {
    const current = this.require(closeout.experimentId);
    current.status = closeout.outcome === 'SUCCESS' ? 'completed' : 'failed';
    current.datasetIds = Array.from(new Set([...current.datasetIds, closeout.rawDatasetId, ...(closeout.processedDatasetId ? [closeout.processedDatasetId] : [])]));
    if (closeout.digitalTwinSimulationId) current.simulationIds = Array.from(new Set([...current.simulationIds, closeout.digitalTwinSimulationId]));
    current.notes.push({ timestamp: new Date().toISOString(), authorId: closeout.experimentId, text: `Closeout: ${closeout.outcome}. ${closeout.conclusion}` });
    current.updatedAt = new Date().toISOString();
    return this.clone(current);
  }

  get(experimentId: string): ExperimentNotebook { return this.clone(this.require(experimentId)); }

  private update(experimentId: string, patch: Partial<ExperimentNotebook>): ExperimentNotebook {
    const current = this.require(experimentId);
    Object.assign(current, patch, { updatedAt: new Date().toISOString() });
    return this.clone(current);
  }

  private require(experimentId: string): ExperimentNotebook {
    const found = this.experiments.get(experimentId);
    if (!found) throw new Error(`Experiment not found: ${experimentId}`);
    return found;
  }

  private clone<T>(value: T): T { return structuredClone(value); }
}

type DataOriginForAttachment = 'EXPERIMENTAL' | 'DERIVED';
