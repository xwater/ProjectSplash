const Character = require('./Character')
const db = require('./database')

module.exports =
  class Roster {
    constructor () {
      this.BOWSER = {value: 1, fullName: 'Boswer'}
      this.BOWSER_JR = {value: 2, fullName: 'Bowser Jr'}
      this.CAPTAIN_FALCON = {value: 3, fullName: 'Captain Falcon'}
      this.CAPTAIN_OLIMAR = {value: 4, fullName: 'Captain Olimar'}
      this.CHARIZARD = {value: 5, fullName: 'Charizard'}
      this.DIDDY = {value: 6, fullName: 'Diddy Kong'}
      this.DK = {value: 7, fullName: 'Donkey Kong'}
      this.DUCK_HUNT_DOG = {value: 8, fullName: 'Duck Hunt Dog'}
      this.FALCO = {value: 9, fullName: 'Falco'}
      this.FOX = {value: 10, fullName: 'Fox'}
      this.GAME_AND_WATCH = {value: 11, fullName: 'Game and Watch'}
      this.GANON = {value: 12, fullName: 'Ganon'}
      this.GRENINJA = {value: 13, fullName: 'Greninja'}
      this.IKE = {value: 14, fullName: 'Ike'}
      this.JIGGILY_PUFF = {value: 15, fullName: 'Jigglypuff'}
      this.KING_DE_DE_DE = {value: 16, fullName: 'King Dedede'}
      this.KIRBY = {value: 17, fullName: 'Kirby'}
      this.LINK = {value: 18, fullName: 'Link'}
      this.LINK_TOON = {value: 19, fullName: 'Toon Link'}
      this.LITTLE_MAC = {value: 20, fullName: 'Little Mac'}
      this.LUCARIO = {value: 21, fullName: 'Lucario'}
      this.LUCINA = {value: 22, fullName: 'Lucina'}
      this.LUIGI = {value: 23, fullName: 'Luigi'}
      this.MARIO = {value: 24, fullName: 'Mario'}
      this.MARTH = {value: 25, fullName: 'Marth'}
      this.MEGA_MAN = {value: 26, fullName: 'Mega Man'}
      this.META_KNIGHT = {value: 27, fullName: 'Meta Knight'}
      this.MII = {value: 28, fullName: 'Mii'}
      this.NESS = {value: 29, fullName: 'Ness'}
      this.PAC_MAN = {value: 30, fullName: 'Pac-Man'}
      this.PALUTENA = {value: 31, fullName: 'Palutena'}
      this.PEACH = {value: 32, fullName: 'Peach'}
      this.PIKACHU = {value: 33, fullName: 'Pikachu'}
      this.PIT = {value: 34, fullName: 'Pit'}
      this.ROB = {value: 35, fullName: 'Rob'}
      this.ROBIN = {value: 36, fullName: 'Robin'}
      this.ROSALINA = {value: 37, fullName: 'Rosalina'}
      this.SAMUS = {value: 38, fullName: 'Samus'}
      this.ZERO_SUIT_SAMUS = {value: 39, fullName: 'Zero Suit Samus'}
      this.SHEIK = {value: 40, fullName: 'Sheik'}
      this.SONIC = {value: 41, fullName: 'Sonic'}
      this.SQUIRTLE = {value: 42, fullName: 'Squirtle'}
      this.VILLAGER = {value: 43, fullName: 'Villager'}
      this.WARIO = {value: 44, fullName: 'Wario'}
      this.WII_FIT_TRAINER = {value: 45, fullName: 'Wii Fit Trainer'}
      this.YOSHI = {value: 46, fullName: 'Yoshi'}
      this.ZELDA = {value: 47, fullName: 'Zelda'}

      this.roster = []
      this.unlockableCharacters = []
      this.aliases = {}
      this.charPool = {}

      this.init()

    }

    init() {
      this.initAliases()
      this.initLineup()
      this.initUnlockableLineup()
    }


    initCharacters (){
      return new Promise(resolve => {
        let characters = []
        for (let i = 0; i < this.roster.length; i++) {
          let currentChar = this.roster[i]
          if (this.unlockableCharacters.some(c => (c.value === currentChar.value) === true)) {
            for (let j = 0; j < this.unlockableCharacters.length; j++) {
              if (this.unlockableCharacters[j] === this.roster[i]) {
                characters.push(new Character(this.unlockableCharacters[j], false, this.aliases[this.unlockableCharacters[j].value]))
              }
            }
          }
          else {
            characters.push(new Character(this.roster[i], true, this.aliases[this.roster[i].value]))
          }
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

    initAliases () {
      this.aliases[this.MARIO.value] = [
        'redluigi',
        'charles martinet',
        'charlesmartinet',
        'the great gonzales',
        'thegreatgonzales',
        'marty-o',
        'greatgonzales']
      this.aliases[this.LUIGI.value] = [
        'greenmario',
        'mr. l',
        'dweeb',
        'weegee',
        'weegi',
        'this character is lame',
        'moistTrash']
      this.aliases[this.PIKACHU.value] = ['pikachu', 'pika-pika', 'yellow mouse', 'electricrat', 'electric rat']
      this.aliases[this.JIGGILY_PUFF.value] = ['jigglypuff', 'purin', 'hungrybox', 'h-box', 'hbox', 'jiggly']
      this.aliases[this.DK.value] = ['donkey kong', 'donny keng', 'barb', 'harry dong', 'harambe']
      this.aliases[this.CAPTAIN_FALCON.value] = ['captain falcon', 'captainfalcon', 'moistFalcon']
      this.aliases[this.NESS.value] = ['backthrow boy', 'backthrow-boy']
      this.aliases[this.LINK.value] = [
        'hero of time',
        'herooftime',
        'lonk',
        'ocarina of time is a great game',
        'moistSheck']
      this.aliases[this.SAMUS.value] = ['metroid', 'mattroid', 'shamus', 'girlrobot', 'seamus']
      this.aliases[this.YOSHI.value] = ['greendog', 'moistCry']
      this.aliases[this.FOX.value] = [
        'starfox',
        'spacedog',
        'lucidfoxx',
        'foxmccloud',
        'foxonly',
        'foxonlyfinaldestination']
      this.aliases[this.KIRBY.value] = ['lilkirbs', 'vacuum', 'succ', 'sgtsucc', 'moistSucc']
      this.aliases[this.IKE.value] = ['fightformyfriends', 'strongmarth', 'bigmarth']
      this.aliases[this.SONIC.value] = ['sanic', 'gottagofast', '&knuckles', 'moistFast']
      this.aliases[this.KING_DE_DE_DE.value] = ['deedeedee', 'deedede', 'kingdedede', 'king dedede']
      this.aliases[this.GAME_AND_WATCH.value] = [
        'gameandwatch',
        'game&watch',
        'mrgameandwatch',
        'mrgame&watch',
        'game and watch',
        'game & watch',
        'g&w',
        'gaymanwatch']
      this.aliases[this.SQUIRTLE.value] = ['turtle', 'squirt turtle', 'moistSquirt', 'moistGold']
      this.aliases[this.MII.value] = [
        'xwater',
        'miikii',
        'miiki',
        'miki',
        'slickmik',
        'quickmik',
        'trickymiki',
        'gunkill',
        'clutchwater',
        'stickymiki']
      this.aliases[this.PEACH.value] = []
      this.aliases[this.LUCINA.value] = []
      this.aliases[this.BOWSER.value] = []
      this.aliases[this.ROSALINA.value] = []
      this.aliases[this.BOWSER_JR.value] = []
      this.aliases[this.WARIO.value] = []
      this.aliases[this.DIDDY.value] = []
      this.aliases[this.LITTLE_MAC.value] = []
      this.aliases[this.ZELDA.value] = []
      this.aliases[this.SHEIK.value] = []
      this.aliases[this.GANON.value] = []
      this.aliases[this.LINK_TOON.value] = []
      this.aliases[this.ZERO_SUIT_SAMUS.value] = []
      this.aliases[this.PIT.value] = []
      this.aliases[this.PALUTENA.value] = []
      this.aliases[this.MARTH.value] = []
      this.aliases[this.ROBIN.value] = []
      this.aliases[this.MEGA_MAN.value] = []
      this.aliases[this.PAC_MAN.value] = []
      this.aliases[this.CAPTAIN_OLIMAR.value] = []
      this.aliases[this.VILLAGER.value] = []
      this.aliases[this.ROB.value] = []
      this.aliases[this.GRENINJA.value] = []
      this.aliases[this.LUCARIO.value] = []
      this.aliases[this.CHARIZARD.value] = []
      this.aliases[this.FALCO.value] = []
      this.aliases[this.META_KNIGHT.value] = []
      this.aliases[this.DUCK_HUNT_DOG.value] = []
      this.aliases[this.WII_FIT_TRAINER.value] = []
    }

    initLineup () {
      this.roster.push(this.MARIO)
      this.roster.push(this.LUIGI)
      this.roster.push(this.YOSHI)
      this.roster.push(this.PEACH)
      this.roster.push(this.ROSALINA)

      this.roster.push(this.DK)

      this.roster.push(this.SAMUS)
      this.roster.push(this.ZERO_SUIT_SAMUS)

      this.roster.push(this.LINK)
      this.roster.push(this.ZELDA)
      this.roster.push(this.SHEIK)

      this.roster.push(this.PIT)
      this.roster.push(this.PALUTENA)

      this.roster.push(this.GAME_AND_WATCH)

      this.roster.push(this.WII_FIT_TRAINER)

      this.roster.push(this.MARTH)
      this.roster.push(this.IKE)
      this.roster.push(this.LUCINA)

      this.roster.push(this.CAPTAIN_FALCON)

      this.roster.push(this.FOX)

      this.roster.push(this.KIRBY)
      this.roster.push(this.KING_DE_DE_DE)

      this.roster.push(this.SONIC)

      this.roster.push(this.JIGGILY_PUFF)
      this.roster.push(this.PIKACHU)
      this.roster.push(this.SQUIRTLE)

      this.roster.push(this.NESS)

      this.roster.push(this.MII)
    }

    initUnlockableLineup () {
      this.unlockableCharacters.push(this.ROSALINA)
      this.unlockableCharacters.push(this.SHEIK)
      this.unlockableCharacters.push(this.PALUTENA)
      this.unlockableCharacters.push(this.LUCINA)
      this.unlockableCharacters.push(this.ZERO_SUIT_SAMUS)
      this.unlockableCharacters.push(this.WII_FIT_TRAINER)
        // BOWSER,
        // BOWSER_JR,
        // DIDDY,
        // LITTLE_MAC,
        // GANON,
        // LINK_TOON,
        // ZERO_SUIT_SAMUS,
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
    }

  }

