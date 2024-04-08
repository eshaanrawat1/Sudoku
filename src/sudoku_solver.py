# sudoku_solver.py

from dokusan import generators
import numpy as np
import requests 

class Sudoku:
    def __init__(self, board=None):
        self._rows = 9
        self._cols = 9

        self.board = board
        if not self.board:
            try:
                self.generate_random_board()
            except:
                response = requests.get("https://sudoku-api.vercel.app/api/dosuku?query={newboard(limit:1){grids{value}}}")
                self.board = response.json()["newboard"]["grids"][0]["value"]
                

        self.row_sets = [set(range(1, 10)) - set(r) for r in self.board]
        self.col_sets = [set(range(1, 10)) - set(c) for c in zip(*self.board)]
        self.box_sets = {}
        self.initialize_box_sets()

        self.original = [row[:] for row in self.board]

    def generate_random_board(self) -> None:
        """Generates a random board in the instance API calls fail"""
        arr = np.array(list(str(generators.random_sudoku(avg_rank=150))))
        self.board = arr.reshape(9,9).tolist()

        self.board = [[int(cell) for cell in row] for row in self.board]


    # Initializes values for each box considering the initial board possibilities
    def initialize_box_sets(self) -> None:
        """Initializes the box sets"""
        for i in range(0, 9, 3):
            for j in range(0, 9, 3):
                box_vals = [self.board[x][y] for x in range(i, i+3) for y in range(j, j+3)]
                self.box_sets[(i, j)] = set(range(1, 10)) - set(box_vals)

    # ----------------------------------------------------------------------------
    # FORWARD CHECK FUNCTIONS
    # Removes values that are impossible for a cell given constraints
    # ----------------------------------------------------------------------------
    def remove_possibilities(self, r: int, c: int, value: int) -> None:
        """Narrows down the possible choices based on sets"""
        self.row_sets[r].discard(value)
        self.col_sets[c].discard(value)

        x, y = (r // 3) * 3, (c // 3) * 3
        self.box_sets[(x, y)].discard(value)

        self.board[r][c] = value

    # ----------------------------------------------------------------------------
    # Adds values that are newly possible after backtracking for a cell
    # given new constraints from row, column, and box
    # ----------------------------------------------------------------------------
    def add_possibilities(self, r: int, c: int, value: int) -> None:
        """Adds possibilities after a failed backtracking"""
        self.row_sets[r].add(value)
        self.col_sets[c].add(value)

        x, y = (r // 3) * 3, (c // 3) * 3
        self.box_sets[(x, y)].add(value)

        self.board[r][c] = 0

    # ----------------------------------------------------------------------------
    # Function that checks for a minimum remaining value or MRV heuristic
    # Finds all empty cells and returns cell that has the least possible choices
    # ----------------------------------------------------------------------------
    def mrv_heuristic(self) -> tuple[int, int]:
        """Apply MRV to find the most optimal remaining cell choice"""
        curr_min, curr_cell = float("inf"), None
        for r in range(9):
            for c in range(9):
                if self.board[r][c] == 0:
                    x, y = (r // 3) * 3, (c // 3) * 3
                    choices = len(self.row_sets[r] & self.col_sets[c] & self.box_sets[(x, y)])
                    if choices < curr_min:
                        curr_min = choices
                        curr_cell = r, c
        return curr_cell
    
    def solve(self) -> bool:
        """Solves the Sudoku board using backtracking"""
        cell = self.mrv_heuristic()
        if not cell:
            # Base case, if no possible cells can be chosen, board is solved
            return True
        else:
            r, c = cell
            x, y = (r // 3) * 3, (c // 3) * 3
            min_set = self.row_sets[r] & self.col_sets[c] & self.box_sets[(x, y)]
            for guess in list(min_set):
                self.remove_possibilities(r, c, guess)

                if self.solve():
                    return True

                self.add_possibilities(r, c, guess)
            return False
        
    
    # ----------------------------------------------------------------------------
    # Function that checks if a given board is valid based on user input on r,c
    # ----------------------------------------------------------------------------
    def is_valid_board(self, row, col) -> bool:
        """Returns if a board is a valid sudoku board"""
        def is_valid():
            rows = [self.board[row][i] for i in range(9) if self.board[row][i] != 0]
            cols = [self.board[i][col] for i in range(9) if self.board[i][col] != 0]
            c_check = len(cols) == len(set(cols))
            r_check = len(rows) == len(set(rows))

            return r_check and c_check

        def valid_box(r: int, c: int):
            x, y = r // 3, c // 3
            res = []
            for i in range(x*3, x*3+3):
                for j in range(y*3, y*3+3):
                    if self.board[i][j] != 0:
                        res.append(self.board[i][j])

            return len(res) == len(set(res))

        return is_valid() and valid_box(row, col)