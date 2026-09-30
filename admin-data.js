/* Frontend preview data only. Production accounts, branch permissions, uploads
   and audit records must be managed and authorised by the backend. */
(() => {
  'use strict';
  const key = 'kia-admin-preview-v1';
  const id = (prefix) => `${prefix}-${crypto.randomUUID()}`;
  function seed() {
    const branches = [
      {
        id: 'parklands',
        name: 'Parklands Club',
        location: 'Parklands, Cape Town',
        ownerId: 'mom-1',
        status: 'active',
      },
      {
        id: 'table-view',
        name: 'Table View Club',
        location: 'Table View, Cape Town',
        ownerId: 'mom-2',
        status: 'active',
      },
      {
        id: 'durbanville',
        name: 'Durbanville Club',
        location: 'Durbanville, Cape Town',
        ownerId: 'mom-3',
        status: 'active',
      },
      {
        id: 'bellville',
        name: 'Bellville Club',
        location: 'Bellville, Cape Town',
        ownerId: 'mom-4',
        status: 'active',
      },
    ];
    const names = [
      'Sean',
      'Lerato Dlamini',
      'Thabo Mthembu',
      'Zanele Nkosi',
      'Sipho Cele',
      'Amahle Jacobs',
      'Lwazi Mokoena',
      'Mia Williams',
      'Naledi Ndlovu',
      'Ethan Petersen',
      'Anele Maseko',
      'Ava Daniels',
      'Khanya Molefe',
      'Liam Adams',
      'Imani Zulu',
      'Zoe Naidoo',
    ];
    const progress = [38, 63, 100, 25, 50, 75, 100, 31, 16, 47, 59, 81, 44, 66, 28, 94];
    const users = names.map((name, i) => ({
      id: `learner-${i + 1}`,
      name,
      username: i === 0 ? 'student01' : `learner${String(i + 1).padStart(2, '0')}`,
      role: 'learner',
      branchId: branches[Math.floor(i / 4)].id,
      status: 'active',
      progress: progress[i],
      courseIds: ['robotics'],
      createdAt: '2026-09-28T10:00:00Z',
    }));
    ['Nomsa Dlamini', 'Ayesha Jacobs', 'Thandi Mokoena', 'Lerato Ndlovu'].forEach((name, i) =>
      users.push({
        id: `mom-${i + 1}`,
        name,
        username: `mompreneur0${i + 1}`,
        role: 'mompreneur',
        branchId: branches[i].id,
        status: 'active',
        progress: 0,
        courseIds: ['onboarding', 'facilitation', 'robotics'],
        createdAt: '2026-09-01T10:00:00Z',
      })
    );
    users.push({
      id: 'kia-admin',
      name: 'KIA Administrator',
      username: 'admin01',
      role: 'admin',
      branchId: null,
      status: 'active',
      progress: 0,
      courseIds: [],
      createdAt: '2026-09-01T10:00:00Z',
    });
    const basicModules = (prefix, titles) =>
      titles.map((title, i) => ({
        id: `${prefix}-m${i + 1}`,
        title,
        lessons: [
          {
            id: `${prefix}-m${i + 1}-l1`,
            title: `${title}: introduction`,
            type: 'Text',
            duration: 10,
            body: 'Sample lesson outline. Add the approved KIA learning content here.',
          },
          {
            id: `${prefix}-m${i + 1}-l2`,
            title: `${title}: put it into practice`,
            type: 'Video',
            duration: 15,
            body: '',
          },
        ],
      }));
    const courses = [
      {
        id: 'robotics',
        title: 'Robotics',
        description: 'Build, explore and learn with the shared KIA robotics curriculum.',
        audience: 'learners',
        status: 'published',
        modules: window.KIALearning.seedModules.map((module, mi) => ({
          id: `robotics-m${mi + 1}`,
          title: module.title,
          quizzes: Array.from({ length: module.quizzes }, (_, qi) => ({
            id: `m${mi + 1}-q${qi + 1}`,
            title: qi ? 'Apply what you learned' : 'Check your understanding',
            questions: structuredClone(window.KIALearning.sampleQuestions),
            sample: true,
          })),
          lessons: module.lessons.map((lesson, li) => ({
            id: `m${mi + 1}-l${li + 1}`,
            title: lesson[0],
            type: lesson[1],
            duration: lesson[2],
            body: '',
          })),
        })),
      },
      {
        id: 'onboarding',
        title: 'Mompreneur Onboarding',
        description: 'Get to know KIA and prepare to start your own club.',
        audience: 'mompreneurs',
        status: 'published',
        modules: basicModules('onboarding', [
          'Welcome to KIA',
          'Setting Up Your Club',
          'Your First Session',
        ]),
      },
      {
        id: 'facilitation',
        title: 'Facilitation Training',
        description: 'Develop the skills to guide learners through robotics activities.',
        audience: 'mompreneurs',
        status: 'published',
        modules: basicModules('facilitation', [
          'Supporting Young Learners',
          'Leading a Robotics Session',
          'Progress and Feedback',
        ]),
      },
    ];
    const sessions = (window.KIAClubSchedule.sampleSessions || window.KIAClubSchedule.sessions).map(
      (session) => ({ ...session, branchId: session.clubId })
    );
    sessions.push(
      {
        id: 'tv-oct3',
        branchId: 'table-view',
        title: 'Robotics class',
        date: '2026-10-03',
        start: '09:00',
        end: '10:30',
        location: 'Table View Club',
        note: 'Getting started with sensors.',
      },
      {
        id: 'dv-oct5',
        branchId: 'durbanville',
        title: 'Robotics class',
        date: '2026-10-05',
        start: '14:30',
        end: '16:00',
        location: 'Durbanville Club',
        note: 'Bring your robotics kit.',
      },
      {
        id: 'bv-oct6',
        branchId: 'bellville',
        title: 'Robotics class',
        date: '2026-10-06',
        start: '15:30',
        end: '17:00',
        location: 'Bellville Club',
        note: 'Our next build and test session.',
      }
    );
    return {
      schema: 1,
      branches,
      users,
      courses,
      sessions,
      certificates: [],
      settings: { certificatesEnabled: false },
      content: [
        {
          id: 'resource-guide',
          title: 'Robotics kit guide',
          courseId: 'robotics',
          type: 'Text',
          source: 'text',
          body: 'Get to know your robotics kit.\n\nIdentify the controller, motors and sensors before you begin. Follow your Mompreneur’s instructions and keep your workspace clear.\n\nThis is sample content for the design preview.',
          createdAt: '2026-09-28T10:00:00Z',
        },
        {
          id: 'resource-build',
          title: 'Robotics learning spotlight',
          courseId: 'robotics',
          type: 'Image',
          source: 'bundled',
          url: 'Assets/robotics-spotlight.jpg',
          createdAt: '2026-09-28T10:00:00Z',
        },
        {
          id: 'resource-club',
          title: 'Preparing your first club session',
          courseId: 'onboarding',
          type: 'Text',
          source: 'text',
          body: 'Sample facilitation resource\n\nPrepare your classroom, check your robotics materials and review the lesson plan before learners arrive.',
          createdAt: '2026-09-27T10:00:00Z',
        },
      ],
      activity: [
        {
          id: 'a1',
          title: 'New learner added',
          detail: 'Zanele Nkosi · Parklands Club',
          icon: 'users',
          tone: 'green',
          route: 'users',
          branchId: 'parklands',
          date: '2026-09-29T09:00:00Z',
        },
        {
          id: 'a2',
          title: 'Robotics course completed',
          detail: 'Lwazi Mokoena · Table View Club',
          icon: 'course',
          tone: 'purple',
          route: 'reports',
          branchId: 'table-view',
          date: '2026-09-28T13:00:00Z',
        },
        {
          id: 'a3',
          title: 'Club session updated',
          detail: 'Parklands · 9 October, 16:00',
          icon: 'calendar',
          tone: 'amber',
          route: 'schedules',
          branchId: 'parklands',
          date: '2026-09-28T12:00:00Z',
        },
        {
          id: 'a4',
          title: 'Learning resource added',
          detail: 'Robotics kit guide · Shared content',
          icon: 'content',
          tone: 'blue',
          route: 'content',
          branchId: null,
          date: '2026-09-28T10:00:00Z',
        },
        {
          id: 'a5',
          title: 'Mompreneur onboarding assigned',
          detail: 'Lerato Ndlovu · Bellville Club',
          icon: 'course',
          tone: 'green',
          route: 'users',
          branchId: 'bellville',
          date: '2026-09-27T10:00:00Z',
        },
      ],
    };
  }
  function read() {
    try {
      const saved = window.KIAStorage.read(key);
      if (
        [1, 2, 3, 4].includes(saved?.schema) &&
        ['branches', 'users', 'courses', 'sessions', 'content', 'activity', 'certificates'].every(
          (k) => Array.isArray(saved[k])
        ) &&
        saved.settings
      )
        return upgrade(saved);
    } catch {
      /* A fresh preview remains available when storage is blocked. */
    }
    return upgrade(seed());
  }
  function save(state) {
    return window.KIAStorage.write(key, state);
  }
  function upgrade(state) {
    if (state.schema >= 2) return upgradeFeatures(state);
    state.schema = 2;
    state.invitations = state.invitations || [];
    state.identities = state.identities || [];
    state.users.forEach((u, index) => {
      u.accessStatus = u.accessStatus || 'active';
      if (u.role === 'admin') {
        u.email = u.email || 'admin@kia.example';
        return;
      }
      u.birthDate = u.birthDate || (u.role === 'learner' ? '2015-05-12' : '1989-03-15');
      u.gender = u.gender || 'Prefer not to say';
      u.homeAddress =
        u.homeAddress ||
        'Sample address — ' +
          (state.branches.find((b) => b.id === u.branchId)?.name || 'Cape Town');
      if (u.role === 'learner')
        u.guardian = u.guardian || {
          name: index === 0 ? 'Morgan Example' : `Guardian ${u.name.split(' ')[0]}`,
          email: index === 0 ? 'parent@kia.example' : `parent${index + 1}@kia.example`,
          phone: '000 000 0000',
        };
      else {
        u.email =
          u.email || (u.id === 'mom-1' ? 'mompreneur@kia.example' : `${u.username}@kia.example`);
        u.phone = u.phone || '000 000 0000';
      }
    });
    return upgradeFeatures(state);
  }
  function upgradeFeatures(state) {
    if (!state.groups)
      state.groups = [
        {
          id: 'group-friday',
          name: 'Friday Builders',
          branchId: 'parklands',
          description: 'The Friday Robotics class at Parklands.',
          memberIds: ['learner-1', 'learner-2', 'learner-3', 'learner-4'],
          courseIds: ['robotics'],
          autoEnroll: true,
          createdBy: 'mom-1',
        },
        {
          id: 'group-saturday',
          name: 'Saturday Explorers',
          branchId: 'table-view',
          description: 'The Saturday Robotics class at Table View.',
          memberIds: ['learner-5', 'learner-6', 'learner-7', 'learner-8'],
          courseIds: ['robotics'],
          autoEnroll: true,
          createdBy: 'mom-2',
        },
      ].filter((g) => state.branches.some((b) => b.id === g.branchId));
    state.announcements = state.announcements || [];
    state.announcementReads = state.announcementReads || {};
    state.courses.forEach((c) => {
      if (!c.lessonOrder) c.lessonOrder = 'free';
    });
    if (state.schema < 4) {
      state.identities = state.identities.flatMap((i) =>
        i.userId
          ? [i]
          : state.users
              .filter(
                (u) =>
                  u.role === i.role &&
                  (u.role === 'learner' ? u.guardian?.email : u.email)?.toLowerCase() === i.email
              )
              .map((u) => ({ ...i, userId: u.id }))
      );
      state.learningProgress = state.learningProgress || {};
      state.courses.forEach((c) =>
        c.modules.forEach((m, mi) => {
          if (!Array.isArray(m.quizzes))
            m.quizzes =
              c.id === 'robotics' &&
              window.KIALearning.seedModules[mi] &&
              m.id === `robotics-m${mi + 1}`
                ? Array.from({ length: window.KIALearning.seedModules[mi].quizzes }, (_, qi) => ({
                    id: `m${mi + 1}-q${qi + 1}`,
                    title: qi ? 'Apply what you learned' : 'Check your understanding',
                    questions: structuredClone(window.KIALearning.sampleQuestions),
                    sample: true,
                  }))
                : [];
        })
      );
      const all =
        state.courses.find((c) => c.id === 'robotics')?.modules.flatMap((m) => m.lessons) || [];
      state.users
        .filter((u) => u.role === 'learner')
        .forEach((u) => {
          const saved =
            window.KIAStorage.read(`kia-my-learning-preview-v1:${u.id}`) ||
            (u.id === 'learner-1' ? window.KIAStorage.read('kia-my-learning-preview-v1') : null);
          state.learningProgress[u.id] = state.learningProgress[u.id] || {};
          state.learningProgress[u.id].robotics = state.learningProgress[u.id].robotics || {
            completed:
              saved?.completed ||
              all.slice(0, Math.round((u.progress / 100) * all.length)).map((l) => l.id),
            quizScores:
              saved?.quizScores ||
              (u.id === 'learner-1'
                ? { 'm1-q1': 100, 'm1-q2': 100, 'm2-q1': 100, 'm2-q2': 100 }
                : {}),
            completedAt: {},
          };
        });
    }
    state.learningProgress = state.learningProgress || {};
    const ids = new Set(
      (state.courses.find((c) => c.id === 'robotics')?.modules || []).flatMap((m) =>
        m.lessons.map((l) => l.id)
      )
    );
    state.users
      .filter((u) => u.role === 'learner')
      .forEach((u) => {
        const completed = state.learningProgress[u.id]?.robotics?.completed || [];
        u.progress = ids.size
          ? Math.round((completed.filter((id) => ids.has(id)).length / ids.size) * 100)
          : 0;
      });
    state.schema = 4;
    return state;
  }
  function database() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('kia-admin-preview-assets', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('files');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('This browser could not save the preview file.'));
    });
  }
  // Uploaded bytes are encrypted with a key kept only in this preview tab.
  // This limits leftover-file exposure; it does not replace server authorization.
  async function mediaKey() {
    let encoded = window.KIAStorage.read('kia-media-key-v1');
    if (!encoded) {
      encoded = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
      if (!window.KIAStorage.write('kia-media-key-v1', encoded))
        throw new Error('Browser storage is unavailable.');
    }
    return crypto.subtle.importKey(
      'raw',
      Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0)),
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }
  async function encryptFile(file) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    return {
      version: 1,
      iv: [...iv],
      body: await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        await mediaKey(),
        await file.arrayBuffer()
      ),
      createdAt: Date.now(),
    };
  }
  async function rawPut(assetId, record) {
    const db = await database();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').put(record, assetId);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(new Error('The preview file could not be saved. Try a smaller file.'));
      };
    });
  }
  async function putFile(assetId, file) {
    if (window.KIAAccounts.current()?.role !== 'admin')
      throw new Error('Only KIA Admin can upload learning content.');
    const nonce = window.KIAAccounts.currentSession()?.nonce;
    const encrypted = await encryptFile(file);
    if (
      window.KIAAccounts.current()?.role !== 'admin' ||
      window.KIAAccounts.currentSession()?.nonce !== nonce
    )
      throw new Error('Log in again before uploading content.');
    await rawPut(assetId, encrypted);
  }
  async function getFile(assetId) {
    const actor = window.KIAAccounts.current(),
      item = read().content.find((r) => r.id === assetId),
      nonce = window.KIAAccounts.currentSession()?.nonce;
    const checkAccess = () => {
      const live = window.KIAAccounts.current();
      if (
        !live ||
        live.id !== actor?.id ||
        window.KIAAccounts.currentSession()?.nonce !== nonce ||
        (live.role !== 'admin' && !window.KIALearning.unlocked(live, item?.courseId))
      )
        throw new Error('Log in again before opening this resource.');
    };
    if (
      !actor ||
      !item ||
      (actor.role !== 'admin' && !window.KIALearning.unlocked(actor, item.courseId))
    )
      throw new Error('This resource is unavailable to this account.');
    const db = await database();
    let record = await new Promise((resolve, reject) => {
      const request = db.transaction('files').objectStore('files').get(assetId);
      request.onsuccess = () => {
        db.close();
        resolve(request.result);
      };
      request.onerror = () => {
        db.close();
        reject(new Error('The preview file could not be opened.'));
      };
    });
    checkAccess();
    if (!record) return null;
    if (record instanceof Blob) {
      const file = record;
      record = await encryptFile(file);
      await rawPut(assetId, record);
      checkAccess();
      return file;
    }
    try {
      const bytes = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(record.iv) },
        await mediaKey(),
        record.body
      );
      checkAccess();
      return new Blob([bytes], { type: item.mime || 'application/octet-stream' });
    } catch {
      throw new Error(
        'This file belongs to a different preview session. Ask KIA to upload it again in this tab.'
      );
    }
  }
  async function protectLegacyFiles() {
    const db = await database();
    const records = await new Promise((resolve, reject) => {
      const tx = db.transaction('files'),
        store = tx.objectStore('files'),
        keys = store.getAllKeys(),
        values = store.getAll();
      tx.oncomplete = () => {
        db.close();
        resolve(keys.result.map((id, i) => ({ id, value: values.result[i] })));
      };
      tx.onerror = () => {
        db.close();
        reject(new Error('Preview files could not be checked.'));
      };
    });
    for (const record of records)
      if (record.value instanceof Blob) await rawPut(record.id, await encryptFile(record.value));
  }
  async function clearFiles() {
    if (window.KIAAccounts.current()?.role !== 'admin')
      throw new Error('KIA Admin clears preview files.');
    const db = await database();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(new Error('Unable to clear uploaded preview files.'));
      };
    });
  }
  window.KIAAdminData = {
    key,
    id,
    seed: () => upgrade(seed()),
    read,
    save,
    putFile,
    getFile,
    clearFiles,
    protectLegacyFiles,
  };
})();
