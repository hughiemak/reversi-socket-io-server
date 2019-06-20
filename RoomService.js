var nanoid = require('nanoid');


var generateRoomId = () => {
    let id = nanoid(4)
    console.log("RoomService generateRoomId id: " + id)
    return id
}

module.exports = {generateRoomId}
