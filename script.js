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
  // 1. We create the two players internally using our factory from Step 2
  const players = [
    createPlayer("Player One", "X"),
    createPlayer("Player Two", "O")
  ];

  let activePlayer = players[0]; // Player One ('X') starts the match
  let isGameOver = false;

  // 2. The 8 possible winning combinations (indexes on our 9-slot board array)
  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Horizontal Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Vertical Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  const getActivePlayer = () => activePlayer;

  const switchPlayerTurn = () => {
    activePlayer = activePlayer === players[0] ? players[1] : players[0];
  };

  // 3. Logic to analyze if the current player won
  const checkWin = (currentBoard, marker) => {
    // .some looks if at least one combination is true
    return winningCombinations.some(combination => {
      // .every ensures all 3 positions in that combination match the player's marker
      return combination.every(index => currentBoard[index] === marker);
    });
  };

  // 4. Logic to check for a tie (if all squares are full and checkWin was false)
  const checkTie = (currentBoard) => {
    return currentBoard.every(square => square !== "");
  };

  // 5. Main public method to execute a turn in the game
  const playRound = (index) => {
    if (isGameOver) {
      console.log("The game is already over! Call gameController.restartGame() to play again.");
      return;
    }

    console.log(`\n${activePlayer.getName()}'s turn (${activePlayer.getMarker()}) playing on square ${index}...`);

    // We communicate with Module 1 (gameboard) to try placing the marker
    const moveSuccessful = gameboard.placeMarker(index, activePlayer.getMarker());

    if (!moveSuccessful) {
      console.log("🚨 Invalid move! That square is already taken. Try a different one.");
      return;
    }

    // Get the fresh updated board state to check the outcome
    const currentBoard = gameboard.getBoard();
    console.log("Current board view:", currentBoard);

    // Condition A: Check for victory
    if (checkWin(currentBoard, activePlayer.getMarker())) {
      console.log(`🏆 CONGRATULATIONS! ${activePlayer.getName()} wins the match!`);
      // Update the visual status heading on the webpage
      displayController.updateStatus(`🏆 ${activePlayer.getName()} WINS!`); 
      isGameOver = true;
      return;
    }

    // Condition B: Check for tie
    if (checkTie(currentBoard)) {
      console.log("🤝 IT'S A TIE! The board is completely full.");
      // Update the visual status heading on the webpage
      displayController.updateStatus("🤝 IT'S A TIE!"); 
      isGameOver = true;
      return;
    }

    // Condition C: Game continues, switch turns
    switchPlayerTurn();
    console.log(`Next up: ${activePlayer.getName()} (${activePlayer.getMarker()})`);
  };

  const restartGame = () => {
    gameboard.resetBoard(); // Clear the board array
    activePlayer = players[0]; // Reset turn to Player One
    isGameOver = false;
    console.log("🔄 The game has been reset! Player One (X) is up.");
  };

  // Expose the public controls to play via developer console
  return { playRound, getActivePlayer, restartGame, getIsGameOver: () => isGameOver };
})();

// === MODULE 4: Display Controller (Single instance, IIFE) ===
const displayController = (() => {
  const boardContainer = document.getElementById("gameboard-container");
  const statusDisplay = document.getElementById("game-status");

  // This function reads the current board state and renders it on the screen
  const renderBoard = () => {
    // 1. Clear the HTML inside the container to avoid duplicating cells
    boardContainer.innerHTML = "";

    // 2. Get the current snapshot array from our gameboard module
    const currentBoard = gameboard.getBoard();

    // 3. Loop through the 9 elements of the array to generate the HTML buttons
    currentBoard.forEach((marker, index) => {
      const cellElement = document.createElement("div");
      cellElement.classList.add("cell");
      
      // We store the array index directly inside the HTML element using data-attributes
      cellElement.dataset.index = index; 
      
      // Set the visual text ("X", "O", or "")
      cellElement.textContent = marker;

      // Append the newly created cell to our grid container
      boardContainer.appendChild(cellElement);
    });
  };

  // Public method to update the status text on the screen
  const updateStatus = (message) => {
    statusDisplay.textContent = message;
  };
  
  // Function to handle the user's click on the grid
  const handleBoardClick = (event) => {
    // We target only elements with the class "cell"
    const clickedCell = event.target;
    if (!clickedCell.classList.contains("cell")) return;
    
    // If the game is already over in the controller, we don't do anything
    if (gameController.getIsGameOver()) return;

    // We pull the index out of the HTML dataset pocket (comes as a string, so we convert to Number)
    const selectedIndex = Number(clickedCell.dataset.index);

    // 2. We send the index to the brain (gameController) to execute the round!
    gameController.playRound(selectedIndex);

    // 3. We refresh the UI to show the new marker on the screen
    renderBoard();

    // 4. Update the visual status text on the screen depending on the state
    const activePlayer = gameController.getActivePlayer();
    if (!gameController.getIsGameOver()) {
      updateStatus(`${activePlayer.getName()}'s turn (${activePlayer.getMarker()})`);
    }
  };

  // 5. Bind the click event listener to the parent container (Event Delegation)
  boardContainer.addEventListener("click", handleBoardClick);

  // For now, we only expose renderBoard so we can see it working
  return { renderBoard, updateStatus };
})();

// Initial render call to show the empty board when the page loads
displayController.renderBoard();