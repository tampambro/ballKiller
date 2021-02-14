const canvas = document.getElementById('game');
const context = canvas.getContext('2d');

const startNameplate = document.getElementById('start');
const score = document.getElementById('score');
const scoreResult = document.getElementById('scoreResult');
const missed = document.getElementById('missed');
const missedResult = document.getElementById('missedResult');
const time = document.getElementById('time');
const restart = document.getElementById('restart');

//States
let fullTime = 60
let roundTime = fullTime;
let requestAnimationID;
let stopBallsId;
let stopWindsId;
let ballsSpeed = 1;
let isGameFinished = false;

const grid = 15;
const ballsSpeedBoost = 0.1;
const needleSpeedBoost = 0.1;

let needleSpeed = 6;
const needleHeight = grid * 5;
const needleWidth = grid / 5;
const maxNeedlX = canvas.width - grid;

const needle = {
  x: canvas.width / 2 - needleWidth / 2,
  y: grid / 3,
  width: needleWidth,
  height: needleHeight,
  dx: 0,
  tipY: grid / 3 + needleHeight,
};
let balls = [];
let winds = [];

//-----Functions
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

function startGame() {
  startNameplate.style.display = 'none';
  score.style.display = 'block';

  time.textContent = roundTime + 's';
  time.style.display = 'block';

  timer();
  ballsGo();
  windsGo();
  loop();
};

function timer() {
  let timerId = setInterval(() => {
    time.textContent = `${--roundTime}s`
  }, 1000);
  setTimeout(() => {
    clearInterval(timerId);
    clearInterval(stopBallsId);
    clearInterval(stopWindsId);
    missed.style.display = 'block'
    missedResult.textContent = `${missedBallsCalculation()}`;
    isGameFinished = true;
    restart.style.display = 'block';
  }, roundTime * 1000);
};

function addBall(minTime, maxTime) {
  setTimeout(() => {
    balls.push({
      radius: getRandomInt(20, 50),
      x: getRandomInt(0, canvas.width),
      y: canvas.height + 50,
      color: `rgba(${getRandomInt(0, 255)}, ${getRandomInt(
        0,
        255
      )}, ${getRandomInt(0, 255)}, ${Math.random().toFixed(1)})`,
      windsWas: [],
    });
  }, getRandomInt(minTime, maxTime));
};

function ballsGo() {
  stopBallsId = setInterval(() => {
    addBall(500, 10000);
    if ((fullTime * 2 / 3) >= roundTime) {
      addBall(100, 500);
      addBall(100, 500);
    };
    if ((fullTime / 3) >= roundTime) {
      addBall(10, 500);
      addBall(10, 500);
      addBall(10, 500);
    };
  }, 1000);
};

function windsGo() {
  stopWindsId = setInterval(() => {
    setTimeout(() => {
      const side = Math.round(Math.random());
      winds.push({
        id: winds.length + 1,
        x: side ? canvas.width : 0,
        side: side ? 'right' : 'left',
        strength: 100,
      })
    }, getRandomInt(5000, 20000));
  }, 5000);
};

function ballsCreator(ballsRadius, x, y, color) {
  if (x - ballsRadius < 0) {
    x = ballsRadius;
  } else if (x + ballsRadius > canvas.width) {
    x = canvas.width - ballsRadius;
  }

  context.save();
  context.beginPath();
  context.arc(x, y, ballsRadius, 0, Math.PI * 2);
  context.strokeStyle = color;
  context.stroke();
  context.fillStyle = color;
  context.fill();
  context.closePath();
  context.restore();
};

function collideBalls(needle, ball) {
  let distanceX = needle.x - ball.x;
  let distanceY = needle.tipY - ball.y;

  if (
    Math.pow(distanceX, 2) + Math.pow(distanceY, 2) <=
    Math.pow(ball.radius, 2)
  ) return true;

  return false;
};

function windCreator(x) {
  context.beginPath();
  context.moveTo(x, 0);
  context.lineWidth = 5;
  context.lineTo(x, canvas.height);
  context.strokeStyle = 'blue';
  context.stroke();
};

function missedBallsCalculation() {
  return balls.filter((item) => (item?.y + item?.radius) < (needle.height + needle.y)).length
}

function needleCreate() {
  context.beginPath();
  context.moveTo(needle.x, needle.y);
  context.lineWidth = needle.width;
  context.lineCap = 'round';
  context.lineTo(needle.x, needle.tipY);
  context.strokeStyle = 'silver';
  context.stroke();
}
//---------

//main loop
function loop() {
  requestAnimationID = requestAnimationFrame(loop);
  context.clearRect(0, 0, canvas.width, canvas.height);

  //Needle moving
  needle.x += needle.dx;

  //Checking boders.
  if (needle.x < grid) {
    needle.x = grid;
  } else if (needle.x > maxNeedlX) {
    needle.x = maxNeedlX;
  }

  //Drawing needle.
  needleCreate()

  for (let i = 0; i < balls.length; i++) {
    if (balls[i]) {
      ballsCreator(balls[i].radius, balls[i].x, balls[i].y, balls[i].color);
      balls[i].y -= ballsSpeed;

      if (collideBalls(needle, balls[i])) {
        ballsSpeed += ballsSpeedBoost;
        needleSpeed += needleSpeedBoost;
        delete balls[i];
        if (!isGameFinished) {
          scoreResult.textContent = `${+scoreResult.textContent + 1}`;
        }
      }
    }
  }

  for (let i = 0; i < winds.length; i++) {
    if (winds[i].side === 'right') {
      windCreator(winds[i].x);
      if (winds[i].x !== -7.5) {
        winds[i].x -= 7.5;
        winds[i].strength -= 1;
      }
    } else {
      windCreator(winds[i].x);
      if (winds[i].x !== 757.5) {
        winds[i].x += 7.5;
        winds[i].strength -= 1;
      }
    }
  }

  for (let i = 0; i < winds.length; i++) {
    balls.forEach((item) => {
      let isBlowed = item.windsWas.find((item) => item === winds[i].id);

      if (winds[i].side === 'right' && !isBlowed  && winds[i].x <= item.x) {
        item.x -= winds[i].strength;
        item.windsWas.push(winds[i].id);
      } else if (winds[i].side === 'left' && !isBlowed && winds[i].x >= item.x) {
        item.x += winds[i].strength;
        item.windsWas.push(winds[i].id);

      }
    })
  }
};

//Events
document.addEventListener('keydown', function (e) {
  if (e.code === 'Enter') {
    startGame();
  }
});

document.addEventListener('keydown', function (e) {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
    needle.dx = -needleSpeed;
  } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
    needle.dx = needleSpeed;
  }
});

document.addEventListener('keyup', function (e) {
  if (
    e.code === 'KeyA' ||
    e.code === 'ArrowLeft' ||
    e.code === 'KeyD' ||
    e.code === 'ArrowRight'
  ) {
    needle.dx = 0;
  }
});

document.addEventListener('keypress', function (e) {
  if (isGameFinished && e.code === 'KeyR') {
    balls = [];
    winds = [];
    ballsSpeed = 1;
    needleSpeed = 6;
    isGameFinished = false;
    roundTime = fullTime;
    restart.style.display = 'none';
    missed.style.display = 'none';
    scoreResult.textContent = '0';
    cancelAnimationFrame(requestAnimationID);
    startGame();
  }
});