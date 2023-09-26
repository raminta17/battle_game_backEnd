const resSend = (res, error, data, message) => {
    res.send({error, data, message})
}
const {sendMonsters} = require('../modules/playersModule');
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
        console.log('findPlayer without password', findPlayer);

            const player= {
                id: findPlayer._id,
                username
            }
            const token = jwt.sign(player,process.env.JWT_SECRET);


        resSend(res, false, {token, findPlayer}, 'login success');
    }
}