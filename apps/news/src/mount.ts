import type { MountFn, NewsProps } from '@gamevault/shared';
import { createApp } from 'vue';
import News from './News.vue';

export const mount: MountFn<NewsProps> = (el, props) => {
  const app = createApp(News, { ...props });
  app.mount(el);
  return () => app.unmount();
};
