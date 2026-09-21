// app.js — application state, actions and event wiring
'use strict';

const app = (() => {
  const DEFAULT_SIZE = 5;

  let state = {
    items: [],
    size: DEFAULT_SIZE,
    freeSpace: false,
    background: null,
    board: null,
  };

  let els = {};
  let editingIndex = -1;

  // --- State helpers ---
  function defaultState() {
    return {
      items: bingo.DEFAULT_ITEMS.map((item) => ({ text: item.text, difficulty: item.difficulty })),
      size: DEFAULT_SIZE,
      freeSpace: false,
      background: Math.floor(Math.random() * ui.BACKGROUND_COUNT),
      board: null,
    };
  }

  function loadState() {
    const saved = storage.load();
    if (saved && Array.isArray(saved.items)) {
      state.items = saved.items.filter((i) => i && typeof i.text === 'string' && i.text.trim());
      state.size = bingo.SIZES.includes(saved.size) ? saved.size : DEFAULT_SIZE;
      state.freeSpace = !!saved.freeSpace;
      state.background =
        Number.isInteger(saved.background) && saved.background >= 0 && saved.background < ui.BACKGROUND_COUNT
          ? saved.background
          : Math.floor(Math.random() * ui.BACKGROUND_COUNT);
      state.board =
        saved.board &&
        Array.isArray(saved.board.cells) &&
        saved.board.cells.length === saved.board.n * saved.board.n
          ? saved.board
          : null;
    } else {
      state = defaultState();
    }
    if (!state.board) state.board = generateNewBoard(false);
  }

  function save() {
    storage.save(state);
  }

  // --- Board actions ---
  function generateNewBoard(announce) {
    const result = bingo.generateBoard(state.items, state.size, state.freeSpace);
    if (!result.ok) {
      showInsufficientError(result);
      return null;
    }
    state.board = result;
    if (announce) ui.showMessage(els.message, 'success', 'A new board was generated.', { autoHide: true });
    return result;
  }

  function showInsufficientError(result) {
    const needed = result.needed;
    const have = result.have;
    const missing = needed - have;
    const lines = [
      'A ' + state.size + '×' + state.size + ' board requires ' + needed + ' unique item' + (needed === 1 ? '' : 's') + '.',
      'You currently have ' + have + '.',
    ];
    if (missing > 0) lines.push('Please add ' + missing + ' more item' + (missing === 1 ? '' : 's') + '.');
    ui.showMessage(els.message, 'error', 'Not enough bingo items.', {
      lines,
      actionLabel: 'Manage items',
      onAction: () => openItemsModal(),
    });
  }

  function boardHasMarks() {
    if (!state.board) return false;
    return state.board.cells.some((cell) => cell && cell.marked);
  }

  function newBoard() {
    const needed = bingo.requiredItems(state.size, state.freeSpace);
    if (state.items.length < needed) {
      showInsufficientError({ ok: false, code: 'insufficient', needed, have: state.items.length });
      return;
    }
    if (boardHasMarks() && !window.confirm('Start a new board? Your marked squares will be cleared.')) return;
    if (generateNewBoard(true)) {
      renderBoard();
      save();
    }
  }

  function setBoardSize(size) {
    if (size === state.size) return;
    const prev = { size: state.size, freeSpace: state.freeSpace };
    state.size = size;
    els.sizeSelect.value = String(size);
    applyBoardChange(() => {
      state.size = prev.size;
      state.freeSpace = prev.freeSpace;
      syncControls();
    });
  }

  function toggleFreeSpace(enabled) {
    if (state.freeSpace === !!enabled) return;
    const prev = { size: state.size, freeSpace: state.freeSpace };
    state.freeSpace = !!enabled;
    applyBoardChange(() => {
      state.size = prev.size;
      state.freeSpace = prev.freeSpace;
      syncControls();
    });
  }

  function applyBoardChange(onCancel) {
    const needed = bingo.requiredItems(state.size, state.freeSpace);
    if (state.items.length < needed) {
      showInsufficientError({ ok: false, code: 'insufficient', needed, have: state.items.length });
      save();
      renderBoard();
      return;
    }
    if (boardHasMarks() && !window.confirm('Your marked squares will be cleared. Continue?')) {
      if (onCancel) onCancel();
      renderBoard();
      return;
    }
    if (generateNewBoard(false)) {
      renderBoard();
      save();
    }
  }

  function toggleCell(index) {
    if (!state.board) return;
    const cell = state.board.cells[index];
    if (!cell) return;
    cell.marked = !cell.marked;
    const button = els.board.querySelector('button[data-index="' + index + '"]');
    if (button) ui.applyMarkedState(button, cell.marked);
    save();
  }

  function renderBoard() {
    if (!state.board) {
      els.board.textContent = '';
      els.board.removeAttribute('style');
      return;
    }
    ui.renderBoard(els.board, state.board);
  }

  // --- Item actions ---
  function addItem(rawText, difficulty) {
    const text = bingo.normalizeText(rawText);
    if (!text) {
      itemMessage('error', 'Enter a bingo item before adding it.');
      return false;
    }
    if (bingo.findDuplicate(state.items, text) !== -1) {
      itemMessage('error', 'That item is already in your list.');
      return false;
    }
    state.items.push({ text, difficulty: clampDifficulty(difficulty) });
    save();
    renderItems();
    itemMessage('success', 'Item added. Use “New Board” to include it on a board.', true);
    return true;
  }

  function editItem(index, rawText) {
    const text = bingo.normalizeText(rawText);
    if (!text) {
      itemMessage('error', 'Enter a bingo item before saving it.');
      return false;
    }
    const dup = bingo.findDuplicate(state.items, text);
    if (dup !== -1 && dup !== index) {
      itemMessage('error', 'That item is already in your list.');
      return false;
    }
    state.items[index].text = text;
    save();
    editingIndex = -1;
    renderItems();
    itemMessage('success', 'Item updated.', true);
    return true;
  }

  function removeItem(index) {
    const item = state.items[index];
    if (!item) return;
    if (!window.confirm('Remove “' + item.text + '” from your list?')) return;
    state.items.splice(index, 1);
    save();
    renderItems();
    itemMessage('success', 'Item removed.', true);
  }

  function setItemDifficulty(index, difficulty) {
    state.items[index].difficulty = clampDifficulty(difficulty);
    save();
  }

  function clampDifficulty(value) {
    value = parseInt(value, 10);
    return value >= 1 && value <= 4 ? value : 2;
  }

  function renderItems() {
    ui.renderItemsList(els.itemsList, state.items);
    const needed = bingo.requiredItems(state.size, state.freeSpace);
    els.itemsCount.textContent =
      state.items.length + ' item' + (state.items.length === 1 ? '' : 's') + ' · current board needs ' + needed;
  }

  let itemMsgTimer = 0;
  function itemMessage(kind, text, autoHide) {
    clearTimeout(itemMsgTimer);
    const box = els.itemMessage;
    const styles = {
      error: 'border-red-400/60 bg-red-950/80 text-red-100',
      success: 'border-emerald-400/50 bg-emerald-950/70 text-emerald-100',
    };
    box.className = 'mt-3 rounded-md border px-3 py-2 text-sm ' + (styles[kind] || styles.error);
    box.textContent = text;
    box.classList.remove('hidden');
    if (autoHide) itemMsgTimer = setTimeout(() => box.classList.add('hidden'), 5000);
  }

  function renderEditRow(index) {
    const item = state.items[index];
    if (!item) return;
    editingIndex = index;
    const row = els.itemsList.children[index];
    if (!row) return;
    row.textContent = '';
    const input = ui.el('input', {
      type: 'text',
      maxlength: '80',
      class:
        'h-9 min-w-0 flex-1 rounded-md border border-amber-400/70 bg-white/5 px-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
      value: item.text,
      'aria-label': 'Edit item text',
    });
    row.appendChild(input);
    row.appendChild(
      ui.el('button', {
        type: 'button',
        class: 'h-9 rounded-md bg-emerald-500 px-3 text-xs font-bold text-white hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
        text: 'Save',
        onClick: () => editItem(index, input.value),
      })
    );
    row.appendChild(
      ui.el('button', {
        type: 'button',
        class: 'h-9 rounded-md border border-white/25 px-3 text-xs text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
        text: 'Cancel',
        onClick: () => {
          editingIndex = -1;
          renderItems();
        },
      })
    );
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        editItem(index, input.value);
      } else if (event.key === 'Escape') {
        editingIndex = -1;
        renderItems();
      }
    });
    input.focus();
    input.select();
  }

  // --- Background ---
  function shuffleBackground() {
    state.background = ui.randomBackgroundIndex(state.background);
    ui.setBackground(state.background);
    save();
  }

  // --- Reset ---
  function resetAll() {
    if (!window.confirm('Reset everything to the defaults?\n\nThis restores the original 61 bingo items, the 5×5 board size and generates a new board. This cannot be undone.')) {
      return;
    }
    state = defaultState();
    state.board = generateNewBoard(false);
    save();
    ui.setBackground(state.background);
    syncControls();
    renderBoard();
    renderItems();
    ui.hideMessage(els.message);
    if (els.itemMessage) els.itemMessage.classList.add('hidden');
    ui.showMessage(els.message, 'success', 'The app was reset to its defaults.', { autoHide: true });
  }

  // --- Modal ---
  function openItemsModal() {
    editingIndex = -1;
    renderItems();
    els.freeSpaceCheckbox.checked = !!state.freeSpace;
    if (els.itemMessage) els.itemMessage.classList.add('hidden');
    ui.openModal(els.modal);
  }

  function closeItemsModal() {
    ui.closeModal(els.modal);
  }

  // --- Controls ---
  function syncControls() {
    els.sizeSelect.value = String(state.size);
    els.freeSpaceCheckbox.checked = !!state.freeSpace;
  }

  function cacheElements() {
    els = {
      board: document.getElementById('board'),
      message: document.getElementById('message'),
      sizeSelect: document.getElementById('select-size'),
      btnNewBoard: document.getElementById('btn-new-board'),
      btnPrint: document.getElementById('btn-print'),
      btnItems: document.getElementById('btn-items'),
      btnBackground: document.getElementById('btn-background'),
      modal: document.getElementById('modal'),
      btnModalClose: document.getElementById('btn-modal-close'),
      freeSpaceCheckbox: document.getElementById('chk-free-space'),
      itemsList: document.getElementById('items-list'),
      itemsCount: document.getElementById('items-count'),
      itemMessage: document.getElementById('item-message'),
      formAddItem: document.getElementById('form-add-item'),
      newItem: document.getElementById('new-item'),
      newItemDifficulty: document.getElementById('new-item-difficulty'),
      btnReset: document.getElementById('btn-reset'),
      printDate: document.getElementById('print-date'),
      modalCloseBackdrop: document.querySelector('[data-modal-close]'),
    };
  }

  function fillSizeOptions() {
    const select = els.sizeSelect;
    select.textContent = '';
    bingo.SIZES.forEach((size) => {
      select.appendChild(ui.el('option', { value: String(size), text: size + ' × ' + size }));
    });
  }

  function wireEvents() {
    els.btnNewBoard.addEventListener('click', () => newBoard());
    els.btnPrint.addEventListener('click', () => window.print());
    els.btnItems.addEventListener('click', () => openItemsModal());
    els.btnBackground.addEventListener('click', () => shuffleBackground());
    els.sizeSelect.addEventListener('change', () => setBoardSize(parseInt(els.sizeSelect.value, 10)));
    els.freeSpaceCheckbox.addEventListener('change', () => toggleFreeSpace(els.freeSpaceCheckbox.checked));
    els.btnModalClose.addEventListener('click', () => closeItemsModal());
    if (els.modalCloseBackdrop) els.modalCloseBackdrop.addEventListener('click', () => closeItemsModal());
    els.btnReset.addEventListener('click', () => resetAll());

    els.formAddItem.addEventListener('submit', (event) => {
      event.preventDefault();
      if (addItem(els.newItem.value, els.newItemDifficulty.value)) {
        els.newItem.value = '';
        els.newItem.focus();
      }
    });

    els.itemsList.addEventListener('click', (event) => {
      const target = event.target.closest('button[data-action]');
      if (!target) return;
      const index = parseInt(target.getAttribute('data-index'), 10);
      const action = target.getAttribute('data-action');
      if (action === 'remove') removeItem(index);
      else if (action === 'edit') renderEditRow(index);
    });

    els.itemsList.addEventListener('change', (event) => {
      const select = event.target.closest('select');
      if (!select) return;
      const index = parseInt(select.getAttribute('data-index'), 10);
      if (Number.isInteger(index)) setItemDifficulty(index, select.value);
    });

    els.board.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-index]');
      if (!button) return;
      toggleCell(parseInt(button.getAttribute('data-index'), 10));
    });

    document.addEventListener('keydown', (event) => {
      if (els.modal.classList.contains('hidden')) return;
      if (event.key === 'Escape') closeItemsModal();
      else ui.trapTabKey(event, els.modal);
    });
  }

  function setPrintDate() {
    try {
      els.printDate.textContent = new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      els.printDate.textContent = '';
    }
  }

  function init() {
    cacheElements();
    fillSizeOptions();
    loadState();
    ui.setBackground(state.background);
    syncControls();
    renderBoard();
    renderItems();
    setPrintDate();
    wireEvents();
  }

  return { init };
})();

app.init();

if (typeof module !== 'undefined' && module.exports) module.exports = app;
