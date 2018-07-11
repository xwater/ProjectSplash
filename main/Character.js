module.exports =
  class Character {
    constructor (rosterCharacter, unlocked, aliases) {
      this.id = rosterCharacter.value
      this.name = rosterCharacter.fullName
      this.unlocked = unlocked
      this.aliases = aliases

      this.sfx = {
        taunts: [],
        chimes: [],
        winner: './assets/sfx/announcer/winner.wav',
        suddenDeath: './assets/sfx/announcer/suddendeath.wav',
        announcer: './assets/sfx/' + this.name + '/announcer/1.wav',
        challengerApproaching: './assets/sfx/announcer/challenger.ogg'
      }

      this.images = {
        liveIcon: './assets/character/' + this.name + '/lives/1.png',
        livePortrait: './assets/character/' + this.name + '/live-portraits/1.png',
        rosterPortraits: []
      }

      // TODO possible modifiers

      this.gifs = {
        win: [],
        lose: './assets/gifs/lose/' + this.name + '/1.gif',
        challenger: './assets/gifs/misc/challenger.gif'
      }

      this.videos = {
        victory: './assets/gifs/victory/' + this.name + '/1.mp4'
      }

      this.initTaunts()
      this.initChimes()
      this.initWinGifs()
      this.initRosterPortraits()
    }

    initTaunts () {
      for (let i = 1; i < 6; i++) {
        this.sfx.taunts.push('./assets/sfx/' + this.name + '/taunt/' + i + '.wav')
      }
    }

    initChimes () {
      for (let i = 1; i < 2; i++) {
        this.sfx.chimes.push('./assets/sfx/' + this.name + '/chime/' + i + '.wav')
      }
    }

    initRosterPortraits () {
      for (let i = 1; i < 9; i++) {
        this.images.rosterPortraits.push('./assets/character/' + this.name + '/character-portraits/' + i + '.png')
      }
    }

    initWinGifs () {
      for (let i = 1; i < 4; i++) {
        this.gifs.win.push('./assets/gifs/win/' + this.name + '/' + i + '.gif')
      }
    }
  }
