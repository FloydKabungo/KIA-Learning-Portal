/* LOCAL DESIGN PREVIEW ONLY.
 * These are fictional page fixtures, not authenticated users or permissions.
 * Never connect this module to live data. It creates no login sessions.
 */
(() => {
  'use strict';
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const page = location.pathname.split('/').pop();
  const view = page === 'admin.html' ? 'admin' : page === 'mompreneur.html' ? 'mompreneur' : 'learner';
  const ids = { admin: 'kia-admin', mompreneur: 'mom-1', learner: 'learner-1' };
  const samples = local ? window.KIAAdminData.read() : null;
  if (samples) window.KIAAdminData.save(samples);
  let fixture = samples?.users.find(u => u.id === ids[view]) || null;
  const pageState = Object.freeze({ nonce: local ? crypto.randomUUID() : null });
  const current = () => fixture;
  const isCurrent = value => !!fixture && value?.id === fixture.id;
  // This filters fictional cards in the design; it is not an access-control check.
  const canManage = (value, target) => isCurrent(value) && !!target &&
    (view === 'admin' || (view === 'mompreneur' && target.role === 'learner' && target.branchId === fixture.branchId));
  const normalize = value => String(value || '').trim().toLowerCase();
  const emailOf = value => normalize(value?.role === 'learner' ? value.guardian?.email : value?.email);
  function selectView(expected) {
    if (!local || view !== expected || !fixture) {
      location.replace('login.html');
      return null;
    }
    document.documentElement.classList.remove('preview-loading');
    return fixture;
  }
  function exit() {
    window.KIAPlayer?.dispose(document.body);
    fixture = null;
    location.assign('login.html');
    return Promise.resolve();
  }
  window.KIAPreview = Object.freeze({ current, isCurrent, canManage, normalize, emailOf,
    pageState: () => fixture ? pageState : null, checkPage: () => !!fixture,
    selectView, exit });
})();
