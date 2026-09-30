/* Selected learner identity for the browser preview. Personal details are
   managed by KIA / the club owner, not collected from the learner. */
(() => {
  'use strict';
  const Auth = window.KIAAccounts,
    profile = Auth.guard('learner');
  if (!profile || profile.role !== 'learner') {
    location.replace('login.html');
    return;
  }
  window.KIALearner = profile;
  const $ = (selector) => document.querySelector(selector);
  const esc = window.KIASecurity.escapeHTML;
  const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const { club, sessions, formatDate, timeRange, sessionURL } = window.KIAClubSchedule;
  const today = window.KIASecurity.currentDay();
  const next = sessions.find((s) => s.date >= today),
    changed = sessions.find((s) => s.previousStart && s.date >= today);
  document.querySelectorAll('.account-name strong,.student-user-copy strong').forEach((n) => {
    n.textContent = profile.name.split(' ')[0];
    n.title = profile.name;
  });
  document.querySelectorAll('.avatar,.student-avatar').forEach((n) => {
    n.textContent = profile.name.trim()[0].toUpperCase();
  });
  if ($('.student-user-copy span')) $('.student-user-copy span').textContent = 'Learner';
  if ($('.student-kicker'))
    $('.student-kicker').textContent = 'WELCOME BACK, ' + profile.name.split(' ')[0].toUpperCase();
  if ($('.club-chip strong')) $('.club-chip strong').textContent = club.name;
  if ($('.club-label')) $('.club-label').innerHTML = icon('pin') + esc(club.name);
  if ($('#session-dialog .eyebrow'))
    $('#session-dialog .eyebrow').textContent = club.name.toUpperCase() + ' · IN PERSON';
  const notifications = $('#notifications');
  if (notifications) {
    notifications.querySelector('p').textContent = changed
      ? `Your ${changed.title} on ${formatDate(changed.date, { day: 'numeric', month: 'long' })} now starts at ${changed.start}.`
      : next
        ? `Your next club session is on ${formatDate(next.date, { day: 'numeric', month: 'long' })} at ${next.start}.`
        : 'Your Mompreneur will share club sessions here.';
    const link = notifications.querySelector('a');
    link.href = changed ? sessionURL(changed) : 'schedule.html';
    link.innerHTML = (changed ? 'See class change' : 'View schedule') + icon('arrow');
    const dot = $('.notification-dot');
    if (dot) dot.hidden = !changed;
  }
  const sessionCard = $('#club-schedule');
  if (sessionCard) {
    if (next) {
      $('.date-block span').textContent = formatDate(next.date, { month: 'short' }).toUpperCase();
      $('.date-block strong').textContent = next.date.slice(-2);
      $('.date-block small').textContent = formatDate(next.date, { weekday: 'long' }).toUpperCase();
      $('.next-session p').textContent = next.title;
      $('.session-details').innerHTML =
        `<p>${icon('clock')}${esc(timeRange(next))} <span>SAST</span></p><p>${icon('pin')}${esc(next.location)}</p>`;
      $('.session-message').textContent = next.note;
      $('#schedule-button').href = sessionURL(next);
    } else {
      sessionCard.querySelector('.live-dot').hidden = true;
      $('.next-session').innerHTML =
        '<div><span class="session-type">YOUR CLUB</span><h3>More learning ahead</h3><p>No upcoming session scheduled yet.</p></div>';
      $('.session-details').innerHTML = `<p>${icon('pin')}${esc(club.name)}</p>`;
      $('.session-message').textContent = 'Your Mompreneur will share your next class date here.';
    }
  }
  // Avoid restoring an authenticated page from browser history after logging out.
  window.addEventListener('pageshow', () => {
    if (!Auth.current()) location.replace('login.html');
  });
})();
