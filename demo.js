// Score counter
let score = 0;
const scoreDisplay = document.getElementById('score');
let isPoweredOn = false;
let waitingForStart = false;
let pacmanMouthInterval = null;
let isPacmanOpen = true;
let guessCount = 0;
const maxRowsPerColumn = 4;
const maxTotalRows = 7;
let currentGuessDisplay = null;
let currentColumn = null;
let columns = [];
let secretNumber = '';
let gameWon = false;
let lives = 7;

// AI Mode variables
let gameMode = 'YOU'; // 'YOU' or 'AI'
let userSecretNumber = '';
let aiPossibleNumbers = [];
let aiGuessCount = 0;
let aiGameWon = false;

// Generate a random 3-digit number with no repeated digits
function generateSecretNumber() {
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9]; // 0 is forbidden
    const number = [];
    for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * digits.length);
        number.push(digits[randomIndex]);
        digits.splice(randomIndex, 1);
    }
    return number.join('');
}

// Generate all possible 3-digit numbers (1-9, no 0, no repeats)
function generateAllPossibleNumbers() {
    const numbers = [];
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    for (let i = 0; i < digits.length; i++) {
        for (let j = 0; j < digits.length; j++) {
            if (j === i) continue;
            for (let k = 0; k < digits.length; k++) {
                if (k === i || k === j) continue;
                numbers.push(`${digits[i]}${digits[j]}${digits[k]}`);
            }
        }
    }
    return numbers;
}

// Calculate bulls and cows for AI mode (same logic but with feedback)
function calculateBullsAndCowsForNumber(guess, target) {
    let bulls = 0;
    let cows = 0;
    const guessDigits = guess.split('');
    const targetDigits = target.split('');
    const guessCopy = [...guessDigits];
    const targetCopy = [...targetDigits];
    
    // First pass: Check for bulls
    for (let i = 0; i < 3; i++) {
        if (guessCopy[i] === targetCopy[i]) {
            bulls++;
            guessCopy[i] = 'X';
            targetCopy[i] = 'X';
        }
    }
    
    // Second pass: Check for cows
    for (let i = 0; i < 3; i++) {
        if (guessCopy[i] !== 'X') {
            const index = targetCopy.indexOf(guessCopy[i]);
            if (index !== -1 && targetCopy[index] !== 'X') {
                cows++;
                targetCopy[index] = 'X';
            }
        }
    }
    
    return { bulls, cows };
}

// Filter possible numbers based on feedback
function filterPossibleNumbers(guess, bulls, cows, possibleNumbers) {
    return possibleNumbers.filter(num => {
        const result = calculateBullsAndCowsForNumber(guess, num);
        return result.bulls === bulls && result.cows === cows;
    });
}

// AI makes a guess
function aiMakeGuess() {
    if (aiPossibleNumbers.length === 0) {
        showGameMessage('NO VALID NUMBERS LEFT!', '');
        return null;
    }
    
    // Pick a random number from possible numbers
    const randomIndex = Math.floor(Math.random() * aiPossibleNumbers.length);
    return aiPossibleNumbers[randomIndex];
}


// Update AI mode UI
function updateAIModeUI() {
    const guessSection = document.getElementById('guessSection');
    const aiModeSection = document.getElementById('aiModeSection');
    const gameContent = document.getElementById('gameContent');
    
    if (gameMode === 'AI') {
        guessSection.style.display = 'none';
        aiModeSection.style.display = 'flex';
        gameContent.classList.add('ai-mode');
    } else {
        guessSection.style.display = 'flex';
        aiModeSection.style.display = 'none';
        gameContent.classList.remove('ai-mode');
    }
}

// Reset AI game
function resetAIGame() {
    userSecretNumber = '';
    aiPossibleNumbers = generateAllPossibleNumbers();
    aiGuessCount = 0;
    aiGameWon = false;
    document.getElementById('secretNumberInput').value = '';
    document.getElementById('secretInputSection').style.display = 'flex';
    document.getElementById('feedbackSection').style.display = 'none';
    document.getElementById('aiGuessDisplay').textContent = '---';
    document.getElementById('bullsInput').value = '0';
    document.getElementById('cowsInput').value = '0';
    const gameArea = document.getElementById('gameArea');
    gameArea.innerHTML = '';
    currentGuessDisplay = null;
    currentColumn = null;
    columns = [];
    if (guessInput) {
        guessInput.value = '';
        updateCurrentGuessDisplay('');
    }
}

// AI makes next guess
function aiMakeNextGuess() {
    if (aiGameWon) return;
    
    const guess = aiMakeGuess();
    if (!guess) {
        showGameMessage('NO VALID NUMBERS LEFT!', '');
        return;
    }
    
    document.getElementById('aiGuessDisplay').textContent = guess;
    
    // Display AI guess in game area
    const guessContainer = createGuessContainer(guess);
    if (!guessContainer) {
        showGameMessage('MAX ROWS REACHED!', '');
        return;
    }
    const placeholders = guessContainer.querySelectorAll('.number-placeholder');
    for (let i = 0; i < 3; i++) {
        placeholders[i].textContent = guess[i];
        placeholders[i].classList.add('filled');
    }
    
    aiGuessCount++;
}

// Calculate bulls and cows for a guess
function calculateBullsAndCows(guess) {
    let bulls = 0;
    let cows = 0;
    const guessDigits = guess.split('');
    const secretDigits = secretNumber.split('');
    const guessCopy = [...guessDigits];
    const secretCopy = [...secretDigits];
    
    for (let i = 0; i < 3; i++) {
        if (guessCopy[i] === secretCopy[i]) {
            bulls++;
            guessCopy[i] = 'X';
            secretCopy[i] = 'X';
        }
    }
    
    for (let i = 0; i < 3; i++) {
        if (guessCopy[i] !== 'X') {
            const index = secretCopy.indexOf(guessCopy[i]);
            if (index !== -1 && secretCopy[index] !== 'X') {
                cows++;
                secretCopy[index] = 'X';
            }
        }
    }
    
    return { bulls, cows };
}

// Update lives display
function updateLives() {
    const hearts = document.querySelectorAll('.heart');
    hearts.forEach((heart, index) => {
        if (index < lives) {
            heart.classList.remove('hidden');
        } else {
            heart.classList.add('hidden');
        }
    });
}

// Show game message with digits on separate lines
function showGameMessage(title, secretNumber) {
    const gameMessage = document.getElementById('gameMessage');
    const gameMessageTitle = document.getElementById('gameMessageTitle');
    const gameMessageDigits = document.getElementById('gameMessageDigits');
    
    gameMessageTitle.textContent = title;
    gameMessageDigits.innerHTML = '';
    
    // Add each digit on a separate line
    const digits = secretNumber.split('');
    digits.forEach(digit => {
        const digitDiv = document.createElement('div');
        digitDiv.className = 'game-message-digit';
        digitDiv.textContent = digit;
        gameMessageDigits.appendChild(digitDiv);
    });
    
    gameMessage.classList.add('visible');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        gameMessage.classList.remove('visible');
    }, 5000);
}

// Update score display with leading zeros
function updateScore() {
    scoreDisplay.textContent = String(score).padStart(4, '0');
}

// Get total number of rows across all columns
function getTotalRows() {
    let total = 0;
    columns.forEach(column => {
        total += column.querySelectorAll('.guess-container').length;
    });
    return total;
}

// Get or create current column
function getCurrentColumn() {
    // Check if current column is full (has 4 rows/containers) and we haven't reached max total rows
    const totalRows = getTotalRows();
    if (totalRows >= maxTotalRows) {
        // Reached max total rows, return null to prevent creating new containers
        return null;
    }
    
    if (!currentColumn || currentColumn.querySelectorAll('.guess-container').length >= maxRowsPerColumn) {
        // Create new column on the right
        const gameArea = document.getElementById('gameArea');
        const column = document.createElement('div');
        column.className = 'guess-column';
        gameArea.appendChild(column);
        columns.push(column);
        currentColumn = column;
    }
    return currentColumn;
}

// Create a new guess container
function createGuessContainer(guess) {
    // Check if we've reached max total rows
    if (getTotalRows() >= maxTotalRows) {
        console.log('Maximum total rows (7) reached!');
        return null;
    }
    
    const column = getCurrentColumn();
    if (!column) {
        // Can't create container - max rows reached
        return null;
    }
    
    // Create container
    const container = document.createElement('div');
    container.className = 'guess-container';
    
    // Create bulls-cows-display
    const display = document.createElement('div');
    display.className = 'bulls-cows-display';
    
    const digitsWrapper = document.createElement('div');
    digitsWrapper.className = 'guess-digits';
    
    for (let i = 0; i < 3; i++) {
        const placeholder = document.createElement('div');
        placeholder.className = 'number-placeholder';
        if (guess && i < guess.length) {
            placeholder.textContent = guess[i];
            placeholder.classList.add('filled');
        } else {
            placeholder.textContent = '-';
        }
        digitsWrapper.appendChild(placeholder);
    }
    
    const feedbackWrapper = document.createElement('div');
    feedbackWrapper.className = 'feedback-icons';
    
    display.appendChild(digitsWrapper);
    display.appendChild(feedbackWrapper);
    container.appendChild(display);
    column.appendChild(container);
    
    return display;
}

// Update feedback symbols (+/-) for bulls and cows
function updateFeedbackSymbols(display, bulls, cows) {
    const feedback = display.querySelector('.feedback-icons');
    if (!feedback) return;
    feedback.innerHTML = '';
    
    if (bulls === 0 && cows === 0) {
        const dot = document.createElement('span');
        dot.className = 'feedback-symbol none';
        dot.textContent = '•';
        feedback.appendChild(dot);
        return;
    }
    
    for (let i = 0; i < bulls; i++) {
        const plus = document.createElement('span');
        plus.className = 'feedback-symbol plus';
        plus.textContent = '+';
        feedback.appendChild(plus);
    }
    
    for (let i = 0; i < cows; i++) {
        const minus = document.createElement('span');
        minus.className = 'feedback-symbol minus';
        minus.textContent = '-';
        feedback.appendChild(minus);
    }
}

// Helpers for guess input handling
function sanitizeGuessValue(value) {
    let result = '';
    const digits = value.replace(/[^1-9]/g, '');
    for (const digit of digits) {
        if (!result.includes(digit)) {
            result += digit;
            if (result.length === 3) break;
        }
    }
    return result;
}

function updateCurrentGuessDisplay(value) {
    if (getTotalRows() >= maxTotalRows && !currentGuessDisplay) {
        return;
    }
    
    if (!currentGuessDisplay) {
        const sanitizedValue = sanitizeGuessValue(value);
        if (!sanitizedValue.length) {
            return;
        }
        currentGuessDisplay = createGuessContainer('');
        if (!currentGuessDisplay) {
            return;
        }
        const placeholders = currentGuessDisplay.querySelectorAll('.number-placeholder');
        placeholders.forEach(placeholder => {
            placeholder.textContent = '-';
            placeholder.classList.remove('filled');
        });
    }
    
    const sanitized = sanitizeGuessValue(value);
    const placeholders = currentGuessDisplay.querySelectorAll('.number-placeholder');
    placeholders.forEach((placeholder, index) => {
        const digit = sanitized[index];
        if (digit) {
            placeholder.textContent = digit;
            placeholder.classList.add('filled');
        } else {
            placeholder.textContent = '-';
            placeholder.classList.remove('filled');
        }
    });
    
    if (guessInput) {
        guessInput.value = sanitized;
    }
}

const guessInput = document.getElementById('guessInput');

function buildGuessFromInput(inputValue) {
    return sanitizeGuessValue(inputValue);
}

guessInput.addEventListener('input', function() {
    const sanitized = sanitizeGuessValue(this.value);
    this.value = sanitized;
    updateCurrentGuessDisplay(sanitized);
});

function addDigitToGuessInput(digit) {
    if (!guessInput) return;
    if (!/^[1-9]$/.test(digit)) return;
    let current = sanitizeGuessValue(guessInput.value);
    if (current.includes(digit) || current.length >= 3) return;
    current += digit;
    guessInput.value = current;
    updateCurrentGuessDisplay(current);
}

function removeLastDigitFromGuessInput() {
    if (!guessInput) return;
    let current = sanitizeGuessValue(guessInput.value);
    if (!current.length) return;
    current = current.slice(0, -1);
    guessInput.value = current;
    updateCurrentGuessDisplay(current);
}

function submitCurrentGuess() {
    if (!guessInput || waitingForStart) return;
    let guess = sanitizeGuessValue(guessInput.value);
    
    if (!(guess && guess.length === 3 && !gameWon && lives > 0)) {
        return;
    }
    
    if (getTotalRows() >= maxTotalRows && !currentGuessDisplay) {
        console.log('Maximum total rows (7) reached! Cannot submit more guesses.');
        return;
    }
    
    if (guess.includes('0')) {
        showGameMessage('0 IS FORBIDDEN!', '');
        return;
    }
    
    const uniqueDigits = new Set(guess.split(''));
    if (uniqueDigits.size !== 3) {
        showGameMessage('EACH DIGIT MUST BE DIFFERENT!', '');
        return;
    }
    
    if (!currentGuessDisplay) {
        currentGuessDisplay = createGuessContainer('');
        if (!currentGuessDisplay) return;
    }
    
    const placeholders = currentGuessDisplay.querySelectorAll('.number-placeholder');
    for (let i = 0; i < 3; i++) {
        placeholders[i].textContent = guess[i];
        placeholders[i].classList.add('filled');
    }
    
    const { bulls, cows } = calculateBullsAndCows(guess);
    updateFeedbackSymbols(currentGuessDisplay, bulls, cows);
    
    if (bulls === 3) {
        gameWon = true;
        showGameMessage('YOU WON!', secretNumber);
        score += 100;
        updateScore();
    } else {
        lives--;
        updateLives();
        
        if (lives <= 0) {
            showGameMessage('GAME OVER', secretNumber);
        }
    }
    
    guessCount++;
    currentGuessDisplay = null;
    guessInput.value = '';
    
    if (!gameWon && lives > 0 && getTotalRows() < maxTotalRows) {
        currentGuessDisplay = createGuessContainer('');
        updateCurrentGuessDisplay('');
    }
}

guessInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        submitCurrentGuess();
    }
});

// Keypad interactions
document.querySelectorAll('[data-digit]').forEach(button => {
    button.addEventListener('click', () => {
        const digit = button.getAttribute('data-digit');
        if (digit) {
            addDigitToGuessInput(digit);
        }
    });
});

const dpadEnterButton = document.getElementById('dpadEnter');
if (dpadEnterButton) {
    dpadEnterButton.addEventListener('click', submitCurrentGuess);
}

const dpadDeleteButton = document.getElementById('dpadDelete');
if (dpadDeleteButton) {
    dpadDeleteButton.addEventListener('click', removeLastDigitFromGuessInput);
}

// Reset game function
function resetGame() {
    guessCount = 0;
    currentGuessDisplay = null;
    currentColumn = null;
    columns = [];
    gameWon = false;
    lives = 7;
    
    if (gameMode === 'YOU') {
        secretNumber = generateSecretNumber();
        console.log('New game started! Secret number:', secretNumber);
        updateLives();
        const gameArea = document.getElementById('gameArea');
        gameArea.innerHTML = '';
        guessInput.value = '';
        updateCurrentGuessDisplay('');
        // Create first guess container for new game
        if (isPoweredOn && !waitingForStart) {
            currentGuessDisplay = createGuessContainer('');
            updateCurrentGuessDisplay('');
        }
    } else {
        resetAIGame();
        guessInput.value = '';
        updateCurrentGuessDisplay('');
    }
}

// Function to start game in selected mode
function startGameInMode(selectedMode) {
    const pacmanAnimation = document.getElementById('pacmanAnimation');
    const screenContent = document.getElementById('screenContent');
    const gameStartText = document.getElementById('gameStartText');
    const modeSelection = document.getElementById('modeSelection');
    
    // Hide animation, text, and mode selection (replaces screen)
    pacmanAnimation.classList.add('hidden');
    gameStartText.classList.remove('visible');
    modeSelection.classList.add('hidden');
    
    // Show screen content
    screenContent.classList.add('visible');
    
    // Set game mode
    gameMode = selectedMode;
    document.getElementById('modeButton').textContent = gameMode;
    updateAIModeUI();
    waitingForStart = false;
    
    if (gameMode === 'YOU') {
        // Generate secret number and create first guess container
        secretNumber = generateSecretNumber();
        lives = 7;
        gameWon = false;
        updateLives();
        console.log('Game started in YOU mode! Secret number:', secretNumber);
        guessInput.value = '';
        updateCurrentGuessDisplay('');
        
        if (guessCount === 0) {
            currentGuessDisplay = createGuessContainer('');
            updateCurrentGuessDisplay('');
        }
    } else {
        // AI mode - reset and show secret input section
        resetAIGame();
        document.getElementById('secretInputSection').style.display = 'flex';
        document.getElementById('feedbackSection').style.display = 'none';
        console.log('Game started in AI mode!');
        guessInput.value = '';
        updateCurrentGuessDisplay('');
    }
}

// Start button
document.getElementById('startButton').addEventListener('click', function() {
    console.log('Start button pressed', { waitingForStart, isPoweredOn, guessCount });
    
    // If waiting for start after power on, show mode selection menu
    if (waitingForStart && isPoweredOn) {
        const pacmanAnimation = document.getElementById('pacmanAnimation');
        const gameStartText = document.getElementById('gameStartText');
        const modeSelection = document.getElementById('modeSelection');
        const screenContent = document.getElementById('screenContent');
        
        // Hide animation and text
        pacmanAnimation.classList.add('hidden');
        gameStartText.classList.remove('visible');
        
        // Hide screen content and show mode selection menu (replaces screen)
        screenContent.classList.remove('visible');
        modeSelection.classList.remove('hidden');
    } else if (isPoweredOn && !waitingForStart) {
        // Game is running - Start button now resets the game
        if (guessCount > 0 || (gameMode === 'AI' && aiGuessCount > 0)) {
            // Reset all rows and digits
            resetGame();
            console.log('Game reset!');
        } else {
            // If no guesses yet, just increment score (optional behavior)
            score += 5;
            updateScore();
        }
    }
});

// Mode selection buttons
document.getElementById('selectYouMode').addEventListener('click', function() {
    startGameInMode('YOU');
});

document.getElementById('selectAIMode').addEventListener('click', function() {
    startGameInMode('AI');
});

// Power button
document.getElementById('powerButton').addEventListener('click', function() {
    isPoweredOn = !isPoweredOn;
    const powerLight = document.querySelector('.power-light');
    const pacmanAnimation = document.getElementById('pacmanAnimation');
    const screenContent = document.getElementById('screenContent');
    
    if (isPoweredOn) {
        // Turn on power light
        powerLight.classList.add('on');
        
        // Always show animation when turning on
        pacmanAnimation.classList.remove('hidden');
        screenContent.classList.remove('visible');
        
        // Reset and restart animations by cloning the container
        const pacmanContainer = pacmanAnimation.querySelector('.pacman-container');
        const gameStartText = document.getElementById('gameStartText');
        
        // Clone and replace to restart animations
        const newContainer = pacmanContainer.cloneNode(true);
        pacmanContainer.parentNode.replaceChild(newContainer, pacmanContainer);
        
        // Wait a tiny bit for DOM to update, then get the Pacman image element
        setTimeout(() => {
            const pacmanImg = document.querySelector('.pacman img');
            
            if (!pacmanImg) {
                console.error('Pacman image not found!');
                return;
            }
            
            // Start Pacman mouth animation (toggle between open.png and close.png)
            isPacmanOpen = true;
            pacmanImg.src = 'open.png';
            
            // Clear any existing interval
            if (pacmanMouthInterval) {
                clearInterval(pacmanMouthInterval);
                pacmanMouthInterval = null;
            }
            
            // Toggle mouth every 150ms (6-7 times per second for smooth animation)
            // Keep animating continuously until Pacman reaches the end
            pacmanMouthInterval = setInterval(() => {
                const currentImg = document.querySelector('.pacman img');
                if (currentImg) {
                    isPacmanOpen = !isPacmanOpen;
                    currentImg.src = isPacmanOpen ? 'open.png' : 'close.png';
                }
            }, 150);
            
            // Stop mouth animation exactly when Pacman reaches the end (3 seconds)
            // This matches the CSS animation duration: pacmanMove 3s
            setTimeout(() => {
                if (pacmanMouthInterval) {
                    clearInterval(pacmanMouthInterval);
                    pacmanMouthInterval = null;
                }
                // Keep mouth open at the end
                const finalImg = document.querySelector('.pacman img');
                if (finalImg) {
                    finalImg.src = 'open.png';
                    isPacmanOpen = true;
                }
            }, 3000);
        }, 10);
        
        // Reset game start text animation
        gameStartText.style.animation = 'none';
        gameStartText.classList.remove('visible');
        void gameStartText.offsetWidth; // Force reflow
        gameStartText.style.animation = 'gameStartFade 1s ease-in-out 3s forwards';
        
        // After animation completes (3s pacman + 1s text fade = 4s total), show "Press Start to begin"
        setTimeout(() => {
            gameStartText.classList.add('visible');
            waitingForStart = true;
            // Don't show game content yet - wait for Start button press
        }, 4000);
    } else {
        // Turn off power
        powerLight.classList.remove('on');
        screenContent.classList.remove('visible');
        pacmanAnimation.classList.add('hidden');
        waitingForStart = false;
        const gameStartText = document.getElementById('gameStartText');
        gameStartText.classList.remove('visible');
        
        // Stop Pacman mouth animation
        if (pacmanMouthInterval) {
            clearInterval(pacmanMouthInterval);
            pacmanMouthInterval = null;
        }
        
        // Reset game state
        guessCount = 0;
        currentGuessDisplay = null;
        currentColumn = null;
        columns = [];
        gameWon = false;
        lives = 7;
        secretNumber = '';
        updateLives();
        const gameArea = document.getElementById('gameArea');
        gameArea.innerHTML = '';
        guessInput.value = '';
        updateCurrentGuessDisplay('');
        
        // Hide mode selection if visible
        const modeSelection = document.getElementById('modeSelection');
        modeSelection.classList.add('hidden');
    }
});

// Keyboard controls
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        if (document.activeElement !== guessInput || waitingForStart) {
            document.getElementById('startButton').click();
        }
    }
});

// Mode toggle button (only works when game is already running)
document.getElementById('modeButton').addEventListener('click', function() {
    if (!isPoweredOn || waitingForStart) return;
    
    // Show mode selection menu again (replaces screen)
    const modeSelection = document.getElementById('modeSelection');
    const screenContent = document.getElementById('screenContent');
    
    screenContent.classList.remove('visible');
    modeSelection.classList.remove('hidden');
});

// Set secret number button (AI mode)
document.getElementById('setSecretButton').addEventListener('click', function() {
    const secretInput = document.getElementById('secretNumberInput');
    let secret = secretInput.value.trim().replace(/[^1-9]/g, '');
    
    if (secret.length !== 3) {
        showGameMessage('ENTER 3 DIGITS (1-9)!', '');
        return;
    }
    
    // Check for unique digits
    const uniqueDigits = new Set(secret.split(''));
    if (uniqueDigits.size !== 3) {
        showGameMessage('EACH DIGIT MUST BE DIFFERENT!', '');
        return;
    }
    
    // Check for 0
    if (secret.includes('0')) {
        showGameMessage('0 IS FORBIDDEN!', '');
        return;
    }
    
    userSecretNumber = secret;
    secretInput.value = '';
    
    // Hide secret input section, show feedback section
    document.getElementById('secretInputSection').style.display = 'none';
    document.getElementById('feedbackSection').style.display = 'flex';
    
    // Initialize AI guessing
    aiPossibleNumbers = generateAllPossibleNumbers();
    aiMakeNextGuess();
});

// Secret number input filter (AI mode)
document.getElementById('secretNumberInput').addEventListener('input', function(e) {
    this.value = this.value.replace(/[^1-9]/g, '').substring(0, 3);
});

// Submit feedback button (AI mode)
document.getElementById('submitFeedbackButton').addEventListener('click', function() {
    if (aiGameWon) return;
    
    const bulls = parseInt(document.getElementById('bullsInput').value) || 0;
    const cows = parseInt(document.getElementById('cowsInput').value) || 0;
    const currentGuess = document.getElementById('aiGuessDisplay').textContent;
    
    if (bulls < 0 || bulls > 3 || cows < 0 || cows > 3) {
        showGameMessage('INVALID FEEDBACK!', '');
        return;
    }
    
    const latestDisplay = columns[columns.length - 1]
        ?.querySelector('.guess-container:last-child .bulls-cows-display');
    if (latestDisplay) {
        updateFeedbackSymbols(latestDisplay, bulls, cows);
    }
    
    if (bulls === 3) {
        // AI won!
        aiGameWon = true;
        showGameMessage('AI WON!', currentGuess);
        return;
    }
    
    // Filter possible numbers based on feedback (already applies hints)
    aiPossibleNumbers = filterPossibleNumbers(currentGuess, bulls, cows, aiPossibleNumbers);
    
    if (aiPossibleNumbers.length === 0) {
        showGameMessage('NO VALID NUMBERS!', '');
        return;
    }
    
    // Consume a life for this failed attempt
    if (lives > 0) {
        lives--;
        updateLives();
    }
    
    if (lives <= 0) {
        aiGameWon = true;
        showGameMessage('AI FAILED!', userSecretNumber || '');
        return;
    }
    
    // Reset feedback inputs
    document.getElementById('bullsInput').value = '0';
    document.getElementById('cowsInput').value = '0';
    
    // Make next guess
    aiMakeNextGuess();
});


// Initialize - Power starts OFF
updateScore();
updateLives();
const powerLight = document.querySelector('.power-light');
const screenContent = document.getElementById('screenContent');
const pacmanAnimation = document.getElementById('pacmanAnimation');
const gameStartText = document.getElementById('gameStartText');
const modeSelection = document.getElementById('modeSelection');

// Ensure everything is hidden and power is off on page load/refresh
screenContent.classList.remove('visible');
pacmanAnimation.classList.add('hidden');
gameStartText.classList.remove('visible');
modeSelection.classList.add('hidden');
powerLight.classList.remove('on');

// Reset all game state
guessCount = 0;
currentGuessDisplay = null;
currentColumn = null;
columns = [];
isPoweredOn = false;
waitingForStart = false;
gameWon = false;
lives = 7;
secretNumber = '';
