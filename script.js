// === MODULE 1: Gameboard (Single instance, IIFE) ===
const gameboard = (() => {
  // This private array holds the state of our 3x3 grid (9 slots total)
  // Initially, all squares are empty strings ""
  let board = ["", "", "", "", "", "", "", "", ""];

  // Public method to safely look at the board without mutating the original array
  // We use the spread operator [...] to return a fresh copy
  const getBoard = () => [...board];

  // Public method to place a player's mark ('X' or 'O') on a specific cell index (0-8)
  const placeMarker = (index, marker) => {
    // Validation: check if the index is valid AND the selected square is completely empty
    if (index >= 0 && index < 9 && board[index] === "") {
      board[index] = marker;
      return true; // The move was valid and successful
    }
    return false; // The move was illegal (cell already occupied or out of bounds)
  };

  // Public method to wipe the board clean for a new match
  const resetBoard = () => {
    board = ["", "", "", "", "", "", "", "", ""];
  };

  // We only expose the clean "buttons" (methods) to interact with the internal board
  return { getBoard, placeMarker, resetBoard };
})();

// === FACTORY 2: Player (Multiple instances, Factory Function) ===
const createPlayer = (name, marker) => {
  // These variables are private and securely locked inside this function's scope
  const getName = () => name;
  const getMarker = () => marker;

  // We return an object containing only the methods to read the player's info
  return { getName, getMarker };
};

// === MODULE 3: Game Controller (Single instance, IIFE) ===
const gameController = (() => {
  let players = [];
  let activePlayer;
  let isGameOver = false;

  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Horizontal Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Vertical Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  // Initializes or updates the player structures with current input values
  const setupPlayers = () => {
    const p1Name = document.getElementById("player1-name").value || "Player One";
    const p2Name = document.getElementById("player2-name").value || "Player Two";
    
    players = [
      createPlayer(p1Name, "X"),
      createPlayer(p2Name, "O")
    ];
    activePlayer = players[0];
  };

  const getActivePlayer = () => activePlayer;
  const getIsGameOver = () => isGameOver;

  const switchPlayerTurn = () => {
    activePlayer = activePlayer === players[0] ? players[1] : players[0];
  };

  const checkWin = (currentBoard, marker) => {
    return winningCombinations.some(combination => {
      return combination.every(index => currentBoard[index] === marker);
    });
  };

  const checkTie = (currentBoard) => {
    return currentBoard.every(square => square !== "");
  };

  const playRound = (index) => {
    if (isGameOver) return;

    // If players array is empty, initialize them before the first move
    if (players.length === 0) setupPlayers();

    const moveSuccessful = gameboard.placeMarker(index, activePlayer.getMarker());
    if (!moveSuccessful) return;

    const currentBoard = gameboard.getBoard();

    // Condition A: Victory
    if (checkWin(currentBoard, activePlayer.getMarker())) {
      displayController.updateStatus(`🏆 ${activePlayer.getName()} WINS!`); 
      isGameOver = true;
      return;
    }

    // Condition B: Tie
    if (checkTie(currentBoard)) {
      displayController.updateStatus("🤝 IT'S A TIE!"); 
      isGameOver = true;
      return;
    }

    // Condition C: Continue Match
    switchPlayerTurn();
  };

  const restartGame = () => {
    gameboard.resetBoard();
    setupPlayers(); // Refresh player names from inputs for the new match
    isGameOver = false;
  };

  return { playRound, getActivePlayer, restartGame, getIsGameOver };
})();

// === MODULE 4: Display Controller (Single instance, IIFE) ===
const displayController = (() => {
  const boardContainer = document.getElementById("gameboard-container");
  const statusDisplay = document.getElementById("game-status");
  const restartButton = document.getElementById("restart-btn");

  const renderBoard = () => {
    boardContainer.innerHTML = "";
    const currentBoard = gameboard.getBoard();

    currentBoard.forEach((marker, index) => {
      const cellElement = document.createElement("div");
      cellElement.classList.add("cell");
      cellElement.dataset.index = index; 
      cellElement.textContent = marker;
      boardContainer.appendChild(cellElement);
    });
  };

  const updateStatus = (message) => {
    statusDisplay.textContent = message;
  };

  const handleBoardClick = (event) => {
    const clickedCell = event.target;
    if (!clickedCell.classList.contains("cell")) return;

    if (gameController.getIsGameOver()) return;

    const selectedIndex = Number(clickedCell.dataset.index);
    gameController.playRound(selectedIndex);
    renderBoard();

    // If the game didn't end on that move, show the next active player's turn
    if (!gameController.getIsGameOver()) {
      const activePlayer = gameController.getActivePlayer();
      updateStatus(`${activePlayer.getName()}'s turn (${activePlayer.getMarker()})`);
    }
  };

  // New handler function to manage the restart action completely
  const handleRestart = () => {
    gameController.restartGame(); // Reset the data architecture in memory
    renderBoard(); // Redraw the empty board visual elements
    
    // Set initial greeting heading with the updated Player One name
    const activePlayer = gameController.getActivePlayer();
    updateStatus(`${activePlayer.getName()}'s turn (${activePlayer.getMarker()})`);
  };

  // Attach event listeners to their respective DOM components
  boardContainer.addEventListener("click", handleBoardClick);
  restartButton.addEventListener("click", handleRestart);

  return { renderBoard, updateStatus };
})();

// Initial execution to draw the base board view on startup
displayController.renderBoard();

// Initial render call to show the empty board when the page loads
displayController.renderBoard();