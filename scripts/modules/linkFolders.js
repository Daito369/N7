import { callServer, fetchAndRender } from '../core/api.js';

const state = {
  folders: [],
};

function renderFolders() {
  const container = document.getElementById('linkFolderList');
  container.innerHTML = '';
  const folderTemplate = document.getElementById('linkFolderTemplate');
  const linkTemplate = document.getElementById('linkItemTemplate');
  if (!state.folders.length) {
    document.getElementById('linkEmptyState').hidden = false;
    return;
  }
  document.getElementById('linkEmptyState').hidden = true;
  state.folders.forEach((folder) => {
    const folderNode = folderTemplate.content.firstElementChild.cloneNode(true);
    folderNode.dataset.folderId = folder.id;
    folderNode.querySelector('[data-field="name"]').textContent = folder.name;
    folderNode.querySelector('[data-field="color"]').style.background = folder.color;
    const list = folderNode.querySelector('.link-folder__list');
    folder.links.forEach((link) => {
      const linkNode = linkTemplate.content.firstElementChild.cloneNode(true);
      linkNode.dataset.linkId = link.id;
      linkNode.querySelector('a').textContent = link.title;
      linkNode.querySelector('a').href = link.url;
      list.appendChild(linkNode);
    });
    container.appendChild(folderNode);
  });
}

function setupFolderInteractions() {
  const container = document.getElementById('linkFolderList');
  container.addEventListener('click', (event) => {
    const header = event.target.closest('.link-folder__header');
    if (header) {
      const folder = header.closest('.link-folder');
      const collapsed = folder.dataset.collapsed === 'true';
      folder.dataset.collapsed = collapsed ? 'false' : 'true';
      folder.setAttribute('aria-expanded', collapsed ? 'true' : 'false');
    }
    const actionButton = event.target.closest('[data-action]');
    if (actionButton) {
      const folder = actionButton.closest('.link-folder');
      const folderId = folder?.dataset.folderId;
      switch (actionButton.dataset.action) {
        case 'newLink':
          callServer('createLink', { folderId });
          break;
        case 'menu':
          callServer('openFolderMenu', { folderId });
          break;
        case 'open':
          window.open(actionButton.closest('.link-item').querySelector('a').href, '_blank');
          break;
        case 'remove':
          callServer('removeLink', { folderId, linkId: actionButton.closest('.link-item').dataset.linkId });
          actionButton.closest('.link-item').remove();
          break;
        default:
          break;
      }
    }
  });

  container.addEventListener('keydown', (event) => {
    if (!event.target.matches('.link-item')) return;
    const item = event.target;
    const folder = item.closest('.link-folder');
    const folderId = folder.dataset.folderId;
    const links = Array.from(folder.querySelectorAll('.link-item'));
    const currentIndex = links.indexOf(item);
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      item.dataset.keyboardReorder = item.dataset.keyboardReorder === 'true' ? 'false' : 'true';
    } else if (item.dataset.keyboardReorder === 'true' && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      const targetIndex = event.key === 'ArrowUp' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex >= 0 && targetIndex < links.length) {
        const targetNode = links[targetIndex];
        if (event.key === 'ArrowUp') {
          targetNode.before(item);
        } else {
          targetNode.after(item);
        }
        callServer('reorderLink', {
          folderId,
          linkId: item.dataset.linkId,
          position: targetIndex,
        });
      }
    } else if (event.key === 'Escape') {
      item.dataset.keyboardReorder = 'false';
    }
  });
}

function initDragAndDrop() {
  const container = document.getElementById('linkFolderList');
  let dragged = null;

  container.addEventListener('dragstart', (event) => {
    const item = event.target.closest('.link-item');
    if (!item) return;
    dragged = item;
    item.dataset.dragging = 'true';
    event.dataTransfer.effectAllowed = 'move';
  });

  container.addEventListener('dragover', (event) => {
    if (!dragged) return;
    event.preventDefault();
    const target = event.target.closest('.link-item');
    if (!target || target === dragged) return;
    const rect = target.getBoundingClientRect();
    const halfway = rect.top + rect.height / 2;
    if (event.clientY < halfway) {
      target.before(dragged);
    } else {
      target.after(dragged);
    }
  });

  container.addEventListener('drop', (event) => {
    if (!dragged) return;
    event.preventDefault();
    const folder = dragged.closest('.link-folder');
    const folderId = folder.dataset.folderId;
    const links = Array.from(folder.querySelectorAll('.link-item'));
    const position = links.indexOf(dragged);
    callServer('reorderLink', { folderId, linkId: dragged.dataset.linkId, position });
    dragged.dataset.dragging = 'false';
    dragged = null;
  });

  container.addEventListener('dragend', () => {
    if (dragged) {
      dragged.dataset.dragging = 'false';
    }
    dragged = null;
  });
}

function initLinkFolders() {
  fetchAndRender({
    fetcher: () => callServer('getLinkFolders'),
    renderer: (data) => {
      const folders = Array.isArray(data?.folders) ? data.folders : [];
      state.folders = folders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        color: folder.color || 'var(--md-sys-color-primary)',
        links: (folder.links || []).map((link) => ({
          id: link.id,
          title: link.title,
          url: link.url,
        })),
      }));
      renderFolders();
    },
    onError: (message) => {
      const empty = document.getElementById('linkEmptyState');
      empty.textContent = message;
      empty.hidden = false;
    },
    onLoading: () => {
      document.getElementById('linkEmptyState').textContent = '読み込み中…';
      document.getElementById('linkEmptyState').hidden = false;
    },
  });

  setupFolderInteractions();
  initDragAndDrop();
}

export { initLinkFolders };
