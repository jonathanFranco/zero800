import type { GameVaultEvent, GameVaultEvents } from './events';

const PREFIX = 'gamevault:';

type LastPayloads = Partial<{ [E in GameVaultEvent]: GameVaultEvents[E] }>;

declare global {
  interface Window {
    __GAMEVAULT_LAST__?: LastPayloads;
  }
}

function lastPayloads(): LastPayloads {
  return (window.__GAMEVAULT_LAST__ ??= {});
}

export function emit<E extends GameVaultEvent>(event: E, payload: GameVaultEvents[E]): void {
  lastPayloads()[event] = payload;
  window.dispatchEvent(new CustomEvent(PREFIX + event, { detail: payload }));
}

export function on<E extends GameVaultEvent>(
  event: E,
  handler: (payload: GameVaultEvents[E]) => void,
  options: { replay?: boolean } = {},
): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<GameVaultEvents[E]>).detail);
  window.addEventListener(PREFIX + event, listener);

  const last = lastPayloads()[event];
  if (options.replay && last !== undefined) handler(last);

  return () => window.removeEventListener(PREFIX + event, listener);
}
