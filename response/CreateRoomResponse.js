class CreateRoomResponse{
    constructor(roomId){
        this.roomId = roomId;
        this.isHost = true;
    }
}

module.exports = CreateRoomResponse;