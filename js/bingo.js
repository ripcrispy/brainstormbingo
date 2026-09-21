// bingo.js — pure board-generation logic (no DOM)
'use strict';

const bingo = (() => {
  const MIN_SIZE = 3;
  const MAX_SIZE = 8;
  const SIZES = [3, 4, 5, 6, 7, 8];

  // Default bingo items, migrated from the original script.js
  // (difficulty: 1 = easiest, 4 = hardest).
  const DEFAULT_ITEMS = [
    { text: "Finish the game without searching your library", difficulty: 1 },
    { text: "Deal the first damage and last damage of the game", difficulty: 2 },
    { text: "Spend 15 or more mana on a single spell", difficulty: 2 },
    { text: "Have 100 or more life", difficulty: 2 },
    { text: "Deal 21 commander damage in 1 game to 1 player", difficulty: 1 },
    { text: "Attack with total power 40 or more in one turn", difficulty: 1 },
    { text: "Control 8 or more non-token enchantments", difficulty: 2 },
    { text: "Control 10 or more non-token artifacts", difficulty: 2 },
    { text: "Control 3 or more planeswalkers", difficulty: 1 },
    { text: "Control 10 or more creatures with different names", difficulty: 2 },
    { text: "Control 3 or more non-token creatures with the same name", difficulty: 3 },
    { text: "Control 20 or more tokens", difficulty: 1 },
    { text: "Gain control of a permanent from each player in 1 game", difficulty: 2 },
    { text: "Give control of a permanent to each player in 1 game", difficulty: 2 },
    { text: "Copy or gain control of another player's spell", difficulty: 1 },
    { text: "Control 25 or more lands", difficulty: 3 },
    { text: "Use a fog ability to save a player from death", difficulty: 1 },
    { text: "Reanimate 10 or more permanents in one game", difficulty: 2 },
    { text: "Control 6 or more legendary permanents", difficulty: 2 },
    { text: "Cause a player to lose 20 Life in 1 turn", difficulty: 1 },
    { text: "Ramp 3 times on the same turn", difficulty: 2 },
    { text: "Cast your commander 5 times in 1 game", difficulty: 2 },
    { text: "Cast a spell that benefits all players", difficulty: 1 },
    { text: "Cast a board-wipe 2 turns in a row", difficulty: 2 },
    { text: "Counter a spell that would counter a spell", difficulty: 2 },
    { text: "Draw 10 or more cards in a single turn", difficulty: 1 },
    { text: "Attack the same player 3 combats in a row", difficulty: 2 },
    { text: "Control 10 or more non-basic lands", difficulty: 1 },
    { text: "Kill each opponents commander in the same game", difficulty: 3 },
    { text: "Play a vanilla creature", difficulty: 1 },
    { text: "Stop an activated or triggered ability", difficulty: 2 },
    { text: "Be the Monarch for 3 turns in a row", difficulty: 3 },
    { text: "Flip a coin and succeed 3 times in a row", difficulty: 3 },
    { text: "Roll a D20 and roll a 20", difficulty: 3 },
    { text: "Attack 3 different players by the end of turn 5", difficulty: 2 },
    { text: "Have 10 devotion to a single colour", difficulty: 3 },
    { text: "Have more cards in your graveyard/exile than in your library", difficulty: 2 },
    { text: "Have an empty hand at any point and then win", difficulty: 3 },
    { text: "Ultimate a planeswalker", difficulty: 3 },
    { text: "Create 1 of each Colour mana without tapping a land in 1 game", difficulty: 2 },
    { text: "Play a non-blue counterspell", difficulty: 2 },
    { text: "Don’t cast your commander and win", difficulty: 3 },
    { text: "Scry 10 cards in 1 game", difficulty: 1 },
    { text: "Have 3 keywords on 1 creature", difficulty: 1 },
    { text: "Remove 3 attacking creatures in 1 game", difficulty: 2 },
    { text: "Mulligan to 6 and win the game", difficulty: 1 },
    { text: "Sacrifice 7 non-tokens in 1 game", difficulty: 2 },
    { text: "Play a game with a Commander from the newest set", difficulty: 2 },
    { text: "Kill a player 2 turns in a row", difficulty: 3 },
    { text: "Control 5 Foils at one time", difficulty: 3 },
    { text: "Steal Monarch without a deal 2 times in 1 game", difficulty: 3 },
    { text: "Cast 6 spells in 1 turn", difficulty: 2 },
    { text: "Cause yourself to lose without conceding", difficulty: 1 },
    { text: "Kill a player while it’s not your turn", difficulty: 2 },
    { text: "Avoid losing the game 3 times in a game", difficulty: 3 },
    { text: "Cast 3 spells in one turn on an opponent's turn", difficulty: 2 },
    { text: "Play a 2 Headed Giant game", difficulty: 4 },
    { text: "Play a game of Planeschase", difficulty: 4 },
    { text: "Play a game of cEDH", difficulty: 4 },
    { text: "Win the roll for turn order", difficulty: 4 },
    { text: "Play a mono-coloured deck", difficulty: 1 },
  ];

  function shuffle(array) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // Difficulty band for a cell, generalising the original 5x5 weighting
  // (harder challenges towards the centre, easier ones towards the edges).
  // t = 0 is the exact centre, t = 1 is the outer rim.
  function difficultyBand(row, col, size) {
    const centre = (size - 1) / 2;
    if (centre === 0) return [1, 2, 3, 4];
    const t = Math.max(Math.abs(row - centre), Math.abs(col - centre)) / centre;
    if (t <= 1 / 3) return [2, 3, 4];
    if (t <= 2 / 3) return [1, 2, 3];
    return [1, 2];
  }

  // Free space: exact centre for odd sizes; for even sizes the
  // top-left of the central four cells (e.g. (2,2) on a 6x6 board).
  function freeIndex(size) {
    const mid = size % 2 === 1 ? (size - 1) / 2 : size / 2 - 1;
    return mid * size + mid;
  }

  function requiredItems(size, freeSpace) {
    return size * size - (freeSpace ? 1 : 0);
  }

  // Generates a board of unique items. Returns a result object;
  // never throws for user-level errors.
  function generateBoard(items, size, freeSpace) {
    if (!Number.isInteger(size) || size < MIN_SIZE || size > MAX_SIZE) {
      return { ok: false, code: 'invalid-size' };
    }
    const needed = requiredItems(size, freeSpace);
    if (items.length < needed) {
      return { ok: false, code: 'insufficient', needed, have: items.length };
    }

    const freeIdx = freeSpace ? freeIndex(size) : -1;
    const pool = shuffle(items.map((item) => ({ text: item.text, difficulty: item.difficulty })));
    const cells = [];

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const idx = row * size + col;
        if (idx === freeIdx) {
          cells.push(null);
          continue;
        }
        const band = difficultyBand(row, col, size);
        let candidates = pool.filter((item) => band.includes(item.difficulty));
        if (candidates.length === 0) candidates = pool; // fall back to any unused item
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        pool.splice(pool.indexOf(pick), 1);
        cells.push({ text: pick.text, marked: false });
      }
    }

    return { ok: true, n: size, free: !!freeSpace, freeIndex: freeIdx, cells };
  }

  function normalizeText(raw) {
    return String(raw == null ? '' : raw).replace(/\s+/g, ' ').trim();
  }

  function findDuplicate(items, text) {
    const wanted = normalizeText(text).toLowerCase();
    if (!wanted) return -1;
    return items.findIndex((item) => normalizeText(item.text).toLowerCase() === wanted);
  }

  function difficultyLabel(value) {
    const labels = { 1: 'Easy', 2: 'Medium', 3: 'Hard', 4: 'Hardest' };
    return labels[value] || labels[2];
  }

  return {
    MIN_SIZE,
    MAX_SIZE,
    SIZES,
    DEFAULT_ITEMS,
    shuffle,
    difficultyBand,
    freeIndex,
    requiredItems,
    generateBoard,
    normalizeText,
    findDuplicate,
    difficultyLabel,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = bingo;
