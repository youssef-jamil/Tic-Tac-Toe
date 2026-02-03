// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────
let NUMBER_OF_ROWS = 3;
let currentPlayer = "X";
let turnCount = 0;
let board = []; // 2-D array
let gameActive = true;
let scores = { X: 0, O: 0 };

// ─────────────────────────────────────────────
// DOM refs
// ─────────────────────────────────────────────
const setupCard = document.getElementById("setupCard");
const gameWrapper = document.getElementById("gameWrapper");
const rowCountEl = document.getElementById("rowCount");
const btnPlus = document.getElementById("btnPlus");
const btnMinus = document.getElementById("btnMinus");
const btnStart = document.getElementById("btnStart");
const boardEl = document.getElementById("board");
const scoreXEl = document.getElementById("scoreX");
const scoreOEl = document.getElementById("scoreO");
const scoreCardX = document.getElementById("scoreCardX");
const scoreCardO = document.getElementById("scoreCardO");
const turnEl = document.getElementById("turnIndicator");
const btnReset = document.getElementById("btnReset");
const btnBack = document.getElementById("btnBack");
const msgOverlay = document.getElementById("msgOverlay");
const msgTitle = document.getElementById("msgTitle");
const msgSub = document.getElementById("msgSub");
const btnMsgOk = document.getElementById("btnMsgOk");

// ─────────────────────────────────────────────
// Setup screen – row size picker
// ─────────────────────────────────────────────
btnPlus.addEventListener("click", () => {
  if (NUMBER_OF_ROWS < 9) {
    NUMBER_OF_ROWS++;
    rowCountEl.textContent = NUMBER_OF_ROWS;
  }
});
btnMinus.addEventListener("click", () => {
  if (NUMBER_OF_ROWS > 2) {
    NUMBER_OF_ROWS--;
    rowCountEl.textContent = NUMBER_OF_ROWS;
  }
});
btnStart.addEventListener("click", startGame);

// ─────────────────────────────────────────────
// Start / show game
// ─────────────────────────────────────────────
function startGame() {
  setupCard.style.display = "none";
  gameWrapper.style.display = "flex";
  scores = { X: 0, O: 0 };
  updateScoreUI();
  initRound();
}

// ─────────────────────────────────────────────
// Init / reset a single round
// ─────────────────────────────────────────────
function initRound() {
  currentPlayer = "X";
  turnCount = 0;
  gameActive = true;
  board = Array.from({ length: NUMBER_OF_ROWS }, () =>
    Array(NUMBER_OF_ROWS).fill("_"),
  );
  renderBoard();
  updateTurnUI();
}

// ─────────────────────────────────────────────
// Render board grid + cells
// ─────────────────────────────────────────────
function renderBoard() {
  boardEl.innerHTML = "";
  boardEl.style.gridTemplateColumns = `repeat(${NUMBER_OF_ROWS}, 1fr)`;

  // dynamic cell size so big boards still fit
  const cellSize = Math.min(64, Math.floor(320 / NUMBER_OF_ROWS));
  boardEl.style.width =
    cellSize * NUMBER_OF_ROWS + 6 * (NUMBER_OF_ROWS - 1) + 20 + "px";

  const total = NUMBER_OF_ROWS * NUMBER_OF_ROWS;
  for (let i = 0; i < total; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.setAttribute("role", "button");
    cell.setAttribute("tabindex", "0");
    cell.setAttribute(
      "aria-label",
      `Row ${Math.floor(i / NUMBER_OF_ROWS) + 1}, Column ${(i % NUMBER_OF_ROWS) + 1}`,
    );
    cell.style.width = cellSize + "px";
    cell.style.height = cellSize + "px";

    const span = document.createElement("span");
    span.className = "value";
    cell.appendChild(span);

    // ── events ──
    cell.addEventListener("click", () => handleMove(cell, i));
    cell.addEventListener("keydown", (e) => handleKeyDown(e, cell, i));

    boardEl.appendChild(cell);
  }

  // focus first cell for keyboard users
  boardEl.querySelector(".cell")?.focus();
}

// ─────────────────────────────────────────────
// Keyboard: arrow-key navigation + Enter/Space
// ─────────────────────────────────────────────
function handleKeyDown(e, cell, index) {
  const N = NUMBER_OF_ROWS;

  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    handleMove(cell, index);
    return;
  }

  // Arrow navigation
  let newIndex = null;
  switch (e.key) {
    case "ArrowUp":
      newIndex = index - N;
      break;
    case "ArrowDown":
      newIndex = index + N;
      break;
    case "ArrowLeft":
      newIndex = index - 1;
      if (index % N === 0) newIndex = null;
      break;
    case "ArrowRight":
      newIndex = index + 1;
      if ((index + 1) % N === 0) newIndex = null;
      break;
  }

  if (newIndex !== null && newIndex >= 0 && newIndex < N * N) {
    e.preventDefault();
    boardEl.children[newIndex].focus();
  }
}

// ─────────────────────────────────────────────
// Handle a move
// ─────────────────────────────────────────────
function handleMove(cell, index) {
  if (!gameActive) return;

  const row = Math.floor(index / NUMBER_OF_ROWS);
  const col = index % NUMBER_OF_ROWS;
  if (board[row][col] !== "_") return;

  // place
  board[row][col] = currentPlayer;
  turnCount++;

  cell.querySelector(".value").textContent = currentPlayer;
  cell.classList.add("cell--" + currentPlayer);

  // check win
  const winCells = getWinCells(currentPlayer);
  if (winCells) {
    gameActive = false;
    // highlight winning cells
    winCells.forEach((idx) => boardEl.children[idx].classList.add("winner"));
    scores[currentPlayer]++;
    updateScoreUI();
    setTimeout(() => showMessage(currentPlayer), 320);
    return;
  }

  // check draw
  if (turnCount === NUMBER_OF_ROWS * NUMBER_OF_ROWS) {
    gameActive = false;
    setTimeout(() => showDrawMessage(), 320);
    return;
  }

  // next turn
  currentPlayer = currentPlayer === "X" ? "O" : "X";
  updateTurnUI();
}

// ─────────────────────────────────────────────
// Win detection – returns array of winning indices or null
// ─────────────────────────────────────────────
function getWinCells(player) {
  const N = NUMBER_OF_ROWS;

  // rows
  for (let r = 0; r < N; r++) {
    if (board[r].every((v) => v === player)) {
      return Array.from({ length: N }, (_, c) => r * N + c);
    }
  }
  // columns
  for (let c = 0; c < N; c++) {
    let win = true;
    for (let r = 0; r < N; r++) {
      if (board[r][c] !== player) {
        win = false;
        break;
      }
    }
    if (win) return Array.from({ length: N }, (_, r) => r * N + c);
  }
  // diagonal
  {
    let win = true;
    for (let i = 0; i < N; i++) {
      if (board[i][i] !== player) {
        win = false;
        break;
      }
    }
    if (win) return Array.from({ length: N }, (_, i) => i * N + i);
  }
  // anti-diagonal
  {
    let win = true;
    for (let i = 0; i < N; i++) {
      if (board[i][N - 1 - i] !== player) {
        win = false;
        break;
      }
    }
    if (win) return Array.from({ length: N }, (_, i) => i * N + (N - 1 - i));
  }
  return null;
}

// ─────────────────────────────────────────────
// UI helpers
// ─────────────────────────────────────────────
function updateScoreUI() {
  scoreXEl.textContent = scores.X;
  scoreOEl.textContent = scores.O;
  scoreCardX.classList.toggle("active-x", currentPlayer === "X");
  scoreCardX.classList.remove("active-o");
  scoreCardO.classList.toggle("active-o", currentPlayer === "O");
  scoreCardO.classList.remove("active-x");
}

function updateTurnUI() {
  turnEl.innerHTML =
    currentPlayer === "X"
      ? 'Turn: <span class="turn-x">Player X</span>'
      : 'Turn: <span class="turn-o">Player O</span>';
  // also update active glow on score cards
  scoreCardX.classList.toggle("active-x", currentPlayer === "X");
  scoreCardO.classList.toggle("active-o", currentPlayer === "O");
  if (currentPlayer === "X") scoreCardO.classList.remove("active-o");
  else scoreCardX.classList.remove("active-x");
}

// ─────────────────────────────────────────────
// Message overlay
// ─────────────────────────────────────────────
function showMessage(winner) {
  msgTitle.textContent = `Player ${winner} Wins!`;
  msgTitle.className = "win-" + winner.toLowerCase();
  msgSub.textContent = "Well played!";
  msgOverlay.classList.add("show");
  btnMsgOk.focus();
}

function showDrawMessage() {
  msgTitle.textContent = "It's a Draw!";
  msgTitle.className = "draw";
  msgSub.textContent = "No one wins this round.";
  msgOverlay.classList.add("show");
  btnMsgOk.focus();
}

btnMsgOk.addEventListener("click", () => {
  msgOverlay.classList.remove("show");
  initRound();
});

// ─────────────────────────────────────────────
// Bottom buttons
// ─────────────────────────────────────────────
btnReset.addEventListener("click", initRound);

btnBack.addEventListener("click", () => {
  gameWrapper.style.display = "none";
  setupCard.style.display = "block";
  NUMBER_OF_ROWS = 3;
  rowCountEl.textContent = NUMBER_OF_ROWS;
});

// ─────────────────────────────────────────────
// Trap focus inside overlay when open
// ─────────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (msgOverlay.classList.contains("show")) {
    if (e.key === "Escape") {
      msgOverlay.classList.remove("show");
      initRound();
    }
    // keep focus on the button
    if (e.key === "Tab") {
      e.preventDefault();
      btnMsgOk.focus();
    }
  }
});
