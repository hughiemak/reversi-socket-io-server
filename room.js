class Room {
    
    constructor(){
        this.sockets = [];
    }



    addSocket(socket){
        this.sockets.push(socket);
    }

    get isOpen(){
        if (this.sockets.length == 2) {
            return false;
        }else{
            return true;
        }
    }

    // get count(){
    //     return this.count
    // }

}

module.exports = Room;