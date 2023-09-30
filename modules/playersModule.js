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
        effect: 'Dodge Chance',
        chance: 40
    },
    {
        effect: 'Steal hit points',
        chance: 50
    }]
const items = {
    weapon: {
        images: ['https://static.vecteezy.com/system/resources/previews/026/795/438/original/cartoon-game-sword-on-transparent-background-crossed-knight-sword-ancient-weapon-cartoon-design-free-png.png',
        'https://cdn4.iconfinder.com/data/icons/weapon-13/64/Launcher-machine_gun-shooting-weapons-512.png',
        'https://static.vecteezy.com/system/resources/previews/026/795/374/non_2x/cartoon-game-sword-on-transparent-background-crossed-knight-sword-ancient-weapon-cartoon-design-free-png.png',
        'https://clipart-library.com/2023/axe-clipart-md.png',
        'https://png.pngtree.com/png-clipart/20221030/ourmid/pngtree-cartoon-ax-png-image_6402827.png',
        'https://png.pngtree.com/png-clipart/20230805/original/pngtree-fist-hand-cartoon-smiley-success-graphic-vector-picture-image_9846520.png',
        'https://www.fg-a.com/weapons/japanese-knife-2-2018.png',
        'https://cdn-icons-png.flaticon.com/512/2836/2836728.png',
        'https://easydrawingguides.com/wp-content/uploads/2021/01/Bow-and-Arrow-Step-10.png',
        'https://i.pinimg.com/originals/a1/b4/a2/a1b4a2053bf82cc167d86a44ad688d4f.png',],
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
        images: ['https://www.pngall.com/wp-content/uploads/4/Armor-PNG-Images.png',
            'https://png.pngtree.com/png-clipart/20221021/ourmid/pngtree-iron-fantasy-high-boots-knight-armor-isolated-png-image_6373155.png',
            'https://clipart-library.com/2023/Rain-Boots-Rubber-Boots-Boots-Shoes-Red-Boots-5676901.png',
            'https://cdn-icons-png.flaticon.com/512/8879/8879184.png',
            'https://img.freepik.com/free-icon/badge_318-444894.jpg',
            'https://png.pngtree.com/png-vector/20230413/ourmid/pngtree-hand-draw-elegant-golden-shield-icon-vector-png-image_6696892.png',
            'https://cdn-icons-png.flaticon.com/512/1785/1785310.png',
            'https://tr.rbxcdn.com/cd2d5cd6f3bccb48df57ff285c846bde/420/420/LayeredAccessory/Png',
            'https://tr.rbxcdn.com/b4ab25c2d6a780b3fc318677c91d105c/420/420/LayeredAccessory/Png',
            'https://i.pinimg.com/originals/c1/fa/d0/c1fad01821401a028bd77963942be5c1.png',
        'https://cdn0.iconfinder.com/data/icons/helmet-3/500/vi87_8_knight_helmet_guard_cartoon_object_armor_head-512.png'],
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
                if(randomChance===1) weaponEffects.push({effect: effects[i].effect, chance: randomNum(effects[i].chance)})
            }
        }else {
            for (let i = 0; i < effectSlots; i++) {
                const randomChance = randomNum(2);
                const randomEffect = randomNum(effects.length);
                if(randomChance===1) weaponEffects.push({effect: effects[randomEffect].effect, chance: randomNum(effects[randomEffect].chance)+1})
            }
        }
        const weapon = {
            id: Math.random(),
            name: 'Weapon',
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
            id: Math.random(),
            name: 'Armour',
            image: items.armour.images[randomArmourImgIndex],
            level: armourLevelObj.level,
            color: armourLevelObj.color,
            dodge: dodge,
            effects: armourEffects
        }
        return armour;
    },
    generatePotion: () => {
        const potion = {
            id: Math.random(),
            name: 'Potion',
            image: items.potion.images[0],
            restores: randomNum(items.potion.restores[1]-items.potion.restores[0])+ items.potion.restores[0]
        }
        return potion;
    }
}