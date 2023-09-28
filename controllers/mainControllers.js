const resSend = (res, error, data, message) => {
    res.send({error, data, message})
}
const {sendMonsters, generateRandomWeapon, generateRandomArmour, generatePotion} = require('../modules/playersModule');
const playersDb = require('../schemas/playerSchema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


module.exports = {
    getMonsters: async (req, res) => {
        resSend(res, false, await sendMonsters(), 'monster data send');
    },
    register: async (req,res) => {
        const newPlayer = req.body;
        let monsters = await sendMonsters();
        const hash = await bcrypt.hash(newPlayer.pass1, 13);
        const player = new playersDb({
            username: newPlayer.username,
            password: hash,
            monster: monsters[newPlayer.monster]
        });
        player.save().then(()  => {
            console.log('player added to Db');
            resSend(res, false, null, 'registration success');
        }).catch(e => {
            console.log('error while saving player to Db', e);
        })


    },
    login: async (req,res) => {
        const {username} = req.body;
        const findPlayer = await playersDb.findOne({username}, {password:0});

            const player= {
                id: findPlayer._id,
                username,
                monster: findPlayer.monster
            }
            const token = jwt.sign(player,process.env.JWT_SECRET);


        resSend(res, false, {token, findPlayer}, 'login success');
    },
    sendPlayerInfo: async (req,res) => {
        const player = await playersDb.findOne({_id: req.player.id}, {password:0});
        resSend(res, false, player, 'user info send');
    },
    generateItems: async (req,res) => {
        const player = req.player;
        const findPlayer = await playersDb.findOne({_id: player.id} );
        if(findPlayer.money < 100) return resSend(res, true, null, 'You don\'t have enough money.');
        const updatePlayer = await playersDb.findOneAndUpdate(
            {_id: player.id},
            {$inc: {money: -100}},
            {new:true}
        )
        const playerToFrontEnd = await playersDb.findOne({_id: player.id}, {password:0});
        const randomWeapon = generateRandomWeapon();
        const randomArmour = generateRandomArmour();
        const randomPotion = generatePotion();
        resSend(res, false, {randomWeapon,randomArmour,randomPotion, playerToFrontEnd}, 'generating items');
    },
    takeItem: async (req,res) => {
        const player = req.player;
        const updatePlayer = await playersDb.findOneAndUpdate(
            {_id: player.id},
            {$push: {inventory: req.body}},
            {new:true}
        )
        const playerToFrontEnd = await playersDb.findOne({_id: player.id}, {password:0});
        resSend(res, false, playerToFrontEnd, 'item added to inventory');
    },
    equipItem: async (req,res) => {
        const player = req.player;
        if(req.body.name === 'Weapon') {
            const updatePlayer = await playersDb.findOneAndUpdate(
                {_id: player.id},
                {$set: {equippedWeapon: req.body}},
                {new:true}
            )
            const playerToFrontEnd = await playersDb.findOne({_id: player.id}, {password:0});
             return resSend(res, false, playerToFrontEnd, 'item equipped');
        }
        if(req.body.name === 'Armour') {
            const updatePlayer = await playersDb.findOneAndUpdate(
                {_id: player.id},
                {$set: {equippedArmour: req.body}},
                {new:true}
            )
            const playerToFrontEnd = await playersDb.findOne({_id: player.id}, {password:0});
            return resSend(res, false, playerToFrontEnd, 'item equipped');
        }
        if(req.body.name === 'Potion') {
            const updatePlayer = await playersDb.findOneAndUpdate(
                {_id: player.id},
                {$set: {equippedPotion: req.body}},
                {new:true}
            )
            const playerToFrontEnd = await playersDb.findOne({_id: player.id}, {password:0});
            return resSend(res, false, playerToFrontEnd, 'item equipped');
        }
    },
    removeItem: async (req,res) => {
        const player = req.player;
        const findPlayer = await playersDb.findOne({_id: player.id});
        if(req.body.id === findPlayer.equippedWeapon.id) {
            const removeEquippedWeapon = await playersDb.findOneAndUpdate(
                {_id: player.id},
                {$set: {equippedWeapon: {}}, $pull: {inventory: {id:req.body.id}}},
                {new:true}
            )
            const playerToFrontEnd = await playersDb.findOne({_id: player.id}, {password:0});
            return resSend(res, false, playerToFrontEnd, 'item removed');
        }
        if(req.body.id === findPlayer.equippedArmour.id) {
            const removeEquippedArmour = await playersDb.findOneAndUpdate(
                {_id: player.id},
                {$set: {equippedArmour: {}}, $pull: {inventory: {id:req.body.id}}},
                {new:true}
            )
            const playerToFrontEnd = await playersDb.findOne({_id: player.id}, {password:0});
            return resSend(res, false, playerToFrontEnd, 'item removed');
        }
        if(req.body.id === findPlayer.equippedPotion.id) {
            const removeEquippedPotion = await playersDb.findOneAndUpdate(
                {_id: player.id},
                {$set: {equippedPotion: {}}, $pull: {inventory: {id:req.body.id}}},
                {new:true}
            )
            const playerToFrontEnd = await playersDb.findOne({_id: player.id}, {password:0});
            return resSend(res, false, playerToFrontEnd, 'item removed');
        }
        const updatePlayer = await playersDb.findOneAndUpdate(
            {_id: player.id},
            {$pull: {inventory: {id:req.body.id}}},
            {new:true}
        )
        const playerToFrontEnd = await playersDb.findOne({_id: player.id}, {password:0});
        resSend(res, false, playerToFrontEnd, 'item removed');
    }
}