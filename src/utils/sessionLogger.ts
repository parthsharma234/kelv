export type LogType = 'question' | 'answer' | 'refusal';
export interface LogEntry {
  timestamp: number;
  type: LogType;
  text: string;
}

export class SessionLogger {
  private entries: LogEntry[] = [];
  log(entry: LogEntry) {
    this.entries.push(entry);
  }
  getEntries() {
    return this.entries;
  }
}
