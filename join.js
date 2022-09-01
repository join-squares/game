// -@ts-check
const board = document.getElementById("game_board");
const draw = board.getContext("2d");

const BOARD_SIZE = board.width;
const START_SIZE = 8;
const START_COLORS = 3;
const START_TIME = 50;
const EMPTY_COLOR = "black";
const MIN_SELECTION = 4;
const MAX_SELECTION = 12;
const MAX_LEVEL = 10;
const BOMB_COLOR = "brown";
const colors = [EMPTY_COLOR, "yellow", "orangered", "dodgerblue", "seagreen", "orange", "mediumslateblue","lawngreen", "hotpink", "cyan", "pink"];
const level_num_colors = [3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6];
const click_sound = new Audio("sounds/laser.wav"); 
const join_sound = new Audio("sounds/apert2.wav"); 
const game_won_sound = new Audio("sounds/applause.wav"); 
const next_level_sound = new Audio("sounds/curve.wav");
const game_over_sound = new Audio("sounds/falling.wav"); 
const minus_points_sound = new Audio("sounds/pluck.wav");
const bomb_sound = new Audio("sounds/explos.wav");

let num_colors = START_COLORS;
let size = START_SIZE;
let square_size = BOARD_SIZE / size;
let start_date = Date.now();
let joined_squares = 0;
let new_time = 0;
let bomb = false;
let score = 0;
let hight_score = 0;
let time = 0;
let combo = 0;
let level = 0;
let squares = [];
let selected = [];
let selected_color = "";
let score_changed_time = 0;
let score_change = 0;
let next_level_time = 0;
let next_level_message = '';
let game_finished = false;
let timeInterval = 0;

function disableInput() {
  board.removeEventListener("mousedown", onClick);
  document.getElementById("join").disabled = true;
}

function enableInput() {
  board.addEventListener("mousedown", onClick, false);
  document.getElementById("join").disabled = false;
}

function setBomb(is_bomb) {
  bomb = is_bomb;
  document.getElementById("bomb").style.visibility = bomb ? "" : "hidden"; 
}

function startGame() {
  num_colors = START_COLORS;
  size = START_SIZE;
  start_date = Date.now();
  new_time = START_TIME;
  setBomb(true);
  joined_squares = 0;
  time = 0;
  score = 0;
  combo = 0;
  level = 0;
  selected_color = '';
  selected = [];
  game_finished = false;
  setBoard();
  enableInput();
  if (timeInterval) {
    clearInterval(timeInterval);
  }
  timeInterval = setInterval(checkTime, 500);
}

function setBoard() {
  squares = [];
  square_size = BOARD_SIZE / size;
  for (let i = 0; i < size; i++) {
    squares.push([]);
  }
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const index = pickRandomColor();
      squares[i].push(index);
    }
  }
  if (!isMovePossible()) {
    setBoard();
  }
}

function pickRandomColor() {
  return Math.ceil(Math.random() * num_colors);
}

function drawBoard() {
  draw.shadowColor = 'black';
  draw.shadowBlur = 10;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      draw.beginPath();
      draw.rect(i * square_size, j * square_size, square_size, square_size);
      draw.fillStyle = colors[squares[i][j]];
      draw.lineWidth = 1;
      draw.strokeStyle = "black";
      draw.fill();
      draw.stroke();
      draw.closePath();
    }
  }
  draw.shadowColor = '';
  draw.shadowBlur = 0;
}

function drawSelected() {
  let x, y;
  let color;
  let color_seceted = selected.length != MAX_SELECTION ? 'white' : 'lightgray';
  for (let i = 0; i < selected.length; i++) {
    x = selected[i].x;
    y = selected[i].y;
    color = colors[squares[x][y]];
    draw.beginPath();
    draw.shadowColor = color_seceted;
    draw.shadowBlur = 20;
    draw.rect(x * square_size, y * square_size, square_size, square_size);
    draw.fillStyle = color;
    draw.lineWidth = 3;
    draw.strokeStyle = color_seceted;
    draw.fill();
    draw.stroke();
    draw.shadowColor = '';
    draw.shadowBlur = 0;
    draw.closePath();
  }
}

function drawInformation(font_size, font_type, font_color, info, info_offset_y) {
  let x = Math.floor((BOARD_SIZE - font_size * info.length / 2) / 2);
  let y = Math.floor((BOARD_SIZE - font_size / 2) / 2) + info_offset_y;
  draw.beginPath();
  draw.shadowColor = 'black';
  draw.shadowBlur = 10;
  draw.font = font_size + 'px ' + font_type;
  draw.fillStyle = font_color;
  draw.fillText(info, x, y);
  draw.shadowBlur = 0;
  draw.closePath();
}

function isSelectedNeightbour(x, y) {
  return isSelected(x + 1, y)
    || isSelected(x - 1, y)
    || isSelected(x, y + 1)
    || isSelected(x, y - 1);
}

function isSelected(x, y) {
  return selected.find(item => item.x == x && item.y == y);
}

function resetSelection() {
  selected = [];
  selected_color = "";
  combo = 0;
}

function wrongSelection() {
  minus_points_sound.play();
  changeScore(-selected.length);
  resetSelection();
}

function setCombo() {
  combo = (Math.floor(selected.length / 2) - 1) * (Math.floor(level/3) + 1) ;
}

function addSelection(x, y) {
  //click_sound.play();
  selected.push({
    x: x,
    y: y,
  });
  if (selected.length >= 4) {
    setCombo()
  }
}

function onClick(event) {
  const x = Math.floor((event.pageX - board.offsetLeft) / square_size);
  const y = Math.floor((event.pageY - board.offsetTop) / square_size);
  const color = colors[squares[x][y]];

  if (selected_color) {
    if (selected_color == color) {
      if (!isSelected(x, y)) {
        if (isSelectedNeightbour(x, y)) {
          if (selected.length < MAX_SELECTION) {
            addSelection(x, y);
          }
        } else {
          wrongSelection();
        }
      }
    } else {
      wrongSelection();
    }
  } else {
    if (color != EMPTY_COLOR) {
      selected_color = color;
      addSelection(x, y);
    }
  }
}

function organizeSquares() {
  function comper(a, b) {
    let a_ = a ? 1 : 0;
    let b_ = b ? 1 : 0;
    return a_ - b_;
  }
  for (let i = 0; i < size; i++) {
    squares[i].sort(comper);
  }
}

function isMovePossible() {
  const BFS = (start_x, start_y) => {
    const directions = [
      { dx: 0, dy: -1 },
      { dx: +1, dy: 0 },
      { dx: 0, dy: +1 },
      { dx: -1, dy: 0 }
    ];
    const start_color = squares[start_x][start_y];
    let group_size = 0;
    let Q = [];
    Q.push({ x: start_x, y: start_y });

    while (Q.length) {
      const s = Q.shift();
      visited[s.x][s.y] = true;
      group_size++;
      if (group_size >= MIN_SELECTION) {
        return true;
      }
      for (const d of directions) {
        const neighbour = {
          x: s.x + d.dx,
          y: s.y + d.dy
        };
        if (neighbour.x == -1 || neighbour.x == size
          || neighbour.y == -1 || neighbour.y == size) {
          continue;
        }
        if (visited[neighbour.x][neighbour.y]) {
          continue;
        }
        if (start_color == squares[neighbour.x][neighbour.y]) {
          Q.push(neighbour);
        }
      }
    }
    return false;
  };

  let visited = [];
  for (let i = 0; i < size; i++) {
    visited.push([]);
  }
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (!visited[i][j] && squares[i][j] != 0) {
        if (BFS(i, j)) {
          return true;
        }
      }
    }
  }
  return false;
}

function changeScore(value) {
  if (!value) return;
  score += value;
  score_change = value;
  score_changed_time = Date.now();
}


function checkPossibleMoves() {
  if (!isMovePossible()) {
    const squares_left = size * size - joined_squares;
    changeScore(-squares_left);
    score_changed_time = 0;
    next_level_time = Date.now();
    next_level_message = `No moves! ${squares_left} ⬜ left!`;
    disableInput();
    setTimeout(nextLevel, 2000);
  }
}

function nextLevel() {
  if (level == MAX_LEVEL) {
    gameFinish(true);
    return;
  }
  next_level_sound.play();
  size++;
  level++;
  num_colors = level_num_colors[level];
  new_time += START_TIME;
  joined_squares = 0;
  resetSelection();
  setBoard();
  enableInput();
}

function join() {
  let x, y;
  if (selected.length >= MIN_SELECTION && selected.length <= MAX_SELECTION) {
    join_sound.play();
    for (let i = 0; i < selected.length; i++) {
      x = selected[i].x;
      y = selected[i].y;
      squares[x][y] = 0;
    }
    if (selected.length == MAX_SELECTION) {
      setBomb(true);
    }
    changeScore(selected.length * combo);
    joined_squares += selected.length;
    new_time += combo;
    resetSelection();
    organizeSquares();
    checkPossibleMoves();
  }
}

function activateBomb() {
  if (bomb && !game_finished) {
    if (selected.length) {
      const x = selected[0].x;
      const y = selected[0].y;
      const index = squares[x][y];
      let points = 0;
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (squares[i][j] == index) {
              squares[i][j] = 0;
              points++;
              joined_squares++;
            }
        }
      }
      changeScore(points);
      setBomb(false);
      bomb_sound.play();
      resetSelection();
      organizeSquares();
      checkPossibleMoves();
    }
  }
}

function showSelectionProgress() {
  const squares_element = document.getElementById("squares");
  const progress = selected.length;
  const barSize = squares_element.offsetWidth;
  const sqSize = barSize / 12;
  const position = progress * sqSize - barSize;
  squares_element.style.backgroundPositionX = `${position}px`;
}

function drawPanel() {
  showSelectionProgress();
  document.getElementById("score").textContent = score;
  document.getElementById("time").textContent = time + "s";
  document.getElementById("combo").textContent = "Combo: x" + combo + " ";
  document.getElementById("level").textContent = "Level: " + level;
  document.getElementById("board").textContent = "Board: " + size;
}

function checkTime() {
  const d_time = Date.now() - start_date;
  time = new_time - Math.floor(d_time / 1000);
  if (time <= 0) {
    gameFinish(false);
  }
}

function game() {
  if (game_finished) {
    return;
  }
  drawBoard();
  drawSelected();
  drawPanel();

  if (Date.now() - score_changed_time < 600) {
    drawInformation(30, 'sans-serif', 'white', `${score_change}`, 0);
  }
  if (Date.now() - next_level_time < 2000) {
    drawInformation(35, 'monospace', 'white', `${next_level_message}`, 0);
  }
}

function gameFinish(won) {
  game_finished = true;
  clearInterval(timeInterval);
  hight_score = score > hight_score ? score : hight_score;
  drawBoard();
  drawPanel();
  const finishType = won ? 'Won' : 'Over';
  const sound = won ? game_won_sound : game_over_sound;
  sound.play();
  drawInformation(100, 'monospace', 'white', `Game ${finishType}`, 0);
  drawInformation(50, "monospace", 'white', `your score: ${score}`, 50);
  drawInformation(50, "monospace", 'white', `hight score: ${hight_score}`, 125);
  disableInput();
}

startGame();

function drawGame() {
  game();
  requestAnimationFrame(drawGame);
}
drawGame();


