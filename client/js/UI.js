let WIDTH = window.innerWidth;
let HEIGHT = Math.min(Math.floor(WIDTH * 0.7), Math.floor(window.innerHeight * 0.7));
export class UI {
    constructor(s, plist, selfId) {
        this.socket = s;
        this.plist = plist;
        this.selfId = selfId;

        this.uiDiv = document.getElementById("ui");
        // Chat
        this.chatText = document.getElementById("chat-text");
        this.chatInput = document.getElementById("chat-input");
        this.chatForm = document.getElementById("chat-form");

        // Change map button
        this.changeMap = document.getElementById("changeMap");

        this.socket.on('addToChat', (data) => {
            this.consoleMsg(data);
        });
        this.socket.on('evalAnswer', (data) => {
            console.log(data);
        });
        this.socket.on('addScore', (data) => { //{ x, y, points }    
            this.consoleMsg("You've gained " + data.points + " points!");
        });

        this.socket.on('requestFriend', data => {
            let friendReq = document.createElement('div');
            friendReq.style.position = "absolute";
            friendReq.style.top = "10px";
            friendReq.style.left = WIDTH/2 - friendReq.style.width + "px";
            friendReq.style.backgroundColor = "lightgray";
            friendReq.style.padding = "10px";
            friendReq.innerHTML = "<p>" + this.plist[data].username + " would like to be your friend!</p>";

            let acceptBtn = document.createElement('button');
            acceptBtn.innerText = "Accept";
            acceptBtn.onclick = () => {
                this.socket.emit('confirmFriend', data);
                friendReq.remove();
            }

            let denyBtn = document.createElement('button');
            denyBtn.onclick = function() {
                friendReq.remove();
            }
            denyBtn.innerText = "Deny";

            friendReq.append(acceptBtn);
            friendReq.append(denyBtn);
            this.uiDiv.append(friendReq);

            this.consoleMsg(this.plist[data].username + " would like to be your friend!");
        });

        this.chatForm.onsubmit = function(e) {
            e.preventDefault(); // Don't refresh the page
            if(this.chatInput.value[0] === '/')
                this.socket.emit('evalServer', this.chatInput.value.slice(1));
            else if(this.chatInput.value[0] === '!') {
                let number = Number.parseInt(this.chatInput.value.slice(1));
                if(Number.isNaN(number)) number = 1;
                this.socket.emit('spawnMonster', { mapName: this.plist[this.selfId].mapName, number });
            } else if(this.chatInput.value[0] === '@') {
                //@username message
                let firstSpace = this.chatInput.value.indexOf(' ');
                let username = this.chatInput.value.slice(1, firstSpace);
                let message = this.chatInput.value.slice(firstSpace + 1);
                this.socket.emit('sendPmToServer', {
                    username,
                    message
                });
            } else
                this.socket.emit('sendMsgToServer', this.chatInput.value);
            this.chatInput.value = '';
        }.bind(this);

        // UI
        this.changeMap.onclick = function() {
            this.socket.emit('changeMap');
        }.bind(this);
    }
    consoleMsg(msg) {
        this.chatText.innerHTML += '<div>' + msg + '</div>';
        this.chatText.scrollTop = this.chatText.scrollHeight;
    }
    update(width, height, plist, selfId) {
        WIDTH = width;
        HEIGHT = height;
        this.uiDiv.style.width = WIDTH;
        this.uiDiv.style.height = HEIGHT;
        this.selfId = selfId;
        this.plist = plist;
    }
    friendReq(mouseX, mouseY, self, p) {
        if(!self.menu && p.id != this.selfId && p.map === self.map && Math.abs(p.x - mouseX) < 32 && Math.abs(p.y - mouseY) < 32) {
            self.menu = document.createElement('div');
            self.menu.style.position = 'absolute';
            self.menu.id = 'playerMenu';
            self.menu.style.top = event.clientY + 'px';
            self.menu.style.left = event.clientX + 'px';
            self.menu.style.backgroundColor = 'white';
            let button = document.createElement('button');
            button.setAttribute('id', 'AddFriend');
            if(self.friends[p.username]) {
                button.innerText = "Remove as friend";
            } else {
                button.innerText = "Add as friend";
            }
            //button.onclick = self.addFriend(p.id);
            button.addEventListener("click", self.addFriend.bind(self, p.id), false);
            self.menu.append(button);
            this.uiDiv.appendChild(self.menu);
        }
    }
}