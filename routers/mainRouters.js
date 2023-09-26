const express = require('express');
const router = express.Router();

const {validateRegister,
    validateLogin,
    validateToken} = require('../middleware/validations')
const {register,
    login,
    getMonsters,
    generateItems,
    sendPlayerInfo} = require('../controllers/mainControllers')

router.get('/start', getMonsters)
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/generateItems', generateItems);
router.get('/getPlayerInfo', validateToken, sendPlayerInfo);

module.exports = router;