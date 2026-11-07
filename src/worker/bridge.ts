import { GameState, Command, GameEvent, createInitialState, reduce } from '../engine';

export type WorkerEventListener = (events: GameEvent[]) => void;
export type WorkerStateListener = (state: GameState) => void;

export class SimBridge {
  private worker: Worker | null = null;
  private isFallback = false;
  private fallbackState: GameState = createInitialState();
  private eventListeners: WorkerEventListener[] = [];
  private stateListeners: WorkerStateListener[] = [];
  private messageCounter = 0;
  private pendingCallbacks: Map<number, (res: unknown) => void> = new Map();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker(new URL('./sim.worker.ts', import.meta.url), { type: 'module' });
        this.worker.onmessage = (e: MessageEvent) => {
          const { id, state, events } = e.data;

          if (events && events.length > 0) {
            this.notifyEvents(events);
          }

          if (state) {
            this.notifyState(state);
          }

          if (id && this.pendingCallbacks.has(id)) {
            const cb = this.pendingCallbacks.get(id);
            this.pendingCallbacks.delete(id);
            cb?.(e.data);
          }
        };

        this.worker.onerror = (err) => {
          console.error('Worker error, switching to synchronous fallback:', err);
          this.isFallback = true;
        };
      } catch (err) {
        console.warn('Worker creation failed, using fallback synchronous engine:', err);
        this.isFallback = true;
      }
    } else {
      this.isFallback = true;
    }
  }

  public onEvents(listener: WorkerEventListener): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== listener);
    };
  }

  public onState(listener: WorkerStateListener): () => void {
    this.stateListeners.push(listener);
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== listener);
    };
  }

  private notifyEvents(events: GameEvent[]) {
    for (const l of this.eventListeners) {
      l(events);
    }
  }

  private notifyState(state: GameState) {
    for (const l of this.stateListeners) {
      l(state);
    }
  }

  public async init(state?: GameState): Promise<GameState> {
    if (this.isFallback || !this.worker) {
      this.fallbackState = state ? state : createInitialState();
      this.notifyState(this.fallbackState);
      return this.fallbackState;
    }

    return new Promise((resolve) => {
      const id = ++this.messageCounter;
      this.pendingCallbacks.set(id, (res: unknown) => {
        const data = res as { state: GameState };
        resolve(data.state);
      });
      this.worker?.postMessage({ id, type: 'INIT', payload: state });
    });
  }

  public async dispatch(command: Command): Promise<{ state: GameState; events: GameEvent[] }> {
    if (this.isFallback || !this.worker) {
      const res = reduce(this.fallbackState, command);
      this.fallbackState = res.state;
      this.notifyEvents(res.events);
      this.notifyState(res.state);
      return res;
    }

    return new Promise((resolve) => {
      const id = ++this.messageCounter;
      this.pendingCallbacks.set(id, (res: unknown) => {
        const data = res as { state: GameState; events: GameEvent[] };
        resolve({ state: data.state, events: data.events });
      });
      this.worker?.postMessage({ id, type: 'DISPATCH', payload: command });
    });
  }

  public async setState(state: GameState): Promise<GameState> {
    if (this.isFallback || !this.worker) {
      this.fallbackState = state;
      this.notifyState(state);
      return state;
    }

    return new Promise((resolve) => {
      const id = ++this.messageCounter;
      this.pendingCallbacks.set(id, (res: unknown) => {
        const data = res as { state: GameState };
        resolve(data.state);
      });
      this.worker?.postMessage({ id, type: 'SET_STATE', payload: state });
    });
  }
}

export const simBridge = new SimBridge();
