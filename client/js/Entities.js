let selfId = null;
let socket = null;

let ctx = document.getElementById("canvas").getContext("2d");

let Img = {
    player: [new Image(), new Image()],
    bullet: new Image(),
    enemy: [new Image(), new Image()],
    portal: new Image()
};
Img.player[0].src = '/client/img/bobby.png';
Img.player[1].src = '/client/img/betty.png';
Img.bullet.src = '/client/img/bullet4.png';
Img.enemy[0].src = '/client/img/bat2.png';
Img.enemy[1].src = '/client/img/gladiator.png';
Img.portal.src = '/client/img/portal.png';

export class Player {
    static list = {};
    constructor(initPack, sid, sock) {
        this.id = initPack.id;
        this.username = initPack.username;
        this.x = initPack.x;
        this.y = initPack.y;
        this.hp = initPack.hp;
        this.hpMax = initPack.hpMax;
        this.score = initPack.score;
        this.mapName = initPack.mapName;
        this.gender = initPack.gender;
        this.menu = null;
        this.friends = new Set([]);
        this.srcX = 0;
        this.srcY = 0;
        this.direction = 2;
        this.isMoving = false;
        selfId = sid;
        if(socket == null) {
            socket = sock;
        }

        Player.list[this.id] = this;
    }

    draw(WIDTH, HEIGHT) {
        // Only show players on the same map
        if(Player.list[selfId].mapName !== this.mapName) return;

        let x = this.x - Player.list[selfId].x + WIDTH/2;
        let y = this.y - Player.list[selfId].y + HEIGHT/2;

        let hpWidth = 30 * this.hp / this.hpMax;
        ctx.fillStyle = 'red';
        ctx.fillRect(x - hpWidth/2, y - 40, hpWidth, 4);

        // Player image:
        let width = Img.player[this.gender].width / 4; // Makes image 2x larger
        let height = Img.player[this.gender].height / 4;
        if(this.srcY >= Img.player[this.gender].height || this.isMoving == false) {
            this.srcY = 0;
        }
            
        if(this.direction === 0)
            this.srcX = 0;
        if(this.direction === 1)
            this.srcX = 48;
        if(this.direction === 2)
            this.srcX = 96;
        if(this.direction === 3)
            this.srcX = 144;

        ctx.drawImage(Img.player[this.gender], this.srcX, this.srcY, 48, 48, x - width/2, y - height/2, width, height);

        // player username:
        ctx.fillStyle = 'black';
        ctx.font = "bold 15px Arial";
        let txtWidth = ctx.measureText(this.username).width;
        ctx.fillText(this.username, x - txtWidth/2, y+40);

        // score:
        //ctx.fillText(this.score, this.x, this.y-60);
    }

    
    static closeMenu() {
        if(selfId) {
            let player = Player.list[selfId];
            if(player.menu) {
                player.menu.remove();
                player.menu = null;
            }
        }
    }

    addFriend(friendId) {
        Player.closeMenu();
        
        let friendUsername = Player.list[friendId].username;
        if(this.friends[friendUsername]) {
            socket.emit("removeFriend", friendId);
        } else {
            socket.emit("addFriend", { friendId });
        }
    }
}



export class Enemy {
    static list = {};
    constructor(initPack) {
        this.id = initPack.id;
        this.x = initPack.x;
        this.y = initPack.y;
        this.hp = initPack.hp;
        this.hpMax = initPack.hpMax;
        this.mapName = initPack.mapName;
        this.type = initPack.type;
        this.isMoving = false;
        this.srcX = 0;
        this.srcY = 0;
        this.direction = 0;

        Enemy.list[this.id] = this;
    }

    draw(WIDTH, HEIGHT) {
        // Only show enemies on the same map
        if(Player.list[selfId].mapName !== this.mapName) return;

        let x = this.x - Player.list[selfId].x + WIDTH/2;
        let y = this.y - Player.list[selfId].y + HEIGHT/2;

        let hpWidth = 30 * this.hp / this.hpMax;
        ctx.fillStyle = 'red';
        ctx.fillRect(x - hpWidth/2, y - 40, hpWidth, 4);

        if(this.type == 0) { // bat
            let width = 64;
            let height = 64;

            if(this.srcX >= Img.player[Player.list[selfId].gender].width) {
                this.srcX = 0;
            }
            
            if(this.direction === 0)
                this.srcY = 0;
            if(this.direction === 1)
                this.srcY = 32;
            if(this.direction === 2)
                this.srcY = 64;
            if(this.direction === 3)
                this.srcY = 96;

            ctx.drawImage(Img.enemy[this.type], this.srcX, this.srcY, 32, 32, x - width/2, y - height/2, width, height);
        } else if(this.type == 1) { // gladiator
            let width = 64;
            let height = 64;

            if(this.srcX >= Img.player[Player.list[selfId].gender].width) {
                this.srcX = 0;
            }
            if(this.isMoving) {
                this.srcY = 32;
            } else {
                this.srcY = 0;
            }

            ctx.drawImage(Img.enemy[this.type], this.srcX, this.srcY, 32, 32, x - width/2, y - height/2, width, height);
        }

    }
}

export class Bullet {
    static list = {};
    constructor(initPack) {
        this.id = initPack.id;
        this.x = initPack.x;
        this.y = initPack.y;
        this.mapName = initPack.mapName;

        Bullet.list[this.id] = this;
    }

    draw(WIDTH, HEIGHT) {
        // Only show bullets on the same map
        if(Player.list[selfId].mapName !== this.mapName) return;

        let width = Img.bullet.width / 2; // Makes image 2x smaller
        let height = Img.bullet.height / 2;

        let x = this.x - Player.list[selfId].x + WIDTH/2;
        let y = this.y - Player.list[selfId].y + HEIGHT/2;

        ctx.drawImage(Img.bullet, 0, 0, Img.bullet.width, Img.bullet.height, x - width/2, y - height/2, width, height);
    }

}

export class Portal {
    static list = {};
    constructor(initPack) {
        this.id = initPack.id;
        this.x = initPack.x;
        this.y = initPack.y;
        this.mapName = initPack.mapName;
        this.srcX = 0;

        Portal.list[this.id] = this;
    }

    draw(WIDTH, HEIGHT) {
        // Only show portals on the same map
        if(Player.list[selfId].mapName !== this.mapName) return;

        let width = Img.portal.width / 5; // Makes image 2x smaller
        let height = Img.portal.height;

        if(this.srcX >= Img.portal.width) this.srcX = 0;

        let x = this.x - Player.list[selfId].x + WIDTH/2;
        let y = this.y - Player.list[selfId].y + HEIGHT/2;

        ctx.drawImage(Img.portal, this.srcX, 0, 32, 32, x - width/2, y - height/2, width, height);
    }

}