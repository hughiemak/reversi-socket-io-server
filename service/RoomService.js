// var nanoid = require('nanoid');
const generate = require('nanoid/generate')

var generateRoomId = () => {
    let id = generate('1234567890abcdefghij', 4)
    // console.log("RoomService generateRoomId id: " + id)
    return id
}

module.exports = {generateRoomId}
