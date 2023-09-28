const {Server} = require('socket.io');
const jwt = require('jsonwebtoken');
let players = [];

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
            if(!players.some(player => player.dbId === data.id)) {
                players.push({
                    socketId: socket.id,
                    dbId : data.id,
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
            // io.emit('sendingAllUsers', players)
        });
        socket.on('sendInvitation', invitedPlayerSocketId => {
            console.log(invitedPlayerSocketId);
            const playerThatSentAnInvite = players.find(player => player.socketId === socket.id);
            io.to(invitedPlayerSocketId).emit('receiveRequest', {playerThatSentAnInvite, message: 'wants to play'})
        });
        socket.on('invitationDenied', playerThatSentAnInvite => {
            console.log('invitation denied data',playerThatSentAnInvite);
            io.to(playerThatSentAnInvite.socketId).emit('denied', false);
        })
    })

}
