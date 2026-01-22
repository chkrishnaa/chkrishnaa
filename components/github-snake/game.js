const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ===== CONFIG ===== */
const COLS = 52;
const ROWS = 7;
const CELL = 13;
const GAP = 1;
const SNAKE_LEN = 15;
const SPEED = 150;
const DISTANCE_MODE_THRESHOLD = 15;

// console.log("JS loaded");


let lastEatTime = Date.now();
let inactivityTimeout = null;

let countdownStarted = false;
let countdownInterval = null;
let countdownRemaining = 30;


/* ===== CANVAS ===== */
canvas.width = COLS * CELL;
canvas.height = ROWS * CELL;

/* ===== COLORS ===== */
const GRID_COLORS = [
  "#161b22",
  "#0e4429",
  "#006d32",
  "#26a641",
  "#39d353"
];

const SNAKE_HEAD = "#d70000";
const SNAKE_TAIL = "#ffdddd";

/* ===== STATE ===== */
let grid = [];
let snake = [];
let direction = { x: 1, y: 0 };
let score = 0;
let interval;

let visitMap = Array.from({ length: ROWS }, () =>
  Array(COLS).fill(0)
);

function showOverlay(message, scoreText, colorClass) {
  document.getElementById("overlay").classList.remove("hidden");
  document.getElementById("overlay-message").innerText = message;
  document.getElementById("overlay-score").innerText = scoreText;

  document.getElementById("overlay-message").className = colorClass;
  document.getElementById("overlay-score").className = colorClass;

  // hide game UI
  canvas.style.display = "none";
  document.getElementById("footer").style.display = "none";
}

function hideOverlay() {
  document.getElementById("overlay").classList.add("hidden");
  canvas.style.display = "block";
  document.getElementById("footer").style.display = "flex";
}


/* ===== UTILS ===== */
function lerpColor(a, b, t) {
  const ah = parseInt(a.slice(1), 16);
  const bh = parseInt(b.slice(1), 16);
  const ar = ah >> 16, ag = (ah >> 8) & 255, ab = ah & 255;
  const br = bh >> 16, bg = (bh >> 8) & 255, bb = bh & 255;
  return `rgb(${Math.round(ar + t * (br - ar))},
              ${Math.round(ag + t * (bg - ag))},
              ${Math.round(ab + t * (bb - ab))})`;
}

function isInside(x, y) {
  return x >= 0 && y >= 0 && x < COLS && y < ROWS;
}

function isSnakeCell(x, y) {
  return snake.some(s => s.x === x && s.y === y);
}

/* ===== GRID ===== */
function generateGrid() {
  grid = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () =>
      Math.random() < 0.35 ? Math.ceil(Math.random() * 4) : 0
    )
  );
}

/* ===== SNAKE ===== */
function initSnake() {
  snake = [];
  const cx = Math.floor(COLS / 2);
  const cy = Math.floor(ROWS / 2);

  for (let i = 0; i < SNAKE_LEN; i++) {
    snake.push({ x: cx - i, y: cy });
  }

  direction = { x: 1, y: 0 };
  score = 0;

  visitMap = Array.from({ length: ROWS }, () =>
    Array(COLS).fill(0)
  );
}

/* ===== COUNTER FUNCTION ===== */
function countRemaining() {
  let count = 0;
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++)
      if (grid[y][x] > 0) count++;
  return count;
}

/* ===== TARGET SEARCH ===== */
function nearestFood(head) {
  let best = null;
  let min = Infinity;

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x] > 0) {
        const d = Math.abs(x - head.x) + Math.abs(y - head.y);
        if (d < min) {
          min = d;
          best = { x, y };
        }
      }
    }
  }
  return best;
}

function freeNeighbors(x, y) {
  const dirs = [
    { x: 1, y: 0 }, { x: -1, y: 0 },
    { x: 0, y: 1 }, { x: 0, y: -1 }
  ];
  let c = 0;
  for (const d of dirs) {
    const nx = x + d.x, ny = y + d.y;
    if (isInside(nx, ny) && !isSnakeCell(nx, ny)) c++;
  }
  return c;
}

function hasAnyValidMove() {
  const head = snake[0];
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
  ];

  return dirs.some(d => {
    const nx = head.x + d.x;
    const ny = head.y + d.y;
    return isInside(nx, ny) && !isSnakeCell(nx, ny);
  });
}


/* ===== DISTANCE MODE (FINAL EATER) ===== */
function shortestDistanceDir() {
  const head = snake[0];
  const target = nearestFood(head);
  if (!target) return;

  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
  ];

  let best = null;
  let minDist = Infinity;

  for (const d of dirs) {
    const nx = head.x + d.x;
    const ny = head.y + d.y;

    if (!isInside(nx, ny)) continue;
    if (isSnakeCell(nx, ny)) continue;

    const dist =
      Math.abs(nx - target.x) + Math.abs(ny - target.y);

    if (dist < minDist) {
      minDist = dist;
      best = d;
    }
  }

  if (best) direction = best;
}

/* ===== NORMAL AI ===== */
function chooseDirection() {
  const head = snake[0];
  const target = nearestFood(head);

  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
  ];

  let best = null;
  let bestScore = -Infinity;

  for (const d of dirs) {
    const nx = head.x + d.x;
    const ny = head.y + d.y;

    if (!isInside(nx, ny)) continue;
    if (isSnakeCell(nx, ny)) continue;

    let s = 0;

    if (target) {
      s -= Math.abs(nx - target.x) + Math.abs(ny - target.y);
    }

    s += freeNeighbors(nx, ny) * 2;
    s -= visitMap[ny][nx] * 2;

    if (d.x === -direction.x && d.y === -direction.y) s -= 6;

    if (s > bestScore) {
      bestScore = s;
      best = d;
    }
  }

  if (best) direction = best;
}

/* ===== DRAW ===== */
function drawCell(x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(
    x * CELL,
    y * CELL,
    CELL - GAP,
    CELL - GAP,
    3
  );
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++)
      drawCell(x, y, GRID_COLORS[grid[y][x]]);

  snake.forEach((s, i) => {
    drawCell(
      s.x,
      s.y,
      lerpColor(SNAKE_HEAD, SNAKE_TAIL, i / (SNAKE_LEN - 1))
    );
  });

  document.getElementById("score").innerText = `Score: ${score}`;
}

function resetInactivityTimer() {
  lastEatTime = Date.now();
  countdownStarted = false; // ✅ REQUIRED

  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
    document.getElementById("timer").innerText = "";
  }
}


function startCountdown() {
  if (countdownInterval) return; // already running

  countdownRemaining = 60;
  document.getElementById("timer").innerText =
    `Timeout in: ${countdownRemaining}s`;

  countdownInterval = setInterval(() => {
    countdownRemaining--;

    document.getElementById("timer").innerText =
      `Timeout in: ${countdownRemaining}s`;

    if (countdownRemaining <= 0) {
      clearInterval(countdownInterval);
      endGame("timeout"); // forced end
    }
  }, 1000);
}

/* ===== GAME STEP ===== */
function step() {
   if (countRemaining() === 0) {
  endGame("success");
  return;
}

    if (!hasAnyValidMove()) {
    endGame("deadlock");
    return;
  }

   if (!countdownStarted && Date.now() - lastEatTime >= 5000) {
    countdownStarted = true;
    startCountdown();
  }

  const remaining = countRemaining();

  if (remaining <= DISTANCE_MODE_THRESHOLD) {
    shortestDistanceDir(); // 🔥 FORCE EAT MODE
  } else {
    chooseDirection();
  }

  const next = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  if (!isInside(next.x, next.y) || isSnakeCell(next.x, next.y)) return;

  if (grid[next.y][next.x] > 0) {
    score += grid[next.y][next.x];
    grid[next.y][next.x] = 0;

    resetInactivityTimer();
  }

  snake.unshift(next);
  snake.pop();

  visitMap[next.y][next.x] += 1;

  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++)
      visitMap[y][x] = Math.max(0, visitMap[y][x] - 0.02);

  draw();




}

/* ===== END / RESTART ===== */
function endGame(reason = "normal") {
  clearInterval(interval);
  clearInterval(countdownInterval);
countdownInterval = null;


  let message = "";
  let color = "overlay-red";

  if (reason === "timeout") {
    message = "TIME OUT!!!";
  } 
  else if (reason === "success") {
    message = "SUCCESSFULLY DONE 🎉";
    color = "overlay-green";
  } 
  else {
    message = "GAME OVER";
  }

  showOverlay(
    message,
    `Final Score: ${score}`,
    color
  );

  setTimeout(startGame, 10000);
}




function startGame() {
  hideOverlay();

  generateGrid();
  initSnake();
  draw();
  resetInactivityTimer();
  document.getElementById("status").innerText = "";

  interval = setInterval(step, SPEED);
}


startGame();
