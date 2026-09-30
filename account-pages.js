(() => {
  'use strict';
  const Auth = window.KIAAccounts,
    screen = document.querySelector('#account-screen');
  const esc = window.KIASecurity.escapeHTML;
  const result = (title, message, mark = '✓') =>
    `<div class="setup-result"><div class="setup-success-mark">${mark}</div><h2>${title}</h2><p>${esc(message)}</p><a class="button button-primary" href="login.html">Go to Login <span aria-hidden="true">→</span></a></div>`;
  if (document.body.dataset.accountPage === 'setup') {
    const token =
      new URLSearchParams(location.hash.slice(1)).get('invite') ||
      new URLSearchParams(location.search).get('invite');
    history.replaceState(null, '', location.pathname);
    const resolved = Auth.invitationState(token);
    if (resolved.reason) {
      screen.innerHTML = result(
        resolved.ready ? 'You’re ready to log in' : 'Invitation unavailable',
        resolved.reason,
        resolved.ready ? '✓' : '!'
      );
      return;
    }
    const { item, user } = resolved;
    screen.innerHTML = `<h2>Create your password</h2><p>${user.role === 'learner' ? 'A parent or guardian sets the password for this learner’s account.' : 'Choose a password for your new KIA account.'}</p><div class="invitation-summary"><strong>${esc(user.name)}</strong><p>${esc(item.email)}</p>${user.role === 'learner' ? `<p><strong>Login username: ${esc(user.username)}</strong></p>` : ''}<small>${user.role === 'learner' ? 'Parent / guardian contact email' : 'Account login email'}</small></div><form id="setup-form" novalidate><label for="password">New password</label><div class="password-wrap"><input id="password" name="password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required/><button type="button" class="password-toggle" data-password-target="password" aria-label="Show password">Show</button></div><p class="setup-help">Use at least 12 characters. Do not use a real password in this preview.</p><label for="confirm-password">Confirm password</label><div class="password-wrap"><input id="confirm-password" name="confirmation" type="password" autocomplete="new-password" minlength="12" maxlength="128" required/><button type="button" class="password-toggle" data-password-target="confirm-password" aria-label="Show confirmation password">Show</button></div><button class="button button-primary login-submit" type="submit" style="margin-top:24px">Create Password <span aria-hidden="true">→</span></button><p id="setup-error" class="form-message" role="alert"></p></form><p class="account-preview-note">Invitation preview · no email has been sent. This activation works only with the sample data in this browser.</p>`;
    const form = document.querySelector('#setup-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const button = form.querySelector('[type="submit"]');
      if (button.disabled) return;
      button.disabled = true;
      try {
        await Auth.activate(token, form.password.value, form.confirmation.value);
        form.reset();
        screen.innerHTML = result(
          'Your password is ready',
          user.role === 'learner'
            ? `Log in with ${user.username} and the password you just created. Each learner has a separate account.`
            : 'You can now use your email and password on the shared login page.'
        );
      } catch (error) {
        document.querySelector('#setup-error').textContent = error.message;
        button.disabled = false;
      }
    });
  } else {
    location.replace(Auth.current()?.role === 'learner' ? 'student.html' : 'login.html');
  }
})();
