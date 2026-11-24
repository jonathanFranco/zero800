import type { FreeGamesProps, MountFn } from '@gamevault/shared';
import { mount as mountSvelte, unmount } from 'svelte';
import FreeGames from './FreeGames.svelte';

export const mount: MountFn<FreeGamesProps> = (el, props) => {
  const app = mountSvelte(FreeGames, { target: el, props });
  return () => void unmount(app);
};
