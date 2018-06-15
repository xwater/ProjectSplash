module.exports =
  class Character {
    constructor (id, name, unlocked, aliases) {
      this.id = id
      this.name = name
      this.unlocked = unlocked
      this.aliases = aliases
    }
  }
