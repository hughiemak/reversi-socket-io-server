var Room = require('./room.js');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);


// app.get('/', function (req, res) {
//     res.sendFile(__dirname + '/index.html');
// });

var room;

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
    socket.on('emit from client', function () {
        console.log('emit from client');
        io.emit('emit from server', "Hi");
    });
    socket.on('emit move', function(move) {
        let x = move.x
        let y = move.y
        console.log('emit move from client, x: ' + x + ', y: ' + y);
    })
    socket.on('button 1', function(message, callback){
        if (room.sockets.length == 2) {
            callback("Room is full.")
            return
        }
        console.log('emit from button 1, message: ' + message);
        room.addSocket(socket);
        console.log('room.count: ' + room.count);
        // io.emit('button 1 callback', room.count)
        callback("button 1 callback")
    })
    // socket.broadcast.emit('broadcase from server');
});



http.listen(3000, function () {
    console.log('listening on *:3000');
    initRooms();
    console.log("room: " + room)

});

function initRooms(){
    room = new Room();

}
