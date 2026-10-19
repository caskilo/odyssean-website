/** Signal selector: progressive enhancement. Without JS every signal's card is listed and the selector stays hidden. */
for (const root of document.querySelectorAll<HTMLElement>('[data-signals]')) {
  const picker = root.querySelector<HTMLElement>('[data-picker]');
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-pick]')];
  const panels = [...root.querySelectorAll<HTMLElement>('[data-panel]')];
  const marks = [...root.querySelectorAll<SVGElement>('[data-track]')];

  const show = (i: number) => {
    buttons.forEach((b, n) => b.setAttribute('aria-pressed', String(n === i)));
    panels.forEach((p, n) => (p.hidden = n !== i));
    marks.forEach((m) => m.classList.toggle('is-active', Number(m.dataset.track) === i));
  };
  buttons.forEach((b, n) => b.addEventListener('click', () => show(n)));
  if (picker) picker.hidden = false;
  show(0);
}
