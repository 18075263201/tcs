// 游戏配置
const config = {
    gridSize: 20,
    initialSpeed: 150,
    speedIncrease: 10,
    foodColor: '#e53e3e',
    snakeHeadColor: '#48bb78',
    snakeBodyColor: '#4299e1',
    gridColor: '#e2e8f0'
};

// 游戏状态
let gameState = {
    canvas: null,
    ctx: null,
    snake: [],
    food: {},
    direction: 'right',
    nextDirection: 'right',
    score: 0,
    level: 1,
    gameLoop: null,
    isRunning: false,
    speed: config.initialSpeed
};

// 游戏初始化函数
function initGame() {
    // 绑定认证相关按钮事件
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('registerBtn').addEventListener('click', handleRegister);
    document.getElementById('goToRegisterBtn').addEventListener('click', showRegisterPage);
    document.getElementById('goToLoginBtn').addEventListener('click', showLoginPage);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('showLeaderboardBtn').addEventListener('click', showLeaderboardPage);
    document.getElementById('backToGameBtn').addEventListener('click', showGamePage);
    
    // 初始化显示登录页面
    showLoginPage();
}

// 重置游戏
function resetGame() {
    // 停止当前游戏循环
    if (gameState.gameLoop) {
        clearInterval(gameState.gameLoop);
    }
    
    // 初始化蛇的位置（在画布中心）
    const centerX = Math.floor(gameState.canvas.width / (2 * config.gridSize)) * config.gridSize;
    const centerY = Math.floor(gameState.canvas.height / (2 * config.gridSize)) * config.gridSize;
    
    gameState.snake = [
        { x: centerX, y: centerY },
        { x: centerX - config.gridSize, y: centerY },
        { x: centerX - 2 * config.gridSize, y: centerY }
    ];
    
    // 重置游戏状态
    gameState.direction = 'right';
    gameState.nextDirection = 'right';
    gameState.score = 0;
    gameState.level = 1;
    gameState.isRunning = false;
    gameState.speed = config.initialSpeed;
    
    // 生成食物
    generateFood();
    
    // 更新分数和等级显示
    updateScoreAndLevel();
    
    // 绘制游戏画面
    drawGame();
}

// 开始游戏
function startGame() {
    if (!gameState.isRunning) {
        gameState.isRunning = true;
        gameState.gameLoop = setInterval(gameTick, gameState.speed);
    }
}

// 暂停游戏
function pauseGame() {
    if (gameState.isRunning) {
        gameState.isRunning = false;
        clearInterval(gameState.gameLoop);
        
        // 显示暂停信息
        gameState.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        gameState.ctx.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height);
        gameState.ctx.fillStyle = 'white';
        gameState.ctx.font = '30px Arial';
        gameState.ctx.textAlign = 'center';
        gameState.ctx.fillText('游戏暂停', gameState.canvas.width / 2, gameState.canvas.height / 2);
    }
}

// 游戏主循环
function gameTick() {
    // 更新蛇的方向
    gameState.direction = gameState.nextDirection;
    
    // 获取蛇头位置
    const head = { ...gameState.snake[0] };
    
    // 根据方向移动蛇头
    switch (gameState.direction) {
        case 'up':
            head.y -= config.gridSize;
            break;
        case 'down':
            head.y += config.gridSize;
            break;
        case 'left':
            head.x -= config.gridSize;
            break;
        case 'right':
            head.x += config.gridSize;
            break;
    }
    
    // 检查碰撞
    if (checkCollision(head)) {
        gameOver();
        return;
    }
    
    // 将新的头部添加到蛇的身体
    gameState.snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
        // 增加分数
        gameState.score += 10;
        
        // 每100分升一级，提高速度
        if (gameState.score % 100 === 0) {
            gameState.level++;
            gameState.speed = Math.max(50, config.initialSpeed - (gameState.level - 1) * config.speedIncrease);
            
            // 更新游戏速度
            clearInterval(gameState.gameLoop);
            gameState.gameLoop = setInterval(gameTick, gameState.speed);
        }
        
        // 更新分数和等级显示
        updateScoreAndLevel();
        
        // 生成新的食物
        generateFood();
    } else {
        // 如果没有吃到食物，移除尾部
        gameState.snake.pop();
    }
    
    // 绘制游戏画面
    drawGame();
}

// 检查碰撞
function checkCollision(head) {
    // 检查是否撞到墙壁
    if (
        head.x < 0 || 
        head.x >= gameState.canvas.width || 
        head.y < 0 || 
        head.y >= gameState.canvas.height
    ) {
        return true;
    }
    
    // 检查是否撞到自己
    for (let i = 1; i < gameState.snake.length; i++) {
        if (head.x === gameState.snake[i].x && head.y === gameState.snake[i].y) {
            return true;
        }
    }
    
    return false;
}

// 生成食物
function generateFood() {
    let isOnSnake;
    let newFood;
    
    // 生成不在蛇身上的食物位置
    do {
        isOnSnake = false;
        newFood = {
            x: Math.floor(Math.random() * (gameState.canvas.width / config.gridSize)) * config.gridSize,
            y: Math.floor(Math.random() * (gameState.canvas.height / config.gridSize)) * config.gridSize
        };
        
        // 检查食物是否在蛇身上
        for (let segment of gameState.snake) {
            if (segment.x === newFood.x && segment.y === newFood.y) {
                isOnSnake = true;
                break;
            }
        }
    } while (isOnSnake);
    
    gameState.food = newFood;
}

// 绘制游戏画面
function drawGame() {
    // 清空画布
    gameState.ctx.clearRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    
    // 绘制网格
    drawGrid();
    
    // 绘制食物
    gameState.ctx.fillStyle = config.foodColor;
    gameState.ctx.beginPath();
    gameState.ctx.arc(
        gameState.food.x + config.gridSize / 2,
        gameState.food.y + config.gridSize / 2,
        config.gridSize / 2,
        0,
        Math.PI * 2
    );
    gameState.ctx.fill();
    
    // 绘制蛇
    gameState.snake.forEach((segment, index) => {
        if (index === 0) {
            // 绘制蛇头
            gameState.ctx.fillStyle = config.snakeHeadColor;
        } else {
            // 绘制蛇身
            gameState.ctx.fillStyle = config.snakeBodyColor;
        }
        gameState.ctx.fillRect(segment.x, segment.y, config.gridSize, config.gridSize);
        
        // 绘制边框
        gameState.ctx.strokeStyle = 'white';
        gameState.ctx.lineWidth = 2;
        gameState.ctx.strokeRect(segment.x, segment.y, config.gridSize, config.gridSize);
    });
}

// 绘制网格
function drawGrid() {
    gameState.ctx.strokeStyle = config.gridColor;
    gameState.ctx.lineWidth = 1;
    
    // 绘制垂直线
    for (let x = 0; x <= gameState.canvas.width; x += config.gridSize) {
        gameState.ctx.beginPath();
        gameState.ctx.moveTo(x, 0);
        gameState.ctx.lineTo(x, gameState.canvas.height);
        gameState.ctx.stroke();
    }
    
    // 绘制水平线
    for (let y = 0; y <= gameState.canvas.height; y += config.gridSize) {
        gameState.ctx.beginPath();
        gameState.ctx.moveTo(0, y);
        gameState.ctx.lineTo(gameState.canvas.width, y);
        gameState.ctx.stroke();
    }
}

// 更新分数和等级显示
function updateScoreAndLevel() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('level').textContent = gameState.level;
}



// 处理键盘输入
function handleKeyPress(e) {
    // 防止页面滚动
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
    
    // 根据按键设置下一个方向
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (gameState.direction !== 'down') {
                gameState.nextDirection = 'up';
            }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (gameState.direction !== 'up') {
                gameState.nextDirection = 'down';
            }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (gameState.direction !== 'right') {
                gameState.nextDirection = 'left';
            }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (gameState.direction !== 'left') {
                gameState.nextDirection = 'right';
            }
            break;
        case ' ': // 空格键暂停/继续
            if (gameState.isRunning) {
                pauseGame();
            } else if (gameState.snake.length > 0) {
                startGame();
            }
            break;
    }
}

// 页面切换函数
function showLoginPage() {
    document.getElementById('loginPage').style.display = 'block';
    document.getElementById('registerPage').style.display = 'none';
    document.getElementById('gamePage').style.display = 'none';
    document.getElementById('leaderboardPage').style.display = 'none';
}

function showRegisterPage() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('registerPage').style.display = 'block';
    document.getElementById('gamePage').style.display = 'none';
    document.getElementById('leaderboardPage').style.display = 'none';
}

function showGamePage() {
    // 获取当前用户
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
        showLoginPage();
        return;
    }
    
    // 设置用户信息
    document.getElementById('username').textContent = currentUser.username;
    document.getElementById('userHighScore').textContent = currentUser.highScore || 0;
    
    // 设置头像
    const avatar = auth.getAvatar(currentUser.username);
    const userAvatar = document.getElementById('userAvatar');
    userAvatar.style.backgroundColor = avatar.color;
    document.getElementById('avatarLetter').textContent = avatar.letter;
    
    // 显示游戏页面
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('registerPage').style.display = 'none';
    document.getElementById('gamePage').style.display = 'block';
    document.getElementById('leaderboardPage').style.display = 'none';
    
    // 初始化游戏元素
    if (!gameState.canvas) {
        gameState.canvas = document.getElementById('gameCanvas');
        gameState.ctx = gameState.canvas.getContext('2d');
        
        // 添加游戏控制事件监听器
        document.getElementById('startBtn').addEventListener('click', startGame);
        document.getElementById('pauseBtn').addEventListener('click', pauseGame);
        document.getElementById('restartBtn').addEventListener('click', resetGame);
        
        // 键盘控制
        document.addEventListener('keydown', handleKeyPress);
    }
    
    // 重置游戏
    resetGame();
}

function showLeaderboardPage() {
    // 隐藏其他页面
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('registerPage').style.display = 'none';
    document.getElementById('gamePage').style.display = 'none';
    document.getElementById('leaderboardPage').style.display = 'block';
    
    // 加载排行榜数据
    loadLeaderboard();
}

// 处理登录
function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const messageElement = document.getElementById('loginMessage');
    
    if (!username || !password) {
        showMessage(messageElement, '请输入用户名和密码', 'error');
        return;
    }
    
    const result = auth.loginUser(username, password);
    if (result.success) {
        showMessage(messageElement, result.message, 'success');
        // 清空表单
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        // 跳转到游戏页面
        setTimeout(showGamePage, 1000);
    } else {
        showMessage(messageElement, result.message, 'error');
    }
}

// 处理注册
function handleRegister() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const messageElement = document.getElementById('registerMessage');
    
    if (!username || !password || !confirmPassword) {
        showMessage(messageElement, '请填写所有必填字段', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage(messageElement, '两次输入的密码不一致', 'error');
        return;
    }
    
    // 生成头像
    const avatar = auth.getAvatar(username);
    
    const result = auth.registerUser(username, password, avatar);
    if (result.success) {
        showMessage(messageElement, result.message, 'success');
        // 清空表单
        document.getElementById('registerUsername').value = '';
        document.getElementById('registerPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        // 跳转到登录页面
        setTimeout(showLoginPage, 1000);
    } else {
        showMessage(messageElement, result.message, 'error');
    }
}

// 处理登出
function handleLogout() {
    auth.logoutUser();
    showLoginPage();
}

// 显示消息
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = 'message ' + type;
    
    // 3秒后清除消息
    setTimeout(() => {
        element.textContent = '';
        element.className = 'message';
    }, 3000);
}

// 加载排行榜
function loadLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    const leaderboardData = auth.getLeaderboard();
    
    // 清空排行榜
    leaderboardList.innerHTML = '';
    
    // 如果排行榜为空，显示提示信息
    if (leaderboardData.length === 0) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'leaderboard-item';
        emptyItem.style.justifyContent = 'center';
        emptyItem.textContent = '暂无排行榜数据';
        leaderboardList.appendChild(emptyItem);
        return;
    }
    
    // 添加排行榜项
    leaderboardData.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        
        const rankCol = document.createElement('div');
        rankCol.className = 'rank-col leaderboard-rank';
        rankCol.textContent = index + 1;
        
        const userCol = document.createElement('div');
        userCol.className = 'user-col';
        
        const avatar = auth.getAvatar(entry.username);
        const avatarElement = document.createElement('span');
        avatarElement.className = 'leaderboard-avatar';
        avatarElement.style.backgroundColor = avatar.color;
        avatarElement.textContent = avatar.letter;
        
        const usernameElement = document.createElement('span');
        usernameElement.className = 'leaderboard-username';
        usernameElement.textContent = entry.username;
        
        userCol.appendChild(avatarElement);
        userCol.appendChild(usernameElement);
        
        const scoreCol = document.createElement('div');
        scoreCol.className = 'score-col leaderboard-score';
        scoreCol.textContent = entry.score;
        
        item.appendChild(rankCol);
        item.appendChild(userCol);
        item.appendChild(scoreCol);
        
        leaderboardList.appendChild(item);
    });
}

// 更新游戏结束逻辑
function gameOver() {
    gameState.isRunning = false;
    clearInterval(gameState.gameLoop);
    
    // 更新用户最高分
    const currentUser = auth.getCurrentUser();
    if (currentUser && gameState.score > currentUser.highScore) {
        auth.updateUserHighScore(gameState.score);
        // 更新当前用户显示的最高分
        document.getElementById('userHighScore').textContent = gameState.score;
    }
    
    // 显示游戏结束信息
    gameState.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    gameState.ctx.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    gameState.ctx.fillStyle = 'white';
    gameState.ctx.font = '30px Arial';
    gameState.ctx.textAlign = 'center';
    gameState.ctx.fillText('游戏结束', gameState.canvas.width / 2, gameState.canvas.height / 2 - 20);
    gameState.ctx.font = '20px Arial';
    gameState.ctx.fillText(`最终得分: ${gameState.score}`, gameState.canvas.width / 2, gameState.canvas.height / 2 + 20);
}

// 当页面加载完成后初始化游戏
window.addEventListener('load', initGame);