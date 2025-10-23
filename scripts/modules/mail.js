import { callServer, fetchAndRender } from '../core/api.js';

function renderMail({ unreadCount = 0, emails = [] }) {
  const mailBadge = document.getElementById('mailBadge');
  const mailList = document.getElementById('mailList');
  const empty = document.getElementById('mailEmptyState');
  mailBadge.textContent = unreadCount;
  mailList.innerHTML = '';
  if (!emails.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  const template = document.getElementById('emailCardTemplate');
  emails.forEach((mail) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector('[data-field="from"]').textContent = mail.from;
    node.querySelector('[data-field="subject"]').textContent = mail.subject;
    node.querySelector('[data-field="snippet"]').textContent = mail.snippet;
    node.querySelector('[data-field="messageCount"]').textContent = `${mail.messageCount} 件`;
    node.querySelector('[data-field="date"]').textContent = new Intl.DateTimeFormat('ja-JP', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(mail.date));
    node.dataset.threadId = mail.threadId;
    mailList.appendChild(node);
  });
}

function initMail() {
  fetchAndRender({
    fetcher: () =>
      callServer('getGmailData').then((response) => {
        if (response.success && !response.data) {
          response.data = {
            unreadCount: response.unreadCount ?? 0,
            emails: response.latestEmails ?? response.emails ?? [],
          };
        }
        if (!response.success && !response.error && response.message) {
          response.error = response.message;
        }
        return response;
      }),
    renderer: (data) => renderMail({ unreadCount: data.unreadCount ?? 0, emails: data.emails ?? data.latestEmails ?? [] }),
    onError: (message) => {
      const empty = document.getElementById('mailEmptyState');
      empty.textContent = message;
      empty.hidden = false;
    },
    onLoading: () => {
      const badge = document.getElementById('mailBadge');
      badge.textContent = '…';
    },
  });

  const mailList = document.getElementById('mailList');
  mailList.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]');
    if (!action) return;
    const card = action.closest('.mail-card');
    const threadId = card?.dataset.threadId;
    switch (action.dataset.action) {
      case 'open':
        if (threadId && window.open) {
          window.open(`https://mail.google.com/mail/u/0/#inbox/${threadId}`, '_blank', 'noopener');
        }
        break;
      case 'archive':
        callServer('archiveThread', { threadId });
        card?.setAttribute('data-archived', 'true');
        break;
      case 'markRead':
        callServer('markThreadAsRead', { threadId });
        card?.setAttribute('data-read', 'true');
        break;
      default:
        break;
    }
  });

  mailList.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const target = event.target.closest('[role="listitem"]');
      if (target) {
        event.preventDefault();
        target.querySelector('[data-action="open"]').click();
      }
    }
  });
}

export { initMail };
