/** Hero carousel: progressive enhancement. Without JS the first slide shows. */
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

for (const root of document.querySelectorAll<HTMLElement>('[data-carousel]')) {
  const slides = [...root.querySelectorAll<HTMLElement>('[data-slide]')];
  const dots = [...root.querySelectorAll<HTMLButtonElement>('[data-dot]')];
  const counter = root.querySelector<HTMLElement>('[data-current]');
  const status = root.querySelector<HTMLElement>('[data-status]');
  const labels = dots.map((d) => d.dataset.label ?? '');
  let index = 0;
  let timer: number | undefined;

  const show = (i: number) => {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, n) => s.classList.toggle('is-active', n === index));
    dots.forEach((d, n) => d.setAttribute('aria-current', String(n === index)));
    if (counter) counter.textContent = String(index + 1).padStart(2, '0');
    if (status) status.textContent = labels[index];
  };
  const stop = () => window.clearInterval(timer);
  const start = () => {
    stop();
    if (!reduced.matches) timer = window.setInterval(() => show(index + 1), 7000);
  };

  dots.forEach((d, n) =>
    d.addEventListener('click', () => {
      show(n);
      start();
    }),
  );
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', start);
  reduced.addEventListener('change', start);
  start();
}
