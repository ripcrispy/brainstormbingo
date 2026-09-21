// tests/smoke.js — DOM smoke test (run: node tests/smoke.js from /tmp/opencode/bbtest or anywhere with jsdom)
'use strict';

const path = require('node:path');
const fs = require('node:fs');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');

const REPO = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(REPO, 'index.html'), 'utf8');

class LocalOnlyLoader extends ResourceLoader {
  fetch(url, options) {
    if (url.startsWith('file://')) return super.fetch(url, options);
    return Promise.resolve(Buffer.from(''));
  }
}

const virtualConsole = new VirtualConsole();
const pageErrors = [];
virtualConsole.on('jsdomError', (e) => {
  if (!/Could not load link|Could not load script|css/i.test(String(e.message || e))) pageErrors.push(String(e));
});
virtualConsole.on('error', (...args) => pageErrors.push(args.join(' ')));

// jsdom has no localStorage for file:// origins (real browsers do); shim it in-memory.
function makeLocalStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(String(k), String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

const dom = new JSDOM(html, {
  url: 'file://' + REPO + '/index.html',
  runScripts: 'dangerously',
  resources: new LocalOnlyLoader(),
  virtualConsole,
  pretendToBeVisual: true,
  beforeParse(window) {
    Object.defineProperty(window, 'localStorage', { value: makeLocalStorage() });
  },
});

const { window } = dom;
const { document } = window;

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) {
    passed++;
    console.log('  ok - ' + name);
  } else {
    failed++;
    console.log('  FAIL - ' + name);
  }
}

function fire(el, type) {
  el.dispatchEvent(new window.Event(type, { bubbles: true, cancelable: true }));
}
function click(el) {
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
}

window.confirm = () => true;

setTimeout(() => {
  try {
    console.log('smoke: initial render');
    const board = document.getElementById('board');
    const cells = board.querySelectorAll('button[data-index]');
    check('5x5 board rendered with 25 cells', cells.length === 25);
    check('grid template set to 5 cols', (board.style.gridTemplateColumns || '').includes('repeat(5'));
    check('body background uses a preserved image', /img\/\d+\.jpg/.test(window.getComputedStyle(document.body).backgroundImage));
    check('board cells have unique text', new Set([...cells].map((c) => c.textContent.trim())).size === 25);
    check('title preserved', document.querySelector('h1').textContent === 'Brainstorm Bingo');
    check('subheader preserved', document.querySelector('h2').textContent === 'Commander Challenges');

    console.log('smoke: marking cells');
    const first = board.querySelector('button[data-index="0"]');
    click(first);
    check('cell marked (aria-pressed)', first.getAttribute('aria-pressed') === 'true');
    check('cell has marked class', first.classList.contains('bg-black/60'));
    check('checkmark visible', !first.querySelector('.bb-check').classList.contains('hidden'));
    click(first);
    check('cell unmarked again', first.getAttribute('aria-pressed') === 'false');
    // mark two for the persistence check
    click(board.querySelector('button[data-index="1"]'));
    click(board.querySelector('button[data-index="5"]'));

    console.log('smoke: persistence');
    const savedRaw = window.localStorage.getItem('brainstorm-bingo/v1');
    check('state saved to localStorage', !!savedRaw);
    const saved = JSON.parse(savedRaw);
    check('saved board has marks', saved.board.cells[1].marked === true && saved.board.cells[5].marked === true);
    check('saved items length 61', saved.items.length === 61);

    console.log('smoke: items modal');
    click(document.getElementById('btn-items'));
    const modal = document.getElementById('modal');
    check('modal opened', !modal.classList.contains('hidden'));
    const list = document.getElementById('items-list');
    check('61 item rows rendered', list.querySelectorAll('li').length === 61);
    check('items count label present', /61 item/.test(document.getElementById('items-count').textContent));

    // add a valid item
    const input = document.getElementById('new-item');
    input.value = 'Smoke test item';
    fire(document.getElementById('form-add-item'), 'submit');
    check('item added (62 rows)', list.querySelectorAll('li').length === 62);
    check('success message shown', /added/i.test(document.getElementById('item-message').textContent));

    // duplicate rejected
    input.value = '  smoke test item ';
    fire(document.getElementById('form-add-item'), 'submit');
    check('duplicate rejected (still 62 rows)', list.querySelectorAll('li').length === 62);
    check('duplicate error shown', /already/i.test(document.getElementById('item-message').textContent));

    // empty rejected
    input.value = '   ';
    fire(document.getElementById('form-add-item'), 'submit');
    check('empty rejected (still 62 rows)', list.querySelectorAll('li').length === 62);

    // remove the smoke item (last row)
    const removeBtns = list.querySelectorAll('button[data-action="remove"]');
    click(removeBtns[removeBtns.length - 1]);
    check('item removed (61 rows)', list.querySelectorAll('li').length === 61);

    // edit first item and back
    const editBtns = list.querySelectorAll('button[data-action="edit"]');
    click(editBtns[0]);
    const editInput = list.querySelector('li input[type="text"]');
    check('edit row shows input', !!editInput);
    editInput.value = 'Finish the game without searching your library (edited)';
    click(list.querySelector('li').querySelector('button'));
    check('item edited', /edited/.test(list.querySelector('li').textContent));

    // close modal
    click(document.getElementById('btn-modal-close'));
    check('modal closed', modal.classList.contains('hidden'));

    console.log('smoke: board size change');
    const sizeSelect = document.getElementById('select-size');
    sizeSelect.value = '4';
    fire(sizeSelect, 'change');
    const cells4 = board.querySelectorAll('button[data-index]');
    check('4x4 board rendered with 16 cells', cells4.length === 16);

    console.log('smoke: free space');
    const chk = document.getElementById('chk-free-space');
    chk.checked = true;
    fire(chk, 'change');
    check('free cell rendered', !!board.querySelector('.bb-free'));
    check('4x4 + free = 15 item cells', board.querySelectorAll('button[data-index]').length === 15);
    chk.checked = false;
    fire(chk, 'change');
    check('free space removed', !board.querySelector('.bb-free') && board.querySelectorAll('button[data-index]').length === 16);

    console.log('smoke: insufficient items error');
    // remove down to 12 items
    for (let i = 0; i < 49; i++) {
      const btns = document.getElementById('items-list').querySelectorAll('button[data-action="remove"]');
      if (!btns.length) break;
      click(btns[btns.length - 1]);
    }
    const rowsLeft = document.getElementById('items-list').querySelectorAll('li').length;
    check('items reduced to ' + rowsLeft, rowsLeft <= 16 && rowsLeft >= 12);
    sizeSelect.value = '5';
    fire(sizeSelect, 'change');
    const msg = document.getElementById('message');
    check('insufficient error shown', /Not enough bingo items/i.test(msg.textContent));
    check('error mentions needed count', /requires 25/.test(msg.textContent));
    check('error mentions current count', /You currently have \d+/.test(msg.textContent));
    check('action button present', !!msg.querySelector('button'));

    console.log('smoke: new board with marks confirms');
    // restore enough items
    for (let i = 0; i < 25; i++) {
      input.value = 'Restored item ' + i;
      fire(document.getElementById('form-add-item'), 'submit');
    }
    sizeSelect.value = '5';
    fire(sizeSelect, 'change');
    const cellA = board.querySelector('button[data-index="0"]');
    click(cellA);
    let confirmed = false;
    window.confirm = () => {
      confirmed = true;
      return true;
    };
    click(document.getElementById('btn-new-board'));
    check('confirm shown when marks exist', confirmed);
    check('marks cleared after new board', board.querySelector('button[data-index="0"]').getAttribute('aria-pressed') === 'false');

    console.log('smoke: reset');
    click(document.getElementById('btn-reset'));
    check('items restored to 61 after reset', document.getElementById('items-list').querySelectorAll('li').length === 61);
    check('size reset to 5', sizeSelect.value === '5');

    console.log('smoke: print');
    let printed = false;
    window.print = () => {
      printed = true;
    };
    click(document.getElementById('btn-print'));
    check('print() called', printed);
    check('print date set', document.getElementById('print-date').textContent.length > 0);

    console.log('smoke: console/page errors');
    check('no page errors', pageErrors.length === 0, pageErrors);
    if (pageErrors.length) console.log('   page errors: ' + JSON.stringify(pageErrors, null, 2));

    console.log('smoke: refresh persistence');
    // Simulate a page reload: fresh JSDOM sharing the same localStorage data.
    const savedRaw2 = window.localStorage.getItem('brainstorm-bingo/v1');
    const savedState = JSON.parse(savedRaw2);
    const savedBoardTexts = savedState.board.cells.filter(Boolean).map((c) => c.text);
    const savedMarked = savedState.board.cells.map((c) => (c ? c.marked : null));
    const dom2 = new JSDOM(html, {
      url: 'file://' + REPO + '/index.html',
      runScripts: 'dangerously',
      resources: new LocalOnlyLoader(),
      virtualConsole: new VirtualConsole(),
      pretendToBeVisual: true,
      beforeParse(window2) {
        const store2 = new Map();
        store2.set('brainstorm-bingo/v1', savedRaw2);
        Object.defineProperty(window2, 'localStorage', {
          value: {
            getItem: (k) => (store2.has(k) ? store2.get(k) : null),
            setItem: (k, v) => store2.set(String(k), String(v)),
            removeItem: (k) => store2.delete(k),
            clear: () => store2.clear(),
          },
        });
      },
    });
    setTimeout(() => {
      try {
        const doc2 = dom2.window.document;
        const cells2 = [...doc2.querySelectorAll('#board button[data-index]')];
        check('refreshed board has same number of cells', cells2.length === savedState.board.cells.filter(Boolean).length);
        check(
          'refreshed board restored the same items',
          cells2.map((c) => c.querySelector('span:last-child').textContent.trim()).sort().join('|') ===
            savedBoardTexts.sort().join('|')
        );
        check(
          'refreshed board restored marks',
          cells2.every((c) => {
            const i = parseInt(c.getAttribute('data-index'), 10);
            return c.getAttribute('aria-pressed') === String(!!savedMarked[i]);
          })
        );
        check('refreshed items list count', doc2.querySelectorAll('#items-list li').length === savedState.items.length);
        check('size select restored', doc2.getElementById('select-size').value === String(savedState.size));

        console.log('\n' + passed + ' passed, ' + failed + ' failed');
        process.exit(failed ? 1 : 0);
      } catch (e) {
        console.error('REFRESH PHASE CRASHED:', e);
        process.exit(1);
      }
    }, 300);
    return;
  } catch (e) {
    console.error('SMOKE TEST CRASHED:', e);
    process.exit(1);
  }
}, 300);
