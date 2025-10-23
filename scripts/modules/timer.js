import { intervalManager } from '../core/intervalManager.js';
import { openModal } from '../core/modal.js';

class TimerController {
  constructor(display, surface) {
    this.display = display;
    this.surface = surface;
    this.remaining = 0;
    this.duration = 0;
    this.timerId = null;
  }

  format(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const hours = String(Math.floor(total / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const seconds = String(total % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  updateDisplay() {
    this.display.textContent = this.format(this.remaining);
  }

  start(durationMs) {
    this.duration = durationMs;
    this.remaining = durationMs;
    this.surface.dataset.state = 'active';
    this.updateDisplay();
    this.timerId = intervalManager.create('timer-countdown', () => this.tick(), 1000);
  }

  tick() {
    this.remaining -= 1000;
    if (this.remaining <= 0) {
      this.stop();
      this.surface.dispatchEvent(new CustomEvent('timer:finished'));
    } else {
      this.updateDisplay();
    }
  }

  pause() {
    intervalManager.clear('timer-countdown');
    this.surface.dataset.state = 'paused';
  }

  resume() {
    this.surface.dataset.state = 'active';
    intervalManager.create('timer-countdown', () => this.tick(), 1000);
  }

  stop() {
    intervalManager.clear('timer-countdown');
    this.surface.dataset.state = 'idle';
    this.remaining = 0;
    this.updateDisplay();
  }
}

function renderTimerModal() {
  const content = document.getElementById('modalContent');
  content.innerHTML = `
    <section class="timer-surface" data-state="idle">
      <h2 style="margin:0;font-size:1.25rem;">フォーカスタイマー</h2>
      <div class="timer-display">00:00:00</div>
      <div class="timer-inputs">
        <label>時間<input type="number" min="0" max="23" value="0" data-field="hours"></label>
        <label>分<input type="number" min="0" max="59" value="25" data-field="minutes"></label>
        <label>秒<input type="number" min="0" max="59" value="0" data-field="seconds"></label>
      </div>
      <div class="timer-quick-actions">
        <button type="button" data-duration="300000">5分</button>
        <button type="button" data-duration="900000">15分</button>
        <button type="button" data-duration="1500000">25分</button>
        <button type="button" data-duration="3600000">60分</button>
      </div>
      <div class="timer-controls">
        <button type="button" class="primary" data-action="start">開始</button>
        <button type="button" class="secondary" data-action="pause">一時停止</button>
        <button type="button" class="secondary" data-action="resume">再開</button>
        <button type="button" class="danger" data-action="stop">リセット</button>
      </div>
    </section>
  `;
  document.getElementById('modalTitle').textContent = 'フォーカスタイマー';
  const surface = content.querySelector('.timer-surface');
  const display = content.querySelector('.timer-display');
  const controller = new TimerController(display, surface);

  const getDurationFromInputs = () => {
    const hours = Number(content.querySelector('[data-field="hours"]').value) || 0;
    const minutes = Number(content.querySelector('[data-field="minutes"]').value) || 0;
    const seconds = Number(content.querySelector('[data-field="seconds"]').value) || 0;
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  };

  content.querySelectorAll('.timer-quick-actions button').forEach((button) => {
    button.addEventListener('click', () => {
      const duration = Number(button.dataset.duration);
      controller.start(duration);
    });
  });

  content.querySelector('.timer-controls').addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]');
    if (!action) return;
    if (action.dataset.action === 'start') {
      controller.start(getDurationFromInputs());
    } else if (action.dataset.action === 'pause') {
      controller.pause();
    } else if (action.dataset.action === 'resume') {
      controller.resume();
    } else if (action.dataset.action === 'stop') {
      controller.stop();
    }
  });

  surface.addEventListener('timer:finished', () => {
    surface.dataset.state = 'finished';
    surface.animate(
      [
        { transform: 'scale(1)', boxShadow: 'var(--md-sys-elevation-level3)' },
        { transform: 'scale(1.05)', boxShadow: '0 24px 40px rgba(103,80,164,0.4)' },
        { transform: 'scale(1)', boxShadow: 'var(--md-sys-elevation-level3)' },
      ],
      { duration: 600, easing: 'ease-out' }
    );
  });

}

function initTimerModalTrigger() {
  document.getElementById('openTimer').addEventListener('click', () => {
    renderTimerModal();
    openModal('modalBackdrop');
  });
}

export { initTimerModalTrigger };
