// ui.js — DOM rendering and small UI helpers
'use strict';

const ui = (() => {
  const $ = (sel, root) => (root || document).querySelector(sel);

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const key of Object.keys(attrs)) {
        const value = attrs[key];
        if (value == null || value === false) continue;
        if (key === 'text') node.textContent = value;
        else if (key === 'class') node.className = value;
        else if (key === 'style') node.setAttribute('style', value);
        else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
        else if (value === true) node.setAttribute(key, '');
        else node.setAttribute(key, String(value));
      }
    }
    if (children) {
      for (const child of children) {
        if (child == null) continue;
        node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
      }
    }
    return node;
  }

  // --- Background (original treatment: 80% black overlay + card art) ---
  const BACKGROUND_COUNT = 17;

  function setBackground(index) {
    const url = 'img/' + (index + 1) + '.jpg';
    document.body.style.backgroundImage =
      'linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)), url(\'' + url + '\')';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
  }

  function randomBackgroundIndex(current) {
    if (BACKGROUND_COUNT <= 1) return 0;
    let next;
    do {
      next = Math.floor(Math.random() * BACKGROUND_COUNT);
    } while (next === current);
    return next;
  }

  // --- Board ---
  const CELL_BASE =
    'bb-cell relative flex aspect-square w-full items-center justify-center overflow-hidden border-b border-r border-white/80 p-1.5 text-center leading-tight select-none touch-manipulation';
  const CELL_BUTTON =
    'cursor-pointer bg-transparent text-white transition-colors duration-100 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400';
  const CELL_MARKED = 'bg-black/60 text-amber-200';
  const CHECK_CLASS = 'bb-check pointer-events-none absolute right-1 top-0.5 text-[11px] font-bold leading-none';

  function renderBoard(container, board) {
    const n = board.n;
    container.textContent = '';
    container.style.setProperty('--bb-n', String(n));
    container.style.gridTemplateColumns = 'repeat(' + n + ', minmax(0, 1fr))';

    for (let i = 0; i < n * n; i++) {
      const cellData = board.cells[i];
      if (cellData == null) {
        container.appendChild(
          el('div', {
            class:
              'bb-free flex aspect-square w-full items-center justify-center border-b border-r border-white/80 bg-white/15 p-1.5 text-center text-[11px] font-bold tracking-[0.2em] text-white/90',
            'aria-hidden': 'true',
            text: 'FREE',
          })
        );
        continue;
      }

      const check = el('span', { class: CHECK_CLASS + (cellData.marked ? '' : ' hidden'), 'aria-hidden': 'true', text: '✓' });
      const button = el(
        'button',
        {
          type: 'button',
          class: CELL_BASE + ' ' + CELL_BUTTON + (cellData.marked ? ' ' + CELL_MARKED : ''),
          'aria-pressed': String(!!cellData.marked),
          'data-index': String(i),
        },
        [check, el('span', { class: 'w-full break-words', text: cellData.text })]
      );
      container.appendChild(button);
    }
  }

  function applyMarkedState(button, marked) {
    button.classList.toggle('bg-black/60', marked);
    button.classList.toggle('text-amber-200', marked);
    button.setAttribute('aria-pressed', String(marked));
    const check = button.querySelector('.bb-check');
    if (check) check.classList.toggle('hidden', !marked);
  }

  // --- Messages ---
  const MESSAGE_STYLES = {
    error: 'border-red-400/60 bg-red-950/80 text-red-100',
    success: 'border-emerald-400/50 bg-emerald-950/70 text-emerald-100',
    info: 'border-white/30 bg-white/10 text-white',
  };

  let messageTimer = 0;

  function showMessage(container, kind, text, options) {
    clearTimeout(messageTimer);
    container.className =
      'mt-4 w-full rounded-md border px-4 py-3 text-left text-sm leading-relaxed print:hidden ' +
      (MESSAGE_STYLES[kind] || MESSAGE_STYLES.info);
    container.textContent = '';
    const parts = [];
    if (options && options.lines) parts.push(el('div', { class: 'space-y-1' }, options.lines.map((line) => el('p', { text: line }))));
    container.appendChild(el('p', { text }));
    if (parts.length) container.appendChild(parts[0]);
    if (options && options.actionLabel && options.onAction) {
      const btn = el('button', {
        type: 'button',
        class:
          'mt-2 rounded-md border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
        text: options.actionLabel,
        onClick: options.onAction,
      });
      container.appendChild(btn);
    }
    container.classList.remove('hidden');
    if (options && options.autoHide) {
      messageTimer = setTimeout(() => container.classList.add('hidden'), 6000);
    }
  }

  function hideMessage(container) {
    clearTimeout(messageTimer);
    container.classList.add('hidden');
    container.textContent = '';
  }

  // --- Modal ---
  let lastFocused = null;

  function openModal(modal) {
    lastFocused = document.activeElement;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const closeBtn = $('#btn-modal-close', modal);
    if (closeBtn) closeBtn.focus();
  }

  function closeModal(modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function trapTabKey(event, modal) {
    if (event.key !== 'Tab') return;
    const focusables = modal.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  // --- Items list ---
  function renderItemsList(list, items) {
    list.textContent = '';
    items.forEach((item, index) => {
      const row = el('li', { class: 'flex flex-wrap items-center gap-2 py-2.5' });
      row.appendChild(el('span', { class: 'min-w-0 flex-1 break-words text-sm text-white/90', text: item.text }));

      const diffSelect = el('select', {
        class:
          'h-8 w-24 rounded-md border border-white/25 bg-neutral-900 px-1 text-xs text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
        'aria-label': 'Difficulty for ' + item.text,
        'data-index': String(index),
      });
      [1, 2, 3, 4].forEach((level) => {
        diffSelect.appendChild(
          el('option', { value: String(level), selected: item.difficulty === level, text: level + ' · ' + bingo.difficultyLabel(level) })
        );
      });
      row.appendChild(diffSelect);

      row.appendChild(
        el('button', {
          type: 'button',
          class: 'h-8 rounded-md border border-white/25 px-2.5 text-xs hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
          'data-action': 'edit',
          'data-index': String(index),
          'aria-label': 'Edit ' + item.text,
          text: 'Edit',
        })
      );
      row.appendChild(
        el('button', {
          type: 'button',
          class: 'h-8 rounded-md border border-red-400/50 px-2.5 text-xs text-red-300 hover:bg-red-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
          'data-action': 'remove',
          'data-index': String(index),
          'aria-label': 'Remove ' + item.text,
          text: 'Remove',
        })
      );
      list.appendChild(row);
    });
    if (!items.length) {
      list.appendChild(el('li', { class: 'py-4 text-sm text-white/60', text: 'No bingo items yet. Add one below.' }));
    }
  }

  return {
    $,
    el,
    setBackground,
    randomBackgroundIndex,
    BACKGROUND_COUNT,
    renderBoard,
    applyMarkedState,
    showMessage,
    hideMessage,
    openModal,
    closeModal,
    trapTabKey,
    renderItemsList,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = ui;
