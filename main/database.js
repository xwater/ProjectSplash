const sqlite3 = require('sqlite3').verbose()

const db = new sqlite3.Database('./stats.db', sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE, (error) => {
  if (error) {
    console.error(error.message)
    throw (error)
  }
})

db.serialize(() => {
  console.log('INITIALIZING DATABASE')
  db.run('CREATE TABLE IF NOT EXISTS `Entries` (' +
    '`id` INTEGER PRIMARY KEY AUTOINCREMENT, ' +
    '`game_id` INTEGER, ' +
    '`user` TEXT, ' +
    '`player` TEXT, ' +
    '`random` INTEGER, ' +
    '`position` INTEGER )', error => {
    if (error) {
      throw (error)
    }
  })
  db.run('CREATE TABLE IF NOT EXISTS `Games` (' +
    '`id` INTEGER PRIMARY KEY AUTOINCREMENT,' +
    ' `season` INTEGER, ' +
    '`player_1_name` TEXT, ' +
    '`player_2_name` TEXT, ' +
    '`player_3_name` TEXT, ' +
    '`player_4_name` TEXT, ' +
    '`player_1_score` INTEGER DEFAULT 0, ' +
    '`player_2_score` INTEGER DEFAULT 0, ' +
    '`player_3_score` INTEGER DEFAULT 0, ' +
    '`player_4_score` INTEGER DEFAULT 0, ' +
    '`prize` INTEGER )', error => {
    if (error) {
      throw (error)
    }
  })
  db.run('CREATE TABLE IF NOT EXISTS `Kills` (' +
    '`id` INTEGER PRIMARY KEY AUTOINCREMENT, ' +
    '`game_id` INTEGER, ' +
    '`kill_id` INTEGER, ' +
    '`player` INTEGER, ' +
    '`target` INTEGER )', error => {
    if (error) {
      throw (error)
    }
  })
  db.run('CREATE TABLE IF NOT EXISTS `Users` (' +
    '`id` INTEGER PRIMARY KEY AUTOINCREMENT, ' +
    '`user` TEXT, ' +
    '`team_one_count` INTEGER DEFAULT 0, ' +
    '`team_two_count` INTEGER DEFAULT 0, ' +
    '`team_three_count` INTEGER DEFAULT 0, ' +
    '`team_four_count` INTEGER DEFAULT 0, ' +
    '`season` INTEGER )', error => {
    if (error) {
      throw (error)
    }
  })
  db.run('CREATE TABLE IF NOT EXISTS `UnlockedCharacters` (' +
    '`id` INTEGER PRIMARY KEY AUTOINCREMENT,' +
    '`character_name` TEXT UNIQUE, ' +
    '`date_unlocked` TEXT)', error => {
    if (error) {
      throw (error)
    }
  })
})

// record the game stats
exports.recordStats = (gameState, pay, gameId) => {
  db.run('UPDATE Games SET player_1_score=?, player_2_score=?,player_3_score=?,player_4_score=?,prize=? WHERE id = ?',
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
exports.storeUser = (username, gameState, team) => {
  db.serialize(() => {
    db.get('SELECT * from Users where user = ? and season = ?', username, gameState.season, function (err, row) {
      if (err) {
        // TODO Probably shouldn't just crash if there is an error
        throw (err)
      }
      if (row) {
        console.log('USER FOUND IN TABLE UPDATING STATS')
        switch (team) {
          case 0:
            db.run('UPDATE USERS SET team_one_count = team_one_count + 1')
            break
          case 1:
            db.run('UPDATE USERS SET team_two_count = team_two_count + 1')
            break
          case 2:
            db.run('UPDATE USERS SET team_three_count = team_three_count + 1')
            break
          case 3:
            db.run('UPDATE USERS SET team_three_count = team_three_count + 1')
            break
        }
      } else {
        console.log('NOT FOUND! INSERTING NEW USER')
        switch (team) {
          case 0:
            db.run('INSERT INTO Users (user, season, team_one_count) VALUES (?,?,?)', username, gameState.season, 1)
            break
          case 1:
            db.run('INSERT INTO Users (user, season, team_two_count) VALUES (?,?,?)', username, gameState.season, 1)
            break
          case 2:
            db.run('INSERT INTO Users (user, season, team_three_count) VALUES (?,?,?)', username, gameState.season, 1)
            break
          case 3:
            db.run('INSERT INTO Users (user, season, team_four_count) VALUES (?,?,?)', username, gameState.season, 1)
            break
        }
      }
    })
  })
}

exports.createNewGame = (gameState) => {
  db.serialize(() => {
    db.run('INSERT INTO Games (season, player_1_name, player_2_name, player_3_name, player_4_name) VALUES (?,?,?,?,?)',
      [
        gameState.season,
        gameState.players[0].character.name,
        gameState.players[1].character.name,
        gameState.players[2].character.name,
        gameState.players[3].character.name
      ])
  })
}

exports.getGameId = async () => {
  return new Promise(resolve => {
    db.serialize(() => {
      db.get('SELECT max(id) from Games', function (err, row) {
        if (err) {
          throw (err)
        }
        resolve(row['max(id)'])
      })
    })
  })
}

exports.addKill = (gameState) => {
  db.serialize(() => {
    db.run('INSERT INTO Kills (game_id,kill_id,player,target) VALUES (?,?,?,?)',
      [
        gameState.gameID,
        gameState.killID,
        gameState.safeTargetIndex,
        gameState.killTargetIndex
      ])
  })
}

exports.addEntry = (gameState, username, randTeam) => {
  db.serialize(() => {
    db.run('INSERT INTO Entries (game_id, user, player, random, position) VALUES(?,?,?,?,?)',
      [
        gameState.gameID,
        username,
        gameState.players[randTeam].character.name,
        1,
        randTeam
      ])
  })
}

exports.getUnlockedCharacters = () => {
  return new Promise(resolve => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION')
      db.run('END')
      db.all('SELECT character_name FROM UnlockedCharacters WHERE date_unlocked IS NOT NULL', (error, rows) => {
        if (error) {
          throw error
        }
        resolve(rows)
      })
    })
  })
}

exports.unlockCharacter = (name, unlocked = true) => {
  db.serialize(() => {
    db.run('BEGIN TRANSACTION')
    if (unlocked) {
      let timeStamp = createTimestamp()
      db.run('INSERT OR IGNORE INTO UnlockedCharacters(character_name, date_unlocked) VALUES(?, ?)', name, timeStamp)
    } else {
      db.run('INSERT OR IGNORE INTO UnlockedCharacters(character_name, date_unlocked) VALUES(?, ?)', name, null)
    }
    db.run('END')
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
  console.log('LOADING INITIAL CHARACTERS')
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
