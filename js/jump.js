$(document).ready(function(){
    var canvas = document.getElementById('jumpCanvas');
    var bCanvas = document.getElementById('backgroundCanvas');
    var ctx = canvas.getContext('2d');
    var ctx2 = bCanvas.getContext('2d');
    var FPS = 30;
    var CHARACTER_SIZE = 40;
    var start;
    var end;
    var startChar;
    var movement;
    var oldY;
    var killTimer;
    var towers = [];
    var curScore = 0;

    // images
    var idle = new Image();
    var fall = new Image();
    var up = new Image();
    var hit = new Image();
    var cap = new Image();

    function prepareImages() {
        idle.src = './images/jump/idle.png';
        fall.src = './images/jump/fall.png';
        up.src = './images/jump/up.png';
        hit.src = './images/jump/hit.png';
        cap.src = './images/jump/tile.png';
        var loadImage = function(img) {
            var deferred = $.Deferred();
            img.onload = function() {
                deferred.resolve();
            };
            return deferred.promise();
        }
        $.when.apply(null, [loadImage(idle), loadImage(fall), loadImage(up), loadImage(hit), loadImage(cap)]).done(function() {
            drawForeground();
            drawCharacter();
        });
    }

    function cleanup() {
        movement = null;
        killTimer = null;
        oldY = null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        towers = [];
        drawForeground();
        drawCharacter();
    }

    function setScore(score) {
        if (score === undefined) {
            $('.score').text(++curScore);
        } else {
            curScore = score;
            $('.score').text(score);
        }
    }

    function createMovement() {
        movement = {
            x: startChar.x,
            y: startChar.y,
            speed: Math.sqrt(Math.pow(end.x - startChar.x, 2) + Math.pow(end.y - startChar.y, 2)),
            angle: Math.atan2(-(end.y - startChar.y), end.x - startChar.x) * 180 / Math.PI,
            time: 0
        };
    }

    function detectCollision(x, y, adjWidth, adjHeight) {
        var collision = false;
        var landed = false;
        if (x < 0 || y < 0 || x > (700 - adjWidth) || y > (500 - adjHeight)) {
            collision = true;
        }
        if ((x + adjWidth) > towers[1].x && (y + adjHeight) > towers[1].y) {
            collision = true;
        }
        if ((x + adjWidth) > towers[1].x && x < (towers[1].x + towers[1].width) && (y + adjHeight) < (towers[1].y + 5) && (y + adjHeight) > (towers[1].y - 5)) {
            landed = true;
        }
        return {
            collision: collision,
            landed: landed
        };
    }

    function moveCharacter() {
        var x = movement.speed * Math.cos(movement.angle * Math.PI/180) * movement.time + movement.x;
        var y = movement.speed * Math.sin(movement.angle * Math.PI/180) * movement.time -0.5 * 30 * Math.pow(movement.time, 2);
        y = movement.y - y;

        var curImage = hit;
        var adjWidth = CHARACTER_SIZE;
        var adjHeight = CHARACTER_SIZE * curImage.height/curImage.width;
        var collision = detectCollision(x, y, adjWidth, adjHeight);
        if (collision.landed) {
            drawCharacter(1);
            if (!killTimer) {
                setScore();
                killTimer = setTimeout(cleanup, 1000);
            }
        } else {
            if (collision.collision) {
                if (!killTimer) {
                    setScore(0);
                    killTimer = setTimeout(cleanup, 1500);
                }
            } else {
                curImage = (oldY > y) ? fall : up;
                adjWidth = CHARACTER_SIZE;
                adjHeight = CHARACTER_SIZE * curImage.height / curImage.width;
                movement.time += 0.05;
            }
            ctx.drawImage(curImage, x, y, adjWidth, adjHeight);
            oldY = y;
        }
    }

    function createTower(width) {
        var min = 200;
        var max = 400;
        return {
            x: 100 + (400 * towers.length),
            y: Math.floor(Math.random() * (max - min + 1)) + min,
            width: width
        };
    }

    function drawForeground() {
        ctx2.clearRect(0, 0, canvas.width, canvas.height);
        var adjWidth = 60;
        var adjHeight = 60 * cap.height / cap.width;
        var renderTower = function(tower) {
            ctx2.fillStyle = '#3A200B';
            ctx2.strokeStyle = '#3A200B';
            ctx2.beginPath();
            ctx2.moveTo(tower.x, tower.y);
            ctx2.lineTo(tower.x, bCanvas.height);
            ctx2.lineTo(tower.x + adjWidth, bCanvas.height);
            ctx2.lineTo(tower.x + adjWidth, tower.y);
            ctx2.closePath();
            ctx2.fill();
            ctx2.stroke();
            ctx2.drawImage(cap, tower.x, tower.y, adjWidth, adjHeight);
        };

        towers.push(createTower(adjWidth));
        towers.push(createTower(adjWidth));
        renderTower(towers[0]);
        renderTower(towers[1]);
    }

    function drawCharacter(index) {
        index = (index !== undefined) ? index : 0;
        var adjWidth = CHARACTER_SIZE;
        var adjHeight = CHARACTER_SIZE * idle.height / idle.width;
        startChar = {
            x: towers[index].x+10,
            y: towers[index].y - adjHeight
        };
        ctx.drawImage(idle, startChar.x, startChar.y, adjWidth, adjHeight);
    }

    function draw() {
        setTimeout(function() {
            requestAnimationFrame(draw);
            if (movement) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                moveCharacter();
            } else if (start && end) {
                var adjWidth = CHARACTER_SIZE;
                var adjHeight = CHARACTER_SIZE * idle.height / idle.width;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawCharacter();
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 10;
                ctx.beginPath();
                ctx.moveTo(startChar.x + (adjWidth), startChar.y + (adjHeight/2));
                ctx.lineTo(end.x, end.y);
                ctx.closePath();
                ctx.stroke();
            }
        }, 1000 / FPS);
    }

    prepareImages();
    draw();

    $('#jumpCanvas').bind('touchstart mousedown', function(evt) {
        var x = (evt.type === 'touchstart') ? evt.originalEvent.touches[0].clientX : evt.offsetX;
        var y = (evt.type === 'touchstart') ? evt.originalEvent.touches[0].clientY : evt.offsetY;
        if (!movement) {
            start = {x: x, y: y};
        }
    });
    $('#jumpCanvas').bind('touchmove mousemove', function(evt) {
        var x = (evt.type === 'touchmove') ? evt.originalEvent.touches[0].clientX : evt.offsetX;
        var y = (evt.type === 'touchmove') ? evt.originalEvent.touches[0].clientY : evt.offsetY;
        if (start && !movement) {
            end = {x: x, y: y};
        }
    });
    $('#jumpCanvas').bind('touchend mouseup', function(evt) {
        var x;
        var y;
        if (evt.type !== 'touchend') {
            x = evt.offsetX;
            y = evt.offsetY;
        }
        if (start && !movement) {
            if (evt.type !== 'touchend') {
                end = {x: evt.offsetX, y: evt.offsetY};
            }
            createMovement();
            start = null;
            end = null;
        }
    });
});