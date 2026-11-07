import { GameState, createInitialState, reduce, Command, GameEvent } from '../engine';

let currentState: GameState = createInitialState();

self.onmessage = (e: MessageEvent) => {
  const { type, payload, id } = e.data;

  switch (type) {
    case 'INIT': {
      currentState = payload ? payload : createInitialState();
      self.postMessage({ id, type: 'INIT_OK', state: currentState });
      break;
    }

    case 'DISPATCH': {
      const command = payload as Command;
      const { state, events } = reduce(currentState, command);
      currentState = state;
      self.postMessage({ id, type: 'DISPATCH_OK', state: currentState, events });
      break;
    }

    case 'GET_STATE': {
      self.postMessage({ id, type: 'GET_STATE_OK', state: currentState });
      break;
    }

    case 'SET_STATE': {
      currentState = payload as GameState;
      self.postMessage({ id, type: 'SET_STATE_OK', state: currentState });
      break;
    }

    case 'FAST_FORWARD': {
      const days = payload?.days ?? 1;
      const allEvents: GameEvent[] = [];
      for (let i = 0; i < days; i++) {
        const { state, events } = reduce(currentState, { type: 'ADVANCE_DAY', count: 1 });
        currentState = state;
        allEvents.push(...events);
      }
      self.postMessage({ id, type: 'FAST_FORWARD_OK', state: currentState, events: allEvents });
      break;
    }

    default:
      self.postMessage({ id, type: 'ERROR', error: `Unknown worker message type: ${type}` });
  }
};
