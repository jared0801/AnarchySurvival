let express = require('express');

require('./Database');
require('./Entity');
require('./client/js/Inventory');

let app = express();
let serv = require('http').Server(app);


// Express stuff
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/index.html');
});

app.use('/client', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log("Server started");




// Socket io stuff
let io = require('socket.io')(serv, {});

let SOCKET_LIST = {};

const DEBUG = true;

io.sockets.on('connection', function(socket) {
    socket.id = Math.random();
    // Store each connected user in SOCKET_LIST based on random id
    SOCKET_LIST[socket.id] = socket;

    socket.on('signIn', (data) => { // { username, password }
        Database.isValidPassword(data, (res) => {
            if(!res) {
                return socket.emit('signInResponse', {success: false});
            }
            Database.getPlayerProgress(data.username, function(progress) {
                Player.onConnect(socket, data.username, progress);
                socket.emit('signInResponse', {success: true});
            });
        });
    });
    socket.on('signUp', (data) => {
        Database.isUsernameTaken((data), (res) => {
            if(res) {
                socket.emit('signUpResponse', {success: false});
            } else {
                Database.addUser(data, () => {
                    socket.emit('signUpResponse', {success: true});
                });
            }
        });
    });

    socket.on('disconnect', () => {
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
    });

    socket.on('evalServer', (data) => {
        if(!DEBUG) return;

        let res;
        try{
            res = eval(data);
        } catch(e) {
            res = e.message;
        }
        socket.emit('evalAnswer', res);
    });
});

setInterval(function() {
    let packs = Entity.getFrameUpdateData();    
    for(let i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        // Todo: Only send update every frame, send init and remove when needed
        socket.emit('init', packs.initPack);
        socket.emit('update', packs.updatePack);
        socket.emit('remove', packs.removePack);
    }
}, 1000/25)