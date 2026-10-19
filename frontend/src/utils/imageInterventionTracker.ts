type Listener = () => void;

class ImageInterventionTracker {
  private interventionReported = false;
  private unloadedCount = 0;
  private listeners: Set<Listener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        if ('ReportingObserver' in window) {
          const observer = new (window as any).ReportingObserver(
            (reports: any[]) => {
              for (const r of reports) {
                if (
                  r.type === 'intervention' ||
                  String(r?.body?.id || '').includes('intervention') ||
                  String(r?.body?.message || '').toLowerCase().includes('intervention')
                ) {
                  this.interventionReported = true;
                  this.notify();
                }
              }
            },
            { types: ['intervention'], buffered: true }
          );
          observer.observe();
        }
      } catch {
        // ReportingObserver not supported or blocked
      }

      // Check Chrome Data Saver / Lite Mode hint
      if ((navigator as any).connection?.saveData) {
        this.interventionReported = true;
      }
    }
  }

  public reportIntervention(): void {
    if (!this.interventionReported) {
      this.interventionReported = true;
      this.notify();
    }
  }

  public registerUnloaded(): void {
    this.unloadedCount++;
    this.notify();
  }

  public resolveUnloaded(): void {
    if (this.unloadedCount > 0) {
      this.unloadedCount--;
      this.notify();
    }
  }

  public hasInterventionNotice(): boolean {
    return this.interventionReported || this.unloadedCount >= 3;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }
}

export const imageInterventionTracker = new ImageInterventionTracker();
