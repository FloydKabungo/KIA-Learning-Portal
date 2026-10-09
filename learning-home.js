/* Visual learner home, using the same local progress as My Learning. */
(async () => {
  'use strict';
  await window.KIALearnerReady;
  if (!window.KIALearner) return;
  const $ = s => document.querySelector(s), L = window.KIALearning;
  function render() {
    if (!window.KIAPreview.checkPage()) return;
    const { lessons } = L, { completed } = L.readProgress();
    $('[data-home-name]').textContent = window.KIALearner.name.split(' ')[0];
    $('[data-home-course]').textContent = L.course('robotics')?.title || 'Robotics';
    const percent = lessons.length ? Math.round(completed.size / lessons.length * 100) : 0;
    $('[data-home-completed]').textContent = `${completed.size} / ${lessons.length}`;
    $('[data-home-progress]').style.width = percent + '%';
    $('[role=progressbar]').setAttribute('aria-valuenow', percent);
    const next = lessons.find(l => !completed.has(l.id) && window.KIARelease.lessonStatus(l.id).open);
    const pending = lessons.find(l => !completed.has(l.id)), resume = $('[data-home-resume]');
    $('#home-next-title').textContent = next ? 'Ready to build?' : pending ? 'You’re up to date!' : 'You did it!';
    $('[data-home-context]').textContent = next ? next.title : pending ? 'Next module: ' + window.KIARelease.lessonStatus(pending.id).message : 'Pick a favourite lesson.';
    resume.href = next ? 'my-learning.html?resume=1' : pending ? 'my-learning.html' : 'my-learning.html?view=completed';
    resume.querySelector('span').textContent = next ? 'Let’s go' : pending ? 'Explore modules' : 'Play it again';
    const { sessions, formatDate } = window.KIAClubSchedule;
    const session = sessions.find(s => s.date >= window.KIASecurity.currentDay());
    $('[data-home-session]').textContent = session ? `${formatDate(session.date,{day:'numeric',month:'short'})} · ${session.start}` : 'No class booked';
  }
  window.addEventListener('pageshow', render);
  window.addEventListener('kia-progress-preview', render);
  render();
})();
