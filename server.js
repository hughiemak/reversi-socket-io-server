// var Room = require('./room.js');
const express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
// var nanoid = require('nanoid');
var RoomService = require('./service/RoomService.js');
var util = require('util');
var JoinRoomResponse = require('./response/JoinRoomResponse.js').JoinRoomResponse;
var UnjoinableReason = require('./response/JoinRoomResponse.js').UnjoinableReason;
var CreateRoomResponse = require('./response/CreateRoomResponse.js');

// const url = require('url');
// const proxy = require('express-http-proxy');

var nameSpaceInUse = io.nsps["/"]

app.get('/', function(req, res){
  res.send('<h1>Reversi-socket-io Server</h1>');
});

// const apiProxy = proxy('https://hughiemak.github.io/', {
//     forwardPath: req => url.parse(req.baseUrl).path
// });

// app.use('/', apiProxy);

// const proxy = require('http-proxy-middleware')
// var apiProxy = proxy('/', {target: 'https://hughiemak.github.io/reversi'});
// app.use(apiProxy)

// app.use(express.static('client'));
// const apiProxy = proxy('/api', { target: 'https://hughiemak.github.io/reversi' });
// app.use('/', apiProxy);

// const renderIndex = (req, res) => {
//     res.sendFile(path.resolve(__dirname, 'client/index.html'));
//   }
//   app.get('/', renderIndex);

io.on('connection', function (socket) {
    console.log('a user connected, socket.id: ' + socket.id);
    socket.name = socket.id
    socket.join("lobby")
    // console.log("socket.name: " + socket.name)
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
    socket.on('emit from client', function () {
        console.log('emit from client');
        io.emit('emit from server', "Hi");
    });
    socket.on('emit move', function (move, roomId, socketId) {
        let x = move.x
        let y = move.y
        console.log('emit move from client, x: ' + x + ', y: ' + y + " roomId: " + roomId);

        let room = socket.rooms[roomId.toString()]
        console.log("room: " + util.inspect(room))

        getClientsByRoom(roomId, function(clients) {
            console.log(clients); 

            console.log("sender: " + socketId)

            clients.forEach(client => {
                if (client != socketId){
                    console.log("emitting to socket: " + client)
                    // io.sockets.in(roomId).emit('emit move from server', {x:x, y:y})
                    io.to(client).emit('emit move from server', {x:x, y:y});

                }
            });
        })

        // io.emit('emit move from server', 'emit from server: a move is made by a socket in room')

        // io.emit('emit from server: a move (' + x + ', ' + y + ') is made by your opponent')
    })
    socket.on('create room', function (message, callback) {

        socket.isHost = true;

        // console.log("creating room by socket: " + util.inspect(socket))
        let generatedRoomId = RoomService.generateRoomId();

        socket.leave("lobby");
        socket.join(generatedRoomId);

        var response = new CreateRoomResponse(generatedRoomId);
        callback(response);
    })

    socket.on('join room by id', function (roomId, callback) {
        console.log("Socket: " + socket.id + " attempting to join room: " + roomId)
        // console.log("roomExist: " + roomExist(socket, roomId));

        if (roomExist(socket, roomId)){
            let numClients = getRoomCount(roomId)
            if (numClients == 2){
                console.log("Room is full")
                var reason = UnjoinableReason.full;
                var response = new JoinRoomResponse(false, reason, null);
                callback(response)
            }else{
                console.log("Joining room: " + roomId)
                socket.leave("lobby");
                socket.join(roomId);
                socket.isHost = false;
                var response = new JoinRoomResponse(true, null, roomId);
                callback(response)
                //emit room full msg to all clients in room

                console.log("socketId: " + util.inspect(socket.id))

                let room = socket.adapter.rooms

                console.log("room: " + util.inspect(room))

                getClientsByRoom(roomId, function(clients){

                    var host;
                    var guest = socket.id;
                    for(var i = 0; i < clients.length; i++){
                        if(clients[i] != socket.id){
                            host = clients[i]
                            break
                        }
                    }

                    // console.log("host: " + util.inspect(nameSpaceInUse.connected[host]))
                    // console.log("guest: " + util.inspect(nameSpaceInUse.connected[guest]))

                    var hostName = nameSpaceInUse.connected[host].name;
                    var guestName = nameSpaceInUse.connected[guest].name;
                    
                    // io.to(roomId).emit('room full msg from server', {host: host, guest: guest})

                    io.to(host).emit('room full msg from server', {host: hostName, guest: guestName});
                })
                
                

            }
            
        }else{
            console.log("Room does not exist")
            var reason = UnjoinableReason.notExist;
            var response = new JoinRoomResponse(false, reason, null);
            callback(response)
        }

    })

    socket.on('leave room by id', function (roomId, callback){
        console.log("Socket: " + socket.id + " attempting to leave room: " + roomId)
            socket.leave(roomId)
            socket.join("lobby")
            callback("Left room: " + roomId)
    })

    socket.on("client emit win", function(win){
        console("socket: " + socket.id + ", win: " + win)
    })
 
    socket.on('broadcast message to room', function(request){
        const text = request.text
        const roomId = request.roomId
        const sender = request.sender
        console.log("roomId: " + roomId + ", text: " + text, "sender: " + sender)

        let room = socket.rooms

        getClientsByRoom(roomId, function(clients){
            console.log("clients: " + clients)

            clients.forEach( client =>{
                io.to(client).emit("broadcast room message from server", {sender: sender, text: text})
            });
        })

                // console.log("room: " + util.inspect(room))
    })
    // socket.broadcast.emit('broadcase from server');

    socket.on("emit socket change name", function(name){
        socket.name = name
    })

    socket.on("broadcast message to lobby", function(request){
        const text = request.text
        const sender = request.sender

        console.log("text: " + text, "sender: " + sender)

        getClientsByRoom("lobby", function(clients){
            clients.forEach( client => {
                io.to(client).emit("broadcast lobby message from server", {sender: sender, text: text})
            })
        })
    })
    
});

function getClientsByRoom(room, fn){
    io.of('/').in(room).clients((error, clients) => {
        if (error) throw error;
        fn(clients)
    })
}

function getRoomByRoomId(socket, roomId){
    return socket.rooms[roomId.toString()]
}

function getRoomCount(roomId){

    var clietsInRoom = nameSpaceInUse.adapter.rooms[roomId];
    // console.log("clietsInRoom: " + util.inspect(clietsInRoom, false, null, false))

    let count = clietsInRoom.length;

    return count
}

function roomExist(socket, roomId) {
    let room = getAllRooms(socket)[roomId]
    
    // console.log("room: " + util.inspect(room, false, null, true));

    if (room == null){
        return false
    }else{
        return true
    }

}

function getAllRooms(socket) {
    var rooms = io.sockets.adapter.rooms
    return rooms
}

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0'
http.listen(port, ip, function () {
// http.listen(3000, function () {
    console.log( "server started")

});

