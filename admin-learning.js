/* Course delivery, training prerequisites and exact lesson reports for the frontend preview. */
window.createKIACourseFeatures = (ctx) => {
  'use strict';
  const {
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
    getState,
    getCourse,
    reload,
  } = ctx;
  const Learning = window.KIALearning,
    Player = window.KIAPlayer;
  const all = (c) => c.modules.flatMap((m) => m.lessons);
  const progress = (c) => Learning.readCourseProgress(actor.id, c.id, getState());
  function trainingView(id) {
    const state = getState(),
      courses = state.courses
        .filter((c) => Learning.assigned(actor, c))
        .sort(
          (a, b) =>
            ['onboarding', 'facilitation', 'robotics'].indexOf(a.id) -
            ['onboarding', 'facilitation', 'robotics'].indexOf(b.id)
        ),
      c = courses.find((c) => c.id === id);
    if (c && Learning.unlocked(actor, c.id, state)) {
      const p = progress(c);
      return (
        `<button class="text-link" data-action="back-courses">← My training</button>` +
        viewHeading(esc(c.title), esc(c.description)) +
        `<section class="panel training-progress">${progressBar(p.percent)}<p>${p.completed.size} of ${p.total} lessons completed</p></section><div class="module-list">${c.modules.map((m, mi) => `<details class="panel module-card" ${mi === 0 ? 'open' : ''}><summary><span class="module-number">${mi + 1}</span><div><strong>${esc(m.title)}</strong><small>${m.lessons.filter((l) => p.completed.has(l.id)).length} of ${m.lessons.length} lessons completed</small></div>${icon('down')}</summary><div class="lesson-list">${m.lessons.map((l) => `<div class="lesson-item">${icon(p.completed.has(l.id) ? 'check' : l.type === 'Video' ? 'play' : 'file')}<div><strong>${esc(l.title)}</strong><small>${esc(l.type)} · ${l.duration} min · ${p.completed.has(l.id) ? 'Completed' : 'Outstanding'}</small></div>${button(p.completed.has(l.id) ? 'Review' : 'Open', 'view-training-lesson', 'arrow', true, l.id)}</div>`).join('')}</div></details>`).join('') || '<p class="media-status">KIA is preparing the modules for this course.</p>'}</div>`
      );
    }
    return (
      viewHeading(
        'My Training',
        'Complete your onboarding, then unlock the facilitation course for your club.'
      ) +
      `<div class="course-grid">${courses
        .map((c, i) => {
          const p = progress(c),
            locked = !Learning.unlocked(actor, c.id, state);
          return `<article class="panel course-card ${locked ? 'is-locked' : ''}"><div class="card-top"><span class="round-icon tone-${['blue', 'green', 'purple'][i % 3]}">${icon(locked ? 'shield' : 'course')}</span>${pill(locked ? 'Locked' : p.percent === 100 ? 'Completed' : p.completed.size ? 'In progress' : 'Ready', locked ? 'gray' : p.percent === 100 ? 'green' : 'blue')}</div><h2>${esc(c.title)}</h2><p class="subtle">${esc(c.description)}</p><div class="training-progress">${progressBar(p.percent)}<p>${p.completed.size} of ${p.total} lessons completed</p></div>${locked ? '<p class="training-lock">Complete all Mompreneur Onboarding lessons to unlock this course.</p>' : `<div class="card-actions">${button(p.percent === 100 ? 'Review Course' : p.completed.size ? 'Continue Course' : 'Open Course', 'manage-course', 'arrow', false, c.id)}</div>`}</article>`;
        })
        .join('')}</div>`
    );
  }
  function trainingLesson(courseId, id) {
    const c = getState().courses.find((c) => c.id === courseId);
    if (!Learning.unlocked(actor, courseId, getState())) {
      toast('Complete Mompreneur Onboarding first.');
      return;
    }
    const lesson = all(c).find((l) => l.id === id);
    if (!lesson) return;
    const p = progress(c);
    openDialog(
      lesson.title,
      `<p class="subtle">${esc(c.title)} · ${esc(lesson.type)} · ${lesson.duration} min</p><div id="training-player"></div><div id="training-quiz"></div><div class="training-actions"><button class="button" data-action="complete-training" data-id="${esc(id)}" ${p.completed.has(id) || (lesson.type === 'Quiz' && p.quizScores[id] === undefined) ? 'disabled' : ''}>${icon('check')}${p.completed.has(id) ? 'Lesson completed' : 'Mark lesson complete'}</button><button class="button secondary" data-close-dialog>Back to course</button></div>`,
      'MY TRAINING'
    );
    Player.lesson(document.querySelector('#training-player'), lesson, courseId);
    if (lesson.type === 'Quiz')
      Player.quiz(
        document.querySelector('#training-quiz'),
        lesson.questions,
        (score) => {
          p.quizScores[id] = score;
          Learning.saveCourseProgress(courseId, p.completed, p.quizScores);
          reload();
          document.querySelector('[data-action="complete-training"]').disabled =
            p.completed.has(id);
        },
        p.quizScores[id]
      );
  }
  function completeTraining(courseId, id) {
    Learning.completeLesson(courseId, id);
    reload();
    trainingLesson(courseId, id);
    toast(
      courseId === 'onboarding' && Learning.unlocked(actor, 'facilitation')
        ? 'Onboarding complete! Facilitation Training is now unlocked.'
        : 'Lesson completed. Your training progress is saved.'
    );
  }
  function lessonReport(u) {
    const state = getState();
    return (
      state.courses
        .filter((c) => u.courseIds.includes(c.id))
        .map((c) => {
          const p = Learning.readCourseProgress(u.id, c.id, state);
          return `<section class="report-course"><h3>${esc(c.title)}</h3>${progressBar(p.percent)}<p class="subtle">${p.completed.size} completed · ${p.total - p.completed.size} outstanding</p>${c.modules
            .map(
              (m) =>
                `<details class="lesson-report"><summary><span>${esc(m.title)}</span><span>${m.lessons.filter((l) => p.completed.has(l.id)).length} / ${m.lessons.length}</span></summary><ul>${m.lessons.map((l) => `<li><span>${esc(l.title)}</span>${pill(p.completed.has(l.id) ? 'Completed' : 'Outstanding', p.completed.has(l.id) ? 'green' : 'amber')}</li>`).join('')}</ul>${
                  Learning.assessments(m).length
                    ? `<ul>${Learning.assessments(m)
                        .map(
                          (q) =>
                            `<li><span>Quiz: ${esc(q.title)}</span>${pill(p.quizScores[q.id] === undefined ? 'Not attempted' : `${p.quizScores[q.id]}%`, p.quizScores[q.id] === undefined ? 'gray' : 'blue')}</li>`
                        )
                        .join('')}</ul>`
                    : ''
                }</details>`
            )
            .join('')}</section>`;
        })
        .join('') || '<p class="subtle">No courses assigned.</p>'
    );
  }
  function setupBuilder(element, questions) {
    let list = structuredClone(
      questions?.length ? questions : [{ text: '', options: ['', '', ''], answer: 0 }]
    );
    const host = element.querySelector('.quiz-builder');
    const read = () =>
      [...host.querySelectorAll('.quiz-edit-question')].map((row) => ({
        text: row.querySelector('[data-question-text]').value.trim(),
        options: [...row.querySelectorAll('[data-answer-option]')].map((n) => n.value.trim()),
        answer: Number(row.querySelector('[data-correct-answer]').value),
      }));
    function render() {
      host.innerHTML = `<div class="quiz-builder-toolbar"><h3>Quiz questions</h3><button type="button" class="button secondary small-button" data-add-question>Add question</button></div>${list.map((q, i) => `<section class="quiz-edit-question"><div class="quiz-builder-toolbar"><strong>Question ${i + 1}</strong><button type="button" class="text-link" data-remove-question="${i}" ${list.length === 1 ? 'disabled' : ''}>Remove</button></div><div class="form-grid"><label class="field full"><span>Question</span><input data-question-text value="${esc(q.text)}" maxlength="500" required/></label>${q.options.map((a, ai) => `<label class="field"><span>Answer ${ai + 1}</span><input data-answer-option value="${esc(a)}" maxlength="250" required/></label>`).join('')}<label class="field"><span>Correct answer</span><select data-correct-answer>${q.options.map((_, ai) => `<option value="${ai}" ${q.answer === ai ? 'selected' : ''}>Answer ${ai + 1}</option>`).join('')}</select></label></div></section>`).join('')}`;
    }
    host.addEventListener('click', (e) => {
      if (e.target.closest('[data-add-question]')) {
        list = read();
        if (list.length >= 10) {
          toast('Use up to 10 questions in each quiz.');
          return;
        }
        list.push({ text: '', options: ['', '', ''], answer: 0 });
        render();
      } else if (e.target.matches('[data-remove-question]')) {
        list = read();
        list.splice(Number(e.target.dataset.removeQuestion), 1);
        render();
      }
    });
    render();
    return () => {
      const q = read();
      if (q.some((q) => !q.text || q.options.some((a) => !a)))
        throw new Error('Complete every quiz question and answer.');
      return q;
    };
  }
  function lessonForm(moduleId, lessonId) {
    const state = getState(),
      c = state.courses.find((c) => c.id === getCourse()),
      m = c?.modules.find((m) => m.id === moduleId);
    if (!m || actor.role !== 'admin') return;
    const old = m.lessons.find((l) => l.id === lessonId),
      l = old || { title: '', type: 'Text', duration: 10, body: '' };
    let readQuestions;
    const element = form(
      old ? 'Edit Lesson' : 'Add Lesson',
      input('title', 'Lesson title', l.title) +
        select(
          'type',
          'Content type',
          ['Video', 'Images', 'GIF', 'Text', 'Embedded', 'Quiz'].map((t) => [t, t]),
          l.type
        ) +
        input('duration', 'Estimated minutes', l.duration, 'number', 'required min="1" max="180"') +
        select(
          'resourceId',
          'Attach uploaded course resource',
          [
            ['', 'No attached resource'],
            ...state.content
              .filter((r) => r.courseId === c.id)
              .map((r) => [r.id, `${r.title} (${r.type})`]),
          ],
          l.resourceId || '',
          ''
        ) +
        input('url', 'Media or embed link (optional)', l.url || '', 'url', 'maxlength="2000"') +
        textarea('body', 'Lesson text / notes', l.body || '') +
        '<p class="field full subtle">Choose a resource from Content or paste a media link. Attached resources take priority over links. For YouTube or Vimeo, paste the video link.</p><div class="quiz-builder"></div>',
      (data) => {
        if (data.url) Player.safeURL(data.url);
        if (
          !['Video', 'Images', 'GIF', 'Text', 'Embedded', 'Quiz'].includes(data.type) ||
          !Number.isInteger(Number(data.duration)) ||
          Number(data.duration) < 1 ||
          Number(data.duration) > 180
        )
          throw new Error('Choose a valid lesson type and duration.');
        if (!data.title.trim()) throw new Error('Enter a lesson title.');
        if (
          data.resourceId &&
          !state.content.some((r) => r.id === data.resourceId && r.courseId === c.id)
        )
          throw new Error('Choose a resource for this course.');
        const next = {
          id: old?.id || window.KIAAdminData.id('lesson'),
          title: data.title.trim(),
          type: data.type,
          duration: Number(data.duration),
          body: data.body.trim(),
          url: data.url.trim(),
          resourceId: data.resourceId || '',
          questions: data.type === 'Quiz' ? readQuestions() : [],
        };
        if (old) Object.assign(old, next);
        else m.lessons.push(next);
        log(
          old ? 'Lesson updated' : 'Lesson added',
          `${next.title} · ${c.title}`,
          'content',
          null,
          'courses'
        );
        return 'Lesson saved. Its content is available in the assigned course.';
      },
      old ? 'Save Lesson' : 'Add Lesson'
    );
    readQuestions = setupBuilder(element, l.questions);
    const toggle = () => {
      const host = element.querySelector('.quiz-builder'),
        active = element.elements.type.value === 'Quiz';
      host.hidden = !active;
      host.querySelectorAll('input,select').forEach((n) => (n.disabled = !active));
    };
    element.elements.type.addEventListener('change', toggle);
    toggle();
  }
  function moduleQuizForm(moduleId, id) {
    if (actor.role !== 'admin') return;
    const c = getState().courses.find((c) => c.id === getCourse()),
      m = c?.modules.find((m) => m.id === moduleId),
      q = m?.quizzes?.find((q) => q.id === id);
    if (!q) return;
    let readQuestions;
    const element = form(
      'Edit Module Quiz',
      input('title', 'Quiz title', q.title) + '<div class="quiz-builder"></div>',
      (data) => {
        q.title = data.title.trim();
        q.questions = readQuestions();
        q.sample = false;
        log('Quiz updated', q.title, 'content', null, 'courses');
        return 'Quiz updated for this course.';
      },
      'Save Quiz'
    );
    readQuestions = setupBuilder(element, q.questions);
  }
  function moduleQuizRows(m) {
    return (m.quizzes || [])
      .map(
        (q) =>
          `<div class="lesson-item">${icon('course')}<div><strong>${esc(q.title)}</strong><small>Quiz · ${q.questions.length} questions${q.sample ? ' · Sample' : ''}</small></div><button class="text-link" data-action="edit-module-quiz" data-module="${esc(m.id)}" data-id="${esc(q.id)}">Edit ${icon('edit')}</button></div>`
      )
      .join('');
  }
  return {
    trainingView,
    trainingLesson,
    completeTraining,
    lessonReport,
    lessonForm,
    moduleQuizForm,
    moduleQuizRows,
  };
};
