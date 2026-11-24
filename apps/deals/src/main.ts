import '@gamevault/shared/tokens.css';
import { emit, on } from '@gamevault/shared';
import { mount as mountFeed } from './feed';
import { mount as mountFree } from './free';
import { mount as mountGameDeals } from './mount';

const el = document.getElementById('app')!;
const name = new URLSearchParams(location.search).get('name');

if (name) {
  const slug = 'standalone';
  mountGameDeals(el, { slug });
  emit('game:loaded', { slug, name });
} else {
  document.body.style.maxWidth = '1280px';
  const free = el.appendChild(document.createElement('div'));
  const feed = el.appendChild(document.createElement('div'));
  mountFree(free, { view: 'all' });
  mountFeed(feed, {});
  on('game:selected', (game) => console.info('[deals standalone] game:selected', game));
}
