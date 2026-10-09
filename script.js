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
  if (loginForm) loginForm.addEventListener('submit', event => event.preventDefault());
  const previews = document.querySelector('#design-preview-links');
  if (previews) previews.hidden = !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
})();
