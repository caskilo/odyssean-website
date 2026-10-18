import { fan } from '../lib/fan';

/** Time-horizon slider: progressive enhancement. Without JS the server-rendered default state shows. */
for (const root of document.querySelectorAll<HTMLElement>('[data-fan]')) {
  const input = root.querySelector<HTMLInputElement>('[data-fan-input]')!;
  const lines = [...root.querySelectorAll<SVGPathElement>('[data-fan-line]')];
  const band = root.querySelector<SVGPathElement>('[data-fan-band]')!;
  const year = root.querySelector<SVGTextElement>('[data-fan-year]')!;
  const value = root.querySelector<HTMLElement>('[data-fan-value]')!;
  const readings = [...root.querySelectorAll<HTMLElement>('[data-below]')];
  const { min, max, base } = input.dataset;

  const update = () => {
    const h = Number(input.value);
    const g = fan(h, Number(min), Number(max));
    lines.forEach((l, i) => l.setAttribute('d', g.lines[i]));
    band.setAttribute('d', g.band);
    year.textContent = String(Number(base) + h);
    value.textContent = String(h);
    const active = readings.find((r) => h < Number(r.dataset.below)) ?? readings.at(-1);
    readings.forEach((r) => (r.hidden = r !== active));
  };
  input.addEventListener('input', update);
  update();
}
