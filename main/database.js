const sqlite3 = require('sqlite3').verbose()

const db = new sqlite3.Database('./stats.db', sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE, (error) => {
  if (error) {
    console.error(error.message)
    throw (error)
  }
})

db.serialize(() => {
  console.log('Initializing database')
  db.run('CREATE TABLE IF NOT EXISTS `Entries` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `game_id` INTEGER, `user` TEXT, `player` TEXT, `random` INTEGER, `position` INTEGER )', error => {
    if (error) {
      console.log(error.message)
      throw (error)
    }
  })
  db.run('CREATE TABLE IF NOT EXISTS `Games` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `season` INTEGER, `player_one` TEXT, `player_two` TEXT, `player_three` TEXT, `player_four` TEXT, `prize` INTEGER )', error => {
    if (error) {
      console.log(error.message)
      throw (error)
    }
  })
  db.run('CREATE TABLE IF NOT EXISTS `Kills` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `game_id` INTEGER, `kill_id` INTEGER, `player` INTEGER, `target` INTEGER )', error => {
    if (error) {
      console.log(error.message)
      throw (error)
    }
  })
  db.run('CREATE TABLE IF NOT EXISTS `Users` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `user` TEXT, `first` INTEGER DEFAULT 0, `second` INTEGER DEFAULT 0, `third` INTEGER DEFAULT 0, `fourth` INTEGER DEFAULT 0, `season` INTEGER )', error => {
    if (error) {
      console.log(error.message)
      throw (error)
    }
  })
  db.run('CREATE TABLE IF NOT EXISTS `UnlockedCharacters` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`character_name` TEXT UNIQUE, `date_unlocked` TEXT)', error => {
    if (error) {
      console.log(error.message)
      throw (error)
    }
  })
  console.log('Database Initialized')
})

function createTimestamp () {
  const date = new Date()
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()
  return (year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds)
}

function initDefaultCharacters (characters) {
  console.log('Loading Initial Characters')
  let timeStamp = createTimestamp()
  db.serialize(() => {
    db.run('BEGIN TRANSACTION')
    for (let key in characters) {
      if (!characters.hasOwnProperty(key)) continue
      db.run('INSERT OR IGNORE INTO UnlockedCharacters(character_name, date_unlocked) VALUES(?, ?)', characters[key].name, timeStamp)
    }
    db.run('END')
  })
}

module.exports = {
  db,
  initDefaultCharacters
}
