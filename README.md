# brainstormbingo
This project generates two bingo sheets for Magic The Gathering Commander, using a single JavaScript script and a static HTML file. The sheet includes a 5x5 grid of Commander-related tasks, such as "Win a game with 40 or more life" or "Destroy three or more artifacts in a single turn."

## How to Use

1. Download or clone the repository to your local machine.
2. Open the `index.html` file in your preferred web browser.
3. Click the "Generate" button to create a new randomized bingo sheet until you're happy.

## Customizing the Sheet

If you want to customize the tasks included on the sheet, you can modify the `challenges` array in the `script.js` file. Each challenge is marked with a title and difficulty, 1 being easy and 4 being hardest. Harder challenges are weighted towards the center of the bingo sheet, while easier tasks are weighted towards the outter cells of the bingo sheet.
