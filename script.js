(() => {
  const menuButton = document.querySelector('.menu-button');
  const mobileNav = document.querySelector('.mobile-nav');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });
  }

  document.querySelectorAll('.password-toggle').forEach((toggle) => {
    const password = document.getElementById(toggle.dataset.passwordTarget || 'password');
    if (!password) return;
    toggle.addEventListener('click', () => {
      const showing = password.type === 'text';
      password.type = showing ? 'password' : 'text';
      toggle.textContent = showing ? 'Show' : 'Hide';
      toggle.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    });
  });

  const loginForm = document.querySelector('#login-form');
  const message = document.querySelector('#login-message');
  if (loginForm && message) {
    const Auth = window.KIAAccounts;
    Auth.logout();
    const hint = window.KIAStorage.read('kia-login-email-hint');
    if (hint) {
      loginForm.email.value = hint;
      window.KIAStorage.write('kia-login-email-hint', null);
    }
    let openingPortal = false;

    loginForm.addEventListener('input', () => {
      if (!openingPortal) message.textContent = '';
    });

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (openingPortal) return;
      const email = loginForm.email.value.trim().toLowerCase();
      const pass = loginForm.password.value;
      if (!email || !pass) {
        message.textContent = 'Please enter your email or username and password.';
        return;
      }

      if (!loginForm.reportValidity()) return;
      openingPortal = true;
      loginForm.querySelector('[type="submit"]').disabled = true;
      let account;
      try {
        account = await Auth.authenticate(email, pass);
      } catch {
        account = null;
      }
      if (!account) {
        message.textContent =
          'Unable to log in. Check your details or complete your invitation setup. If learners share an email, use the learner’s own username.';
        openingPortal = false;
        loginForm.querySelector('[type="submit"]').disabled = false;
        return;
      }

      openingPortal = true;
      loginForm.querySelector('[type="submit"]').disabled = true;
      loginForm.setAttribute('aria-busy', 'true');
      message.textContent = 'Opening your portal…';
      window.setTimeout(() => {
        window.location.href = account.destination;
      }, 350);
    });
  }
})();
