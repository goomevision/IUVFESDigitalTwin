export type MachineEventSeverity = 'INFO' | 'WARNING' | 'ALARM' | 'TRIP';

export interface MachineEvent { sequence: number; timestamp: number; severity: MachineEventSeverity; code: string; message: string; stage: string; data?: Record<string, number | string | boolean>; }

export class MachineEventJournal {
  private sequence = 0;
  private events: MachineEvent[] = [];

  public record(event: Omit<MachineEvent, 'sequence'>): MachineEvent {
    const entry = { ...event, sequence: ++this.sequence };
    this.events.push(entry);
    return entry;
  }

  public transition(timestamp: number, from: string, to: string, reason: string): MachineEvent {
    return this.record({ timestamp, severity: 'INFO', code: 'STATE_TRANSITION', message: `${from} -> ${to}: ${reason}`, stage: to });
  }

  public alarm(timestamp: number, stage: string, code: string, message: string, data?: MachineEvent['data']): MachineEvent {
    return this.record({ timestamp, severity: 'ALARM', code, message, stage, data });
  }

  public snapshot(): MachineEvent[] { return this.events.map(event => ({ ...event, data: event.data ? { ...event.data } : undefined })); }
  public clear(): void { this.events = []; this.sequence = 0; }
}
