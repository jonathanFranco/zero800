import type { DetailsProps, MountFn } from '@gamevault/shared';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Details } from './Details';
import './details.css';

export const mount: MountFn<DetailsProps> = (el, props) => {
  const root = createRoot(el);
  root.render(
    <StrictMode>
      <Details {...props} />
    </StrictMode>,
  );
  return () => queueMicrotask(() => root.unmount());
};
