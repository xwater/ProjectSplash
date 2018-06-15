const Character = require('./Character')
const db = require('./database')

const CAPTAIN_FALCON = 'falcon'
const DK = 'dk'
const FOX = 'fox'
const GAME_AND_WATCH = 'gaw'
const IKE = 'ike'
const JIGGILY_PUFF = 'puff'
const KING_DE_DE_DE = 'dedede'
const KIRBY = 'kirby'
const LINK = 'link'
const LUIGI = 'luigi'
const MARIO = 'mario'
const MII = 'mii'
const NESS = 'ness'
const PIKACHU = 'pika'
const SAMUS = 'samus'
const SONIC = 'sonic'
const SQUIRTLE = 'squirtle'
const YOSHI = 'yoshi'

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

let unlockableCharacters = []

let defaultCharacters = [
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
  YOSHI
]

function createCharacters () {
  let characters = {}
  for (let i = 0; i < defaultCharacters.length; i++) {
    characters[defaultCharacters[i]] = (new Character(i, defaultCharacters[i], true, aliases[defaultCharacters[i]]))
  }
  db.initDefaultCharacters(characters)
  return characters
}

module.exports = {
  createCharacters,
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
  YOSHI
}
