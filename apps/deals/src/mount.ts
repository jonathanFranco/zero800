import type { DealsProps, MountFn } from '@gamevault/shared';
import { mount as mountSvelte, unmount } from 'svelte';
import Deals from './Deals.svelte';

export const mount: MountFn<DealsProps> = (el, props) => {
  const app = mountSvelte(Deals, { target: el, props });
  return () => void unmount(app);
};
