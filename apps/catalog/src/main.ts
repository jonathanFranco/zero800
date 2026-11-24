import '@gamevault/shared/tokens.css';
import { on } from '@gamevault/shared';
import { mount } from './mount';

mount(document.getElementById('app')!, { search: new URLSearchParams(location.search).get('q') ?? undefined });
on('game:selected', (game) => console.info('[catalog standalone] game:selected', game));
