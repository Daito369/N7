const THEME_KEY = 'nexushub-theme';
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

const observers = new Set();

function applyTheme(theme) {
  const normalized = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', normalized);
  document.body.dataset.theme = normalized;
  localStorage.setItem(THEME_KEY, normalized);
  observers.forEach((fn) => fn(normalized));
}

function detectTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }
  return prefersDark.matches ? 'dark' : 'light';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

function initThemeToggle(button) {
  const updateButton = (theme) => {
    button.setAttribute('aria-pressed', theme === 'dark');
    button.querySelector('.material-symbols-rounded').textContent = theme === 'dark' ? 'dark_mode' : 'light_mode';
  };
  const initial = detectTheme();
  applyTheme(initial);
  updateButton(initial);
  observers.add(updateButton);
  button.addEventListener('click', () => {
    toggleTheme();
    updateButton(document.documentElement.getAttribute('data-theme'));
  });
}

function onThemeChange(handler) {
  if (typeof handler === 'function') {
    observers.add(handler);
  }
}

prefersDark.addEventListener('change', (event) => {
  applyTheme(event.matches ? 'dark' : 'light');
});

export { applyTheme, detectTheme, toggleTheme, initThemeToggle, onThemeChange };
