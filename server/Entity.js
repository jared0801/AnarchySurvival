
let Inventory = require('../client/js/Inventory');

let initPack = { player: [], bullet: [], enemy: [] };
let removePack = { player: [], bullet: [], enemy: [] };

let Entity = function(param) {
    let self = {
        x: 250,
        y: 250,
        spdX: 0,
        spdY: 0,
        id: "",
        map: "forest"
    }
    if(param) {
        if(param.x) self.x = param.x;
        if(param.y) self.y = param.y;
        if(param.map) self.map = param.map;
        if(param.id) self.id = param.id;
    }
    self.update = function() {
        self.updatePosition();
    }
    self.updatePosition = function() {
        self.x += self.spdX;
        self.y += self.spdY;
    }
    self.getDistance = function(pt) {
        return Math.sqrt(Math.pow(self.x - pt.x, 2) + Math.pow(self.y - pt.y, 2));
    }
    return self
}
Entity.getFrameUpdateData = function() {
    let pack = {
        initPack: {
            player: initPack.player,
            bullet: initPack.bullet,
            enemy: initPack.enemy
        },
        removePack: {
            player: removePack.player,
            bullet: removePack.bullet,
            enemy: removePack.enemy
        },
        updatePack: {
            player: Player.update(),
            bullet: Bullet.update(),
            enemy: Enemy.update()
        }
    }
    
    initPack.player = [];
    initPack.bullet = [];
    initPack.enemy = [];
    removePack.player = [];
    removePack.bullet = [];
    removePack.enemy = [];

    return pack;
}


let Enemy = function(param) {
    let self = Entity(param);
    self.id = Math.random();
    self.maxSpd = 5;
    self.hp = 10;
    self.hpMax = 10;
    self.toRemove = false;

    let super_update = self.update;
    self.update = function() {
        if(Math.random() < 0.4) {
            for(let i in Player.list) {
                var p = Player.list[i];
                if(self.map === p.map && self.getDistance(p) < 300) {
                    if(p.x > self.x) self.spdX = self.maxSpd;
                    else self.spdX = -self.maxSpd;

                    if(p.y > self.y) self.spdY = self.maxSpd;
                    else self.spdY = -self.maxSpd;
                }
            }
        } else {
            let xrand = Math.random();
            if(xrand < 0.1) self.spdX = self.maxSpd;
            else if(xrand < 0.2) self.spdX = -self.maxSpd;
            else if(xrand < 0.25) self.spdX = 0;
            
            let yrand = Math.random();
            if(yrand < 0.1) self.spdY = self.maxSpd;
            else if(yrand < 0.2) self.spdY = -self.maxSpd;
            else if(yrand < 0.25) self.spdY = 0;
        }

        for(let i in Player.list) {
            var p = Player.list[i];
            if(self.map === p.map && self.getDistance(p) < 32) {
                p.hp -= 1;
                
                if(p.hp <= 0) {
                    // Respawn target
                    p.hp = p.hpMax;
                    p.x = Math.random() * 500;
                    p.y = Math.random() * 500;
                }
            }
        }

        

        //self.spdX = Math.floor(Math.random()*11) - 5;
        //self.spdY = Math.floor(Math.random()*11) - 5;
        super_update();
    }

    self.getInitPack = function() {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
            hp: self.hp,
            hpMax: self.hpMax,
            map: self.map
        };
    }

    self.getUpdatePack = function() {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
            hp: self.hp,
            map: self.map
        };
    }

    Enemy.list[self.id] = self;
    initPack.enemy.push(self.getInitPack());
    return self;
}
Enemy.list = {};

// Updates all bullets in Bullet.list
Enemy.update = function() {
    
    let pack = [];

    for(let i in Enemy.list) {
        let enemy = Enemy.list[i];
        enemy.update();
        if(enemy.toRemove) {
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


let Player = function(param) {
    let self = Entity(param);
    //self.number = "" + Math.floor(10* Math.random());
    self.username = param.username;
    self.socket = param.socket;
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.pressingAttack = false;
    self.mouseAngle = 0;
    self.maxSpd = 10;
    self.hp = 10;
    self.hpMax = 10;
    self.score = 0;
    self.reloadTime = 3;
    self.reload = 0;
    self.inventory = new Inventory(param.progress.items, param.socket, true, self);

    self.inventory.addItem('potion', 1);

    let super_update = self.update;
    self.update = function() {
        self.updateSpd();
        super_update();

        if(self.reload > 0) this.reload--;
        if(self.pressingAttack) {
            if(this.reload == 0) {
                self.shootBullet(self.mouseAngle);
                self.reload = self.reloadTime;
            }
        }
    }
    self.shootBullet = function(angle) {
        if(Math.random() < 0.1)
            self.inventory.addItem('potion', 1);
        Bullet({
            parent: self.id,
            angle,
            x: self.x,
            y: self.y,
            map: self.map
        });
    }

    // Overwrites entitys updatePosition
    self.updateSpd = function() {
        if(self.pressingRight)
            self.spdX = self.maxSpd;
        else if(self.pressingLeft)
            self.spdX = -self.maxSpd;
        else
            self.spdX = 0;
        if(self.pressingDown)
            self.spdY = self.maxSpd;
        else if(self.pressingUp)
            self.spdY = -self.maxSpd;
        else
            self.spdY = 0;
    }

    self.getInitPack = function() {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
            username: self.username,
            hp: self.hp,
            hpMax: self.hpMax,
            score: self.score,
            map: self.map
        };
    }

    self.getUpdatePack = function() {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
            username: self.username,
            hp: self.hp,
            score: self.score,
            map: self.map
        };
    }

    Player.list[self.id] = self;
    initPack.player.push(self.getInitPack());
    return self;
}
Player.list = {};

Player.onConnect = function(socket, username, progress) {
    let map = 'forest';
    if(Math.random() < 0.5) map = 'field';

    let player = Player({
        username,
        id: socket.id,
        map,
        socket,
        progress
    });

    // Check if player has items
    player.inventory.refreshRender();

    socket.on('keyPress', (data) => {
        if(data.inputId === 'left')
            player.pressingLeft = data.state;
        else if(data.inputId === 'right')
            player.pressingRight = data.state;
        else if(data.inputId === 'up')
            player.pressingUp = data.state;
        else if(data.inputId === 'down')
            player.pressingDown = data.state;
        else if(data.inputId === 'attack')
            player.pressingAttack = data.state;
        else if(data.inputId === 'mouseAngle')
            player.mouseAngle = data.state;
    });

    socket.on('changeMap', (data) => {
        if(player.map === 'field')
            player.map = 'forest';
        else if(player.map === 'forest')
            player.map = 'grassland';
        else if(player.map === 'grassland')
            player.map = 'field';
    });

    socket.on('spawnMonster', (data) => {
        console.log('spawned');
        let randAreaX = Math.floor(Math.random() * 601 - 300)
        let randAreaY = Math.floor(Math.random() * 601 - 300)
        Enemy({
            x: data.x + randAreaX,
            y: data.y + randAreaY,
            map: data.map
        });
    })

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

    socket.emit('init', {
        selfId: socket.id,
        player: Player.getAllInitPack(),
        bullet: Bullet.getAllInitPack(),
        enemy: Enemy.getAllInitPack()
    });
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

let Bullet = function(param) {
    let self = Entity(param);
    self.id = Math.random();
    self.angle = param.angle;
    self.spdX = Math.cos(self.angle/180*Math.PI) * 10;
    self.spdY = Math.sin(self.angle/180*Math.PI) * 10;
    self.parent = param.parent;
    self.timer = 0;
    self.toRemove = false;

    let super_update = self.update;
    self.update = function() {
        if(self.timer++ > 100) {
            self.toRemove = true;
        }
        super_update();

        // Check if hitting a player
        for(let i in Player.list) {
            var p = Player.list[i];
            if(self.map === p.map && self.getDistance(p) < 32 && self.parent !== p.id) {
                p.hp -= 1;
                
                if(p.hp <= 0) {
                    // Give point to shooter
                    let shooter = Player.list[self.parent];
                    // shooter may have disconnected
                    if(shooter) {
                        shooter.score += 1;
                    }

                    // Respawn target
                    p.score = 0;
                    p.hp = p.hpMax;
                    p.x = Math.random() * 500;
                    p.y = Math.random() * 500;
                }
                self.toRemove = true;
            }
        }

        // Check if hitting an enemy
        for(let i in Enemy.list) {
            var e = Enemy.list[i];
            if(self.map === e.map && self.getDistance(e) < 32 && self.parent !== e.id) {
                e.hp -= 1;
                
                if(e.hp <= 0 && e.toRemove == false) {
                    // Give point to shooter
                    let shooter = Player.list[self.parent];
                    // shooter may have disconnected
                    if(shooter) {
                        shooter.score += 1;
                    }

                    // Respawn target
                    /*p.hp = p.hpMax;
                    p.x = Math.random() * 500;
                    p.y = Math.random() * 500;*/
                    e.toRemove = true;
                }
                self.toRemove = true;
            }
        }
    }
    
    self.getInitPack = function() {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
            map: self.map
        };
    }
    
    self.getUpdatePack = function() {
        return {
            id: self.id,
            x: self.x,
            y: self.y
        };
    }

    Bullet.list[self.id] = self;
    initPack.bullet.push(self.getInitPack());
    return self;
}
Bullet.list = {};

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

module.exports = {
    Player,
    Enemy,
    Bullet,
    Entity
}