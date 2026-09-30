/* TalentLMS-inspired workflows for the local design preview.
   Enforce these permissions and persist these records on the production server. */
(() => {
  'use strict';
  const Data = window.KIAAdminData,
    Auth = window.KIAAccounts;
  const staff = (actor, state, branchId) =>
    Auth.isCurrent(actor) &&
    ['admin', 'mompreneur'].includes(actor.role) &&
    (branchId === 'all'
      ? actor.role === 'admin'
      : state.branches.some((b) => b.id === branchId) &&
        (actor.role === 'admin' || actor.branchId === branchId));
  function record(state, event) {
    state.activity.unshift({
      id: Data.id('activity'),
      date: new Date().toISOString(),
      tone: 'blue',
      icon: 'clock',
      route: 'reports',
      category: 'account',
      ...event,
    });
    state.activity = state.activity.slice(0, 500);
  }
  const category = (a) =>
    a.category ||
    {
      users: 'account',
      mail: 'account',
      course: 'course',
      content: 'course',
      calendar: 'schedule',
      settings: 'settings',
      branch: 'group',
      award: 'learning',
    }[a.icon] ||
    'account';
  const members = (state, group) =>
    state.users.filter(
      (u) => group.memberIds.includes(u.id) && u.role === 'learner' && u.branchId === group.branchId
    );
  function assignGroup(state, id, actor = Auth.current()) {
    const g = state.groups.find((g) => g.id === id);
    if (!g || !staff(actor, state, g.branchId))
      throw new Error('This group is outside your club access.');
    const courses = state.courses.filter(
      (c) => g.courseIds.includes(c.id) && c.audience === 'learners' && c.status === 'published'
    );
    let count = 0;
    members(state, g)
      .filter((u) => u.status === 'active')
      .forEach((u) =>
        courses.forEach((c) => {
          if (!u.courseIds.includes(c.id)) {
            u.courseIds.push(c.id);
            count++;
          }
        })
      );
    if (count)
      record(state, {
        title: 'Group courses assigned',
        detail: `${g.name} · ${count} new course assignment${count === 1 ? '' : 's'}`,
        actorId: actor.id,
        actorName: actor.name,
        branchId: g.branchId,
        category: 'course',
        icon: 'course',
        route: 'groups',
      });
    return count;
  }
  function saveGroup(state, values, id, actor = Auth.current()) {
    const old = state.groups.find((g) => g.id === id);
    if (id && !old) throw new Error('Group not found.');
    const branchId =
      old?.branchId || (actor?.role === 'mompreneur' ? actor.branchId : values.branchId);
    if (!staff(actor, state, branchId)) throw new Error('Choose a club you manage.');
    const name = String(values.name || '').trim();
    if (!name || name.length > 80) throw new Error('Enter a group name, up to 80 characters.');
    if (
      state.groups.some(
        (g) => g.id !== id && g.branchId === branchId && g.name.toLowerCase() === name.toLowerCase()
      )
    )
      throw new Error('This club already has a group with that name.');
    if (String(values.description || '').trim().length > 500)
      throw new Error('Keep the group description under 500 characters.');
    const ids = [...new Set(values.memberIds || [])],
      courses = [...new Set(values.courseIds || [])];
    if (
      ids.some(
        (id) =>
          !state.users.some((u) => u.id === id && u.role === 'learner' && u.branchId === branchId)
      )
    )
      throw new Error('Every group member must be a learner in this club.');
    if (
      courses.some(
        (id) =>
          !state.courses.some(
            (c) => c.id === id && c.audience === 'learners' && c.status === 'published'
          )
      )
    )
      throw new Error('Choose published learner courses.');
    const next = {
      id: old?.id || Data.id('group'),
      name,
      branchId,
      description: String(values.description || '')
        .trim()
        .slice(0, 500),
      memberIds: ids,
      courseIds: courses,
      autoEnroll: !!values.autoEnroll,
      createdBy: old?.createdBy || actor.id,
    };
    if (old) Object.assign(old, next);
    else state.groups.push(next);
    record(state, {
      title: old ? 'Learning group updated' : 'Learning group created',
      detail: name,
      actorId: actor.id,
      actorName: actor.name,
      branchId,
      category: 'group',
      icon: 'users',
      route: 'groups',
    });
    const enrolled = next.autoEnroll ? assignGroup(state, next.id, actor) : 0;
    return { group: next, enrolled };
  }
  const canEditAnnouncement = (actor, state, item) =>
    Auth.isCurrent(actor) &&
    (actor.role === 'admin' || (staff(actor, state, item.branchId) && item.createdBy === actor.id));
  function saveAnnouncement(state, values, id, actor = Auth.current()) {
    const old = state.announcements.find((a) => a.id === id);
    if (id && (!old || !canEditAnnouncement(actor, state, old)))
      throw new Error('You can only edit announcements you manage.');
    const branchId = actor?.role === 'mompreneur' ? actor.branchId : values.branchId;
    if (!staff(actor, state, branchId)) throw new Error('Choose a club you manage.');
    const audience = actor.role === 'mompreneur' ? 'learners' : values.audience;
    const title = String(values.title || '').trim(),
      body = String(values.body || '').trim();
    if (!title || title.length > 100 || !body || body.length > 2000)
      throw new Error('Add a title (up to 100 characters) and a message (up to 2,000 characters).');
    if (
      !['all', 'learners', 'mompreneurs'].includes(audience) ||
      !['draft', 'published', 'archived'].includes(values.status)
    )
      throw new Error('Choose a valid audience and publishing status.');
    const changed =
      !old ||
      old.title !== title ||
      old.body !== body ||
      old.branchId !== branchId ||
      old.audience !== audience ||
      old.status !== values.status;
    const next = {
      id: old?.id || Data.id('notice'),
      title,
      body,
      branchId,
      audience,
      status: values.status,
      createdBy: old?.createdBy || actor.id,
      authorName: old?.authorName || actor.name,
      createdAt: old?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      revision: changed ? Data.id('revision') : old.revision,
    };
    if (old) Object.assign(old, next);
    else state.announcements.unshift(next);
    record(state, {
      title:
        next.status === 'published'
          ? 'Announcement published'
          : next.status === 'archived'
            ? 'Announcement archived'
            : 'Announcement draft saved',
      detail: title,
      actorId: actor.id,
      actorName: actor.name,
      branchId,
      category: 'announcement',
      icon: 'mail',
      route: 'announcements',
    });
    return next;
  }
  function visibleAnnouncements(state, profile) {
    if (!profile) return [];
    return state.announcements
      .filter(
        (a) =>
          a.status === 'published' &&
          (a.branchId === 'all' || a.branchId === profile.branchId) &&
          (a.audience === 'all' ||
            a.audience === (profile.role === 'learner' ? 'learners' : 'mompreneurs'))
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  const isRead = (state, profile, item) =>
    (state.announcementReads[profile.id] || []).includes(`${item.id}:${item.revision}`);
  function markRead(id) {
    const state = Data.read(),
      profile = Auth.current(),
      item = visibleAnnouncements(state, profile).find((a) => a.id === id);
    if (!item) return;
    const read = new Set(state.announcementReads[profile.id] || []);
    read.add(`${item.id}:${item.revision}`);
    state.announcementReads[profile.id] = [...read];
    Data.save(state);
  }
  function setRules(state, mode, actor = Auth.current()) {
    if (!Auth.isCurrent(actor) || actor.role !== 'admin')
      throw new Error('KIA Admin manages learning rules.');
    if (!['free', 'sequential'].includes(mode)) throw new Error('Choose a lesson order.');
    state.courses.find((c) => c.id === 'robotics').lessonOrder = mode;
    record(state, {
      title: 'Robotics learning rules updated',
      detail:
        mode === 'sequential' ? 'Lessons completed in sequence' : 'Lessons available in any order',
      actorId: actor.id,
      actorName: actor.name,
      branchId: 'all',
      category: 'course',
      icon: 'course',
      route: 'courses',
    });
  }
  const canOpenLesson = (id, completed) => window.KIALearning.canOpenLesson(id, completed);
  const csvCell = (value) => {
    let v = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(v)) v = "'" + v;
    return '"' + v.replace(/"/g, '""') + '"';
  };
  function downloadCSV(name, rows) {
    const blob = new Blob(['\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8',
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  window.KIALMS = {
    staff,
    record,
    category,
    members,
    saveGroup,
    assignGroup,
    saveAnnouncement,
    canEditAnnouncement,
    visibleAnnouncements,
    isRead,
    markRead,
    setRules,
    canOpenLesson,
    downloadCSV,
  };
})();
