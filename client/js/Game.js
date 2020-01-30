import { SignIn } from './Auth.js';
import { UI } from './UI.js';
import { Player, Bullet, Enemy, Portal } from './Entities.js';
import { Maps } from './Maps.js';

// Meta variables
let WIDTH = window.innerWidth;
let HEIGHT = Math.min(Math.floor(WIDTH * 0.7), Math.floor(window.innerHeight * 0.7));
let socket = io();
new SignIn(socket);

// Gameplay variables
let inventory = new Inventory([], socket, false);
let lastScore = null;
let selfId = null;
let ui = new UI(socket, Player.list, selfId);
let usedItem = false; // Prevents holding down an item key

// HTML elements
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let canvasUI = document.getElementById("canvas-ui");
let ctxUI = canvasUI.getContext("2d");

// Key codes
let KeyCodes = {
    'right': 68, // maps to the d key
    'down': 83, // maps to s
    'left': 65, // maps to a
    'up': 87 // maps to w
}

new Maps('field', '/client/img/somemap1.png', '#2A9225');
new Maps('forest', '/client/img/map2.png', '#899925');
new Maps('grassland', '/client/img/map3.png', '#809D49');

let drawDisplay = function() {
    // Only draw once the player is logged in
    if(!selfId) return;

    let player = Player.list[selfId];

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    Maps.list[player.mapName].draw(WIDTH, HEIGHT, player);
    drawScore();
    ui.update(WIDTH, HEIGHT, Player.list, selfId);

    for(let i in Player.list) {
        Player.list[i].draw(WIDTH, HEIGHT);
    }
    for(let i in Bullet.list) {
        Bullet.list[i].draw(WIDTH, HEIGHT);
    }
    for(let i in Enemy.list) {
        Enemy.list[i].draw(WIDTH, HEIGHT);
    }
    for(let i in Portal.list) {
        Portal.list[i].draw(WIDTH, HEIGHT);
    }
}

let drawScore = function() {
    if(lastScore === Player.list[selfId].score) return;

    lastScore = Player.list[selfId].score;
    let scoreText = Player.list[selfId].score + " points";
    ctxUI.fillStyle = 'black';
    ctxUI.font = "20px Arial";
    ctxUI.clearRect(0, 0, 100, 50);
    ctxUI.fillText(scoreText, 10, 30);
}

let closeMenu = function() {
    if(selfId) {
        let player = Player.list[selfId];
        if(player.menu) {
            player.menu.remove();
            player.menu = null;
        }
    }
}

let resizeDisplay = function() {
    WIDTH = window.innerWidth;
    HEIGHT = Math.min(Math.floor(WIDTH * 0.7), Math.floor(window.innerHeight * 0.7));
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    canvasUI.width = WIDTH;
    canvasUI.height = HEIGHT;
    ui.update(WIDTH, HEIGHT, selfId);
}
resizeDisplay();

let goLeft = function() {
    closeMenu();
    socket.emit('keyPress', { inputId: 'left', state: true });
}
let stopLeft = function() {
    socket.emit('keyPress', { inputId: 'left', state: false });
}
let goRight = function() {
    closeMenu();
    socket.emit('keyPress', { inputId: 'right', state: true });
}
let stopRight = function() {
    socket.emit('keyPress', { inputId: 'right', state: false });
}
let goUp = function() {
    closeMenu();
    socket.emit('keyPress', { inputId: 'up', state: true });
}
let stopUp = function() {
    socket.emit('keyPress', { inputId: 'up', state: false });
}
let goDown = function() {
    closeMenu();
    socket.emit('keyPress', { inputId: 'down', state: true });
}
let stopDown = function() {
    socket.emit('keyPress', { inputId: 'down', state: false });
}

// init
socket.on('init', (data) => {
    if(data.selfId) selfId = data.selfId;
    if(selfId) {
        for(let i = 0; i < data.player.length; i++) {
            new Player(data.player[i], selfId, socket);
        }
        for(let i = 0; i < data.bullet.length; i++) {
            new Bullet(data.bullet[i]);
        }
        for(let i = 0; i < data.enemy.length; i++) {
            new Enemy(data.enemy[i]);
        }
        for(let i = 0; i < data.portal.length; i++) {
            new Portal(data.portal[i]);
        }
    }
});

// update
socket.on('update', (data) => {
    if(!selfId) return;
    // Todo: compression
    for(let i = 0; i < data.player.length; i++) {
        let pack = data.player[i];
        let p = Player.list[pack.id];
        if(p) {
            if(p.x !== undefined)
                p.x = pack.x;
            if(p.y !== undefined)
                p.y = pack.y;
            if(p.hp !== undefined)
                p.hp = pack.hp;
            if(p.score !== undefined)
                p.score = pack.score;
            if(p.mapName !== undefined)
                p.mapName = pack.mapName;
            if(p.username !== undefined)
                p.username = pack.username;
            if(p.friends !== undefined)
                p.friends = pack.friends;
            if(p.direction !== undefined)
                p.direction = pack.direction;
            if(p.isMoving !== undefined)
                p.isMoving = pack.isMoving;
            if(p.gender !== undefined)
                p.gender = pack.gender;
        } else {
            new Player(pack, selfId, socket);
        }
    }
    for(let i = 0; i < data.bullet.length; i++) {
        let pack = data.bullet[i];
        let b = Bullet.list[pack.id];
        if(b) {
            if(b.x !== undefined)
                b.x = pack.x;
            if(b.y !== undefined)
                b.y = pack.y;
            if(b.mapName !== undefined)
                b.mapName = pack.mapName;
        } else {
            new Bullet(pack);
        }
    }
    for(let i = 0; i < data.enemy.length; i++) {
        let pack = data.enemy[i];
        let e = Enemy.list[pack.id];
        if(e) {
            if(e.x !== undefined)
                e.x = pack.x;
            if(e.y !== undefined)
                e.y = pack.y;
            if(e.hp !== undefined)
                e.hp = pack.hp;
            if(e.hpMax !== undefined)
                e.hpMax = pack.hpMax;
            if(e.isMoving !== undefined)
                e.isMoving = pack.isMoving;
            if(e.direction !== undefined)
                e.direction = pack.direction;
        } else {
            new Enemy(pack);
        }
    }
});

// remove
socket.on('remove', (data) => {
    for(let i = 0; i < data.player.length; i++) {
        delete Player.list[data.player[i]];
    }
    for(let i = 0; i < data.bullet.length; i++) {
        delete Bullet.list[data.bullet[i]];
    }
    for(let i = 0; i < data.enemy.length; i++) {
        delete Enemy.list[data.enemy[i]];
    }
});

socket.on('updateInventory', (items) => {
    inventory.items = items;
    inventory.refreshRender();
});

// Draw frame every 40 ms
setInterval(() => drawDisplay(), 40);

// Animation updates every 100ms
setInterval(() => {
    // Only draw once the player is logged in
    if(!selfId) return;
    // Player
    for(let i in Player.list) {
        if(Player.list[i].isMoving)
            Player.list[i].srcY += 48;
    }

    // Enemy
    for(let i in Enemy.list) {
        Enemy.list[i].srcX += 32;
        if(Enemy.list[i].type == 1) { // gladiator
            if(Enemy.list[i].srcX >= 256) {
                Enemy.list[i].srcX = 0;
            }
            if(!Enemy.list[i].isMoving && Enemy.list[i].srcX >= 160) {
                Enemy.list[i].srcX = 0;
            }
        } else { // bat
            if(Enemy.list[i].srcX >= 96) {
                Enemy.list[i].srcX = 0;
            }
        }
    }

    // Portals
    for(let i in Portal.list) {
        Portal.list[i].srcX += 32;
    }
}, 100);

document.onkeydown = function(event) {
    if(event.keyCode === KeyCodes['right']) { // d
        goRight();
    } else if(event.keyCode === KeyCodes['down']) { // s
        goDown();
    } else if(event.keyCode === KeyCodes['left']) { // a
        goLeft();
    } else if(event.keyCode === KeyCodes['up']) { // w
        goUp();
    }

    if(!usedItem) {
        for(let i in inventory.items) {
            let item = Item.list[inventory.items[i].id]
            if(item.key === 'z') {
                if(event.keyCode === 90) { // z
                    socket.emit('useItem', inventory.items[i].id);
                    usedItem = true;
                }
            }
            else if(item.key === 'x') {
                if(event.keyCode === 88) { // x
                    socket.emit('useItem', inventory.items[i].id);
                    usedItem = true;
                }
            }
        }
    }
}

document.onkeyup = function(event) {
    if(event.keyCode === KeyCodes['right']) { // d
        stopRight();
    } else if(event.keyCode === KeyCodes['down']) { // s
        stopDown();
    } else if(event.keyCode === KeyCodes['left']) { // a
        stopLeft();
    } else if(event.keyCode === KeyCodes['up']) { // w
        stopUp();
    }

    if(event.keyCode === 90 || event.keyCode === 88) {
        usedItem = false;
    }
}

document.ontouchstart = function(event) {
    if(event.target.id === 'ui' || event.target.id === 'ctx-ui') {
        // Update touch location
        let clientX = event.touches[0].clientX;
        let clientY = event.touches[0].clientY;
        var x = -(WIDTH/2) + clientX;
        var y = -(HEIGHT/2) + clientY;
        var angle = Math.atan2(y, x) / Math.PI * 180;
        socket.emit('keyPress', { inputId: 'mouseAngle', state: angle });

        // Attack when tapping on screen
        socket.emit('keyPress', { inputId: 'attack', state: true });
    }
    else if(event.target.id === 'moveRight')
        goRight();
    else if(event.target.id === 'moveDown')
        goDown();
    else if(event.target.id === 'moveLeft')
        goLeft();
    else if(event.target.id === 'moveUp')
        goUp();
}

document.onmousedown = function(event) {
    const self = Player.list[selfId];
    if(event.target.parentElement.id !== "playerMenu") {
        closeMenu();
    }
    if(event.button === 0) {
        if(event.target.id === 'ui' || event.target.id === 'canvas-ui')
            socket.emit('keyPress', { inputId: 'attack', state: true });
        else if(event.target.id === 'moveRight') {
            goRight();
        }
        else if(event.target.id === 'moveDown') {
            goDown();
        }
        else if(event.target.id === 'moveLeft') {
            goLeft();
        }
        else if(event.target.id === 'moveUp') {
            goUp();
        }
    } else if(event.button === 2) {
        //let menu = document.getElementById('playerMenu');
        if(self && !self.menu) {
            for(let i in Player.list) {
                var p = Player.list[i];

                const mouseX = event.clientX - WIDTH/2 + self.x;
                const mouseY = event.clientY - HEIGHT/2 + self.y;
                ui.friendReq(mouseX, mouseY, self, p);
            }
        }
    }
}

document.ontouchend = function(event) {
    if(event.target.id === 'ui' || event.target.id === 'canvas-ui')
        socket.emit('keyPress', { inputId: 'attack', state: false });
    else if(event.target.id === 'moveRight')
        stopRight();
    else if(event.target.id === 'moveDown')
        stopDown();
    else if(event.target.id === 'moveLeft')
        stopLeft();
    else if(event.target.id === 'moveUp')
        stopUp();
}

document.onmouseup = function(event) {
    if(event.target.id === 'ui' || event.target.id === 'canvas-ui')
        socket.emit('keyPress', { inputId: 'attack', state: false });
    else if(event.target.id === 'moveRight')
        stopRight();
    else if(event.target.id === 'moveDown')
        stopDown();
    else if(event.target.id === 'moveLeft')
        stopLeft();
    else if(event.target.id === 'moveUp')
        stopUp();
}

document.onmousemove = function(event) {
    var x = -(WIDTH/2) + event.clientX;
    var y = -(HEIGHT/2) + event.clientY;
    var angle = Math.atan2(y, x) / Math.PI * 180;
    socket.emit('keyPress', { inputId: 'mouseAngle', state: angle });
}

document.ontouchmove = function(event) {

    if(event.target.id !== 'ui' && event.target.id !== 'canvas-ui') return;
    let clientX = event.touches[0].clientX;
    let clientY = event.touches[0].clientY;
    //console.log(event);
    var x = -(WIDTH/2) + clientX;
    var y = -(HEIGHT/2) + clientY;
    var angle = Math.atan2(y, x) / Math.PI * 180;
    socket.emit('keyPress', { inputId: 'mouseAngle', state: angle });
}

// Disable right click
document.addEventListener('contextmenu', event => event.preventDefault());

window.addEventListener('resize', () => {
    resizeDisplay();
    drawDisplay();
});

window.addEventListener('beforeunload', () => {
    socket.emit('reqRemove');
    socket.emit('logOut', { username: Player.list[selfId].username });
});