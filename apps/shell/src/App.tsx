import { on } from '@gamevault/shared';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router';
import { Icon, type IconName } from './components/Icon';
import { Preferences } from './components/Preferences';
import { RemoteMount } from './components/RemoteMount';
import { useT } from './i18n';
import { usePageMeta } from './seo';

const loadFree = () => import('deals/free');
const loadDealsFeed = () => import('deals/feed');
const loadCatalog = () => import('catalog/mount');
const loadDetails = () => import('details/mount');
const loadDeals = () => import('deals/mount');
const loadNews = () => import('news/mount');
const loadNewsArticle = () => import('news/article');

const NAV: { to: string; icon: IconName; label: 'navHome' | 'navFree' | 'navDeals' | 'navGames' | 'navNews' }[] = [
  { to: '/', icon: 'home', label: 'navHome' },
  { to: '/free', icon: 'gift', label: 'navFree' },
  { to: '/deals', icon: 'tag', label: 'navDeals' },
  { to: '/games', icon: 'grid', label: 'navGames' },
  { to: '/news', icon: 'news', label: 'navNews' },
];

export function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const t = useT();

  useEffect(() => on('game:selected', ({ slug }) => navigate(`/game/${encodeURIComponent(slug)}`)), [navigate]);
  useEffect(() => on('news:selected', ({ id }) => navigate(`/news/${encodeURIComponent(id)}`)), [navigate]);
  useEffect(() => on('navigate', ({ path }) => navigate(path)), [navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [collapsed, setCollapsed] = useCollapsedSidebar();

  const links = (className: string, withTooltip = false) => (
    <nav className={className} aria-label={t('navLabel')}>
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          data-tooltip={withTooltip && collapsed ? t(item.label) : undefined}
          aria-label={withTooltip && collapsed ? t(item.label) : undefined}
        >
          <Icon name={item.icon} />
          <span className="nav-label">{t(item.label)}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className={collapsed ? 'layout is-collapsed' : 'layout'}>
      <aside className="sidebar">
        <div className="sidebar-head">
          <Brand />
          <button
            type="button"
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? t('expandMenu') : t('collapseMenu')}
            data-tooltip={collapsed ? t('expandMenu') : undefined}
          >
            <Icon name="sidebar" />
          </button>
        </div>
        {links('side-nav', true)}
        <Preferences compact={collapsed} />
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-row">
            <Brand />
            <Preferences compact />
          </div>
          <SearchBox />
        </header>

        <main className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/free" element={<FreePage />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/games" element={<CatalogPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/:id" element={<NewsArticlePage />} />
            <Route path="/game/:slug" element={<GamePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>
            {t('footerData')} <a href="https://rawg.io" target="_blank" rel="noopener">RAWG</a>.{' '}
            {t('footerPrices')} <a href="https://www.cheapshark.com" target="_blank" rel="noopener">CheapShark</a>.
          </p>
        </footer>
      </div>

      {links('tab-bar')}
    </div>
  );
}

const SIDEBAR_KEY = 'gamevault:sidebar-collapsed';

function useCollapsedSidebar(): [boolean, (value: boolean) => void] {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1';
    } catch {
      return false;
    }
  });
  const update = (value: boolean) => {
    setCollapsed(value);
    try {
      localStorage.setItem(SIDEBAR_KEY, value ? '1' : '0');
    } catch {
    }
  };
  return [collapsed, update];
}

function Brand() {
  const t = useT();
  return (
    <Link to="/" className="brand" aria-label={t('home')}>
      <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" />
        <ellipse cx="16" cy="16" rx="6.5" ry="9" />
        <path d="M11 24.5 21 7.5" />
      </svg>
      <span className="brand-name">Zero800</span>
    </Link>
  );
}

function SearchBox() {
  const t = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const current = pathname === '/games' ? (params.get('q') ?? '') : '';
  const [value, setValue] = useState(current);

  useEffect(() => {
    setValue(current);
  }, [current]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const q = value.trim();
    navigate(q ? `/games?q=${encodeURIComponent(q)}` : '/games');
  };

  return (
    <form className="search" role="search" onSubmit={submit}>
      <Icon name="search" size={20} />
      <label className="sr-only" htmlFor="global-search">{t('searchLabel')}</label>
      <input
        id="global-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t('searchPlaceholder')}
        autoComplete="off"
      />
    </form>
  );
}

function Section({ title, link, children }: { title: string; link?: { to: string; label: string }; children: ReactNode }) {
  return (
    <section className="section">
      <header className="section-head">
        <h2>{title}</h2>
        {link && <Link to={link.to}>{link.label}</Link>}
      </header>
      {children}
    </section>
  );
}

function Home() {
  const t = useT();
  usePageMeta({ title: t('metaHomeTitle'), description: t('metaHomeDescription') });
  return (
    <div className="home">
      <h1 className="sr-only">{t('homeTitle')}</h1>
      <RemoteMount name="free-hero" load={loadFree} props={{ view: 'hero' as const }} />
      <Section title={t('alsoFree')} link={{ to: '/free', label: t('seeAllFree') }}>
        <RemoteMount name="free-others" load={loadFree} props={{ view: 'others' as const, limit: 4 }} />
      </Section>
      <Section title={t('upcomingEpic')}>
        <RemoteMount name="free-upcoming" load={loadFree} props={{ view: 'upcoming' as const }} />
      </Section>
      <Section title={t('topDeals')} link={{ to: '/deals', label: t('seeAllDeals') }}>
        <RemoteMount name="deals-top" load={loadDealsFeed} props={{ limit: 8 }} />
      </Section>
      <Section title={t('latestNews')} link={{ to: '/news', label: t('seeAllNews') }}>
        <RemoteMount name="news-latest" load={loadNews} props={{ limit: 4 }} />
      </Section>
    </div>
  );
}

function FreePage() {
  const t = useT();
  usePageMeta({ title: t('metaFreeTitle'), description: t('metaFreeDescription') });
  return <RemoteMount name="free" load={loadFree} props={{ view: 'all' as const }} />;
}

function DealsPage() {
  const t = useT();
  usePageMeta({ title: t('metaDealsTitle'), description: t('metaDealsDescription') });
  return <RemoteMount name="deals-feed" load={loadDealsFeed} props={{}} />;
}

function NewsPage() {
  const t = useT();
  usePageMeta({ title: t('metaNewsTitle'), description: t('metaNewsDescription') });
  return <RemoteMount name="news" load={loadNews} props={{}} />;
}

function CatalogPage() {
  const t = useT();
  const [params] = useSearchParams();
  const search = params.get('q') ?? '';
  usePageMeta({
    title: search ? t('metaSearchTitle', { query: search }) : t('metaGamesTitle'),
    description: t('metaGamesDescription'),
    noindex: !!search,
  });
  return <RemoteMount key={`catalog-${search}`} name="catalog" load={loadCatalog} props={{ search }} />;
}

function BackButton({ fallback }: { fallback: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const t = useT();
  return (
    <button
      type="button"
      className="back-link"
      onClick={() => (location.key === 'default' ? navigate(fallback) : navigate(-1))}
    >
      ← {t('back')}
    </button>
  );
}

function NewsArticlePage() {
  const { id = '' } = useParams();
  const t = useT();
  const [article, setArticle] = useState<{ title: string; source: string } | null>(null);

  useEffect(
    () =>
      on(
        'news:loaded',
        (loaded) => {
          if (loaded.id === id) setArticle({ title: loaded.title, source: loaded.source });
        },
        { replay: true },
      ),
    [id],
  );

  usePageMeta({
    title: article ? `${article.title} | Zero800` : t('metaArticleFallback'),
    description: article ? t('metaArticleDescription', { source: article.source }) : t('metaNewsDescription'),
  });

  return (
    <div>
      <BackButton fallback="/news" />
      <RemoteMount key={`news-${id}`} name="news-article" load={loadNewsArticle} props={{ id }} />
    </div>
  );
}

function GamePage() {
  const { slug = '' } = useParams();
  const t = useT();
  const [name, setName] = useState<string | null>(null);

  useEffect(
    () =>
      on(
        'game:loaded',
        (game) => {
          if (game.slug === slug) setName(game.name);
        },
        { replay: true },
      ),
    [slug],
  );

  usePageMeta({
    title: name ? t('metaGameTitle', { name }) : t('metaGameFallback'),
    description: name ? t('metaGameDescription', { name }) : t('metaHomeDescription'),
  });

  return (
    <div className="game-page">
      <BackButton fallback="/" />
      <div className="game-layout">
        <RemoteMount key={`details-${slug}`} name="details" load={loadDetails} props={{ slug }} />
        <aside>
          <RemoteMount key={`deals-${slug}`} name="deals" load={loadDeals} props={{ slug }} />
        </aside>
      </div>
    </div>
  );
}

function NotFound() {
  const t = useT();
  usePageMeta({ title: t('metaNotFoundTitle'), description: t('metaHomeDescription'), noindex: true });
  return (
    <div className="remote-fallback">
      <strong>{t('notFoundTitle')}</strong>
      <Link to="/">{t('notFoundLink')}</Link>
    </div>
  );
}
