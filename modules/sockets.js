const {Server} = require('socket.io');
const jwt = require('jsonwebtoken');
const playersDb = require('../schemas/playerSchema');
let players = [];
let rooms = [];

function randomNum(num) {
    return Math.floor(Math.random() * num);
}

module.exports = (server) => {
    const io = new Server(server, {
        cors: {
            origin: 'http://localhost:3000'
        }
    });

    io.on('connection', async (socket) => {
        console.log('player connected');
        const token = socket.handshake.auth.token;
        try {
            const data = await jwt.verify(token, process.env.JWT_SECRET);
            if (!players.some(player => player.username === data.username)) {
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
            let roomId = playerThatSentAnInvite.socketId + invitedPlayerSocketId;
            socket.join(roomId);
        });
        socket.on('invitationDenied', playerThatSentAnInvite => {
            io.to(playerThatSentAnInvite.socketId).emit('denied', false);
        });
        socket.on('invitationAccepted', async playerWhoWantsToPlay => {
            const playerWhoAcceptedInvite = players.find(player => player.socketId === socket.id);
            let roomId = playerWhoWantsToPlay.socketId + playerWhoAcceptedInvite.socketId;
            socket.join(roomId);
            let player1 = await playersDb.findOne({username: playerWhoWantsToPlay.username}, {
                password: 0,
                generatedItems: 0,
                inventory: 0,
                money: 0
            });
            player1 = {winPot: 0, hp: 100, ...player1._doc};
            console.log('player1', player1);
            let player2 = await playersDb.findOne({username: playerWhoAcceptedInvite.username}, {
                password: 0,
                generatedItems: 0,
                inventory: 0,
                money: 0
            });
            player2 = {winPot: 0, hp: 100, ...player2._doc};
            console.log('player2', player2);
            const room = {
                roomId: roomId,
                players: [player1, player2],
                turn: player1.username,
                gameOver: false,
                winner: null
            }
            rooms.push(room);
            console.log('rooms players', rooms[0].players);
            io.to(roomId).emit('joinedRoom', room);
        });
        socket.on('turn', roomId => {
            console.log(roomId);
            console.log(rooms);
            let room = rooms.find(room => room.roomId === roomId);
            const playersTurn = room.players.find(player => player.username === room.turn);
            const playerToReceiveHit = room.players.find(player => player.username !== room.turn);
            let randomDamage = randomNum(playersTurn.equippedWeapon.damage + 1);
            let weaponEffectDoubleDamage = playersTurn.equippedWeapon.effects.find(effect => effect.effect === 'Critical hit');
            let armourEffectDoubleDamage = playersTurn.equippedArmour.effects.find(effect => effect.effect === 'Critical hit');
            let totalDoubleDamageChance = 0;
            if (weaponEffectDoubleDamage) totalDoubleDamageChance += weaponEffectDoubleDamage.chance;
            if (armourEffectDoubleDamage) totalDoubleDamageChance += armourEffectDoubleDamage.chance;
            let randomNumberForCriticalChance = randomNum(101);
            if (randomNumberForCriticalChance <= totalDoubleDamageChance) randomDamage *= 2;
            let totalShield = Math.round(randomDamage * playerToReceiveHit.equippedArmour.dodge / 100);
            let armourDodgeChance = playerToReceiveHit.equippedArmour.effects.find(effect => effect.effect === 'Double Dodge');
            let weaponDodgeChance = playerToReceiveHit.equippedWeapon.effects.find(effect => effect.effect === 'Double Dodge');
            let totalDodgeChance = 0;
            if (armourDodgeChance) totalDodgeChance += armourDodgeChance.chance;
            if (weaponDodgeChance) totalDodgeChance += weaponDodgeChance.chance;
            let randomNumberForDodgeChance = randomNum(101);
            let totalDamage = randomDamage - totalShield;
            if (randomNumberForDodgeChance <= totalDodgeChance) totalDamage = 0;
            playerToReceiveHit.hp -= totalDamage;
            playersTurn.winPot += randomNum(playersTurn.equippedWeapon.gold + 1);
            if (playerToReceiveHit.hp <= 0) {
                room.gameOver = true;
                room.winner = playersTurn.username
            }
            if (room.turn === room.players[0].username) {
                room.turn = room.players[1].username;
            } else {
                room.turn = room.players[0].username;
            }
            console.log(room);
            io.to(roomId).emit('roomInfo', room);
        });
        socket.on('usePotion', info => {
            console.log(info);
            console.log(info.roomId);
            console.log(info.username);
            let room = rooms.find(room => room.roomId === info.roomId);
            console.log(room);
            const playerUsingPotion = room.players.find(player => player.username === info.username);
            console.log('playerUsingPotion', playerUsingPotion);
            playerUsingPotion.hp += playerUsingPotion.equippedPotion.restores;
            if(playerUsingPotion.hp>100) playerUsingPotion.hp = 100;
            playerUsingPotion.equippedPotion = null;
            io.to(info.roomId).emit('roomInfo', room);
        })
    })

}
