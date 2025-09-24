// 用户认证和数据管理模块

// 初始化用户数据
function initUserData() {
    // 检查用户数据是否存在
    if (!localStorage.getItem('snakeGameUsers')) {
        localStorage.setItem('snakeGameUsers', JSON.stringify([]));
    }
    
    // 检查排行榜数据是否存在
    if (!localStorage.getItem('snakeGameLeaderboard')) {
        localStorage.setItem('snakeGameLeaderboard', JSON.stringify([]));
    }
}

// 注册新用户
function registerUser(username, password, avatar) {
    const users = JSON.parse(localStorage.getItem('snakeGameUsers'));
    
    // 检查用户名是否已存在
    if (users.some(user => user.username === username)) {
        return { success: false, message: '用户名已存在' };
    }
    
    // 创建新用户
    const newUser = {
        id: Date.now().toString(),
        username,
        password: btoa(password), // 简单加密密码
        avatar,
        createdAt: new Date().toISOString(),
        highScore: 0
    };
    
    // 保存用户数据
    users.push(newUser);
    localStorage.setItem('snakeGameUsers', JSON.stringify(users));
    
    return { success: true, message: '注册成功' };
}

// 用户登录
function loginUser(username, password) {
    const users = JSON.parse(localStorage.getItem('snakeGameUsers'));
    const user = users.find(u => u.username === username && u.password === btoa(password));
    
    if (user) {
        // 保存登录状态
        localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            highScore: user.highScore
        }));
        
        return { success: true, message: '登录成功', user };
    } else {
        return { success: false, message: '用户名或密码错误' };
    }
}

// 获取当前登录用户
function getCurrentUser() {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
}

// 用户登出
function logoutUser() {
    localStorage.removeItem('currentUser');
}

// 更新用户最高分
function updateUserHighScore(score) {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;
    
    const users = JSON.parse(localStorage.getItem('snakeGameUsers'));
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex !== -1 && score > users[userIndex].highScore) {
        // 更新用户最高分
        users[userIndex].highScore = score;
        localStorage.setItem('snakeGameUsers', JSON.stringify(users));
        
        // 更新当前用户信息
        currentUser.highScore = score;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // 更新排行榜
        updateLeaderboard(currentUser.username, currentUser.avatar, score);
        
        return true;
    }
    
    return false;
}

// 更新排行榜
function updateLeaderboard(username, avatar, score) {
    const leaderboard = JSON.parse(localStorage.getItem('snakeGameLeaderboard'));
    
    // 检查用户是否已经在排行榜中
    const userIndex = leaderboard.findIndex(entry => entry.username === username);
    
    if (userIndex !== -1) {
        // 如果是更高的分数，则更新
        if (score > leaderboard[userIndex].score) {
            leaderboard[userIndex].score = score;
            leaderboard[userIndex].updatedAt = new Date().toISOString();
        }
    } else {
        // 添加新的排行榜记录
        leaderboard.push({
            username,
            avatar,
            score,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }
    
    // 按分数排序，取前10名
    leaderboard.sort((a, b) => b.score - a.score);
    const top10Leaderboard = leaderboard.slice(0, 10);
    
    // 保存排行榜
    localStorage.setItem('snakeGameLeaderboard', JSON.stringify(top10Leaderboard));
}

// 获取排行榜数据
function getLeaderboard() {
    return JSON.parse(localStorage.getItem('snakeGameLeaderboard'));
}

// 获取用户头像（默认头像生成）
function getAvatar(username) {
    // 简单的头像生成逻辑，基于用户名的哈希值
    const colors = ['#48bb78', '#4299e1', '#ed8936', '#9f7aea', '#f56565'];
    const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = hash % colors.length;
    const letter = username.charAt(0).toUpperCase();
    
    return {
        color: colors[colorIndex],
        letter
    };
}

// 导出数据（用于跨设备同步）
function exportUserData() {
    const users = JSON.parse(localStorage.getItem('snakeGameUsers'));
    const leaderboard = JSON.parse(localStorage.getItem('snakeGameLeaderboard'));
    const currentUser = localStorage.getItem('currentUser');
    
    const data = {
        users,
        leaderboard,
        version: '1.0',
        exportDate: new Date().toISOString()
    };
    
    // 创建数据URL并提供下载
    const dataStr = JSON.stringify(data);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `snake-game-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    
    // 清理
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

// 导入数据（用于跨设备同步）
function importUserData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                // 验证数据格式
                if (!data.users || !Array.isArray(data.users) || !data.leaderboard || !Array.isArray(data.leaderboard)) {
                    throw new Error('无效的数据格式');
                }
                
                // 保存数据到localStorage
                localStorage.setItem('snakeGameUsers', JSON.stringify(data.users));
                localStorage.setItem('snakeGameLeaderboard', JSON.stringify(data.leaderboard));
                
                // 如果有当前用户信息，尝试恢复登录状态
                const currentUser = getCurrentUser();
                if (currentUser) {
                    const importedUser = data.users.find(u => u.id === currentUser.id);
                    if (importedUser) {
                        localStorage.setItem('currentUser', JSON.stringify({
                            id: importedUser.id,
                            username: importedUser.username,
                            avatar: importedUser.avatar,
                            highScore: importedUser.highScore
                        }));
                    }
                }
                
                resolve({ success: true, message: '数据导入成功' });
            } catch (error) {
                reject({ success: false, message: '数据导入失败: ' + error.message });
            }
        };
        
        reader.onerror = () => {
            reject({ success: false, message: '文件读取失败' });
        };
        
        reader.readAsText(file);
    });
}

// 导出功能
window.auth = {
    initUserData,
    registerUser,
    loginUser,
    getCurrentUser,
    logoutUser,
    updateUserHighScore,
    getLeaderboard,
    getAvatar,
    exportUserData,
    importUserData
};