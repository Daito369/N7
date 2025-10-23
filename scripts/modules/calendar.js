import { callServer, fetchAndRender } from '../core/api.js';
import { openModal, closeModal } from '../core/modal.js';

const state = {
  view: 'month',
  eventsByDate: new Map(),
};

function detectDefaultView() {
  return window.innerWidth < 768 ? 'week' : 'month';
}

function buildCalendarGrid() {
  const grid = document.getElementById('calendarGrid');
  grid.dataset.view = state.view;
  grid.innerHTML = '';
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const totalDays = state.view === 'month' ? end.getDate() : 7;
  const startDate = state.view === 'month' ? start : now;
  for (let i = 0; i < totalDays; i++) {
    const date = new Date(startDate);
    if (state.view === 'week') {
      date.setDate(now.getDate() - now.getDay() + i);
    } else {
      date.setDate(i + 1);
    }
    const iso = date.toISOString().split('T')[0];
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'calendar-cell';
    cell.dataset.date = iso;
    cell.setAttribute('aria-label', `${date.getMonth() + 1}月${date.getDate()}日`);
    cell.innerHTML = `
      <div class="calendar-cell__header">
        <span>${date.getDate()}</span>
        <span class="calendar-event-indicator" hidden data-field="indicator"></span>
      </div>
      <div class="calendar-cell__events" data-field="events"></div>
    `;
    grid.appendChild(cell);
  }
}

function renderEvents() {
  document.querySelectorAll('.calendar-cell').forEach((cell) => {
    const dateKey = cell.dataset.date;
    const events = state.eventsByDate.get(dateKey) || [];
    const indicator = cell.querySelector('[data-field="indicator"]');
    const list = cell.querySelector('[data-field="events"]');
    list.innerHTML = '';
    if (events.length) {
      indicator.hidden = false;
      indicator.textContent = `${events.length} 件`;
      events.slice(0, 2).forEach((event) => {
        const item = document.createElement('span');
        item.className = 'calendar-event-indicator';
        item.textContent = event.title;
        list.appendChild(item);
      });
    } else {
      indicator.hidden = true;
    }
  });
}

function openEventModal(dateKey) {
  const events = state.eventsByDate.get(dateKey) || [];
  const container = document.getElementById('calendarEventList');
  container.innerHTML = '';
  if (!events.length) {
    container.innerHTML = '<p>予定はありません。</p>';
  } else {
    events.forEach((event, index) => {
      const card = document.createElement('article');
      card.className = 'calendar-event-card';
      card.style.animationDelay = `${index * 40}ms`;
      card.innerHTML = `
        <header style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;">
          <h3 style="margin:0;font-size:1rem;">${event.title}</h3>
          <span>${new Intl.DateTimeFormat('ja-JP', { timeStyle: 'short' }).format(new Date(event.start))}</span>
        </header>
        <p style="margin:0;color:var(--md-sys-color-on-surface-variant);">${event.description || ''}</p>
      `;
      container.appendChild(card);
    });
  }
  const modal = document.getElementById('calendarModal');
  modal.dataset.date = dateKey;
  modal.showModal();
}

function initCalendarInteractions() {
  const grid = document.getElementById('calendarGrid');
  grid.addEventListener('click', (event) => {
    const cell = event.target.closest('.calendar-cell');
    if (cell) {
      openEventModal(cell.dataset.date);
    }
  });
  document.querySelector('[data-calendar-close]').addEventListener('click', () => {
    document.getElementById('calendarModal').close();
  });
  document.getElementById('calendarModal').addEventListener('cancel', (event) => {
    event.preventDefault();
    event.target.close();
  });
}

function initViewToggle() {
  document.querySelectorAll('.calendar-toolbar__controls button').forEach((button) => {
    button.addEventListener('click', () => {
      const nextView = button.dataset.view;
      state.view = nextView;
      document.querySelectorAll('.calendar-toolbar__controls button').forEach((b) => {
        b.setAttribute('aria-pressed', b.dataset.view === state.view);
      });
      buildCalendarGrid();
      renderEvents();
    });
  });
}

function initCalendar() {
  state.view = detectDefaultView();
  document.querySelectorAll('.calendar-toolbar__controls button').forEach((button) => {
    button.setAttribute('aria-pressed', button.dataset.view === state.view);
  });
  buildCalendarGrid();
  initCalendarInteractions();
  initViewToggle();

  fetchAndRender({
    fetcher: () => callServer('getCalendarEvents'),
    renderer: (data) => {
      state.eventsByDate.clear();
      (data?.events || []).forEach((event) => {
        const dateKey = new Date(event.start).toISOString().split('T')[0];
        if (!state.eventsByDate.has(dateKey)) {
          state.eventsByDate.set(dateKey, []);
        }
        state.eventsByDate.get(dateKey).push(event);
      });
      renderEvents();
    },
    onError: (message) => {
      const grid = document.getElementById('calendarGrid');
      grid.innerHTML = `<p>${message}</p>`;
    },
  });
}

export { initCalendar };
