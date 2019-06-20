// var Room = require('./room.js');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
// var nanoid = require('nanoid');
var RoomService = require('./RoomService.js');
var util = require('util')

// app.get('/', function (req, res) {
//     res.sendFile(__dirname + '/index.html');
// });

// var room;

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
    socket.on('emit from client', function () {
        console.log('emit from client');
        io.emit('emit from server', "Hi");
    });
    socket.on('emit move', function (move) {
        let x = move.x
        let y = move.y
        console.log('emit move from client, x: ' + x + ', y: ' + y);
    })
    socket.on('create room', function (message, callback) {

        console.log(message);
        let generatedRoomId = RoomService.generateRoomId();

        socket.join(generatedRoomId);
        callback("Successfully Opened Room: " + generatedRoomId)
    })

    socket.on('join room by id', function (roomId, callback) {
        console.log("Attempting to join room: " + roomId)
        console.log("roomExist: " + roomExist(socket, roomId));

        if (roomExist(socket, roomId)){
            let numClients = getRoomCount(roomId)
            if (numClients == 2){
                callback("Room is full.")
            }else{
                console.log("joining room: " + roomId)
                socket.join(roomId)
            }
            
        }else{
            callback("Room does not exist.")
        }

    })

    socket.on('leave room by id', function (roomId, callback){
        console.log("Attempting to leave room: " + roomId)
            socket.leave(roomId)
            callback("Left room: " + roomId)
    })


    // socket.broadcast.emit('broadcase from server');
});

function getRoomCount(roomId){

    var clietsInRoom = io.nsps["/"].adapter.rooms[roomId];
    console.log("clietsInRoom: " + util.inspect(clietsInRoom, false, null, false))

    let count = clietsInRoom.length;

    return count
}

function roomExist(socket, roomId) {
    let room = getAllRooms(socket)[roomId]
    
    console.log("room: " + util.inspect(room, false, null, true));

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
    console.log("rooms: " + util.inspect(rooms, false, null, true))
    return rooms
}

http.listen(3000, function () {
    console.log('listening on *:3000');
    // initRooms();
    // console.log("room: " + room)

});

// function initRooms(){
//     room = new Room();
// }

