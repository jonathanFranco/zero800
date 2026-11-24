import { emit, genreName, type DetailsProps, type Locale } from '@gamevault/shared';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useI18n } from './i18n';
import { googleTranslateUrl, translateText, translationSupport, type TranslationSupport } from './translate';
import { getGame, getScreenshots, MissingKeyError, NotFoundError, type GameDetails, type Screenshot } from './rawg';

type State =
  | { status: 'loading' }
  | { status: 'ready'; game: GameDetails; screenshots: Screenshot[] }
  | { status: 'missing-key' | 'not-found' | 'error' };

const DESCRIPTION_PREVIEW = 600;

export function Details({ slug }: DetailsProps) {
  const { t } = useI18n();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });

    getGame(slug, controller.signal)
      .then(async (game) => {
        const screenshots = await getScreenshots(game.slug, controller.signal).catch(() => []);
        setState({ status: 'ready', game, screenshots });
        emit('game:loaded', { slug, name: game.name });
      })
      .catch((error: Error) => {
        if (error.name === 'AbortError') return;
        if (error instanceof MissingKeyError) setState({ status: 'missing-key' });
        else if (error instanceof NotFoundError) setState({ status: 'not-found' });
        else setState({ status: 'error' });
      });

    return () => controller.abort();
  }, [slug, attempt]);

  switch (state.status) {
    case 'loading':
      return <div className="gv-details-skeleton" role="status" aria-label={t('loading')} />;
    case 'missing-key':
      return (
        <Notice title={t('missingKeyTitle')}>
          {t('missingKeyBody')}{' '}
          <a href="https://rawg.io/apidocs" target="_blank" rel="noopener">rawg.io/apidocs</a>.
        </Notice>
      );
    case 'not-found':
      return <Notice title={t('notFoundTitle')}>{t('notFoundBody')}</Notice>;
    case 'error':
      return (
        <Notice title={t('errorTitle')}>
          <button type="button" onClick={() => setAttempt((n) => n + 1)}>{t('retry')}</button>
        </Notice>
      );
    case 'ready':
      return <GameView game={state.game} screenshots={state.screenshots} />;
  }
}

function GameView({ game, screenshots }: { game: GameDetails; screenshots: Screenshot[] }) {
  const { locale, t } = useI18n();
  const [activeShot, setActiveShot] = useState<Screenshot | null>(null);

  const description = game.description_raw.replace(/^#{1,6}\s*/gm, '').trim();
  const esrbKey = game.esrb_rating?.slug ? ESRB_KEYS[game.esrb_rating.slug] : undefined;
  const list = new Intl.ListFormat(locale, { type: 'conjunction' });

  const facts: [string, string | undefined][] = [
    [t('released'), game.released ? new Date(`${game.released}T00:00:00`).toLocaleDateString(locale, { dateStyle: 'long' }) : t('tba')],
    [t('developer'), list.format(game.developers.map((d) => d.name))],
    [t('publisher'), list.format(game.publishers.map((p) => p.name))],
    [t('platforms'), game.platforms ? list.format(game.platforms.map((p) => p.platform.name)) : undefined],
    [t('playtime'), game.playtime ? t('hours', { hours: game.playtime }) : undefined],
    [t('ageRating'), esrbKey ? t(esrbKey) : game.esrb_rating?.name],
  ];

  return (
    <article className="gv-details">
      <header
        className="gv-details-hero"
        style={game.background_image ? { backgroundImage: `url(${game.background_image})` } : undefined}
      >
        <div className="gv-details-hero-content">
          {game.genres.length > 0 && <p className="gv-details-genres">{list.format(game.genres.map((g) => genreName(g, locale)))}</p>}
          <h1>{game.name}</h1>
          <div className="gv-details-scores">
            {game.metacritic !== null && (
              <p className="gv-details-score">
                <strong>{game.metacritic}</strong>
                <span>{t('metacritic')}</span>
              </p>
            )}
            {game.rating > 0 && (
              <p className="gv-details-score" title={t('ratingsCount', { count: game.ratings_count.toLocaleString(locale) })}>
                <strong>{game.rating.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</strong>
                <span>{t('players')}</span>
              </p>
            )}
          </div>
        </div>
      </header>

      <dl className="gv-details-facts">
        {facts
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>

      {description && <Description text={description} />}

      {screenshots.length > 0 && (
        <section>
          <h2>{t('screenshots')}</h2>
          <ul className="gv-details-shots">
            {screenshots.slice(0, 6).map((shot, i) => (
              <li key={shot.id}>
                <button type="button" onClick={() => setActiveShot(shot)} aria-label={t('enlarge', { n: i + 1 })}>
                  <img src={shot.image.replace('/media/screenshots/', '/media/crop/600/400/screenshots/')} alt="" loading="lazy" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {game.website && (
        <a className="gv-details-site" href={game.website} target="_blank" rel="noopener">
          {t('website')}
        </a>
      )}

      {activeShot && <Lightbox shot={activeShot} onClose={() => setActiveShot(null)} />}
    </article>
  );
}

const ESRB_KEYS: Record<string, 'esrbEveryone' | 'esrbEveryone10' | 'esrbTeen' | 'esrbMature' | 'esrbAdults' | 'esrbPending'> = {
  everyone: 'esrbEveryone',
  'everyone-10-plus': 'esrbEveryone10',
  teen: 'esrbTeen',
  mature: 'esrbMature',
  'adults-only': 'esrbAdults',
  'rating-pending': 'esrbPending',
};

function Description({ text }: { text: string }) {
  const { locale, t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [support, setSupport] = useState<TranslationSupport>('unsupported');
  const [translation, setTranslation] = useState<{ locale: Locale; text: string } | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle');
  const wantsTranslation = locale !== 'en';

  const translate = useCallback(async () => {
    setStatus('working');
    try {
      setTranslation({ locale, text: await translateText(text, locale) });
      setShowOriginal(false);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }, [text, locale]);

  useEffect(() => {
    if (!wantsTranslation) return;
    let active = true;
    translationSupport(locale).then((result) => {
      if (!active) return;
      setSupport(result);
      if (result === 'ready') void translate();
    });
    return () => {
      active = false;
    };
  }, [locale, wantsTranslation, translate]);

  const hasTranslation = wantsTranslation && translation?.locale === locale;
  const showingTranslation = hasTranslation && !showOriginal;
  const current = showingTranslation ? translation.text : text;
  const isLong = current.length > DESCRIPTION_PREVIEW;
  const shown = expanded || !isLong ? current : `${current.slice(0, DESCRIPTION_PREVIEW).trimEnd()}…`;

  return (
    <section>
      <h2>{t('about')}</h2>
      {wantsTranslation && (
        <div className="gv-details-translate">
          <p className="gv-details-note">{showingTranslation ? t('translatedNote') : t('descriptionNote')}</p>
          {hasTranslation ? (
            <button type="button" className="gv-details-chip" onClick={() => setShowOriginal((v) => !v)}>
              {showOriginal ? t('showTranslation') : t('showOriginal')}
            </button>
          ) : status === 'working' ? (
            <span className="gv-details-chip" role="status">{t('translating')}</span>
          ) : support === 'unsupported' ? (
            <a className="gv-details-chip" href={googleTranslateUrl(text, locale)} target="_blank" rel="noopener">
              {t('translateGoogle')}
            </a>
          ) : (
            <button type="button" className="gv-details-chip" onClick={() => void translate()}>
              {t('translate')}
            </button>
          )}
          {status === 'error' && <p className="gv-details-note" role="alert">{t('translateError')}</p>}
        </div>
      )}
      <p className="gv-details-description" lang={showingTranslation ? locale : 'en'}>{shown}</p>
      {isLong && (
        <button type="button" className="gv-details-link-button" onClick={() => setExpanded((v) => !v)}>
          {expanded ? t('readLess') : t('readMore')}
        </button>
      )}
    </section>
  );
}

function Lightbox({ shot, onClose }: { shot: Screenshot; onClose: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="gv-details-lightbox" role="dialog" aria-modal="true" aria-label={t('enlarged')} onClick={onClose}>
      <img src={shot.image} alt="" />
      <button type="button" autoFocus onClick={onClose} aria-label={t('close')}>✕</button>
    </div>
  );
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="gv-details-notice" role="status">
      <strong>{title}</strong>
      <span>{children}</span>
    </div>
  );
}
