/** Publications filter: progressive enhancement. Without JS every row shows. */
for (const root of document.querySelectorAll<HTMLElement>('[data-filter]')) {
  const links = [...root.querySelectorAll<HTMLAnchorElement>('[data-filter-link]')];
  const items = [...root.querySelectorAll<HTMLElement>('[data-type]')];

  const apply = () => {
    const type = decodeURIComponent(location.hash.slice(1)) || 'all';
    const valid = links.some((l) => l.dataset.filterLink === type) ? type : 'all';
    items.forEach((i) => (i.hidden = valid !== 'all' && i.dataset.type !== valid));
    links.forEach((l) => {
      const on = l.dataset.filterLink === valid;
      if (on) l.setAttribute('aria-current', 'true');
      else l.removeAttribute('aria-current');
    });
  };
  window.addEventListener('hashchange', apply);
  apply();
}
