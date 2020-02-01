
let Inventory = require('../client/js/Inventory.js');
let Maps = require('./Maps.js');

let initPack = { player: [], bullet: [], enemy: [], portal: [], potion: [], coin: [] };
let removePack = { player: [], bullet: [], enemy: [], potion: [], coin: [] };

class Entity {
    constructor(param) {
        this.x = 250,
        this.y = 250,
        this.spdX = 0,
        this.spdY = 0,
        this.id = "",
        this.mapName = "forest"
        if(param) {
            if(param.x) this.x = param.x;
            if(param.y) this.y = param.y;
            if(param.mapName) this.mapName = param.mapName;
            if(param.id) this.id = param.id;
        }
        this.map = Maps.list[this.mapName];
    }
    update() {
        this.updatePosition();
    }
    updatePosition() {
        this.x += this.spdX;
        this.y += this.spdY;
    }
    getDistance(pt) {
        return Math.sqrt(Math.pow(this.x - pt.x, 2) + Math.pow(this.y - pt.y, 2));
    }

    static getFrameUpdateData() {
        let pack = {
            initPack: {
                player: initPack.player,
                bullet: initPack.bullet,
                enemy: initPack.enemy,
                portal: initPack.portal,
                potion: initPack.potion,
                coin: initPack.coin
            },
            removePack: {
                player: removePack.player,
                bullet: removePack.bullet,
                enemy: removePack.enemy,
                potion: removePack.potion,
                coin: removePack.coin
            },
            updatePack: {
                player: Player.update(),
                bullet: Bullet.update(),
                enemy: Enemy.update(),
                portal: Portal.update(),
                potion: Potion.update(),
                coin: Coin.update()
            }
        }
        
        initPack.player = [];
        initPack.bullet = [];
        initPack.enemy = [];
        initPack.portal = [];
        initPack.potion = [];
        initPack.coin = [];
        removePack.player = [];
        removePack.bullet = [];
        removePack.enemy = [];
        removePack.potion = [];
        removePack.coin = [];
    
        return pack;
    }
}


class Player extends Entity {
    static list = {};
    constructor(param) {
        super(param);
        this.username = param.username;
        this.socket = param.socket;
        this.pressingRight = false;
        this.pressingLeft = false;
        this.pressingUp = false;
        this.pressingDown = false;
        this.pressingAttack = false;
        this.mouseAngle = 0;
        this.maxSpd = 10;
        this.hp = 10;
        this.hpMax = 10;
        this.score = 0;
        this.reloadTime = 3;
        this.reload = 0;
        this.direction = 0; // 0 - forwards/down, 1 - left, 2 backwards/up, 3 - right
        this.isMoving = false;
        this.inventory = new Inventory(param.progress.items, param.socket, true, this);
        this.friends = param.progress.friends || {};
        this.gender = 0; // 0 - boy, 1 - girl
        if(param.progress.gender) {
            this.gender = param.progress.gender;
        }
        if(param.progress.x) {
            this.x = param.progress.x;
        }
        if(param.progress.y) {
            this.y = param.progress.y;
        }
        if(param.progress.mapName) {
            this.mapName = param.progress.mapName;
            this.map = Maps.list[this.mapName];
        } else {
            this.mapName = 'forest';
            this.map = Maps.list[this.mapName];
        }
        if(param.progress.score) {
            this.score = param.progress.score;
        }
        this.inventory.addItem('potion', 1);

        Player.list[this.id] = this;
        initPack.player.push(this.getInitPack());
    }


    update() {
        this.updateSpd();
        
        if(this.spdX < 0 && this.x <= 0) this.spdX = 0;
        if(this.spdY < 0 && this.y <= 0) this.spdY = 0;

        if(this.spdX > 0 && this.x >= Maps.list[this.mapName].width) this.spdX = 0;
        if(this.spdY > 0 && this.y >= Maps.list[this.mapName].height) this.spdY = 0;

        if(this.spdX != 0 || this.spdY != 0) this.isMoving = true;
        else this.isMoving = false;
        super.update();

        if(this.reload > 0) this.reload--;
        if(this.pressingAttack) {
            if(this.reload == 0) {
                this.shootBullet(this.mouseAngle);
                this.reload = this.reloadTime;
            }
        }
    }
    addFriend = function(friendId) {
        let friendUsername = Player.list[friendId].username;
        this.friends[friendUsername] = 1;
    }
    removeFriend = function(friendId) {
        let friendUsername = Player.list[friendId].username;
        this.friends[friendUsername] = 0;
    }
    shootBullet = function(angle) {
        //if(Math.random() < 0.1)
            //this.inventory.addItem('potion', 1);
        new Bullet({
            parent: this.id,
            angle,
            x: this.x,
            y: this.y,
            mapName: this.mapName
        });
    }

    // Overwrites entitys updatePosition
    updateSpd = function() {
        if(this.pressingRight)
            this.spdX = this.maxSpd;
        else if(this.pressingLeft)
            this.spdX = -this.maxSpd;
        else
            this.spdX = 0;
        if(this.pressingDown)
            this.spdY = this.maxSpd;
        else if(this.pressingUp)
            this.spdY = -this.maxSpd;
        else
            this.spdY = 0;

        /*if(this.spdY > 0 && this.spdY >= this.spdX) this.direction = 0;
        else if(this.spdY < 0 && this.spdY <= this.spdX) this.direction = 2;

        if(this.spdX > 0 && this.spdX >= this.spdY) this.direction = 3;
        else if(this.spdX < 0 && this.spdX <= this.spdY) this.direction = 1;*/
    }

    getInitPack = function() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            friends: this.friends,
            username: this.username,
            hp: this.hp,
            hpMax: this.hpMax,
            score: this.score,
            mapName: this.mapName,
            gender: this.gender
        };
    }

    getUpdatePack = function() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            friends: this.friends,
            username: this.username,
            hp: this.hp,
            score: this.score,
            mapName: this.mapName,
            direction: this.direction,
            isMoving: this.isMoving,
            gender: this.gender
        };
    }

    sendInitPack = function() {
        this.socket.emit('init', {
            selfId: this.socket.id,
            player: Player.getAllInitPack(),
            bullet: Bullet.getAllInitPack(),
            enemy: Enemy.getAllInitPack(),
            portal: Portal.getAllInitPack(),
            potion: Potion.getAllInitPack(),
            coin: Coin.getAllInitPack()
        });
    }

    changeMap() {
        if(this.mapName === 'field') {
            this.mapName = 'forest';
            this.map = Maps.list[this.mapName];
        } else if(this.mapName === 'forest') {
            this.mapName = 'field';
            this.map = Maps.list[this.mapName];
        }/* else if(this.mapName === 'grassland') {
            this.mapName = 'field';
            this.map = Maps.list[this.mapName];
        }*/
        this.x = Math.random() * Maps.list[this.mapName].width;
        this.y = Math.random() * Maps.list[this.mapName].height;
    }
}

Player.onConnect = function(socket, username, progress, account) {
    let player = new Player({
        username,
        id: socket.id,
        socket,
        progress,
        account
    });

    // Check if player has items
    player.inventory.refreshRender();

    socket.on('keyPress', (data) => {
        if(data.inputId === 'left') {
            player.pressingLeft = data.state;
        } else if(data.inputId === 'right') {
            player.pressingRight = data.state;
        } else if(data.inputId === 'up') {
            player.pressingUp = data.state;
        } else if(data.inputId === 'down') {
            player.pressingDown = data.state;
        } else if(data.inputId === 'attack') {
            player.pressingAttack = data.state;
        } else if(data.inputId === 'mouseAngle') {
            player.mouseAngle = data.state;
            let angle = player.mouseAngle + 180;

            if(angle >= 45 && angle <= 135) {
                player.direction = 2;
            } else if(angle >= 135 && angle <= 225) {
                player.direction = 3;
            } else if(angle >= 225 && angle <= 315) {
                player.direction = 0;
            } else {
                player.direction = 1;
            }

        }
    });

    socket.on('changeMap', (data) => {
        player.changeMap();
    });

    socket.on('spawnMonster', (data) => {
        Enemy.spawnEnemies(data.number, data.mapName);
    });

    socket.on('addFriend', (data) => { // data: { friendId }
        //Player.list[socket.id].addFriend(data.friendId);
        Player.list[data.friendId].socket.emit("requestFriend", socket.id);
        //Player.list[socket.id].socket.emit("addToChat", "Added " + Player.list[data.friendId].username + " as a friend.");

    });
    socket.on('confirmFriend', (data) => {
        Player.list[socket.id].addFriend(data);
        Player.list[data].addFriend(socket.id);
        Player.list[socket.id].socket.emit('addToChat', Player.list[data].username + " was added as a friend!");
        Player.list[data].socket.emit('addToChat', Player.list[socket.id].username + " was added as a friend!");
    });

    socket.on('removeFriend', (data) => { // data: { friendId }
        Player.list[socket.id].removeFriend(data);
        Player.list[data].removeFriend(socket.id);
        Player.list[socket.id].socket.emit('addToChat', Player.list[data].username + " was removed as a friend!");
        Player.list[data].socket.emit('addToChat', Player.list[socket.id].username + " was removed as a friend!");
    });

    socket.on('sendMsgToServer', (data) => { // data: ''
        for(let i in Player.list) {
            Player.list[i].socket.emit('addToChat', player.username + ': ' + data);
        }
    });

    socket.on('sendPmToServer', (data) => { // data: { username, message }
        let recipientSocket = null;
        for(let i in Player.list) {
            if(Player.list[i].username === data.username) {
                recipientSocket = Player.list[i].socket;
            }
        }
        if(recipientSocket === null) {
            socket.emit('addToChat', 'The player ' + data.username + ' is not online.');
        } else {
            recipientSocket.emit('addToChat', 'From ' + player.username + ': ' + data.message)
            socket.emit('addToChat', 'To ' + data.username + ': ' + data.message)
        }
    });
    
    for(let i in Player.list) {
        Player.list[i].sendInitPack();
    }
}

Player.getAllInitPack = function() {
    let players = [];
    for(let i in Player.list) {
        players.push(Player.list[i].getInitPack());
    }
    return players;
}

Player.onDisconnect = function(socket) {
    delete Player.list[socket.id];
    removePack.player.push(socket.id);
}

// Updates all players in Player.list
Player.update = function() {
    let pack = [];

    for(let i in Player.list) {
        let player = Player.list[i];
        player.update();
        pack.push(player.getUpdatePack());
    }
    return pack;
}



class Enemy extends Entity {
    static list = {};
    static count = 0;
    constructor(param) {
        super(param);
        this.id = Math.random();
        this.maxSpd = 5;
        this.hp = 10;
        this.hpMax = 10;
        this.toRemove = false;
        this.type = 0; // 0 - bat, 1 - gladiator
        this.isMoving = false;
        this.direction = 0; // 0 - forwards/down, 1 - left, 2 backwards/up, 3 - right

        if(Math.random() < 0.5) { // 50% chance of being a bat or a gladiator
            this.type = 1;
        }

        Enemy.count++;
        Enemy.list[this.id] = this;
        initPack.enemy.push(this.getInitPack());
    }

    update() {
        if(Math.random() < 0.4) {
            // Look for a player to follow
            for(let i in Player.list) {
                var p = Player.list[i];
                if(this.mapName === p.mapName && this.getDistance(p) < 300) {
                    if(p.x > this.x) this.spdX = this.maxSpd;
                    else this.spdX = -this.maxSpd;

                    if(p.y > this.y) this.spdY = this.maxSpd;
                    else this.spdY = -this.maxSpd;
                }
            }
        } else {
            // Move randomly
            let xrand = Math.random();
            if(xrand < 0.1) this.spdX = this.maxSpd;
            else if(xrand < 0.2) this.spdX = -this.maxSpd;
            else if(xrand < 0.25) this.spdX = 0;
            
            let yrand = Math.random();
            if(yrand < 0.1) this.spdY = this.maxSpd;
            else if(yrand < 0.2) this.spdY = -this.maxSpd;
            else if(yrand < 0.25) this.spdY = 0;
        }

        // Stop at map boundaries
        if(this.spdX < 0 && this.x <= 0) this.spdX = 0;
        if(this.spdY < 0 && this.y <= 0) this.spdY = 0;
        if(this.spdX > 0 && this.x >= Maps.list[this.mapName].width) this.spdX = 0;
        if(this.spdY > 0 && this.y >= Maps.list[this.mapName].height) this.spdY = 0;

        for(let i in Player.list) {
            var p = Player.list[i];
            if(this.mapName === p.mapName && this.getDistance(p) < 32) {
                p.hp -= 1;
                
                if(p.hp <= 0) {
                    // Respawn target
                    p.socket.emit('addToChat', "You died and lost " + p.score + " points.");
                    p.score = 0;
                    p.hp = p.hpMax;
                    p.mapName = 'forest';
                    p.x = Math.random() * Maps.list[p.mapName].width;
                    p.y = Math.random() * Maps.list[p.mapName].height;
                }
            }
        }

        if(this.spdX != 0 || this.spdY != 0) this.isMoving = true;
        else this.isMoving = false;

        
        /*if(this.spdY > 0 && this.spdY >= this.spdX) this.direction = 0;
        else if(this.spdY < 0 && this.spdY <= this.spdX) this.direction = 2;

        if(this.spdX > 0 && this.spdX >= this.spdY) this.direction = 3;
        else if(this.spdX < 0 && this.spdX <= this.spdY) this.direction = 1;*/
        
        super.update();
    }

    kill() {
        this.toRemove = true;
    }

    getInitPack() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            hp: this.hp,
            hpMax: this.hpMax,
            mapName: this.mapName,
            type: this.type
        };
    }

    getUpdatePack() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            hp: this.hp,
            hpMax: this.hpMax,
            mapName: this.mapName,
            type: this.type,
            isMoving: this.isMoving,
            direction: this.direction
        };
    }
}

Enemy.spawnEnemies = function(number, mapName) {
    console.log("spawned " + number + " enemies");
    for(let i = 0; i < number; i++) {
        let randAreaX = Math.floor(Math.random() * Maps.list[mapName].width)
        let randAreaY = Math.floor(Math.random() * Maps.list[mapName].height)
        new Enemy({
            x: randAreaX,
            y: randAreaY,
            mapName: mapName
        });
    }
}

// Updates all enemies in Enemy.list
Enemy.update = function() {
    
    let pack = [];

    // Call update function for all enemies
    for(let i in Enemy.list) {
        let enemy = Enemy.list[i];
        enemy.update();
        if(enemy.toRemove) {
            Enemy.count--;
            delete Enemy.list[i];
            removePack.enemy.push(enemy.id);
        } else {
            pack.push(enemy.getUpdatePack());
        }
    }
    return pack;
}

Enemy.getAllInitPack = function() {
    let enemies = [];
    for(let i in Enemy.list) {
        enemies.push(Enemy.list[i].getInitPack());
    }
    return enemies;
}


class Bullet extends Entity{
    static list = {};
    constructor(param) {
        super(param);
        this.id = Math.random();
        this.angle = param.angle;
        this.spdX = Math.cos(this.angle/180*Math.PI) * 20;
        this.spdY = Math.sin(this.angle/180*Math.PI) * 20;
        this.parent = param.parent;
        this.timer = 0;
        this.toRemove = false;

        Bullet.list[this.id] = this;
        initPack.bullet.push(this.getInitPack());
    }

    update() {
        if(this.timer++ > 100) {
            this.toRemove = true;
        }
        super.update();

        // Check if hitting a player
        for(let i in Player.list) {
            var p = Player.list[i];
            if(this.mapName === p.mapName && this.getDistance(p) < 32 && this.parent !== p.id && !Player.list[this.parent].friends[p.username]) {
                p.hp -= 1;
                
                if(p.hp <= 0) {
                    // Give point to shooter
                    let shooter = Player.list[this.parent];
                    // shooter may have disconnected
                    if(shooter) {
                        shooter.score += p.score;
                    }

                    Player.list[this.parent].socket.emit('addScore', { x: p.x, y: p.y, points: p.score });

                    // Respawn target
                    p.socket.emit('addToChat', "You died and lost " + p.score + " points.");
                    p.score = 0;
                    p.hp = p.hpMax;
                    p.mapName = 'forest';
                    p.x = Math.random() * Maps.list[p.mapName].width;
                    p.y = Math.random() * Maps.list[p.mapName].height;
                }
                this.toRemove = true;
            }
        }

        // Check if hitting an enemy
        for(let i in Enemy.list) {
            var e = Enemy.list[i];
            if(this.mapName === e.mapName && this.getDistance(e) < 32 && this.parent !== e.id) {
                e.hp -= 1;
                
                if(e.hp <= 0 && e.toRemove == false) {
                    // Give point to shooter
                    let shooter = Player.list[this.parent];
                    // shooter may have disconnected
                    if(shooter) {
                        shooter.score += 1;
                        shooter.socket.emit('addScore', { x: e.x, y: e.y, points: 1 });
                    }

                    // Respawn target
                    /*p.hp = p.hpMax;
                    p.x = Math.random() * 640;
                    p.y = Math.random() * 480;*/
                    e.toRemove = true;
                }
                this.toRemove = true;
            }
        }
    }
    
    getInitPack() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            mapName: this.mapName
        };
    }
    
    getUpdatePack() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            mapName: this.mapName
        };
    }
}

// Updates all bullets in Bullet.list
Bullet.update = function() {
    
    let pack = [];

    for(let i in Bullet.list) {
        let bullet = Bullet.list[i];
        bullet.update();
        if(bullet.toRemove) {
            delete Bullet.list[i];
            removePack.bullet.push(bullet.id);
        } else {
            pack.push(bullet.getUpdatePack());
        }
    }
    return pack;
}

Bullet.getAllInitPack = function() {
    let bullets = [];
    for(let i in Bullet.list) {
        bullets.push(Bullet.list[i].getInitPack());
    }
    return bullets;
}


class Portal extends Entity{
    static list = {};
    constructor(param) {
        super(param);
        this.id = Math.random();

        Portal.list[this.id] = this;
        initPack.portal.push(this.getInitPack());
    }

    update() {
        super.update();

        // Check if hitting a player
        for(let i in Player.list) {
            var p = Player.list[i];
            if(this.mapName === p.mapName && this.getDistance(p) < 32) {
                // Change map
                p.changeMap();
                
            }
        }
    }
    
    getInitPack() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            mapName: this.mapName
        };
    }
    
    getUpdatePack() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            mapName: this.mapName
        };
    }
}

// Updates all portals in Portal.list
Portal.update = function() {
    
    let pack = [];

    for(let i in Portal.list) {
        let portal = Portal.list[i];
        portal.update();
        pack.push(portal.getUpdatePack());
    }
    return pack;
}

Portal.getAllInitPack = function() {
    let portals = [];
    for(let i in Portal.list) {
        portals.push(Portal.list[i].getInitPack());
    }
    return portals;
}


class Potion extends Entity{
    static list = {};
    static count = 0;
    constructor(param) {
        super(param);
        this.id = Math.random();
        this.toRemove = false;

        Potion.count++;
        Potion.list[this.id] = this;
        initPack.potion.push(this.getInitPack());
    }

    update() {
        super.update();

        // Check if hitting a player
        for(let i in Player.list) {
            var p = Player.list[i];
            if(this.mapName === p.mapName && this.getDistance(p) < 32) {
                // Change map
                p.inventory.addItem('potion', 1);
                this.toRemove = true;
                Potion.count--;
            }
        }
    }
    
    getInitPack() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            mapName: this.mapName
        };
    }
    
    getUpdatePack() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            mapName: this.mapName
        };
    }
}

Potion.spawn = function(x, y, mapName) {
    console.log('new potion at x: ' + x + ', y: ' + y + ' on ' + mapName);
    new Potion({ x, y, mapName });
}

// Updates all potions in Potion.list
Potion.update = function() {
    
    let pack = [];

    for(let i in Potion.list) {
        let potion = Potion.list[i];
        potion.update();
        if(potion.toRemove) {
            delete Potion.list[i];
            removePack.potion.push(potion.id);
        } else {
            pack.push(potion.getUpdatePack());
        }
        pack.push(potion.getUpdatePack());
    }
    return pack;
}

Potion.getAllInitPack = function() {
    let potions = [];
    for(let i in Potion.list) {
        potions.push(Potion.list[i].getInitPack());
    }
    return potions;
}


class Coin extends Entity{
    static list = {};
    static count = 0;
    constructor(param) {
        super(param);
        this.id = Math.random();
        this.toRemove = false;
        Coin.count++;

        Coin.list[this.id] = this;
        initPack.coin.push(this.getInitPack());
    }

    update() {
        super.update();

        // Check if hitting a player
        for(let i in Player.list) {
            var p = Player.list[i];
            if(this.mapName === p.mapName && this.getDistance(p) < 32) {
                // Change map
                p.score += 5;
                this.toRemove = true;
                Coin.count--;
            }
        }
    }
    
    getInitPack() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            mapName: this.mapName
        };
    }
    
    getUpdatePack() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            mapName: this.mapName
        };
    }
}

Coin.spawn = function(x, y, mapName) {
    console.log('new coin at x: ' + x + ', y: ' + y + ' on ' + mapName);
    new Coin({ x, y, mapName });
}

// Updates all coins in Coin.list
Coin.update = function() {
    
    let pack = [];

    for(let i in Coin.list) {
        let coin = Coin.list[i];
        coin.update();
        if(coin.toRemove) {
            delete Coin.list[i];
            removePack.coin.push(coin.id);
        } else {
            pack.push(coin.getUpdatePack());
        }
        pack.push(coin.getUpdatePack());
    }
    return pack;
}

Coin.getAllInitPack = function() {
    let coins = [];
    for(let i in Coin.list) {
        coins.push(Coin.list[i].getInitPack());
    }
    return coins;
}

module.exports = {
    Player,
    Enemy,
    Bullet,
    Portal,
    Entity,
    Potion,
    Coin
}