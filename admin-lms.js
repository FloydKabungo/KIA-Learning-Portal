/* Management screens for notices, learning rules and reports. */
window.createKIAManagementFeatures = function (ctx) {
  'use strict';
  const {
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
  } = ctx;
  const LMS = window.KIALMS,
    Preview = window.KIAPreview,
    state = ctx.getState,
    scope = ctx.getScope;
  let reportTab = 'overview',
    reportSearch = '',
    reportStatus = 'all',
    reportAccess = 'all',
    eventCategory = 'all',
    eventFrom = '',
    eventTo = '';
  const $ = (s) => document.querySelector(s);
  const btn = (text, action, id = '', secondary = false) =>
    `<button class="button ${secondary ? 'secondary' : ''}" data-lms-action="${action}" data-id="${esc(id)}">${text}</button>`;
  const branchName = (id) =>
    id === 'all' ? 'All clubs' : state().branches.find((b) => b.id === id)?.name || 'Awaiting club';
  const canBranch = (id) => LMS.staff(Preview.current(), state(), id);
  const inScope = (id) =>
    (!isMom || id === actor.branchId) && (scope() === 'all' || id === scope());
  const date = (value) =>
    value
      ? new Date(value).toLocaleString('en-ZA', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Africa/Johannesburg',
        })
      : 'Not recorded';
  const day = (value) =>
    new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Africa/Johannesburg',
    }).format(new Date(value));
  function announcementCards() {
    const list = state().announcements.filter((a) =>
      isMom
        ? (a.branchId === 'all' || a.branchId === actor.branchId) &&
          (a.status === 'published' || LMS.canEditAnnouncement(Preview.current(), state(), a))
        : scope() === 'all' || a.branchId === scope() || a.branchId === 'all'
    );
    return list.length
      ? `<div class="lms-notice-grid">${list.map((a) => `<article class="panel lms-notice-card"><div class="card-top">${pill(a.status[0].toUpperCase() + a.status.slice(1), a.status === 'published' ? 'green' : a.status === 'draft' ? 'amber' : 'gray')}<span class="subtle">${esc(date(a.updatedAt))}</span></div><h2>${esc(a.title)}</h2><p class="lms-message-text">${esc(a.body)}</p><p class="subtle">${esc(branchName(a.branchId))} · ${a.audience === 'all' ? 'Learners & Mompreneurs' : a.audience === 'learners' ? 'Learners / guardians' : 'Mompreneurs'}</p><div class="lms-card-buttons">${LMS.canEditAnnouncement(Preview.current(), state(), a) ? btn('Edit announcement', 'edit-announcement', a.id, true) : '<span class="subtle">Published by KIA Admin</span>'}</div></article>`).join('')}</div>`
      : empty(
          'Your notice board is ready',
          'Share a welcome message, club reminder or class update.'
        );
  }
  function announcementsView() {
    return (
      viewHeading(
        'Announcements',
        'Share updates on the signed-in portal for the people who need them.',
        btn('Write Announcement', 'new-announcement')
      ) +
      info(
        '<strong>In-portal announcements.</strong> Share updates with your selected audience. Save unfinished notices as drafts.',
        'mail'
      ) +
      announcementCards()
    );
  }
  function announcementForm(id) {
    const old = state().announcements.find((a) => a.id === id);
    if (id && (!old || !LMS.canEditAnnouncement(Preview.current(), state(), old)))
      throw new Error('You cannot edit this announcement.');
    const a = old || {
      title: '',
      body: '',
      branchId: isMom ? actor.branchId : scope(),
      audience: 'learners',
      status: 'draft',
    };
    const branchField = isMom
      ? `<label class="field"><span>Club branch</span><span class="readonly-branch">${esc(branchName(actor.branchId))}</span></label>`
      : select(
          'branchId',
          'Show in',
          [['all', 'All KIA clubs'], ...state().branches.map((b) => [b.id, b.name])],
          a.branchId
        );
    const el = form(
      old ? 'Edit Announcement' : 'Write Announcement',
      input('title', 'Title', a.title, 'text', 'required maxlength="100"') +
        branchField +
        (isMom
          ? ''
          : select(
              'audience',
              'Audience',
              [
                ['learners', 'Learners / guardians'],
                ['mompreneurs', 'Mompreneurs'],
                ['all', 'Learners & Mompreneurs'],
              ],
              a.audience
            )) +
        select(
          'status',
          'Publishing status',
          [
            ['draft', 'Draft'],
            ['published', 'Published'],
            ['archived', 'Archived'],
          ],
          a.status
        ) +
        textarea('body', 'Message', a.body, 'required maxlength="2000"'),
      (values) => {
        const item = LMS.saveAnnouncement(state(), values, id);
        return item.status === 'published'
          ? 'Announcement published to the selected portal audience.'
          : item.status === 'draft'
            ? 'Draft saved. It is not visible to learners.'
            : 'Announcement archived.';
      },
      'Save Announcement'
    );
    el.elements.body.maxLength = 2000;
  }
  const reportPeople = () =>
    state().users.filter((u) => u.role === 'learner' && inScope(u.branchId));
  function reportRows() {
    return reportPeople().filter(
      (u) =>
        `${u.name} ${u.username}`.toLowerCase().includes(reportSearch.toLowerCase()) &&
        (reportStatus === 'all' ||
          (reportStatus === 'not-started'
            ? u.progress === 0
            : reportStatus === 'completed'
              ? u.progress === 100
              : u.progress > 0 && u.progress < 100)) &&
        (reportAccess === 'all' ||
          (reportAccess === 'pending'
            ? u.status === 'active' && u.accessStatus === 'pending'
            : reportAccess === 'inactive'
              ? u.status !== 'active'
              : u.status === 'active' && u.accessStatus === 'active'))
    );
  }
  const details = (u) => {
    const p = window.KIALearning.readCourseProgress(u.id, 'robotics', state());
    return {
      count: p.total,
      done: p.completed.size,
      status: p.percent === 100 ? 'Completed' : p.percent > 0 ? 'In progress' : 'Not started',
      access:
        u.status !== 'active'
          ? 'Inactive'
          : u.accessStatus === 'pending'
            ? 'Setup pending'
            : 'Ready',
    };
  };
  function learnerReportTable() {
    const rows = reportRows();
    return `<div class="lms-result-summary"><strong>${rows.length} learners</strong><span>Robotics progress</span></div><div class="people-grid">${rows.map(u => { const d=details(u); return `<article class="person-card"><button class="person-open" data-action="view-user" data-id="${esc(u.id)}" aria-label="View ${esc(u.name)}"><span class="person-circle">${esc(u.name.split(/\s+/).map(n=>n[0]).slice(0,2).join(''))}</span><strong>${esc(u.name)}</strong><small>${esc(branchName(u.branchId))}</small></button><p>${d.done} / ${d.count} lessons complete</p><div class="person-summary"><strong>${esc(d.status)}</strong><span>${d.count-d.done} lessons remaining · ${esc(d.access)}</span></div>${button('View progress','view-user','eye',true,u.id)}</article>`;}).join('') || empty('No learners match these filters','Change a filter to see your club.')}</div>`;
  }
  const filterSelect = (id, label, options, value) =>
    `<label><span>${label}</span><select id="${id}">${options.map(([key, text]) => `<option value="${esc(key)}" ${key === value ? 'selected' : ''}>${esc(text)}</option>`).join('')}</select></label>`;
  function learnerReport() {
    reportRows();
    return (
      viewHeading(
        'Learner Progress Report',
        'See who has started, who has finished and who still needs account setup.',
        (actor.role === 'admin' ? btn('Export Filtered CSV', 'export-learners') : '')
      ) +
      `<section class="panel"><div class="lms-filters"><label><span>Search learners</span><input id="lms-report-search" type="search" value="${esc(reportSearch)}" placeholder="Name or username"/></label>${filterSelect(
        'lms-report-status',
        'Learning progress',
        [
          ['all', 'All progress'],
          ['not-started', 'Not started'],
          ['in-progress', 'In progress'],
          ['completed', 'Completed'],
        ],
        reportStatus
      )}${filterSelect(
        'lms-report-access',
        'Account access',
        [
          ['all', 'All accounts'],
          ['ready', 'Ready'],
          ['pending', 'Setup pending'],
          ['inactive', 'Inactive'],
        ],
        reportAccess
      )}</div><div id="lms-report-results">${learnerReportTable()}</div></section>`
    );
  }
  function activityRows() {
    return state()
      .activity.filter(
        (a) =>
          inScope(a.branchId) &&
          (eventCategory === 'all' || LMS.category(a) === eventCategory) &&
          (!eventFrom || day(a.date) >= eventFrom) &&
          (!eventTo || day(a.date) <= eventTo)
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }
  function activityTable() {
    if (eventFrom && eventTo && eventFrom > eventTo)
      return '<p class="lms-filter-error" role="alert">Choose an end date on or after the start date.</p>';
    const rows = activityRows();
    return (
      `<div class="lms-result-summary"><strong>${rows.length} events</strong><span>Times shown in SAST</span></div>` +
      (rows.length
        ? table(
            ['WHEN', 'EVENT', 'DETAILS', 'PERFORMED BY', 'CLUB'],
            rows
              .map(
                (a) =>
                  `<tr><td>${esc(date(a.date))}</td><td><strong>${esc(a.title)}</strong><br/>${pill(LMS.category(a))}</td><td>${esc(a.detail)}</td><td>${esc(a.actorName || 'Activity history')}</td><td>${esc(a.branchId ? branchName(a.branchId) : 'All clubs')}</td></tr>`
              )
              .join('')
          )
        : empty('No activity in this view', 'Choose another event type or date range.'))
    );
  }
  function timelineView() {
    return (
      viewHeading(
        'Activity Timeline',
        'Review account setup, enrolments, learning and club updates.',
        (actor.role === 'admin' ? btn('Export Timeline CSV', 'export-timeline') : '')
      ) +
      `<section class="panel"><div class="lms-filters">${filterSelect(
        'lms-event-category',
        'Event type',
        [
          ['all', 'All events'],
          ['account', 'Accounts'],
          ['learning', 'Learning'],
          ['course', 'Courses / enrolment'],
          ['schedule', 'Schedules'],
          ['branch', 'Branches'],
          ['announcement', 'Announcements'],
          ['settings', 'Settings'],
        ],
        eventCategory
      )}<label><span>From</span><input id="lms-event-from" type="date" value="${esc(eventFrom)}"/></label><label><span>To</span><input id="lms-event-to" type="date" value="${esc(eventTo)}"/></label>${btn('Reset filters', 'reset-timeline', '', true)}</div><div id="lms-timeline-results">${activityTable()}</div></section>`
    );
  }
  function reportsView() {
    const tabs = `<div class="lms-report-tabs" role="group" aria-label="Report type">${[
      ['overview', 'Branch overview'],
      ['learners', 'Learner report'],
      ['timeline', 'Activity timeline'],
    ]
      .map(
        ([id, label]) =>
          `<button data-lms-report-tab="${id}" aria-pressed="${reportTab === id}">${icon(id === 'timeline' ? 'clock' : 'report')}${label}</button>`
      )
      .join('')}</div>`;
    return (
      tabs +
      (reportTab === 'overview'
        ? ctx.branchReports()
        : reportTab === 'learners'
          ? learnerReport()
          : timelineView())
    );
  }
  function ruleForm() { if (Preview.current()?.role === 'admin') location.hash = 'releases'; }
  function dashboardLinks() {
    return `<div class="lms-dashboard-links"><a href="#announcements">${icon('mail')}<span><strong>Club announcements</strong><small>Keep your community informed</small></span>${icon('arrow')}</a><a href="#reports" data-lms-report-link="learners">${icon('report')}<span><strong>Learner report</strong><small>Find the learners who need support</small></span>${icon('arrow')}</a></div>`;
  }
  document.addEventListener('input', (event) => {
    if (event.target.id === 'lms-report-search') {
      reportSearch = event.target.value;
      $('#lms-report-results').innerHTML = learnerReportTable();
    }
  });
  document.addEventListener('change', (event) => {
    const id = event.target.id,
      value = event.target.value;
    if (id === 'lms-report-status') reportStatus = value;
    else if (id === 'lms-report-access') reportAccess = value;
    else if (id === 'lms-event-category') eventCategory = value;
    else if (id === 'lms-event-from') eventFrom = value;
    else if (id === 'lms-event-to') eventTo = value;
    else return;
    if (id.startsWith('lms-report-')) $('#lms-report-results').innerHTML = learnerReportTable();
    else $('#lms-timeline-results').innerHTML = activityTable();
  });
  document.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-lms-report-tab]');
    if (tab) {
      reportTab = tab.dataset.lmsReportTab;
      render();
      return;
    }
    const link = event.target.closest('[data-lms-report-link]');
    if (link) reportTab = link.dataset.lmsReportLink;
    const control = event.target.closest('[data-lms-action]');
    if (!control) return;
    const active = Preview.current();
    if (!active || active.id !== actor.id) {
      toast('Log in again to continue.');
      return;
    }
    try {
      const id = control.dataset.id;
      switch (control.dataset.lmsAction) {
        case 'new-announcement':
          announcementForm();
          break;
        case 'edit-announcement':
          announcementForm(id);
          break;
        case 'learning-rules':
          ruleForm();
          break;
        case 'reset-timeline':
          eventCategory = 'all';
          eventFrom = '';
          eventTo = '';
          render();
          break;
        case 'export-learners':
          LMS.downloadCSV('KIA_Learner_Progress.csv', [
            [
              'Learner',
              'Username',
              'Club',
              'Course',
              'Progress (%)',
              'Status',
              'Completed lessons',
              'Remaining lessons',
              'Account access',
              'Last login (SAST)',
            ],
            ...reportRows().map((u) => {
              const d = details(u);
              return [
                u.name,
                u.username,
                branchName(u.branchId),
                'Robotics',
                u.progress,
                d.status,
                d.done,
                d.count - d.done,
                d.access,
                date(u.lastLogin),
              ];
            }),
          ]);
          toast('Filtered learner report exported.');
          break;
        case 'export-timeline':
          if (eventFrom && eventTo && eventFrom > eventTo)
            throw new Error('Check the date range first.');
          LMS.downloadCSV('KIA_Activity_Timeline.csv', [
            ['When (SAST)', 'Event', 'Details', 'Performed by', 'Club', 'Category'],
            ...activityRows().map((a) => [
              date(a.date),
              a.title,
              a.detail,
              a.actorName || 'Activity history',
              branchName(a.branchId || 'all'),
              LMS.category(a),
            ]),
          ]);
          toast('Filtered activity timeline exported.');
          break;
      }
    } catch (error) {
      toast(error.message || 'The action could not be completed.');
    }
  });
  return {
    announcementsView,
    reportsView,
    dashboardLinks,
    ruleButton: () => btn('Learning Rules', 'learning-rules', '', true),
  };
};
