/** Header menus open on hover and focus without JavaScript; this adds Escape to dismiss them (WCAG 1.4.13). */
const drops = [...document.querySelectorAll<HTMLElement>('[data-drop]')];

for (const drop of drops) {
  const reset = () => drop.removeAttribute('data-dismissed');
  drop.addEventListener('mouseleave', reset);
  drop.addEventListener('focusout', (e) => {
    if (!drop.contains(e.relatedTarget as Node | null)) reset();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const open = drops.find(
    (d) => d.matches(':hover, :focus-within') && !d.hasAttribute('data-dismissed'),
  );
  if (!open) return;
  open.setAttribute('data-dismissed', '');
  open.querySelector<HTMLElement>('.drop__trigger')?.focus();
});
