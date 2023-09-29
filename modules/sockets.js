const {Server} = require('socket.io');
const jwt = require('jsonwebtoken');
const playersDb = require('../schemas/playerSchema');
let players = [];
let rooms = [];

module.exports = (server) => {
    const io = new Server(server,{
        cors: {
            origin: 'http://localhost:3000'
        }
    });

    io.on('connection', async (socket) => {
        console.log('player connected');
        const token = socket.handshake.auth.token;
        try {
            const data = await jwt.verify(token, process.env.JWT_SECRET);
            if(!players.some(player => player.username === data.username)) {
                players.push({
                    socketId: socket.id,
                    username: data.username,
                    monster: data.monster
                })
            }
            io.emit('sendingAllUsers', players);
        } catch (err) {
            console.log('verification error in middleware', err);
        }
        socket.on("disconnect", () => {
            console.log('user disconnected');
            players = players.filter(player => player.socketId !== socket.id);
            io.emit('sendingAllUsers', players)
        });
        socket.on('sendInvitation', invitedPlayerSocketId => {
            const playerThatSentAnInvite = players.find(player => player.socketId === socket.id);
            io.to(invitedPlayerSocketId).emit('receiveRequest', playerThatSentAnInvite);
            io.to(socket.id).emit('invitationSentSuccessfully', invitedPlayerSocketId);
            let roomId = playerThatSentAnInvite.socketId+invitedPlayerSocketId;
            socket.join(roomId);
        });
        socket.on('invitationDenied',  playerThatSentAnInvite => {
            io.to(playerThatSentAnInvite.socketId).emit('denied', false);
        });
        socket.on('invitationAccepted', async playerWhoWantsToPlay => {
            const playerWhoAcceptedInvite = players.find(player => player.socketId === socket.id);
            let roomId = playerWhoWantsToPlay.socketId+playerWhoAcceptedInvite.socketId;
            socket.join(roomId);
            let player1 = await playersDb.findOne({username: playerWhoWantsToPlay.username},{password:0, generatedItems:0, inventory:0});
            console.log('player1', player1);
            let player2 = await playersDb.findOne({username: playerWhoAcceptedInvite.username},{password:0, generatedItems:0, inventory:0});
            console.log('player2', player2);
            const room = {
                roomId: roomId,
                players: [player1, player2],
                turn: player1.username
            }
            rooms.push(room);
            console.log('rooms', rooms);
            io.to(roomId).emit('joinedRoom', room);
        });
        socket.on('turn', roomId => {
            console.log(roomId);
            console.log(rooms);
            const room = rooms.find(room => room.roomId === roomId);
            if(room.turn === room.players[0].username){
                console.log('i am inside if')
                room.turn = room.players[1].username;
            } else {
                console.log('i am inside else')
                room.turn = room.players[0].username;
            }
            console.log(room);
            io.to(roomId).emit('turnMade', room);
        })
    })

}
