/** Monthly rotation: the page is built showing this month's pick; this keeps it right if the site is not rebuilt. */
import { rotationIndex } from '../lib/rotation';

for (const group of document.querySelectorAll<HTMLElement>('[data-rotate]')) {
  const items = [...group.querySelectorAll<HTMLElement>('[data-rotate-item]')];
  const pick = rotationIndex(group.dataset.rotate ?? '', items.length);
  items.forEach((item, i) => (item.hidden = i !== pick));
}
