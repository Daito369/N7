import { callServer, fetchAndRender } from '../core/api.js';

const state = {
  conversations: [],
  filter: { unread: true, dm: false, spaces: false },
  search: '',
  activeTab: 'dm',
};

function applyLayoutMode() {
  const container = document.getElementById('chatColumns');
  if (window.innerWidth < 768) {
    container.dataset.mode = 'tabs';
    container.dataset.active = state.activeTab;
  } else {
    container.dataset.mode = 'columns';
    container.removeAttribute('data-active');
  }
}

function filterConversations() {
  const filters = state.filter;
  const keyword = state.search.trim().toLowerCase();
  return state.conversations.filter((chat) => {
    if (filters.unread && chat.unread === 0) return false;
    if (filters.dm && chat.type !== 'dm') return false;
    if (filters.spaces && chat.type !== 'spaces') return false;
    if (keyword) {
      const text = `${chat.title} ${chat.snippet} ${chat.author}`.toLowerCase();
      if (!text.includes(keyword)) {
        return false;
      }
    }
    return true;
  });
}

function renderChat() {
  const filtered = filterConversations();
  const dmList = document.getElementById('chatDmList');
  const spaceList = document.getElementById('chatSpacesList');
  dmList.innerHTML = '';
  spaceList.innerHTML = '';
  const template = document.getElementById('chatItemTemplate');
  filtered.forEach((chat) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.chatId = chat.id;
    node.querySelector('[data-field="unread"]').textContent = `${chat.unread}`;
    node.querySelector('[data-field="title"]').textContent = chat.title;
    node.querySelector('[data-field="snippet"]').textContent = chat.snippet;
    node.querySelector('.chat-item__actions [data-action="open"]').dataset.url = chat.url;
    node.querySelector('.chat-item__actions [data-action="markRead"]').dataset.url = chat.url;
    const parentList = chat.type === 'dm' ? dmList : spaceList;
    parentList.appendChild(node);
  });
  const empty = document.getElementById('chatEmptyState');
  empty.hidden = filtered.length > 0;
}

function initFilters() {
  document.querySelectorAll('.chat-filters button').forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      if (filter === 'unread') {
        state.filter.unread = !state.filter.unread;
      } else if (filter === 'dm') {
        state.filter.dm = !state.filter.dm;
      } else if (filter === 'spaces') {
        state.filter.spaces = !state.filter.spaces;
      }
      button.setAttribute('aria-pressed', state.filter[filter]);
      renderChat();
    });
  });
}

function initSearch() {
  const field = document.getElementById('chatSearch');
  field.addEventListener('input', (event) => {
    state.search = event.target.value;
    renderChat();
  });
  field.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      field.value = '';
      state.search = '';
      renderChat();
    }
  });
}

function initTabs() {
  const container = document.getElementById('chatColumns');
  container.addEventListener('click', (event) => {
    if (container.dataset.mode !== 'tabs') return;
    const column = event.target.closest('.chat-column');
    if (column) {
      state.activeTab = column.dataset.type;
      container.dataset.active = state.activeTab;
    }
  });
}

function initActions() {
  document.getElementById('chatColumns').addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]');
    if (!action) return;
    const chatItem = action.closest('.chat-item');
    const chatId = chatItem?.dataset.chatId;
    switch (action.dataset.action) {
      case 'open':
        if (action.dataset.url) {
          window.open(action.dataset.url, '_blank', 'noopener');
        }
        break;
      case 'markRead':
        callServer('markChatAsRead', { chatId }).then(() => {
          chatItem?.setAttribute('data-read', 'true');
        });
        break;
      default:
        break;
    }
  });

  const column = document.getElementById('chatColumns');
  column.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const item = event.target.closest('.chat-item');
      if (item) {
        event.preventDefault();
        item.querySelector('[data-action="open"]').click();
      }
    }
    if (event.key === ' ') {
      const item = event.target.closest('.chat-item');
      if (item) {
        event.preventDefault();
        item.querySelector('[data-action="markRead"]').click();
      }
    }
  });
}

function initChat() {
  fetchAndRender({
    fetcher: () => callServer('getChatData'),
    renderer: (data) => {
      const list = Array.isArray(data?.conversations) ? data.conversations : [];
      state.conversations = list.map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        snippet: conversation.snippet,
        unread: conversation.unreadCount ?? conversation.unread ?? 0,
        url: conversation.url,
        author: conversation.author,
        type: conversation.classification || conversation.type || 'dm',
      }));
      renderChat();
    },
    onError: (message) => {
      const empty = document.getElementById('chatEmptyState');
      empty.textContent = message;
      empty.hidden = false;
    },
    onLoading: () => {
      document.getElementById('chatEmptyState').textContent = '読み込み中…';
      document.getElementById('chatEmptyState').hidden = false;
    },
  });

  initFilters();
  initSearch();
  initTabs();
  initActions();
  applyLayoutMode();
  window.addEventListener('resize', applyLayoutMode);
}

export { initChat };
