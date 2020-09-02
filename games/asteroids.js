(function(global) {
    function Game() {
        const board = new Edge.Board(document.getElementById('board'));

        // Reference to board for testing -- TODO: remove!
        global.board = board;

        board.onCreate = function() {
            this.asteroids = [new Asteroid({
                center: { col: 40, row: 40 },
                vx: 10, vy: 20, vr: Math.PI/2
            })];

            this.plane = new Plane({
                center: { col: 120, row: 120 },
                rotate: Math.PI
            });

            this.bullets = [];

            window.addEventListener('keydown', (e) => {
                switch(e.key) {
                    case 'ArrowLeft':
                        this.plane.vr = -3;
                        break;
                    case 'ArrowRight':
                        this.plane.vr = 3;
                        break;
                    case 'ArrowUp':
                        this.plane.a = 3;
                        break;
                    case 'ArrowDown':
                        break;
                    case ' ':
                        let bullet = this.plane.shoot();
                        bullet.center.row %= this.height;
                        bullet.center.col %= this.width;
                        if(bullet.center.row < 0) bullet.center.row += this.height;
                        if(bullet.center.col < 0) bullet.center.col += this.width;
                        this.bullets.push(bullet);
                        break;
                    default:
                        console.log(e);
                        break;
                }
            });

            window.addEventListener('keyup', (e) => {
                switch(e.key) {
                    case 'ArrowLeft':
                        this.plane.vr = 0;
                        break;
                    case 'ArrowRight':
                        this.plane.vr = 0;
                        break;
                    case 'ArrowUp':
                        this.plane.a = 0;
                        break;
                    case 'ArrowDown':
                        break;
                    default:
                        break;
                }
            });
        };
    
        board.onUpdate = function() {
            for(let i = 0; i < this.asteroids.length; i++) {
                let a = this.asteroids[i];
                a.move(this._elapsed);
                board.drawObject(a.points, a);
            }

            for(let i = 0; i < this.bullets.length; i++) {
                let b = this.bullets[i];
                b.move(this._elapsed, this.height, this.width);

                // Check if bullet hit any asteroids
                for(let asteroid of this.asteroids) {
                    let hit = this.isPointInObject(b.center, { col: 0, row: 0 }, asteroid);

                    if(hit) {
                        console.log("HIT!");
                        b.alive = false;
                    }
                }
                
                b.alive ? board.draw(b.center) : this.bullets.splice(i--, 1);
            }
            
            // Moving the plane
            this.plane.move(this._elapsed);

            // For every asteroid, is plane hit
            for(let asteroid of this.asteroids) {
                if(this.checkCollision(this.plane, asteroid))
                    console.log("DEAD");
            }

            board.drawObject(this.plane.points, this.plane);
        }
    
        board.start();
    }

    class SpaceObject {
        constructor(options) {
            options = options || {};
        
            this.center = options.center || { col: 0, row: 0 };
            this.rotate = options.rotate || 0;

            this.vx = options.vx || 0;
            this.vy = options.vy || 0;
            this.vr = options.vr || 0;
            this.a = options.a || 0;
        }

        move(elapsed) {
            let delta = elapsed / 1000;

            // Checking for acceleration
            if(typeof this.a === 'number' && this.a != 0) {
                this.vx += Math.sin(this.rotate) * -this.a;
                this.vy += Math.cos(this.rotate) * this.a;
            }

            this.center.col += delta * this.vx;
            this.center.row += delta * this.vy;
            this.rotate += delta * this.vr;
        }
    }

    class Asteroid extends SpaceObject {
        constructor(options) {
            options = options || {};

            // Inheritance from SpaceObject
            super(options);

            this.size = options.size || Asteroid.Size.Max;
            this.points = [];

            let circlePoints = 15, pointRotation = 2*Math.PI / circlePoints;

            for(let i = 0; i < circlePoints; i++) {
                let rotation = i * pointRotation;

                let distortion = this.size * 0.15;
                let r = (this.size - distortion) + (Math.random()*distortion*2)

                let x = Math.round(r * Math.cos(rotation)), y = Math.round(r * Math.sin(rotation));

                this.points.push({
                    col: x,
                    row: y
                });
            }
        }
    }
    
    Asteroid.Size = {
        Max: 32,
        Large: 16,
        Medium: 10,
        Small: 5
    }

    class Plane extends SpaceObject {
        constructor(options) {
            super(options);

            this.size = options.size || 2;

            this.points = [
                { col: 0, row: this.size*5 },
                { col: this.size*(2), row: this.size*(-2) },
                { col: this.size*(-2), row: this.size*(-2) },
            ];
        }

        shoot() {
            let bulletSpeed = 50,
                bvx = Math.sin(this.rotate) * -bulletSpeed,
                bvy = Math.cos(this.rotate) * bulletSpeed;
            return new Bullet({
                center: { col: this.center.col, row: this.center.row },
                vx: bvx, vy: bvy
            });
        }
    }

    class Bullet extends SpaceObject {
        constructor(options) {
            super(options);

            this.alive = true;
        }

        move(elapsed, maxHeight, maxWidth) {
            super.move(elapsed);
            if(this.center.col < 0 || this.center.row < 0 ||
                (maxHeight && this.center.col > maxHeight)
                || (maxWidth && this.center.row > maxWidth))
                this.alive = false;
        }
    }

    Game();
})(this);