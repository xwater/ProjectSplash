module.exports =
  class Character {
    constructor (id, name, unlocked, aliases) {
      this.id = id
      this.name = name
      this.unlocked = unlocked
      this.aliases = aliases
      this.sfx = {
        taunts: [],
        chimes: [],
        winner: './assets/sfx/announcer/winner.wav',
        announcer: './assets/sfx/announcer/' + this.name + '.wav',
        suddenDeath: './assets/sfx/announcer/suddendeath.wav'
      }

      // TODO possible modifiers

      this.gifs = {
        win: [],
        lose: './assets/gifs/lose/' + this.name + '/' + this.name + '1.gif',
        challenger: './assets/gifs/misc/challenger.gif'
      }

      this.videos = {
        victory: './assets/gifs/victory/' + this.name + '/' + this.name + '.mp4'
      }

      this.initTaunts()
      this.initChimes()
      this.initWinGifs()
    }

    initTaunts () {
      for (let i = 1; i < 6; i++) {
        this.sfx.taunts.push('./assets/sfx/' + this.name + '/taunt/' + this.name + i)
      }
    }

    initChimes () {
      for (let i = 1; i < 2; i++) {
        this.sfx.chimes.push('./assets/sfx/' + this.name + '/chime/' + this.name + i)
      }
    }

    initWinGifs () {
      for (let i = 1; i < 4; i++) {
        this.gifs.win.push('./assets/gifs/win/' + this.name + '/' + this.name + i + '.gif')
      }
    }
  }
