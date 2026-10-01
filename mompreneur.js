/* Club-focused Mompreneur screens. Uses the shared account, course and schedule models. */
window.createKIAMompreneurFeatures = (ctx) => {
  'use strict';
  const { actor, esc, icon, pill, button, viewHeading, openDialog, toast, navigate } = ctx;
  const Learning = window.KIALearning,
    Auth = window.KIAAccounts,
    LMS = window.KIALMS;
  const state = ctx.getState;
  const club = () => state().branches.find((b) => b.id === actor.branchId);
  const members = () =>
    state().users.filter((u) => u.role === 'learner' && u.branchId === actor.branchId);
  const courses = () =>
    state().courses.filter((c) => c.status === 'published' && c.audience === 'learners');
  const training = () =>
    state()
      .courses.filter((c) => Learning.assigned(actor, c))
      .sort(
        (a, b) =>
          ['onboarding', 'facilitation', 'robotics'].indexOf(a.id) -
          ['onboarding', 'facilitation', 'robotics'].indexOf(b.id)
      );
  const progress = (u, id = 'robotics') => Learning.readCourseProgress(u.id, id, state());
  const today = window.KIASecurity.currentDay;
  const date = (value, options = { day: 'numeric', month: 'short' }) =>
    new Date(value.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('en-GB', {
      ...options,
      timeZone: 'UTC',
    });
  const iso = (value) => value.toISOString().slice(0, 10);
  const sessions = () =>
    state()
      .sessions.filter((s) => s.branchId === actor.branchId)
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const upcoming = () =>
    sessions().filter((s) => Date.parse(s.date + 'T' + s.end + ':00+02:00') >= Date.now());
  const initial = (name) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  const avatar = (u, small = false) =>
    `<span class="mom-avatar ${small ? 'is-small' : ''}" aria-hidden="true">${esc(initial(u.name))}</span>`;
  const ring = (p) =>
    `<span class="mom-progress-ring" style="--progress:${p.percent}%" role="img" aria-label="${p.percent}% completed"><span>${p.percent}%</span></span>`;
  const header = (title, symbol, target = '', label = 'View all') =>
    `<div class="mom-panel-heading"><h2>${icon(symbol)}${title}</h2>${target ? `<a class="text-link" href="#${target}">${label} ${icon('arrow')}</a>` : ''}</div>`;
  const empty = (title, copy, action = '') =>
    `<div class="mom-empty">${icon('course')}<strong>${title}</strong><p>${copy}</p>${action}</div>`;
  const key = `kia-mom-preferences-${actor.id}`;
  const saved = window.KIAStorage.read(key) || {};
  const preferences = {
    sessions: saved.sessions !== false,
    training: saved.training !== false,
    compact: saved.compact === true,
    read: Array.isArray(saved.read) ? saved.read : [],
  };
  let selectedMember = '',
    memberSearch = '',
    memberStatus = 'all',
    memberPage = 1;
  let progressSearch = '',
    progressStatus = 'all',
    progressCourse = 'robotics';
  let selectedDate = today(),
    month = selectedDate.slice(0, 7);
  function savePreferences() {
    if (!Auth.isCurrent(actor) || !Auth.checkPage()) return false;
    if (!window.KIAStorage.write(key, preferences)) {
      toast('Your preferences could not be saved in this tab.');
      return false;
    }
    return true;
  }
  const access = (u) =>
    u.status !== 'active'
      ? ['Inactive', 'gray']
      : u.accessStatus === 'pending'
        ? ['Setup pending', 'amber']
        : ['Ready', 'green'];
  function card(u) {
    const p = progress(u),
      enrolled = state().courses.filter((c) => u.courseIds.includes(c.id));
    return `<article class="panel mom-member-card"><div class="mom-member-top">${avatar(u)}<div><h2>${esc(u.name)}</h2><p>@${esc(u.username)}</p></div>${pill(...access(u))}</div><div class="mom-member-progress"><div><span>Robotics progress</span><strong>${p.completed.size} of ${p.total} lessons</strong></div>${ring(p)}</div><div class="mom-member-meta">${icon('course')} ${enrolled.length} assigned course${enrolled.length === 1 ? '' : 's'}<span>${icon('branch')} ${esc(club()?.name || 'My club')}</span></div><div class="mom-member-actions">${button('View Progress', 'view-user', 'report', true, u.id)}${button('Edit Profile', 'edit-user', 'edit', true, u.id)}${button('Invitation', 'invite-user', 'mail', true, u.id)}</div></article>`;
  }
  function memberRows() {
    const list = members().filter(
      (u) =>
        `${u.name} ${u.username} ${Auth.emailOf(u)}`
          .toLowerCase()
          .includes(memberSearch.toLowerCase()) &&
        (memberStatus === 'all' ||
          (memberStatus === 'pending'
            ? u.accessStatus === 'pending' && u.status === 'active'
            : u.status === memberStatus))
    );
    const pages = Math.max(1, Math.ceil(list.length / 9));
    memberPage = Math.min(memberPage, pages);
    const subset = list.slice((memberPage - 1) * 9, memberPage * 9);
    return `<div class="mom-results-summary"><strong>${list.length} member${list.length === 1 ? '' : 's'}</strong><span>${esc(club()?.name || '')} · your club only</span></div>${subset.length ? `<div class="mom-members-grid">${subset.map(card).join('')}</div>` : empty('No members found', 'Try another search or add your first learner.', button('Add Learner', 'add-user', 'users'))}<div class="mom-pagination"><button class="button secondary" data-mom-action="member-prev" ${memberPage === 1 ? 'disabled' : ''}>Previous</button><span>Page ${memberPage} of ${pages}</span><button class="button secondary" data-mom-action="member-next" ${memberPage === pages ? 'disabled' : ''}>Next</button></div>`;
  }
  function membersView() {
    return (
      viewHeading(
        'My Club Members',
        'Welcome learners, manage their profiles and follow their learning.',
        button('Assign Course', 'assign-course', 'course', true) +
          button('Add Learner', 'add-user', 'users')
      ) +
      `<div class="mom-inline-note">${icon('shield')}<p>New learners receive Robotics automatically. Invitations use the guardian’s email; siblings keep separate usernames and passwords.</p><a href="#invitations">View invitations ${icon('arrow')}</a></div><section class="mom-filters"><label class="mom-search">${icon('search')}<span class="sr-only">Search club members</span><input id="mom-member-search" type="search" placeholder="Search name, username or guardian email" value="${esc(memberSearch)}"/></label><label><span>Account status</span><select id="mom-member-status">${[
        ['all', 'All members'],
        ['active', 'Active'],
        ['pending', 'Setup pending'],
        ['inactive', 'Inactive'],
      ]
        .map(
          ([id, label]) =>
            `<option value="${id}" ${memberStatus === id ? 'selected' : ''}>${label}</option>`
        )
        .join(
          ''
        )}</select></label><a class="button secondary" href="#groups">${icon('users')}Learning Groups</a></section><div id="mom-member-results">${memberRows()}</div>`
    );
  }
  function featured() {
    const list = members(),
      u = list.find((u) => u.id === selectedMember) || list[0];
    if (!u)
      return empty(
        'Your club starts here',
        'Add your first learner to see their progress.',
        button('Add Learner', 'add-user', 'users')
      );
    selectedMember = u.id;
    const p = progress(u);
    return `<button class="mom-featured-person" data-action="view-user" data-id="${esc(u.id)}">${avatar(u)}<span class="mom-featured-name"><strong>${esc(u.name)}</strong><small>@${esc(u.username)} · Robotics</small></span><span class="mom-ring-label">Overall progress</span>${ring(p)}${icon('chevron')}</button><div class="mom-featured-metrics"><div>${icon('course')}<span>Assigned courses<strong>${u.courseIds.length}</strong></span></div><div>${icon('check')}<span>Completed lessons<strong>${p.completed.size}</strong></span></div><div>${icon('clock')}<span>Lessons to go<strong>${p.total - p.completed.size}</strong></span></div></div><div class="mom-member-switch"><span>Club members</span><div>${list
      .slice(0, 5)
      .map(
        (m) =>
          `<button data-mom-action="feature-member" data-id="${esc(m.id)}" aria-label="Show ${esc(m.name)}" aria-pressed="${m.id === u.id}">${avatar(m, true)}</button>`
      )
      .join(
        ''
      )}</div>${list.length > 5 ? `<a href="#users">+${list.length - 5} more</a>` : ''}</div>`;
  }
  function trainingCards() {
    return training()
      .map((c, i) => {
        const p = progress(actor, c.id),
          locked = !Learning.unlocked(actor, c.id, state());
        return `<button class="mom-training-card mom-tone-${['green', 'amber', 'purple'][i % 3]} ${locked ? 'is-locked' : ''}" data-mom-action="training" data-id="${esc(c.id)}"><span class="mom-course-symbol">${icon(locked ? 'shield' : c.id === 'robotics' ? 'robot' : 'course')}</span><span class="mom-course-copy"><strong>${esc(c.title)}</strong><small>${locked ? 'Complete onboarding to unlock' : `${p.completed.size} of ${p.total} lessons completed`}</small></span><span class="mom-course-progress"><span class="progress-track"><span style="width:${p.percent}%"></span></span><small>${locked ? 'Locked' : p.percent + '%'}</small></span></button>`;
      })
      .join('');
  }
  function sessionRows(list) {
    return list
      .map(
        (s) =>
          `<button class="mom-session" data-action="edit-session" data-id="${esc(s.id)}"><span class="mom-date-tile"><strong>${Number(s.date.slice(-2))}</strong><small>${date(s.date, { month: 'short' })}</small></span><span><strong>${esc(s.title)}</strong><small>${esc(s.location)}</small><span>${esc(s.start)} – ${esc(s.end)}${s.previousStart || s.previousDate ? ' · Updated' : ''}</span></span>${icon('chevron')}</button>`
      )
      .join('');
  }
  function dashboard() {
    const list = members(),
      active = list.filter((u) => u.status === 'active'),
      next = upcoming();
    const activity = state()
      .activity.filter((a) => a.branchId === actor.branchId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 4);
    const stats = [
      ['Club Members', list.length, 'enrolled in your club', 'users', 'blue', 'members'],
      ['Active Learners', active.length, 'active club profiles', 'course', 'green', 'active'],
      [
        'Robotics Completed',
        list.filter((u) => progress(u).percent === 100).length,
        'course completions',
        'award',
        'amber',
        'completed',
      ],
      ['Upcoming Sessions', next.length, 'on your club calendar', 'calendar', 'purple', 'sessions'],
    ];
    return `<section class="mom-hero"><div class="mom-hero-copy"><p class="eyebrow">WELCOME BACK, ${esc(actor.name.split(' ')[0])}</p><h1>Support. Guide.<br/>Build their future.</h1><p>Help your club grow. Follow your learners’ progress,<br class="mom-desktop-break"/> prepare inspiring lessons and celebrate every discovery.</p></div><div class="mom-hero-motto" aria-hidden="true">${icon('heart')}Stronger clubs.<br/>Brighter<br/>futures.<span></span></div><div class="mom-hero-art" role="img" aria-label="An adult supporting a smiling young learner at a laptop"></div></section><div class="mom-dashboard"><div class="mom-stats">${stats.map(([label, value, note, symbol, tone, action]) => `<button class="mom-stat mom-tone-${tone}" data-mom-action="stat-${action}"><span class="mom-stat-icon">${icon(symbol)}</span><span><strong>${label}</strong><b>${value}</b><small>${note}</small></span>${icon('chevron')}</button>`).join('')}</div><section class="panel mom-members-panel">${header('My Club Members', 'users', 'users')}<div id="mom-featured">${featured()}</div></section><section class="panel mom-activity-panel">${header('Recent Activity', 'clock', 'reports')}<div class="mom-activity-list">${activity.map((a, i) => `<a href="#${['users', 'courses', 'schedules', 'reports', 'invitations', 'announcements', 'groups'].includes(a.route) ? a.route : 'reports'}" class="mom-activity"><span class="mom-activity-symbol mom-tone-${['green', 'blue', 'purple', 'amber'][i % 4]}">${icon(a.icon)}</span><span><strong>${esc(a.title)}</strong><small>${esc(a.detail)}</small></span><time datetime="${esc(a.date)}">${date(a.date)}</time></a>`).join('') || empty('No club activity yet', 'Updates will appear as your club starts learning.')}</div></section><section class="panel mom-training-panel">${header('My Training & Courses', 'course', 'courses')}<div class="mom-training-grid">${trainingCards()}</div><p class="mom-training-footnote">${icon('shield')}Complete onboarding to unlock your facilitation lessons. Robotics lets you explore the course your club follows.</p></section><aside class="mom-dashboard-rail"><section class="panel mom-quick-panel">${header('Quick Actions', 'users')}<div class="mom-quick-grid"><button data-action="add-user">${icon('users')}Add Learner</button><button data-action="assign-course">${icon('course')}Assign Course</button><button data-action="add-session">${icon('calendar')}Add Session</button><a href="#reports" data-lms-report-link="learners">${icon('download')}View Reports</a></div></section><section class="panel mom-upcoming-panel">${header('Upcoming Sessions', 'calendar', 'schedules')}<div>${sessionRows(next.slice(0, 3)) || empty('No upcoming sessions', 'Plan your next club class.', button('Add Session', 'add-session', 'calendar'))}</div></section><section class="panel mom-resources-panel">${header('Learning Resources', 'content', 'content')}<button class="mom-resource-link" data-mom-action="training" data-id="onboarding"><span class="mom-resource-icon mom-tone-blue">${icon('course')}</span><span><strong>Mompreneur Onboarding</strong><small>Start here and get to know your portal</small></span>${icon('chevron')}</button><a class="mom-resource-link" href="#content"><span class="mom-resource-icon mom-tone-amber">${icon('robot')}</span><span><strong>Robotics Resources</strong><small>Materials for your club’s learning</small></span>${icon('chevron')}</a><a class="mom-resource-link" href="#schedules"><span class="mom-resource-icon mom-tone-green">${icon('calendar')}</span><span><strong>Club Calendar</strong><small>Class sessions and schedule changes</small></span>${icon('chevron')}</a><button class="mom-resource-link" data-mom-action="help"><span class="mom-resource-icon mom-tone-purple">${icon('help')}</span><span><strong>Getting Started</strong><small>Accounts, learning and your club</small></span>${icon('chevron')}</button></section></aside></div>`;
  }
  function filteredProgress() {
    if (!courses().some((c) => c.id === progressCourse))
      progressCourse = courses()[0]?.id || 'robotics';
    return members()
      .filter(
        (u) =>
          u.courseIds.includes(progressCourse) &&
          `${u.name} ${u.username}`.toLowerCase().includes(progressSearch.toLowerCase())
      )
      .map((u) => ({ u, p: progress(u, progressCourse) }))
      .filter(
        ({ p }) =>
          progressStatus === 'all' ||
          (progressStatus === 'completed'
            ? p.percent === 100
            : progressStatus === 'not-started'
              ? p.completed.size === 0
              : p.percent > 0 && p.percent < 100)
      );
  }
  function progressRows() {
    const rows = filteredProgress();
    const done = rows.reduce((n, { p }) => n + p.completed.size, 0),
      left = rows.reduce((n, { p }) => n + p.total - p.completed.size, 0);
    const mean = rows.length
      ? Math.round(rows.reduce((n, { p }) => n + p.percent, 0) / rows.length)
      : 0;
    return `<div class="mom-progress-summary"><div><span>Matching learners</span><strong>${rows.length}</strong></div><div><span>Average progress</span><strong>${mean}%</strong></div><div><span>Completed lessons</span><strong>${done}</strong></div><div><span>Outstanding lessons</span><strong>${left}</strong></div></div><div class="mom-progress-list">${
      rows
        .map(({ u, p }) => {
          const quizzes = Object.values(p.quizScores),
            meanQuiz = quizzes.length
              ? Math.round(quizzes.reduce((a, b) => a + b, 0) / quizzes.length) + '%'
              : 'Not taken';
          return `<article class="panel mom-progress-row">${avatar(u)}<div class="mom-progress-identity"><h2>${esc(u.name)}</h2><p>@${esc(u.username)} · ${esc(courses().find((c) => c.id === progressCourse)?.title || 'Robotics')}</p>${pill(...access(u))}</div><div class="mom-progress-bar">${ctx.progressBar(p.percent)}<small>${p.completed.size} completed · ${p.total - p.completed.size} outstanding</small></div><div class="mom-quiz-average"><small>Quiz average</small><strong>${meanQuiz}</strong></div>${button('View Lessons', 'view-user', 'eye', true, u.id)}</article>`;
        })
        .join('') || empty('No matching learners', 'Change your filters to see more club members.')
    }</div>`;
  }
  function progressView() {
    filteredProgress();
    return (
      viewHeading(
        'Learner Progress',
        'Know what each club member has completed and where they need support.',
        `<button class="button secondary" data-mom-action="export-progress">${icon('download')}Export Progress</button>`
      ) +
      `<section class="mom-filters"><label class="mom-search">${icon('search')}<span class="sr-only">Search learner progress</span><input id="mom-progress-search" type="search" placeholder="Search name or username" value="${esc(progressSearch)}"/></label><label><span>Course</span><select id="mom-progress-course">${courses()
        .map(
          (c) =>
            `<option value="${esc(c.id)}" ${progressCourse === c.id ? 'selected' : ''}>${esc(c.title)}</option>`
        )
        .join('')}</select></label><label><span>Progress</span><select id="mom-progress-status">${[
        ['all', 'All progress'],
        ['not-started', 'Not started'],
        ['in-progress', 'In progress'],
        ['completed', 'Completed'],
      ]
        .map(
          ([id, label]) =>
            `<option value="${id}" ${progressStatus === id ? 'selected' : ''}>${label}</option>`
        )
        .join('')}</select></label></section><div id="mom-progress-results">${progressRows()}</div>`
    );
  }
  function calendar() {
    const start = new Date(month + '-01T12:00:00Z'),
      offset = (start.getUTCDay() + 6) % 7;
    const first = new Date(start);
    first.setUTCDate(1 - offset);
    return `<div class="mom-calendar-heading"><div><h2>${date(month + '-01', { month: 'long', year: 'numeric' })}</h2><p>${sessions().filter((s) => s.date.startsWith(month)).length} club sessions · SAST</p></div><div><button class="icon-button" data-mom-action="month-prev" aria-label="Previous month">${icon('left')}</button><button class="button secondary" data-mom-action="calendar-today">Today</button><button class="icon-button" data-mom-action="month-next" aria-label="Next month">${icon('chevron')}</button></div></div><div class="mom-weekdays" aria-hidden="true">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => `<span>${d}</span>`).join('')}</div><div class="mom-calendar-grid" role="group" aria-label="Choose a class date">${Array.from(
      { length: 42 },
      (_, i) => {
        const d = new Date(first);
        d.setUTCDate(first.getUTCDate() + i);
        const day = iso(d),
          events = sessions().filter((s) => s.date === day);
        return `<button class="mom-day ${day.startsWith(month) ? '' : 'outside-month'} ${day === today() ? 'is-today' : ''}" data-mom-action="calendar-day" data-date="${day}" aria-pressed="${day === selectedDate}" aria-label="${date(day, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, ${events.length} session${events.length === 1 ? '' : 's'}"><span>${d.getUTCDate()}</span>${events.length ? `<small><i></i><span>${events.length} session${events.length === 1 ? '' : 's'}</span></small>` : ''}</button>`;
      }
    ).join(
      ''
    )}</div><p class="mom-calendar-legend"><i></i>Club session <span>All class times are South African time.</span></p>`;
  }
  function agenda() {
    const list = sessions().filter((s) => s.date === selectedDate);
    return (
      header(date(selectedDate, { weekday: 'short', day: 'numeric', month: 'short' }), 'calendar') +
      `<div class="mom-agenda">${list.map((s) => `<button class="mom-agenda-event" data-action="edit-session" data-id="${esc(s.id)}"><span class="mom-agenda-time">${esc(s.start)} – ${esc(s.end)}${s.previousStart || s.previousDate ? pill('Updated', 'amber') : ''}</span><strong>${esc(s.title)}</strong><span>${icon('pin')}${esc(s.location)}</span>${s.previousDate ? `<small>Previous date: ${date(s.previousDate)}</small>` : ''}${s.previousStart ? `<small>Previous time: ${esc(s.previousStart)} – ${esc(s.previousEnd)}</small>` : ''}<p>${esc(s.note || 'No class note added.')}</p><span class="text-link">Manage session ${icon('edit')}</span></button>`).join('') || empty('A little room to plan', 'There are no club sessions on this date.')}<button class="button mom-full-button" data-mom-action="add-calendar-session">${icon('plus')}Add Session on This Date</button></div>`
    );
  }
  function scheduleView() {
    return (
      viewHeading(
        'Club Schedule',
        'Plan in-person classes and keep your learners informed of changes.',
        button('Add Session', 'add-session', 'calendar')
      ) +
      `<div class="mom-schedule-layout"><section class="panel mom-calendar-panel" id="mom-calendar">${calendar()}</section><section class="panel mom-agenda-panel" id="mom-agenda">${agenda()}</section></div><div class="mom-inline-note">${icon('users')}<p>Sessions and class notes appear on the schedule of learners in ${esc(club()?.name || 'your club')}.</p><a href="#announcements">Write an announcement ${icon('arrow')}</a></div>`
    );
  }
  function notifications() {
    const notices = LMS.visibleAnnouncements(state(), actor).map((a) => ({
      id: 'notice:' + a.id,
      revision: a.revision,
      title: a.title,
      body: a.body,
      symbol: 'mail',
      route: 'notifications',
      read: LMS.isRead(state(), actor, a),
      noticeId: a.id,
      date: a.updatedAt,
    }));
    const pending = members().filter((u) => u.status === 'active' && u.accessStatus === 'pending');
    if (pending.length)
      notices.push({
        id: 'setup',
        revision: pending
          .map((u) => u.id)
          .sort()
          .join(','),
        title: `${pending.length} learner account${pending.length === 1 ? '' : 's'} awaiting setup`,
        body: 'Review the invitation previews for their parents or guardians.',
        symbol: 'users',
        route: 'invitations',
      });
    if (preferences.training && !Learning.unlocked(actor, 'facilitation', state()))
      notices.push({
        id: 'onboarding',
        revision: '1',
        title: 'Your next step: Mompreneur Onboarding',
        body: 'Complete the onboarding course to unlock your facilitation lessons.',
        symbol: 'course',
        route: 'courses',
      });
    if (preferences.sessions) {
      const until = new Date(today() + 'T12:00:00Z');
      until.setUTCDate(until.getUTCDate() + 7);
      upcoming()
        .filter((s) => s.date <= iso(until))
        .forEach((s) =>
          notices.push({
            id: 'session:' + s.id,
            revision: s.date + s.start + s.end + (s.updatedAt || ''),
            title:
              s.previousStart || s.previousDate ? 'Class session updated' : `Upcoming: ${s.title}`,
            body: `${date(s.date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${s.start} – ${s.end} · ${s.location}`,
            symbol: 'calendar',
            route: 'schedules',
          })
        );
    }
    return notices.map((n) => ({
      ...n,
      read: n.noticeId ? n.read : preferences.read.includes(n.id + ':' + n.revision),
    }));
  }
  function updateChrome() {
    const badge = document.querySelector('#mom-notification-count'),
      bell = document.querySelector('#mom-notification-link');
    const unread = notifications().filter((n) => !n.read).length;
    if (badge) {
      badge.textContent = unread > 99 ? '99+' : String(unread);
      badge.hidden = !unread;
      bell.setAttribute('aria-label', `Notifications${unread ? ', ' + unread + ' unread' : ''}`);
    }
    document.body.classList.toggle('mom-compact', preferences.compact);
  }
  function notificationsView() {
    const list = notifications();
    return (
      viewHeading(
        'Notifications',
        'KIA notices, account setup and upcoming class reminders.',
        `<button class="button secondary" data-mom-action="read-all" ${list.every((n) => n.read) ? 'disabled' : ''}>${icon('check')}Mark All Read</button>`
      ) +
      `<div class="mom-notifications">${list.map((n) => `<article class="panel mom-notification ${n.read ? 'is-read' : ''}"><span class="mom-activity-symbol mom-tone-blue">${icon(n.symbol)}</span><div><h2>${esc(n.title)}${n.read ? '' : pill('New', 'blue')}</h2><p>${esc(n.body)}</p>${n.route !== 'notifications' ? `<a class="text-link" href="#${n.route}">Open ${n.route === 'schedules' ? 'club schedule' : n.route === 'courses' ? 'my training' : 'invitations'} ${icon('arrow')}</a>` : ''}</div><button class="icon-button" data-mom-action="read-notice" data-id="${esc(n.id)}" aria-label="${n.read ? 'Read' : 'Mark read: ' + esc(n.title)}" ${n.read ? 'disabled' : ''}>${icon('check')}</button></article>`).join('') || empty('You’re all caught up', 'New club notices and reminders will appear here.')}</div><p class="mom-small-note">These are in-portal notifications. Manage dashboard reminders in <a href="#settings">Settings</a>.</p>`
    );
  }
  function settingsView() {
    const person = state().users.find((u) => u.id === actor.id),
      branch = club();
    const fields = [
      ['Full name', person.name],
      ['Username', person.username],
      ['Email address', person.email],
      ['Cellphone', person.phone],
      [
        'Date of birth',
        person.birthDate
          ? date(person.birthDate, { day: 'numeric', month: 'long', year: 'numeric' })
          : 'Not set',
      ],
      ['Gender', person.gender],
      ['Home address', person.homeAddress],
    ];
    return (
      viewHeading('My Settings', 'Your Mompreneur profile, club details and portal preferences.') +
      `<div class="mom-settings-layout"><section class="panel mom-settings-profile">${header('My Profile', 'users')}<div class="mom-profile-intro">${avatar(person)}<div><strong>${esc(person.name)}</strong><p>Mompreneur · ${esc(branch?.name || 'Awaiting club')}</p></div>${pill('Active', 'green')}</div><dl class="mom-profile-fields">${fields.map(([label, value]) => `<div><dt>${label}</dt><dd>${esc(value || 'Not set')}</dd></div>`).join('')}</dl><p class="mom-small-note">KIA Admin manages your account details. <a href="contact.html">Contact KIA to request a change.</a></p></section><div><section class="panel mom-settings-club">${header('My Club', 'branch')}<h3>${esc(branch?.name || 'Your club is being prepared')}</h3><p>${icon('pin')}${esc(branch?.location || 'KIA will confirm the location.')}</p><div class="mom-club-settings-count"><strong>${members().length}</strong><span>club members</span></div><p class="mom-small-note">You manage this club’s learners and schedule. KIA Admin manages branch ownership and shared course content.</p></section><section class="panel mom-preferences">${header('Portal Preferences', 'settings')}${[
        [
          'sessions',
          'Upcoming class reminders',
          'Show reminders for sessions in the next seven days.',
        ],
        ['training', 'Training reminders', 'Show a reminder until your onboarding is complete.'],
        ['compact', 'Compact member cards', 'Use a smaller layout when browsing your club.'],
      ]
        .map(
          ([id, label, copy]) =>
            `<label class="setting-line"><span><strong>${label}</strong><small>${copy}</small></span><input type="checkbox" class="switch" data-mom-preference="${id}" ${preferences[id] ? 'checked' : ''}/></label>`
        )
        .join(
          ''
        )}<p class="mom-small-note">Preferences are saved for your account in this preview tab.</p></section></div></div>`
    );
  }
  function markRead(ids) {
    for (const n of notifications().filter((n) => ids.includes(n.id))) {
      if (n.noticeId) LMS.markRead(n.noticeId);
      else
        preferences.read = [...new Set([...preferences.read, n.id + ':' + n.revision])].slice(-200);
    }
    savePreferences();
    ctx.reload();
  }
  function help() {
    openDialog(
      'Welcome to your club',
      `<div class="mom-help"><p>Everything you need to guide your club’s next discovery.</p><ol><li><strong>Complete your onboarding.</strong><p>Open My Training. Completing every onboarding lesson unlocks your facilitation course.</p></li><li><strong>Welcome your learners.</strong><p>Add each learner in My Club Members using their guardian’s contact details. Robotics is assigned automatically. Siblings can share a guardian email and have separate usernames and passwords.</p></li><li><strong>Plan your club sessions.</strong><p>Add dates, times and class notes in Club Schedule. Your club’s learners see those sessions on their schedules.</p></li><li><strong>Follow their progress.</strong><p>Open Learner Progress for completed and outstanding lessons and quiz results. Reports can be filtered and exported for your club.</p></li></ol><a class="button" href="#courses" data-mom-action="help-training">${icon('course')}Go to My Training</a></div>`,
      'MOMPRENEUR GUIDE'
    );
  }
  document.addEventListener('input', (event) => {
    if (!Auth.checkPage()) return;
    if (event.target.id === 'mom-member-search') {
      memberSearch = event.target.value;
      memberPage = 1;
      document.querySelector('#mom-member-results').innerHTML = memberRows();
    }
    if (event.target.id === 'mom-progress-search') {
      progressSearch = event.target.value;
      document.querySelector('#mom-progress-results').innerHTML = progressRows();
    }
  });
  document.addEventListener('change', (event) => {
    if (!Auth.checkPage()) return;
    if (event.target.id === 'mom-member-status') {
      memberStatus = event.target.value;
      memberPage = 1;
      document.querySelector('#mom-member-results').innerHTML = memberRows();
    }
    if (event.target.id === 'mom-progress-course' || event.target.id === 'mom-progress-status') {
      if (event.target.id === 'mom-progress-course') progressCourse = event.target.value;
      else progressStatus = event.target.value;
      document.querySelector('#mom-progress-results').innerHTML = progressRows();
    }
    const pref = event.target.dataset.momPreference;
    if (['sessions', 'training', 'compact'].includes(pref)) {
      const old = preferences[pref];
      preferences[pref] = event.target.checked;
      if (savePreferences()) {
        updateChrome();
        toast('Preference saved.');
      } else {
        preferences[pref] = old;
        event.target.checked = old;
      }
    }
  });
  document.addEventListener('click', (event) => {
    const control = event.target.closest('[data-mom-action]');
    if (!control || !Auth.checkPage() || !Auth.isCurrent(actor)) return;
    const action = control.dataset.momAction,
      id = control.dataset.id;
    if (action === 'feature-member') {
      if (!members().some((u) => u.id === id)) return;
      selectedMember = id;
      document.querySelector('#mom-featured').innerHTML = featured();
      document
        .querySelector(`[data-mom-action="feature-member"][data-id="${CSS.escape(id)}"]`)
        ?.focus();
    } else if (action === 'training') {
      if (!training().some((c) => c.id === id)) return;
      if (!Learning.unlocked(actor, id, state())) {
        toast('Complete Mompreneur Onboarding to unlock facilitation.');
        navigate('courses');
      } else ctx.openCourse(id);
    } else if (action === 'member-prev' || action === 'member-next') {
      memberPage += action === 'member-next' ? 1 : -1;
      document.querySelector('#mom-member-results').innerHTML = memberRows();
      document.querySelector('#mom-member-search').focus();
    } else if (action === 'stat-members') {
      memberStatus = 'all';
      memberSearch = '';
      navigate('users');
    } else if (action === 'stat-active') {
      memberStatus = 'active';
      memberSearch = '';
      navigate('users');
    } else if (action === 'stat-completed') {
      progressStatus = 'completed';
      progressCourse = 'robotics';
      progressSearch = '';
      navigate('progress');
    } else if (action === 'stat-sessions') navigate('schedules');
    else if (action === 'help') help();
    else if (action === 'help-training') ctx.closeDialog();
    else if (action === 'read-notice') markRead([id]);
    else if (action === 'read-all') markRead(notifications().map((n) => n.id));
    else if (action === 'export-progress') {
      LMS.downloadCSV('KIA_Club_Learner_Progress.csv', [
        [
          'Learner',
          'Username',
          'Club',
          'Course',
          'Progress (%)',
          'Completed lessons',
          'Outstanding lessons',
          'Quiz average (%)',
        ],
        ...filteredProgress().map(({ u, p }) => {
          const scores = Object.values(p.quizScores);
          return [
            u.name,
            u.username,
            club()?.name || '',
            courses().find((c) => c.id === progressCourse)?.title || '',
            p.percent,
            p.completed.size,
            p.total - p.completed.size,
            scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : '',
          ];
        }),
      ]);
      toast('Club progress report exported.');
    } else if (action === 'add-calendar-session') ctx.addSession(selectedDate);
    else if (['calendar-day', 'calendar-today', 'month-prev', 'month-next'].includes(action)) {
      if (action === 'calendar-day' && window.KIASecurity.isDate(control.dataset.date)) {
        selectedDate = control.dataset.date;
        month = selectedDate.slice(0, 7);
      } else if (action === 'calendar-today') {
        selectedDate = today();
        month = selectedDate.slice(0, 7);
      } else {
        const d = new Date(month + '-01T12:00:00Z');
        d.setUTCMonth(d.getUTCMonth() + (action === 'month-prev' ? -1 : 1));
        month = iso(d).slice(0, 7);
        selectedDate = month + '-01';
      }
      document.querySelector('#mom-calendar').innerHTML = calendar();
      document.querySelector('#mom-agenda').innerHTML = agenda();
      document
        .querySelector(`[data-mom-action="calendar-day"][data-date="${selectedDate}"]`)
        ?.focus();
    }
  });
  return {
    dashboard,
    membersView,
    progressView,
    scheduleView,
    settingsView,
    notificationsView,
    updateChrome,
  };
};
