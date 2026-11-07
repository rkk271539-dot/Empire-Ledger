export interface GameEvent {
  id: string;
  day: number;
  type: string;
  title: string;
  message: string;
  importance?: 1 | 2 | 3;
  data?: Record<string, unknown>;
}

export type EventListener = (event: GameEvent) => void;

export class EventBus {
  private listeners: EventListener[] = [];

  subscribe(listener: EventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit(event: GameEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('EventBus listener error:', err);
      }
    }
  }

  clear(): void {
    this.listeners = [];
  }
}

export const globalEventBus = new EventBus();
