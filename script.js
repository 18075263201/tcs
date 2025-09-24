// 游戏状态
let gameState = {
    snake: [],
    food: {},
    direction: 'right',
    nextDirection: 'right',
    score: 0,
    level: 1,
    isRunning: false,
    gameLoop: null,
    speed: 200
};

// 网格大小和蛇身大小
const GRID_SIZE = 20;
const CELL_SIZE = 20;

// DOM 元素
const loginPage = document.getElementById('loginPage');
const registerPage = document.getElementById('registerPage');
const gamePage = document.getElementById('gamePage');
const leaderboardPage = document.getElementById('leaderboardPage');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 初始化游戏
function initGame() {
    // 设置Canvas大小
    canvas.width = GRID_SIZE * CELL_SIZE;
    canvas.height = GRID_SIZE * CELL_SIZE;
    
    // 初始化游戏状态
    resetGameState();
    
    // 添加键盘事件监听
    document.addEventListener('keydown', handleKeyPress);
    
    // 添加按钮事件监听
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('registerBtn').addEventListener('click', handleRegister);
    document.getElementById('goToRegisterBtn').addEventListener('click', () => showPage('registerPage'));
    document.getElementById('goToLoginBtn').addEventListener('click', () => showPage('loginPage'));
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('pauseBtn').addEventListener('click', pauseGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    document.getElementById('showLeaderboardBtn').addEventListener('click', showLeaderboardPage);
    document.getElementById('backToGameBtn').addEventListener('click', showGamePage);
    document.getElementById('exportDataBtn').addEventListener('click', handleExportData);
    document.getElementById('importDataInput').addEventListener('change', handleImportData);
    
    // 检查是否有已登录用户
    const currentUser = auth.getCurrentUser();
    if (currentUser) {
        showGamePage();
    } else {
        showPage('loginPage');
    }
}

// 重置游戏状态
function resetGameState() {
    gameState.snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    gameState.direction = 'right';
    gameState.nextDirection = 'right';
    gameState.score = 0;
    gameState.level = 1;
    gameState.speed = 200;
    gameState.isRunning = false;
    
    if (gameState.gameLoop) {
        clearInterval(gameState.gameLoop);
        gameState.gameLoop = null;
    }
    
    // 生成食物
    generateFood();
    
    // 更新UI
    updateGameInfo();
    drawGame();
}

// 生成食物
function generateFood() {
    let newFood;
    let onSnake;
    
    do {
        onSnake = false;
        newFood = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
        
        // 检查食物是否在蛇身上
        for (let segment of gameState.snake) {
            if (segment.x === newFood.x && segment.y === newFood.y) {
                onSnake = true;
                break;
            }
        }
    } while (onSnake);
    
    gameState.food = newFood;
}

// 处理键盘事件
function handleKeyPress(event) {
    const key = event.key;
    
    // 游戏控制方向
    if (gameState.isRunning) {
        switch (key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (gameState.direction !== 'down') {
                    gameState.nextDirection = 'up';
                }
                event.preventDefault();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (gameState.direction !== 'up') {
                    gameState.nextDirection = 'down';
                }
                event.preventDefault();
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (gameState.direction !== 'right') {
                    gameState.nextDirection = 'left';
                }
                event.preventDefault();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (gameState.direction !== 'left') {
                    gameState.nextDirection = 'right';
                }
                event.preventDefault();
                break;
        }
    }
    
    // 空格键暂停/继续游戏
    if (key === ' ') {
        if (gameState.isRunning) {
            pauseGame();
        } else if (gameState.gameLoop) {
            startGame();
        }
        event.preventDefault();
    }
}

// 开始游戏
function startGame() {
    if (!gameState.isRunning) {
        gameState.isRunning = true;
        
        if (!gameState.gameLoop) {
            gameState.gameLoop = setInterval(gameUpdate, gameState.speed);
        }
    }
}

// 暂停游戏
function pauseGame() {
    gameState.isRunning = false;
}

// 重新开始游戏
function restartGame() {
    resetGameState();
    startGame();
}

// 游戏更新
function gameUpdate() {
    if (!gameState.isRunning) return;
    
    // 更新方向
    gameState.direction = gameState.nextDirection;
    
    // 获取蛇头
    const head = { ...gameState.snake[0] };
    
    // 根据方向移动蛇头
    switch (gameState.direction) {
        case 'up':
            head.y -= 1;
            break;
        case 'down':
            head.y += 1;
            break;
        case 'left':
            head.x -= 1;
            break;
        case 'right':
            head.x += 1;
            break;
    }
    
    // 检查碰撞
    if (checkCollision(head)) {
        gameOver();
        return;
    }
    
    // 将新的头部添加到蛇的前面
    gameState.snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
        // 增加分数
        gameState.score += 10;
        
        // 检查是否升级
        const newLevel = Math.floor(gameState.score / 50) + 1;
        if (newLevel > gameState.level) {
            gameState.level = newLevel;
            // 增加游戏速度
            gameState.speed = Math.max(50, 200 - (gameState.level - 1) * 20);
            if (gameState.gameLoop) {
                clearInterval(gameState.gameLoop);
                gameState.gameLoop = setInterval(gameUpdate, gameState.speed);
            }
        }
        
        // 生成新食物
        generateFood();
    } else {
        // 移除蛇尾
        gameState.snake.pop();
    }
    
    // 更新游戏信息
    updateGameInfo();
    
    // 绘制游戏
    drawGame();
}

// 检查碰撞
function checkCollision(head) {
    // 检查是否撞墙
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
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

// 游戏结束
function gameOver() {
    gameState.isRunning = false;
    clearInterval(gameState.gameLoop);
    gameState.gameLoop = null;
    
    // 更新用户最高分
    const updated = auth.updateUserHighScore(gameState.score);
    
    // 如果排行榜页面正在显示，则刷新排行榜
    if (updated && document.getElementById('leaderboardPage').style.display === 'block') {
        loadLeaderboard();
    }
    
    // 显示游戏结束信息
    showMessage('游戏结束', `你的得分: ${gameState.score}`, 'info');
}

// 绘制游戏
function drawGame() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制蛇
    gameState.snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#48bb78' : '#4fd1c5';
        ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
    });
    
    // 绘制食物
    ctx.fillStyle = '#f56565';
    ctx.fillRect(gameState.food.x * CELL_SIZE, gameState.food.y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
}

// 更新游戏信息
function updateGameInfo() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('level').textContent = gameState.level;
}

// 设置用户头像
function setUserAvatar(user) {
    const avatar = document.getElementById('userAvatar');
    const avatarLetter = document.getElementById('avatarLetter');
    
    if (user && user.avatar) {
        avatar.style.backgroundColor = user.avatar.color;
        avatarLetter.textContent = user.avatar.letter;
    } else {
        avatar.style.backgroundColor = '#cbd5e0';
        avatarLetter.textContent = '?';
    }
}

// 显示指定页面
function showPage(pageId) {
    // 隐藏所有页面
    loginPage.style.display = 'none';
    registerPage.style.display = 'none';
    gamePage.style.display = 'none';
    leaderboardPage.style.display = 'none';
    
    // 显示指定页面
    document.getElementById(pageId).style.display = 'block';
}

// 显示游戏页面
function showGamePage() {
    const currentUser = auth.getCurrentUser();
    if (currentUser) {
        document.getElementById('username').textContent = currentUser.username;
        document.getElementById('userHighScore').textContent = currentUser.highScore;
        setUserAvatar(currentUser);
    }
    
    showPage('gamePage');
    drawGame();
}

// 显示排行榜页面
function showLeaderboardPage() {
    showPage('leaderboardPage');
    loadLeaderboard();
}

// 加载排行榜
function loadLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '';
    
    const leaderboardData = auth.getLeaderboard();
    
    if (leaderboardData.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'leaderboard-empty';
        emptyMessage.textContent = '暂无排行榜数据';
        leaderboardList.appendChild(emptyMessage);
        return;
    }
    
    leaderboardData.forEach((entry, index) => {
        const leaderboardItem = document.createElement('div');
        leaderboardItem.className = 'leaderboard-item';
        
        // 创建排名
        const rankElement = document.createElement('div');
        rankElement.className = 'rank-col';
        rankElement.textContent = index + 1;
        
        // 创建用户信息
        const userElement = document.createElement('div');
        userElement.className = 'user-col';
        
        // 创建头像
        const avatarElement = document.createElement('div');
        avatarElement.className = 'leaderboard-avatar';
        if (entry.avatar) {
            avatarElement.style.backgroundColor = entry.avatar.color;
            avatarElement.textContent = entry.avatar.letter;
        } else {
            avatarElement.style.backgroundColor = '#cbd5e0';
            avatarElement.textContent = entry.username.charAt(0).toUpperCase();
        }
        
        // 创建用户名
        const usernameElement = document.createElement('span');
        usernameElement.textContent = entry.username;
        
        // 组合用户信息
        userElement.appendChild(avatarElement);
        userElement.appendChild(usernameElement);
        
        // 创建分数
        const scoreElement = document.createElement('div');
        scoreElement.className = 'score-col';
        scoreElement.textContent = entry.score;
        
        // 组合排行榜项
        leaderboardItem.appendChild(rankElement);
        leaderboardItem.appendChild(userElement);
        leaderboardItem.appendChild(scoreElement);
        
        // 添加到排行榜列表
        leaderboardList.appendChild(leaderboardItem);
    });
}

// 处理登录
function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const loginMessage = document.getElementById('loginMessage');
    
    if (!username || !password) {
        showMessage(loginMessage, '请输入用户名和密码', 'error');
        return;
    }
    
    const result = auth.loginUser(username, password);
    if (result.success) {
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        showGamePage();
    } else {
        showMessage(loginMessage, result.message, 'error');
    }
}

// 处理注册
function handleRegister() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const registerMessage = document.getElementById('registerMessage');
    
    if (!username || !password || !confirmPassword) {
        showMessage(registerMessage, '请填写所有必填字段', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage(registerMessage, '两次输入的密码不一致', 'error');
        return;
    }
    
    const avatar = auth.getAvatar(username);
    const result = auth.registerUser(username, password, avatar);
    
    if (result.success) {
        document.getElementById('registerUsername').value = '';
        document.getElementById('registerPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        showMessage(registerMessage, result.message, 'success');
        setTimeout(() => {
            showPage('loginPage');
        }, 1500);
    } else {
        showMessage(registerMessage, result.message, 'error');
    }
}

// 处理登出
function handleLogout() {
    auth.logoutUser();
    resetGameState();
    showPage('loginPage');
}

// 显示消息
function showMessage(element, message, type) {
    if (!element) {
        // 如果没有指定元素，创建一个临时消息元素
        const tempMessage = document.createElement('div');
        tempMessage.className = `message ${type}`;
        tempMessage.textContent = message;
        tempMessage.style.position = 'fixed';
        tempMessage.style.top = '20px';
        tempMessage.style.left = '50%';
        tempMessage.style.transform = 'translateX(-50%)';
        tempMessage.style.zIndex = '1000';
        tempMessage.style.padding = '10px 20px';
        tempMessage.style.borderRadius = '4px';
        tempMessage.style.backgroundColor = type === 'error' ? '#fed7d7' : '#c6f6d5';
        tempMessage.style.color = type === 'error' ? '#c53030' : '#22543d';
        tempMessage.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        document.body.appendChild(tempMessage);
        
        // 3秒后移除临时消息
        setTimeout(() => {
            tempMessage.remove();
        }, 3000);
    } else {
        // 如果指定了元素，使用该元素显示消息
        element.textContent = message;
        element.className = `message ${type}`;
        
        // 3秒后清空消息
        setTimeout(() => {
            element.textContent = '';
            element.className = 'message';
        }, 3000);
    }
}

// 处理数据导出
function handleExportData() {
    try {
        auth.exportUserData();
    } catch (error) {
        console.error('导出数据失败:', error);
        showMessage(null, '数据导出失败，请重试', 'error');
    }
}

// 处理数据导入
function handleImportData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.json')) {
        showMessage(null, '请选择有效的JSON数据文件', 'error');
        event.target.value = ''; // 清空文件选择
        return;
    }
    
    auth.importUserData(file)
        .then(result => {
            showMessage(null, result.message, 'success');
            event.target.value = ''; // 清空文件选择
            
            // 刷新当前页面数据
            if (document.getElementById('gamePage').style.display === 'block') {
                const currentUser = auth.getCurrentUser();
                if (currentUser) {
                    document.getElementById('username').textContent = currentUser.username;
                    document.getElementById('userHighScore').textContent = currentUser.highScore;
                }
            } else if (document.getElementById('leaderboardPage').style.display === 'block') {
                loadLeaderboard();
            }
        })
        .catch(error => {
            showMessage(null, error.message, 'error');
            event.target.value = ''; // 清空文件选择
        });
}

// 页面加载完成后初始化游戏
window.addEventListener('DOMContentLoaded', initGame);

// 添加数据同步按钮事件
// 注意：需要在HTML中添加相应的按钮和文件输入元素