const {Server} = require('socket.io');

module.exports = (server) => {
    const io = new Server(server,{
        cors: {
            origin: 'http://localhost:3000'
        }
    });

    io.on('connection', (socket) => {
        console.log('player connected');

        socket.emit('message','hello');

    })

}