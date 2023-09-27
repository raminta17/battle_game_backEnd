const express = require('express');
const router = express.Router();

const {validateRegister,
    validateLogin,
    validateToken} = require('../middleware/validations')
const {register,
    login,
    getMonsters,
    generateItems,
    sendPlayerInfo,
    takeItem,
    equipItem,
    removeItem} = require('../controllers/mainControllers')

router.get('/start', getMonsters)
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/generateItems', validateToken, generateItems);
router.get('/getPlayerInfo', validateToken, sendPlayerInfo);
router.post('/takeItem', validateToken, takeItem);
router.post('/equipItem', validateToken, equipItem);
router.post('/removeItem', validateToken, removeItem);

module.exports = router;