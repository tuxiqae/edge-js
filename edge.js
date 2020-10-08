(function(global) {
    function Board(el, options) {
        options = options || {};

        // Keeping local reference to element and ensuring proper styling.
        el.style.boxSizing = "content-box";
        this.boardEl = el;

        // Default values for board
        this.height = options.height || 200;
        this.width = options.width || 200;
    }

    /* 
        This function creates the board and starts the game.
        It is preferable to use the "Board.onCreate" function hook to set game values.
        Use "onUpdate" function to hook to the update of the screen.
    */
    Board.prototype.start = function() {
        this.createBoard();

        if(typeof this.onCreate === 'function')
            this.onCreate.call(this);
        
        this._elapsed = 0;
        this.update();
    };

    Board.prototype.update = function() {
        for(let y = 0; y < this.height; y++)
            for(let x = 0; x < this.width; x++)
                this.board[y][x].clear();

        if(this._lastUpdate)
            this._elapsed = Date.now() - this._lastUpdate;

        if(typeof this.onUpdate === 'function')
            this.onUpdate.call(this);

        this._lastUpdate = Date.now();
        let _this = this;
        setTimeout(function() { _this.update(); }, 0);
    };

    Board.prototype.createBoard = function() {
        // Clearing boardEl
        this.boardEl.innerHTML = '';

        /* Creating view "pixels".
           Calculating their specs */
        let pHeight = this.boardEl.clientHeight / this.height;
        let pWidth = this.boardEl.clientWidth / this.width;

        // Creating board matrix
        this.board = [];

        // Iterating through ROWS then COLUMNS
        for(let row = 0; row < this.height; row++) {
            // Creating row array
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
        p = { col: Math.round(p.col), row: Math.round(p.row) };

        if(!options || typeof options === 'string') 
            options = { color: options || 'black' };

        this.wrap(p);

        this.board[p.row][p.col].color(options.color);
    }

    Board.prototype.wrap = function(p) {
        // Wrap edges
        p.row %= this.height;
        p.col %= this.width;

        if(p.row < 0) p.row += this.height;
        if(p.col < 0) p.col += this.width;
    };

    /*
        Draws a line between two points.
        Point must be { row: INT, col: INT }.
    */
    Board.prototype.drawLine = function(p1, p2, options) {
        // Make sure points are ints
        p1 = { col: Math.round(p1.col), row: Math.round(p1.row) };
        p2 = { col: Math.round(p2.col), row: Math.round(p2.row) };
        
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
                        // For every row (y), calculate appropriate col (x)
                        let x = Math.round((row - n) / m);
                        if(x > toCol || row > toRow) break;
                        this.draw({ col: x, row: row });
                    }
                    fromRow += pixelsPerCol;
                }
            }
        }
    }

    /*
        This function takes an array of points that makes an object, and draws lines between them.
        Available options:
            center { col: x, row: y } - offset point to draw the object.
            rotate <radians> - rotate object.
    */
    Board.prototype.drawObject = function(points, options, debug) {
        options = options || {};
        for(let i = 0; i < points.length; i++) {
            let p1 = points[i], p2 = points[(i+1)%points.length];
            p1 = { row: p1.row, col: p1.col };
            p2 = { row: p2.row, col: p2.col };
            if(options.rotate) {
                rotatePoint(p1, options.rotate);
                rotatePoint(p2, options.rotate);
            }
            if(options.center) {
                this.wrap(options.center);
                p1.row += options.center.row; p1.col += options.center.col;
                p2.row += options.center.row; p2.col += options.center.col;
            }
            if(debug) 
                console.log(p1, p2);
            this.drawLine(p2, p1);
        }
    };

    /*
        This function takes two objects,
        returns TRUE if one of the points in Obj1 is inside Obj2.    
    */
    Board.prototype.checkCollision = function(obj1, obj2) {
        let collision = false;

        for(let i = 0; i < obj1.points.length && !collision; i++) {
            if(this.isPointInObject(obj1.points[i], obj1.center, obj2))
                collision = true;
        }

        return collision;
    }


    /*
        This function takes a point and checks left-plane distance value from edges of Obj.
    */
    Board.prototype.isPointInObject = function(p, pCenter, obj) {
        let points = obj.points, objCenter = obj.center;

        let inside = true;

        for(let i = 1; i < points.length && inside; i++) {
            let pA = points[i-1],
                pB = points[i];

            let px = p.col + pCenter.col,
                py = p.row + pCenter.row,
                
                pAx = pA.col + objCenter.col,
                pAy = pA.row + objCenter.row,
                
                pBx = pB.col + objCenter.col,
                pBy = pB.row + objCenter.row;
            
            let A = -1 * (pBy - pAy),
                B = pBx - pAx,
                C = -1 * ( (A*pAx) + (B*pAy) );

            let D = (A * px) + (B * py) + C;

            if(D < 0)
                inside = false;
        }

        return inside;
    }

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

    Pixel.prototype.clear = function() {
        this.state = Pixel.State.Empty;
        this.el.style.backgroundColor = 'white';
    }
    
    function rotatePoint(p, rotation) {
        let r = Math.sqrt(Math.pow(p.row, 2) + Math.pow(p.col, 2)), 
            angle = Math.asin(p.row / r);

        // Considering quarters
        if(p.row >= 0 && p.col < 0) {
            angle = Math.PI - angle;
        } else if(p.row < 0 && p.col <= 0) {
            angle = -Math.PI - angle;
        }

        angle += rotation;

        p.col = Math.round(r * Math.cos(angle));
        p.row = Math.round(r * Math.sin(angle));
    }

    global.Edge = {
        Board: Board
    };
})(this)
