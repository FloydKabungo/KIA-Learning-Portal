/* Read-only learner calendar using the club's shared sample sessions. */
(() => {
  'use strict';
  if (!window.KIALearner) return;
  const esc = window.KIASecurity.escapeHTML;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const { club, sessions, dateFromISO, formatDate, timeRange } = window.KIAClubSchedule;
  const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const nextSession = sessions.find((s) => s.date >= window.KIASecurity.currentDay());
  const changedSession = sessions.find((session) => session.previousStart);
  const requestedSession = sessions.find(
    (session) => session.id === new URLSearchParams(location.search).get('session')
  );
  let selectedDate = (requestedSession || nextSession)?.date || window.KIASecurity.currentDay();
  let displayedYear = dateFromISO(selectedDate).getUTCFullYear();
  let displayedMonth = dateFromISO(selectedDate).getUTCMonth();
  let calendarView = 'month';
  let dialogTrigger = null;
  const isoDate = (date) =>
    `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  const monthName = () =>
    new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(Date.UTC(displayedYear, displayedMonth, 1))
    );
  const sessionOn = (iso) => sessions.find((session) => session.date === iso);
  const dateTile = (iso, full = false) =>
    `<span class="${full ? 'date-block' : 'agenda-date'}"><span>${formatDate(iso, { month: 'short' }).toUpperCase()}</span><strong>${iso.slice(-2)}</strong>${full ? `<small>${formatDate(iso, { weekday: 'long' }).toUpperCase()}</small>` : ''}</span>`;
  function agendaRow(session) {
    return `<button type="button" class="agenda-row" data-session="${esc(session.id)}" aria-label="${esc(session.title)}, ${formatDate(session.date)}, ${timeRange(session)} SAST, ${esc(club.name)}${session.previousStart ? ', time updated' : ''}">${dateTile(session.date)}<span class="agenda-title">${esc(session.title)}</span><span class="agenda-meta agenda-time">${icon('clock')}${timeRange(session)}<small>SAST</small></span><span class="agenda-meta agenda-location">${icon('pin')}${esc(session.location)}</span>${session.previousStart ? `<span class="changed-badge">${icon('clock')}Time updated</span>` : '<span class="badge-spacer"></span>'}${icon('chevron')}</button>`;
  }
  function renderCalendar() {
    const firstDay = new Date(Date.UTC(displayedYear, displayedMonth, 1));
    const offset = (firstDay.getUTCDay() + 6) % 7;
    const daysInMonth = new Date(Date.UTC(displayedYear, displayedMonth + 1, 0)).getUTCDate();
    const cellCount = Math.ceil((offset + daysInMonth) / 7) * 7;
    const firstVisible = new Date(Date.UTC(displayedYear, displayedMonth, 1 - offset));
    const selectedInMonth =
      dateFromISO(selectedDate).getUTCFullYear() === displayedYear &&
      dateFromISO(selectedDate).getUTCMonth() === displayedMonth;
    const focusDate = selectedInMonth ? selectedDate : isoDate(firstDay);
    const rows = [];
    for (let row = 0; row < cellCount / 7; row++) {
      let cells = '';
      for (let col = 0; col < 7; col++) {
        const date = new Date(firstVisible.getTime());
        date.setUTCDate(firstVisible.getUTCDate() + row * 7 + col);
        const iso = isoDate(date);
        const event = sessionOn(iso);
        const isSelected = iso === selectedDate;
        const isCurrentMonth = date.getUTCMonth() === displayedMonth;
        const label = `${formatDate(iso)}: ${event ? `${esc(event.title)}, ${timeRange(event)} SAST${event.previousStart ? ', time updated' : ''}` : 'No club session scheduled'}`;
        cells += `<td><button type="button" class="calendar-day ${isCurrentMonth ? '' : 'other-month'}" data-date="${iso}" aria-label="${esc(label)}" aria-pressed="${isSelected}" tabindex="${iso === focusDate ? '0' : '-1'}"><span class="day-number" aria-hidden="true">${date.getUTCDate()}</span>${event ? `<span class="day-event ${event.previousStart ? 'changed' : ''}" aria-hidden="true"><strong>${event.previousStart ? 'Time updated' : esc(event.title)}</strong><small>${esc(event.start)}–${esc(event.end)}</small></span><span class="event-dot ${event.previousStart ? 'changed' : ''}" aria-hidden="true"></span>` : ''}</button></td>`;
      }
      rows.push(`<tr>${cells}</tr>`);
    }
    $('#calendar-days').innerHTML = rows.join('');
    $('#month-heading').textContent = monthName();
    $('#calendar-caption').textContent = `${monthName()} club sessions, Monday to Sunday`;
    const visibleSessions = sessions.filter((event) => {
      const date = dateFromISO(event.date);
      return date.getUTCFullYear() === displayedYear && date.getUTCMonth() === displayedMonth;
    });
    $('#month-session-list').innerHTML = visibleSessions.length
      ? `<div class="calendar-list"><div class="agenda-list">${visibleSessions.map(agendaRow).join('')}</div></div>`
      : `<div class="calendar-empty">${icon('calendar')}<h3>No sessions in ${monthName()}</h3><p>Class times will appear here when your Mompreneur adds them to your club’s schedule.</p><button class="button secondary" data-show-next ${nextSession ? '' : 'hidden'}>Back to next session ${icon('arrow')}</button></div>`;
  }
  function renderSelectedSession() {
    const session = sessionOn(selectedDate);
    $('#session-card-title').textContent = session
      ? session.id === nextSession?.id
        ? 'Next club session'
        : 'Session details'
      : 'Your selected date';
    $('.schedule-card-heading .live-dot').hidden = !session;
    if (!session) {
      $('#selected-session').innerHTML =
        `<div class="empty-selected"><p><strong>${formatDate(selectedDate)}</strong><br>No club session is scheduled for this date.</p><button class="button secondary" data-show-next ${nextSession ? '' : 'hidden'}>Show next club session ${icon('arrow')}</button></div>`;
      return;
    }
    $('#selected-session').innerHTML =
      `<div class="selected-summary">${dateTile(session.date, true)}<div><span class="session-type">IN PERSON</span><h3>${esc(session.title)}</h3>${session.previousStart ? `<span class="session-changed-label">${icon('clock')}Time updated</span>` : ''}</div></div><div class="selected-details"><p>${icon('calendar')}${formatDate(session.date)}</p><p>${icon('clock')}${timeRange(session)} <span class="time-zone">SAST</span></p><p>${icon('pin')}${esc(session.location)}</p></div><p class="selected-note">${esc(session.note)}</p><button class="button primary session-details-button" data-details="${esc(session.id)}">View session details ${icon('arrow')}</button><p class="managed-note">Scheduled by your Mompreneur</p>`;
  }
  function selectDate(iso, reveal = false) {
    selectedDate = iso;
    const date = dateFromISO(iso);
    displayedYear = date.getUTCFullYear();
    displayedMonth = date.getUTCMonth();
    renderCalendar();
    renderSelectedSession();
    if (reveal && window.matchMedia('(max-width:760px)').matches)
      $('.schedule-session-card').scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
  }
  function moveMonth(amount) {
    const date = new Date(Date.UTC(displayedYear, displayedMonth + amount, 1));
    displayedYear = date.getUTCFullYear();
    displayedMonth = date.getUTCMonth();
    renderCalendar();
  }
  function setView(view, focus = false) {
    calendarView = view;
    for (const name of ['month', 'list']) {
      const active = name === view;
      $(`#view-${name}`).setAttribute('aria-selected', active);
      $(`#view-${name}`).tabIndex = active ? 0 : -1;
      $(`#${name}-panel`).hidden = !active;
    }
    if (focus) $(`#view-${view}`).focus();
  }
  function openDetails(session) {
    if (!session) return;
    dialogTrigger = document.activeElement;
    $('#session-dialog-title').textContent = session.title;
    $('#session-dialog-content').innerHTML =
      `<div class="dialog-session-details"><p>${icon('calendar')}${formatDate(session.date)}</p><p>${icon('clock')}${timeRange(session)} SAST</p><p>${icon('pin')}${esc(session.location)} · In person</p></div>${session.previousStart ? `<div class="changed-times"><strong>${icon('clock')}Class time updated</strong><p>Previous time: <s>${esc(session.previousStart)} – ${esc(session.previousEnd)}</s><br><b>New time: ${timeRange(session)} SAST</b></p></div>` : ''}<p>${esc(session.note)}</p><p>Your Mompreneur manages this session. Speak to her if you need help with the class time or location.</p><div class="lesson-actions"><button class="button primary" data-close-details>Got it ${icon('check')}</button></div>`;
    $('#session-dialog').showModal();
    document.body.classList.add('modal-open');
    $('.dialog-close').focus();
  }
  $('#previous-month').addEventListener('click', () => moveMonth(-1));
  $('#next-month').addEventListener('click', () => moveMonth(1));
  $$('.view-switch button').forEach((button) => {
    button.addEventListener('click', () => setView(button.id === 'view-month' ? 'month' : 'list'));
    button.addEventListener('keydown', (event) => {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        setView(
          event.key === 'Home'
            ? 'month'
            : event.key === 'End'
              ? 'list'
              : calendarView === 'month'
                ? 'list'
                : 'month',
          true
        );
      }
    });
  });
  $('#calendar-days').addEventListener('keydown', (event) => {
    const button = event.target.closest('[data-date]');
    if (!button) return;
    const date = dateFromISO(button.dataset.date);
    const weekday = (date.getUTCDay() + 6) % 7;
    let step;
    if (event.key === 'ArrowLeft') step = -1;
    else if (event.key === 'ArrowRight') step = 1;
    else if (event.key === 'ArrowUp') step = -7;
    else if (event.key === 'ArrowDown') step = 7;
    else if (event.key === 'Home') step = -weekday;
    else if (event.key === 'End') step = 6 - weekday;
    if (step !== undefined) {
      event.preventDefault();
      date.setUTCDate(date.getUTCDate() + step);
      const iso = isoDate(date);
      selectDate(iso);
      $(`[data-date="${iso}"]`).focus();
    }
  });
  document.addEventListener('click', (event) => {
    const day = event.target.closest('[data-date]');
    if (day) {
      selectDate(day.dataset.date, true);
      return;
    }
    const row = event.target.closest('[data-session]');
    if (row) {
      const session = sessions.find((s) => s.id === row.dataset.session);
      if (session) selectDate(session.date, true);
      return;
    }
    const next = event.target.closest('[data-show-next]');
    if (next) {
      if (nextSession) selectDate(nextSession.date);
      return;
    }
    const detail = event.target.closest('[data-details]');
    if (detail) {
      openDetails(sessions.find((s) => s.id === detail.dataset.details));
      return;
    }
    if (event.target.closest('[data-close-details]')) $('#session-dialog').close();
  });
  if (changedSession) {
    $('.change-date').textContent = formatDate(changedSession.date, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    $('.change-message').textContent =
      `Your Robotics class will now run from ${changedSession.start} to ${changedSession.end}.`;
    $('#class-change-button').addEventListener('click', () => {
      selectDate(changedSession.date);
      openDetails(changedSession);
    });
  } else $('#class-change-button').hidden = true;
  $('#coming-up-list').innerHTML =
    sessions
      .filter((s) => s.date >= window.KIASecurity.currentDay() && s.id !== nextSession?.id)
      .map(agendaRow)
      .join('') || '<p class="calendar-empty">Your next sessions will appear here.</p>';
  const dialog = $('#session-dialog');
  $('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    if (dialogTrigger?.isConnected) dialogTrigger.focus();
  });
  dialog.addEventListener('click', (event) => {
    const r = dialog.getBoundingClientRect();
    if (
      event.target === dialog &&
      (event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom)
    )
      dialog.close();
  });
  $('#notification-button').addEventListener('click', () => {
    const open = $('#notifications').hidden;
    $('#notifications').hidden = !open;
    $('#notification-button').setAttribute('aria-expanded', open);
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.notification-wrap')) {
      $('#notifications').hidden = true;
      $('#notification-button').setAttribute('aria-expanded', false);
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !$('#notifications').hidden) {
      $('#notifications').hidden = true;
      $('#notification-button').setAttribute('aria-expanded', false);
      $('#notification-button').focus();
    }
  });
  renderCalendar();
  renderSelectedSession();
})();
