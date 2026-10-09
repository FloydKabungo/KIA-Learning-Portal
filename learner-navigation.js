/* Shared, keyboard-accessible notifications for all learner pages. */
(() => {
  'use strict';
  const bell = document.querySelector('#notification-button');
  const panel = document.querySelector('#notifications');
  if (!bell || !panel) return;
  const close = () => { panel.hidden = true; bell.setAttribute('aria-expanded', 'false'); };
  bell.addEventListener('click', () => {
    const open = panel.hidden;
    panel.hidden = !open;
    bell.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.notification-wrap') || e.target.closest('#notifications a')) close();
  });
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape' && !panel.hidden) { close(); bell.focus(); }
  });
})();
