const resSend = (res, error, data, message) => {
    res.send({error, data, message})
}
const playersDb = require('../schemas/playerSchema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = {
    validateRegister: async (req,res,next) => {
        if(!req.body.username) return resSend(res, true, null, 'Username cannot be empty');
        if(!req.body.pass1) return resSend(res, true, null, 'Password cannot be empty');
        if(req.body.pass1 !== req.body.pass2) return resSend(res, true, null, 'Passwords should match.');
        if(!req.body.monster && req.body.monster!==0) return resSend(res, true, null, 'Please select your fighter.');
        const searchForUsername = await playersDb.findOne({username: req.body.username});
        if(searchForUsername) return resSend(res, true, null, 'Username is taken.');
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
        const token = req.headers.authorization;
        jwt.verify(token, process.env.JWT_SECRET, async (err, data) => {
            if(err) {
                console.log('verification error in middleware', err);
                return resSend(res, true, null, 'User verification failed');
            }
            req.player = data
        })
        next();
    }
}