/* KIA design prototype. All learning content and progress below are sample data.
   Browser storage is for preview convenience only, not an authenticated backend. */
(() => {
  'use strict';
  const esc = window.KIASecurity.escapeHTML;
  if (!window.KIALearner) return;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const icon = (name, extra = '') =>
    `<svg class="icon ${extra}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const Learning = window.KIALearning,
    Player = window.KIAPlayer,
    courseId = Learning.selectedCourseId(),
    currentCourse = Learning.course(courseId);
  const { modules, lessons, resources, readProgress, saveProgress } = Learning;
  if (!Learning.unlocked(window.KIALearner, courseId)) {
    document.querySelector('main').innerHTML =
      '<p class="media-status">No course is available. Ask your Mompreneur to check your enrolment.</p>';
    return;
  }
  let { completed, quizScores } = readProgress();
  const save = () => saveProgress(completed, quizScores);
  const nextLesson = () => lessons.find((l) => !completed.has(l.id));
  let openModule = nextLesson()?.mi ?? 0;
  const typeIcon = (type) =>
    ({ Video: 'play', Images: 'image', GIF: 'play', Text: 'file', Embedded: 'link' })[type] ||
    'book';
  const moduleLessons = (mi) => lessons.filter((l) => l.mi === mi);
  function toast(message) {
    $('#toast').textContent = message;
    $('#toast').hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      $('#toast').hidden = true;
    }, 3200);
  }
  function lessonRow(lesson) {
    const locked = !window.KIALMS.canOpenLesson(lesson.id, completed);
    const done = completed.has(lesson.id);
    const next = nextLesson()?.id === lesson.id;
    return `<button class="lesson-row ${locked ? 'is-locked' : ''} ${done ? 'is-done' : ''} ${next ? 'is-next' : ''}" data-lesson="${esc(lesson.id)}" ${locked ? 'disabled aria-label="Locked lesson: complete earlier lessons first"' : ''}><span class="lesson-type">${icon(done ? 'check' : typeIcon(lesson.type))}</span><span class="lesson-details"><strong>${esc(lesson.title)}</strong><small>Lesson ${lesson.li + 1} · ${lesson.type}${locked ? ' · Complete earlier lessons to unlock' : done ? ' · Completed' : next ? ' · Up next' : ''}</small></span><span class="lesson-meta">${esc(lesson.duration)} min</span>${icon(next ? 'arrow' : 'chevron')}</button>`;
  }
  function renderModules() {
    $('#module-list').innerHTML = modules
      .map((module, mi) => {
        const all = moduleLessons(mi);
        const count = all.filter((l) => completed.has(l.id)).length;
        const done = all.length > 0 && count === all.length;
        const current = nextLesson()?.mi === mi;
        const preview = current
          ? all.filter((l) => !completed.has(l.id)).slice(0, 3)
          : all.slice(0, 3);
        const state = done ? 'Completed' : count ? 'In progress' : 'Not started';
        return `<article class="module ${done ? 'is-complete' : ''} ${current ? 'is-current' : ''}"><h3><button class="module-toggle" id="module-toggle-${mi}" aria-expanded="${openModule === mi}" aria-controls="module-panel-${mi}" data-toggle-module="${mi}"><span class="module-index">${done ? icon('check') : String(mi + 1).padStart(2, '0')}</span><span class="module-copy"><span class="module-kicker">MODULE ${String(mi + 1).padStart(2, '0')}${current ? '<em>YOU ARE HERE</em>' : ''}</span><span class="module-title">${esc(module.title)}</span><span class="module-subtitle">${all.length} lessons · ${module.quizzes} ${module.quizzes === 1 ? 'quiz' : 'quizzes'}</span></span><span class="module-status">${state}${count && !done ? `<span class="mini-track"><span style="width:${(count / all.length) * 100}%"></span></span>` : ''}</span>${icon('chevron', 'chevron')}</button></h3><div class="module-content" id="module-panel-${mi}" role="region" aria-labelledby="module-toggle-${mi}" ${openModule === mi ? '' : 'hidden'}><div class="module-content-heading"><span>${current ? 'PICK UP WHERE YOU LEFT OFF' : done ? 'REVISIT YOUR LESSONS' : 'EXPLORE THIS MODULE'}</span><span>${icon('check')}${count} of ${all.length} complete</span></div>${preview.map(lessonRow).join('')}<div class="module-footer"><button class="text-button" data-open-module="${mi}">View all ${all.length} lessons ${icon('arrow')}</button><button class="text-button quiz-hint" data-module-quizzes="${mi}">${icon('quiz')}${module.quizzes} ${module.quizzes === 1 ? 'quiz' : 'quizzes'}</button></div></div></article>`;
      })
      .join('');
  }
  function render() {
    renderModules();
    $('.course-meta').textContent = `${modules.length} modules · ${lessons.length} lessons`;
    const quizTotal = currentCourse.modules.flatMap(Learning.assessments).length;
    $$('[data-modules-done] + .total').forEach((n) => (n.textContent = ` / ${modules.length}`));
    $$('[data-lessons-done] + .total').forEach((n) => (n.textContent = ` / ${lessons.length}`));
    $$('[data-quizzes-done] + .total').forEach((n) => (n.textContent = ` / ${quizTotal}`));
    let rule = document.querySelector('.learning-rule-note');
    if (!rule) {
      rule = document.createElement('p');
      rule.className = 'learning-rule-note';
      document.querySelector('.learning-layout').before(rule);
    }
    rule.innerHTML =
      currentCourse.lessonOrder === 'sequential'
        ? '<strong>Step by step:</strong> complete each lesson to unlock the next. You can revisit completed lessons and practise quizzes.'
        : '<strong>Your learning journey:</strong> explore lessons in any order, or use Resume lesson to continue where you left off.';
    const count = completed.size;
    const percent = lessons.length ? Math.round((count / lessons.length) * 100) : 0;
    const moduleCount = modules.filter(
      (_, mi) => moduleLessons(mi).length > 0 && moduleLessons(mi).every((l) => completed.has(l.id))
    ).length;
    $$('[data-lessons-done]').forEach((el) => {
      el.textContent = count;
    });
    $$('[data-modules-done]').forEach((el) => {
      el.textContent = moduleCount;
    });
    $$('[data-quizzes-done]').forEach((el) => {
      el.textContent = Object.keys(quizScores).length;
    });
    $$('[data-progress]').forEach((el) => {
      el.textContent = percent + '%';
    });
    $$('[data-progress-fill]').forEach((el) => {
      el.style.width = percent + '%';
    });
    $('[role="progressbar"]').setAttribute('aria-valuenow', count);
    $('[role="progressbar"]').setAttribute(
      'aria-valuetext',
      `${count} of ${lessons.length} lessons completed`
    );
    $('[role="progressbar"]').setAttribute('aria-valuemax', lessons.length || 1);
    const next = nextLesson();
    $('#resume-button').disabled = !lessons.length;
    $('#resume-context').textContent = next
      ? `Module ${next.mi + 1} · ${modules[next.mi].title}`
      : lessons.length
        ? `All ${lessons.length} lessons completed · Keep practising at your club`
        : 'Your course content is being prepared';
    $('#resume-lesson').innerHTML = next
      ? `${esc(next.title)}<small>Lesson ${next.li + 1} · ${next.duration} min</small>`
      : `Great work, ${esc(window.KIALearner.name.split(' ')[0])}!<small>Revisit your favourite lessons.</small>`;
    $('#resume-button').innerHTML =
      `${icon(next ? 'play' : 'book', 'play-icon')}${next ? 'Resume lesson' : 'Review course'}${icon('arrow', 'arrow-icon')}`;
    $('#completed-list').innerHTML =
      modules
        .map((module, mi) => {
          const done = moduleLessons(mi).filter((l) => completed.has(l.id));
          return done.length
            ? `<section class="completed-group"><h3>Module ${mi + 1} · ${esc(module.title)}</h3>${done.map(lessonRow).join('')}</section>`
            : '';
        })
        .join('') ||
      '<p class="resource-note">Your completed lessons will appear here. Start with your first Robotics lesson.</p>';
    const latestDone = modules
      .map((m, mi) => ({ m, mi }))
      .filter(
        ({ mi }) =>
          moduleLessons(mi).length > 0 && moduleLessons(mi).every((l) => completed.has(l.id))
      )
      .at(-1);
    if (latestDone) {
      $('#milestone-heading').textContent =
        latestDone.mi === 0 ? 'First module. Done!' : `Module ${latestDone.mi + 1}. Done!`;
      $('.milestone-card p').textContent =
        `${latestDone.m.title} is complete. Keep that curiosity going.`;
    } else {
      $('#milestone-heading').textContent = 'Your journey has started';
      $('.milestone-card p').textContent = 'Your next milestone is completing your first module.';
    }
  }
  $('#resource-list').innerHTML =
    resources
      .map(
        (resource) =>
          `<button class="resource-item" data-resource="${esc(resource.id)}"><span class="resource-icon ${resource.color}">${icon(resource.icon)}</span><div><h3>${esc(resource.title)}</h3><p>${resource.kind} · View only</p></div>${icon('eye')}</button>`
      )
      .join('') || '<p class="media-status">KIA will add resources for this course here.</p>';

  function selectTab(id, focus = false) {
    $$('[role="tab"]').forEach((tab) => {
      const active = tab.id === id;
      tab.setAttribute('aria-selected', active);
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
      if (active && focus) tab.focus();
    });
  }
  $$('[role="tab"]').forEach((tab, index, tabs) => {
    tab.addEventListener('click', () => selectTab(tab.id));
    tab.addEventListener('keydown', (e) => {
      let next;
      if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next !== undefined) {
        e.preventDefault();
        selectTab(tabs[next].id, true);
      }
    });
  });
  $('#review-completed').addEventListener('click', () => {
    selectTab('tab-completed', true);
    $('.course-workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('#resume-button').addEventListener('click', () => {
    const lesson = nextLesson();
    if (lesson) openLesson(lesson.id);
    else {
      selectTab('tab-completed', true);
      $('.course-workspace').scrollIntoView();
    }
  });
  $('.course-workspace').addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-toggle-module]');
    if (toggle) {
      const mi = Number(toggle.dataset.toggleModule);
      openModule = openModule === mi ? null : mi;
      $$('[data-toggle-module]').forEach((button) => {
        const id = Number(button.dataset.toggleModule);
        button.setAttribute('aria-expanded', id === openModule);
        $(`#module-panel-${id}`).hidden = id !== openModule;
      });
    }
  });

  const dialog = $('#learning-dialog');
  let lastTrigger = null;
  function showDialog(title, eyebrow, body) {
    Player.dispose($('#dialog-content'));
    if (!dialog.open) lastTrigger = document.activeElement;
    $('#dialog-title').textContent = title;
    $('#dialog-eyebrow').textContent = eyebrow;
    $('#dialog-content').innerHTML = body;
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('modal-open');
    dialog.scrollTop = 0;
    $('.dialog-close').focus();
  }
  $('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    const rect = dialog.getBoundingClientRect();
    if (
      e.target === dialog &&
      (e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom)
    )
      dialog.close();
  });
  dialog.addEventListener('close', () => {
    Player.dispose($('#dialog-content'));
    document.body.classList.remove('modal-open');
    if (lastTrigger?.isConnected) lastTrigger.focus();
  });

  function openLesson(id) {
    const lesson = lessons.find((l) => l.id === id);
    if (!lesson) return;
    if (!Learning.canOpenLesson(id, completed, courseId)) {
      toast('Complete the earlier lessons to unlock this one.');
      return;
    }
    showDialog(
      lesson.title,
      `MODULE ${lesson.mi + 1} · LESSON ${lesson.li + 1} · ${esc(lesson.duration)} MIN`,
      `<div id="lesson-content"></div><div id="lesson-quiz"></div><div class="lesson-actions"><button class="button primary" data-complete="${esc(id)}" ${lesson.type === 'Quiz' && quizScores[id] === undefined ? 'disabled' : ''}>${icon('check')}${completed.has(id) ? 'Completed · next lesson' : 'Mark lesson complete'}</button><button class="button secondary" data-open-module="${lesson.mi}">All module lessons</button></div>`
    );
    Player.lesson($('#lesson-content'), lesson, courseId);
    if (lesson.type === 'Quiz')
      Player.quiz(
        $('#lesson-quiz'),
        lesson.questions,
        (score) => {
          quizScores[id] = score;
          save();
          render();
          $('[data-complete]').disabled = false;
        },
        quizScores[id]
      );
  }
  function moduleQuizzes(mi) {
    return Learning.assessments(currentCourse.modules[mi]);
  }
  function openModulePreview(mi, quizzesOnly = false) {
    const module = modules[mi];
    if (!module) return;
    const quizzes = moduleQuizzes(mi);
    showDialog(
      module.title,
      `MODULE ${mi + 1} · ${module.lessons.length} LESSONS · ${quizzes.length} QUIZZES`,
      `${quizzesOnly ? '' : moduleLessons(mi).map(lessonRow).join('')}<h3>Module quizzes</h3>${
        quizzes
          .map((q, qi) => {
            const score = quizScores[q.id];
            const locked = q.lessonId && !Learning.canOpenLesson(q.lessonId, completed, courseId);
            return `<button class="lesson-row" data-quiz="${mi},${qi}" ${locked ? 'disabled' : ''}><span class="lesson-type">${icon('quiz')}</span><span class="lesson-details"><strong>${esc(q.title)}</strong><small>${locked ? 'Complete earlier lessons to unlock' : score === undefined ? 'Not completed' : `Completed · ${score}%`}${q.sample ? ' · Sample quiz' : ''}</small></span>${icon('arrow')}</button>`;
          })
          .join('') || '<p class="media-status">No quizzes have been added to this module.</p>'
      }`
    );
  }
  function openQuiz(mi, qi) {
    const q = moduleQuizzes(mi)[qi];
    if (!q) return;
    if (q.lessonId) return openLesson(q.lessonId);
    showDialog(
      q.title,
      q.sample ? 'PRACTICE QUIZ · SAMPLE QUESTIONS' : 'COURSE QUIZ',
      '<div id="player-quiz"></div>'
    );
    Player.quiz(
      $('#player-quiz'),
      q.questions,
      (score) => {
        quizScores[q.id] = score;
        save();
        render();
      },
      quizScores[q.id]
    );
  }
  function openResource(id) {
    const resource = resources.find((r) => r.id === id);
    if (!resource) return;
    showDialog(
      resource.title,
      `${resource.type.toUpperCase()} · VIEW ONLY`,
      '<div id="resource-player"></div>'
    );
    Player.resource($('#resource-player'), resource);
  }
  document.addEventListener('click', (e) => {
    const action = e.target.closest(
      '[data-lesson], [data-open-module], [data-module-quizzes], [data-resource], [data-complete], [data-quiz]'
    );
    if (!action) return;
    if (action.dataset.lesson) openLesson(action.dataset.lesson);
    else if (action.dataset.openModule !== undefined)
      openModulePreview(Number(action.dataset.openModule));
    else if (action.dataset.moduleQuizzes !== undefined)
      openModulePreview(Number(action.dataset.moduleQuizzes), true);
    else if (action.dataset.resource) openResource(action.dataset.resource);
    else if (action.dataset.quiz) {
      const [mi, qi] = action.dataset.quiz.split(',').map(Number);
      openQuiz(mi, qi);
    } else if (action.dataset.complete) {
      const id = action.dataset.complete;
      if (!window.KIALMS.canOpenLesson(id, completed)) {
        toast('Complete the earlier lessons first.');
        return;
      }
      const wasComplete = completed.has(id);
      try {
        completed.add(id);
        save();
      } catch (error) {
        completed.delete(id);
        toast(error.message);
        return;
      }
      const next = nextLesson();
      openModule = next?.mi ?? 0;
      render();
      if (wasComplete && next) openLesson(next.id);
      else {
        dialog.close();
        toast(
          next
            ? 'Lesson complete. Your progress has been updated.'
            : 'All lessons complete. Great work!'
        );
        $('#resume-button').focus();
      }
    }
  });
  $('#notification-button').addEventListener('click', () => {
    const open = $('#notifications').hidden;
    $('#notifications').hidden = !open;
    $('#notification-button').setAttribute('aria-expanded', open);
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.notification-wrap') || e.target.closest('#notifications a')) {
      $('#notifications').hidden = true;
      $('#notification-button').setAttribute('aria-expanded', false);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('#notifications').hidden) {
      $('#notifications').hidden = true;
      $('#notification-button').setAttribute('aria-expanded', false);
      $('#notification-button').focus();
    }
  });
  const assignedCourses = window.KIAAdminData.read().courses.filter((c) =>
    Learning.assigned(window.KIALearner, c)
  );
  if (assignedCourses.length > 1) {
    const picker = document.createElement('div');
    picker.className = 'course-picker';
    picker.innerHTML = `<label for="learning-course-picker">My assigned courses</label><select id="learning-course-picker">${assignedCourses.map((c) => `<option value="${esc(c.id)}" ${c.id === courseId ? 'selected' : ''}>${esc(c.title)}</option>`).join('')}</select>`;
    $('.learning-summary').before(picker);
    picker
      .querySelector('select')
      .addEventListener(
        'change',
        (e) => (location.href = 'my-learning.html?course=' + encodeURIComponent(e.target.value))
      );
  }
  $('.course-label').innerHTML =
    '<span class="label-dot"></span>YOUR ASSIGNED COURSE <span class="course-label-divider">/</span> ' +
    esc(currentCourse.title.toUpperCase());
  $('.page-intro').textContent = `Your ${currentCourse.title} journey, one discovery at a time.`;
  $('.course-workspace').setAttribute('aria-label', currentCourse.title + ' course');
  render();
  // Dashboard links open the relevant learning view directly.
  const entry = new URLSearchParams(location.search);
  if (['modules', 'completed', 'resources'].includes(entry.get('view')))
    selectTab('tab-' + entry.get('view'));
  if (entry.get('resume') === '1') {
    const lesson = nextLesson();
    if (lesson) openLesson(lesson.id);
    else selectTab('tab-completed');
  } else if (entry.get('quizzes') === '1') openModulePreview(nextLesson()?.mi ?? 0, true);
  else if (entry.has('resource')) openResource(entry.get('resource'));
  else if (entry.get('schedule') === '1') location.replace('schedule.html');
  else if (entry.has('module')) {
    const mi = Number(entry.get('module'));
    if (Number.isInteger(mi) && mi >= 0 && mi < modules.length) openModulePreview(mi);
  }
})();
