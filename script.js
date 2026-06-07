// DOM elements
const boardContainer = document.getElementById('boardGrid');
const statusDiv = document.getElementById('gameStatus');
const resetBtn = document.getElementById('resetGameBtn');
const twoPlayerBtn = document.getElementById('twoPlayerModeBtn');
const aiModeBtn = document.getElementById('aiModeBtn');

// Game State
let board = Array(9).fill(null);
let currentPlayer = 'X';
let gameActive = true;
let gameMode = 'ai';
let winnerInfo = null;

// Winning combinations
const winPatterns = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
];

// Render the board
function renderBoard() {
    boardContainer.innerHTML = '';
    for (let i = 0; i < board.length; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        const mark = board[i];
        if (mark) {
            cell.textContent = mark;
            cell.setAttribute('data-value', mark);
        } else {
            cell.textContent = '';
            cell.removeAttribute('data-value');
        }
        
        if (winnerInfo && winnerInfo.winCombo && winnerInfo.winCombo.includes(i)) {
            cell.classList.add('won-cell');
        }
        
        if (!gameActive || board[i] !== null || winnerInfo !== null) {
            cell.classList.add('disabled');
        }
        
        cell.addEventListener('click', (function(idx) {
            return function() { handleCellClick(idx); };
        })(i));
        boardContainer.appendChild(cell);
    }
}

// Update status message
function updateStatusMessage() {
    if (!gameActive) {
        if (winnerInfo && winnerInfo.winner) {
            statusDiv.innerHTML = `🏆 ${winnerInfo.winner} WINS! 🏆`;
        } else {
            statusDiv.innerHTML = `⟳ DEADLOCK · TIE GAME ⟳`;
        }
        return;
    }
    
    if (gameMode === 'twoPlayer') {
        statusDiv.innerHTML = `⚡ PLAYER ${currentPlayer}'S TURN ⚡`;
    } else {
        if (currentPlayer === 'X') {
            statusDiv.innerHTML = `🎯 YOUR TURN (X) · CLICK A CELL 🎯`;
        } else {
            statusDiv.innerHTML = `🧠 AI TURN (O) · THINKING 🧠`;
        }
    }
}

// Check win/draw
function checkGameState() {
    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            gameActive = false;
            winnerInfo = { winner: board[a], winCombo: pattern };
            renderBoard();
            updateStatusMessage();
            return true;
        }
    }
    
    const isDraw = board.every(cell => cell !== null);
    if (isDraw) {
        gameActive = false;
        winnerInfo = null;
        renderBoard();
        updateStatusMessage();
        return true;
    }
    return false;
}

// Switch player
function switchPlayer() {
    if (!gameActive) return;
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatusMessage();
    renderBoard();
    
    if (gameMode === 'ai' && gameActive && currentPlayer === 'O') {
        setTimeout(() => {
            if (gameActive && gameMode === 'ai' && currentPlayer === 'O') {
                makeAIMove();
            }
        }, 200);
    }
}

// Make a move
function makeMove(index, playerSymbol) {
    if (!gameActive) return false;
    if (board[index] !== null) return false;
    if (currentPlayer !== playerSymbol) return false;
    
    board[index] = playerSymbol;
    renderBoard();
    
    const ended = checkGameState();
    if (ended) return true;
    switchPlayer();
    return true;
}

// Minimax AI
function minimax(boardArr, depth, isMaximizing, aiSym, humanSym) {
    let score = evaluateBoard(boardArr, aiSym, humanSym);
    if (score === 10) return score - depth;
    if (score === -10) return score + depth;
    if (isBoardFull(boardArr)) return 0;
    
    if (isMaximizing) {
        let best = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (boardArr[i] === null) {
                boardArr[i] = aiSym;
                let val = minimax(boardArr, depth + 1, false, aiSym, humanSym);
                boardArr[i] = null;
                best = Math.max(best, val);
            }
        }
        return best;
    } else {
        let best = Infinity;
        for (let i = 0; i < 9; i++) {
            if (boardArr[i] === null) {
                boardArr[i] = humanSym;
                let val = minimax(boardArr, depth + 1, true, aiSym, humanSym);
                boardArr[i] = null;
                best = Math.min(best, val);
            }
        }
        return best;
    }
}

function evaluateBoard(boardArr, aiSym, humanSym) {
    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (boardArr[a] && boardArr[a] === boardArr[b] && boardArr[a] === boardArr[c]) {
            if (boardArr[a] === aiSym) return 10;
            if (boardArr[a] === humanSym) return -10;
        }
    }
    return 0;
}

function isBoardFull(boardArr) {
    return boardArr.every(cell => cell !== null);
}

function getBestAIMove() {
    let bestScore = -Infinity;
    let bestMove = -1;
    let tempBoard = [...board];
    const aiSymbol = 'O';
    const humanSymbol = 'X';
    
    for (let i = 0; i < 9; i++) {
        if (tempBoard[i] === null) {
            tempBoard[i] = aiSymbol;
            let moveScore = minimax(tempBoard, 0, false, aiSymbol, humanSymbol);
            tempBoard[i] = null;
            if (moveScore > bestScore) {
                bestScore = moveScore;
                bestMove = i;
            }
        }
    }
    
    if (bestMove === -1) {
        for (let i = 0; i < 9; i++) {
            if (board[i] === null) {
                bestMove = i;
                break;
            }
        }
    }
    return bestMove;
}

function makeAIMove() {
    if (!gameActive) return;
    if (gameMode !== 'ai') return;
    if (currentPlayer !== 'O') return;
    if (!board.some(cell => cell === null)) return;
    
    const aiIndex = getBestAIMove();
    if (aiIndex !== -1 && board[aiIndex] === null && gameActive && currentPlayer === 'O') {
        makeMove(aiIndex, 'O');
    }
}

// Handle cell clicks
function handleCellClick(index) {
    if (!gameActive) return;
    if (board[index] !== null) return;
    if (winnerInfo !== null) return;
    
    if (gameMode === 'twoPlayer') {
        makeMove(index, currentPlayer);
    } else if (gameMode === 'ai') {
        if (currentPlayer === 'X') {
            makeMove(index, 'X');
        } else {
            statusDiv.innerHTML = `🤖 AI · THINKING 🤖`;
            setTimeout(() => updateStatusMessage(), 700);
        }
    }
}

// RESET FUNCTION - WORKS PERFECTLY
function resetGame() {
    board = Array(9).fill(null);
    currentPlayer = 'X';
    gameActive = true;
    winnerInfo = null;
    renderBoard();
    updateStatusMessage();
}

// Set game mode
function setGameMode(mode) {
    gameMode = mode;
    resetGame();
    if (mode === 'twoPlayer') {
        twoPlayerBtn.classList.add('active');
        aiModeBtn.classList.remove('active');
        statusDiv.innerHTML = "🎮 DUEL MODE · X STARTS 🎮";
    } else {
        aiModeBtn.classList.add('active');
        twoPlayerBtn.classList.remove('active');
        statusDiv.innerHTML = "🧠 AI MODE · YOU ARE X 🧠";
    }
    setTimeout(() => updateStatusMessage(), 1000);
}

// Event listeners
twoPlayerBtn.addEventListener('click', () => {
    if (gameMode === 'twoPlayer') return;
    setGameMode('twoPlayer');
});

aiModeBtn.addEventListener('click', () => {
    if (gameMode === 'ai') return;
    setGameMode('ai');
});

// RESTART BUTTON EVENT - 100% WORKING
resetBtn.addEventListener('click', resetGame);

// Initialize game
function init() {
    board = Array(9).fill(null);
    currentPlayer = 'X';
    gameActive = true;
    winnerInfo = null;
    gameMode = 'ai';
    twoPlayerBtn.classList.remove('active');
    aiModeBtn.classList.add('active');
    renderBoard();
    updateStatusMessage();
    statusDiv.innerHTML = "🧠 AI MODE · YOU ARE X 🧠";
}

init();