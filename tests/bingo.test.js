// tests/bingo.test.js — unit tests for js/bingo.js (run: node tests/bingo.test.js)
'use strict';

const assert = require('node:assert');
const path = require('node:path');
const bingo = require(path.join(__dirname, '..', 'js', 'bingo.js'));

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('  ok - ' + name);
}

const items = bingo.DEFAULT_ITEMS.map((i) => ({ text: i.text, difficulty: i.difficulty }));
// 64+ items so every board size (up to 8x8) can be generated in the matrix test below.
const enoughItems = items.concat(['a', 'b', 'c'].map((t) => ({ text: 'Extra filler item ' + t, difficulty: 2 })));
console.log('bingo.js defaults:');
test('default items migrated (61 challenges)', () => {
  assert.strictEqual(bingo.DEFAULT_ITEMS.length, 61);
  const difficulties = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const i of bingo.DEFAULT_ITEMS) difficulties[i.difficulty]++;
  console.log('       difficulty counts: ' + JSON.stringify(difficulties));
});

console.log('generateBoard:');
for (const size of [3, 4, 5, 6, 7, 8]) {
  for (const free of [false, true]) {
    test(
      size + 'x' + size + (free ? ' +free' : '') + ' generates with unique items',
      () => {
        const r = bingo.generateBoard(enoughItems, size, free);
        assert.ok(r.ok, 'expected ok, got ' + JSON.stringify(r));
        assert.strictEqual(r.cells.length, size * size);
        const texts = r.cells.filter(Boolean).map((c) => c.text);
        assert.strictEqual(new Set(texts).size, texts.length, 'no duplicate items on board');
        assert.strictEqual(texts.length, bingo.requiredItems(size, free));
        if (free) {
          assert.strictEqual(r.cells[bingo.freeIndex(size)], null);
        } else {
          assert.ok(r.cells.every((c) => c && c.marked === false));
        }
      }
    );
  }
}

test('insufficient items returns a clear error', () => {
  const few = items.slice(0, 12);
  const r = bingo.generateBoard(few, 5, false);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.code, 'insufficient');
  assert.strictEqual(r.needed, 25);
  assert.strictEqual(r.have, 12);
});

test('free space reduces required count by 1', () => {
  assert.strictEqual(bingo.requiredItems(5, false), 25);
  assert.strictEqual(bingo.requiredItems(5, true), 24);
  assert.strictEqual(bingo.requiredItems(6, true), 35);
  const r = bingo.generateBoard(items.slice(0, 35), 6, true);
  assert.ok(r.ok);
});

test('free index is the centre cell for odd sizes', () => {
  assert.strictEqual(bingo.freeIndex(3), 4);
  assert.strictEqual(bingo.freeIndex(5), 12);
  assert.strictEqual(bingo.freeIndex(7), 24);
});

test('free index is top-left of central four for even sizes', () => {
  assert.strictEqual(bingo.freeIndex(4), 5); // (1,1)
  assert.strictEqual(bingo.freeIndex(6), 14); // (2,2)
  assert.strictEqual(bingo.freeIndex(8), 27); // (3,3)
});

test('difficulty band generalises centre weighting', () => {
  // 5x5: centre hardest, rim easiest
  assert.deepStrictEqual(bingo.difficultyBand(2, 2, 5).sort(), [2, 3, 4]);
  assert.ok(bingo.difficultyBand(0, 0, 5).includes(1));
  assert.ok(!bingo.difficultyBand(0, 0, 5).includes(4));
  // 6x6: central 2x2 hard
  assert.deepStrictEqual(bingo.difficultyBand(2, 2, 6).sort(), [2, 3, 4]);
  assert.deepStrictEqual(bingo.difficultyBand(3, 3, 6).sort(), [2, 3, 4]);
});

test('generates even when only one difficulty level exists', () => {
  const mono = items.slice(0, 30).map((i) => ({ text: i.text, difficulty: 4 }));
  const r = bingo.generateBoard(mono, 5, false);
  assert.ok(r.ok);
  assert.strictEqual(new Set(r.cells.map((c) => c.text)).size, 25);
});

test('duplicate detection is case-insensitive and trims', () => {
  const list = [{ text: '  Foo Bar  ', difficulty: 1 }];
  assert.strictEqual(bingo.findDuplicate(list, 'foo bar'), 0);
  assert.strictEqual(bingo.findDuplicate(list, 'baz'), -1);
  assert.strictEqual(bingo.normalizeText('  a   b '), 'a b');
});

console.log('\n' + passed + ' tests passed');
