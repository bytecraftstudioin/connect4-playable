const ROWS = 6;
const COLS = 7;

const boardElement = document.getElementById("board");
let currentPlayer = "player";
let board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

// --- UPGRADED AUDIO SYSTEM WITH AUTO-LOOP BGM MANAGER ---
const sounds = {
    drop: new Audio('assets/sounds/disc_drop.mp3'),
    click: new Audio('assets/sounds/ui_click.mp3'),
    coin: new Audio('assets/sounds/coin_collect.mp3'),
    win: new Audio('assets/sounds/game_win.mp3'),
    lose: new Audio('assets/sounds/game_lose.mp3'),
    bgm: new Audio('assets/sounds/home_theme.mp3') // Added Home Theme BGM track
};

// Configure background music setup properties
sounds.bgm.loop = true;  // Loops indefinitely
sounds.bgm.volume = 0.25; // Lower volume so it stays in background pleasantly

let isBgmPlaying = false;

// Safe Audio Core Trigger Matrix
function playSound(type) {
    if (sounds[type]) {
        sounds[type].currentTime = 0; 
        sounds[type].volume = 0.5;    
        sounds[type].play().catch(e => console.log("Audio streaming blocked until user interaction sequence"));
    }
}

// Global safe trigger to start background music after first ever user tap interaction
function startBGM() {
    if (!isBgmPlaying) {
        sounds.bgm.play()
            .then(() => { isBgmPlaying = true; })
            .catch(e => console.log("BGM autoplay policy fallback lock activated"));
    }
}

// UI Elements
const popup = document.getElementById("popup");
const popupTitle = document.getElementById("popup-title");
const restartBtn = document.getElementById("restartBtn");
const homeScreen = document.getElementById("home-screen");
const gameScreen = document.getElementById("game-screen");
const playBtn = document.getElementById("playBtn");
const turnIndicator = document.getElementById("turn-indicator");

// Popups
const storePopup = document.getElementById("store-popup");
const storeBtn = document.getElementById("storeBtn");
const closeStoreBtn = document.getElementById("closeStoreBtn");
const statsPopup = document.getElementById("stats-popup");
const statsBtn = document.getElementById("statsBtn");
const closeStatsBtn = document.getElementById("closeStatsBtn");
const dailyBtn = document.getElementById("dailyBtn");

// Storage values
let coins = Number(localStorage.getItem("coins")) || 0;
let wins = Number(localStorage.getItem("wins")) || 0;
let games = Number(localStorage.getItem("games")) || 0;
let currentTheme = localStorage.getItem("selectedTheme") || "classic"; 
let matchHistory = JSON.parse(localStorage.getItem("matchHistory")) || [];

// Permanent Ownership Array Database
let ownedThemes = JSON.parse(localStorage.getItem("ownedThemes")) || ["classic"];

const coinsEl = document.getElementById("coins");
const winsEl = document.getElementById("wins");
const gamesEl = document.getElementById("games");
const difficultySelect = document.getElementById("difficulty");

// Daily Reward Elements
const dailyPopup = document.getElementById("daily-popup");
const closeDailyBtn = document.getElementById("closeDailyBtn");
const claimRewardBtn = document.getElementById("claimRewardBtn");

// LocalStorage data handle
let lastClaimDate = localStorage.getItem("lastClaimDate") || null;
let currentStreak = Number(localStorage.getItem("currentStreak")) || 0; 

// Open Daily Reward Popup
dailyBtn.addEventListener("click", () => {
    startBGM(); // Safely triggers loop context if not active
    playSound('click');
    checkStreakValidity(); 
    updateDailyUI();
    dailyPopup.classList.remove("hidden");
});

closeDailyBtn.addEventListener("click", () => {
    playSound('click');
    dailyPopup.classList.add("hidden");
});

// Main Claim Logic
claimRewardBtn.addEventListener("click", () => {
    if (!canClaimToday()) {
        showSnackbar("❌ You have already claimed today's reward! Come back tomorrow.");
        return;
    }

    playSound('coin'); 
    let nextDay = currentStreak + 1;
    let rewardAmount = (nextDay === 7) ? 100 : 50;

    coins += rewardAmount;
    currentStreak = nextDay === 7 ? 0 : nextDay; 
    lastClaimDate = new Date().toDateString(); 

    localStorage.setItem("currentStreak", currentStreak);
    localStorage.setItem("lastClaimDate", lastClaimDate);
    
    updateStats();
    updateDailyUI();

    showSnackbar(`🎉 Successfully Claimed Day ${nextDay} Reward: +${rewardAmount} Coins!`);
    dailyPopup.classList.add("hidden");
});

// Helper Functions
function canClaimToday() {
    let today = new Date().toDateString();
    return lastClaimDate !== today;
}

function checkStreakValidity() {
    if (!lastClaimDate) return;

    let today = new Date();
    let lastClaim = new Date(lastClaimDate);
    
    const diffTime = Math.abs(today - lastClaim);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
        currentStreak = 0;
        localStorage.setItem("currentStreak", currentStreak);
    }
}

function updateDailyUI() {
    let nextDayToClaim = currentStreak + 1;
    let availableToClaim = canClaimToday();

    for (let i = 1; i <= 7; i++) {
        let box = document.getElementById(`day${i}`);
        if (!box) continue;
        
        box.className = (i === 7) ? "day-box mega-day" : "day-box";
        
        if (i < nextDayToClaim) {
            box.classList.add("claimed");
        } else if (i === nextDayToClaim) {
            if (availableToClaim) {
                box.classList.add("active-claim");
            } else {
                box.classList.add("waiting");
            }
        } else {
            box.classList.add("locked");
        }
    }

    if (availableToClaim) {
        claimRewardBtn.removeAttribute("disabled");
        claimRewardBtn.textContent = `Claim Day ${nextDayToClaim} Bonus!`;
    } else {
        claimRewardBtn.setAttribute("disabled", "true");
        claimRewardBtn.textContent = "Come Back Tomorrow!";
    }
}

// Event Listeners Navigation
playBtn.addEventListener("click", () => {
    startBGM(); // Start background track loops safely on primary action click
    playSound('click');
    resetGameData();
    homeScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    updateTurnUI();
});

document.getElementById("backBtn").addEventListener("click", () => {
    playSound('click');
    gameScreen.classList.add("hidden");
    homeScreen.classList.remove("hidden");
});

// Popups triggers with Store Synchronization Engine
storeBtn.addEventListener("click", () => {
    startBGM(); // Triggers continuous fallback music thread on store popup launch
    playSound('click');
    updateStoreUI(); 
    storePopup.classList.remove("hidden");
});

closeStoreBtn.addEventListener("click", () => {
    playSound('click');
    storePopup.classList.add("hidden");
});

statsBtn.addEventListener("click", () => {
    startBGM(); // Triggers continuous fallback music thread on stats popup launch
    playSound('click');
    renderHistory();
    statsPopup.classList.remove("hidden");
});

closeStatsBtn.addEventListener("click", () => {
    playSound('click');
    statsPopup.classList.add("hidden");
});

restartBtn.addEventListener("click", () => {
    playSound('click');
    popup.classList.add("hidden");
    resetGameData();
});

function resetGameData() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    boardElement.innerHTML = "";
    createBoardUI();
    currentPlayer = "player";
    updateTurnUI();
}

function updateStats() {
    coinsEl.textContent = coins;
    winsEl.textContent = wins;
    gamesEl.textContent = games;
    localStorage.setItem("coins", coins);
    localStorage.setItem("wins", wins);
    localStorage.setItem("games", games);
    localStorage.setItem("matchHistory", JSON.stringify(matchHistory));
    localStorage.setItem("ownedThemes", JSON.stringify(ownedThemes)); 
}

function updateTurnUI() {
    if (currentPlayer === "player") {
        turnIndicator.textContent = "Your Turn 🔴";
        turnIndicator.className = "player-turn";
    } else {
        turnIndicator.textContent = "AI Thinking... 🤖🟡";
        turnIndicator.className = "ai-turn";
    }
}

function createBoardUI() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener("click", () => dropDisc(col));
            boardElement.appendChild(cell);
        }
    }
}

function updateCell(row, col, player) {
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return;
    cell.classList.add(player);

    cell.animate([
        { transform: "translateY(-300px)", easing: "ease-in" },
        { transform: "translateY(0)", easing: "ease-out" },
        { transform: "scaleY(0.85) scaleX(1.1)", offset: 0.8 },
        { transform: "scaleY(1) scaleX(1)" }
    ], {
        duration: 400,
        fill: "forwards"
    });
}

function dropDisc(col) {
    if (currentPlayer !== "player") return;

    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][col] === null) {
            board[row][col] = "player";
            updateCell(row, col, "player");
            playSound('drop'); 

            if (checkWinner("player")) {
                setTimeout(() => endGame("player"), 400);
                return;
            }
            if (isBoardFull()) {
                setTimeout(() => endGame("draw"), 400);
                return;
            }

            currentPlayer = "ai";
            updateTurnUI();
            setTimeout(aiMove, 600);
            break;
        }
    }
}

// AI Engine
function aiMove() {
    const difficulty = difficultySelect.value;
    let selectedCol = null;

    if (difficulty === "medium" || difficulty === "hard") {
        selectedCol = getWinningMove("ai");
        if (selectedCol === null) {
            selectedCol = getWinningMove("player");
        }
    }

    if (selectedCol === null) {
        const availableCols = [];
        for (let col = 0; col < COLS; col++) {
            if (board[0][col] === null) availableCols.push(col);
        }
        if (availableCols.length === 0) return;
        selectedCol = availableCols[Math.floor(Math.random() * availableCols.length)];
    }

    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][selectedCol] === null) {
            board[row][selectedCol] = "ai";
            updateCell(row, selectedCol, "ai");
            playSound('drop'); 

            if (checkWinner("ai")) {
                setTimeout(() => endGame("ai"), 400);
                return;
            }
            if (isBoardFull()) {
                setTimeout(() => endGame("draw"), 400);
                return;
            }

            currentPlayer = "player";
            updateTurnUI();
            break;
        }
    }
}

function endGame(outcome) {
    games += 1;
    let statusText = "";
    
    const popupRewardBody = document.querySelector("#popup .win-reward-body");
    const popupActionBtn = document.getElementById("restartBtn");

    if (outcome === "player") {
        coins += 50; 
        wins += 1;
        statusText = "🎉 YOU WIN!";
        matchHistory.unshift({ result: "Won", details: "+50 Coins", date: new Date().toLocaleDateString() });
        
        if (popupRewardBody) popupRewardBody.style.display = "flex"; 
        popupTitle.className = "win-header-banner"; 
        popupActionBtn.textContent = "PLAY AGAIN";
        playSound('win'); 
        
    } else if (outcome === "ai") {
        statusText = "🤖 AI WINS!";
        matchHistory.unshift({ result: "Lost", details: "VS AI", date: new Date().toLocaleDateString() });
        
        if (popupRewardBody) popupRewardBody.style.display = "none"; 
        popupTitle.className = "reward-ribbon win-header-banner"; 
        popupActionBtn.textContent = "TRY AGAIN?";
        playSound('lose'); 

    } else {
        statusText = "🤝 DRAW!";
        matchHistory.unshift({ result: "Draw", details: "Tie Game", date: new Date().toLocaleDateString() });
        
        if (popupRewardBody) popupRewardBody.style.display = "none"; 
        popupTitle.className = "reward-ribbon blue-ribbon win-header-banner"; 
        popupActionBtn.textContent = "NEW GAME";
        playSound('click'); 
    }

    if (matchHistory.length > 5) matchHistory.pop(); 
    updateStats();
    
    popupTitle.textContent = statusText;
    popup.classList.remove("hidden");
}

function renderHistory() {
    const container = document.getElementById("history-list");
    container.innerHTML = "";
    if (matchHistory.length === 0) {
        container.innerHTML = "<p style='color: #94a3b8;'>No matches played yet!</p>";
        return;
    }
    matchHistory.forEach(item => {
        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.justify = "space-between";
        div.style.padding = "10px";
        div.style.borderBottom = "1px solid #334155";
        div.style.color = item.result === "Won" ? "#4ade80" : item.result === "Lost" ? "#f43f5e" : "#e2e8f0";
        div.innerHTML = `<span><strong>${item.result}</strong> (${item.date})</span> <span>${item.details}</span>`;
        container.appendChild(div);
    });
}

// Visual Theme Store Rendering Setup
function updateStoreUI() {
    const activeTheme = localStorage.getItem("selectedTheme") || "classic";
    
    const themeButtons = {
        'classic': document.querySelector("button[onclick*='classic']"),
        'neon': document.querySelector("button[onclick*='neon']"),
        'gold': document.querySelector("button[onclick*='gold']"),
        'space': document.querySelector("button[onclick*='space']")
    };

    Object.keys(themeButtons).forEach(themeKey => {
        const btn = themeButtons[themeKey];
        if (!btn) return;

        if (themeKey === activeTheme) {
            btn.innerHTML = `${themeKey.toUpperCase()} (Equipped)`;
            btn.style.opacity = "0.5";
            btn.style.cursor = "not-allowed";
            btn.setAttribute("disabled", "true");
        } else if (ownedThemes.includes(themeKey)) {
            btn.innerHTML = `Equip ${themeKey.toUpperCase()}`;
            btn.style.opacity = "1";
            btn.style.cursor = "pointer";
            btn.removeAttribute("disabled");
        } else {
            if (themeKey === 'classic') btn.innerHTML = "Classic (Free)";
            if (themeKey === 'neon') btn.innerHTML = "Neon (100 🪙)";
            if (themeKey === 'gold') btn.innerHTML = "Gold (250 🪙)";
            if (themeKey === 'space') btn.innerHTML = "Space (500 🪙)";
            
            btn.style.opacity = "1";
            btn.style.cursor = "pointer";
            btn.removeAttribute("disabled");
        }
    });
}

function isBoardFull() {
    return board[0].every(cell => cell !== null);
}

function checkWinner(player) {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS - 3; col++) {
            if (board[row][col] === player && board[row][col+1] === player && board[row][col+2] === player && board[row][col+3] === player) return true;
        }
    }
    for (let row = 0; row < ROWS - 3; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col] === player && board[row+1][col] === player && board[row+2][col] === player && board[row+3][col] === player) return true;
        }
    }
    for (let row = 0; row < ROWS - 3; row++) {
        for (let col = 0; col < COLS - 3; col++) {
            if (board[row][col] === player && board[row+1][col+1] === player && board[row+2][col+2] === player && board[row+3][col+3] === player) return true;
        }
    }
    for (let row = 3; row < ROWS; row++) {
        for (let col = 0; col < COLS - 3; col++) {
            if (board[row][col] === player && board[row-1][col+1] === player && board[row-2][col+2] === player && board[row-3][col+3] === player) return true;
        }
    }
    return false;
}

function getWinningMove(player) {
    for (let col = 0; col < COLS; col++) {
        for (let row = ROWS - 1; row >= 0; row--) {
            if (board[row][col] === null) {
                board[row][col] = player;
                if (checkWinner(player)) {
                    board[row][col] = null;
                    return col;
                }
                board[row][col] = null;
                break;
            }
        }
    }
    return null;
}

// Theme Equipping and Purchase Processing Engine
window.buyTheme = function(themeName, price) {
    if (ownedThemes.includes(themeName)) {
        playSound('click');
        localStorage.setItem("selectedTheme", themeName);
        applyThemeToBoard(themeName);
        updateStoreUI();
        showSnackbar(`🎨 Equipped ${themeName.toUpperCase()} Theme!`);
        return; 
    }

    if (coins >= price) {
        playSound('coin'); 
        if (price > 0) {
            coins -= price; 
            updateStats(); 
            
            const coinsEl = document.getElementById("coins");
            if (coinsEl) coinsEl.textContent = coins;
        }
        
        ownedThemes.push(themeName);
        localStorage.setItem("ownedThemes", JSON.stringify(ownedThemes));

        localStorage.setItem("selectedTheme", themeName);
        applyThemeToBoard(themeName);
        updateStoreUI(); 
        
        showSnackbar(`🎉 ${themeName.toUpperCase()} Theme Purchased & Applied!`);
    } else {
        showSnackbar("⚠️ Not Enough Coins, Machan!");
    }
}

function applyThemeToBoard(themeName) {
    const boardElement = document.getElementById("board");
    if (boardElement) {
        boardElement.classList.remove("classic", "neon", "gold", "space");
        boardElement.classList.add(themeName);
    }
    document.body.className = `current-theme-${themeName}`;
}

// Inline Snackbar Injection Engine
function showSnackbar(message) {
    const oldToast = document.querySelector('.game-snackbar');
    if (oldToast) oldToast.remove();

    const snackbar = document.createElement('div');
    snackbar.className = 'game-snackbar';
    snackbar.innerText = message;
    
    Object.assign(snackbar.style, {
        position: 'fixed',
        bottom: '25px',
        left: '50%',
        transform: 'translateX(-50%) translateY(100px) scale(0.9)',
        backgroundColor: '#1e293b',
        color: '#ffffff',
        padding: '14px 20px',
        borderRadius: '16px',
        boxShadow: '0 6px 0 #000000, 0 10px 20px rgba(0, 0, 0, 0.4)',
        fontSize: '15px',
        fontFamily: 'sans-serif',
        fontWeight: '800',
        zIndex: '999999',
        width: '85%',
        maxWidth: '340px',
        textAlign: 'center',
        opacity: '0',
        border: '3px solid #663914',
        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease'
    });

    document.body.appendChild(snackbar);

    setTimeout(() => { 
        snackbar.style.transform = 'translateX(-50%) translateY(0) scale(1)';
        snackbar.style.opacity = '1';
    }, 50);

    setTimeout(() => {
        snackbar.style.transform = 'translateX(-50%) translateY(100px) scale(0.9)';
        snackbar.style.opacity = '0';
        setTimeout(() => { snackbar.remove(); }, 400);
    }, 3000);
}

// Core App Initialization Hook Sets
window.addEventListener("DOMContentLoaded", () => {
    updateStats();
    const savedTheme = localStorage.getItem("selectedTheme") || "classic";
    applyThemeToBoard(savedTheme);
    createBoardUI();
    updateStoreUI(); 

    // Global click listener to catch the very first click on document to kickstart background track safely
    document.addEventListener('click', startBGM, { once: true });
});