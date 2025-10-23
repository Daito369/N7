import { callServer, fetchAndRender } from '../core/api.js';
import { openModal, closeModal } from '../core/modal.js';

const state = {
  todos: [],
};

function generateId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `todo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function renderTodo() {
  const container = document.getElementById('todoList');
  container.innerHTML = '';
  const template = document.getElementById('todoCardTemplate');
  if (!state.todos.length) {
    document.getElementById('todoEmptyState').hidden = false;
    return;
  }
  document.getElementById('todoEmptyState').hidden = true;
  state.todos.forEach((todo) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.id = todo.id;
    node.dataset.completed = String(todo.completed);
    node.querySelector('[data-field="title"]').textContent = todo.title;
    node.querySelector('[data-field="due"]').textContent = todo.due
      ? new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium' }).format(new Date(todo.due))
      : '期限なし';
    node.querySelector('[data-field="listName"]').textContent = todo.listName || 'デフォルト';
    node.querySelector('[data-field="note"]').textContent = todo.note || '';
    node.querySelector('input[type="checkbox"]').checked = todo.completed;
    container.appendChild(node);
  });
}

function showTodoModal(todo) {
  const content = document.getElementById('modalContent');
  content.innerHTML = `
    <form id="todoForm">
      <label>タスク名
        <input type="text" name="title" value="${todo?.title ?? ''}" required aria-required="true">
      </label>
      <label>期限
        <input type="date" name="due" value="${todo?.due ? new Date(todo.due).toISOString().split('T')[0] : ''}">
      </label>
      <label>メモ
        <textarea name="note" rows="4">${todo?.note ?? ''}</textarea>
      </label>
      <div style="display:flex;gap:0.5rem;justify-content:flex-end;">
        <button type="button" class="md-icon-button" data-modal-cancel aria-label="キャンセル">
          <span class="material-symbols-rounded" aria-hidden="true">cancel</span>
        </button>
        <button type="submit" class="md-icon-button" aria-label="保存">
          <span class="material-symbols-rounded" aria-hidden="true">check</span>
        </button>
      </div>
    </form>
  `;
  document.getElementById('modalTitle').textContent = todo ? 'タスクを編集' : 'タスクを追加';
  openModal('modalBackdrop');
  content.querySelector('[name="title"]').focus();
  content.querySelector('[data-modal-cancel]').addEventListener('click', () => closeModal('modalBackdrop'));
  content.querySelector('#todoForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const payload = {
      id: todo?.id,
      title: formData.get('title'),
      due: formData.get('due'),
      note: formData.get('note'),
    };
    const existingIndex = state.todos.findIndex((item) => item.id === payload.id);
    if (existingIndex >= 0) {
      state.todos[existingIndex] = { ...state.todos[existingIndex], ...payload };
      callServer('updateTodo', payload);
    } else {
      payload.id = generateId();
      payload.completed = false;
      payload.listName = 'デフォルト';
      state.todos.unshift(payload);
      callServer('createTodo', payload);
    }
    renderTodo();
    closeModal('modalBackdrop');
  });
}

function initTodo() {
  fetchAndRender({
    fetcher: () => callServer('getTodoItems'),
    renderer: (data) => {
      const list = Array.isArray(data?.items) ? data.items : [];
      state.todos = list.map((item) => ({
        id: item.id,
        title: item.title,
        due: item.due,
        listName: item.listName,
        note: item.note,
        completed: Boolean(item.completed),
      }));
      renderTodo();
    },
    onError: (message) => {
      const empty = document.getElementById('todoEmptyState');
      empty.textContent = message;
      empty.hidden = false;
    },
    onLoading: () => {
      document.getElementById('todoEmptyState').textContent = '読み込み中…';
      document.getElementById('todoEmptyState').hidden = false;
    },
  });

  document.getElementById('createTodo').addEventListener('click', () => showTodoModal(null));
  document.getElementById('todoList').addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]');
    if (!action) return;
    const card = action.closest('.todo-card');
    const id = card?.dataset.id;
    if (!id) return;
    if (action.dataset.action === 'edit') {
      const todo = state.todos.find((item) => item.id === id);
      showTodoModal(todo);
    } else if (action.dataset.action === 'delete') {
      state.todos = state.todos.filter((item) => item.id !== id);
      callServer('deleteTodo', { id });
      renderTodo();
    }
  });

  document.getElementById('todoList').addEventListener('change', (event) => {
    if (event.target.matches('[data-action="toggleComplete"]')) {
      const card = event.target.closest('.todo-card');
      const id = card?.dataset.id;
      const completed = event.target.checked;
      const todo = state.todos.find((item) => item.id === id);
      if (todo) {
        todo.completed = completed;
        card.dataset.completed = String(completed);
        callServer('toggleTodo', { id, completed });
      }
    }
  });
}

export { initTodo };
