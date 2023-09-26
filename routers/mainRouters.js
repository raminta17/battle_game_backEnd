const express = require('express');
const router = express.Router();

const {validateRegister,
    validateLogin,
    validateToken} = require('../middleware/validations')
const {register,
    login,
    getMonsters} = require('../controllers/mainControllers')

router.get('/start', getMonsters)
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login)

module.exports = router;