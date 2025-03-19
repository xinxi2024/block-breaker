// 获取DOM元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const gameOverModal = document.getElementById('gameOverModal');
const finalScoreElement = document.getElementById('finalScore');
const playAgainBtn = document.getElementById('playAgainBtn');
const levelCompleteModal = document.getElementById('levelCompleteModal');
const levelScoreElement = document.getElementById('levelScore');
const nextLevelBtn = document.getElementById('nextLevelBtn');

// 游戏变量
let score = 0;
let lives = 3;
let maxLives = 5; // 最大生命值
let level = 1;
let gameRunning = false;
let gamePaused = false;
let requestId = null;

// 道具变量
let powerups = [];
const powerupTypes = {
    extraLife: { color: '#e74c3c', effect: () => addLife(1) },
    widePaddle: { color: '#3498db', effect: () => changePaddleWidth(50) },
    narrowPaddle: { color: '#8e44ad', effect: () => changePaddleWidth(-30) },
    slowBall: { color: '#2ecc71', effect: () => changeballSpeed(-1) },
    fastBall: { color: '#f39c12', effect: () => changeballSpeed(1) }
};

// 定义预设关卡
const predefinedLevels = [
    // 第1关 - 基础布局
    {
        bricks: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0]
        ],
        types: [
            ['normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal'],
            ['normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal'],
            ['normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal'],
            ['normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal'],
            ['normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal']
        ]
    },
    // 第2关 - 交错布局
    {
        bricks: [
            [1, 0, 1, 0, 1, 0, 1, 0, 1],
            [0, 1, 0, 1, 0, 1, 0, 1, 0],
            [1, 0, 1, 0, 1, 0, 1, 0, 1],
            [0, 1, 0, 1, 0, 1, 0, 1, 0],
            [1, 0, 1, 0, 1, 0, 1, 0, 1]
        ],
        types: [
            ['normal', 'normal', 'normal', 'normal', 'strong', 'normal', 'normal', 'normal', 'normal'],
            ['normal', 'normal', 'normal', 'normal', 'strong', 'normal', 'normal', 'normal', 'normal'],
            ['normal', 'normal', 'special', 'normal', 'strong', 'normal', 'special', 'normal', 'normal'],
            ['normal', 'normal', 'normal', 'normal', 'strong', 'normal', 'normal', 'normal', 'normal'],
            ['normal', 'normal', 'normal', 'normal', 'strong', 'normal', 'normal', 'normal', 'normal']
        ]
    },
    // 第3关 - 城堡布局
    {
        bricks: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        types: [
            ['strong', 'strong', 'strong', 'strong', 'strong', 'strong', 'strong', 'strong', 'strong'],
            ['strong', 'normal', 'normal', 'normal', 'special', 'normal', 'normal', 'normal', 'strong'],
            ['strong', 'normal', 'strong', 'normal', 'special', 'normal', 'strong', 'normal', 'strong'],
            ['strong', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'strong'],
            ['strong', 'strong', 'strong', 'strong', 'strong', 'strong', 'strong', 'strong', 'strong']
        ]
    },
    // 第4关 - "X"图案
    {
        bricks: [
            [1, 0, 0, 0, 0, 0, 0, 0, 1],
            [0, 1, 0, 0, 0, 0, 0, 1, 0],
            [0, 0, 1, 0, 1, 0, 1, 0, 0],
            [0, 1, 0, 1, 0, 1, 0, 1, 0],
            [1, 0, 0, 0, 0, 0, 0, 0, 1]
        ],
        types: [
            ['strong', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'strong'],
            ['normal', 'strong', 'normal', 'normal', 'normal', 'normal', 'normal', 'strong', 'normal'],
            ['normal', 'normal', 'strong', 'normal', 'special', 'normal', 'strong', 'normal', 'normal'],
            ['normal', 'strong', 'normal', 'special', 'normal', 'special', 'normal', 'strong', 'normal'],
            ['strong', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'strong']
        ]
    },
    // 第5关 - 复杂布局
    {
        bricks: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        types: [
            ['strong', 'strong', 'strong', 'strong', 'strong', 'strong', 'strong', 'strong', 'strong'],
            ['strong', 'special', 'strong', 'special', 'strong', 'special', 'strong', 'special', 'strong'],
            ['strong', 'strong', 'strong', 'strong', 'special', 'strong', 'strong', 'strong', 'strong'],
            ['strong', 'special', 'strong', 'special', 'strong', 'special', 'strong', 'special', 'strong'],
            ['strong', 'strong', 'strong', 'strong', 'strong', 'strong', 'strong', 'strong', 'strong']
        ]
    }
];

// 挡板变量
const paddleWidth = 100;
const paddleHeight = 15;
let paddleX = (canvas.width - paddleWidth) / 2;
let currentPaddleWidth = paddleWidth;
const paddleSpeed = 8;
let rightPressed = false;
let leftPressed = false;

// 球变量
const ballRadius = 10;
let ballX = canvas.width / 2;
let ballY = canvas.height - paddleHeight - ballRadius - 10;
let ballSpeedX = 5;
let ballSpeedY = -5;
let baseBallSpeed = 5; // 基础球速，用于调整

// 砖块变量
const brickRowCount = 5;
const brickColumnCount = 9;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 60;
const brickOffsetLeft = 30;

// 砖块类型和颜色
const brickTypes = {
    normal: { color: '#3498db', points: 10, hp: 1, dropChance: 0.1 },
    strong: { color: '#e74c3c', points: 20, hp: 2, dropChance: 0.2 },
    special: { color: '#f1c40f', points: 30, hp: 1, special: true, dropChance: 0.4 }
};

// 初始化砖块数组
let bricks = [];

// 游戏状态存档
let gameState = {
    level: 1,
    score: 0,
    lives: 3,
    maxLevel: 1
};

// 加载存档
function loadGameState() {
    const savedState = localStorage.getItem('brickBreakerSave');
    if (savedState) {
        try {
            gameState = JSON.parse(savedState);
            level = gameState.level;
            score = gameState.score;
            lives = gameState.lives;
            updateScore();
            updateLives();
        } catch (e) {
            console.error('无法加载存档:', e);
        }
    }
}

// 保存游戏状态
function saveGameState() {
    gameState = {
        level: level,
        score: score,
        lives: lives,
        maxLevel: Math.max(level, gameState.maxLevel || 1)
    };
    localStorage.setItem('brickBreakerSave', JSON.stringify(gameState));
}

// 生成道具
function spawnPowerup(x, y) {
    const powerupTypes = Object.keys(powerupTypes);
    const randomPowerup = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
    
    powerups.push({
        x: x,
        y: y,
        type: randomPowerup,
        width: 20,
        height: 20,
        speed: 2
    });
}

// 绘制道具
function drawPowerups() {
    powerups.forEach(powerup => {
        ctx.beginPath();
        ctx.rect(powerup.x, powerup.y, powerup.width, powerup.height);
        ctx.fillStyle = powerupTypes[powerup.type].color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(powerup.x, powerup.y, powerup.width, powerup.height);
        ctx.closePath();
    });
}

// 更新道具位置
function updatePowerups() {
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        powerup.y += powerup.speed;
        
        // 检查是否碰到挡板
        if (
            powerup.y + powerup.height > canvas.height - paddleHeight &&
            powerup.y < canvas.height &&
            powerup.x + powerup.width > paddleX &&
            powerup.x < paddleX + currentPaddleWidth
        ) {
            // 应用道具效果
            powerupTypes[powerup.type].effect();
            powerups.splice(i, 1);
        }
        // 检查是否掉出屏幕
        else if (powerup.y > canvas.height) {
            powerups.splice(i, 1);
        }
    }
}

// 添加生命
function addLife(amount) {
    lives = Math.min(lives + amount, maxLives);
    updateLives();
}

// 改变挡板宽度
function changePaddleWidth(change) {
    currentPaddleWidth = Math.max(40, Math.min(200, currentPaddleWidth + change));
    // 确保挡板不会超出画布
    if (paddleX + currentPaddleWidth > canvas.width) {
        paddleX = canvas.width - currentPaddleWidth;
    }
}

// 改变球速
function changeballSpeed(change) {
    // 保持方向不变，只改变速度
    const speedFactor = 1 + (change * 0.2);
    ballSpeedX *= speedFactor;
    ballSpeedY *= speedFactor;
}

// 显示生命值条
function drawLifeBar() {
    const barWidth = 150;
    const barHeight = 10;
    const barX = canvas.width - barWidth - 20;
    const barY = 20;
    
    // 绘制背景
    ctx.fillStyle = '#444';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // 绘制当前生命值
    const fillWidth = (lives / maxLives) * barWidth;
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(barX, barY, fillWidth, barHeight);
    
    // 绘制边框
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // 绘制生命值文本
    ctx.font = '12px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText(`${lives}/${maxLives}`, barX - 5, barY + barHeight - 1);
}

// 初始化砖块
function initBricks() {
    bricks = [];
    
    // 使用预设关卡（如果有）
    if (level <= predefinedLevels.length) {
        const levelData = predefinedLevels[level - 1];
        
        for (let c = 0; c < brickColumnCount; c++) {
            bricks[c] = [];
            for (let r = 0; r < brickRowCount; r++) {
                if (levelData.bricks[r] && levelData.bricks[r][c] === 1) {
                    const brickType = levelData.types[r][c];
                    bricks[c][r] = { 
                        x: c * (brickWidth + brickPadding) + brickOffsetLeft,
                        y: r * (brickHeight + brickPadding) + brickOffsetTop,
                        status: 1, // 1表示未被破坏, 0表示已破坏
                        type: brickType,
                        hp: brickTypes[brickType].hp
                    };
                } else {
                    bricks[c][r] = { status: 0 };
                }
            }
        }
    } 
    // 随机生成关卡
    else {
        for (let c = 0; c < brickColumnCount; c++) {
            bricks[c] = [];
            for (let r = 0; r < brickRowCount; r++) {
                // 根据关卡难度决定砖块生成概率
                const spawnChance = 0.8 + (level - predefinedLevels.length) * 0.03;
                
                if (Math.random() < spawnChance) {
                    // 根据关卡和位置决定砖块类型
                    let type = 'normal';
                    
                    // 难度随关卡增加
                    const strongBrickChance = Math.min(0.4, 0.1 + (level - 1) * 0.05);
                    const specialBrickChance = Math.min(0.2, 0.05 + (level - 1) * 0.02);
                    
                    if (Math.random() < strongBrickChance) {
                        type = 'strong';
                    }
                    
                    if (Math.random() < specialBrickChance) {
                        type = 'special';
                    }
                    
                    bricks[c][r] = { 
                        x: c * (brickWidth + brickPadding) + brickOffsetLeft,
                        y: r * (brickHeight + brickPadding) + brickOffsetTop,
                        status: 1, // 1表示未被破坏, 0表示已破坏
                        type: type,
                        hp: brickTypes[type].hp
                    };
                } else {
                    bricks[c][r] = { status: 0 };
                }
            }
        }
    }
}

// 游戏初始化
function initGame() {
    score = gameState.score || 0;
    lives = gameState.lives || 3;
    level = gameState.level || 1;
    powerups = [];
    currentPaddleWidth = paddleWidth;
    updateScore();
    updateLives();
    initBricks();
    resetBall();
}

// 重置球位置
function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height - paddleHeight - ballRadius - 10;
    
    // 重置球速度（但保持难度相关的速度增加）
    const levelSpeedBonus = (level - 1) * 0.3;
    baseBallSpeed = 5 + levelSpeedBonus;
    
    // 随机决定球的初始水平方向
    ballSpeedX = (Math.random() * 2 + baseBallSpeed - 1) * (Math.random() < 0.5 ? -1 : 1);
    ballSpeedY = -baseBallSpeed;
    
    paddleX = (canvas.width - currentPaddleWidth) / 2;
}

// 更新分数显示
function updateScore() {
    scoreElement.textContent = score;
}

// 更新生命显示
function updateLives() {
    livesElement.textContent = lives;
}

// 绘制挡板
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, currentPaddleWidth, paddleHeight);
    ctx.fillStyle = '#2ecc71';
    ctx.fill();
    ctx.closePath();
}

// 绘制球
function drawBall() {
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ecf0f1';
    ctx.fill();
    ctx.closePath();
}

// 绘制砖块
function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const brick = bricks[c][r];
            if (brick.status > 0) {
                const type = brick.type;
                const color = brick.hp === 1 || type === 'special' ? 
                    brickTypes[type].color : 
                    '#c0392b'; // 强砖块受损后的颜色
                
                ctx.beginPath();
                ctx.rect(brick.x, brick.y, brickWidth, brickHeight);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.closePath();
                
                // 为特殊砖块添加标记
                if (type === 'special') {
                    ctx.beginPath();
                    ctx.arc(brick.x + brickWidth/2, brick.y + brickHeight/2, brickHeight/3, 0, Math.PI * 2);
                    ctx.fillStyle = 'white';
                    ctx.fill();
                    ctx.closePath();
                }
            }
        }
    }
}

// 检测砖块碰撞
function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const brick = bricks[c][r];
            if (brick.status > 0) {
                if (
                    ballX > brick.x &&
                    ballX < brick.x + brickWidth &&
                    ballY > brick.y &&
                    ballY < brick.y + brickHeight
                ) {
                    ballSpeedY = -ballSpeedY;
                    brick.hp--;
                    
                    if (brick.hp <= 0) {
                        brick.status = 0;
                        // 计分
                        score += brickTypes[brick.type].points;
                        updateScore();
                        
                        // 特殊砖块效果
                        if (brick.type === 'special') {
                            activateSpecialEffect();
                        }
                        
                        // 随机掉落道具
                        if (Math.random() < brickTypes[brick.type].dropChance) {
                            spawnPowerup(brick.x + brickWidth/2 - 10, brick.y);
                        }
                        
                        // 检查是否全部砖块都被击破
                        if (checkLevelComplete()) {
                            saveGameState();
                            showLevelComplete();
                            return;
                        }
                    }
                }
            }
        }
    }
}

// 激活特殊砖块效果 (随机一种效果)
function activateSpecialEffect() {
    const effects = [
        () => { changePaddleWidth(20); }, // 增加挡板宽度
        () => { ballSpeedX *= 0.8; ballSpeedY *= 0.8; }, // 减慢球速
        () => { addLife(1); } // 增加生命
    ];
    
    // 随机选择一个效果
    const randomEffect = Math.floor(Math.random() * effects.length);
    effects[randomEffect]();
}

// 检查是否所有砖块都被破坏
function checkLevelComplete() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status > 0) {
                return false;
            }
        }
    }
    return true;
}

// 显示关卡完成信息
function showLevelComplete() {
    cancelAnimationFrame(requestId);
    gameRunning = false;
    
    levelScoreElement.textContent = score;
    levelCompleteModal.style.display = 'flex';
}

// 进入下一关
function nextLevel() {
    level++;
    gameState.maxLevel = Math.max(gameState.maxLevel, level);
    saveGameState();
    initBricks();
    resetBall();
    powerups = [];
    
    // 恢复挡板默认宽度
    currentPaddleWidth = paddleWidth;
    
    levelCompleteModal.style.display = 'none';
    startGame();
}

// 游戏循环
function gameLoop() {
    if (!gameRunning || gamePaused) return;
    
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制游戏元素
    drawBricks();
    drawPaddle();
    drawBall();
    drawPowerups();
    drawLifeBar();
    
    // 更新道具位置并检测碰撞
    updatePowerups();
    
    // 碰撞检测
    collisionDetection();
    
    // 墙壁碰撞检测
    if (ballX + ballSpeedX > canvas.width - ballRadius || ballX + ballSpeedX < ballRadius) {
        ballSpeedX = -ballSpeedX;
    }
    
    if (ballY + ballSpeedY < ballRadius) {
        ballSpeedY = -ballSpeedY;
    } else if (ballY + ballSpeedY > canvas.height - ballRadius - paddleHeight) {
        // 挡板碰撞检测
        if (ballX > paddleX && ballX < paddleX + currentPaddleWidth) {
            // 根据球击中挡板的位置改变反弹角度
            const hitPosition = (ballX - paddleX) / currentPaddleWidth;
            const angleRange = Math.PI / 3; // 60度角范围
            
            // 将位置映射到角度，中间位置直接向上，两侧有角度
            const angle = (hitPosition - 0.5) * angleRange;
            
            // 计算新的球速度
            const speed = Math.sqrt(ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY);
            ballSpeedX = speed * Math.sin(angle);
            ballSpeedY = -speed * Math.cos(angle);
        } else if (ballY + ballSpeedY > canvas.height - ballRadius) {
            // 球掉落
            lives--;
            updateLives();
            saveGameState();
            
            if (lives <= 0) {
                gameOver();
                return;
            } else {
                resetBall();
            }
        }
    }
    
    // 挡板移动
    if (rightPressed && paddleX < canvas.width - currentPaddleWidth) {
        paddleX += paddleSpeed;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= paddleSpeed;
    }
    
    // 球移动
    ballX += ballSpeedX;
    ballY += ballSpeedY;
    
    // 继续游戏循环
    requestId = requestAnimationFrame(gameLoop);
}

// 开始游戏
function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        requestId = requestAnimationFrame(gameLoop);
    } else if (gamePaused) {
        gamePaused = false;
        requestId = requestAnimationFrame(gameLoop);
    }
}

// 暂停游戏
function pauseGame() {
    if (gameRunning && !gamePaused) {
        gamePaused = true;
        cancelAnimationFrame(requestId);
        saveGameState();
    }
}

// 重新开始游戏
function restartGame() {
    cancelAnimationFrame(requestId);
    level = 1;
    score = 0;
    lives = 3;
    saveGameState();
    initGame();
    startGame();
}

// 游戏结束
function gameOver() {
    cancelAnimationFrame(requestId);
    gameRunning = false;
    
    finalScoreElement.textContent = score;
    gameOverModal.style.display = 'flex';
}

// 键盘事件处理
function keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        leftPressed = true;
    } else if (e.key === ' ') {
        // 空格键开始/暂停游戏
        if (gameRunning && !gamePaused) {
            pauseGame();
        } else {
            startGame();
        }
    } else if (e.key.toLowerCase() === 'r') {
        // R键重新开始游戏
        restartGame();
    }
}

function keyUpHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        rightPressed = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        leftPressed = false;
    }
}

// 按钮事件监听
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);
restartBtn.addEventListener('click', restartGame);
playAgainBtn.addEventListener('click', () => {
    gameOverModal.style.display = 'none';
    restartGame();
});
nextLevelBtn.addEventListener('click', nextLevel);

// 键盘事件监听
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);

// 移动设备触摸控制
let touchStartX = null;

// 触摸事件监听
canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    const canvasRect = canvas.getBoundingClientRect();
    paddleX = touch.clientX - canvasRect.left - currentPaddleWidth / 2;
}, false);

canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const canvasRect = canvas.getBoundingClientRect();
    paddleX = touch.clientX - canvasRect.left - currentPaddleWidth / 2;
    
    // 确保挡板不超出边界
    if (paddleX < 0) {
        paddleX = 0;
    } else if (paddleX > canvas.width - currentPaddleWidth) {
        paddleX = canvas.width - currentPaddleWidth;
    }
}, false);

// 保持画布的宽高比
function resizeCanvas() {
    const container = document.querySelector('.game-container');
    const containerWidth = container.clientWidth - 40; // 减去padding
    
    if (containerWidth < 800) {
        const aspectRatio = canvas.height / canvas.width;
        canvas.style.width = `${containerWidth}px`;
        canvas.style.height = `${containerWidth * aspectRatio}px`;
    } else {
        canvas.style.width = `${canvas.width}px`;
        canvas.style.height = `${canvas.height}px`;
    }
}

// 监听窗口大小变化
window.addEventListener('resize', resizeCanvas);

// 加载存档
loadGameState();

// 初始化游戏
initGame();
resizeCanvas();

// 显示开始屏幕，等待玩家点击开始按钮
ctx.fillStyle = '#222';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.font = '36px Arial';
ctx.fillStyle = '#fff';
ctx.textAlign = 'center';
ctx.fillText('打砖块游戏', canvas.width/2, canvas.height/2 - 50);
ctx.font = '24px Arial';
ctx.fillText(`当前关卡: ${level}`, canvas.width/2, canvas.height/2);
ctx.font = '18px Arial';
ctx.fillText('点击"开始游戏"按钮开始', canvas.width/2, canvas.height/2 + 40); 