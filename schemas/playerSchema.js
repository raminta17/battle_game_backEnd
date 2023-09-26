const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const playerSchema = new Schema ({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    monster: {
        type: String,
        required: true
    },
    money: {
        type: Number,
        required: true,
        default: 100
    },
    inventory: {
        type: Array,
        required: true,
        default: []
    },
    equip: {
        type: Array,
        required: true,
        default: []
    },
    hp: {
        type: Number,
        required: true,
        default: 100
    }
})

const player = mongoose.model('players', playerSchema);

module.exports = player;