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
            if (!players.some(player => player.username === data.username)) {
                players.push({
                    socketId: socket.id,
                    username: data.username,
                    monster: data.monster,
                    inBattle: false,
                    sentInvitations: [],
                    receivedInvitations: []
                })
            }
            io.emit('sendingAllUsers', players);
        } catch (err) {
            console.log('verification error in sockets', err);
        }
        socket.on("disconnect", () => {
            console.log('user disconnected');
            players = players.filter(player => player.socketId !== socket.id);
            io.emit('sendingAllUsers', players)
        });
        socket.on('sendInvitation', invitedPlayerSocketId => {
            const playerThatSentAnInvite = players.find(player => player.socketId === socket.id);
            const invitedPlayer = players.find(player => player.socketId === invitedPlayerSocketId);
            playerThatSentAnInvite.sentInvitations.push(invitedPlayer.username);
            invitedPlayer.receivedInvitations.push(playerThatSentAnInvite.username);
            console.log('playerThatSentAnInvite',playerThatSentAnInvite);
            console.log('invitedPlayer',invitedPlayer);
            io.to(invitedPlayerSocketId).emit('receiveRequest', invitedPlayer.receivedInvitations);
            io.emit('sendingAllUsers', players);
            // io.to(socket.id).emit('invitationSentSuccessfully', invitedPlayerSocketId);
            let roomId = playerThatSentAnInvite.socketId + invitedPlayerSocketId;
            socket.join(roomId);
        });
        socket.on('invitationDenied', playerWhoWasDeniedSocketId => {
            const playerWhoDeniedInvitation = players.find(player => player.socketId === socket.id);
            io.to(playerWhoWasDeniedSocketId).emit('denied', playerWhoDeniedInvitation);
        });
        socket.on('invitationAccepted', async playerWhoWantsToPlay => {
            const playerWhoAcceptedInvite = players.find(player => player.socketId === socket.id);
            playerWhoAcceptedInvite.inBattle = true;
            playerWhoWantsToPlay = players.find(player => player.username === playerWhoWantsToPlay);
            playerWhoWantsToPlay.inBattle = true;
            console.log('playerWhoWantsToPlay when the other accepted his request to play',playerWhoWantsToPlay);
            io.to(playerWhoWantsToPlay.socketId).emit('yourInvitationWasAccepted', playerWhoAcceptedInvite);
            let roomId = playerWhoWantsToPlay.socketId + playerWhoAcceptedInvite.socketId;
            socket.join(roomId);
            let allPlayersInDb = await playersDb.find();
            console.log('allPlayersInDb', allPlayersInDb);
            let player1= null;
            try {
                player1 = await playersDb.findOne({username: playerWhoWantsToPlay.username}, {
                    password: 0,
                    generatedItems: 0,
                    inventory: 0,
                    money: 0
                });
                console.log('player1 before adding additional keys inside try', player1);
            } catch (e) {
                console.log('error finding player1', e)
            }

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
                timer: null,
                winner: null
            }
            rooms.push(room);
            io.to(roomId).emit('joinedRoom', room);
            io.emit('sendingAllUsers', players)
        });
        socket.on('turn', roomId => {
            if(timer) clearInterval(timer);
            console.log(roomId);
            // console.log(rooms);
            let room = rooms.find(room => room.roomId === roomId);
            console.log('room turn', room.turn);
            const playersTurn = room.players.find(player => player.username === room.turn);
            const playerToReceiveHit = room.players.find(player => player.username !== room.turn);
            console.log('playersTurn', playersTurn.username);
            console.log('playerToReceiveHit', playerToReceiveHit.username);
            room.timer = 20;
            timer = setInterval(() => {
                room.timer -=1;
                console.log(room.timer)
                if(room.timer <=0) {
                    room.gameOver = true;
                    room.winner = playersTurn.username;
                    console.log('room turn, players turn username, winner', room.turn, playersTurn.username, room.winner);
                    if(timer) clearInterval(timer);
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
            let armourDodgeChance = playerToReceiveHit.equippedArmour.effects.find(effect => effect.effect === 'Double Dodge');
            let weaponDodgeChance = playerToReceiveHit.equippedWeapon.effects.find(effect => effect.effect === 'Double Dodge');
            let totalDodgeChance = 0;
            if (armourDodgeChance) totalDodgeChance += armourDodgeChance.chance;
            if (weaponDodgeChance) totalDodgeChance += weaponDodgeChance.chance;
            let randomNumberForDodgeChance = randomNum(101);
            let totalDamage = randomDamage - totalShield;
            if (randomNumberForDodgeChance <= totalDodgeChance) totalDamage = 0;
            playerToReceiveHit.hp -= totalDamage;
            //// steal hp points
            let weaponLifeStealChance = playersTurn.equippedWeapon.effects.find(effect => effect.effect === 'Steal hit points');
            let armourLifeStealChance = playersTurn.equippedArmour.effects.find(effect => effect.effect === 'Steal hit points');
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
            if (playerUsingPotion.hp > 100) playerUsingPotion.hp = 100;
            playerUsingPotion.equippedPotion = null;
            io.to(info.roomId).emit('roomInfo', room);
        });
        socket.on('leaveBattle', async info => {
            const playerWhoLeftBattle = players.find(player => player.socketId === socket.id);
            playerWhoLeftBattle.inBattle = false;
            console.log('leave battle room id',info.roomId);
            let room = rooms.find(room => room.roomId === info.roomId);
            console.log('leave battle room',room);
            const winner = room.players.find(player => player.username === room.winner);
            console.log('leave battle winner',winner);
            if(winner) {
                const winnerDb = await playersDb.findOne({username: winner.username});
                if(!winner.equippedPotion && winnerDb.equippedPotion) {
                    const updateWinner = await playersDb.findOneAndUpdate(
                        {username: winner.username},
                        {$inc: {money: winner.winPot}, $set: {equippedPotion: null}, $pull: {inventory: winnerDb.equippedPotion}},
                        {new: true})
                } else {
                    const updateWinner = await playersDb.findOneAndUpdate(
                        {username: winner.username},
                        {$inc: {money: winner.winPot}},
                        {new: true})
                }
            }
            const looser = room.players.find(player => player.username !== room.winner);
            console.log('leave battle looser',looser);
            if(looser) {
                const looserDb = await playersDb.findOne({username: looser.username});
                if(!looser.equippedPotion && looserDb.equippedPotion) {
                    const updateLooser = await playersDb.findOneAndUpdate(
                        {username: looser.username},
                        {$set: {equippedPotion: null}, $pull: {inventory: looserDb.equippedPotion}},
                        {new: true})
                }
            }
            io.emit('sendingAllUsers', players)
            room.players = room.players.filter(player => player.username !== info.username);
            console.log('leave battle list of room players ',room.players);
            if(room.players.length === 0) rooms = rooms.filter(room => room.roomId !== info.roomId);
        })
    })

}
