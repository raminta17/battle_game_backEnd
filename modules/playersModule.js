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
const playersDb = require('../schemas/playerSchema');

module.exports = {
    sendMonsters: async () => {
        const allPlayers = await playersDb.find();
        allPlayers.map(player => {
            monsters = monsters.filter(monster => monster !== player.monster);
        })
        return monsters;
    }
}