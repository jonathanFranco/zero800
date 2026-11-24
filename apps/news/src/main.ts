import '@gamevault/shared/tokens.css';
import { on } from '@gamevault/shared';
import { mount as mountArticle } from './article';
import { mount } from './mount';

const params = new URLSearchParams(location.search);
const el = document.getElementById('app')!;
const id = params.get('id');

if (id) mountArticle(el, { id });
else mount(el, { limit: Number(params.get('limit')) || undefined });

on('news:selected', ({ id }) => (location.search = `?id=${encodeURIComponent(id)}`));
on('game:selected', (game) => console.info('[news standalone] game:selected', game));
