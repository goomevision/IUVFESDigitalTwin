import { createHash } from 'node:crypto';
import type { DatasetManifest, ProvenanceRef } from '@shared/scientificData';

export interface ProvenanceEvent {
  id: string;
  entityId: string;
  activity: string;
  agentId: string;
  timestamp: string;
  inputs: ProvenanceRef[];
  outputs: ProvenanceRef[];
  attributes?: Record<string, unknown>;
}

/**
 * Immutable-in-process provenance journal.
 * Persist these events to the scientific-data store when the DB schema is enabled.
 */
export class ScientificProvenanceJournal {
  private readonly events: ProvenanceEvent[] = [];

  record(event: Omit<ProvenanceEvent, 'id'>): ProvenanceEvent {
    const id = this.makeId(event);
    const saved = { ...event, id };
    this.events.push(saved);
    return { ...saved, inputs: [...saved.inputs], outputs: [...saved.outputs] };
  }

  list(entityId?: string): ProvenanceEvent[] {
    return this.events
      .filter(event => !entityId || event.entityId === entityId)
      .map(event => ({ ...event, inputs: [...event.inputs], outputs: [...event.outputs] }));
  }

  buildDatasetManifest(input: Omit<DatasetManifest, 'sha256'>, canonicalData: unknown): DatasetManifest {
    const canonical = JSON.stringify(canonicalData);
    return {
      ...input,
      sha256: createHash('sha256').update(canonical, 'utf8').digest('hex'),
      provenance: input.provenance.map(ref => ({ ...ref })),
    };
  }

  private makeId(event: Omit<ProvenanceEvent, 'id'>): string {
    return createHash('sha256')
      .update(JSON.stringify(event), 'utf8')
      .digest('hex')
      .slice(0, 24);
  }
}
