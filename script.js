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

  const toggle = document.querySelector('.password-toggle');
  const password = document.querySelector('#password');
  if (toggle && password) {
    toggle.addEventListener('click', () => {
      const showing = password.type === 'text';
      password.type = showing ? 'password' : 'text';
      toggle.textContent = showing ? 'Show' : 'Hide';
      toggle.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    });
  }

  const validRoles = ['student', 'mompreneur', 'admin'];
  const destinations = {
    student: 'student.html',
    mompreneur: 'mompreneur.html',
    admin: 'admin.html'
  };

  const roleButtons = [...document.querySelectorAll('[data-role-choice]')];
  const selectedRole = document.querySelector('#selected-role');
  const loginTitle = document.querySelector('#login-title');

  function setRole(role) {
    const safeRole = validRoles.includes(role) ? role : 'student';
    if (selectedRole) selectedRole.value = safeRole;
    roleButtons.forEach((button) => {
      const active = button.dataset.roleChoice === safeRole;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (loginTitle) {
      const labels = { student: 'Student login', mompreneur: 'Mompreneur login', admin: 'KIA Admin login' };
      loginTitle.textContent = labels[safeRole];
    }
  }

  if (roleButtons.length) {
    const queryRole = new URLSearchParams(window.location.search).get('role');
    setRole(validRoles.includes(queryRole) ? queryRole : 'student');
    roleButtons.forEach((button) => {
      button.addEventListener('click', () => setRole(button.dataset.roleChoice));
    });
  }

  const loginForm = document.querySelector('#login-form');
  const message = document.querySelector('#login-message');
  if (loginForm && message) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const username = loginForm.username.value.trim();
      const pass = loginForm.password.value;
      if (!username || !pass) {
        message.textContent = 'Please enter your username/email and password.';
        return;
      }

      const role = selectedRole && validRoles.includes(selectedRole.value) ? selectedRole.value : 'student';
      message.textContent = 'Opening your portal…';
      window.setTimeout(() => {
        window.location.href = destinations[role];
      }, 350);
    });
  }
})();
