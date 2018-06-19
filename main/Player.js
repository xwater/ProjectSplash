const fs = require('fs')
module.exports =
// Game Logic and Code here
  class Player {
    constructor (cid, character, pos) {
      this.cid = cid
      this.character = character
      this.lives = 2
      this.kills = 0
      this.alive = true
      this.team = []
      this.fullName = fs.readFileSync('./assets/names/' + this.character.name + '.txt', 'utf8')
      this.pos = pos
      this.isWinner = false
      this.score = 0
    }
  }
