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
        default: 1000
    },
    generatedItems: {
        type: Array,
        required: false,
        default: []
    },
    inventory: {
        type: Array,
        required: true,
        default: [{
            id: 1,
            name: 'Weapon',
            image: 'https://png.pngtree.com/png-clipart/20230805/original/pngtree-fist-hand-cartoon-smiley-success-graphic-vector-picture-image_9846520.png',
            level: 'C',
            color: 'limegreen',
            damage: 1,
            gold: 1,
            effects: []
        }]
    },
    equippedWeapon: {
        type: Object,
        required: true,
        default: {
            id: 1,
            name: 'Weapon',
            image: 'https://png.pngtree.com/png-clipart/20230805/original/pngtree-fist-hand-cartoon-smiley-success-graphic-vector-picture-image_9846520.png',
            level: 'C',
            color: 'limegreen',
            damage: 1,
            gold: 1,
            effects: []
        }
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