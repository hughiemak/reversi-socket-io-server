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
    console.log('a user connected');
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
                    var guest = socket.id
                    for(var i = 0; i < clients.length; i++){
                        if(clients[i] != socket.id){
                            host = clients[i]
                            break
                        }
                    }
                    // io.to(roomId).emit('room full msg from server', {host: host, guest: guest})

                    io.to(host).emit('room full msg from server', {host: host, guest: guest});
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
            callback("Left room: " + roomId)
    })


    // socket.broadcast.emit('broadcase from server');
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
    // let exist = rooms.includes(roomId);
    // return exist
}

function getAllRooms(socket) {
    var rooms = io.sockets.adapter.rooms
    // rooms.splice(0, 1)
    // console.log("rooms: " + rooms)
    // console.log("rooms: " + util.inspect(rooms, false, null, true))
    return rooms
}

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0'
// http.listen(port, ip, function () {
http.listen(port, ip, function () {
    console.log( "server started")

    // console.log('listening on *:3000');
    // initRooms();
    // console.log("room: " + room)

});

// function initRooms(){
//     room = new Room();
// }

