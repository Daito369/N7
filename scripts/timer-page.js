import { initThemeToggle } from './core/theme.js';
import { intervalManager } from './core/intervalManager.js';

const surface = document.querySelector('.timer-surface');
const display = surface.querySelector('.timer-display');
const inputs = surface.querySelectorAll('.timer-inputs input');
const quickButtons = surface.querySelectorAll('.timer-quick-actions button');
const controls = surface.querySelector('.timer-controls');
const themeButton = document.getElementById('timerThemeToggle');

initThemeToggle(themeButton);

const timer = {
  remaining: 0,
  active: false,
};

function format(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = String(Math.floor(total / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function readDuration() {
  const [hours, minutes, seconds] = Array.from(inputs).map((input) => Number(input.value) || 0);
  return (hours * 3600 + minutes * 60 + seconds) * 1000;
}

function updateDisplay() {
  display.textContent = format(timer.remaining);
}

function start(duration) {
  timer.remaining = duration;
  timer.active = true;
  surface.dataset.state = 'active';
  intervalManager.create('timer-page', tick, 1000);
  updateDisplay();
}

function tick() {
  timer.remaining -= 1000;
  if (timer.remaining <= 0) {
    stop();
    surface.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.04)' },
        { transform: 'scale(1)' },
      ],
      { duration: 600, easing: 'ease-out' }
    );
  } else {
    updateDisplay();
  }
}

function pause() {
  intervalManager.clear('timer-page');
  surface.dataset.state = 'paused';
}

function resume() {
  surface.dataset.state = 'active';
  intervalManager.create('timer-page', tick, 1000);
}

function stop() {
  intervalManager.clear('timer-page');
  timer.remaining = 0;
  timer.active = false;
  surface.dataset.state = 'idle';
  updateDisplay();
}

quickButtons.forEach((button) => {
  button.addEventListener('click', () => start(Number(button.dataset.duration)));
});

controls.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action]');
  if (!action) return;
  switch (action.dataset.action) {
    case 'start':
      start(readDuration());
      break;
    case 'pause':
      pause();
      break;
    case 'resume':
      resume();
      break;
    case 'stop':
      stop();
      break;
    default:
      break;
  }
});

inputs.forEach((input) => {
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      start(readDuration());
    }
  });
});

updateDisplay();
