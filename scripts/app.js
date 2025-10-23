import { initThemeToggle } from './core/theme.js';
import { closeModal, openModal } from './core/modal.js';
import { initMail } from './modules/mail.js';
import { initChat } from './modules/chat.js';
import { initCalendar } from './modules/calendar.js';
import { initTodo } from './modules/todo.js';
import { initLinkFolders } from './modules/linkFolders.js';
import { initTimerModalTrigger } from './modules/timer.js';

const ready = () => {
  initThemeToggle(document.getElementById('themeToggle'));
  initMail();
  initChat();
  initCalendar();
  initTodo();
  initLinkFolders();
  initTimerModalTrigger();

  const backdrop = document.getElementById('modalBackdrop');
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) {
      closeModal('modalBackdrop');
    }
  });
  backdrop.querySelector('[data-modal-close]').addEventListener('click', () => closeModal('modalBackdrop'));

  document.getElementById('manageFolders').addEventListener('click', () => {
    const content = document.getElementById('modalContent');
    document.getElementById('modalTitle').textContent = 'フォルダ管理';
    content.innerHTML = '<p>フォルダの新規作成・編集・削除は現在UI刷新中です。</p>';
    openModal('modalBackdrop');
  });
};

document.addEventListener('DOMContentLoaded', ready);
