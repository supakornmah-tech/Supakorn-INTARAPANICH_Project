let toastStack = null;

function getToastStack() {
  if (!toastStack) {
    toastStack = document.createElement('div');
    toastStack.className = 'toast-stack';
    document.body.appendChild(toastStack);
  }
  return toastStack;
}

const ICONS = { success: '✓', error: '!', info: 'i' };

export function notify(message, type = 'info', duration = 3200) {
  const el = document.createElement('div');
  el.className = `toast-item ${type}`;

  const icon = document.createElement('span');
  icon.className = 'toast-icon';
  icon.textContent = ICONS[type] || ICONS.info;

  const text = document.createElement('span');
  text.className = 'toast-msg';
  text.textContent = message;

  el.appendChild(icon);
  el.appendChild(text);
  getToastStack().appendChild(el);

  requestAnimationFrame(() => el.classList.add('show'));

  const remove = () => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 220);
  };
  const timer = setTimeout(remove, duration);
  el.addEventListener('click', () => {
    clearTimeout(timer);
    remove();
  });
}

export const toast = {
  success: (message) => notify(message, 'success'),
  error: (message) => notify(message, 'error'),
  info: (message) => notify(message, 'info'),
};

export function confirmDialog({
  title = 'ยืนยันการทำรายการ',
  message = '',
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  danger = false,
} = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const card = document.createElement('div');
    card.className = 'modal-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');

    const heading = document.createElement('h5');
    heading.className = 'modal-title';
    heading.textContent = title;

    const body = document.createElement('p');
    body.className = 'modal-message';
    body.textContent = message;

    const actions = document.createElement('div');
    actions.className = 'modal-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-light';
    cancelBtn.textContent = cancelText;

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;
    confirmBtn.textContent = confirmText;

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    card.appendChild(heading);
    card.appendChild(body);
    card.appendChild(actions);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add('show'));

    const onKey = (e) => {
      if (e.key === 'Escape') close(false);
    };

    function close(result) {
      document.removeEventListener('keydown', onKey);
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 180);
      resolve(result);
    }

    confirmBtn.addEventListener('click', () => close(true));
    cancelBtn.addEventListener('click', () => close(false));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(false);
    });
    document.addEventListener('keydown', onKey);
    confirmBtn.focus();
  });
}

export function reasonDialog({
  title = 'ระบุเหตุผล',
  message = '',
  placeholder = 'พิมพ์เหตุผลที่นี่...',
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  danger = true,
} = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const card = document.createElement('div');
    card.className = 'modal-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');

    const heading = document.createElement('h5');
    heading.className = 'modal-title';
    heading.textContent = title;

    const body = document.createElement('p');
    body.className = 'modal-message';
    body.textContent = message;

    const label = document.createElement('label');
    label.className = 'modal-textarea-label';
    label.textContent = 'เหตุผล';

    const textarea = document.createElement('textarea');
    textarea.className = 'form-control modal-textarea';
    textarea.rows = 3;
    textarea.placeholder = placeholder;
    textarea.maxLength = 500;

    const actions = document.createElement('div');
    actions.className = 'modal-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-light';
    cancelBtn.textContent = cancelText;

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;
    confirmBtn.textContent = confirmText;
    confirmBtn.disabled = true;

    textarea.addEventListener('input', () => {
      confirmBtn.disabled = textarea.value.trim().length === 0;
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    card.appendChild(heading);
    card.appendChild(body);
    card.appendChild(label);
    card.appendChild(textarea);
    card.appendChild(actions);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add('show'));

    const onKey = (e) => {
      if (e.key === 'Escape') close(null);
    };

    function close(result) {
      document.removeEventListener('keydown', onKey);
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 180);
      resolve(result);
    }

    confirmBtn.addEventListener('click', () => {
      const reason = textarea.value.trim();
      if (!reason) return;
      close(reason);
    });
    cancelBtn.addEventListener('click', () => close(null));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(null);
    });
    document.addEventListener('keydown', onKey);
    textarea.focus();
  });
}
