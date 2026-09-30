/* Demonstrates the confirmed invitation and role flow with fictional local data.
   This is NOT server authentication, email delivery, or a security boundary.
   Real profiles, passwords, invitation tokens and access rules belong on the backend. */
(() => {
  'use strict';
  const Data = window.KIAAdminData,
    Storage = window.KIAStorage;
  const sessionKey = 'kia-account-session-preview-v1';
  const initial = Data.read();
  Data.save(initial);
  Data.protectLegacyFiles().catch(() => {
    /* File access reports its own recoverable errors. */
  });
  const normalize = (value) =>
    String(value || '')
      .trim()
      .toLowerCase();
  const emailOf = (u) => normalize(u.role === 'learner' ? u.guardian?.email : u.email);
  // Public sample identities only. These hashes do not secure a live service.
  const builtins = {
    'admin@kia.example': {
      role: 'admin',
      salt: 'pLsF3biHrziXvj7tfTqffw==',
      hash: 'eGxiel368qwYAJuHMM8VALWqSPAbsjiDLp/hN6CAuI0=',
      iterations: 600000,
    },
    'mompreneur@kia.example': {
      role: 'mompreneur',
      salt: 'SlqoXkhzTtKEEEfJ5n8n6g==',
      hash: 'Cwlz3KRvFrDubWXZPnrvhHj+KGPlq0g+1P6VptZO+/M=',
      iterations: 600000,
    },
    'parent@kia.example': {
      role: 'learner',
      salt: 'dliUGje17B47pkhH2kd13A==',
      hash: 'PHKzBcGp/m87CwQM2AYFwrTmKemGlv8M2BRbPK/jNq4=',
      iterations: 600000,
    },
  };
  const SESSION_IDLE = 30 * 60 * 1000,
    SESSION_MAX = 8 * 60 * 60 * 1000;
  let pageCheck = () => true;
  function currentSession() {
    const session = Storage.read(sessionKey),
      now = Date.now();
    if (
      !session ||
      typeof session.nonce !== 'string' ||
      !Number.isFinite(session.expiresAt) ||
      !Number.isFinite(session.issuedAt) ||
      session.expiresAt <= now ||
      session.issuedAt > now ||
      now - session.issuedAt >= SESSION_MAX
    ) {
      if (session) Storage.remove(sessionKey);
      return null;
    }
    return session;
  }
  function current() {
    const session = currentSession();
    if (!session) return null;
    const u = Data.read().users.find((u) => u.id === session.userId);
    return u &&
      u.status === 'active' &&
      u.accessStatus === 'active' &&
      u.role === session.role &&
      emailOf(u) === session.email &&
      (u.authVersion || 0) === (session.authVersion || 0)
      ? u
      : null;
  }
  const isCurrent = (actor) => {
    const live = current();
    return (
      !!live &&
      actor?.id === live.id &&
      actor.role === live.role &&
      actor.branchId === live.branchId
    );
  };
  const canManage = (actor, target) =>
    isCurrent(actor) &&
    !!target &&
    (actor.role === 'admin' ||
      (actor.role === 'mompreneur' &&
        !!actor.branchId &&
        target.role === 'learner' &&
        actor.branchId === target.branchId));
  function validateProfile(state, u, exceptId = null) {
    if (!u.name?.trim() || u.name.length > 120 || !/^[a-z0-9._-]{3,40}$/i.test(u.username || ''))
      throw new Error(
        'Enter a full name and a username of 3–40 letters, numbers, dots, hyphens or underscores.'
      );
    if (
      state.users.some(
        (other) => other.id !== exceptId && normalize(other.username) === normalize(u.username)
      )
    )
      throw new Error('That username is already in use.');
    const email = emailOf(u);
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error('Enter a valid email address.');
    if (
      state.users.some(
        (other) =>
          other.id !== exceptId &&
          emailOf(other) === email &&
          (u.role !== 'learner' || other.role !== 'learner')
      )
    )
      throw new Error(
        'This email already belongs to another account type. Use a different email address.'
      );
    const phone = u.role === 'learner' ? u.guardian?.phone : u.phone;
    if (
      !/^[+()\d\s.-]+$/.test(phone || '') ||
      (phone.match(/\d/g) || []).length < 7 ||
      (phone.match(/\d/g) || []).length > 15
    )
      throw new Error('Enter a valid contact cellphone number.');
    if (u.role === 'learner' && !u.guardian?.name?.trim())
      throw new Error('Enter the parent or guardian’s full name.');
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(u.birthDate || '') ||
      u.birthDate >= new Date().toISOString().slice(0, 10) ||
      !Number.isFinite(Date.parse(u.birthDate)) ||
      new Date(u.birthDate).toISOString().slice(0, 10) !== u.birthDate
    )
      throw new Error('Enter a date of birth in the past.');
    if (!['Female', 'Male', 'Other', 'Prefer not to say'].includes(u.gender))
      throw new Error('Choose a gender option.');
    if (!u.homeAddress?.trim() || u.homeAddress.length > 2000)
      throw new Error('Enter the home address.');
    if (u.role === 'mompreneur' && u.branchId && !state.branches.some((b) => b.id === u.branchId))
      throw new Error('Choose an existing club branch or assign it later.');
    if (u.role === 'learner' && !state.branches.some((b) => b.id === u.branchId))
      throw new Error('Choose the learner’s club branch.');
  }
  const demoCredential = (u) =>
    u.id === 'kia-admin' || u.id === 'mom-1' || u.id === 'learner-1' ? builtins[emailOf(u)] : null;
  const hasCredential = (state, target) =>
    state.identities.some((i) => i.userId === target.id) || !!demoCredential(target);
  function invite(state, target, actor, forceSetup = false) {
    if (!canManage(actor, target)) throw new Error('This profile is outside your branch access.');
    const email = emailOf(target),
      exists = !forceSetup && hasCredential(state, target);
    state.invitations
      .filter((i) => i.userId === target.id && i.status === 'pending')
      .forEach((i) => {
        i.status = 'cancelled';
      });
    const invitation = {
      id: Data.id('invite'),
      token: crypto.randomUUID(),
      userId: target.id,
      email,
      role: target.role,
      invitedBy: actor.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      status: exists ? 'ready' : 'pending',
      kind: exists ? 'profile-added' : 'password-setup',
      delivery: 'preview-only',
    };
    target.accessStatus = exists ? 'active' : 'pending';
    state.invitations.unshift(invitation);
    return invitation;
  }
  const bytes = (text) =>
    new Uint8Array(
      atob(text)
        .split('')
        .map((c) => c.charCodeAt(0))
    );
  const base64 = (array) => btoa(String.fromCharCode(...array));
  async function passwordDigest(password, salt, iterations = 600000) {
    if (!crypto.subtle)
      throw new Error('Password setup preview needs a modern browser with Web Crypto support.');
    const material = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      material,
      256
    );
    return base64(new Uint8Array(bits));
  }
  function invitationState(token) {
    const state = Data.read(),
      item = state.invitations.find((i) => i.token === token);
    if (!item) return { reason: 'This invitation could not be found in this preview.' };
    const u = state.users.find((u) => u.id === item.userId);
    if (!u || u.status !== 'active' || emailOf(u) !== item.email)
      return {
        reason: 'This invitation is no longer available. Ask KIA or your Mompreneur for a new one.',
      };
    if (item.status === 'accepted' || item.status === 'ready')
      return {
        reason: 'This account is already ready. Use the shared login with your existing password.',
        ready: true,
      };
    if (item.status !== 'pending')
      return { reason: 'This invitation has been replaced. Use the latest invitation.' };
    if (!Number.isFinite(Date.parse(item.expiresAt)) || Date.parse(item.expiresAt) <= Date.now())
      return { reason: 'This invitation has expired. Ask KIA or your Mompreneur for a new one.' };
    return { item, user: u, state };
  }
  async function activate(token, password, confirmation) {
    if (!Storage.available)
      throw new Error(
        'This preview needs browser session storage. Open it in a normal browser tab.'
      );
    const resolved = invitationState(token);
    if (resolved.reason) throw new Error(resolved.reason);
    if (typeof password !== 'string' || password.length < 12 || password.length > 128)
      throw new Error('Use a password between 12 and 128 characters.');
    if (password !== confirmation) throw new Error('The passwords do not match.');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await passwordDigest(password, salt);
    // Re-read after the asynchronous operation so a replaced invitation cannot be reused.
    const latest = invitationState(token);
    if (latest.reason) throw new Error(latest.reason);
    const { state, item } = latest;
    const identity = {
      userId: item.userId,
      email: item.email,
      role: item.role,
      hash,
      salt: base64(salt),
      iterations: 600000,
    };
    state.identities = state.identities.filter((i) => i.userId !== item.userId);
    state.identities.push(identity);
    latest.user.accessStatus = 'active';
    latest.user.authVersion = (latest.user.authVersion || 0) + 1;
    state.invitations
      .filter((i) => i.userId === item.userId && i.status === 'pending')
      .forEach((i) => {
        i.status = 'accepted';
        i.acceptedAt = new Date().toISOString();
      });
    window.KIALMS?.record(state, {
      title: 'Password setup completed',
      detail: latest.user.name,
      actorId: latest.user.id,
      actorName: latest.user.role === 'learner' ? 'Parent / guardian' : latest.user.name,
      branchId: latest.user.branchId,
      category: 'account',
      icon: 'check',
      route: 'users',
    });
    if (!Data.save(state))
      throw new Error(
        'The preview could not save the account. Free some browser storage and try again.'
      );
    Storage.write(
      'kia-login-email-hint',
      latest.user.role === 'learner' ? latest.user.username : item.email
    );
    return item;
  }
  async function authenticate(identifier, password) {
    if (!Storage.available) throw new Error('Browser session storage is unavailable.');
    identifier = normalize(identifier);
    if (identifier.length > 254 || typeof password !== 'string' || password.length > 128)
      return null;
    const state = Data.read();
    const profiles = state.users.filter(
      (u) =>
        (normalize(u.username) === identifier || emailOf(u) === identifier) &&
        u.status === 'active' &&
        u.accessStatus === 'active'
    );
    const matches = [];
    for (const u of profiles) {
      const identity = state.identities.find((i) => i.userId === u.id) || demoCredential(u);
      let valid = false;
      if (identity && identity.role === u.role) {
        try {
          valid =
            identity.hash ===
            (await passwordDigest(
              password,
              bytes(identity.salt),
              [210000, 600000].includes(identity.iterations) ? identity.iterations : 210000
            ));
        } catch {
          return null;
        }
      }

      if (valid) matches.push(u);
    }
    // A shared email and password must never silently select a sibling.
    if (matches.length !== 1) return null;
    const latest = Data.read(),
      u = latest.users.find(
        (u) => u.id === matches[0].id && u.status === 'active' && u.accessStatus === 'active'
      );
    if (!u || (u.authVersion || 0) !== (matches[0].authVersion || 0)) return null;
    u.lastLogin = new Date().toISOString();
    window.KIALMS?.record(latest, {
      title: 'Account logged in',
      detail: u.name,
      actorId: u.id,
      actorName: u.name,
      branchId: u.branchId,
      category: 'account',
      icon: 'users',
      route: 'users',
    });
    if (!Data.save(latest)) return null;
    const now = Date.now();
    if (
      !Storage.write(sessionKey, {
        userId: u.id,
        role: u.role,
        email: emailOf(u),
        authVersion: u.authVersion || 0,
        nonce: crypto.randomUUID(),
        issuedAt: now,
        expiresAt: now + SESSION_IDLE,
      })
    )
      return null;
    return {
      role: u.role,
      count: 1,
      destination:
        u.role === 'admin'
          ? 'admin.html'
          : u.role === 'mompreneur'
            ? 'mompreneur.html'
            : 'student.html',
    };
  }
  function learnerProfiles() {
    const u = current();
    return u?.role === 'learner' ? [u] : [];
  }
  function selectLearner(id) {
    if (current()?.id !== id)
      throw new Error('Log in with this learner’s own username and password.');
  }
  function logout() {
    Storage.remove(sessionKey);
    Storage.remove('kia-login-email-hint');
    window.name = '';
    window.KIAPlayer?.dispose(document.body);
  }
  function guard(role) {
    const actor = current(),
      session = currentSession();
    const deny = () => {
      document.documentElement.classList.add('auth-loading');
      location.replace('login.html');
      return false;
    };
    if (!actor || actor.role !== role) {
      deny();
      return null;
    }
    pageCheck = () => {
      const live = current(),
        s = currentSession();
      return (
        !!live &&
        s?.nonce === session.nonce &&
        live.id === actor.id &&
        live.role === actor.role &&
        live.branchId === actor.branchId
      );
    };
    const check = () => {
      if (!pageCheck()) return deny();
      document.documentElement.classList.remove('auth-loading');
      return true;
    };
    const touch = () => {
      const live = currentSession();
      if (live && Date.now() + SESSION_IDLE - live.expiresAt > 60000)
        Storage.write(sessionKey, {
          ...live,
          expiresAt: Math.min(Date.now() + SESSION_IDLE, live.issuedAt + SESSION_MAX),
        });
    };
    for (const type of ['click', 'submit', 'keydown'])
      document.addEventListener(
        type,
        (event) => {
          if (!check()) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
          }
          touch();
          if (type === 'click') {
            const link = event.target.closest('a[href]');
            if (link && new URL(link.href).pathname.endsWith('/login.html')) {
              event.preventDefault();
              logout();
              document.body.replaceChildren();
              location.assign('login.html');
            }
          }
        },
        true
      );
    window.addEventListener('pagehide', () =>
      document.documentElement.classList.add('auth-loading')
    );
    window.addEventListener('pageshow', check);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) check();
    });
    setInterval(check, 15000);
    check();
    return actor;
  }
  const checkPage = () => pageCheck();
  window.KIAAccounts = {
    normalize,
    emailOf,
    current,
    currentSession,
    guard,
    checkPage,
    isCurrent,
    canManage,
    validateProfile,
    invite,
    invitationState,
    activate,
    authenticate,
    learnerProfiles,
    selectLearner,
    logout,
  };
})();
