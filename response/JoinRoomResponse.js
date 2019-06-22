const UnjoinableReason = {
    notExist: "notExist",
    full: "full"
}

class JoinRoomResponse {

    constructor(joinable, unjoinableReason, roomId){
        this.joinable = joinable;
        this.unjoinableReason = unjoinableReason;
        this.roomId = roomId;
        this.isHost = false;
    }
}


module.exports = {UnjoinableReason, JoinRoomResponse};