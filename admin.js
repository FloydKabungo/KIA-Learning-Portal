(() => {
  'use strict';
  const Store = window.KIAAdminData;
  const Auth = window.KIAAccounts;
  const isMom = document.body.dataset.portal === 'mompreneur';
  const actor = Auth.guard(isMom ? 'mompreneur' : 'admin');
  if (!actor || actor.role !== (isMom ? 'mompreneur' : 'admin')) {
    location.replace('login.html');
    return;
  }
  let state = Store.read();
  let scope = isMom ? actor.branchId : 'all',
    query = '',
    userTab = 'learner',
    contentCourse = 'all',
    currentCourse = null;
  let toastTimer;
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const esc = window.KIASecurity.escapeHTML;
  const iconPaths = {
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4M12 2V1"/>',
    heart:
      '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
    left: '<path d="m15 5-7 7 7 7"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m3 6 9 7 9-7"/>',
    home: '<path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9"/>',
    users:
      '<circle cx="9" cy="7" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3ZM16 4a3 3 0 0 1 0 6M19 14a6 6 0 0 1 3 5v2"/>',
    branch:
      '<rect x="8" y="2" width="8" height="6" rx="1.5"/><rect x="2" y="16" width="7" height="6" rx="1.5"/><rect x="15" y="16" width="7" height="6" rx="1.5"/><path d="M12 8v4M5.5 16v-4h13v4"/>',
    course: '<path d="m2 8 10-5 10 5-10 5ZM6 10v7c4 3 8 3 12 0v-7M22 8v8"/>',
    content:
      '<rect x="3" y="6" width="18" height="15" rx="2"/><path d="M7 6V3h10v3m-7 5 6 3-6 3Z"/>',
    calendar:
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 10h18m-14 4h1m3 0h1m3 0h1m-9 3h1m3 0h1"/>',
    report: '<path d="M4 20v-6h3v6Zm7 0V9h3v11Zm7 0V4h3v16ZM3 8l6-5 5 2 6-3"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="m8 14-2 8 6-3 6 3-2-8m-6-5 1.5 1.5L14 7"/>',
    settings:
      '<path d="m9 3 1-1h4l1 3 3 1 3 1 1 4-2 2v3l-1 3-4 1-2 2-4-1-1-3-3-1-3-2 1-4 2-2V6l3-2Z"/><circle cx="12" cy="12" r="3"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    plus: '<path d="M12 4v16M4 12h16"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
    upload:
      '<path d="M7 18H5a4 4 0 0 1-1-8 8 8 0 0 1 15-2 5 5 0 0 1 0 10h-2M12 10v12m-4-8 4-4 4 4"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    pin: '<path d="M19 10c0 5-7 12-7 12S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
    bolt: '<path d="m13 2-9 12h7l-1 8 10-13h-7Z"/>',
    help: '<path d="M4 14v-2a8 8 0 0 1 16 0v5c0 4-4 5-8 5"/><rect x="2" y="12" width="4" height="7" rx="2"/><rect x="18" y="12" width="4" height="7" rx="2"/>',
    exit: '<path d="M9 3H3v18h6m6-15 6 6-6 6M8 12h13"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    edit: '<path d="m15 3 6 6-12 12H3v-6Zm-2 2 6 6"/>',
    file: '<path d="M14 2H4v20h16V8Zm0 0v6h6M8 13h8m-8 4h5"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M3 16v5h18v-5"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    shield: '<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Zm-5 10 3 3 7-7"/>',
    robot:
      '<rect x="4" y="7" width="16" height="14" rx="4"/><path d="M12 7V3m-2 0h4M1 12v5m22-5v5M8 12h1m6 0h1m-8 5h8"/>',
  };
  const icon = (name) =>
    `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] || iconPaths.file}</svg>`;
  $$('[data-icon]').forEach((node) => {
    node.outerHTML = icon(node.dataset.icon);
  });
  const nav = isMom
    ? [
        ['dashboard', 'Home', 'home'],
        ['users', 'My Club Members', 'users'],
        ['courses', 'My Training', 'course'],
        ['progress', 'Learner Progress', 'report'],
        ['schedules', 'Club Schedule', 'calendar'],
        ['reports', 'Reports', 'file'],
        ['settings', 'My Settings', 'settings'],
        ['notifications', 'Notifications', 'bell'],
        ['announcements', 'Club Announcements', 'mail'],
        ['invitations', 'Invitations', 'mail'],
        ['groups', 'Learning Groups', 'users'],
        ['content', 'Resources', 'content'],
      ]
    : [
        ['dashboard', 'Dashboard', 'home'],
        ['users', 'Manage Users', 'users'],
        ['branches', 'Branches', 'branch'],
        ['courses', 'Courses', 'course'],
        ['content', 'Content', 'content'],
        ['schedules', 'Schedules', 'calendar'],
        ['certificates', 'Certificates', 'award'],
        ['reports', 'Reports', 'report'],
        ['settings', 'Settings', 'settings'],
      ];
  if (!isMom)
    nav.splice(
      3,
      0,
      ['groups', 'Learning Groups', 'users'],
      ['announcements', 'Announcements', 'mail']
    );
  if (!isMom) nav.splice(2, 0, ['invitations', 'Invitations', 'mail']);
  $('#side-nav').innerHTML = nav
    .map(
      ([route, label, symbol]) =>
        `<a href="#${route}" data-nav="${route}">${icon(symbol)}${label}</a>`
    )
    .join('');
  $('#top-nav').innerHTML = nav
    .filter(([route]) =>
      isMom
        ? ['dashboard', 'users', 'courses', 'progress', 'reports', 'settings'].includes(route)
        : !['certificates', 'settings', 'invitations', 'groups', 'announcements'].includes(route)
    )
    .map(
      ([route, label, symbol]) =>
        `<a href="#${route}" data-nav="${route}">${icon(symbol)}<span>${isMom ? { users: 'My Club', courses: 'Courses', progress: 'Progress', settings: 'Settings' }[route] || label : route === 'users' ? 'Users' : label}</span></a>`
    )
    .join('');
  $('#account-menu strong').textContent = actor.name;
  $('#account-menu small').textContent = isMom ? 'Mompreneur · your club only' : actor.email;
  $('#account-toggle .avatar').textContent = actor.name
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join('');
  const route = () =>
    nav.some((n) => n[0] === location.hash.slice(1)) ? location.hash.slice(1) : 'dashboard';
  const branch = (id) => state.branches.find((b) => b.id === id);
  const branchName = (id) => branch(id)?.name || 'All branches';
  const user = (id) => state.users.find((u) => u.id === id);
  const course = (id) => state.courses.find((c) => c.id === id);
  const visibleBranches = () => state.branches.filter((b) => scope === 'all' || b.id === scope);
  const learners = (branchId = scope) =>
    state.users.filter(
      (u) => u.role === 'learner' && (branchId === 'all' || u.branchId === branchId)
    );
  const average = (list) =>
    list.length ? Math.round(list.reduce((sum, u) => sum + u.progress, 0) / list.length) : 0;
  const initials = (name) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  const formatDate = (value) =>
    new Date(value.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });
  const pill = (label, tone = '') => `<span class="pill ${tone}">${esc(label)}</span>`;
  const avatar = (name) => `<span class="avatar">${esc(initials(name))}</span>`;
  const progressBar = (value) =>
    `<span class="progress-inline"><span class="progress-track" role="progressbar" aria-label="Course progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}"><span style="width:${value}%"></span></span>${value}%</span>`;
  const button = (label, action, symbol = 'plus', secondary = false, id = '') =>
    `<button class="button ${secondary ? 'secondary' : ''}" data-action="${action}" ${id ? `data-id="${esc(id)}"` : ''}>${icon(symbol)}${label}</button>`;
  const actionIcon = (label, action, id, symbol = 'edit') =>
    `<button class="icon-button" title="${esc(label)}" aria-label="${esc(label)}" data-action="${action}" data-id="${esc(id)}">${icon(symbol)}</button>`;
  const viewHeading = (title, subtitle, actions = '') =>
    `<div class="view-heading"><div><h1>${title}</h1><p>${subtitle}</p></div><div class="button-group">${actions}</div></div>`;
  const panelHeading = (title, symbol, target = '', label = 'View all') =>
    `<div class="panel-heading"><h2>${icon(symbol)}${title}</h2>${target ? `<a class="text-link" href="#${target}">${label}${icon('arrow')}</a>` : ''}</div>`;
  const empty = (title, note, action = '') =>
    `<div class="empty-state">${icon('search')}<h3>${title}</h3><p>${note}</p>${action}</div>`;
  const search = (placeholder) =>
    `<label class="search-wrap">${icon('search')}<span class="sr-only">${placeholder}</span><input data-search type="search" value="${esc(query)}" placeholder="${placeholder}"/></label>`;
  const info = (text, symbol = 'branch', tone = '') =>
    `<div class="info-strip ${tone}">${icon(symbol)}<div>${text}</div></div>`;
  const table = (headers, rows) =>
    `<div class="table-wrap"><table class="data-table"><thead><tr>${headers.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
  const matches = (value) => value.toLowerCase().includes(query.toLowerCase());
  const totalLessons = (c) => c.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const sessions = () =>
    state.sessions
      .filter((s) => scope === 'all' || s.branchId === scope)
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  function toast(message) {
    clearTimeout(toastTimer);
    $('#toast').textContent = message;
    $('#toast').hidden = false;
    toastTimer = setTimeout(() => {
      $('#toast').hidden = true;
    }, 4500);
  }
  function persist(message) {
    const saved = Store.save(state);
    render();
    toast(saved ? message : `${message} Changes will last only while this page is open.`);
  }
  function log(title, detail, symbol, branchId = null, target = route()) {
    window.KIALMS.record(state, {
      title,
      detail,
      icon: symbol,
      route: target,
      branchId,
      actorId: actor.id,
      actorName: actor.name,
      category:
        {
          users: 'account',
          mail: 'account',
          course: 'course',
          content: 'course',
          calendar: 'schedule',
          settings: 'settings',
          branch: 'group',
          award: 'learning',
        }[symbol] || 'account',
    });
  }
  function navigate(target) {
    if (route() === target) render();
    else location.hash = target;
  }
  function scopeOptions() {
    $('#branch-filter').innerHTML = isMom
      ? `<option value="${esc(actor.branchId || '')}">${esc(branchName(actor.branchId) === 'All branches' ? 'Awaiting club' : branchName(actor.branchId))}</option>`
      : `<option value="all">All branches</option>${state.branches.map((b) => `<option value="${esc(b.id)}">${esc(b.name)}</option>`).join('')}`;
    $('#branch-filter').value = scope || '';
    $('#branch-filter').disabled = isMom;
  }
  function stat(label, value, note, symbol, tone) {
    return `<article class="stat-card stat-${tone}"><span class="stat-icon">${icon(symbol)}</span><div><span class="stat-label">${label}</span><strong class="stat-value">${value}</strong><span class="stat-note">${note}</span></div></article>`;
  }
  function activityRows(items) {
    return items
      .map(
        (a) =>
          `<a class="activity-row" href="#${esc(a.route)}"><span class="round-icon tone-${esc(a.tone)}">${icon(a.icon)}</span><div class="activity-copy"><strong>${esc(a.title)}</strong><p>${esc(a.detail)}</p></div><time datetime="${esc(a.date)}">${formatDate(a.date)}</time>${icon('chevron')}</a>`
      )
      .join('');
  }
  function branchChart() {
    const items = visibleBranches();
    const points = items.map((b, i) => ({
      x: items.length === 1 ? 235 : 50 + (i / (items.length - 1)) * 370,
      y: 148 - average(learners(b.id)) * 1.25,
      b,
    }));
    const line = points.map((p) => `${p.x},${p.y}`).join(' ');
    const description = items.map((b) => `${b.name}: ${average(learners(b.id))}%`).join('; ');
    return `<figure class="chart"><svg viewBox="0 0 465 192" role="img" aria-label="Average Robotics progress. ${esc(description)}"><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#248aea" stop-opacity=".18"/><stop offset="1" stop-color="#248aea" stop-opacity=".02"/></linearGradient></defs>${[0, 25, 50, 75, 100].map((n) => `<line x1="40" y1="${148 - n * 1.25}" x2="440" y2="${148 - n * 1.25}" stroke="#edf3f8"/><text x="30" y="${152 - n * 1.25}" class="chart-label" text-anchor="end">${n}%</text>`).join('')}<polygon points="${points[0]?.x || 40},148 ${line} ${points.at(-1)?.x || 440},148" fill="url(#chart-fill)"/><polyline points="${line}" fill="none" stroke="#2389e7" stroke-width="2.5"/>${points.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#0874d8"/><text class="chart-label" x="${p.x}" y="${p.y - 10}" text-anchor="middle">${average(learners(p.b.id))}%</text><text class="chart-label" x="${p.x}" y="176" text-anchor="middle">${esc(p.b.name.replace(' Club', ''))}</text>`).join('')}</svg></figure>`;
  }
  function dashboard() {
    const list = learners(),
      completed = list.filter((u) => u.progress === 100),
      activity = state.activity.filter(
        (a) => scope === 'all' || !a.branchId || a.branchId === scope
      );
    const nextSessions = sessions()
      .filter((s) => s.date >= new Date().toISOString().slice(0, 10))
      .slice(0, 4);
    return `<section class="admin-hero"><div class="hero-copy"><p class="eyebrow">ADMIN PORTAL</p><h1>Manage. Support.<br/>Make an Impact.</h1><p>Welcome back, Admin. Manage learners, support your Mompreneurs and keep every KIA club moving forward.</p></div><div class="hero-motto" aria-hidden="true">${icon('course')}Better learning.<br/>Brighter futures.</div><div class="hero-art" role="img" aria-label="A learner in a yellow hoodie using a laptop"></div></section>
      <div class="dashboard-top"><div class="stats-grid">${stat('Total Learners', list.length, scope === 'all' ? 'Across all KIA clubs' : esc(branchName(scope)), 'users', 'blue')}${stat('Club Branches', visibleBranches().length, 'One Mompreneur per club', 'branch', 'green')}${stat('Shared Courses', state.courses.filter((c) => c.status === 'published').length, 'One shared content library', 'course', 'amber')}${stat('Average Progress', average(list) + '%', 'Robotics learner progress', 'report', 'purple')}</div><section class="panel quick-actions">${panelHeading('Quick Actions', 'bolt')}<div class="quick-grid"><button data-action="add-user">${icon('users')}Add Learner</button><button data-action="add-branch">${icon('branch')}Add Branch</button><button data-action="add-course">${icon('course')}Create Course</button><button data-action="add-content">${icon('upload')}Upload Content</button></div></section></div>
      ${lms.dashboardLinks()}<div class="dashboard-middle"><section class="panel">${panelHeading('Recent Activity', 'clock')}<div class="activity-list">${activityRows(activity.slice(0, 5)) || empty('No activity yet', 'Updates for this club will appear here.')}</div></section><section class="panel">${panelHeading('Branch Overview', 'report', 'reports', 'View reports')}<div class="chart-caption"><span>Robotics · average completion</span><strong>Learner Progress</strong></div>${branchChart()}<p class="chart-note">Current progress across the selected club branches.</p><div class="overview-mini"><div class="tone-green"><span>Active learners</span><strong>${list.filter((u) => u.status === 'active').length}</strong></div><div class="tone-purple"><span>Completed Robotics</span><strong>${completed.length}</strong></div><div class="tone-blue"><span>Club sessions</span><strong>${sessions().length}</strong></div></div></section><section class="panel upcoming-panel">${panelHeading('Upcoming Sessions', 'calendar', 'schedules')}<div class="session-list">${nextSessions.map((s) => `<button class="session-row" data-action="edit-session" data-id="${esc(s.id)}"><span class="date-tile"><small>${new Date(s.date + 'T12:00:00Z').toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}</small><strong>${Number(s.date.slice(-2))}</strong></span><span class="session-copy"><strong>${esc(s.title)}</strong><p>${esc(branchName(s.branchId))}</p><small>${esc(s.start)} – ${esc(s.end)}${s.previousStart ? ' · Updated' : ''}</small></span></button>`).join('') || empty('No upcoming sessions', 'Add a club session to get started.')}</div></section></div>
      <div class="dashboard-bottom"><section class="panel">${panelHeading('Learners at a Glance', 'users', 'users')}<div class="recent-learners">${
        list
          .slice(0, 4)
          .map(
            (u) =>
              `<button class="learner-chip" data-action="view-user" data-id="${esc(u.id)}">${avatar(u.name)}<span><strong>${esc(u.name)}</strong><small>${esc(branchName(u.branchId).replace(' Club', ''))} · ${u.progress}%</small></span></button>`
          )
          .join('') || '<p class="subtle">No learners in this branch yet.</p>'
      }</div></section><section class="panel">${panelHeading('Completed Robotics', 'award', 'reports')}<div class="completion-list">${
        completed
          .slice(0, 2)
          .map(
            (u) =>
              `<div class="completion-row"><span class="round-icon tone-green">${icon('course')}</span><div><strong>${esc(u.name)}</strong><p>${esc(branchName(u.branchId))}</p></div>${pill('Complete', 'green')}</div>`
          )
          .join('') || '<p class="subtle">Completed learner courses will appear here.</p>'
      }</div></section></div>`;
  }
  function usersRows() {
    const list = state.users.filter(
      (u) =>
        (isMom
          ? u.role === 'learner' && u.branchId === actor.branchId
          : (scope === 'all' || u.branchId === scope) &&
            (userTab === 'all' || u.role === userTab)) &&
        matches(`${u.name} ${u.username} ${Auth.emailOf(u)} ${branchName(u.branchId)}`)
    );
    if (!list.length)
      return empty(
        isMom ? 'No learners found' : 'No matching accounts',
        isMom
          ? 'Add a learner to your club or try another search.'
          : 'Try another name, email, account type or branch.'
      );
    return (
      table(
        [
          'NAME',
          'ACCOUNT TYPE',
          'CONTACT EMAIL',
          'BRANCH',
          'ROBOTICS PROGRESS',
          'ACCESS',
          'ACTIONS',
        ],
        list
          .map(
            (u) =>
              `<tr><td><div class="person-cell">${avatar(u.name)}<div><strong>${esc(u.name)}</strong><small>@${esc(u.username)}</small></div></div></td><td>${pill(u.role === 'learner' ? 'Learner' : u.role === 'mompreneur' ? 'Mompreneur' : 'KIA Admin', u.role === 'mompreneur' ? 'purple' : '')}</td><td><div class="person-cell"><div><strong>${esc(Auth.emailOf(u))}</strong><small>${u.role === 'learner' ? 'Parent / guardian' : 'Account holder'}</small></div></div></td><td>${esc(u.role === 'admin' ? 'All branches' : u.branchId ? branchName(u.branchId) : 'Awaiting branch')}</td><td>${u.role === 'learner' ? progressBar(u.progress) : '<span class="subtle">—</span>'}</td><td>${pill(u.status !== 'active' ? 'Inactive' : u.accessStatus === 'pending' ? 'Setup pending' : 'Ready', u.status !== 'active' ? 'gray' : u.accessStatus === 'pending' ? 'amber' : 'green')}</td><td>${actionIcon(`View ${u.name}`, 'view-user', u.id, 'eye')}${u.role !== 'admin' ? actionIcon(`Edit ${u.name}`, 'edit-user', u.id) + actionIcon(`Invitation for ${u.name}`, 'invite-user', u.id, 'mail') : ''}</td></tr>`
          )
          .join('')
      ) +
      `<div class="table-footer">${list.length} profile${list.length === 1 ? '' : 's'} · ${esc(scope === 'all' ? 'All branches' : branchName(scope))}</div>`
    );
  }
  function usersView() {
    return (
      viewHeading(
        isMom ? 'My Learners' : 'Manage Users',
        isMom
          ? 'Create learner profiles and support the families in your club.'
          : 'Create Mompreneur and learner profiles across all KIA clubs.',
        button('Assign Course', 'assign-course', 'course', true) +
          button(isMom ? 'Add Learner' : 'Add Profile', 'add-user', 'users')
      ) +
      info(
        '<strong>One login. Personal invitations.</strong> Mompreneurs use their own email. Each learner has a separate username and password; invitations go to the parent or guardian. Learners do not enter personal details.',
        'mail'
      ) +
      `<section class="panel"><div class="list-toolbar">${search('Search name, username or email')}${
        isMom
          ? `<span class="subtle">${esc(branchName(scope))} · your club only</span>`
          : `<div class="tabs" aria-label="Account types">${[
              ['learner', 'Learners'],
              ['mompreneur', 'Mompreneurs'],
              ['all', 'All accounts'],
            ]
              .map(
                ([id, name]) =>
                  `<button data-user-tab="${id}" aria-pressed="${userTab === id}">${name}</button>`
              )
              .join('')}</div>`
      }</div><div id="results">${usersRows()}</div></section>`
    );
  }
  function branchesView() {
    return (
      viewHeading(
        'Club Branches',
        'Every branch represents one physical club, run by one Mompreneur.',
        button('Add Branch', 'add-branch', 'branch')
      ) +
      info(
        '<strong>Shared learning. Individual club schedules.</strong> All branches use the same course library; each Mompreneur organises her own sessions.'
      ) +
      `<div class="branch-grid">${visibleBranches()
        .map(
          (b) =>
            `<article class="panel branch-card"><div class="card-top"><span class="round-icon tone-blue">${icon('branch')}</span>${pill(b.status === 'active' ? 'Active club' : 'Paused', b.status === 'active' ? 'green' : 'gray')}</div><h2>${esc(b.name)}</h2><p class="subtle">${esc(b.location)}</p><div class="owner-row">${avatar(user(b.ownerId)?.name || '?')}<div><strong>${esc(user(b.ownerId)?.name || 'Unassigned')}</strong><small>Mompreneur · branch owner</small></div></div><div class="card-stats"><div><strong>${learners(b.id).length}</strong><span>Learners</span></div><div><strong>${average(learners(b.id))}%</strong><span>Average progress</span></div></div><div class="card-actions"><button class="button secondary small-button" data-action="branch-learners" data-id="${b.id}">${icon('users')}Learners</button><button class="button secondary small-button" data-action="branch-schedule" data-id="${b.id}">${icon('calendar')}Schedule</button>${actionIcon(`Manage ${b.name}`, 'edit-branch', b.id)}</div></article>`
        )
        .join('')}</div>`
    );
  }
  const allowedCourse = (c) => !!c && (!isMom || window.KIALearning.unlocked(actor, c.id, state));
  function coursesView() {
    if (isMom) return trainingView();
    if (currentCourse && course(currentCourse)) return courseEditor(course(currentCourse));
    return (
      viewHeading(
        'Shared Courses',
        'Create and manage one course library for every KIA branch.',
        button('Create Course', 'add-course', 'course')
      ) +
      info(
        '<strong>Robotics is the learner course at launch.</strong> Mompreneurs also receive Onboarding and Facilitation Training. New courses start as drafts.',
        'course'
      ) +
      `<div class="course-grid">${state.courses.map((c, i) => `<article class="panel course-card"><div class="card-top"><span class="round-icon tone-${['blue', 'green', 'purple'][i % 3]}">${icon(c.id === 'robotics' ? 'robot' : 'course')}</span>${pill(c.status === 'published' ? 'Published' : 'Draft', c.status === 'published' ? 'green' : 'amber')}</div><h2>${esc(c.title)}</h2><p class="subtle">${esc(c.description)}</p><div class="course-meta"><span>${icon('course')}${c.modules.length} modules</span><span>${icon('file')}${totalLessons(c)} lessons</span></div><p class="subtle">${c.audience === 'learners' ? 'Learners' : 'Mompreneurs'} · shared across all branches</p><div class="card-actions"><button class="button small-button" data-action="manage-course" data-id="${esc(c.id)}">Manage course ${icon('arrow')}</button>${actionIcon(`Edit ${c.title}`, 'edit-course', c.id)}</div></article>`).join('')}</div>`
    );
  }
  function courseEditor(c) {
    return (
      `<button class="text-link" data-action="back-courses">← All courses</button>` +
      viewHeading(
        esc(c.title),
        `${c.modules.length} modules · ${totalLessons(c)} lessons · shared content across all branches`,
        (c.id === 'robotics' ? lms.ruleButton() : '') +
          button('Edit Details', 'edit-course', 'edit', true, c.id) +
          button('Add Module', 'add-module', 'plus', false, c.id)
      ) +
      (c.id === 'robotics'
        ? `<div class="lms-rule-summary"><span><strong>Lesson order:</strong> ${c.lessonOrder === 'sequential' ? 'Complete each lesson to unlock the next' : 'Explore lessons in any order'}</span><span>Completion: all Robotics lessons</span></div>`
        : '') +
      `<div class="module-list">${c.modules.map((m, i) => `<details class="panel module-card" ${i === 0 ? 'open' : ''}><summary><span class="module-number">${String(i + 1).padStart(2, '0')}</span><div><strong>${esc(m.title)}</strong><small>${m.lessons.length} lessons</small></div>${icon('down')}</summary><div class="lesson-list">${m.lessons.map((l) => `<div class="lesson-item">${icon(l.type === 'Video' ? 'play' : 'file')}<div><strong>${esc(l.title)}</strong><small>${esc(l.type)} · ${esc(l.duration)} min</small></div><button class="text-link" data-action="edit-lesson" data-id="${esc(l.id)}" data-module="${esc(m.id)}">Edit ${icon('edit')}</button></div>`).join('')}${courseUI.moduleQuizRows(m)}<button class="button secondary small-button" data-action="add-lesson" data-id="${esc(m.id)}">${icon('plus')}Add Lesson</button></div></details>`).join('') || `<section class="panel">${empty('Start with a module', 'Organise this course into modules, then add lessons.', button('Add Module', 'add-module', 'plus', false, c.id))}</section>`}</div>`
    );
  }
  function trainingView() {
    return courseUI.trainingView(currentCourse);
  }
  function trainingLesson(id) {
    return courseUI.trainingLesson(currentCourse, id);
  }
  function contentRows() {
    const list = state.content.filter(
      (item) =>
        allowedCourse(course(item.courseId)) &&
        (contentCourse === 'all' || item.courseId === contentCourse) &&
        matches(`${item.title} ${item.type}`)
    );
    return list.length
      ? table(
          ['RESOURCE', 'SHARED COURSE', 'TYPE', 'ADDED', 'PREVIEW'],
          list
            .map(
              (item) =>
                `<tr><td><div class="person-cell"><span class="content-icon">${icon(item.type === 'Video' ? 'play' : 'file')}</span><div><strong>${esc(item.title)}</strong><small>${item.source === 'file' ? esc(item.filename) : 'View-only learning resource'}</small></div></div></td><td>${esc(course(item.courseId)?.title || 'Unassigned')}</td><td>${pill(item.type)}</td><td>${formatDate(item.createdAt)}</td><td>${actionIcon(`Preview ${item.title}`, 'view-content', item.id, 'eye')}</td></tr>`
            )
            .join('')
        )
      : empty('No matching resources', 'Add content or try another search.');
  }
  function contentView() {
    return (
      viewHeading(
        isMom ? 'My Resources' : 'Learning Content',
        isMom
          ? 'View the shared resources for your assigned courses.'
          : 'Manage videos, images, GIFs, text, PDFs and embedded activity links.',
        isMom ? '' : button('Upload Content', 'add-content', 'upload')
      ) +
      info(
        '<strong>One shared resource library.</strong> Course resources are presented to learners for viewing, with no learner download buttons.',
        'content'
      ) +
      `<section class="panel"><div class="list-toolbar">${search('Search resources')}<label class="sr-only" for="content-course">Filter by course</label><select id="content-course"><option value="all">All courses</option>${state.courses
        .filter(allowedCourse)
        .map(
          (c) =>
            `<option value="${esc(c.id)}" ${contentCourse === c.id ? 'selected' : ''}>${esc(c.title)}</option>`
        )
        .join('')}</select></div><div id="results">${contentRows()}</div></section>`
    );
  }
  function scheduleRows() {
    const list = sessions().filter((s) =>
      matches(`${s.title} ${branchName(s.branchId)} ${s.location}`)
    );
    return list.length
      ? table(
          ['SESSION', 'BRANCH', 'DATE', 'TIME (SAST)', 'LOCATION', 'ACTIONS'],
          list
            .map(
              (s) =>
                `<tr><td><strong>${esc(s.title)}</strong>${s.previousStart ? `<br/>${pill('Time updated', 'amber')}` : ''}</td><td>${esc(branchName(s.branchId))}</td><td>${formatDate(s.date)} ${s.date.slice(0, 4)}</td><td>${esc(s.start)} – ${esc(s.end)}</td><td>${esc(s.location)}</td><td>${actionIcon(`Edit ${s.title} on ${s.date}`, 'edit-session', s.id)}</td></tr>`
            )
            .join('')
        )
      : empty('No sessions found', 'Choose another branch or add a club session.');
  }
  function schedulesView() {
    return (
      viewHeading(
        isMom ? 'My Club Schedule' : 'Club Schedules',
        isMom
          ? 'Set class dates, times and updates for your own club.'
          : 'See sessions across branches and manage class dates, times and changes.',
        button('Add Session', 'add-session', 'calendar')
      ) +
      info(
        '<strong>Each club follows its own schedule.</strong> Mompreneurs manage their branch sessions. KIA Admin can oversee and update all branches.',
        'calendar'
      ) +
      `<section class="panel"><div class="list-toolbar">${search('Search sessions or clubs')}<span class="subtle">South Africa time · SAST</span></div><div id="results">${scheduleRows()}</div></section>`
    );
  }
  function branchReportsView() {
    const list = learners();
    return (
      viewHeading(
        isMom ? 'Learner Progress' : 'Reports & Progress',
        isMom
          ? 'Review completed and outstanding learning in your own club.'
          : 'Compare club performance and review completed and outstanding learning.',
        button('Export Report', 'export-report', 'download', true)
      ) +
      `<div class="report-metrics">${stat('Total Learners', list.length, 'In selected branches', 'users', 'blue')}${stat('Average Progress', average(list) + '%', 'Robotics course', 'report', 'purple')}${stat('Robotics Completed', list.filter((u) => u.progress === 100).length, 'Learners at 100%', 'check', 'green')}${stat('Still Learning', list.filter((u) => u.progress < 100).length, 'Outstanding lessons', 'course', 'amber')}</div><section class="panel">${panelHeading('Branch Performance', 'branch')}${table(
        ['BRANCH', 'MOMPRENEUR', 'LEARNERS', 'COMPLETED ROBOTICS', 'AVERAGE PROGRESS', 'DETAILS'],
        visibleBranches()
          .map(
            (b) =>
              `<tr><td><strong>${esc(b.name)}</strong></td><td>${esc(user(b.ownerId)?.name || 'Unassigned')}</td><td>${learners(b.id).length}</td><td>${learners(b.id).filter((u) => u.progress === 100).length}</td><td>${progressBar(average(learners(b.id)))}</td><td><button class="text-link" data-action="branch-learners" data-id="${b.id}">View learners ${icon('arrow')}</button></td></tr>`
          )
          .join('')
      )}</section>`
    );
  }
  function certificatesView() {
    const list = state.certificates.filter(
      (c) => scope === 'all' || user(c.userId)?.branchId === scope
    );
    return (
      viewHeading(
        'Certificates',
        'Manage completion certificates when KIA is ready to enable them.',
        state.settings.certificatesEnabled
          ? button('Issue Certificate', 'issue-certificate', 'award')
          : '<a class="button secondary" href="#settings">Manage settings</a>'
      ) +
      (!state.settings.certificatesEnabled
        ? info(
            '<strong>Optional for launch.</strong> Certificates are currently switched off. Course progress and completion tracking remain available.',
            'award',
            'amber'
          )
        : info(
            '<strong>Completion-based certificates.</strong> Issue a certificate only after a learner has completed the Robotics course.',
            'award'
          )) +
      `<section class="panel">${list.length ? table(['LEARNER', 'COURSE', 'ISSUED', 'STATUS', 'ACTIONS'], list.map((c) => `<tr><td><strong>${esc(user(c.userId)?.name)}</strong></td><td>Robotics</td><td>${formatDate(c.date)}</td><td>${pill(c.status === 'issued' ? 'Issued' : 'Revoked', c.status === 'issued' ? 'green' : 'gray')}</td><td>${actionIcon('View certificate', 'view-certificate', c.id, 'eye')}${c.status === 'issued' ? `<button class="text-link" data-action="revoke-certificate" data-id="${esc(c.id)}">Revoke</button>` : ''}</td></tr>`).join('')) : empty('No certificates issued', state.settings.certificatesEnabled ? 'Completed learners are eligible for a certificate.' : 'Certificate management is ready for a later rollout.')}</section>`
    );
  }
  function settingsView() {
    return (
      viewHeading(
        'Platform Settings',
        'Manage the KIA platform’s launch options and account responsibilities.'
      ) +
      `<div class="settings-grid"><section class="panel settings-card"><h2>Launch options</h2><p>Keep the first release focused on learning and club support.</p><label class="setting-line"><span><strong>Enable certificates</strong><small>Allow certificates for completed Robotics learners.</small></span><input id="certificate-switch" class="switch" type="checkbox" ${state.settings.certificatesEnabled ? 'checked' : ''}/></label><div class="setting-line"><span><strong>Learner course</strong><small>Robotics is assigned when a learner is added.</small></span>${pill('Robotics', 'green')}</div><div class="setting-line"><span><strong>Shared login</strong><small>Account credentials determine the portal.</small></span>${pill('Enabled')}</div></section><section class="panel settings-card"><h2>Account responsibilities</h2><p>One KIA administrator oversees all branches.</p><div class="setting-line"><span><strong>KIA Admin</strong><small>All branches, accounts, courses, schedules and reports.</small></span>${icon('shield')}</div><div class="setting-line"><span><strong>Mompreneur</strong><small>Her own club’s learners, course assignments and schedule.</small></span>${icon('branch')}</div><div class="setting-line"><span><strong>Learner</strong><small>Assigned learning, personal progress and club sessions.</small></span>${icon('course')}</div></section><section class="panel settings-card"><h2>Preview data</h2><p>This frontend design uses sample accounts. Account records stay in this tab; uploaded media can be cleared with Reset Demo Data; real authentication and permissions require the backend.</p>${button('Reset Demo Data', 'reset-demo', 'settings', true)}</section></div>`
    );
  }
  function render() {
    if (isMom) scope = actor.branchId;
    else if (scope !== 'all' && !branch(scope)) scope = 'all';
    scopeOptions();
    const active = route();
    if (isMom) mom.updateChrome();
    const label = nav.find((n) => n[0] === active)[1];
    $('#current-page-label').textContent = label;
    document.title = `${label} | KIA ${isMom ? 'Mompreneur' : 'Admin'}`;
    $$('[data-nav]').forEach((a) => {
      if (a.dataset.nav === active) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (isMom && !branch(scope)) {
      $('#admin-view').innerHTML =
        viewHeading(
          'Your club is being prepared',
          'Your account is ready. KIA Admin will link your profile to your club before you can add learners.'
        ) + info('Contact KIA if you need help with your branch assignment.', 'branch');
      return;
    }
    $('#admin-view').innerHTML = {
      dashboard: isMom ? mom.dashboard : dashboard,
      users: isMom ? mom.membersView : usersView,
      invitations: invitationsView,
      branches: branchesView,
      courses: coursesView,
      content: contentView,
      schedules: isMom ? mom.scheduleView : schedulesView,
      progress: isMom ? mom.progressView : lms.reportsView,
      notifications: isMom ? mom.notificationsView : lms.announcementsView,
      groups: lms.groupsView,
      announcements: lms.announcementsView,
      reports: lms.reportsView,
      certificates: certificatesView,
      settings: isMom ? mom.settingsView : settingsView,
    }[active]();
  }

  const dialog = $('#admin-dialog');
  function clearMedia() {
    window.KIAPlayer.dispose($('#dialog-body'));
  }
  function closeDialog() {
    dialog.close();
    clearMedia();
  }
  function openDialog(title, body, kicker = isMom ? 'MY CLUB' : 'KIA ADMIN') {
    clearMedia();
    $('#dialog-title').textContent = title;
    $('#dialog-kicker').textContent = kicker;
    $('#dialog-body').innerHTML = body;
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
  }
  const input = (name, label, value = '', type = 'text', attrs = 'required maxlength="80"') =>
    `<label class="field"><span>${label}</span><input name="${name}" type="${type}" value="${esc(value)}" ${attrs}/></label>`;
  const select = (name, label, options, value = '', attrs = 'required') =>
    `<label class="field"><span>${label}</span><select name="${name}" ${attrs}>${options.map(([id, text]) => `<option value="${esc(id)}" ${id === value ? 'selected' : ''}>${esc(text)}</option>`).join('')}</select></label>`;
  const textarea = (name, label, value = '', attrs = '') =>
    `<label class="field full"><span>${label}</span><textarea name="${name}" maxlength="12000" ${attrs}>${esc(value)}</textarea></label>`;
  const branchChoices = () => state.branches.map((b) => [b.id, b.name]);
  function form(title, fields, handler, submit = 'Save Changes') {
    openDialog(
      title,
      `<form id="edit-form" novalidate><div class="form-grid">${fields}</div><p class="form-note">Preview only · use fictional details. Account records stay in this tab.${/Account|Branch/.test(title) ? ' This does not create live login credentials.' : ''}</p><p class="form-error" id="form-error" role="alert"></p><div class="form-actions"><button type="button" class="button secondary" data-close-dialog>Cancel</button><button type="submit" class="button">${submit}</button></div></form>`
    );
    const element = $('#edit-form');
    element.onsubmit = async (event) => {
      event.preventDefault();
      if (!Auth.checkPage()) {
        location.replace('login.html');
        return;
      }
      if (!element.reportValidity()) return;
      const submitButton = element.querySelector('[type="submit"]');
      if (submitButton.disabled) return;
      submitButton.disabled = true;
      $('#form-error').textContent = '';
      try {
        const result = await handler(Object.fromEntries(new FormData(element)), element);
        if (result?.loggedOut) {
          location.replace('login.html');
          return;
        }
        if (!Auth.checkPage()) {
          location.replace('login.html');
          return;
        }
        closeDialog();
        persist(
          (typeof result === 'object' ? result.message : result) || 'Changes saved to the preview.'
        );
        if (result?.inviteId) invitationPreview(result.inviteId);
      } catch (error) {
        $('#form-error').textContent = error.message || 'Unable to save. Please check the details.';
        submitButton.disabled = false;
      }
    };
    return element;
  }
  const validName = (value, label = 'Name') =>
    window.KIASecurity.text(
      value,
      label,
      ['Description', 'Resource text'].includes(label) ? 12000 : 120
    );
  function userForm(id, preferredRole = 'learner') {
    const existing = user(id);
    if (existing && !Auth.canManage(actor, existing)) {
      toast('This profile is outside your club.');
      return;
    }
    if (existing?.role === 'admin') return viewUser(id);
    const record = existing || {
      name: '',
      username: '',
      role: isMom ? 'learner' : preferredRole,
      branchId: isMom
        ? actor.branchId
        : preferredRole === 'mompreneur'
          ? ''
          : scope === 'all'
            ? state.branches[0]?.id
            : scope,
      status: 'active',
      birthDate: '',
      gender: '',
      homeAddress: '',
      email: '',
      phone: '',
      guardian: {},
    };
    const roleField = isMom
      ? '<input type="hidden" name="role" value="learner"/>'
      : select(
          'role',
          'Account type',
          [
            ['learner', 'Learner'],
            ['mompreneur', 'Mompreneur'],
          ],
          record.role,
          existing ? 'disabled' : 'required'
        );
    const clubField = isMom
      ? `<label class="field"><span>Club branch</span><span class="readonly-branch">${esc(branchName(actor.branchId))}</span></label>`
      : select(
          'branchId',
          'Club branch',
          [['', 'Assign branch later (Mompreneur only)'], ...branchChoices()],
          record.branchId || '',
          ''
        );
    const fields =
      roleField +
      clubField +
      '<h3 class="profile-section-heading">Profile details</h3>' +
      input('name', 'Full name', record.name) +
      input(
        'username',
        'Username',
        record.username,
        'text',
        'required minlength="3" maxlength="40" autocapitalize="none" spellcheck="false"'
      ) +
      input(
        'birthDate',
        'Date of birth',
        record.birthDate || '',
        'date',
        `required max="${new Date(Date.now() - 86400000).toISOString().slice(0, 10)}"`
      ) +
      select(
        'gender',
        'Gender',
        [
          ['', 'Choose an option'],
          ...['Female', 'Male', 'Other', 'Prefer not to say'].map((g) => [g, g]),
        ],
        record.gender || ''
      ) +
      textarea('homeAddress', 'Home address', record.homeAddress || '', 'required') +
      `<div class="field-section" id="guardian-fields"><h3 class="profile-section-heading">Parent / guardian contact</h3>${input('guardianName', 'Parent / guardian full name', record.guardian?.name || '')}${input('guardianEmail', 'Parent / guardian email', record.guardian?.email || '', 'email', 'required maxlength="254" autocapitalize="none"')}${input('guardianPhone', 'Parent / guardian cellphone', record.guardian?.phone || '', 'tel', 'required maxlength="24"')}<p class="field full subtle">The invitation goes to the guardian. Each learner has their own username and password; siblings can share this contact email.</p></div><div class="field-section" id="mom-contact-fields"><h3 class="profile-section-heading">Mompreneur contact</h3>${input('email', 'Email address', record.email || '', 'email', 'required maxlength="254" autocapitalize="none"')}${input('phone', 'Cellphone number', record.phone || '', 'tel', 'required maxlength="24"')}<p class="field full subtle">The Mompreneur will use her own email and choose a password from her invitation.</p></div>` +
      select(
        'status',
        'Profile status',
        [
          ['active', 'Active'],
          ['inactive', 'Inactive'],
        ],
        record.status
      );
    const element = form(
      existing ? 'Edit Profile' : isMom ? 'Add Learner Profile' : 'Create User Profile',
      fields,
      (data) => {
        const role = isMom ? 'learner' : existing?.role || data.role;
        const branchId = isMom ? actor.branchId : data.branchId || null;
        if (!['learner', 'mompreneur'].includes(role))
          throw new Error('Choose a learner or Mompreneur profile.');
        if (existing && !Auth.canManage(Auth.current(), existing))
          throw new Error('This profile is outside your club access.');
        const nextBranch = branch(branchId);
        if (role === 'mompreneur' && nextBranch?.ownerId && nextBranch.ownerId !== existing?.id)
          throw new Error(
            'This branch already has a Mompreneur. Create the profile without a branch, then update the owner under Branches.'
          );
        if (role === 'mompreneur' && existing?.branchId && existing.branchId !== branchId)
          throw new Error(
            'Change the branch owner under Branches so the club keeps one Mompreneur.'
          );
        const previousEmail = existing ? Auth.emailOf(existing) : null;
        const next = {
          ...(existing || {}),
          id: existing?.id || Store.id('user'),
          name: validName(data.name),
          username: data.username.trim().toLowerCase(),
          role,
          branchId,
          status: data.status,
          birthDate: data.birthDate,
          gender: data.gender,
          homeAddress: data.homeAddress.trim(),
          progress: existing?.progress || 0,
          accessStatus: existing?.accessStatus || 'pending',
          courseIds:
            existing?.courseIds ||
            (role === 'learner' ? ['robotics'] : ['onboarding', 'facilitation', 'robotics']),
          createdAt: existing?.createdAt || new Date().toISOString(),
        };
        if (role === 'learner') {
          next.guardian = {
            name: data.guardianName.trim(),
            email: Auth.normalize(data.guardianEmail),
            phone: data.guardianPhone.trim(),
          };
          delete next.email;
          delete next.phone;
        } else {
          next.email = Auth.normalize(data.email);
          next.phone = data.phone.trim();
          delete next.guardian;
        }
        Auth.validateProfile(state, next, existing?.id);
        if (!Auth.canManage(Auth.current(), next))
          throw new Error('You can create and manage learners only in your own branch.');
        if (previousEmail && previousEmail !== Auth.emailOf(next)) {
          next.accessStatus = 'pending';
          state.invitations
            .filter((i) => i.userId === next.id && i.status === 'pending')
            .forEach((i) => {
              i.status = 'cancelled';
            });
        }
        if (existing) Object.assign(existing, next);
        else state.users.unshift(next);
        if (role === 'mompreneur' && nextBranch) nextBranch.ownerId = next.id;
        const savedUser = existing || next;
        let invitation;
        if (
          savedUser.status === 'active' &&
          (!existing || previousEmail !== Auth.emailOf(savedUser))
        )
          invitation = Auth.invite(
            state,
            savedUser,
            Auth.current(),
            !!previousEmail && previousEmail !== Auth.emailOf(savedUser)
          );
        log(
          existing ? 'Profile updated' : 'Profile created',
          `${next.name} · ${nextBranch?.name || 'Awaiting branch'}`,
          'users',
          branchId,
          'users'
        );
        return {
          message: invitation
            ? 'Profile saved. The invitation preview is ready; no email was sent.'
            : 'Profile details updated.',
          inviteId: invitation?.id,
        };
      },
      existing ? 'Save Profile' : 'Create Profile & Preview Invite'
    );
    const toggleRole = () => {
      const role = isMom ? 'learner' : existing?.role || element.elements.role.value;
      [
        ['guardian-fields', role === 'learner'],
        ['mom-contact-fields', role === 'mompreneur'],
      ].forEach(([id, active]) => {
        const section = document.getElementById(id);
        section.hidden = !active;
        section.querySelectorAll('input').forEach((input) => {
          input.disabled = !active;
        });
      });
    };
    if (!isMom && !existing)
      element.elements.role.addEventListener('change', () => {
        if (element.elements.role.value === 'mompreneur') element.elements.branchId.value = '';
        toggleRole();
      });
    toggleRole();
  }
  function viewUser(id) {
    const u = user(id);
    if (!u || !Auth.canManage(actor, u)) {
      toast('This profile is outside your club access.');
      return;
    }
    const learningDetails = courseUI.lessonReport(u);
    const pair = (title, value, full = false) =>
      `<div class="${full ? 'full' : ''}"><dt>${title}</dt><dd>${esc(value || 'Not provided')}</dd></div>`;
    const details =
      pair('Username', u.username) +
      pair(
        'Club branch',
        u.role === 'admin'
          ? 'All KIA branches'
          : u.branchId
            ? branchName(u.branchId)
            : 'Awaiting branch'
      ) +
      (u.role !== 'admin'
        ? pair('Date of birth', u.birthDate) +
          pair('Gender', u.gender) +
          pair('Home address', u.homeAddress, true)
        : '') +
      (u.role === 'learner'
        ? pair('Parent / guardian full name', u.guardian?.name) +
          pair('Parent / guardian cellphone', u.guardian?.phone) +
          pair('Parent / guardian contact email', u.guardian?.email, true)
        : pair('Login email', u.email) +
          (u.role === 'mompreneur' ? pair('Cellphone', u.phone) : ''));
    openDialog(
      u.name,
      `<div class="detail-summary">${avatar(u.name)}<div><h3>${esc(u.name)}</h3><p>${u.role === 'learner' ? 'Learner profile' : u.role === 'mompreneur' ? 'Mompreneur profile' : 'KIA Admin'} · ${u.accessStatus === 'pending' ? 'Password setup pending' : 'Ready to log in'}</p></div></div><dl class="profile-details">${details}</dl><h3 class="detail-section-title">Assigned courses</h3><p class="subtle">${u.courseIds.map((id) => esc(course(id)?.title || id)).join(', ') || 'Platform administration'}</p>${u.role !== 'admin' ? `<h3 class="detail-section-title">Completed & outstanding lessons</h3>${learningDetails}` : ''}<div class="form-actions">${u.role !== 'admin' ? button('Edit Profile', 'edit-user', 'edit', true, u.id) + button('Invitation Preview', 'invite-user', 'mail', false, u.id) : '<button class="button" data-close-dialog>Done</button>'}</div>`,
      'PROFILE OVERVIEW'
    );
  }
  function branchForm(id) {
    if (isMom) return;
    const existing = branch(id),
      record = existing || { name: '', location: '', ownerId: '', status: 'active' };
    const owners = state.users.filter(
      (u) => u.role === 'mompreneur' && (!u.branchId || u.id === record.ownerId)
    );
    if (!owners.length) {
      openDialog(
        'Create a Mompreneur First',
        info(
          'Create the Mompreneur’s profile and invitation, then link her to a new club branch. Each club has one owner.',
          'branch'
        ) + button('Create Mompreneur', 'add-mompreneur', 'users')
      );
      return;
    }
    form(
      existing ? 'Manage Branch' : 'Add Club Branch',
      input('name', 'Club name', record.name) +
        input('location', 'Physical club location / area', record.location) +
        select(
          'ownerId',
          'Mompreneur (one per branch)',
          owners.map((u) => [u.id, `${u.name} · ${u.email}`]),
          record.ownerId || owners[0].id
        ) +
        select(
          'status',
          'Club status',
          [
            ['active', 'Active'],
            ['paused', 'Paused'],
          ],
          record.status
        ),
      (data) => {
        const name = validName(data.name, 'Club name'),
          location = validName(data.location, 'Club location'),
          owner = user(data.ownerId);
        if (state.branches.some((b) => b.id !== id && b.name.toLowerCase() === name.toLowerCase()))
          throw new Error('A branch with this name already exists.');
        if (!owner || owner.role !== 'mompreneur' || (owner.branchId && owner.branchId !== id))
          throw new Error('Choose a Mompreneur who is not assigned to another club.');
        const branchId = existing?.id || Store.id('club'),
          oldOwner = existing && user(existing.ownerId);
        if (oldOwner && oldOwner.id !== owner.id) oldOwner.branchId = null;
        owner.branchId = branchId;
        const next = { id: branchId, name, location, ownerId: owner.id, status: data.status };
        if (existing) Object.assign(existing, next);
        else state.branches.push(next);
        log(
          existing ? 'Branch updated' : 'Club branch created',
          `${name} · ${owner.name}`,
          'branch',
          branchId,
          'branches'
        );
        return 'Branch and Mompreneur assignment saved.';
      },
      existing ? 'Save Branch' : 'Create Branch'
    );
  }
  function invitationPreview(id) {
    const invite = state.invitations.find((i) => i.id === id),
      u = invite && user(invite.userId);
    if (!u || !Auth.canManage(actor, u)) {
      toast('This invitation is outside your club access.');
      return;
    }
    const ready = invite.kind === 'profile-added' || invite.status === 'accepted';
    const replaced =
      invite.email !== Auth.emailOf(u) ||
      invite.status === 'cancelled' ||
      (invite.status === 'pending' && Date.parse(invite.expiresAt) <= Date.now());
    const name = u.role === 'learner' ? u.guardian.name : u.name;
    const subject =
      u.role === 'learner'
        ? `KIA learner profile created for ${u.name}`
        : 'Your KIA Mompreneur profile is ready';
    const url = ready
      ? 'login.html'
      : `set-password.html#invite=${encodeURIComponent(invite.token)}`;
    openDialog(
      'Invitation Email Preview',
      info(
        '<strong>Preview only — no email sent.</strong> Live invitation emails and account activation will be connected through the backend.',
        'mail',
        'amber'
      ) +
        `<div class="invite-mail"><div class="invite-mail-meta"><strong>To:</strong> ${esc(invite.email)}<br/><strong>Subject:</strong> ${esc(subject)}</div><div class="invite-mail-content"><p class="eyebrow">KIDS INNOVATE AFRICA</p><h3>Welcome to your KIA community.</h3><p>Hi ${esc(name)},</p><p>${u.role === 'learner' ? `A learner profile has been created for <strong>${esc(u.name)}</strong>${u.branchId ? ` at ${esc(branchName(u.branchId))}` : ''}. As their parent or guardian, you can set up access and view their learning and progress.` : `KIA has created your Mompreneur profile${u.branchId ? ` for ${esc(branchName(u.branchId))}` : ''}. Once your club is assigned, you can manage its learners and schedule.`}</p>${u.role === 'learner' ? `<p><strong>Login username: ${esc(u.username)}</strong></p>` : ''}<p>${ready ? 'This profile already has a password. Use its own login details on the shared login page.' : 'Create a password for this profile using the button below. Each learner has a separate password, even when siblings share a guardian’s email.'}</p>${replaced ? '<p>This invitation has expired or been replaced. Create a new preview below.</p>' : `<a class="button" href="${url}">${ready ? 'Go to Login' : 'Create My Password'} ${icon('arrow')}</a>`}<p class="invite-expiry">${ready ? 'Login: ' + esc(u.role === 'learner' ? u.username : invite.email) : 'Password setup link valid until ' + esc(new Date(invite.expiresAt).toLocaleDateString('en-GB')) + '. It can only be used once.'}</p><p>Kind regards,<br/>The KIA Team</p></div></div><div class="form-actions"><button class="button secondary" data-close-dialog>Close Preview</button>${button('Create New Invitation', 'resend-invite', 'mail', false, u.id)}</div>`,
      'ACCOUNT INVITATION'
    );
  }
  function inviteUser(id, reissue = false) {
    const u = user(id);
    if (!u || u.role === 'admin' || !Auth.canManage(actor, u)) {
      toast('You cannot invite this account.');
      return;
    }
    if (u.status !== 'active') {
      toast('Activate this profile before creating an invitation.');
      return;
    }
    let invitation =
      !reissue &&
      state.invitations.find(
        (i) => i.userId === id && i.status !== 'cancelled' && i.email === Auth.emailOf(u)
      );
    if (!invitation) {
      invitation = Auth.invite(state, u, Auth.current());
      log(
        'Invitation preview created',
        `${u.name} · ${invitation.email}`,
        'mail',
        u.branchId,
        'invitations'
      );
      persist('Invitation preview ready. No email was sent.');
    }
    invitationPreview(invitation.id);
  }
  function invitationsView() {
    const list = state.invitations.filter((i) => {
      const u = user(i.userId);
      return u && Auth.canManage(actor, u) && (scope === 'all' || u.branchId === scope);
    });
    return (
      viewHeading(
        'Account Invitations',
        'Review password setup for Mompreneurs and parents or guardians.'
      ) +
      info(
        '<strong>Invitation previews only.</strong> This design build does not send email. Pending profiles become ready after the recipient completes the password setup preview.',
        'mail',
        'amber'
      ) +
      `<section class="panel">${
        list.length
          ? table(
              ['PROFILE', 'RECIPIENT EMAIL', 'PASSWORD SETUP', 'DELIVERY', 'ACTION'],
              list
                .map((i) => {
                  const u = user(i.userId);
                  const status =
                    i.status === 'pending' && Date.parse(i.expiresAt) <= Date.now()
                      ? 'Expired'
                      : {
                          pending: 'Setup pending',
                          accepted: 'Completed',
                          ready: 'Existing password',
                          cancelled: 'Replaced',
                        }[i.status] || i.status;
                  return `<tr><td><strong>${esc(u.name)}</strong><br/><span class="subtle">${esc(u.branchId ? branchName(u.branchId) : 'Awaiting branch')}</span></td><td>${esc(i.email)}</td><td>${pill(status, ['accepted', 'ready'].includes(i.status) ? 'green' : 'amber')}</td><td>${pill('Preview only', 'gray')}</td><td>${actionIcon('View invitation', 'view-invite', i.id, 'mail')}</td></tr>`;
                })
                .join('')
            )
          : empty(
              'No invitations yet',
              'Create a profile to prepare an invitation for its email address.'
            )
      }</section>`
    );
  }
  function courseForm(id) {
    const existing = course(id),
      c = existing || { title: '', description: '', audience: 'learners', status: 'draft' };
    form(
      existing ? 'Edit Course Details' : 'Create Shared Course',
      input('title', 'Course title', c.title) +
        select(
          'audience',
          'Course audience',
          [
            ['learners', 'Learners'],
            ['mompreneurs', 'Mompreneurs'],
          ],
          c.audience
        ) +
        textarea('description', 'Description', c.description, 'required') +
        select(
          'status',
          'Publishing status',
          [
            ['draft', 'Draft'],
            ['published', 'Published'],
          ],
          c.status
        ),
      (data) => {
        const title = validName(data.title, 'Course title');
        if (
          state.courses.some(
            (item) => item.id !== id && item.title.toLowerCase() === title.toLowerCase()
          )
        )
          throw new Error('A course with this title already exists.');
        if (id === 'robotics' && (data.audience !== 'learners' || data.status !== 'published'))
          throw new Error('Keep the launch Robotics course published for learners.');
        const next = {
          lessonOrder: existing?.lessonOrder || 'free',
          id: id || Store.id('course'),
          title,
          description: validName(data.description, 'Description'),
          audience: data.audience,
          status: data.status,
          modules: existing?.modules || [],
        };
        if (existing) Object.assign(existing, next);
        else state.courses.push(next);
        log(
          existing ? 'Course updated' : 'Shared course created',
          title,
          'course',
          null,
          'courses'
        );
        return existing
          ? 'Shared course details updated.'
          : 'Shared course created. Add modules and lessons next.';
      },
      existing ? 'Save Course' : 'Create Course'
    );
  }
  function moduleForm(courseId) {
    const c = course(courseId);
    if (!c) return;
    form(
      'Add Module',
      input('title', 'Module title'),
      (data) => {
        const title = validName(data.title, 'Module title');
        c.modules.push({ id: Store.id('module'), title, lessons: [] });
        log('Module added', `${title} · ${c.title}`, 'course', null, 'courses');
        return 'Module added to the shared course.';
      },
      'Add Module'
    );
  }
  function lessonForm(moduleId, lessonId) {
    return courseUI.lessonForm(moduleId, lessonId);
  }
  function assignmentForm() {
    const people = learners().filter((u) => u.status === 'active'),
      courses = state.courses.filter((c) => c.audience === 'learners' && c.status === 'published');
    if (!people.length || !courses.length) {
      openDialog(
        'Assign Course',
        empty(
          'No eligible learners or courses',
          'Add an active learner and publish a learner course first.'
        )
      );
      return;
    }
    form(
      'Assign Course to Learner',
      select(
        'userId',
        'Learner',
        people.map((u) => [u.id, `${u.name} · ${branchName(u.branchId)}`]),
        people[0].id
      ) +
        select(
          'courseId',
          'Shared course',
          courses.map((c) => [c.id, c.title]),
          courses[0].id
        ),
      (data) => {
        const u = user(data.userId),
          c = course(data.courseId);
        if (
          !u ||
          !c ||
          !Auth.canManage(Auth.current(), u) ||
          u.status !== 'active' ||
          u.role !== 'learner' ||
          c.audience !== 'learners' ||
          c.status !== 'published'
        )
          throw new Error('Choose an active learner and published learner course.');
        if (u.courseIds.includes(c.id))
          throw new Error(`${u.name} is already assigned to ${c.title}.`);
        u.courseIds.push(c.id);
        log('Course assigned', `${c.title} · ${u.name}`, 'course', u.branchId, 'users');
        return `${c.title} assigned to ${u.name}.`;
      },
      'Assign Course'
    );
  }
  const validateLink = (value) => window.KIASecurity.mediaURL(value);
  function contentForm() {
    const element = form(
      'Add Learning Content',
      input('title', 'Resource title') +
        select(
          'courseId',
          'Shared course',
          state.courses.map((c) => [c.id, c.title]),
          'robotics'
        ) +
        select(
          'type',
          'Resource type',
          ['Video', 'Image', 'GIF', 'Text', 'PDF', 'Embedded'].map((t) => [t, t]),
          'Video'
        ) +
        select(
          'source',
          'Content source',
          [
            ['file', 'Upload a file'],
            ['url', 'Link to content'],
            ['text', 'Write text'],
          ],
          'file'
        ) +
        `<div class="field full" data-source-field="file"><label for="resource-file">Choose file</label><input id="resource-file" name="file" type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,application/pdf,text/plain" required/><small>Up to 25 MB per preview file. Stored only in this browser.</small></div><div class="field full" data-source-field="url">${input('url', 'Resource link', '', 'url', 'required maxlength="2000"')}</div><div class="field full" data-source-field="text">${textarea('body', 'Resource text', '', 'required')}</div>`,
      async (data, element) => {
        const title = validName(data.title, 'Resource title'),
          resource = {
            id: Store.id('content'),
            title,
            type: data.type,
            courseId: data.courseId,
            source: data.source,
            createdAt: new Date().toISOString(),
          };
        if (!course(resource.courseId)) throw new Error('Choose a shared course.');
        if (data.source === 'file') {
          const file = element.elements.file.files[0];
          if (!file || !file.size) throw new Error('Choose a non-empty file.');
          if (file.size > 25 * 1024 * 1024)
            throw new Error('Please choose a file smaller than 25 MB for the preview.');
          const allowed = {
            Video: ['video/mp4', 'video/webm'],
            Image: ['image/png', 'image/jpeg', 'image/webp'],
            GIF: ['image/gif'],
            Text: ['text/plain'],
            PDF: ['application/pdf'],
          };
          if (!allowed[data.type]?.includes(file.type))
            throw new Error(
              'The file does not match the selected resource type. Choose the correct type or use a link.'
            );
          await window.KIASecurity.validateFile(file, data.type);
          await Store.putFile(resource.id, file);
          Object.assign(resource, { filename: file.name, mime: file.type, size: file.size });
        } else if (data.source === 'url') resource.url = validateLink(data.url);
        else {
          resource.body = validName(data.body, 'Resource text');
          resource.type = 'Text';
        }
        state.content.unshift(resource);
        log(
          'Learning content added',
          `${title} · ${course(resource.courseId).title}`,
          'content',
          null,
          'content'
        );
        return 'Content added to the shared preview library.';
      },
      'Save Content'
    );
    const toggle = () => {
      $$('[data-source-field]').forEach((container) => {
        const active = container.dataset.sourceField === element.elements.source.value;
        container.hidden = !active;
        container.querySelectorAll('input,textarea').forEach((el) => {
          el.disabled = !active;
        });
      });
      if (element.elements.source.value === 'text') element.elements.type.value = 'Text';
    };
    element.elements.source.addEventListener('change', toggle);
    toggle();
  }
  async function viewContent(id) {
    const item = state.content.find((c) => c.id === id);
    if (!item || !allowedCourse(course(item.courseId))) return;
    openDialog(item.title, '<div id="admin-resource-player"></div>', 'CONTENT PREVIEW');
    await window.KIAPlayer.resource($('#admin-resource-player'), item);
  }
  function sessionForm(id, selectedDate) {
    const existing = state.sessions.find((s) => s.id === id),
      tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    if (isMom && ((existing && existing.branchId !== actor.branchId) || !branch(actor.branchId))) {
      toast('This session is outside your club.');
      return;
    }
    const s = existing || {
      title: 'Robotics class',
      branchId: scope === 'all' ? state.branches[0]?.id : scope,
      date: window.KIASecurity.isDate(selectedDate) ? selectedDate : tomorrow,
      start: '15:00',
      end: '16:30',
      location: scope === 'all' ? state.branches[0]?.name : branchName(scope),
      note: '',
    };
    form(
      existing ? 'Manage Club Session' : 'Add Club Session',
      input('title', 'Session title', s.title) +
        (isMom
          ? `<label class="field"><span>Club branch</span><span class="readonly-branch">${esc(branchName(actor.branchId))}</span></label>`
          : select('branchId', 'Club branch', branchChoices(), s.branchId)) +
        input('date', 'Session date', s.date, 'date', 'required') +
        input('location', 'Physical location', s.location) +
        input('start', 'Start time (SAST)', s.start, 'time', 'required') +
        input('end', 'End time (SAST)', s.end, 'time', 'required') +
        textarea('note', 'Class note / change announcement', s.note || '') +
        (s.previousStart
          ? `<p class="form-note field full">Previous time: ${esc(s.previousStart)} – ${esc(s.previousEnd)}</p>`
          : ''),
      (data) => {
        if (isMom) data.branchId = actor.branchId;
        if (!branch(data.branchId)) throw new Error('Choose a club branch.');
        if (
          !window.KIASecurity.isDate(data.date) ||
          !window.KIASecurity.isTime(data.start) ||
          !window.KIASecurity.isTime(data.end)
        )
          throw new Error('Choose a valid date and class times.');
        if (data.end <= data.start)
          throw new Error('The end time must be later than the start time.');
        const next = {
          id: existing?.id || Store.id('session'),
          title: validName(data.title, 'Session title'),
          branchId: data.branchId,
          date: data.date,
          start: data.start,
          end: data.end,
          location: validName(data.location, 'Location'),
          note: data.note.trim(),
          previousStart: existing?.previousStart || null,
          previousEnd: existing?.previousEnd || null,
          previousDate: existing?.previousDate || null,
          updatedAt: new Date().toISOString(),
        };
        if (existing && existing.date !== data.date) next.previousDate = existing.date;
        if (existing && (existing.start !== data.start || existing.end !== data.end)) {
          next.previousStart = existing.start;
          next.previousEnd = existing.end;
        }
        if (existing) Object.assign(existing, next);
        else state.sessions.push(next);
        log(
          existing ? 'Club session updated' : 'Club session added',
          `${branchName(next.branchId)} · ${formatDate(next.date)}, ${next.start}`,
          'calendar',
          next.branchId,
          'schedules'
        );
        return existing
          ? 'Club session updated in the preview.'
          : 'Club session added to the preview.';
      },
      existing ? 'Save Session' : 'Add Session'
    );
  }
  function issueCertificate() {
    if (!state.settings.certificatesEnabled) {
      toast('Enable certificates in Settings first.');
      return;
    }
    const eligible = learners().filter(
      (u) =>
        u.progress === 100 &&
        !state.certificates.some((c) => c.userId === u.id && c.status === 'issued')
    );
    if (!eligible.length)
      return openDialog(
        'Issue Certificate',
        empty(
          'No eligible learners',
          'A learner must complete Robotics and must not already have an active certificate.'
        )
      );
    form(
      'Issue Completion Certificate',
      select(
        'userId',
        'Completed learner',
        eligible.map((u) => [u.id, `${u.name} · ${branchName(u.branchId)}`]),
        eligible[0].id
      ),
      (data) => {
        const u = user(data.userId);
        if (
          !state.settings.certificatesEnabled ||
          !u ||
          u.progress !== 100 ||
          state.certificates.some((c) => c.userId === u.id && c.status === 'issued')
        )
          throw new Error('This learner is not eligible for a new certificate.');
        state.certificates.push({
          id: Store.id('certificate'),
          userId: u.id,
          courseId: 'robotics',
          date: new Date().toISOString(),
          status: 'issued',
        });
        log(
          'Completion certificate issued',
          `${u.name} · Robotics`,
          'award',
          u.branchId,
          'certificates'
        );
        return 'Sample completion certificate created.';
      },
      'Issue Certificate'
    );
  }
  function viewCertificate(id) {
    const c = state.certificates.find((c) => c.id === id);
    if (!c) return;
    openDialog(
      'Completion Certificate',
      `<div class="certificate-preview"><div class="brand"><img src="Assets/kia-mark.png" width="39" height="48" alt=""/><span>KIDS<br/>INNOVATE<br/>AFRICA</span></div><p>${c.status === 'issued' ? 'SAMPLE CERTIFICATE' : 'REVOKED CERTIFICATE'}</p><h3>Certificate of Completion</h3><p>This recognises</p><h4>${esc(user(c.userId)?.name)}</h4><p>for completing the KIA Robotics course.</p><p>${esc(branchName(user(c.userId)?.branchId))}</p><p>${formatDate(c.date)} ${c.date.slice(0, 4)}</p><small>Design preview · ${esc(c.id)}</small></div><div class="form-actions"><button class="button secondary" data-close-dialog>Close</button><button class="button" data-action="print-certificate" ${c.status === 'issued' ? '' : 'disabled'}>Print preview</button></div>`,
      'KIA ROBOTICS'
    );
  }
  function confirmAction(title, note, handler, label) {
    form(title, `<p class="field full subtle">${note}</p>`, handler, label);
    $('#edit-form .form-note').hidden = true;
  }
  function exportReport() {
    const rows = [
      ['Branch', 'Mompreneur', 'Learners', 'Completed Robotics', 'Average Progress (%)'],
      ...visibleBranches().map((b) => [
        b.name,
        user(b.ownerId)?.name || '',
        learners(b.id).length,
        learners(b.id).filter((u) => u.progress === 100).length,
        average(learners(b.id)),
      ]),
    ];
    window.KIALMS.downloadCSV('KIA_Branch_Progress_Report.csv', rows);
    toast('Branch progress report exported.');
  }

  const courseUI = window.createKIACourseFeatures({
    actor,
    esc,
    icon,
    pill,
    button,
    viewHeading,
    progressBar,
    openDialog,
    form,
    input,
    select,
    textarea,
    log,
    toast,
    getState: () => state,
    getCourse: () => currentCourse,
    reload: () => {
      state = Store.read();
      render();
    },
  });
  const lms = window.createKIAManagementFeatures({
    actor,
    isMom,
    esc,
    icon,
    pill,
    button,
    table,
    empty,
    viewHeading,
    info,
    form,
    input,
    select,
    textarea,
    openDialog,
    toast,
    render,
    progressBar,
    getState: () => state,
    getScope: () => scope,
    branchReports: branchReportsView,
  });
  const mom = isMom
    ? window.createKIAMompreneurFeatures({
        actor,
        esc,
        icon,
        pill,
        button,
        viewHeading,
        openDialog,
        closeDialog,
        toast,
        render,
        navigate,
        progressBar,
        getState: () => state,
        reload: () => {
          state = Store.read();
          render();
        },
        addSession: (date) => sessionForm(undefined, date),
        openCourse: (id) => {
          if (!allowedCourse(course(id))) return;
          currentCourse = id;
          if (route() !== 'courses') history.pushState(null, '', '#courses');
          render();
          window.scrollTo({ top: 0, behavior: 'instant' });
        },
      })
    : null;
  function setMenu(open) {
    $('#sidebar').classList.toggle('open', open);
    $('#menu-toggle').setAttribute('aria-expanded', String(open));
    $('#menu-toggle').setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    $('#nav-backdrop').hidden = !open;
    $('#sidebar').inert = innerWidth <= 1000 && !open;
  }
  $('#menu-toggle').addEventListener('click', () =>
    setMenu(!$('#sidebar').classList.contains('open'))
  );
  $('#nav-backdrop').addEventListener('click', () => {
    setMenu(false);
    $('#menu-toggle').focus();
  });
  window.addEventListener('resize', () => {
    if (innerWidth > 1000) setMenu(false);
    else $('#sidebar').inert = !$('#sidebar').classList.contains('open');
  });
  $('#account-toggle').addEventListener('click', () => {
    const show = $('#account-menu').hidden;
    $('#account-menu').hidden = !show;
    $('#account-toggle').setAttribute('aria-expanded', String(show));
  });
  $('#branch-filter').addEventListener('change', (event) => {
    scope = isMom ? actor.branchId : event.target.value;
    query = '';
    render();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setMenu(false);
      $('#account-menu').hidden = true;
      $('#account-toggle').setAttribute('aria-expanded', 'false');
    }
  });
  dialog.addEventListener('close', clearMedia);
  document.addEventListener('input', (event) => {
    if (!event.target.matches('[data-search]')) return;
    query = event.target.value;
    const renderer = { users: usersRows, content: contentRows, schedules: scheduleRows }[route()];
    if (renderer) $('#results').innerHTML = renderer();
  });
  document.addEventListener('change', (event) => {
    if (event.target.id === 'content-course') {
      contentCourse = event.target.value;
      $('#results').innerHTML = contentRows();
    }
    if (!isMom && event.target.id === 'certificate-switch') {
      state.settings.certificatesEnabled = event.target.checked;
      log(
        state.settings.certificatesEnabled ? 'Certificates enabled' : 'Certificates disabled',
        'Platform launch settings',
        'settings',
        null,
        'settings'
      );
      persist(
        state.settings.certificatesEnabled
          ? 'Certificate management enabled for the preview.'
          : 'Certificates switched off.'
      );
      $('#certificate-switch').focus();
    }
  });
  document.addEventListener('click', async (event) => {
    if (!event.target.closest('.account-wrap')) {
      $('#account-menu').hidden = true;
      $('#account-toggle').setAttribute('aria-expanded', 'false');
    }
    if (event.target.closest('[data-nav]')) setMenu(false);
    if (event.target.closest('#account-menu a')) {
      $('#account-menu').hidden = true;
      $('#account-toggle').setAttribute('aria-expanded', 'false');
    }
    if (event.target.closest('[data-close-dialog]')) {
      closeDialog();
      return;
    }
    const tab = event.target.closest('[data-user-tab]');
    if (tab) {
      userTab = isMom ? 'learner' : tab.dataset.userTab;
      render();
      return;
    }
    const control = event.target.closest('[data-action]');
    if (!control) return;
    const id = control.dataset.id;
    const momActions = [
      'add-user',
      'edit-user',
      'view-user',
      'invite-user',
      'resend-invite',
      'view-invite',
      'open-invitations',
      'assign-course',
      'manage-course',
      'back-courses',
      'view-training-lesson',
      'complete-training',
      'view-content',
      'add-session',
      'edit-session',
      'export-report',
      'branch-learners',
    ];
    if (isMom && !momActions.includes(control.dataset.action)) {
      toast('KIA Admin manages this action.');
      return;
    }
    try {
      switch (control.dataset.action) {
        case 'add-user':
          userForm();
          break;
        case 'add-mompreneur':
          userForm(undefined, 'mompreneur');
          break;
        case 'invite-user':
          inviteUser(id);
          break;
        case 'resend-invite':
          inviteUser(id, true);
          break;
        case 'view-invite':
          invitationPreview(id);
          break;
        case 'open-invitations':
          closeDialog();
          navigate('invitations');
          break;
        case 'view-training-lesson':
          trainingLesson(id);
          break;
        case 'complete-training':
          courseUI.completeTraining(currentCourse, id);
          break;
        case 'edit-module-quiz':
          courseUI.moduleQuizForm(control.dataset.module, id);
          break;
        case 'edit-user':
          userForm(id);
          break;
        case 'view-user':
          viewUser(id);
          break;
        case 'add-branch':
          branchForm();
          break;
        case 'edit-branch':
          branchForm(id);
          break;
        case 'branch-learners':
          scope = isMom ? actor.branchId : id;
          userTab = 'learner';
          query = '';
          navigate('users');
          break;
        case 'branch-schedule':
          scope = id;
          query = '';
          navigate('schedules');
          break;
        case 'add-course':
          courseForm();
          break;
        case 'edit-course':
          courseForm(id);
          break;
        case 'manage-course':
          if (!allowedCourse(course(id))) return;
          currentCourse = id;
          render();
          break;
        case 'back-courses':
          currentCourse = null;
          render();
          break;
        case 'add-module':
          moduleForm(id);
          break;
        case 'add-lesson':
          lessonForm(id);
          break;
        case 'edit-lesson':
          lessonForm(control.dataset.module, id);
          break;
        case 'assign-course':
          assignmentForm();
          break;
        case 'add-content':
          contentForm();
          break;
        case 'view-content':
          await viewContent(id);
          break;
        case 'add-session':
          sessionForm();
          break;
        case 'edit-session':
          sessionForm(id);
          break;
        case 'export-report':
          exportReport();
          break;
        case 'issue-certificate':
          issueCertificate();
          break;
        case 'view-certificate':
          viewCertificate(id);
          break;
        case 'print-certificate':
          window.print();
          break;
        case 'revoke-certificate':
          confirmAction(
            'Revoke Sample Certificate',
            'This will mark this sample certificate as revoked. The learner’s course progress will remain unchanged.',
            () => {
              const c = state.certificates.find((c) => c.id === id);
              c.status = 'revoked';
              log(
                'Certificate revoked',
                user(c.userId)?.name || '',
                'award',
                user(c.userId)?.branchId,
                'certificates'
              );
              return 'Sample certificate revoked.';
            },
            'Revoke Certificate'
          );
          break;
        case 'reset-demo':
          confirmAction(
            'Reset Preview Data',
            'Clear preview accounts, progress, uploaded files and changes, then log out? This affects this browser’s demo data.',
            async () => {
              await Store.clearFiles();
              window.KIAStorage.clear();
              state = Store.seed();
              Store.save(state);
              Auth.logout();
              return { loggedOut: true };
            },
            'Reset Demo Data'
          );
          break;
      }
    } catch (error) {
      toast(error.message || 'This action could not be completed.');
    }
  });
  window.addEventListener('hashchange', () => {
    query = '';
    currentCourse = null;
    setMenu(false);
    $('#account-menu').hidden = true;
    $('#account-toggle').setAttribute('aria-expanded', 'false');
    render();
    $('#main-content').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  window.addEventListener('pageshow', (event) => {
    if (!Auth.checkPage()) return;
    const active = Auth.current();
    if (!active || active.role !== (isMom ? 'mompreneur' : 'admin')) {
      location.replace('login.html');
      return;
    }
    if (event.persisted) {
      Object.assign(actor, active);
      state = Store.read();
      closeDialog();
      render();
    }
  });
  setMenu(false);
  render();
})();
