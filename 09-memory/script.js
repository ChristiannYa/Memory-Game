'use strict';

// ------------ //
// DOM elements //
// ------------ //

const gameStats = document.getElementById("game-stats");
const currentTimeHTML = document.getElementById("current-time");
const bestTimeHTML = document.getElementById("best-time");
const scoreHTML = document.getElementById("score");
const highScoreHTML = document.getElementById("high-score");
const correctCardsHTML = document.getElementById("correct");
const incorrectCardsHTML = document.getElementById("incorrect");
const resetHighScoreHTML = document.getElementById("reset-high-score-button");
const resetBestTimesHTML = document.getElementById("reset-best-times-button");

const gameBackground = document.getElementById("game-background");
const gameContainer = document.querySelector(".container");
const gameModeContainer = document.getElementById("game-mode-container");
const gameMode = document.getElementById("game-mode");
const menuStatsButtons = document.getElementById("game-stats-buttons")

const sizeSettingsButton = document.getElementById("grid-size-button");
const gridContainer = document.getElementById("grid-container");
const gridButton = document.querySelectorAll(".grid-option-button");
const sizeSettingsContainer = document.getElementById("size-settings-container");
const closeGridSettingsButton = document.getElementById("close-size-settings");
const confirmSizeSettingsButton = document.getElementById("confirm-size-settings");

const newGameButton = document.getElementById("new-game-button");
const newGameOptionsContainer = document.getElementById("new-game-container");
const cancelNewGameButton = document.getElementById("cancel-new-game-button");
const confirmNewGameButton = document.getElementById("confirm-new-game-button");

const gameSummaryContainer = document.getElementById("game-summary-container");
const gameSummaryContent = document.getElementById("game-summary-content");

// ---------- //
// Game score //
// ---------- //
let scoreJS = 0;
let highScoreJS = 0;

highScoreHTML.textContent = "";
scoreHTML.textContent = scoreJS;
highScoreHTML.textContent = highScoreJS;

const score_increment = 15;
const score_decrement = -5;
const hidden_card_delay = 500;

const updateScore = (points) => {
    scoreJS += points;
    scoreHTML.textContent = scoreJS;

    if (scoreJS > highScoreJS) {
        updateHighScore(scoreJS, currentGridSize.difficulty);
    }
}

const displayHighScore = (difficulty) => {
    if (!difficulty) {
        highScoreHTML.textContent = "";
        displayBestTime(difficulty);
        return;
    }

    const highScores = JSON.parse(localStorage.getItem("highScores")) || {};

    highScoreJS = highScores[difficulty] || 0;
    highScoreHTML.textContent = highScoreJS;
    displayBestTime(difficulty);
}

const updateHighScore = (newHighScore, difficulty) => {
    const highScores = JSON.parse(localStorage.getItem("highScores")) || {};

    highScores[difficulty] = Math.max(newHighScore, highScores[difficulty] || 0);
    localStorage.setItem("highScores", JSON.stringify(highScores));
    displayHighScore(difficulty);
}

const resetScore = () => {
    updateScore(-scoreJS);
}

const resetHighScore = () => {
    localStorage.removeItem("highScores");
    highScoreJS = 0;
    highScoreHTML.textContent = highScoreJS;
}

// ---------------- //
// Time to complete // 
// ---------------- //

const updateBestTime = (currentTime, difficulty) => {
    const bestTimes = JSON.parse(localStorage.getItem("bestTimes")) || {};
    const currentTimeMs = timeToMilliseconds(currentTime);

    if (!bestTimes[difficulty] || currentTimeMs < timeToMilliseconds(bestTimes[difficulty])) {
        bestTimes[difficulty] = currentTime;
        localStorage.setItem("bestTimes", JSON.stringify(bestTimes));
    }

    displayBestTime(difficulty);
}

const displayBestTime = (difficulty) => {
    if (!difficulty) {
        bestTimeHTML.textContent = "00:00.000";
        return;
    }

    const bestTimes = JSON.parse(localStorage.getItem("bestTimes")) || {};
    bestTimeHTML.textContent = bestTimes[difficulty] || "00:00.000";
}

const timeToMilliseconds = (timeString) => {
    const [minutes, secondsAndMs] = timeString.split(':');
    const [seconds, milliseconds] = secondsAndMs.split('.');
    return parseInt(minutes) * 60000 + parseInt(seconds) * 1000 + parseInt(milliseconds);
}

const resetBestTimes = () => {
    localStorage.removeItem("bestTimes");
    displayBestTime();
}

// -------------- //
// Cards settings //
// -------------- //

let revealedCards = [];
const revealed_cards = 2;
let cardOne = null;
let cardTwo = null;

// Reset cards for a new game
const resetCards = () => {
    cardOne = null;
    cardTwo = null;
    revealedCards = [];
}

// -------------------------------- //
// Importing images, Creating cards //
// -------------------------------- //

// Fetch image info dynamically from a folder
async function getImageInfo(imageName) {
    try {
        const module = await import(`./images-info/${imageName}.js`);
        return module.default;
    } catch (error) {
        console.error(`Failed to load image info: ${imageName}`, error);
        return null;
    }
}

// Display image and its elements on each card
async function displayCardContent(imageName, container) {
    const imageInfo = await getImageInfo(imageName);

    if (imageInfo) {
        const img = document.createElement("img");
        container.appendChild(img);
        img.src = imageInfo.image.src;
        img.alt = imageInfo.image.alt;
        img.className = imageInfo.image.class;

        imageInfo.additionalElements?.forEach(element => {
            const newElement = document.createElement(element.type);
            container.appendChild(newElement);
            newElement.textContent = element.text;
            newElement.className = element.class;
        });
    } else {
        console.log(`Image ${imageName} not found`);
    }
}

// ---------- //
// Game logic //
// ---------- //

let isDifficultySelected = false;
let displayedSummary = false;
let currentGridSize = "";
let correctCountJS = 0;
let incorrectCountJS = 0;

// Check conditionals for selected cards 
const checkCard = () => {
    if (cardOne && cardTwo) {
        if (cardOne.id === cardTwo.id) {
            // Selected cards match
            updateScore(score_increment);
            correctCountJS++;
            correctCardsHTML.textContent = correctCountJS;

            // Hide cards after being displayed
            setTimeout(() => {
                cardOne.style.visibility = "hidden";
                cardTwo.style.visibility = "hidden";
                resetCards();
                checkIfGameEnds();
            }, hidden_card_delay);
        } else {
            // Selected cards do not macth
            updateScore(score_decrement);
            incorrectCountJS++;
            incorrectCardsHTML.textContent = incorrectCountJS;

            // Hide cards after being displayed
            setTimeout(() => {
                cardOne.innerHTML = "";
                cardTwo.innerHTML = "";
                resetCards();
            }, hidden_card_delay);
        }
    }
}

// Check if all cards have been removed
const checkIfGameEnds = () => {
    const gridCards = document.querySelectorAll(".grid-card");
    const hiddenCards = document.querySelectorAll(".grid-card[style*='visibility: hidden']");

    if (gridCards.length === hiddenCards.length) {
        const finalTime = currentTimeHTML.textContent + currentTimeHTML.getAttribute("data-ms");

        updateBestTime(finalTime, currentGridSize.difficulty);
        stopStopwatch();
        displayGameSummary();
    }
}

// Toggle card display and check for a matching pair
const toggleCardDisplay = (gridCard, imageName) => {
    if (gridCard.innerHTML || revealedCards.length >= revealed_cards) {
        // Exit the function when the card is clicked again or
        // a third card is clicked
        return;
    }

    if (!stopwatchStarted) {
        startTime = Date.now();
        startStopwatch();
        stopwatchStarted = true;
        currentTimeHTML.classList.add("game-started");
    }

    displayCardContent(imageName, gridCard);
    revealedCards.push(gridCard);

    if (!cardOne) {
        cardOne = gridCard;
    } else {
        cardTwo = gridCard;
        checkCard();
    }
}

// Create a card with an event listener
const createGridCard = (index, totalCards) => {
    const gridCard = document.createElement("div");
    const imageName = `img${(index % (totalCards / 2)) + 1}`;

    gridCard.classList.add("grid-card");
    gridCard.id = `card${(index % (totalCards / 2)) + 1}`;

    gridCard.addEventListener("click", () => toggleCardDisplay(gridCard, imageName));

    return gridCard;
}

// Display cards on the grid based on gathered grid information
const displayGridCards = (sizeOne, sizeTwo, difficulty) => {
    const cardsTotal = parseInt(sizeOne) * parseInt(sizeTwo);
    const gridCardsContainer = document.createDocumentFragment();
    const cards = Array.from({ length: cardsTotal }, (_, index) => createGridCard(index, cardsTotal));

    cards.sort(() => Math.random() - 0.5);
    cards.forEach(card => gridCardsContainer.appendChild(card));

    gridContainer.innerHTML = "";
    gridContainer.appendChild(gridCardsContainer);
    gridContainer.className = `grid ${difficulty}-grid`;
    revealedCards = [];
}

// Gather grid information based on the clicked button's data attributes
const getGridInformation = (button) => {
    const gridData = button.dataset;
    currentGridSize = { ...gridData };

    isDifficultySelected = true;

    toggleConfirmedSize();
    displayHighScore(gridData.difficulty);
    displayGridCards(gridData.sizeOne, gridData.sizeTwo, gridData.difficulty);

    gridButton.forEach(btn => btn.classList.remove("active-difficulty"));
    button.classList.add("active-difficulty");
    gameMode.textContent = button.textContent.trim();
}

const toggleConfirmedSize = () => {
    confirmSizeSettingsButton.disabled = !isDifficultySelected;
    confirmSizeSettingsButton.classList.toggle("disabled", !isDifficultySelected);
}

// --------------------- //
// Menu options displays //
// --------------------- //

// Menu display state
const containerDislayIsOpened = (container, opened) => {
    container.style.display = opened ? "block" : "none";
    gameBackground.style.pointerEvents = opened ? "none" : "auto";
    gameBackground.classList.toggle("blurred", opened);
    container.style.pointerEvents = "auto";
}

// Opened grid size settings menu
const openedGridSizeSettings = () => {
    containerDislayIsOpened(sizeSettingsContainer, true);
    isDifficultySelected = false;
    toggleConfirmedSize();
}

// Closed grid size settings menu 
const closedGridSizeSettings = () => {
    containerDislayIsOpened(sizeSettingsContainer, false);

    gridButton.forEach(button => button.classList.remove("active-difficulty"));
    currentGridSize = "";
    gridContainer.innerHTML = "";
    gridContainer.className = "grid";
    gameMode.textContent = "";
    gameModeContainer.style.display = "none";
}

// When confirmed grid size settings
const confirmGridSize = () => {
    containerDislayIsOpened(sizeSettingsContainer, false);
    sizeSettingsButton.style.display = "none";
    document.getElementById("game-mode-container").style.display = "block";
    newGameButton.style.display = "block";
    currentTimeHTML.classList.remove("game-started");

    resetHighScoreHTML.style.display = 'none';
    resetBestTimesHTML.style.display = 'none';

    displayHighScore(currentGridSize.difficulty);

    const buttonsContainer = document.getElementById("game-stats-buttons");
    buttonsContainer.appendChild(newGameButton);
    buttonsContainer.appendChild(gameModeContainer);
}

// New game menu
const openNewGameOptions = () => {
    containerDislayIsOpened(newGameOptionsContainer, true)
}

// Cancel game options and close menu
const cancelNewGame = () => {
    containerDislayIsOpened(newGameOptionsContainer, false)
}

// Confirm new game; reset grid and score
const confirmNewGame = () => {
    containerDislayIsOpened(newGameOptionsContainer, false);
    containerDislayIsOpened(gameSummaryContainer, false);
    resetScore();
    displayHighScore();
    stopStopwatch();
    displayBestTime();

    gameContainer.appendChild(gameStats);
    menuStatsButtons.appendChild(newGameButton);
    gameStats.setAttribute("id", "game-stats");
    newGameButton.style.display = "none";
    gridContainer.innerHTML = "";
    gridContainer.className = "grid";
    sizeSettingsButton.style.display = "block";
    resetHighScoreHTML.style.display = 'block';
    resetBestTimesHTML.style.display = 'block';
    gameModeContainer.style.display = "none";

    stopwatchStarted = false;
    displayedSummary = false;

    gameStats.classList.remove("game-stats-moved");
    currentTimeHTML.classList.remove("game-started");
    currentTimeHTML.setAttribute("data-ms", ".000");
    scoreHTML.textContent = "0";
    highScoreHTML.textContent = "0";
    correctCountJS = 0;
    incorrectCountJS = 0;
    correctCardsHTML.textContent = "0";
    incorrectCardsHTML.textContent = "0";
    currentTimeHTML.textContent = "00:00";
}

const newGameClicked = () => {
    if (displayedSummary) {
        confirmNewGame();
    } else {
        openNewGameOptions();
    }
}

// Opened game summary menu
const displayGameSummary = () => {
    containerDislayIsOpened(gameSummaryContainer, true);
    newGameButton.addEventListener("click", confirmNewGame);

    gameSummaryContent.appendChild(gameStats);
    gameStats.removeAttribute("id");
    gameStats.classList.add("game-stats-moved");

    gridContainer.innerHTML = "";
    gridContainer.className = "grid"
    newGameButton.style.display = "block";

    displayedSummary = true;
}

// ---------- //
// Stop watch //
// ---------- //

let stopwatchInterval;
let startTime;
let stopwatchStarted = false;

const startStopwatch = () => {
    startTime = Date.now();
    stopwatchInterval = setInterval(updateStopwatch, 10);
}

const stopStopwatch = () => {
    clearInterval(stopwatchInterval);
}

function updateStopwatch() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - startTime;
    const milliseconds = Math.floor(elapsedTime % 1000).toString().padStart(3, '0');
    const seconds = Math.floor(elapsedTime / 1000 % 60).toString().padStart(2, '0');
    const minutes = Math.floor(elapsedTime / 60000 % 60).toString().padStart(2, '0');
    const timeElement = document.getElementById("current-time");
    timeElement.textContent = `${minutes}:${seconds}`;
    timeElement.setAttribute('data-ms', `.${milliseconds}`);
}

// --------------- //
// Event Listeners //
// --------------- //

sizeSettingsButton.addEventListener("click", openedGridSizeSettings);
confirmSizeSettingsButton.addEventListener("click", confirmGridSize);
closeGridSettingsButton.addEventListener("click", closedGridSizeSettings);
newGameButton.addEventListener("click", newGameClicked);
cancelNewGameButton.addEventListener("click", cancelNewGame);
confirmNewGameButton.addEventListener("click", confirmNewGame);
resetHighScoreHTML.addEventListener("click", resetHighScore);
resetBestTimesHTML.addEventListener("click", resetBestTimes);

gridButton.forEach(button => {
    button.addEventListener("click", () => getGridInformation(button));
})

window.addEventListener("beforeunload", stopStopwatch);