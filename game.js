var DIRECTION = {
  IDLE: 0,
  UP: 1,
  DOWN: 2,
  LEFT: 3,
  RIGHT: 4,
};

var rounds = 5; // Only 5 rounds
var colors = ["#4a148c", "#4a148c", "#4a148c", "#4a148c", "#4a148c"]; // Deep purple for all rounds

// Ball object
var Ball = {
  new: function (incrementedSpeed) {
    return {
      width: 18,
      height: 18,
      x: this.canvas.width / 2 - 9,
      y: this.canvas.height / 2 - 9,
      moveX: DIRECTION.IDLE,
      moveY: DIRECTION.IDLE,
      speed: incrementedSpeed || 7,
    };
  },
};

// Paddle object
var Ai = {
  new: function (side) {
    return {
      width: 18,
      height: 180,
      x: side === "left" ? 150 : this.canvas.width - 150,
      y: this.canvas.height / 2 - 35,
      score: 0,
      move: DIRECTION.IDLE,
      speed: 8,
      radius: 10, // For rounded corners
    };
  },
};

var Game = {
  initialize: function () {
    this.canvas = document.querySelector("#pongCanvas");
    this.context = this.canvas.getContext("2d");

    this.canvas.width = 1400;
    this.canvas.height = 1000;

    this.canvas.style.width = this.canvas.width / 2 + "px";
    this.canvas.style.height = this.canvas.height / 2 + "px";

    this.player = Ai.new.call(this, "left");
    this.ai = Ai.new.call(this, "right");
    this.ball = Ball.new.call(this);

    this.ai.speed = 5;
    this.running = false;
    this.over = false;
    this.turn = this.ai;
    this.timer = this.round = 0;
    this.color = "#4a148c"; // Deep purple
    this.currentRound = 1;

    this.difficultySettings = {
      easy: { aiSpeed: 5, ballSpeed: 7, speedIncrease: 0.5 },
      medium: { aiSpeed: 6, ballSpeed: 8, speedIncrease: 0.7 },
      complex: { aiSpeed: 7, ballSpeed: 9, speedIncrease: 1.0 },
      impossible: { aiSpeed: 8, ballSpeed: 10, speedIncrease: 1.5 },
    };
    this.currentDifficulty = "easy";

    this.listen();
  },

  endGameMenu: function (text) {
    this.context.font = "45px Courier New";
    this.context.fillStyle = this.color;
    this.context.fillRect(
      this.canvas.width / 2 - 350,
      this.canvas.height / 2 - 48,
      700,
      100
    );
    this.context.fillStyle = "#e1bee7"; // Light purple text
    this.context.fillText(
      text,
      this.canvas.width / 2,
      this.canvas.height / 2 + 15
    );

    setTimeout(() => {
      Pong = Object.assign({}, Game);
      Pong.initialize();
      document.getElementById("menu").style.display = "flex";
    }, 3000);
  },

  draw: function () {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillStyle = this.color;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillStyle = "#e1bee7"; // Light purple paddles and ball

    // Draw paddles with rounded corners
    this.drawRoundedRect(
      this.player.x,
      this.player.y,
      this.player.width,
      this.player.height,
      this.player.radius
    );
    this.drawRoundedRect(
      this.ai.x,
      this.ai.y,
      this.ai.width,
      this.ai.height,
      this.ai.radius
    );

    // Draw the ball
    if (Pong._turnDelayIsOver.call(this)) {
      this.context.fillRect(
        this.ball.x,
        this.ball.y,
        this.ball.width,
        this.ball.height
      );
    }

    // Draw the net
    this.context.beginPath();
    this.context.setLineDash([7, 15]);
    this.context.moveTo(this.canvas.width / 2, this.canvas.height - 140);
    this.context.lineTo(this.canvas.width / 2, 140);
    this.context.lineWidth = 10;
    this.context.strokeStyle = "#e1bee7"; // Light purple net
    this.context.stroke();

    // Draw scores with labels
    this.context.font = "100px Courier New";
    this.context.textAlign = "center";
    this.context.fillText(
      this.player.score.toString(),
      this.canvas.width / 2 - 300,
      200
    );
    this.context.fillText(
      this.ai.score.toString(),
      this.canvas.width / 2 + 300,
      200
    );

    // Draw player labels
    this.context.font = "30px Courier New";
    this.context.fillText("Player", this.canvas.width / 2 - 300, 250);
    this.context.fillText("Bot", this.canvas.width / 2 + 300, 250);

    // Draw round info
    this.context.fillText("Round", this.canvas.width / 2, 35);
    this.context.font = "40px Courier";
    this.context.fillText(
      this.currentRound.toString(),
      this.canvas.width / 2,
      100
    );
  },

  drawRoundedRect: function (x, y, width, height, radius) {
    this.context.beginPath();
    this.context.moveTo(x + radius, y);
    this.context.lineTo(x + width - radius, y);
    this.context.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.context.lineTo(x + width, y + height - radius);
    this.context.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius,
      y + height
    );
    this.context.lineTo(x + radius, y + height);
    this.context.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.context.lineTo(x, y + radius);
    this.context.quadraticCurveTo(x, y, x + radius, y);
    this.context.closePath();
    this.context.fill();
  },

  update: function () {
    if (!this.over) {
      if (this.ball.x <= 0) Pong._resetTurn.call(this, this.ai, this.player);
      if (this.ball.x >= this.canvas.width - this.ball.width)
        Pong._resetTurn.call(this, this.player, this.ai);
      if (this.ball.y <= 0) this.ball.moveY = DIRECTION.DOWN;
      if (this.ball.y >= this.canvas.height - this.ball.height)
        this.ball.moveY = DIRECTION.UP;

      if (this.player.move === DIRECTION.UP) this.player.y -= this.player.speed;
      else if (this.player.move === DIRECTION.DOWN)
        this.player.y += this.player.speed;

      if (Pong._turnDelayIsOver.call(this) && this.turn) {
        this.ball.moveX =
          this.turn === this.player ? DIRECTION.LEFT : DIRECTION.RIGHT;
        this.ball.moveY = [DIRECTION.UP, DIRECTION.DOWN][
          Math.round(Math.random())
        ];
        this.ball.y =
          Math.floor(Math.random() * this.canvas.height - 200) + 200;
        this.turn = null;
      }

      if (this.player.y <= 0) this.player.y = 0;
      else if (this.player.y >= this.canvas.height - this.player.height)
        this.player.y = this.canvas.height - this.player.height;

      if (this.ball.moveY === DIRECTION.UP)
        this.ball.y -= this.ball.speed / 1.5;
      else if (this.ball.moveY === DIRECTION.DOWN)
        this.ball.y += this.ball.speed / 1.5;
      if (this.ball.moveX === DIRECTION.LEFT) this.ball.x -= this.ball.speed;
      else if (this.ball.moveX === DIRECTION.RIGHT)
        this.ball.x += this.ball.speed;

      // AI movement
      if (this.ai.y > this.ball.y - this.ai.height / 2) {
        if (this.ball.moveX === DIRECTION.RIGHT)
          this.ai.y -= this.ai.speed / 1.5;
        else this.ai.y -= this.ai.speed / 4;
      }
      if (this.ai.y < this.ball.y - this.ai.height / 2) {
        if (this.ball.moveX === DIRECTION.RIGHT)
          this.ai.y += this.ai.speed / 1.5;
        else this.ai.y += this.ai.speed / 4;
      }

      if (this.ai.y >= this.canvas.height - this.ai.height)
        this.ai.y = this.canvas.height - this.ai.height;
      else if (this.ai.y <= 0) this.ai.y = 0;

      // Ball-paddle collisions
      if (
        this.ball.x - this.ball.width <= this.player.x &&
        this.ball.x >= this.player.x - this.player.width
      ) {
        if (
          this.ball.y <= this.player.y + this.player.height &&
          this.ball.y + this.ball.height >= this.player.y
        ) {
          this.ball.x = this.player.x + this.ball.width;
          this.ball.moveX = DIRECTION.RIGHT;
          this.ball.speed +=
            this.difficultySettings[this.currentDifficulty].speedIncrease;
        }
      }

      if (
        this.ball.x - this.ball.width <= this.ai.x &&
        this.ball.x >= this.ai.x - this.ai.width
      ) {
        if (
          this.ball.y <= this.ai.y + this.ai.height &&
          this.ball.y + this.ball.height >= this.ai.y
        ) {
          this.ball.x = this.ai.x - this.ball.width;
          this.ball.moveX = DIRECTION.LEFT;
          this.ball.speed +=
            this.difficultySettings[this.currentDifficulty].speedIncrease;
        }
      }

      // Check for end of round
      if (this.player.score + this.ai.score === rounds) {
        this.over = true;
        let winner =
          this.player.score > this.ai.score ? "Player Wins!" : "Bot Wins!";
        setTimeout(() => {
          Pong.endGameMenu(winner);
        }, 1000);
      }
    }
  },

  loop: function () {
    Pong.update();
    Pong.draw();
    if (!Pong.over) requestAnimationFrame(Pong.loop);
  },

  listen: function () {
    document.getElementById("playBtn").addEventListener("click", () => {
      if (!this.running) {
        this.running = true;
        this.currentDifficulty = document.getElementById("difficulty").value;
        this.ai.speed = this.difficultySettings[this.currentDifficulty].aiSpeed;
        this.ball.speed =
          this.difficultySettings[this.currentDifficulty].ballSpeed;
        document.getElementById("menu").style.display = "none";
        window.requestAnimationFrame(Pong.loop);
      }
    });

    document.addEventListener("keydown", (key) => {
      if (key.keyCode === 38 || key.keyCode === 87)
        Pong.player.move = DIRECTION.UP;
      if (key.keyCode === 40 || key.keyCode === 83)
        Pong.player.move = DIRECTION.DOWN;
    });

    document.addEventListener("keyup", () => {
      Pong.player.move = DIRECTION.IDLE;
    });
  },

  _resetTurn: function (victor, loser) {
    this.ball = Ball.new.call(this, this.ball.speed);
    this.turn = loser;
    this.timer = new Date().getTime();
    victor.score++;
    if (victor.score + loser.score < rounds) {
      this.currentRound = victor.score + loser.score + 1;
      this.color = colors[this.currentRound - 1];
    }
  },

  _turnDelayIsOver: function () {
    return new Date().getTime() - this.timer >= 1000;
  },

  _generateRoundColor: function () {
    var newColor = colors[Math.floor(Math.random() * colors.length)];
    if (newColor === this.color) return Pong._generateRoundColor();
    return newColor;
  },
};

var Pong = Object.assign({}, Game);
Pong.initialize();
