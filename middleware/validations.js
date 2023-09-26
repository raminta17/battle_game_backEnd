const resSend = (res, error, data, message) => {
    res.send({error, data, message})
}
const playersDb = require('../schemas/playerSchema');
const bcrypt = require('bcrypt');
module.exports = {
    validateRegister: async (req,res,next) => {
        console.log(req.body);
        if(!req.body.username) return resSend(res, true, null, 'Username cannot be empty');
        if(!req.body.pass1) return resSend(res, true, null, 'Password cannot be empty');
        if(req.body.pass1 !== req.body.pass2) return resSend(res, true, null, 'Passwords should match.');
        if(!req.body.monster) return resSend(res, true, null, 'Please select your fighter.');
        const searchForUsername = await playersDb.findOne({username: req.body.username});
        if(searchForUsername) return resSend(res, true, null, 'Username is taken.');
        // const searchForMonster = await playersDb.findOne({monster: req.body.monster});
        // if(searchForMonster) return resSend(res, true, null, 'Mo');
        next();
    },
    validateLogin: async (req,res, next) => {
        const {username, password} = req.body;
        if(!username) return resSend(res, true, null, 'Username cannot be empty');
        if(!password) return resSend(res, true, null, 'Password cannot be empty');
        const findPlayer = await playersDb.findOne({username});
        if(!findPlayer) return resSend(res, true, null, 'User not found.');
        const isMatch = await bcrypt.compare(password, findPlayer.password);
        if(!isMatch) return resSend(res, true, null, 'Incorrect password.');
        next()
    },
    validateToken: (req,res,next) => {
        next();
    }
}