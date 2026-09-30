/* Connect the existing learner dashboard to My Learning's shared demo state. */
(() => {
  'use strict';
  if (!window.KIALearner) return;
  const esc = window.KIASecurity.escapeHTML;
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const { modules, lessons, readProgress, storageKey } = window.KIALearning;
  function updateHome() {
    if (!window.KIAAccounts.checkPage()) return;
    const { completed, quizScores } = readProgress();
    $('.course-menu a:nth-child(1) small').textContent = `${modules.length} Modules`;
    $('.course-menu a:nth-child(2) small').textContent = `${lessons.length} Lessons`;
    $('.course-menu a:nth-child(3) small').textContent =
      `${modules.reduce((sum, m) => sum + m.quizzes, 0)} Quizzes`;
    const count = completed.size;
    const percent = lessons.length ? Math.round((count / lessons.length) * 100) : 0;
    const next = lessons.find((lesson) => !completed.has(lesson.id));
    $('.stat-green > strong').textContent = count;
    $('.stat-orange > strong').textContent = lessons.length - count;
    $('.stat-orange > span:last-of-type').textContent = 'Lessons Remaining';
    $('.stat-orange > small').textContent = next ? 'One step at a time' : 'All lessons complete';
    $('.overall-progress-number').textContent = percent + '%';
    $('.progress-panel > p').textContent = `${count} of ${lessons.length} lessons completed`;
    $$(
      '.progress-panel .progress-track > span, .course-progress-line .progress-track > span'
    ).forEach((fill) => {
      fill.style.width = percent + '%';
    });
    $('.course-progress-line > strong').textContent = percent + '%';
    $('.course-menu a:last-child small').textContent = `${count} / ${lessons.length} Completed`;
    if (next) {
      $('.lesson-panel > h3').textContent = `Module ${next.mi + 1}: ${modules[next.mi].title}`;
      $('.lesson-panel > h4').textContent = `Lesson ${next.li + 1}: ${next.title}`;
      $('.lesson-panel > p').textContent =
        'Open your current lesson to continue from where you stopped.';
      $('.lesson-duration').textContent = `${next.duration} min`;
      $('.lesson-panel .panel-heading > a').href = `my-learning.html?module=${next.mi}`;
    } else {
      $('.lesson-panel > h3').textContent = 'Your Robotics course';
      $('.lesson-panel > h4').textContent = 'All lessons completed';
      $('.lesson-panel > p').textContent =
        'Revisit your completed lessons and keep practising your skills.';
      $('.lesson-duration').textContent = 'Review course';
      $('.lesson-panel .panel-heading > a').href = 'my-learning.html?view=completed';
    }
    const completedModules = modules
      .map((module, mi) => ({ module, mi }))
      .filter(({ mi }) => lessons.filter((l) => l.mi === mi).every((l) => completed.has(l.id)));
    const latest = completedModules.at(-1);
    const achievement = $('.achievement-item:first-of-type');
    if (achievement) {
      achievement.querySelector('strong').textContent = latest
        ? `Module ${latest.mi + 1} Completed`
        : 'Your learning journey';
      achievement.querySelector('small').textContent = latest
        ? latest.module.title
        : `${count} lessons completed`;
    }
    const scores = Object.values(quizScores);
    const quizAchievement = $$('.achievement-item')[1];
    if (quizAchievement) {
      quizAchievement.querySelector('strong').textContent = `${scores.length} Quizzes Completed`;
      quizAchievement.querySelector('small').textContent = scores.length
        ? `Average score: ${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%`
        : 'Try your first practice quiz';
      quizAchievement.href = 'my-learning.html?quizzes=1';
    }
  }
  const assigned = window.KIAAdminData.read().courses.filter((c) =>
    window.KIALearning.assigned(window.KIALearner, c)
  );
  $('.stat-blue > strong').textContent = assigned.length;
  $('.stat-blue > small').textContent =
    assigned.length === 1 ? assigned[0].title : 'Your learning courses';
  const extra = assigned.filter((c) => c.id !== 'robotics');
  if (extra.length) {
    const block = document.createElement('section');
    block.className = 'extra-courses';
    block.innerHTML =
      '<h2>More assigned courses</h2>' +
      extra
        .map(
          (c) =>
            `<a href="my-learning.html?course=${encodeURIComponent(c.id)}"><strong>${esc(c.title)}</strong><span>Open course →</span></a>`
        )
        .join('');
    $('.course-panel').append(block);
  }
  const resourceIcon = $('.resource-card > span').outerHTML;
  $('.resource-grid').innerHTML =
    window.KIALearning.resources
      .slice(0, 5)
      .map(
        (r, i) =>
          `<a class="resource-card resource-${['blue', 'green', 'purple', 'orange', 'pink'][i % 5]}" href="my-learning.html?resource=${encodeURIComponent(r.id)}">${resourceIcon}<div><strong>${esc(r.title)}</strong><small>${esc(r.type)} · View only</small></div><b>◉</b></a>`
      )
      .join('') || '<p>KIA will add your course resources here.</p>';
  const { sessions, formatDate, timeRange, sessionURL } = window.KIAClubSchedule;
  $('.session-list').innerHTML =
    sessions
      .filter((s) => s.date >= window.KIASecurity.currentDay())
      .slice(0, 3)
      .map(
        (session, index) =>
          `<a class="session-item" href="${sessionURL(session)}"><span class="session-date"><strong>${formatDate(session.date, { month: 'short' }).toUpperCase()}</strong><span>${session.date.slice(-2)}</span></span><div><strong>${esc(session.title)}</strong><p>${timeRange(session)} SAST</p><small>${esc(session.location)} · In person${session.previousStart ? ' · Time updated' : ''}</small></div>${index === 0 ? '<span class="next-pill">Next</span>' : '<b>›</b>'}</a>`
      )
      .join('') || '<p class="subtle">Your Mompreneur will add your next club session here.</p>';
  $('.stat-purple > strong').textContent = sessions.filter(
    (s) => s.date >= window.KIASecurity.currentDay()
  ).length;
  const changed = sessions.find((session) => session.previousStart);
  $('.student-notification').addEventListener('click', () => {
    location.href = changed ? sessionURL(changed) : 'schedule.html';
  });
  window.addEventListener('pageshow', updateHome);
  window.addEventListener('storage', (event) => {
    if (event.key === storageKey) updateHome();
  });
  updateHome();
})();
