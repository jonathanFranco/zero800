export type Unmount = () => void;
export type MountFn<P = Record<string, never>> = (el: HTMLElement, props: P) => Unmount;

export interface CatalogProps {
  search?: string;
}
export interface DetailsProps {
  slug: string;
}
export interface DealsProps {
  slug: string;
}
export interface DealsFeedProps {
  limit?: number;
}
export interface FreeGamesProps {
  view: 'hero' | 'others' | 'upcoming' | 'all';
  limit?: number;
}
export interface NewsProps {
  limit?: number;
}
export interface NewsArticleProps {
  id: string;
}
