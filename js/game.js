// 游戏配置
const config = {
    paddleSpeed: 35,
    ballSpeed: 5,
    brickRows: 5,
    brickColumns: 8,
    brickPadding: 10,
    powerUpChance: 0.3, // 道具掉落概率
    specialBrickChance: 0.2, // 特殊砖块出现概率
    touchSensitivity: 2.0, // 触摸灵敏度
    paddleDampening: 0.95 // 挡板移动阻尼
};

// 游戏状态
let gameState = {
    score: 0,
    lives: 3,
    level: 1,
    isRunning: false,
    powerUps: [],
    activePowerUps: new Set(),
    highScore: parseInt(localStorage.getItem('highScore')) || 0,
    achievements: (() => {
        try {
            const stored = localStorage.getItem('achievements');
            return new Set(stored ? JSON.parse(stored) : []);
        } catch (e) {
            console.warn('无法解析成就数据，重置为空集合');
            return new Set();
        }
    })(),
    lastTouchX: null,
    theme: localStorage.getItem('theme') || 'classic',
    combo: 0, // 连击数
    maxCombo: 0 // 最大连击数
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
        const moveAmount = this.speed * direction * config.paddleDampening;
        const newX = this.x + moveAmount;
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
        ctx.fillStyle = this.textColor || '#000';  // 使用主题文字颜色或默认黑色
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
        this.initTheme();
        this.initAchievements();
    }

    initTheme() {
        const themes = {
            classic: {
                paddleColor: '#4CAF50',
                ballColor: '#FFF',
                brickColor: '#FF4444',
                specialBrickColor: '#FFD700',
                powerUpColor: '#00FF00',
                powerUpTextColor: '#000000',
                background: 'linear-gradient(to bottom right, #1a1a1a, #4a4a4a)',
                textColor: '#FFFFFF',
                buttonBg: '#4CAF50',
                buttonHover: '#45a049',
                panelBg: 'rgba(255, 255, 255, 0.1)',
                canvasBorder: '#FFFFFF'
            },
            neon: {
                paddleColor: '#00ff00',
                ballColor: '#ff00ff',
                brickColor: '#00ffff',
                specialBrickColor: '#ffff00',
                powerUpColor: '#ff00ff',
                powerUpTextColor: '#ffffff',
                background: 'linear-gradient(to bottom right, #000033, #000066)',
                textColor: '#00ff00',
                buttonBg: '#ff00ff',
                buttonHover: '#cc00cc',
                panelBg: 'rgba(0, 255, 255, 0.1)',
                canvasBorder: '#00ff00'
            },
            retro: {
                paddleColor: '#8B4513',
                ballColor: '#DEB887',
                brickColor: '#A0522D',
                specialBrickColor: '#DAA520',
                powerUpColor: '#CD853F',
                powerUpTextColor: '#000000',
                background: 'linear-gradient(to bottom right, #2c1810, #5c2820)',
                textColor: '#DEB887',
                buttonBg: '#8B4513',
                buttonHover: '#654321',
                panelBg: 'rgba(222, 184, 135, 0.1)',
                canvasBorder: '#DEB887'
            }
        };

        const applyTheme = (themeName) => {
            const theme = themes[themeName] || themes.classic;
            
            // 更新CSS变量
            document.documentElement.style.setProperty('--text-color', theme.textColor);
            document.documentElement.style.setProperty('--button-bg', theme.buttonBg);
            document.documentElement.style.setProperty('--button-hover', theme.buttonHover);
            document.documentElement.style.setProperty('--panel-bg', theme.panelBg);
            
            // 更新游戏对象颜色
            document.body.style.background = theme.background;
            
            // 更新挡板颜色
            this.paddle.color = theme.paddleColor;
            
            // 更新球的颜色
            this.balls.forEach(ball => ball.color = theme.ballColor);
            
            // 更新砖块颜色
            this.bricks.forEach(brick => {
                brick.color = brick.isSpecial ? theme.specialBrickColor : theme.brickColor;
            });
            
            // 更新道具颜色
            gameState.powerUps.forEach(powerUp => {
                powerUp.color = theme.powerUpColor;
                powerUp.textColor = theme.powerUpTextColor;
            });
            
            // 更新画布边框颜色
            document.getElementById('gameCanvas').style.borderColor = theme.canvasBorder;
            
            // 更新DOM元素样式
            document.body.className = `theme-${themeName}`;
            gameState.theme = themeName;
            localStorage.setItem('theme', themeName);
            
            // 更新主题按钮文本
            const themeNames = {
                classic: '经典主题',
                neon: '霓虹主题',
                retro: '复古主题'
            };
            document.getElementById('themeButton').textContent = `当前主题: ${themeNames[themeName]}`;
        };

        applyTheme(gameState.theme);
        
        document.getElementById('themeButton').addEventListener('click', () => {
            const currentTheme = gameState.theme;
            const themeNames = Object.keys(themes);
            const nextThemeIndex = (themeNames.indexOf(currentTheme) + 1) % themeNames.length;
            applyTheme(themeNames[nextThemeIndex]);
        });
    }

    initAchievements() {
        const achievementsPanel = document.getElementById('achievements');
        document.getElementById('achievementButton').addEventListener('click', () => {
            achievementsPanel.style.display = achievementsPanel.style.display === 'none' ? 'block' : 'none';
        });

        // 初始化已解锁的成就
        gameState.achievements.forEach(id => {
            document.querySelector(`[data-id="${id}"]`)?.classList.add('unlocked');
        });

        // 点击其他区域关闭成就面板
        document.addEventListener('click', (e) => {
            if (!achievementsPanel.contains(e.target) && 
                e.target.id !== 'achievementButton') {
                achievementsPanel.style.display = 'none';
            }
        });
    }

    setupEventListeners() {
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            if (!gameState.isRunning) return;
            if (e.key === 'ArrowLeft') this.paddle.move(-1);
            if (e.key === 'ArrowRight') this.paddle.move(1);
        });

        // 触摸控制
        this.canvas.addEventListener('touchstart', (e) => {
            if (!gameState.isRunning) return;
            e.preventDefault();
            gameState.lastTouchX = e.touches[0].clientX;
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            if (!gameState.isRunning || gameState.lastTouchX === null) return;
            e.preventDefault();
            const touchX = e.touches[0].clientX;
            const deltaX = (touchX - gameState.lastTouchX) * config.touchSensitivity;
            this.paddle.move(deltaX / config.paddleSpeed);
            gameState.lastTouchX = touchX;
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => {
            gameState.lastTouchX = null;
        });

        // 移动端按钮控制
        document.getElementById('leftButton')?.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!gameState.isRunning) return;
            const moveInterval = setInterval(() => this.paddle.move(-1), 16);
            const stopMove = () => clearInterval(moveInterval);
            e.target.addEventListener('touchend', stopMove, { once: true });
        });

        document.getElementById('rightButton')?.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!gameState.isRunning) return;
            const moveInterval = setInterval(() => this.paddle.move(1), 16);
            const stopMove = () => clearInterval(moveInterval);
            e.target.addEventListener('touchend', stopMove, { once: true });
        });

        document.getElementById('startButton').addEventListener('click', () => {
            if (!gameState.isRunning) {
                this.resetGame();
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

    checkAchievements() {
        const achievements = [
            { id: 'firstWin', condition: () => gameState.level > 1, name: '初次胜利', desc: '通过第一关' },
            { id: 'highScore1000', condition: () => gameState.score >= 1000, name: '分数达人', desc: '获得1000分' },
            { id: 'multiPowerup', condition: () => gameState.activePowerUps.size >= 2, name: '能量叠加', desc: '同时激活2个道具' },
            { id: 'level5', condition: () => gameState.level >= 5, name: '闯关高手', desc: '达到第5关' },
            { id: 'combo10', condition: () => gameState.combo >= 10, name: '连击大师', desc: '达成10连击' },
            { id: 'perfectClear', condition: () => gameState.lives === 3 && gameState.level > 1, name: '完美通关', desc: '不损失生命值通过一关' },
            { id: 'speedMaster', condition: () => config.ballSpeed >= 8, name: '速度大师', desc: '在高速模式下完成一关' },
            { id: 'powerupCollector', condition: () => gameState.powerUps.length >= 5, name: '道具收集者', desc: '同时拥有5个道具' }
        ];

        achievements.forEach(achievement => {
            if (!gameState.achievements.has(achievement.id) && achievement.condition()) {
                gameState.achievements.add(achievement.id);
                const achievementElement = document.querySelector(`[data-id="${achievement.id}"]`);
                if (achievementElement) {
                    achievementElement.classList.add('unlocked');
                    achievementElement.title = `${achievement.name}: ${achievement.desc}`;
                }
                // 显示成就解锁提示
                const notification = document.createElement('div');
                notification.className = 'achievement-notification';
                notification.textContent = `解锁成就：${achievement.name}`;
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 3000);
                localStorage.setItem('achievements', JSON.stringify([...gameState.achievements]));
            }
        });
    }

    update() {
        if (!gameState.isRunning) return;

        // 检查成就
        this.checkAchievements();

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
                        if (gameState.score > gameState.highScore) {
                            gameState.highScore = gameState.score;
                            localStorage.setItem('highScore', gameState.highScore);
                            document.getElementById('highScore').textContent = gameState.highScore;
                        }
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
    document.getElementById('highScore').textContent = gameState.highScore;
};