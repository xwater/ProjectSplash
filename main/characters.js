const Character = require('./Character')
const db = require('./database')

const BOWSER = 'bowser'
const BOWSER_JR = 'bowserjr'
const CAPTAIN_FALCON = 'falcon'
const CAPTAIN_OLIMAR = 'captainolimar'
const CHARIZARD = 'charizard'
const DIDDY = 'diddy'
const DK = 'dk'
const DUCK_HUNT_DOG = 'duckhuntdog'
const FALCO = 'falco'
const FOX = 'fox'
const GAME_AND_WATCH = 'gaw'
const GANON = 'ganon'
const GRENINJA = 'greninja'
const IKE = 'ike'
const JIGGILY_PUFF = 'puff'
const KING_DE_DE_DE = 'dedede'
const KIRBY = 'kirby'
const LINK = 'link'
const LINK_TOON = 'linktoon'
const LITTLE_MAC = 'littlemac'
const LUCARIO = 'lucario'
const LUCINA = 'lucina'
const LUIGI = 'luigi'
const MARIO = 'mario'
const MARTH = 'marth'
const MEGA_MAN = 'megaman'
const META_KNIGHT = 'metaknight'
const MII = 'mii'
const NESS = 'ness'
const PAC_MAN = 'pacman'
const PALUTENA = 'palutena'
const PEACH = 'peach'
const PIKACHU = 'pika'
const PIT = 'pit'
const ROB = 'rob'
const ROBIN = 'robin'
const ROSALINA = 'rosalina'
const SAMUS = 'samus'
const SAMUS_ZERO = 'samuszero'
const SHEIK = 'sheik'
const SONIC = 'sonic'
const SQUIRTLE = 'squirtle'
const VILLAGER = 'villager'
const WARIO = 'wario'
const WII_FIT_TRAINER = 'wiifittrainer'
const YOSHI = 'yoshi'
const ZELDA = 'zelda'

let aliases = {}

aliases[MARIO] = ['redluigi', 'charles martinet', 'charlesmartinet', 'the great gonzales', 'thegreatgonzales', 'marty-o', 'greatgonzales']
aliases[LUIGI] = ['greenmario', 'mr. l', 'dweeb', 'weegee', 'weegi', 'this character is lame', 'moistTrash']
aliases[PIKACHU] = ['pikachu', 'pika-pika', 'yellow mouse', 'electricrat', 'electric rat']
aliases[JIGGILY_PUFF] = ['jigglypuff', 'purin', 'hungrybox', 'h-box', 'hbox', 'jiggly']
aliases[DK] = ['donkey kong', 'donny keng', 'barb', 'harry dong', 'harambe']
aliases[CAPTAIN_FALCON] = ['captain falcon', 'captainfalcon', 'moistFalcon']
aliases[NESS] = ['backthrow boy', 'backthrow-boy']
aliases[LINK] = ['hero of time', 'herooftime', 'lonk', 'ocarina of time is a great game', 'moistSheck']
aliases[SAMUS] = ['metroid', 'mattroid', 'shamus', 'girlrobot', 'seamus']
aliases[YOSHI] = ['greendog', 'moistCry']
aliases[FOX] = ['starfox', 'spacedog', 'lucidfoxx', 'foxmccloud', 'foxonly', 'foxonlyfinaldestination']
aliases[KIRBY] = ['lilkirbs', 'vacuum', 'succ', 'sgtsucc', 'moistSucc']
aliases[IKE] = ['fightformyfriends', 'strongmarth', 'bigmarth']
aliases[SONIC] = ['sanic', 'gottagofast', '&knuckles', 'moistFast']
aliases[KING_DE_DE_DE] = ['deedeedee', 'deedede', 'kingdedede', 'king dedede']
aliases[GAME_AND_WATCH] = ['gameandwatch', 'game&watch', 'mrgameandwatch', 'mrgame&watch', 'game and watch', 'game & watch', 'g&w', 'gaymanwatch']
aliases[SQUIRTLE] = ['turtle', 'squirt turtle', 'moistSquirt', 'moistGold']
aliases[MII] = ['xwater', 'miikii', 'miiki', 'miki', 'slickmik', 'quickmik', 'trickymiki', 'gunkill', 'clutchwater', 'stickymiki']
aliases[PEACH] = []
aliases[LUCINA] = []
aliases[BOWSER] = []
aliases[ROSALINA] = []
aliases[BOWSER_JR] = []
aliases[WARIO] = []
aliases[DIDDY] = []
aliases[LITTLE_MAC] = []
aliases[ZELDA] = []
aliases[SHEIK] = []
aliases[GANON] = []
aliases[LINK_TOON] = []
aliases[SAMUS_ZERO] = []
aliases[PIT] = []
aliases[PALUTENA] = []
aliases[MARTH] = []
aliases[ROBIN] = []
aliases[MEGA_MAN] = []
aliases[PAC_MAN] = []
aliases[CAPTAIN_OLIMAR] = []
aliases[VILLAGER] = []
aliases[ROB] = []
aliases[GRENINJA] = []
aliases[LUCARIO] = []
aliases[CHARIZARD] = []
aliases[FALCO] = []
aliases[META_KNIGHT] = []
aliases[DUCK_HUNT_DOG] = []

let unlockableCharacters = [
  ROSALINA,
  SHEIK,
  PALUTENA,
  LUCINA,
  WII_FIT_TRAINER
  // BOWSER,
  // BOWSER_JR,
  // DIDDY,
  // LITTLE_MAC,
  // GANON,
  // LINK_TOON,
  // SAMUS_ZERO,
  // ROBIN,
  // DUCK_HUNT_DOG,
  // META_KNIGHT,
  // FALCO,
  // CHARIZARD,
  // LUCARIO,
  // GRENINJA,
  // ROB,
  // VILLAGER,
  // CAPTAIN_OLIMAR,
  // PAC_MAN,
  // MEGA_MAN
]

let defaultCharacters = [
  MARTH,
  PEACH,
  ZELDA,
  CAPTAIN_FALCON,
  DK,
  FOX,
  GAME_AND_WATCH,
  IKE,
  JIGGILY_PUFF,
  KING_DE_DE_DE,
  KIRBY,
  LINK,
  LUIGI,
  MARIO,
  MII,
  NESS,
  PIKACHU,
  SAMUS,
  SONIC,
  SQUIRTLE,
  YOSHI,
  PIT
]

function init () {
  return new Promise(resolve => {
    let characters = {}
    for (let i = 0; i < defaultCharacters.length; i++) {
      characters[defaultCharacters[i]] = (new Character(i, defaultCharacters[i], true, aliases[defaultCharacters[i]]))
    }

    for (let i = 0; i < unlockableCharacters.length; i++) {
      characters[unlockableCharacters[i]] = (new Character(i, unlockableCharacters[i], false, aliases[unlockableCharacters[i]]))
    }

    db.initCharacters(characters)
    db.getUnlockedCharacters().then(unlockedCharacters => {
      for (let character of unlockedCharacters) {
        for (let i = 0; i < characters.length; i++) {
          if (characters[i].name === character.character_name) {
            characters[i].unlocked = true
          }
        }
      }
      resolve(characters)
    })
  })
}

module.exports = {
  init,
  CAPTAIN_FALCON,
  DK,
  FOX,
  GAME_AND_WATCH,
  IKE,
  JIGGILY_PUFF,
  KING_DE_DE_DE,
  KIRBY,
  LINK,
  LUIGI,
  MARIO,
  MII,
  NESS,
  PIKACHU,
  SAMUS,
  SONIC,
  SQUIRTLE,
  YOSHI,
  PEACH,
  BOWSER,
  ROSALINA,
  BOWSER_JR,
  DIDDY,
  LITTLE_MAC,
  ZELDA,
  SHEIK,
  GANON,
  LINK_TOON,
  SAMUS_ZERO,
  PIT,
  PALUTENA,
  MARTH,
  ROBIN,
  DUCK_HUNT_DOG,
  META_KNIGHT,
  FALCO,
  CHARIZARD,
  LUCARIO,
  GRENINJA,
  ROB,
  VILLAGER,
  CAPTAIN_OLIMAR,
  PAC_MAN,
  MEGA_MAN
}
