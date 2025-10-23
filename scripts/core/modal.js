const activeModals = new Map();
let lastFocusedElement = null;

function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => el.offsetParent !== null || el instanceof HTMLDialogElement);
}

function trapFocus(event) {
  const modalId = event.currentTarget.id;
  const focusables = activeModals.get(modalId);
  if (!focusables || focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.key === 'Tab') {
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  } else if (event.key === 'Escape') {
    closeModal(modalId);
  }
}

function openModal(id) {
  const backdrop = document.getElementById(id);
  if (!backdrop) return;
  lastFocusedElement = document.activeElement;
  backdrop.dataset.visible = 'true';
  backdrop.setAttribute('aria-hidden', 'false');
  const focusables = getFocusableElements(backdrop);
  activeModals.set(id, focusables);
  document.body.style.overflow = 'hidden';
  backdrop.addEventListener('keydown', trapFocus);
  if (focusables.length) {
    focusables[0].focus();
  }
}

function closeModal(id) {
  const backdrop = document.getElementById(id);
  if (!backdrop) return;
  backdrop.dataset.visible = 'false';
  backdrop.setAttribute('aria-hidden', 'true');
  backdrop.removeEventListener('keydown', trapFocus);
  activeModals.delete(id);
  document.body.style.overflow = '';
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
  }
}

function bindModalTriggers({ openSelector, closeSelector, modalId }) {
  document.querySelectorAll(openSelector).forEach((trigger) => {
    trigger.addEventListener('click', () => openModal(modalId));
  });
  document.querySelectorAll(closeSelector).forEach((trigger) => {
    trigger.addEventListener('click', () => closeModal(modalId));
  });
}

export { openModal, closeModal, bindModalTriggers };
