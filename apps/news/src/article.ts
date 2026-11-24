import type { MountFn, NewsArticleProps } from '@gamevault/shared';
import { createApp } from 'vue';
import Article from './Article.vue';

export const mount: MountFn<NewsArticleProps> = (el, props) => {
  const app = createApp(Article, { ...props });
  app.mount(el);
  return () => app.unmount();
};
