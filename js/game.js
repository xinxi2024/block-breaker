// 游戏配置
const config = {
    paddleSpeed: 8,
    ballSpeed: 5,
    brickRows: 5,
    brickColumns: 8,
    brickPadding: 10,
    powerUpChance: 0.3, // 道具掉落概率
    specialBrickChance: 0.2 // 特殊砖块出现概率
};

// 游戏状态
let gameState = {
    score: 0,
    lives: 3,
    level: 1,
    isRunning: false,
    powerUps: [],
    activePowerUps: new Set()
};

// 游戏对象
class GameObject {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// 挡板类
class Paddle extends GameObject {
    constructor(canvas) {
        super(
            canvas.width / 2 - 50,
            canvas.height - 30,
            100,
            10,
            '#4CAF50'
        );
        this.speed = config.paddleSpeed;
        this.canvas = canvas;
    }

    move(direction) {
        const newX = this.x + this.speed * direction;
        if (newX >= 0 && newX + this.width <= this.canvas.width) {
            this.x = newX;
        }
    }
}

// 球类
class Ball extends GameObject {
    constructor(canvas) {
        super(
            canvas.width / 2,
            canvas.height - 40,
            10,
            10,
            '#FFF'
        );
        this.speed = config.ballSpeed;
        this.dx = this.speed;
        this.dy = -this.speed;
        this.canvas = canvas;
    }

    move() {
        this.x += this.dx;
        this.y += this.dy;

        // 墙壁碰撞
        if (this.x <= 0 || this.x + this.width >= this.canvas.width) {
            this.dx = -this.dx;
        }
        if (this.y <= 0) {
            this.dy = -this.dy;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    reset() {
        this.x = this.canvas.width / 2;
        this.y = this.canvas.height - 40;
        this.dx = this.speed;
        this.dy = -this.speed;
    }
}

// 砖块类
class Brick extends GameObject {
    constructor(x, y, width, height) {
        const isSpecial = Math.random() < config.specialBrickChance;
        const color = isSpecial ? '#FFD700' : '#FF4444';
        super(x, y, width, height, color);
        this.isSpecial = isSpecial;
        this.hits = isSpecial ? 2 : 1; // 特殊砖块需要击打两次
    }
}

// 道具类
class PowerUp extends GameObject {
    constructor(x, y) {
        super(x, y, 20, 20, '#00FF00');
        this.type = this.getRandomType();
        this.speed = 2;
    }

    getRandomType() {
        const types = ['expand', 'multiball', 'slow'];
        return types[Math.floor(Math.random() * types.length)];
    }

    move() {
        this.y += this.speed;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // 绘制道具类型标识
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        const symbol = this.type === 'expand' ? 'E' : 
                      this.type === 'multiball' ? 'M' : 'S';
        ctx.fillText(symbol, this.x + this.width/2, this.y + this.height/2 + 4);
    }
}

// 游戏主类
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.paddle = new Paddle(this.canvas);
        this.balls = [new Ball(this.canvas)];
        this.bricks = [];
        this.setupEventListeners();
        this.initBricks();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!gameState.isRunning) return;
            if (e.key === 'ArrowLeft') this.paddle.move(-1);
            if (e.key === 'ArrowRight') this.paddle.move(1);
        });

        document.getElementById('startButton').addEventListener('click', () => {
            if (!gameState.isRunning) {
                gameState.isRunning = true;
                this.gameLoop();
            }
        });
    }

    initBricks() {
        const brickWidth = (this.canvas.width - (config.brickColumns + 1) * config.brickPadding) / config.brickColumns;
        const brickHeight = 20;

        for (let row = 0; row < config.brickRows; row++) {
            for (let col = 0; col < config.brickColumns; col++) {
                const x = (col * (brickWidth + config.brickPadding)) + config.brickPadding;
                const y = (row * (brickHeight + config.brickPadding)) + config.brickPadding + 30;
                this.bricks.push(new Brick(x, y, brickWidth, brickHeight));
            }
        }
    }

    checkCollision(ball, object) {
        return ball.x < object.x + object.width &&
               ball.x + ball.width > object.x &&
               ball.y < object.y + object.height &&
               ball.y + ball.height > object.y;
    }

    handlePowerUp(powerUp) {
        switch (powerUp.type) {
            case 'expand':
                this.paddle.width *= 1.5;
                setTimeout(() => this.paddle.width /= 1.5, 10000);
                break;
            case 'multiball':
                const newBall = new Ball(this.canvas);
                newBall.dx = -newBall.dx;
                this.balls.push(newBall);
                break;
            case 'slow':
                this.balls.forEach(ball => {
                    ball.speed *= 0.7;
                    ball.dx = ball.dx > 0 ? ball.speed : -ball.speed;
                    ball.dy = ball.dy > 0 ? ball.speed : -ball.speed;
                });
                setTimeout(() => {
                    this.balls.forEach(ball => {
                        ball.speed /= 0.7;
                        ball.dx = ball.dx > 0 ? ball.speed : -ball.speed;
                        ball.dy = ball.dy > 0 ? ball.speed : -ball.speed;
                    });
                }, 10000);
                break;
        }
        document.getElementById('powerupText').textContent = `获得道具: ${powerUp.type}`;
        setTimeout(() => document.getElementById('powerupText').textContent = '', 3000);
    }

    update() {
        if (!gameState.isRunning) return;

        // 更新球的位置
        this.balls.forEach((ball, index) => {
            ball.move();

            // 检查挡板碰撞
            if (this.checkCollision(ball, this.paddle)) {
                ball.dy = -ball.dy;
                // 根据击中挡板的位置改变球的水平方向
                const hitPoint = (ball.x - this.paddle.x) / this.paddle.width;
                ball.dx = ball.speed * (hitPoint - 0.5) * 2;
            }

            // 检查球是否掉落
            if (ball.y > this.canvas.height) {
                if (this.balls.length === 1) {
                    gameState.lives--;
                    document.getElementById('lives').textContent = gameState.lives;
                    if (gameState.lives <= 0) {
                        gameState.isRunning = false;
                        alert('游戏结束！最终得分: ' + gameState.score);
                        this.resetGame();
                        return;
                    }
                    ball.reset();
                } else {
                    this.balls.splice(index, 1);
                }
            }
        });

        // 更新道具
        gameState.powerUps.forEach((powerUp, index) => {
            powerUp.move();
            if (this.checkCollision(powerUp, this.paddle)) {
                this.handlePowerUp(powerUp);
                gameState.powerUps.splice(index, 1);
            } else if (powerUp.y > this.canvas.height) {
                gameState.powerUps.splice(index, 1);
            }
        });

        // 检查砖块碰撞
        this.balls.forEach(ball => {
            this.bricks.forEach((brick, index) => {
                if (this.checkCollision(ball, brick)) {
                    ball.dy = -ball.dy;
                    brick.hits--;
                    
                    if (brick.hits <= 0) {
                        // 增加分数
                        gameState.score += brick.isSpecial ? 20 : 10;
                        document.getElementById('score').textContent = gameState.score;

                        // 概率生成道具
                        if (Math.random() < config.powerUpChance) {
                            gameState.powerUps.push(new PowerUp(brick.x + brick.width/2, brick.y));
                        }

                        this.bricks.splice(index, 1);
                    }
                }
            });
        });

        // 检查是否通关
        if (this.bricks.length === 0) {
            gameState.level++;
            config.ballSpeed += 0.5;
            config.powerUpChance += 0.1;
            config.specialBrickChance += 0.1;
            this.initBricks();
            this.balls = [new Ball(this.canvas)];
            alert(`恭喜通过第 ${gameState.level-1} 关！`);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.paddle.draw(this.ctx);
        this.balls.forEach(ball => ball.draw(this.ctx));
        this.bricks.forEach(brick => brick.draw(this.ctx));
        gameState.powerUps.forEach(powerUp => powerUp.draw(this.ctx));
    }

    gameLoop() {
        if (!gameState.isRunning) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }

    resetGame() {
        gameState.score = 0;
        gameState.lives = 3;
        gameState.level = 1;
        gameState.powerUps = [];
        gameState.activePowerUps = new Set();
        this.balls = [new Ball(this.canvas)];
        this.initBricks();
        document.getElementById('score').textContent = '0';
        document.getElementById('lives').textContent = '3';
        document.getElementById('powerupText').textContent = '';
    }
}

// 初始化游戏
window.onload = () => {
    new Game();
};