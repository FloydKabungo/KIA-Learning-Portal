(() => {
  'use strict';
  const profile = window.KIAAccounts.current();
  if (!profile || profile.role !== 'learner') return;
  const esc = window.KIASecurity.escapeHTML;
  const LMS = window.KIALMS,
    Data = window.KIAAdminData,
    main = document.querySelector('main');
  const board = document.createElement('section');
  board.className = 'kia-notice-board';
  board.id = 'kia-notice-board';
  board.setAttribute('aria-label', 'KIA announcements');
  const heading = main.querySelector('.page-heading');
  if (heading) heading.after(board);
  else main.prepend(board);
  function render() {
    const state = Data.read(),
      list = LMS.visibleAnnouncements(state, profile),
      unread = list.filter((a) => !LMS.isRead(state, profile, a));
    board.hidden = !list.length;
    board.innerHTML = `<div class="kia-notice-board-header"><div><h2>Your club notice board</h2><p>Updates from KIA and your Mompreneur</p></div><span class="notice-count">${unread.length ? unread.length + ' unread' : 'All caught up'}</span></div>${list
      .map((a, index) => {
        const read = LMS.isRead(state, profile, a);
        return `<details class="kia-notice" ${index === 0 && !read ? 'open' : ''}><summary>${esc(a.title)}${read ? '' : '<span class="notice-unread">NEW</span>'}<small>${a.branchId === 'all' ? 'KIA community' : esc(state.branches.find((b) => b.id === a.branchId)?.name || 'Your club')} · ${esc(new Date(a.updatedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Johannesburg' }))}</small></summary><p>${esc(a.body)}</p>${read ? '<span class="notice-read">✓ Read</span>' : `<button type="button" data-read-announcement="${esc(a.id)}">Mark as read</button>`}</details>`;
      })
      .join('')}`;
    let link = document.querySelector('.notification-notice-link');
    const popover = document.querySelector('#notifications');
    if (popover && list.length) {
      if (!link) {
        link = document.createElement('a');
        link.className = 'notification-notice-link';
        link.href = '#kia-notice-board';
        popover.append(link);
      }
      link.textContent = `${unread.length ? unread.length + ' unread' : 'View'} club announcement${unread.length === 1 ? '' : 's'}`;
    }
    const dot = document.querySelector('.notification-dot');
    if (dot && unread.length) dot.hidden = false;
  }
  board.addEventListener('click', (event) => {
    const button = event.target.closest('[data-read-announcement]');
    if (!button) return;
    LMS.markRead(button.dataset.readAnnouncement);
    render();
    board.tabIndex = -1;
    board.focus({ preventScroll: true });
  });
  render();
})();
