const {Server} = require('socket.io');
const jwt = require('jsonwebtoken');
const playersDb = require('../schemas/playerSchema');
let players = [];
let rooms = [];
let timer = null;
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
            let existingPlayer = players.find(player => player.username === data.username);
            if(existingPlayer) {
                io.to(existingPlayer.socketId).emit('logout', 'you need to log out');
                existingPlayer.isOnline = true;
                existingPlayer.socketId = socket.id;
                existingPlayer.roomsJoined.map(roomJoined => socket.join(roomJoined));
            } else {
                players.push({
                    socketId: socket.id,
                    username: data.username,
                    monster: data.monster,
                    inBattle: false,
                    isOnline: true,
                    sentInvitations: [],
                    receivedInvitations: [],
                    roomsJoined: []
                })
            }
            io.emit('sendingAllUsers', players);
        } catch (err) {
            console.log('verification error in sockets', err);
        }


        socket.on("disconnect", () => {
            console.log('user disconnected');
            let disconnectedPlayer = players.find(player => player.socketId === socket.id);
            if(disconnectedPlayer) {
                disconnectedPlayer.isOnline = false;
                disconnectedPlayer.roomsJoined.map(roomJoined => socket.leave(roomJoined));
            }
            io.emit('sendingAllUsers', players)
        });
        socket.on('sendInvitation', invitedPlayerSocketId => {
            const playerThatSentAnInvite = players.find(player => player.socketId === socket.id);
            const invitedPlayer = players.find(player => player.socketId === invitedPlayerSocketId);
            playerThatSentAnInvite.sentInvitations.push(invitedPlayer.username);
            invitedPlayer.receivedInvitations.push(playerThatSentAnInvite.username);
            io.to(invitedPlayerSocketId).emit('receiveRequest', invitedPlayer.receivedInvitations);
            io.to(socket.id).emit('invitationSentSuccessfully', playerThatSentAnInvite.sentInvitations);
            let roomId = playerThatSentAnInvite.username + invitedPlayer.username;
            socket.join(roomId);
            playerThatSentAnInvite.roomsJoined.push(roomId);
        });
        socket.on('invitationDenied', playerWhoWasDeniedSocketId => {
            const playerWhoDeniedInvitation = players.find(player => player.socketId === socket.id);
            const playerWhoWasDenied = players.find(player => player.socketId === playerWhoWasDeniedSocketId);
            playerWhoDeniedInvitation.receivedInvitations = playerWhoDeniedInvitation.receivedInvitations.filter(receivedInvitation => receivedInvitation !== playerWhoWasDenied.username)
            playerWhoWasDenied.sentInvitations = playerWhoWasDenied.sentInvitations.filter(invitedPlayer => invitedPlayer !== playerWhoDeniedInvitation.username)
            io.to(playerWhoDeniedInvitation.socketId).emit('youDeniedInvitation', playerWhoDeniedInvitation.receivedInvitations);
            io.to(playerWhoWasDenied.socketId).emit('yourInvitationWasDenied', playerWhoWasDenied.sentInvitations);
        });
        socket.on('invitationAccepted', async playerWhoWantsToPlay => {
            const playerWhoAcceptedInvite = players.find(player => player.socketId === socket.id);
            playerWhoAcceptedInvite.inBattle = true;
            playerWhoWantsToPlay = players.find(player => player.username === playerWhoWantsToPlay);
            playerWhoWantsToPlay.inBattle = true;
            playerWhoAcceptedInvite.receivedInvitations = playerWhoAcceptedInvite.receivedInvitations.filter(receivedInvitation => receivedInvitation !== playerWhoWantsToPlay.username);
            playerWhoWantsToPlay.sentInvitations = playerWhoWantsToPlay.sentInvitations.filter(sentInvitation => sentInvitation !== playerWhoAcceptedInvite.username);
            io.to(playerWhoWantsToPlay.socketId).emit('yourInvitationWasAccepted', playerWhoWantsToPlay.sentInvitations);
            io.to(socket.id).emit('you accepted the invitation', playerWhoAcceptedInvite.receivedInvitations);
            let roomId = playerWhoWantsToPlay.username + playerWhoAcceptedInvite.username;
            socket.join(roomId);
            let player1= null;
            try {
                player1 = await playersDb.findOne({username: playerWhoWantsToPlay.username}, {
                    password: 0,
                    generatedItems: 0,
                    inventory: 0,
                    money: 0
                });
            } catch (e) {
                console.log('error finding player1', e)
            }

            player1 = {winPot: 0, hp: 100, ...player1._doc};
            let player2 = await playersDb.findOne({username: playerWhoAcceptedInvite.username}, {
                password: 0,
                generatedItems: 0,
                inventory: 0,
                money: 0
            });
            player2 = {winPot: 0, hp: 100, ...player2._doc};
            const room = {
                roomId: roomId,
                players: [player1, player2],
                turn: player1.username,
                gameOver: false,
                timer: null,
                winner: null
            }
            rooms.push(room);
            io.to(roomId).emit('joinedRoom', room);
            io.emit('sendingAllUsers', players)
        });
        socket.on('playerLeftInTheMiddleOfBattle', roomId => {
            if(timer) clearInterval(timer);
            const playerWhoLeft = players.find(player =>player.socketId === socket.id);
            playerWhoLeft.inBattle = false;
            const room = rooms.find(room => room.roomId === roomId);
            room.players = room.players.filter(player => player.socketId !== socket.id);
            room.gameOver = true;
            let playerWhoWasAbandoned = room.players.find(player => player.username !== playerWhoLeft.username);
            playerWhoWasAbandoned = players.find(player=>player.username === playerWhoWasAbandoned.username);
            io.to(playerWhoWasAbandoned.socketId).emit('youWereLeftAlone', true);
            io.emit('sendingAllUsers', players);
        });
        socket.on('leaveAfterBeingAbandoned', roomId => {
            const secondPlayerWhoLeft = players.find(player => player.socketId === socket.id);
            secondPlayerWhoLeft.inBattle = false;
            const room = rooms.find(room => room.roomId === roomId);
            rooms = rooms.filter(room=> room.roomId !== roomId);
            io.emit('sendingAllUsers', players);
        })
        socket.on('turn', roomId => {
            if(timer) clearInterval(timer);
            let room = rooms.find(room => room.roomId === roomId);
            const playersTurn = room.players.find(player => player.username === room.turn);
            const playerToReceiveHit = room.players.find(player => player.username !== room.turn);
            room.timer = 20;
            timer = setInterval(() => {
                room.timer -=1;
                console.log(room.timer)
                if(room.timer <=0) {
                    if (room.turn === room.players[0].username) {
                        room.turn = room.players[1].username;
                    } else {
                        room.turn = room.players[0].username;
                    }
                    room.timer = 20;
                }
                io.to(roomId).emit('timer', room);
            },1000)

            //// calculating total damage made
            let randomDamage = randomNum(playersTurn.equippedWeapon.damage + 1);
            let weaponEffectDoubleDamage = playersTurn.equippedWeapon.effects.find(effect => effect.effect === 'Critical hit');
            let armourEffectDoubleDamage = playersTurn.equippedArmour.effects.find(effect => effect.effect === 'Critical hit');
            let totalDoubleDamageChance = 0;
            if (weaponEffectDoubleDamage) totalDoubleDamageChance += weaponEffectDoubleDamage.chance;
            if (armourEffectDoubleDamage) totalDoubleDamageChance += armourEffectDoubleDamage.chance;
            let randomNumberForCriticalChance = randomNum(101);
            if (randomNumberForCriticalChance <= totalDoubleDamageChance) randomDamage *= 2;
            // calculating total shield and dodge from the attack
            let totalShield = Math.round(randomDamage * playerToReceiveHit.equippedArmour.dodge / 100);
            let armourDodgeChance = playerToReceiveHit.equippedArmour.effects.find(effect => effect.effect === 'Dodge Chance');
            let weaponDodgeChance = playerToReceiveHit.equippedWeapon.effects.find(effect => effect.effect === 'Dodge Chance');
            let totalDodgeChance = 0;
            if (armourDodgeChance) totalDodgeChance += armourDodgeChance.chance;
            if (weaponDodgeChance) totalDodgeChance += weaponDodgeChance.chance;
            let randomNumberForDodgeChance = randomNum(101);
            let totalDamage = randomDamage - totalShield;
            if (randomNumberForDodgeChance <= totalDodgeChance) totalDamage = 0;
            playerToReceiveHit.hp -= totalDamage;
            //// steal hp points
            let weaponLifeStealChance = playersTurn.equippedWeapon.effects.find(effect => effect.effect === 'Steal hp points');
            let armourLifeStealChance = playersTurn.equippedArmour.effects.find(effect => effect.effect === 'Steal hp points');
            let totalLifeStealChance = 0;
            if (weaponLifeStealChance) totalLifeStealChance += weaponLifeStealChance.chance;
            if (armourLifeStealChance) totalLifeStealChance += armourLifeStealChance.chance;
            let randomNumberForLifeStealChance = randomNum(101);
            if (randomNumberForLifeStealChance <= totalLifeStealChance) playersTurn.hp += 1;
            if (randomNumberForLifeStealChance <= totalLifeStealChance) playerToReceiveHit.hp -= 1;
            ///// generate random gold
            playersTurn.winPot += randomNum(playersTurn.equippedWeapon.gold + 1);
            /// check game over
            if (playerToReceiveHit.hp <= 0) {
                room.gameOver = true;
                room.winner = playersTurn.username
                if(timer) clearInterval(timer);
            }
            if (room.turn === room.players[0].username) {
                room.turn = room.players[1].username;
            } else {
                room.turn = room.players[0].username;
            }
            io.to(roomId).emit('roomInfo', room);
        });
        socket.on('usePotion', info => {
            let room = rooms.find(room => room.roomId === info.roomId);
            const playerUsingPotion = room.players.find(player => player.username === info.username);
            playerUsingPotion.hp += playerUsingPotion.equippedPotion.restores;
            if (playerUsingPotion.hp > 100) playerUsingPotion.hp = 100;
            playerUsingPotion.equippedPotion = null;
            io.to(info.roomId).emit('roomInfo', room);
        });
        socket.on('leaveBattle', async info => {
            const playerWhoLeftBattle = players.find(player => player.socketId === socket.id);
            playerWhoLeftBattle.inBattle = false;
            let room = rooms.find(room => room.roomId === info.roomId);
            const winner = room.players.find(player => player.username === room.winner);
            if(winner) {
                const winnerDb = await playersDb.findOne({username: winner.username});
                if(!winner.equippedPotion && winnerDb.equippedPotion) {
                    const updateWinner = await playersDb.findOneAndUpdate(
                        {username: winner.username},
                        {$inc: {money: winner.winPot, victories: 1}, $set: {equippedPotion: null}, $pull: {inventory: winnerDb.equippedPotion}},
                        {new: true})
                } else {
                    const updateWinner = await playersDb.findOneAndUpdate(
                        {username: winner.username},
                        {$inc: {money: winner.winPot, victories: 1}},
                        {new: true})
                }
            }
            const looser = room.players.find(player => player.username !== room.winner);
            if(looser) {
                const looserDb = await playersDb.findOne({username: looser.username});
                if(!looser.equippedPotion && looserDb.equippedPotion) {
                    const updateLooser = await playersDb.findOneAndUpdate(
                        {username: looser.username},
                        {$set: {equippedPotion: null}, $pull: {inventory: looserDb.equippedPotion}, $inc: {losses :1}},
                        {new: true})
                }
            }
            io.emit('sendingAllUsers', players)
            room.players = room.players.filter(player => player.username !== info.username);
            if(room.players.length === 0) rooms = rooms.filter(room => room.roomId !== info.roomId);
        })
    })

}
