let express = require('express');
let path = require('path');

require('dotenv').config();

let Database = require('./Database');
let { Player, Enemy, Entity, Portal } = require('./Entity');
let Maps = require('./Maps.js');

new Maps('field', 1920, 1440);
new Maps('forest', 640, 480);
new Maps('grassland', 2304, 1920);
new Portal({ mapName: 'forest', x: 320, y: 464 });
new Portal({ mapName: 'field', x: 960, y: 1424 });

let app = express();
let serv = require('http').Server(app);


// Express stuff
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './../client/index.html'));
});
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, './../client/register.html'));
});

app.use('/client', express.static(__dirname + '/../client'));

serv.listen(process.env.PORT || 2000);
console.log("Server started");





// Socket io stuff
let io = require('socket.io')(serv, {});

let SOCKET_LIST = {};
let LOGGED_IN = {};

const DEBUG = true;

io.sockets.on('connection', function(socket) {
    socket.id = Math.random();
    // Store each connected user in SOCKET_LIST based on random id
    SOCKET_LIST[socket.id] = socket;

    socket.on('logOut', (data) => {
        delete LOGGED_IN[data.username];
    });

    socket.on('signIn', (data) => { // { username, password }
        Database.isValidPassword(data, (res) => {
            if(!res || LOGGED_IN[data.username]) {
                return socket.emit('signInResponse', {success: false});
            }
            Database.getPlayerProgress(data.username, function(progress) {
                Player.onConnect(socket, data.username, progress);
                LOGGED_IN[data.username] = true;
                socket.emit('signInResponse', {success: true});
            });
        });
    });
    socket.on('signUp', (data) => {
        if(data.username.length < 3) {
            socket.emit('signUpResponse', { success: false });
        }
        Database.isUsernameTaken((data), (res) => {
            if(res) {
                socket.emit('signUpResponse', { success: false });
            } else {
                Database.addUser(data, () => {
                    socket.emit('signUpResponse', { success: true });
                });
            }
        });
    });

    socket.on('disconnect', () => {
        delete SOCKET_LIST[socket.id];
        let player = Player.list[socket.id];
        if(!player) return;
        Database.savePlayerProgress({
            username: player.username,
            items: player.inventory.items,
            friends: player.friends,
            x: player.x,
            y: player.y,
            map: player.mapName,
            score: player.score
        });
        Player.onDisconnect(socket);
    });

    socket.on('evalServer', (data) => {
        if(!DEBUG) return;

        if(data === 'killAll') {
            for(let i in Enemy.list) {
                Enemy.list[i].kill();
            }
        } else {
            let res;
            try{
                res = eval(data);
            } catch(e) {
                res = e.message;
            }
            socket.emit('evalAnswer', res);
        }
    });

    socket.on('reqInit', () => {
        socket.emit('init', Entity.getFrameUpdateData().initPack);
    })
});

// Update client packs
setInterval(function() {
    let packs = Entity.getFrameUpdateData();
    for(let i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        // Todo: Only send remove pack when needed
        socket.emit('update', packs.updatePack);
        socket.emit('remove', packs.removePack);
    }
}, 40);


// Spawn enemies
setInterval(function() {
    if(Enemy.count < 30)
        Enemy.spawnEnemies(10, 'field');
}, 10000)