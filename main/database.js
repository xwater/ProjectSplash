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

// record the game stats
exports.recordStats = (gameState, pay, gameId) => {
  db.run('UPDATE Games SET player_one=?, player_two=?,player_three=?,player_four=?,prize=? WHERE id = ?',
    [
      gameState.players[0].kills + (gameState.players[0].lives * 2),
      gameState.players[1].kills + (gameState.players[1].lives * 2),
      gameState.players[2].kills + (gameState.players[2].lives * 2),
      gameState.players[3].kills + (gameState.players[3].lives * 2),
      pay,
      gameId
    ])
}

// stores user in the DB if user isn't already in
exports.storeUser = (username, gameState) => {
  db.serialize(() => {
    db.get('SELECT * from Users where user = ? and season = ?', username, gameState.season, function (err, row) {
      if (err) {
        // TODO Probably shouldn't just crash if there is an error
        throw (err)
      }
      if (row) {
        console.log('User found in table')
      } else {
        console.log('NOT FOUND! ENTER IT HERE')
        db.run('INSERT INTO Users (user, season) VALUES (?,?)', username, gameState.season)
      }
    })
  })
  console.log('done checkin')
}

exports.createNewGame = (gameState) => {
  db.serialize(() => {
    db.run('INSERT INTO Games (season, player_one, player_two, player_three, player_four) VALUES (?,?,?,?,?)',
      [
        gameState.season,
        gameState.players[0].character,
        gameState.players[1].character,
        gameState.players[2].character,
        gameState.players[3].character
      ])
  })
}

exports.getGameId = () => {
  db.serialize(() => {
    db.get('SELECT max(id) from Games', function (err, row) {
      if (err) {
        throw (err)
      }
      return row['max(id)']
    })
  })
}

exports.addKill = (gameState, safe, target) => {
  db.serialize(() => {
    db.run('INSERT INTO Kills (game_id,kill_id,player,target) VALUES (?,?,?,?)',
      [
        gameState.gameID,
        gameState.killID,
        gameState.players[safe].character,
        gameState.players[target].character
      ],
      function (err) {
        console.log(err)
      })
  })
}

exports.addEntry = (gameState, username, randTeam) => {
  db.serialize(() => {
    db.run('INSERT INTO Entries (game_id, user, player, random, position) VALUES(?,?,?,?,?)',
      [
        gameState.gameID,
        username,
        gameState.players[randTeam].character,
        1,
        randTeam
      ])
  })
}

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

exports.initCharacters = (characters) => {
  console.log('Loading Initial Characters')
  let timeStamp = createTimestamp()
  db.serialize(() => {
    db.run('BEGIN TRANSACTION')
    for (let key in characters) {
      if (!characters.hasOwnProperty(key)) continue
      if (characters[key].unlocked === false) {
        db.run('INSERT OR IGNORE INTO UnlockedCharacters(character_name, date_unlocked) VALUES(?, ?)', characters[key].name, null)
      } else {
        db.run('INSERT OR IGNORE INTO UnlockedCharacters(character_name, date_unlocked) VALUES(?, ?)', characters[key].name, timeStamp)
      }
    }
    db.run('END')
  })
}
