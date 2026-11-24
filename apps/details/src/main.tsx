import '@gamevault/shared/tokens.css';
import { on } from '@gamevault/shared';
import { mount } from './mount';

const slug = new URLSearchParams(location.search).get('slug') ?? 'hades';
mount(document.getElementById('app')!, { slug });
on('game:loaded', (game) => console.info('[details standalone] game:loaded', game));
