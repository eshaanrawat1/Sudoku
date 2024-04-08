# backend.py

from flask import Flask, render_template, jsonify, request
from sudoku_solver import Sudoku 

app = Flask(__name__)

# Basic Flask routing 
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/styles.css')
def styles():
    return app.send_static_file('styles.css')


@app.route('/script.js')
def script():
    return app.send_static_file('script.js')


@app.route('/stopwatch.js')
def stopwatch():
    return app.send_static_file('stopwatch.js')


# GET and POST requests for verifying sudoku 
@app.route('/get_board', methods=['GET'])
def get_board():
    try:
        sudoku = Sudoku()
        return jsonify({'sudoku_board': sudoku.board})
    except Exception as e:
        app.logger.error(e)
        return jsonify({'error': str(e)}), 500
    
    
@app.route('/solve_board', methods=['POST'])
def solve_board():
    data = request.json
    sudoku_board = data.get('sudoku_board')

    s = Sudoku(sudoku_board)
    s.solve()

    return jsonify({'solved_board': s.board})


@app.route('/check_valid', methods=['POST'])
def check_valid():
    data = request.json

    sudoku_board = data.get('sudoku_board')
    row = data.get('r')
    col = data.get('c')

    s = Sudoku(sudoku_board)
    return jsonify({'is_valid': s.is_valid_board(row, col)})

if __name__ == "__main__":
    app.run(debug=True)