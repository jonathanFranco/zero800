import type { CatalogProps, MountFn } from '@gamevault/shared';
import { createApp } from 'vue';
import Catalog from './Catalog.vue';

export const mount: MountFn<CatalogProps> = (el, props) => {
  const app = createApp(Catalog, { ...props });
  app.mount(el);
  return () => app.unmount();
};
