
// global sudoku board variable
let sudokuBoard;

// stores presolved board so reset button can access it
let original;


// fetches board from Flask backend 
async function renderSudoku() {
    try {
        const response = await fetch('/get_board');
        if (!response.ok) {
            throw new Error("Error: Failed to retrieve board");
        }

        const data = await response.json();
        sudokuBoard = data.sudoku_board;
        if (!sudokuBoard) {
            console.error('Error: Invalid Sudoku board data');
        }
        setGame(); 
    }
    catch (error) {
        console.error("Error:", error);
    }
}

// Initial set up of the game
function setGame() {
    original = deepCopy(sudokuBoard);
    for (let r=0; r<9; r++) {
        for (let c=0; c<9; c++) {
            let cell = document.createElement("div");
            cell.id = r.toString() + c.toString();

            if (sudokuBoard[r][c] != 0) {
                cell.innerText = sudokuBoard[r][c];
                cell.classList.add("number-prefilled");
            } 
            else {
                cell.setAttribute("contenteditable", "true");

                cell.addEventListener("input", function() {
                    this.innerText.trim()
                    if (this.innerText.length > 1) {this.innerText = this.innerText[0]}

                    sudokuBoard[r][c] = parseInt(this.innerText) || 0;

                    row = parseInt(this.id[0])
                    col = parseInt(this.id[1])
                    trackScore(this.innerText.trim(), row, col);
                });


                cell.addEventListener("keydown", function(event) {
                    const key = event.key;
                    if (!(key >= "1" && key <= "9") && key !== "Backspace") {
                        event.preventDefault();
                    }
                });
            }

            if (r == 2 || r == 5) {
                cell.classList.add("horizontal-line");
            }
            if (c == 2 || c == 5) {
                cell.classList.add("vertical-line");
            }
    
            cell.classList.add("cell");
            document.getElementById("sudoku-container").appendChild(cell);
        }
    }
}

function setSolvedGame() {
    for (let r=0; r<9; r++) {
        for (let c=0; c<9; c++) {
            current_cell = document.getElementById(r.toString() + c.toString());
            current_cell.innerHTML = sudokuBoard[r][c];
        }
    }
}

// Deepcopy of an array
function deepCopy(array) {
    let copy = [];
    for (let i = 0; i < array.length; i++) {
        copy.push(array[i].slice());
    }
    return copy;
}


// Buttons and associated events 
function setButtons() {
    const solveButton = document.querySelector('#solve');
    solveButton.addEventListener("click", solveBoard);

    const newButton = document.querySelector("#new");
    newButton.addEventListener("click", initialize);

    const resetButton = document.querySelector("#reset");
    resetButton.addEventListener("click", resetBoard);
}

// Function to clear containers 
function clearContainers() {
    const sudokuContainer = document.getElementById("sudoku-container");
    sudokuContainer.innerHTML = "";
}

// "New" button clears current containers and resets them 
function initialize() {
    clearContainers();
    renderSudoku();
}


// "Solve" button sends a POST request to solve the current board
async function solveBoard() {
    try {
        const response = await fetch('/solve_board', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ sudoku_board: sudokuBoard })
        });

        const data = await response.json();
        sudokuBoard = data.solved_board;

        setSolvedGame();
    }
    catch (error) {
        console.error('Error: Could not receive data via fetch', error);
    }
}

// Reset button returns copy of the original board
function resetBoard() {
    sudokuBoard = deepCopy(original);
    
    clearContainers();
    setGame();

    // Score and mistakes reset 
    const scoreSpan = document.getElementById('scoreValue');
    const mistakesSpan = document.getElementById('mistakesValue');

    scoreSpan.textContent = 0;
    mistakesSpan.textContent = 0;
}


// Function that keeps track of the user's score
let prev;
async function trackScore(userInput, row, col) {
    let num = parseInt(userInput);
    try {
        const response = await fetch('/check_valid', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ sudoku_board: sudokuBoard, r: row, c: col })
        });

        // Get current score
        const scoreSpan = document.getElementById('scoreValue');
        const currentScore = parseInt(scoreSpan.textContent);
        let newScore = currentScore;

        // Get mistakes
        const mistakesSpan = document.getElementById('mistakesValue');
        const currentMistakes = parseInt(mistakesSpan.textContent);
        let mistakesValue = currentMistakes;

        // Increase score if input is valid, else decrease
        const data = await response.json();
        if (data.is_valid && userInput != '' && num != prev) {
            newScore = currentScore + 50;
            prev = num;
        }
        // Change nothing if guess is the same as previous guess
        else if (num == prev) {
            newScore = currentScore;
        }
        else {
            // Does not decrease score if at 0
            if (currentScore != 0 && num != prev) {
                newScore = currentScore - 50;     
            }
            
            if (userInput != '' && num != prev) {
                mistakesValue += 1;
            }   
            prev = num; 
        }

        scoreSpan.textContent = newScore;   
        mistakesSpan.textContent = mistakesValue;
    } 
    catch (error) {
        console.error('Error: Could not receive data via fetch', error);
    }
}


// Loads page
window.onload = function() {
    setButtons();
    initialize();
}