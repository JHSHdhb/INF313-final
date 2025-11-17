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
let lockedDigits = [null, null, null];

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

// Calculate bulls and cows for a guess and return digit status
function calculateBullsAndCows(guess) {
    let bulls = 0;
    let cows = 0;
    const guessDigits = guess.split('');
    const secretDigits = secretNumber.split('');
    const guessCopy = [...guessDigits];
    const secretCopy = [...secretDigits];
    const digitStatus = []; // 'correct', 'wrong-position', 'incorrect'
    
    // First pass: Check for bulls (correct digit in correct position)
    for (let i = 0; i < 3; i++) {
        if (guessCopy[i] === secretCopy[i]) {
            bulls++;
            digitStatus[i] = 'correct';
            guessCopy[i] = 'X'; // Mark as used
            secretCopy[i] = 'X'; // Mark as used
        } else {
            digitStatus[i] = null; // Will be determined later
        }
    }
    
    // Second pass: Check for cows (correct digit in wrong position)
    for (let i = 0; i < 3; i++) {
        if (digitStatus[i] !== 'correct') {
            const index = secretCopy.indexOf(guessCopy[i]);
            if (index !== -1 && secretCopy[index] !== 'X') {
                cows++;
                digitStatus[i] = 'wrong-position';
                secretCopy[index] = 'X'; // Mark as used
            } else {
                digitStatus[i] = 'incorrect';
            }
        }
    }
    
    return { bulls, cows, digitStatus };
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
    
    // Create 3 placeholders with locked digits pre-filled
    for (let i = 0; i < 3; i++) {
        const placeholder = document.createElement('div');
        placeholder.className = 'number-placeholder';
        
        // Check if this position has a locked digit
        if (lockedDigits[i] !== null) {
            placeholder.textContent = lockedDigits[i];
            placeholder.classList.add('locked', 'correct', 'filled');
        } else if (guess && i < guess.length) {
            placeholder.textContent = guess[i];
            placeholder.classList.add('filled');
        } else {
            placeholder.textContent = '-';
        }
        display.appendChild(placeholder);
    }
    
    container.appendChild(display);
    column.appendChild(container);
    
    return display;
}

// Update digit colors based on their status
function updateDigitColors(display, digitStatus) {
    const placeholders = display.querySelectorAll('.number-placeholder');
    placeholders.forEach((placeholder, index) => {
        // Remove all status classes
        placeholder.classList.remove('correct', 'wrong-position', 'incorrect', 'filled');
        
        // Add appropriate class based on status
        if (digitStatus[index] === 'correct') {
            placeholder.classList.add('correct', 'filled');
        } else if (digitStatus[index] === 'wrong-position') {
            placeholder.classList.add('wrong-position', 'filled');
        } else if (digitStatus[index] === 'incorrect') {
            placeholder.classList.add('incorrect', 'filled');
        }
    });
}

// Update current guess display (for typing)
function updateCurrentGuessDisplay(value) {
    // Check if we've reached max total rows
    if (getTotalRows() >= maxTotalRows) {
        return;
    }
    
    if (!currentGuessDisplay) {
        // Create first container if it doesn't exist
        // Check if current column has 4 rows, if so, getCurrentColumn will create a new one
        currentGuessDisplay = createGuessContainer('');
        if (!currentGuessDisplay) {
            // Max rows reached, can't create container
            return;
        }
    }
    
    if (!currentGuessDisplay) return;
    
    const placeholders = currentGuessDisplay.querySelectorAll('.number-placeholder');
    
    // Extract only digits for unlocked positions from value
    // The value might contain locked digits, so we need to filter them out
    let unlockedInput = '';
    for (let i = 0; i < value.length; i++) {
        let digit = value[i];
        let isLockedInPosition = false;
        // Check if this digit at this position matches a locked digit
        if (i < 3 && lockedDigits[i] === digit) {
            // This digit is in a locked position, skip it
            isLockedInPosition = true;
        }
        // Also check if this digit is already locked in any position
        let isLockedDigit = false;
        for (let pos = 0; pos < 3; pos++) {
            if (lockedDigits[pos] === digit) {
                isLockedDigit = true;
                break;
            }
        }
        // Only add if it's not locked in this position and not already a locked digit
        if (!isLockedInPosition && !isLockedDigit) {
            unlockedInput += digit;
        }
    }
    
    // Now build display value: locked digits in their positions, unlocked input fills rest
    let displayValue = '';
    let inputIndex = 0;
    
    for (let i = 0; i < 3; i++) {
        if (lockedDigits[i] !== null) {
            // Position is locked, use locked digit
            placeholders[i].textContent = lockedDigits[i];
            placeholders[i].classList.remove('locked', 'correct', 'wrong-position', 'incorrect', 'filled');
            placeholders[i].classList.add('locked', 'correct', 'filled');
            displayValue += lockedDigits[i];
        } else {
            // Position is not locked, fill from unlocked input
            if (inputIndex < unlockedInput.length) {
                const digit = unlockedInput[inputIndex];
                placeholders[i].textContent = digit;
                placeholders[i].classList.remove('locked', 'correct', 'wrong-position', 'incorrect', 'filled');
                placeholders[i].classList.add('filled');
                displayValue += digit;
                inputIndex++;
            } else {
                placeholders[i].textContent = '-';
                placeholders[i].classList.remove('locked', 'correct', 'wrong-position', 'incorrect', 'filled');
            }
        }
    }
    
    // Update input field to reflect locked positions
    guessInput.value = displayValue;
}

// Guess input handling
const guessInput = document.getElementById('guessInput');

// Build guess value from input, accounting for locked positions
function buildGuessFromInput(inputValue) {
    let result = '';
    let inputIndex = 0;
    
    for (let i = 0; i < 3; i++) {
        if (lockedDigits[i] !== null) {
            // Position is locked, use locked digit
            result += lockedDigits[i];
        } else if (inputIndex < inputValue.length) {
            // Position not locked, use input digit
            result += inputValue[inputIndex];
            inputIndex++;
        }
    }
    
    return result;
}

// Only allow digits (1-9, 0 is forbidden)
guessInput.addEventListener('input', function(e) {
    // Get current input value, remove non-digits and 0
    let rawInput = this.value.replace(/[^1-9]/g, ''); // Only allow 1-9
    
    // Extract only digits that should go into unlocked positions
    // Remove digits that match locked positions
    let unlockedInput = '';
    for (let i = 0; i < rawInput.length; i++) {
        let digit = rawInput[i];
        let isLockedDigit = false;
        // Check if this digit is locked in any position
        for (let pos = 0; pos < 3; pos++) {
            if (lockedDigits[pos] === digit) {
                isLockedDigit = true;
                break;
            }
        }
        // Only add if it's not a locked digit
        if (!isLockedDigit) {
            unlockedInput += digit;
        }
    }
    
    // Build final value: locked digits in their positions, user input fills unlocked positions
    let newValue = '';
    let inputIndex = 0;
    for (let i = 0; i < 3; i++) {
        if (lockedDigits[i] !== null) {
            // Position is locked, use locked digit
            newValue += lockedDigits[i];
        } else if (inputIndex < unlockedInput.length) {
            // Position is unlocked, use next digit from user input
            newValue += unlockedInput[inputIndex];
            inputIndex++;
        }
    }
    
    // Limit to 3 digits total
    if (newValue.length > 3) {
        newValue = newValue.slice(0, 3);
    }
    
    this.value = newValue;
    
    // Update current guess display
    updateCurrentGuessDisplay(newValue);
});

guessInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        // Get guess value, ensuring locked digits are included
        let guess = this.value.trim();
        if (guess.length < 3) {
            // Fill in locked digits if not present
            guess = buildGuessFromInput(guess);
        }
        
        if (guess && guess.length === 3 && !gameWon && lives > 0) {
            // Check if we've reached max total rows
            if (getTotalRows() >= maxTotalRows) {
                console.log('Maximum total rows (7) reached! Cannot submit more guesses.');
                return;
            }
            
            // Validate guess has no 0 (0 is forbidden)
            if (guess.includes('0')) {
                console.log('0 is forbidden!');
                showGameMessage('0 IS FORBIDDEN!', '');
                return;
            }
            
            // Validate guess has no repeated digits
            const guessDigits = guess.split('');
            const uniqueDigits = new Set(guessDigits);
            if (uniqueDigits.size !== 3) {
                console.log('Guess must have 3 unique digits!');
                showGameMessage('EACH DIGIT MUST BE DIFFERENT!', '');
                return;
            }
            
            // Process guess
            console.log('Guess submitted:', guess);
            
            // Finalize the current guess display (it's already in the container)
            if (currentGuessDisplay) {
                const placeholders = currentGuessDisplay.querySelectorAll('.number-placeholder');
                for (let i = 0; i < 3; i++) {
                    placeholders[i].textContent = guess[i];
                }
                
                // Calculate bulls and cows and get digit status
                const { bulls, cows, digitStatus } = calculateBullsAndCows(guess);
                
                // Update locked digits - lock correct positions
                for (let i = 0; i < 3; i++) {
                    if (digitStatus[i] === 'correct') {
                        lockedDigits[i] = guess[i];
                    }
                }
                
                // Update digit colors based on status
                updateDigitColors(currentGuessDisplay, digitStatus);
                
                // Check for win (3 bulls)
                if (bulls === 3) {
                    gameWon = true;
                    console.log('You won! The secret number was:', secretNumber);
                    showGameMessage('YOU WON!', secretNumber);
                    score += 100;
                    updateScore();
                } else {
                    // Wrong guess - reduce one life
                    lives--;
                    updateLives();
                    
                    if (lives <= 0) {
                        console.log('Game over! The secret number was:', secretNumber);
                        showGameMessage('GAME OVER', secretNumber);
                    }
                }
            }
            
            // Reset for next guess
            guessCount++;
            currentGuessDisplay = null;
            
            // Build next guess value with locked digits
            let nextGuessValue = '';
            for (let i = 0; i < 3; i++) {
                if (lockedDigits[i] !== null) {
                    nextGuessValue += lockedDigits[i];
                }
            }
            this.value = nextGuessValue;
            
            // Create new container for next guess only if we haven't reached max and game not won
            if (!gameWon && lives > 0 && getTotalRows() < maxTotalRows) {
                // getCurrentColumn will automatically create a new column if current one has 4 rows
                currentGuessDisplay = createGuessContainer('');
                // Update display with locked digits
                updateCurrentGuessDisplay(nextGuessValue);
            }
        }
    }
});

// D-Pad button handling
document.querySelectorAll('.dpad-button').forEach(button => {
    button.addEventListener('click', function() {
        const direction = this.getAttribute('data-direction');
        console.log('D-Pad pressed:', direction);
        // Add your navigation logic here
    });
});

// Reset game function
function resetGame() {
    guessCount = 0;
    currentGuessDisplay = null;
    currentColumn = null;
    columns = [];
    gameWon = false;
    lives = 7;
    lockedDigits = [null, null, null]; // Reset locked digits
    
    if (gameMode === 'YOU') {
        secretNumber = generateSecretNumber();
        console.log('New game started! Secret number:', secretNumber);
        updateLives();
        const gameArea = document.getElementById('gameArea');
        gameArea.innerHTML = '';
        guessInput.value = '';
        // Create first guess container for new game
        if (isPoweredOn && !waitingForStart) {
            currentGuessDisplay = createGuessContainer('');
        }
    } else {
        resetAIGame();
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
        lockedDigits = [null, null, null]; // Reset locked digits
        updateLives();
        console.log('Game started in YOU mode! Secret number:', secretNumber);
        
        if (guessCount === 0) {
            currentGuessDisplay = createGuessContainer('');
        }
    } else {
        // AI mode - reset and show secret input section
        resetAIGame();
        document.getElementById('secretInputSection').style.display = 'flex';
        document.getElementById('feedbackSection').style.display = 'none';
        console.log('Game started in AI mode!');
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
        lockedDigits = [null, null, null]; // Reset locked digits
        secretNumber = '';
        updateLives();
        const gameArea = document.getElementById('gameArea');
        gameArea.innerHTML = '';
        guessInput.value = '';
        
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
    
    if (bulls === 3) {
        // AI won!
        aiGameWon = true;
        showGameMessage('AI WON!', currentGuess);
        const guessContainer = columns[columns.length - 1]?.querySelector('.guess-container:last-child');
        if (guessContainer) {
            const placeholders = guessContainer.querySelectorAll('.number-placeholder');
            placeholders.forEach(p => {
                p.classList.remove('incorrect', 'wrong-position');
                p.classList.add('correct');
            });
        }
        return;
    }
    
    // Filter possible numbers based on feedback (already applies hints)
    aiPossibleNumbers = filterPossibleNumbers(currentGuess, bulls, cows, aiPossibleNumbers);
    
    if (aiPossibleNumbers.length === 0) {
        showGameMessage('NO VALID NUMBERS!', '');
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
lockedDigits = [null, null, null]; // Reset locked digits
secretNumber = '';
