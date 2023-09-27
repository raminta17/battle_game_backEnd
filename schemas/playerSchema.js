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
    equippedWeapon: {
        type: Object,
        required: true,
        default: {}
    },
    equippedArmour: {
        type: Object,
        required: false,
        default: {}
    },
    equippedPotion: {
        type: Object,
        required: false,
        default: {}
    },
    hp: {
        type: Number,
        required: true,
        default: 100
    }
})

const player = mongoose.model('players', playerSchema);

module.exports = player;