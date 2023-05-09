// Random Background
var images = ['/img/1.jpg', '/img/2.jpg', '/img/3.jpg', '/img/4.jpg', '/img/5.jpg', '/img/6.jpg', '/img/7.jpg', '/img/8.jpg', '/img/9.jpg', '/img/10.jpg', '/img/11.jpg', '/img/12.jpg', '/img/13.jpg', '/img/14.jpg', '/img/15.jpg', '/img/16.jpg', '/img/17.jpg'];
document.body.style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)), url(' + images[Math.floor(Math.random() * images.length)] + ')';
document.body.style.backgoundBlendMode = 'darken';
document.body.style.backgroundRepeat = 'no-repeat';
document.body.style.backgroundSize = 'cover';

// Define an array of challenges, with each challenge represented as an object
const challenges = [
  { title: "Finish the game without searching your library", difficulty: 1 },
  { title: "Deal the first damage and last damage of the game", difficulty: 2 },
  { title: "Spend 15 or more mana on a single spell", difficulty: 2 },
  { title: "Have 100 or more life", difficulty: 2 },
  { title: "Deal 21 commander damage in 1 game to 1 player", difficulty: 1 },
  { title: "Attack with total power 40 or more in one turn", difficulty: 1 },
  { title: "Control 8 or more non-token enchantments", difficulty: 2 },
  { title: "Control 10 or more non-token artifacts", difficulty: 2 },
  { title: "Control 3 or more planeswalkers", difficulty: 1 },
  { title: "Control 10 or more creatures with different names", difficulty: 2 },
  { title: "Control 3 or more non-token creatures with the same name", difficulty: 3 },
  { title: "Control 20 or more tokens", difficulty: 1 },
  { title: "Gain control of a permanent from each player in 1 game", difficulty: 2 },
  { title: "Give control of a permanent to each player in 1 game", difficulty: 2 },
  { title: "Copy or gain control of another player's spell", difficulty: 1 },
  { title: "Control 25 or more lands", difficulty: 3 },
  { title: "Use a fog ability to save a player from death", difficulty: 1 },
  { title: "Reanimate 10 or more permanents in one game", difficulty: 2 },
  { title: "Control 6 or more legendary permanents", difficulty: 2 },
  { title: "Cause a player to lose 20 Life in 1 turn", difficulty: 1 },
  { title: "Ramp 3 times on the same turn", difficulty: 2 },
  { title: "Cast your commander 5 times in 1 game", difficulty: 2 },
  { title: "Cast a spell that benefits all players", difficulty: 1 },
  { title: "Cast a board-wipe 2 turns in a row", difficulty: 2 },
  { title: "Counter a spell that would counter a spell", difficulty: 2 },
  { title: "Draw 10 or more cards in a single turn", difficulty: 1 },
  { title: "Attack the same player 3 combats in a row", difficulty: 2 },
  { title: "Control 10 or more non-basic lands", difficulty: 1 },
  { title: "Kill each opponents commander in the same game", difficulty: 3 },
  { title: "Play a vanilla creature", difficulty: 1 },
  { title: "Stop an activated or triggered ability", difficulty: 2 },
  { title: "Be the Monarch for 3 turns in a row", difficulty: 3 },
  { title: "Flip a coin and succeed 3 times in a row", difficulty: 3 },
  { title: "Roll a D20 and roll a 20", difficulty: 3 },
  { title: "Attack 3 different players by the end of turn 5", difficulty: 2 },
  { title: "Have 10 devotion to a single colour", difficulty: 3 },
  { title: "Have more cards in your graveyard/exile than in your library", difficulty: 2 },
  { title: "Have an empty hand at any point and then win", difficulty: 3 },
  { title: "Ultimate a planeswalker", difficulty: 3 },
  { title: "Create 1 of each Colour mana without tapping a land in 1 game", difficulty: 2 },
  { title: "Play a non-blue counterspell", difficulty: 2 },
  { title: "Don’t cast your commander and win", difficulty: 3 },
  { title: "Scry 10 cards in 1 game", difficulty: 1 },
  { title: "Have 3 keywords on 1 creature", difficulty: 1 },
  { title: "Remove 3 attacking creatures in 1 game", difficulty: 2 },
  { title: "Mulligan to 6 and win the game", difficulty: 1 },
  { title: "Sacrifice 7 non-tokens in 1 game", difficulty: 2 },
  { title: "Play a game with a Commander from the newest set", difficulty: 2 },
  { title: "Kill a player 2 turns in a row", difficulty: 3 },
  { title: "Control 5 Foils at one time", difficulty: 3 },
  { title: "Steal Monarch without a deal 2 times in 1 game", difficulty: 3 },
  { title: "Cast 6 spells in 1 turn", difficulty: 2 },
  { title: "Cause yourself to lose without conceding", difficulty: 1 },
  { title: "Kill a player while it’s not your turn", difficulty: 2 },
  { title: "Avoid losing the game 3 times in a game", difficulty: 3 },
  { title: "Cast 3 spells in one turn on an opponent's turn", difficulty: 2 },
  { title: "Play a 2 Headed Giant game", difficulty: 4 },
  { title: "Play a game of Planeschase", difficulty: 4 },
  { title: "Play a game of cEDH", difficulty: 4 },
  { title: "Win the roll for turn order", difficulty: 4 },
  { title: "Play a mono-coloured deck", difficulty: 1 }
];

// Define an empty 5x5 table array
const table = [];
for (let i = 0; i < 5; i++) {
  table.push(new Array(5));
}

// Fill the table with randomized challenges, weighted by difficulty
for (let row = 0; row < 5; row++) {
  for (let col = 0; col < 5; col++) {
    // Calculate the appropriate difficulty distribution for this cell
    let difficulty;
    if ((row == 2 || row == 3) && (col == 2 || col == 3)) {
      // Cells at the center of the table should be harder
      difficulty = Math.floor(Math.random() * 3) + 2;
    } else if (row == 2 || row == 3 || col == 2 || col == 3) {
      // Cells in the middle of the table should have moderate difficulty
      difficulty = Math.floor(Math.random() * 3) + 1;
    } else {
      // Cells on the edges of the table should be easier
      difficulty = Math.floor(Math.random() * 2) + 1;
    }
    // Choose a random challenge of the appropriate difficulty
    const options = challenges.filter(c => c.difficulty == difficulty);
    if (options.length > 0) {
      const challenge = options[Math.floor(Math.random() * options.length)];
      // Assign the challenge to the table cell
      table[row][col] = challenge.title;
    } else {
      // If there are no challenges of the appropriate difficulty, leave the cell blank
      table[row][col] = difficulty;
    }
  }
}

// Function to shuffle the challenges array
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Function to add content to table
function tableContent(content, element) {
  for (let row = 0; row < 5; row++) {
    const tr = document.createElement('tr');
    for (let col = 0; col < 5; col++) {
      const td = document.createElement('td');
      td.textContent = content[row][col];
      tr.appendChild(td);
    }
    element.appendChild(tr);
  }
}

// Shuffle the challenges array
const shuffledChallenges = shuffle([...table]);

// Create the tables elements and add the rows and columns
const tableElement = document.createElement('table');
const tableElementShuffled = document.createElement('table');

// Add content to tables (shuffled for second)
tableContent(table, tableElement);
tableContent(shuffledChallenges, tableElementShuffled);

// Add the tables to the document body
const div = document.createElement('div');
div.className = 'tables';
document.body.appendChild(div);
div.appendChild(tableElement);
div.appendChild(tableElementShuffled);
