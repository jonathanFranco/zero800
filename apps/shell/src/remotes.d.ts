declare module 'catalog/mount' {
  import type { CatalogProps, MountFn } from '@gamevault/shared';
  export const mount: MountFn<CatalogProps>;
}
declare module 'details/mount' {
  import type { DetailsProps, MountFn } from '@gamevault/shared';
  export const mount: MountFn<DetailsProps>;
}
declare module 'deals/mount' {
  import type { DealsProps, MountFn } from '@gamevault/shared';
  export const mount: MountFn<DealsProps>;
}
declare module 'deals/free' {
  import type { FreeGamesProps, MountFn } from '@gamevault/shared';
  export const mount: MountFn<FreeGamesProps>;
}
declare module 'news/article' {
  import type { MountFn, NewsArticleProps } from '@gamevault/shared';
  export const mount: MountFn<NewsArticleProps>;
}
declare module 'news/mount' {
  import type { MountFn, NewsProps } from '@gamevault/shared';
  export const mount: MountFn<NewsProps>;
}
declare module 'deals/feed' {
  import type { DealsFeedProps, MountFn } from '@gamevault/shared';
  export const mount: MountFn<DealsFeedProps>;
}
