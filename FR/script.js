document.addEventListener('DOMContentLoaded', () => {
  console.log('FR/script.js loaded');

  // Example: toggle a mobile menu if page uses .menu-btn and nav
  const menuBtn = document.querySelector('.menu-btn');
  const nav = document.querySelector('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => nav.classList.toggle('open'));
  }
  // Add other page-specific helpers below

  // Sign-up / login toggle on login page
  const showSignup = document.getElementById('show-signup');
  const showLogin = document.getElementById('show-login');
  const signupSection = document.getElementById('signup-section');
  const loginForm = document.querySelector('.login-form');

  if (showSignup && signupSection && loginForm) {
    showSignup.addEventListener('click', (e) => {
      e.preventDefault();
      signupSection.style.display = 'block';
      loginForm.style.display = 'none';
    });
  }

  if (showLogin && signupSection && loginForm) {
    showLogin.addEventListener('click', (e) => {
      e.preventDefault();
      signupSection.style.display = 'none';
      loginForm.style.display = 'block';
    });
  }
});
