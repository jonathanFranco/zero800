import type { MountFn, Unmount } from '@gamevault/shared';
import { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n';

interface Props<P> {
  name: string;
  load: () => Promise<{ mount: MountFn<P> }>;
  props: P;
}

type Status = 'loading' | 'ready' | 'error';

export function RemoteMount<P>({ name, load, props }: Props<P>) {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [attempt, setAttempt] = useState(0);
  const propsRef = useRef(props);
  const t = useT();

  useEffect(() => {
    let cancelled = false;
    let unmount: Unmount | undefined;
    setStatus('loading');

    load()
      .then(({ mount }) => {
        if (cancelled || !ref.current) return;
        unmount = mount(ref.current, propsRef.current);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        console.error(`[shell] remote "${name}" failed:`, error);
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      unmount?.();
    };
  }, [name, load, attempt]);

  return (
    <section className="remote" data-remote={name} aria-busy={status === 'loading'}>
      {status === 'loading' && <div className="remote-loading" role="status" aria-label={t('loading')} />}
      {status === 'error' && (
        <div className="remote-fallback" role="alert">
          <strong>{t('remoteDown')}</strong>
          <span>{t('remoteDownBody')}</span>
          <button type="button" onClick={() => setAttempt((n) => n + 1)}>
            {t('retry')}
          </button>
        </div>
      )}
      <div ref={ref} hidden={status === 'error'} />
    </section>
  );
}
