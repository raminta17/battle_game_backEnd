let monsters = ['https://freesvg.org/img/Cute-Monster.png',
    'https://media.baamboozle.com/uploads/images/87783/1611026622_37067',
    'https://mario.wiki.gallery/images/thumb/b/b2/MPS_Shy_Guy_Artwork.png/800px-MPS_Shy_Guy_Artwork.png',
    'https://honeysanime.com/wp-content/uploads/2017/12/Lickilicky-pokemon-wallpaper.png',
    'https://media.contentapi.ea.com/content/dam/game-objects/plants-vs-zombies-2-game-objects/plants/coconut-cannon.png.adapt.crop16x9.png',
    'https://drakesgames.com/wp-content/uploads/2020/07/DuckOnly.png',
    'https://i.redd.it/50n4rd59d8d21.png',
    'https://www.giantbomb.com/a/uploads/square_small/15/151939/2163753-mp9_big_bob_omb_bust.png',
    'https://images.saymedia-content.com/.image/t_share/MTc2MjkyNTI1MjQ4ODE2MzAx/super-mario-bros-2-enemies-used-in-later-games.png',
    'https://media.contentapi.ea.com/content/dam/game-objects/plants-vs-zombies-2-game-objects/plants/akee.png.adapt.crop16x9.png',
    'https://www.pngall.com/wp-content/uploads/5/Cute-Monster-PNG.png',
    'https://freepngimg.com/thumb/monster/34041-7-blue-monster-transparent-background.png'
]
const itemLevels = [
    {
        level: 'A',
        color: 'pink'
    },
    {
        level: 'B',
        color: 'cyan'
    },
    {
        level: 'C',
        color: 'limegreen'
    }
];
const effects = [
    {
        effect: 'Critical hit',
        chance: 50
    },
    {
        effect: 'Double Dodge',
        chance: 40
    },
    {
        effect: 'Steal hit points',
        chance: 50
    }]
const items = {
    weapon: {
        images: ['https://static.vecteezy.com/system/resources/previews/026/795/438/original/cartoon-game-sword-on-transparent-background-crossed-knight-sword-ancient-weapon-cartoon-design-free-png.png'],
        level: [
            {
                    level: 'A',
                    slots: 3,
                    damage: [6, 30],
                    gold: 10
            },
            {
                    level: 'B',
                    slots: 1,
                    damage: [3, 20],
                    gold: 6
            },
            {
                    level: 'C',
                    slots: 0,
                    damage: [1, 5],
                    gold: 3
            }
        ]
    },
    armour: {
        images: [],
        level: [
            {
                level: 'A',
                slots: 3,
                dodge: [10, 90]
            },
            {
                level: 'B',
                slots: 1,
                dodge: [0, 50]
            },
            {
                level: 'C',
                slots: 0,
                dodge: [0, 20]
            }
        ]
    },
    potion: {
        images: ['https://cdn-icons-png.flaticon.com/512/8331/8331206.png'],
        restores: [1, 100]
    }
}

function randomNum(num) {
    return Math.floor(Math.random() * num);
}

const playersDb = require('../schemas/playerSchema');

module.exports = {
    sendMonsters: async () => {
        const allPlayers = await playersDb.find();
        allPlayers.map(player => {
            monsters = monsters.filter(monster => monster !== player.monster);
        })
        return monsters;
    },
    generateRandomWeapon: () => {
        const randomWeaponImgIndex = randomNum(items.weapon.images.length);
        const weaponLevelIndex = randomNum(itemLevels.length);
        const weaponLevelObj = itemLevels[weaponLevelIndex];
        const randomWeapon = items.weapon.level[weaponLevelIndex];
        const damage = randomNum(randomWeapon.damage[1]-randomWeapon.damage[0]) + randomWeapon.damage[0];
        const gold = randomNum(randomWeapon.gold+1);
        const effectSlots = randomNum(randomWeapon.slots+1);
        let weaponEffects = [];
        if(effectSlots === effects.length) {
            for (let i = 0; i < effects.length; i++) {
                const randomChance = randomNum(2);
                if(randomChance===1) weaponEffects.push({effect: effects[i].effect, change: randomNum(effects[i].chance)})
            }
        }else {
            for (let i = 0; i < effectSlots; i++) {
                const randomChance = randomNum(2);
                const randomEffect = randomNum(effects.length);
                if(randomChance===1) weaponEffects.push({effect: effects[randomEffect].effect, change: randomNum(effects[randomEffect].chance)+1})
            }
        }
        const weapon = {
            image: items.weapon.images[randomWeaponImgIndex],
            level: weaponLevelObj.level,
            color: weaponLevelObj.color,
            damage: damage,
            gold: gold,
            effects: weaponEffects
        }
        return weapon;
    },
    generateRandomArmour: () => {
        const randomArmourImgIndex = randomNum(items.armour.images.length);
        const armourLevelIndex = randomNum(itemLevels.length);
        const armourLevelObj = itemLevels[armourLevelIndex];
        const randomArmour = items.armour.level[armourLevelIndex];
        const dodge = randomNum(randomArmour.dodge[1]-randomArmour.dodge[0]) + randomArmour.dodge[0];
        const effectSlots = randomNum(randomArmour.slots+1);
        let armourEffects = [];
        if(effectSlots === effects.length) {
            for (let i = 0; i < effects.length; i++) {
                const randomChance = randomNum(2);
                if(randomChance===1) armourEffects.push({effect: effects[i].effect, chance: randomNum(effects[i].chance)})
            }
        }else {
            for (let i = 0; i < effectSlots; i++) {
                const randomChance = randomNum(2);
                const randomEffect = randomNum(effects.length);
                if(randomChance===1) armourEffects.push({effect: effects[randomEffect].effect, chance: randomNum(effects[randomEffect].chance)+1})
            }
        }
        const armour = {
            image: items.armour.images[randomArmourImgIndex],
            level: armourLevelObj.level,
            color: armourLevelObj.color,
            dodge: dodge,
            effects: armourEffects
        }
        return armour;
    }
}