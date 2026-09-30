/* Management screens for groups, notices, learning rules and reports. */
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
    Auth = window.KIAAccounts,
    state = ctx.getState,
    scope = ctx.getScope;
  let groupQuery = '',
    reportTab = 'overview',
    reportSearch = '',
    reportStatus = 'all',
    reportGroup = 'all',
    reportAccess = 'all',
    eventCategory = 'all',
    eventFrom = '',
    eventTo = '';
  const $ = (s) => document.querySelector(s);
  const btn = (text, action, id = '', secondary = false) =>
    `<button class="button ${secondary ? 'secondary' : ''}" data-lms-action="${action}" data-id="${esc(id)}">${text}</button>`;
  const branchName = (id) =>
    id === 'all' ? 'All clubs' : state().branches.find((b) => b.id === id)?.name || 'Awaiting club';
  const canBranch = (id) => LMS.staff(Auth.current(), state(), id);
  const inScope = (id) =>
    (!isMom || id === actor.branchId) && (scope() === 'all' || id === scope());
  const groups = () => state().groups.filter((g) => inScope(g.branchId));
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
  function groupCards() {
    const list = groups().filter((g) =>
      `${g.name} ${g.description} ${branchName(g.branchId)}`
        .toLowerCase()
        .includes(groupQuery.toLowerCase())
    );
    return list.length
      ? `<div class="lms-group-grid">${list
          .map((g) => {
            const members = LMS.members(state(), g),
              average = members.length
                ? Math.round(members.reduce((sum, u) => sum + u.progress, 0) / members.length)
                : 0;
            return `<article class="panel lms-group-card"><div class="card-top"><span class="round-icon tone-blue">${icon('users')}</span>${pill(g.autoEnroll ? 'Auto-enrol on' : 'Manual enrolment', g.autoEnroll ? 'green' : 'gray')}</div><p class="eyebrow">${esc(branchName(g.branchId))}</p><h2>${esc(g.name)}</h2><p class="subtle">${esc(g.description || 'A learning group within this club.')}</p><div class="lms-group-stats"><div><strong>${members.length}</strong><small>Learners</small></div><div><strong>${g.courseIds.length}</strong><small>Group courses</small></div><div><strong>${average}%</strong><small>Robotics progress</small></div></div><p class="lms-course-list">${g.courseIds.map((id) => esc(state().courses.find((c) => c.id === id)?.title || id)).join(' · ') || 'No group courses selected'}</p><div class="lms-card-buttons">${btn('Manage group', 'edit-group', g.id)}${btn('Enrol learners', 'enrol-group', g.id, true)}</div></article>`;
          })
          .join('')}</div>`
      : empty('No groups found', 'Create a group to organise the learners in a club.');
  }
  function groupsView() {
    return (
      viewHeading(
        'Learning Groups',
        'Organise classes inside each club and assign courses to the whole group.',
        btn('Create Group', 'new-group')
      ) +
      info(
        '<strong>A group belongs to one club.</strong> Use groups for class days, term intakes or learning cohorts. Learners keep their individual progress.',
        'users'
      ) +
      `<div class="lms-search-row"><label class="search-wrap">${icon('search')}<span class="sr-only">Search groups</span><input id="lms-group-search" type="search" value="${esc(groupQuery)}" placeholder="Search groups"/></label><span class="subtle">${groups().length} groups · ${esc(branchName(scope()))}</span></div><div id="lms-groups-results">${groupCards()}</div>`
    );
  }
  function groupForm(id) {
    const old = state().groups.find((g) => g.id === id);
    if (id && (!old || !canBranch(old.branchId)))
      throw new Error('This group is outside your club.');
    const g = old || {
      name: '',
      description: '',
      branchId: isMom ? actor.branchId : scope() === 'all' ? state().branches[0]?.id : scope(),
      memberIds: [],
      courseIds: ['robotics'],
      autoEnroll: true,
    };
    const branchField =
      old || isMom
        ? `<label class="field"><span>Club branch</span><span class="readonly-branch">${esc(branchName(g.branchId))}</span></label>`
        : select(
            'branchId',
            'Club branch',
            state().branches.map((b) => [b.id, b.name]),
            g.branchId
          );
    const courses = state().courses.filter(
      (c) => c.audience === 'learners' && c.status === 'published'
    );
    const el = form(
      old ? 'Manage Learning Group' : 'Create Learning Group',
      input('name', 'Group name', g.name) +
        branchField +
        textarea('description', 'Description', g.description, 'maxlength="500"') +
        `<fieldset class="lms-check-field full"><legend>Group courses</legend>${courses.map((c) => `<label class="lms-check"><input type="checkbox" name="courseIds" value="${esc(c.id)}" ${g.courseIds.includes(c.id) ? 'checked' : ''}/><span>${esc(c.title)}</span></label>`).join('')}</fieldset><label class="lms-check full"><input type="checkbox" name="autoEnroll" ${g.autoEnroll ? 'checked' : ''}/><span><strong>Automatically enrol group members</strong><small>When you save this group, active members receive the selected courses.</small></span></label><fieldset class="lms-check-field full"><legend>Learners in this club</legend><div id="lms-member-list"></div></fieldset><p class="field full subtle">Removing a learner from a group keeps their assigned courses and learning progress.</p>`,
      (values, element) => {
        const data = new FormData(element),
          result = LMS.saveGroup(
            state(),
            {
              ...values,
              branchId:
                g.branchId === values.branchId || !values.branchId ? g.branchId : values.branchId,
              memberIds: data.getAll('memberIds'),
              courseIds: data.getAll('courseIds'),
              autoEnroll: data.has('autoEnroll'),
            },
            id
          );
        return `${result.group.name} saved. ${result.enrolled} new course assignment${result.enrolled === 1 ? '' : 's'}.`;
      },
      'Save Group'
    );
    function members() {
      const branchId = el.elements.branchId?.value || g.branchId;
      const list = state().users.filter((u) => u.role === 'learner' && u.branchId === branchId);
      $('#lms-member-list').innerHTML =
        list
          .map(
            (u) =>
              `<label class="lms-check"><input type="checkbox" name="memberIds" value="${esc(u.id)}" ${g.memberIds.includes(u.id) ? 'checked' : ''}/><span>${esc(u.name)}<small>@${esc(u.username)}${u.status === 'active' ? '' : ' · Inactive profile'}</small></span></label>`
          )
          .join('') ||
        '<p class="subtle">Add learners to this club first, then include them in the group.</p>';
    }
    el.elements.description.maxLength = 500;
    el.elements.branchId?.addEventListener('change', members);
    members();
  }
  function enrolGroup(id) {
    const g = state().groups.find((g) => g.id === id);
    if (!g || !canBranch(g.branchId)) throw new Error('This group is outside your club.');
    const count = LMS.members(state(), g).filter((u) => u.status === 'active').length;
    form(
      'Enrol Group Learners',
      `<div class="field full">${info(`<strong>${esc(g.name)}</strong><br/>Assign ${g.courseIds.length} selected course${g.courseIds.length === 1 ? '' : 's'} to ${count} active learner${count === 1 ? '' : 's'}. Existing assignments and progress are kept.`, 'course')}</div>`,
      () => {
        const added = LMS.assignGroup(state(), id);
        return added
          ? `${added} new course assignments added.`
          : 'Every eligible learner already has the selected courses.';
      },
      'Enrol Learners'
    );
  }
  function announcementCards() {
    const list = state().announcements.filter((a) =>
      isMom
        ? (a.branchId === 'all' || a.branchId === actor.branchId) &&
          (a.status === 'published' || LMS.canEditAnnouncement(Auth.current(), state(), a))
        : scope() === 'all' || a.branchId === scope() || a.branchId === 'all'
    );
    return list.length
      ? `<div class="lms-notice-grid">${list.map((a) => `<article class="panel lms-notice-card"><div class="card-top">${pill(a.status[0].toUpperCase() + a.status.slice(1), a.status === 'published' ? 'green' : a.status === 'draft' ? 'amber' : 'gray')}<span class="subtle">${esc(date(a.updatedAt))}</span></div><h2>${esc(a.title)}</h2><p class="lms-message-text">${esc(a.body)}</p><p class="subtle">${esc(branchName(a.branchId))} · ${a.audience === 'all' ? 'Learners & Mompreneurs' : a.audience === 'learners' ? 'Learners / guardians' : 'Mompreneurs'}</p><div class="lms-card-buttons">${LMS.canEditAnnouncement(Auth.current(), state(), a) ? btn('Edit announcement', 'edit-announcement', a.id, true) : '<span class="subtle">Published by KIA Admin</span>'}</div></article>`).join('')}</div>`
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
        '<strong>In-portal announcements.</strong> Published notices appear for the selected audience in this browser preview. Drafts stay private to their managers. No email is sent.',
        'mail'
      ) +
      announcementCards()
    );
  }
  function announcementForm(id) {
    const old = state().announcements.find((a) => a.id === id);
    if (id && (!old || !LMS.canEditAnnouncement(Auth.current(), state(), old)))
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
    const group = groups().find((g) => g.id === reportGroup);
    if (reportGroup !== 'all' && !group) reportGroup = 'all';
    return reportPeople().filter(
      (u) =>
        (reportGroup === 'all' || group.memberIds.includes(u.id)) &&
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
      groups: groups()
        .filter((g) => g.branchId === u.branchId && g.memberIds.includes(u.id))
        .map((g) => g.name)
        .join('; '),
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
    return (
      `<div class="lms-result-summary"><strong>${rows.length} learners</strong><span>Robotics · matching the filters above</span></div>` +
      (rows.length
        ? table(
            [
              'LEARNER',
              'CLUB / GROUP',
              'PROGRESS',
              'LESSONS LEFT',
              'LAST LOGIN (SAST)',
              'ACCOUNT',
              'DETAILS',
            ],
            rows
              .map((u) => {
                const d = details(u);
                return `<tr><td><strong>${esc(u.name)}</strong><br/><small class="subtle">@${esc(u.username)}</small></td><td>${esc(branchName(u.branchId))}<br/><small class="subtle">${esc(d.groups || 'No group')}</small></td><td>${ctx.progressBar(u.progress)}<br/>${pill(d.status, u.progress === 100 ? 'green' : '')}</td><td>${d.count - d.done} / ${d.count}</td><td>${esc(date(u.lastLogin))}</td><td>${pill(d.access, d.access === 'Ready' ? 'green' : 'amber')}</td><td>${button('View', 'view-user', 'eye', true, u.id)}</td></tr>`;
              })
              .join('')
          )
        : empty('No learners match these filters', 'Change the progress, group or account filter.'))
    );
  }
  const filterSelect = (id, label, options, value) =>
    `<label><span>${label}</span><select id="${id}">${options.map(([key, text]) => `<option value="${esc(key)}" ${key === value ? 'selected' : ''}>${esc(text)}</option>`).join('')}</select></label>`;
  function learnerReport() {
    reportRows();
    return (
      viewHeading(
        'Learner Progress Report',
        'See who has started, who has finished and who still needs account setup.',
        btn('Export Filtered CSV', 'export-learners')
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
      )}${filterSelect('lms-report-group', 'Learning group', [['all', 'All groups'], ...groups().map((g) => [g.id, g.name])], reportGroup)}${filterSelect(
        'lms-report-access',
        'Account access',
        [
          ['all', 'All accounts'],
          ['ready', 'Ready'],
          ['pending', 'Setup pending'],
          ['inactive', 'Inactive'],
        ],
        reportAccess
      )}</div><div id="lms-report-results">${learnerReportTable()}</div></section><p class="lms-footnote">Last login is recorded when the account is used in this preview. Existing sample accounts may have no recorded login.</p>`
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
                  `<tr><td>${esc(date(a.date))}</td><td><strong>${esc(a.title)}</strong><br/>${pill(LMS.category(a))}</td><td>${esc(a.detail)}</td><td>${esc(a.actorName || 'Sample history')}</td><td>${esc(a.branchId ? branchName(a.branchId) : 'All clubs')}</td></tr>`
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
        btn('Export Timeline CSV', 'export-timeline')
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
          ['group', 'Groups / branches'],
          ['announcement', 'Announcements'],
          ['settings', 'Settings'],
        ],
        eventCategory
      )}<label><span>From</span><input id="lms-event-from" type="date" value="${esc(eventFrom)}"/></label><label><span>To</span><input id="lms-event-to" type="date" value="${esc(eventTo)}"/></label>${btn('Reset filters', 'reset-timeline', '', true)}</div><div id="lms-timeline-results">${activityTable()}</div></section><p class="lms-footnote">Browser preview history · up to 500 recent events. Production activity records require the backend.</p>`
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
  function ruleForm() {
    if (Auth.current()?.role !== 'admin') throw new Error('KIA Admin manages learning rules.');
    const c = state().courses.find((c) => c.id === 'robotics');
    form(
      'Robotics Learning Rules',
      `<div class="field full">${info('<strong>Choose how learners move through Robotics.</strong> In sequential order, completing a lesson unlocks the next one. Already completed lessons remain available to review.', 'course')}</div>` +
        select(
          'lessonOrder',
          'Lesson order',
          [
            ['free', 'Any order'],
            ['sequential', 'Complete lessons in sequence'],
          ],
          c.lessonOrder
        ) +
        `<p class="field full subtle">Course completion stays based on completing all Robotics lessons. Practice quizzes remain available for revision.</p>`,
      (values) => {
        LMS.setRules(state(), values.lessonOrder);
        return 'Robotics lesson order updated for all clubs.';
      },
      'Save Learning Rules'
    );
  }
  function dashboardLinks() {
    return `<div class="lms-dashboard-links"><a href="#groups">${icon('users')}<span><strong>Learning groups</strong><small>Organise classes & enrol together</small></span>${icon('arrow')}</a><a href="#announcements">${icon('mail')}<span><strong>Club announcements</strong><small>Keep your community informed</small></span>${icon('arrow')}</a><a href="#reports" data-lms-report-link="learners">${icon('report')}<span><strong>Learner report</strong><small>Find the learners who need support</small></span>${icon('arrow')}</a></div>`;
  }
  document.addEventListener('input', (event) => {
    if (event.target.id === 'lms-group-search') {
      groupQuery = event.target.value;
      $('#lms-groups-results').innerHTML = groupCards();
    }
    if (event.target.id === 'lms-report-search') {
      reportSearch = event.target.value;
      $('#lms-report-results').innerHTML = learnerReportTable();
    }
  });
  document.addEventListener('change', (event) => {
    const id = event.target.id,
      value = event.target.value;
    if (id === 'lms-report-status') reportStatus = value;
    else if (id === 'lms-report-group') reportGroup = value;
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
    const active = Auth.current();
    if (!active || active.id !== actor.id) {
      toast('Log in again to continue.');
      return;
    }
    try {
      const id = control.dataset.id;
      switch (control.dataset.lmsAction) {
        case 'new-group':
          groupForm();
          break;
        case 'edit-group':
          groupForm(id);
          break;
        case 'enrol-group':
          enrolGroup(id);
          break;
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
              'Groups',
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
                d.groups,
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
              a.actorName || 'Sample history',
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
    groupsView,
    announcementsView,
    reportsView,
    dashboardLinks,
    ruleButton: () => btn('Learning Rules', 'learning-rules', '', true),
  };
};
