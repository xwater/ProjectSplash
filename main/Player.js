module.exports =
// Game Logic and Code here
  class Player {
    constructor (character, pos) {
      this.character = character
      this.lives = 2
      this.kills = 0
      this.alive = true
      this.team = []
      this.pos = pos
      this.score = 0
    }
  }
