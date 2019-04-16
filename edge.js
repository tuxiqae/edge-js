(function(global) {
    function Board(el, options) {
        options = options || {};

        // Keeping local reference to element and ensuring proper styling.
        el.style.boxSizing = "content-box";
        this.boardEl = el;

        // Default values for board
        this.height = options.height || 200;
        this.width = options.width || 200;

        // Initiating board
        this.createBoard();
    }

    Board.prototype.createBoard = function() {
        // Clearing boardEl
        this.boardEl.innerHTML = '';

        /* Creating view "pixels".
           Calculating their specs */
        let pHeight = this.boardEl.clientHeight / this.height;
        let pWidth = this.boardEl.clientWidth / this.width;

        // Creating board matrix
        this.board = [];

        // Iterating throw ROWS then COLUMNS
        for(let row = 0; row < this.height; row++) {
            // Crating row array
            this.board[row] = [];
            for(let col = 0; col < this.width; col++) {
                let p = new Pixel({
                    height: pHeight,
                    width: pWidth
                });
                this.board[row][col] = p;
                // Appending to boardEl
                this.boardEl.appendChild(p.el);
            }
        }
    };

    /*
        This function paints a pixel on the board.
        arg2 is either an options object or a color string (css).
        Default color is black.
    */
    Board.prototype.draw = function(p, options) {
        if(!options || typeof options === 'string') 
            options = { color: options || 'black' };

        // Wrap edges
        p.row %= this.height;
        p.col %= this.width;

        this.board[p.row][p.col].color(options.color);
    }

    /*
        Draws a line between two points.
        Point must be { row: INT, col: INT }.
    */
    Board.prototype.drawLine = function(p1, p2, options) {
        // Calculate starting and ending points for line drawing
        let fromCol = Math.min(p1.col, p2.col), toCol = Math.max(p1.col, p2.col);
        let fromRow = Math.min(p1.row, p2.row), toRow = Math.max(p1.row, p2.row);

        // Calculate slope
        let m = (p2.col - p1.col === 0) ? false : (p2.row - p1.row) / (p2.col - p1.col);

        // No slope - straight line! (x = c)
        if(m === false) {
            for(let row = fromRow; row <= toRow; row++)
                this.draw({ col: p1.col, row: row });
        } else {
            // Calculating how many drawings per column
            let pixelsPerCol = Math.round(Math.abs(p2.row - p1.row) / (Math.abs(p2.col - p1.col) + 1));
            // Calculate "n" using p1
            let n = p1.row - m * p1.col;

            for(let col = fromCol; col <= toCol; col++) {
                // If pixelsPerCol === 0, we have a horizontal line (y = c)
                if(pixelsPerCol === 0) {
                    let y = Math.round(m * col + n);
                    this.draw({ col: col, row: y });
                } else {
                    for(let row = fromRow; row < fromRow + pixelsPerCol; row++) {
                        // For every row, calculate appropriate col
                        let x = Math.round((row - n) / m);
                        if(x > toCol || row > toRow) break;
                        this.draw({ col: x, row: row });
                    }
                }
                fromRow += pixelsPerCol;
            }
        }
    }

    /*
        
    */
    Board.prototype.drawObject = function(points, options) {
        options = options || {};

        for(let i = 0; i < points.length; i++) {
            let p1 = points[i], p2 = points[(i+1)%points.length];
            this.drawLine(p2, p1);
        }
    };

    function Pixel(options) {
        // Creating pixel el
        let pixel = this.el = document.createElement('div');
        // Applying styles
        pixel.style.float = 'left';
        pixel.style.height = options.height + 'px';
        pixel.style.width = options.width + 'px';
        // Default values
        this.state = options.state || Pixel.State.Empty;
    }

    Pixel.State = {
        Empty: 0,
        Color: 1
    };

    Pixel.prototype.color = function(color) {
        this.state = Pixel.State.Color;
        this.el.style.backgroundColor = color;
    }

    global.Edge = {
        Board: Board
    };
})(this)