import './styles/base.css';
import './styles/tutorial.css';
import './styles/pages.css';

type Cleanup = () => void;
type Page = (root: HTMLElement, arg: string, q: URLSearchParams) => Promise<Cleanup | void> | Cleanup | void;

const routes: [RegExp, () => Promise<Page>][] = [
  [/^\/?$/, () => import('./app/pages').then((m) => m.homePage)],
  [/^\/levels$/, () => import('./app/pages').then((m) => m.levelsPage)],
  [/^\/level\/(\d)$/, () => import('./app/pages').then((m) => m.levelPage)],
  [/^\/fold\/([\w-]+)$/, () => import('./app/tutorial').then((m) => m.tutorialPage)],
  [/^\/folds$/, () => import('./app/pages').then((m) => m.foldsPage)],
  [/^\/paper$/, () => import('./app/pages').then((m) => m.paperPage)],
  [/^\/plan$/, () => import('./app/pages').then((m) => m.planPage)],
  [/^\/appendix$/, () => import('./app/pages').then((m) => m.appendixPage)],
  [/^\/notes$/, () => import('./app/pages').then((m) => m.notesPage)],
];

const main = document.getElementById('main')!;
let cleanup: Cleanup | void;
let navId = 0;

async function route() {
  const id = ++navId;
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?');
  const query = new URLSearchParams(qs ?? '');
  const match = routes.find(([re]) => re.test(path));
  const prevPath = main.dataset.path;
  if (prevPath === path && path.startsWith('/fold/')) return; // step changes only update the query
  if (cleanup) {
    cleanup();
    cleanup = undefined;
  }
  main.dataset.path = path;
  document.querySelectorAll<HTMLAnchorElement>('[data-nav]').forEach((a) => {
    const n = a.dataset.nav!;
    a.toggleAttribute('aria-current', path === '/' + n || (n === 'levels' && /^\/(level|fold)\//.test(path)));
  });
  if (!match) {
    main.innerHTML = '<section class="wrap narrow"><h1>Page not found</h1><p><a href="#/">Back to the start</a></p></section>';
    return;
  }
  const page = await match[1]();
  if (id !== navId) return;
  const arg = path.match(match[0])?.[1] ?? '';
  main.classList.remove('is-entering');
  void main.offsetWidth;
  main.classList.add('is-entering');
  cleanup = await page(main, arg, query);
  if (id !== navId && cleanup) cleanup();
  if (!(path.startsWith('/fold/') && prevPath === path)) window.scrollTo(0, 0);
  if (prevPath !== undefined) main.focus({ preventScroll: true });
}

window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
