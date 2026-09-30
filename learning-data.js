/* Shared sample curriculum and demo progress for the learner pages.
   Production data and permissions must come from the backend. */
(() => {
  'use strict';
  const seedModules = [
    {
      title: 'Introduction to Robotics',
      quizzes: 2,
      lessons: [
        ['Welcome to Robotics', 'Video', 8],
        ['What Is a Robot?', 'Text', 10],
        ['Meet Your Robotics Kit', 'Images', 12],
        ['Robot Parts and Their Jobs', 'Text', 10],
        ['Staying Safe While Building', 'Video', 8],
        ['Your First Robot Build', 'Video', 20],
        ['Test Your Robot', 'Embedded', 15],
        ['Module 1 Wrap-up', 'Text', 5],
      ],
    },
    {
      title: 'Sensors and Movement',
      quizzes: 2,
      lessons: [
        ['How Robots Sense', 'Video', 12],
        ['Meet the Sensors', 'Images', 10],
        ['Making Connections', 'Text', 12],
        ['Reading Sensor Signals', 'GIF', 8],
        ['Ultrasonic Sensor Introduction', 'Video', 18],
        ['Making Your Robot Move', 'Video', 16],
        ['Avoiding Obstacles', 'Embedded', 15],
        ['Sensors in Action', 'Text', 10],
      ],
    },
    {
      title: 'Programming Basics',
      quizzes: 1,
      lessons: [
        ['Giving Your Robot Instructions', 'Text', 10],
        ['Your First Sequence', 'Embedded', 15],
        ['Loops and Repetition', 'GIF', 12],
        ['Decisions and Conditions', 'Video', 18],
      ],
    },
    {
      title: 'Build and Test',
      quizzes: 1,
      lessons: [
        ['Plan Your Robot', 'Text', 10],
        ['Assemble Your Design', 'Images', 20],
        ['Test and Improve', 'Video', 15],
        ['Solve a Design Challenge', 'Embedded', 20],
      ],
    },
    {
      title: 'Robotics Challenges',
      quizzes: 2,
      lessons: [
        ['Follow the Path', 'Video', 15],
        ['Navigate a Maze', 'Embedded', 20],
        ['Carry a Small Load', 'Images', 15],
        ['Fine-tune Your Code', 'Text', 15],
      ],
    },
    {
      title: 'Your Final Project',
      quizzes: 2,
      lessons: [
        ['Choose Your Big Idea', 'Text', 10],
        ['Build Your Prototype', 'Images', 25],
        ['Test Your Solution', 'Embedded', 20],
        ['Share What You Learned', 'Text', 10],
      ],
    },
  ];

  const sampleQuestions = [
    {
      text: 'What is a good first step before changing your robot?',
      options: ['Predict what the change will do', 'Change everything at once', 'Skip testing'],
      answer: 0,
    },
    {
      text: 'What should you do after testing a new idea?',
      options: [
        'Ignore the result',
        'Compare the result with your prediction',
        'Always start over',
      ],
      answer: 1,
    },
  ];
  const baseKey = 'kia-my-learning-preview-v1';
  const profileId = () =>
    window.KIAStorage?.read('kia-account-session-preview-v1')?.userId || 'learner-1';
  const state = () => window.KIAAdminData.read();
  const course = (id) => state().courses.find((c) => c.id === id);
  const assigned = (u, c) =>
    !!u &&
    !!c &&
    c.status === 'published' &&
    u.courseIds.includes(c.id) &&
    (u.role === 'mompreneur' || c.audience === 'learners');
  function selectedCourseId() {
    const id = new URLSearchParams(location.search).get('course') || 'robotics';
    const s = state(),
      u = s.users.find((u) => u.id === profileId());
    return assigned(
      u,
      s.courses.find((c) => c.id === id)
    )
      ? id
      : 'robotics';
  }
  const flatten = (c) =>
    (c?.modules || []).flatMap((m, mi) =>
      m.lessons.map((l, li) => ({ ...l, mi, li, moduleId: m.id }))
    );
  const listLessons = (id = 'robotics') => flatten(course(id));
  function assessments(m) {
    return [
      ...(m.quizzes || []),
      ...m.lessons
        .filter((l) => l.type === 'Quiz')
        .map((l) => ({ id: l.id, title: l.title, questions: l.questions || [], lessonId: l.id })),
    ];
  }
  function readCourseProgress(userId, courseId = 'robotics', s = state()) {
    const c = s.courses.find((c) => c.id === courseId),
      ids = new Set(flatten(c).map((l) => l.id));
    const saved = s.learningProgress?.[userId]?.[courseId] || {};
    const completed = new Set((saved.completed || []).filter((id) => ids.has(id)));
    const quizIds = new Set((c?.modules || []).flatMap(assessments).map((q) => q.id));
    const quizScores = Object.fromEntries(
      Object.entries(saved.quizScores || {}).filter(
        ([id, n]) => quizIds.has(id) && Number.isFinite(n) && n >= 0 && n <= 100
      )
    );
    return {
      completed,
      quizScores,
      completedAt: saved.completedAt || {},
      total: ids.size,
      percent: ids.size ? Math.round((completed.size / ids.size) * 100) : 0,
    };
  }
  function unlocked(user, courseId, s = state()) {
    const c = s.courses.find((c) => c.id === courseId);
    if (!assigned(user, c)) return false;
    if (user.role === 'mompreneur' && courseId === 'facilitation') {
      const p = readCourseProgress(user.id, 'onboarding', s);
      return p.total > 0 && p.completed.size === p.total;
    }
    return true;
  }
  function canOpenLesson(id, completed, courseId = selectedCourseId()) {
    const c = course(courseId),
      all = flatten(c),
      index = all.findIndex((l) => l.id === id);
    return (
      index >= 0 &&
      (c.lessonOrder !== 'sequential' ||
        completed.has(id) ||
        all.slice(0, index).every((l) => completed.has(l.id)))
    );
  }
  function saveCourseProgress(courseId, completed, quizScores) {
    const s = state(),
      u = s.users.find((u) => u.id === profileId()),
      c = s.courses.find((c) => c.id === courseId);
    if (!unlocked(u, courseId, s))
      throw new Error('Complete your onboarding before opening this course.');
    const previous = readCourseProgress(u.id, courseId, s),
      all = flatten(c),
      ids = new Set(all.map((l) => l.id));
    if ([...completed].some((id) => !ids.has(id)))
      throw new Error('This lesson is not in the course.');
    const additions = [...completed].filter((id) => !previous.completed.has(id));
    if (additions.some((id) => !canOpenLesson(id, previous.completed, courseId)))
      throw new Error('Complete the earlier lessons first.');
    if (
      additions.some(
        (id) => all.find((l) => l.id === id)?.type === 'Quiz' && !Number.isFinite(quizScores[id])
      )
    )
      throw new Error('Submit the quiz before marking it complete.');
    const now = new Date().toISOString(),
      completedAt = { ...previous.completedAt };
    additions.forEach((id) => (completedAt[id] = now));
    s.learningProgress[u.id] = s.learningProgress[u.id] || {};
    s.learningProgress[u.id][courseId] = {
      completed: [...completed],
      quizScores: { ...quizScores },
      completedAt,
    };
    if (courseId === 'robotics' && u.role === 'learner')
      u.progress = all.length ? Math.round((completed.size / all.length) * 100) : 0;
    u.lastLearningAt = now;
    additions.forEach((id) =>
      window.KIALMS?.record(s, {
        title: 'Lesson completed',
        detail: `${u.name} · ${all.find((l) => l.id === id).title}`,
        actorId: u.id,
        actorName: u.name,
        branchId: u.branchId,
        category: 'learning',
        icon: 'check',
        route: 'users',
      })
    );
    Object.entries(quizScores)
      .filter(([id, score]) => previous.quizScores[id] !== score)
      .forEach(([id, score]) =>
        window.KIALMS?.record(s, {
          title: 'Quiz result saved',
          detail: `${u.name} · ${id} · ${score}%`,
          actorId: u.id,
          actorName: u.name,
          branchId: u.branchId,
          category: 'learning',
          icon: 'course',
          route: 'users',
        })
      );
    window.KIAAdminData.save(s);
  }
  function completeLesson(courseId, id) {
    const p = readCourseProgress(profileId(), courseId);
    p.completed.add(id);
    saveCourseProgress(courseId, p.completed, p.quizScores);
  }
  window.KIALearning = {
    seedModules,
    sampleQuestions,
    profileId,
    course,
    assigned,
    unlocked,
    listLessons,
    assessments,
    readCourseProgress,
    saveCourseProgress,
    completeLesson,
    canOpenLesson,
    selectedCourseId,
    get modules() {
      return (course(selectedCourseId())?.modules || []).map((m) => ({
        ...m,
        lessons: m.lessons.map((l) => [l.title, l.type, l.duration]),
        quizzes: assessments(m).length,
      }));
    },
    get lessons() {
      return listLessons(selectedCourseId());
    },
    get resources() {
      return state()
        .content.filter((r) => r.courseId === selectedCourseId())
        .map((r) => ({
          ...r,
          kind: r.type,
          icon: { Video: 'play', Image: 'image', GIF: 'play', Embedded: 'link' }[r.type] || 'file',
          color: 'blue',
        }));
    },
    get storageKey() {
      return window.KIAAdminData.key;
    },
    readProgress: () => readCourseProgress(profileId(), selectedCourseId()),
    saveProgress: (completed, quizScores) =>
      saveCourseProgress(selectedCourseId(), completed, quizScores),
  };
})();
