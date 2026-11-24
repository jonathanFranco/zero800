import type { DealsFeedProps, MountFn } from '@gamevault/shared';
import { mount as mountSvelte, unmount } from 'svelte';
import Feed from './Feed.svelte';

export const mount: MountFn<DealsFeedProps> = (el, props) => {
  const app = mountSvelte(Feed, { target: el, props });
  return () => void unmount(app);
};
