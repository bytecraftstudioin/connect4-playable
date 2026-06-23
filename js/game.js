const ROWS = 6;
const COLS = 7;

const boardElement = document.getElementById("board");
let currentPlayer = "player";
let board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

// UI Elements
const dropdownTrigger = document.getElementById("dropdownTrigger");
const dropdownOptions = document.getElementById("dropdownOptions");
const selectedText = document.getElementById("selectedDifficultyText");

// CUSTOM DROPDOWN STATE CORE
let selectedDifficultyValue = "easy"; 

// --- FULLY OPTIMIZED AUDIO TRACK MATRIX ---
const sounds = {
    drop: new Audio('assets/sounds/disc_drop.mp3'),
    click: new Audio('assets/sounds/ui_click.mp3'),
    coin: new Audio('assets/sounds/coin_collect.mp3'),
    win: new Audio('assets/sounds/game_win.mp3'),
    lose: new Audio('assets/sounds/game_lose.mp3'),
    bgm: new Audio('assets/sounds/home_theme.mp3') 
};

// Global Autoplay Configuration Settings
sounds.bgm.loop = true;  
sounds.bgm.volume = 0.20; 

let isBgmPlaying = false;

// Dynamic Interaction Fallback Trigger
function playSound(type) {
    if (sounds[type]) {
        try {
            sounds[type].currentTime = 0; 
            sounds[type].volume = 0.5;    
            let playPromise = sounds[type].play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log(`Audio system blocked track: ${type}. Needs user gesture.`);
                });
            }
        } catch (e) {
            console.log("Audio crash fallback", e);
        }
    }
}

// BGM Initializing Engine
function startBGM() {
    if (!isBgmPlaying) {
        sounds.bgm.play()
            .then(() => { 
                isBgmPlaying = true; 
            })
            .catch(e => console.log("BGM autoplay waiting for active interaction tap"));
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
let ownedThemes = JSON.parse(localStorage.getItem("ownedThemes")) || ["classic"];

const coinsEl = document.getElementById("coins");
const winsEl = document.getElementById("wins");
const gamesEl = document.getElementById("games");

// Daily Reward Elements
const dailyPopup = document.getElementById("daily-popup");
const closeDailyBtn = document.getElementById("closeDailyBtn");
const claimRewardBtn = document.getElementById("claimRewardBtn");

let lastClaimDate = localStorage.getItem("lastClaimDate") || null;
let currentStreak = Number(localStorage.getItem("currentStreak")) || 0; 

// Open Daily Reward Popup
if (dailyBtn) {
    dailyBtn.addEventListener("click", () => {
        startBGM(); 
        playSound('click');
        checkStreakValidity(); 
        updateDailyUI();
        dailyPopup.classList.remove("hidden");
    });
}

if (closeDailyBtn) {
    closeDailyBtn.addEventListener("click", () => {
        playSound('click');
        dailyPopup.classList.add("hidden");
    });
}

// Main Claim Logic
if (claimRewardBtn) {
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
}

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

    if (claimRewardBtn) {
        if (availableToClaim) {
            claimRewardBtn.removeAttribute("disabled");
            claimRewardBtn.textContent = `Claim Day ${nextDayToClaim} Bonus!`;
        } else {
            claimRewardBtn.setAttribute("disabled", "true");
            claimRewardBtn.textContent = "Come Back Tomorrow!";
        }
    }
}

// Navigation Triggers
if (playBtn) {
    playBtn.addEventListener("click", () => {
        startBGM(); 
        playSound('click');
        resetGameData();
        homeScreen.classList.add("hidden");
        gameScreen.classList.remove("hidden");
        updateTurnUI();
    });
}

const backBtn = document.getElementById("backBtn");
if (backBtn) {
    backBtn.addEventListener("click", () => {
        playSound('click');
        gameScreen.classList.add("hidden");
        homeScreen.classList.remove("hidden");
    });
}

if (storeBtn) {
    storeBtn.addEventListener("click", () => {
        startBGM(); 
        playSound('click');
        updateStoreUI(); 
        storePopup.classList.remove("hidden");
    });
}

if (closeStoreBtn) {
    closeStoreBtn.addEventListener("click", () => {
        playSound('click');
        storePopup.classList.add("hidden");
    });
}

if (statsBtn) {
    statsBtn.addEventListener("click", () => {
        startBGM(); 
        playSound('click');
        renderHistory();
        statsPopup.classList.remove("hidden");
    });
}

if (closeStatsBtn) {
    closeStatsBtn.addEventListener("click", () => {
        playSound('click');
        statsPopup.classList.add("hidden");
    });
}

if (restartBtn) {
    restartBtn.addEventListener("click", () => {
        playSound('click');
        popup.classList.add("hidden");
        resetGameData();
    });
}

function resetGameData() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    boardElement.innerHTML = "";
    createBoardUI();
    currentPlayer = "player";
    updateTurnUI();
}

function updateStats() {
    if (coinsEl) coinsEl.textContent = coins;
    if (winsEl) winsEl.textContent = wins;
    if (gamesEl) gamesEl.textContent = games;
    localStorage.setItem("coins", coins);
    localStorage.setItem("wins", wins);
    localStorage.setItem("games", games);
    localStorage.setItem("matchHistory", JSON.stringify(matchHistory));
    localStorage.setItem("ownedThemes", JSON.stringify(ownedThemes)); 
}

function updateTurnUI() {
    if (!turnIndicator) return;
    if (currentPlayer === "player") {
        turnIndicator.textContent = "Your Turn 🔴";
        turnIndicator.className = "player-turn";
    } else {
        turnIndicator.textContent = "AI Thinking... 🤖🟡";
        turnIndicator.className = "ai-turn";
    }
}

function createBoardUI() {
    if (!boardElement) return;
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

function aiMove() {
    const difficulty = selectedDifficultyValue; 
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
        if (popupTitle) popupTitle.className = "win-header-banner"; 
        if (popupActionBtn) popupActionBtn.textContent = "PLAY AGAIN";
        
        // 🔥 FIX: Trigger Game Win Sound explicitly here!
        playSound('win'); 
    } else if (outcome === "ai") {
        statusText = "🤖 AI WINS!";
        matchHistory.unshift({ result: "Lost", details: "VS AI", date: new Date().toLocaleDateString() });
        if (popupRewardBody) popupRewardBody.style.display = "none"; 
        if (popupTitle) popupTitle.className = "reward-ribbon win-header-banner"; 
        if (popupActionBtn) popupActionBtn.textContent = "TRY AGAIN?";
        
        // 🔥 FIX: Trigger Game Lose Sound explicitly here!
        playSound('lose'); 
    } else {
        statusText = "🤝 DRAW!";
        matchHistory.unshift({ result: "Draw", details: "Tie Game", date: new Date().toLocaleDateString() });
        if (popupRewardBody) popupRewardBody.style.display = "none"; 
        if (popupTitle) popupTitle.className = "reward-ribbon blue-ribbon win-header-banner"; 
        if (popupActionBtn) popupActionBtn.textContent = "NEW GAME";
        playSound('click'); 
    }

    if (matchHistory.length > 5) matchHistory.pop(); 
    updateStats();
    if (popupTitle) popupTitle.textContent = statusText;
    if (popup) popup.classList.remove("hidden");
}

function renderHistory() {
    const container = document.getElementById("history-list");
    if (!container) return;
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
        // 🔥 FIX: Trigger Coin Collect sound on successful theme unlock!
        playSound('coin'); 
        if (price > 0) {
            coins -= price; 
            updateStats(); 
        }
        ownedThemes.push(themeName);
        localStorage.setItem("ownedThemes", JSON.stringify(ownedThemes));
        localStorage.setItem("selectedTheme", themeName);
        applyThemeToBoard(themeName);
        updateStoreUI(); 
        showSnackbar(`🎉 ${themeName.toUpperCase()} Theme Purchased!`);
    } else {
        playSound('click'); // Reject click audio setup
        showSnackbar("⚠️ Not Enough Coins, Machan!");
    }
}

function applyThemeToBoard(themeName) {
    const boardElement = document.getElementById("board");
    if (boardElement) {
        boardElement.className = "board " + themeName;
    }
    document.body.className = `current-theme-${themeName}`;
}

// Optimized JavaScript Function to Sync perfectly with your Premium CSS Snackbar System
function showSnackbar(message) {
    // 1. Unakku munaadiyedhavadhu old toast screen ulla irundha adha clear panrom
    const oldToast = document.querySelector('.game-snackbar');
    if (oldToast) oldToast.remove();
    
    // 2. Dynamic ah oru div create panni un class name ah bind panrom
    const snackbar = document.createElement('div');
    snackbar.className = 'game-snackbar';
    snackbar.innerText = message;
    
    document.body.appendChild(snackbar);
    
    // 3. Un CSS rule kulla irukura bounce animation trigger panna '.show' class ah inject panrom!
    setTimeout(() => { 
        snackbar.classList.add('show');
    }, 50);
    
    // 4. Correct-ah 3 seconds kalichu automatic ah slide down panni destroy panni thalliduvom
    setTimeout(() => {
        snackbar.classList.remove('show');
        setTimeout(() => { snackbar.remove(); }, 400); // Wait for your CSS ease-transition to finish
    }, 3000);
}

// Core Initialization Hook Sets
window.addEventListener("DOMContentLoaded", () => {
    updateStats();
    const savedTheme = localStorage.getItem("selectedTheme") || "classic";
    applyThemeToBoard(savedTheme);
    createBoardUI();
    updateStoreUI(); 

    // Safe Interaction BGM activation logic code
    const forceBGMPlay = () => {
        startBGM();
        document.removeEventListener('click', forceBGMPlay);
        document.removeEventListener('touchstart', forceBGMPlay);
    };
    document.addEventListener('click', forceBGMPlay);
    document.addEventListener('touchstart', forceBGMPlay);

    // Dropdown handling hook safe configuration
    if (dropdownTrigger && dropdownOptions) {
        dropdownTrigger.addEventListener("click", (e) => {
            e.stopPropagation();
            playSound('click');
            dropdownOptions.classList.toggle("hidden");
        });

        document.querySelectorAll(".dropdown-option").forEach(option => {
            option.addEventListener("click", (e) => {
                const val = e.target.getAttribute("data-value");
                selectedText.textContent = e.target.textContent;
                selectedDifficultyValue = val; 
                dropdownOptions.classList.add("hidden");
                playSound('click');
            });
        });

        document.addEventListener("click", () => {
            dropdownOptions.classList.add("hidden");
        });
    }
});