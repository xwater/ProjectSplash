// includes
const config = require('./config')
const Player = require('./main/Player')

const WebSocketServer = require('websocket').server
const http = require('http')
const tmi = require('tmi.js')
const sqlite3 = require('sqlite3').verbose()

const gameState = {
  generated: false,
  admin_connected: false,
  char_connected: false,
  in_progress: false,
  overlay_connected: false,
  ready: false,
  error: null,
  gameID: -1,
  killID: -1,
  season: 1,
  suddenDeath: -1,
  canEnter: false,
  players: []
}
const webSockets = {
  animation: null,
  admin: null,
  char: null
}

// generate character pools
let charPool = require('./main/characters').charPool
// DB connection
// var db = new sqlite3.Database("C:\\Users\\xwater\\AppData\\Roaming\\AnkhHeart\\AnkhBotR2\\Twitch\\Databases\\CurrencyDB.sqlite");
let statsDB = new sqlite3.Database('./stats.db')
// global variable declarations

// import aliases for characters
let aliases = require('./main/aliases')

let entries = []
let pools = []
let suddenDeath = ['Broke Man', 'Unstoppable', 'Pacifist', 'Champion']
let suddenDeathDescriptions = ['Broke Man is a 100 man easy Coinless run.  If he touches a single coin, the team with a remaining life wins (Red Coins Excluded)',
  'Unstoppable is a 100 man easy Deathless run.  If xwater dies, the team with a remaining stock wins.',
  'Pacifist is a run where you kill NO enemies.  If xwater murders something, the team with a remaining stock wins',
  'Champion is a 100 man easy all WR run.  If any level is completed without WR, the team with a stock reamining wins. (Autos Excluded)']

// eslint-disable-next-line new-cap
let client = new tmi.client(config)

client.connect()

let server = http.createServer(function (request, response) {
  // process HTTP request. Since we're writing just WebSockets server
  // we don't have to implement anything.
})
server.listen(config.serverPort, function () {
})

// create the server
const wsServer = new WebSocketServer({
  httpServer: server
})

// WebSocket server
wsServer.on('request', function (request) {
  let connection = request.accept(null, request.origin)

  // This is the most important callback for us, we'll handle
  // all messages from users here.
  connection.on('message', function (message) {
    if (message.type === 'utf8') {
      if (message.utf8Data === 'animation') {
        gameState.overlay_connected = true
        webSockets.animation = connection// store websocket for animation
        webSockets.admin.send(JSON.stringify(gameState))
        console.log('animation connected!')
      }

      if (message.utf8Data === 'animation-close') {
        gameState.overlay_connected = false
        webSockets.admin.send(JSON.stringify(gameState))
        webSockets.animation = null
      }

      if (message.utf8Data === 'admin') {
        gameState.admin_connected = true
        webSockets.admin = connection// store websocket for admin
        webSockets.admin.send(JSON.stringify(gameState))
        console.log('admin connected!')

        // If the character connected socket is connected and are characters are populated update the char select screen
        if (gameState.char_connected === true && gameState.players.length >= 4) {
          webSockets.char.send(JSON.stringify(gameState))
        }
      }

      if (message.utf8Data === 'admin-close') {
        gameState.admin_connected = false
        webSockets.admin = null
      }

      if (message.utf8Data === 'char') {
        gameState.char_connected = true
        webSockets.char = connection// store websocket for admin
        webSockets.char.send(JSON.stringify(gameState))

        // Send update to admin so we can see it connected visually
        webSockets.admin.send(JSON.stringify(gameState))

        console.log('Char select connected!')
      }

      if (message.utf8Data === 'char-close') {
        gameState.char_connected = false
        webSockets.char = null
        webSockets.admin.send(JSON.stringify(gameState))
      }

      if (message.utf8Data === 'generate') {
        if (gameState.overlay_connected === false) {
          gameState.error = 'Overlay is not connected'
          webSockets.admin.send(JSON.stringify(gameState))
        } else if (gameState.char_connected === false) {
          gameState.error = 'Character selection is not connected'
          webSockets.admin.send(JSON.stringify(gameState))
        } else {
          gameState.generated = true
          gameState.error = null
          webSockets.admin.send(JSON.stringify(gameState))
          startGame()
        }
      }

      if (message.utf8Data === 'start') {
        // close entry to the game
        gameState.in_progress = true
        webSockets.admin.send(JSON.stringify(gameState))

        gameState.canEnter = false
        client.action(config.channels[0], 'Game has begun! Only !random will join, !team to check.')
      } else {
        // choose a player to kill
        if (gameState.suddenDeath === -1) {
          switch (message.utf8Data) {
            case '1':
              killPlayer(0)
              break
            case '2':
              killPlayer(1)
              break
            case '3':
              killPlayer(2)
              break
            case '4':
              killPlayer(3)
              break
          }
        } else if (gameState.suddenDeath >= 0) {
          console.log('sudden death! Msg: ' + message.utf8Data)
          switch (message.utf8Data) {
            case '1':
              SDwinner(0)
              break
            case '2':
              SDwinner(1)
              break
            case '3':
              SDwinner(2)
              break
            case '4':
              SDwinner(3)
              break
          }
        }
      }
    }
  })
})

// selecting characters for the game
function chooseChars () {
  pools = []
  while (pools.length < 4) {
    let randomNumber = getRandomInt(0, (Object.keys(charPool).length) - 1)
    if (pools.indexOf(randomNumber) > -1) continue
    pools[pools.length] = randomNumber
  }
}

// random int function
function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function startGame () {
  chooseChars()
  // reset entries and players
  entries = []
  for (let i = 0; i < 4; i++) {
    gameState.players[i] = new Player(pools[i], charPool[pools[i]], i)
  }
  console.log(gameState.players[0].fullName + ' ' + gameState.players[1].fullName + ' ' + gameState.players[2].fullName + ' ' + gameState.players[3].fullName)
  // make entry in games table of statsDB
  statsDB.run('INSERT INTO Games (season, P1c, P2c, P3c, P4c) VALUES (' + gameState.season + ',"' + gameState.players[0].character + '","' + gameState.players[1].character + '","' + gameState.players[2].character + '","' + gameState.players[3].character + '")')
  // grab the GameID
  statsDB.get('SELECT max(GameID) from Games', function (err, row) {
    if (err) {
      // TODO Probably shouldn't just crash if there is an error
      throw (err)
    }
    gameState.gameID = row['max(GameID)']
  })
  gameState.killID = 0
  webSockets.animation.send(JSON.stringify(gameState))

  gameState.generated = true
  gameState.canEnter = true

  /* send a "game start" message in [4] of char select screen */
  webSockets.char.send(JSON.stringify(gameState))
}

function chooseTarget (safe) {
  // array where key is random number, value is player ID of who to kill
  let targets = []
  for (let i = 0; i < 4; ++i) {
    if (i !== safe) {
      for (let j = 0; j < gameState.players[i].lives; j++) {
        targets.push(i)
      }
    }
  }
  let target = getRandomInt(0, targets.length - 1)
  console.log(target + ' ' + targets + 'targets.length = ' + targets.length + 'targets[target] = ' + targets[target])
  return targets[target]
}

function killPlayer (safe) {
  console.log(gameState.players[0].fullName + ' ' + gameState.players[1].fullName + ' ' + gameState.players[2].fullName + ' ' + gameState.players[3].fullName)
  if (!gameState.generated) { return }
  let winChar
  // choose target, avoid self and dead targets
  let target = chooseTarget(safe)
  console.log('chosen target is ' + target)
  gameState.players[target].lives--
  // make sure to mark player as dead if they are dead
  if (gameState.players[target].lives === 0) {
    gameState.players[target].alive = false
  }
  // give the safe player the kill
  gameState.players[safe].kills++
  console.log(gameState.players[safe].character + ' just killed ' + gameState.players[target].character + '. They now have ' + gameState.players[target].lives + ' lives left.')
  // log kill
  gameState.killID++
  statsDB.run('INSERT INTO Kills (GameID,KillID,player,target) VALUES (?,?,?,?)', [gameState.gameID, gameState.killID, gameState.players[safe].character, gameState.players[target].character], function (err) {
    console.log(err)
  })
  // check to see if the game is over
  let done = isOver()
  // if there is a winner!

  if (done === true) {
    let winners = pickWinners()
    if (winners.length === 1) {
      // TODO Moved Characters to their own JS file so we can't really write to this file we should probably load from a DB rather than a text file
      // unlock = Unlockables(winners[0])
      payout(winners[0], 0, '', gameState.gameID)
      winChar = winners[0]['character']
    } else if (winners.length === 2) {
      // sudden death here
      gameState.suddenDeath = getRandomInt(0, 3)
      client.action(config.channels[0], 'Sudden Death mode:' + suddenDeath[gameState.suddenDeath])
      client.action(config.channels[0], suddenDeathDescriptions[gameState.suddenDeath])
      winners.push('SD')
      webSockets.admin.send(JSON.stringify(winners))
    } else {
      // payout all
      for (let i = 0; i < 4; i++) {
        payout(gameState.players[i], 0, '', gameState.gameID)
      }
    }
    endGame()
  }
  // build message for animation
  let msg = JSON.parse(JSON.stringify(gameState.players))
  msg[4] = safe
  msg[5] = target
  if (winChar) { msg[6] = winChar }
  // if (unlock) { msg[7] = unlock }
  console.log(JSON.stringify(msg))
  webSockets.animation.send(JSON.stringify(msg))
}

function SDwinner (winner) {
  // TODO Moved Characters to their own JS file so we can't really write to this file we should probably load from a DB rather than a text file
  // let unlock = Unlockables(players[winner])
  payout(gameState.players[winner], (gameState.players[winner].team.length * 10), 'SUDDEN DEATH VICTORY!', gameState.gameID)
  console.log('ALERT!!@#!#!@#@!' + JSON.stringify(gameState.players[winner].character))
  let msg = JSON.parse(JSON.stringify(gameState.players))
  let winners = pickWinners()

  msg[4] = winner
  // grab both winners again, put loser position into msg[5]
  if (winners[0].pos === winner) { msg[5] = winners[1].pos } else { msg[5] = winners[0].pos }
  msg[6] = gameState.players[winner].character
  // if (unlock) { msg[7] = unlock }
  webSockets.animation.send(JSON.stringify(msg))
  endGame()
}

function endGame () {
  // Update the state and send it to the client
  resetState()

  webSockets.admin.send(JSON.stringify(gameState))
  // Update the character selection screen
  webSockets.char.send(JSON.stringify(gameState))
}

function resetState () {
  gameState.suddenDeath = -1
  gameState.gameID = -1
  gameState.killID = -1
  gameState.in_progress = false
  gameState.generated = false
  gameState.canEnter = false
  gameState.ready = false
  gameState.error = false
  gameState.canEnter = false
  gameState.players = []
}

function pickWinners () {
  let scores = []
  let topScore = 0
  // calculate top score and each player's score
  for (let i = 0; i < 4; i++) {
    scores[i] = gameState.players[i].kills + (gameState.players[i].lives * 2)
    if (scores[i] > topScore) {
      topScore = scores[i]
    }
  }
  // put all players with top score into winner array, return.
  let winners = []
  for (let j = 0; j < 4; j++) {
    if (scores[j] === topScore) {
      winners.push(gameState.players[j])
    }
  }

  return winners
}

function isOver () {
  let aliveCount = 0
  for (let i = 0; i < 4; i++) {
    if (gameState.players[i].alive === true) {
      aliveCount++
    }
  }
  if (aliveCount === 1) {
    gameState.generated = false
    return true
  }
  return false
}

// function Unlockables (winner) {
//   if (charPool.indexOf('sonic') === -1) {
//     if (players[0].kills > 4) {
//       return unlockChar('sonic')
//     }
//   }
//   if (charPool.indexOf('gaw') === -1) {
//     if (winner.lives === 2 && winner.kills === 0) {
//       return unlockChar('gaw')
//     }
//   }
//   if (charPool.indexOf('squirtle') === -1) {
//     if ((winner.character === 'pika' || winner.character === 'puff') && entries.length > 99) {
//       return unlockChar('squirtle')
//     }
//   }
//   if (charPool.indexOf('mii') === -1) {
//     if (winner.team.indexOf('xwater') > -1) {
//       return unlockChar('mii')
//     }
//   }
// }

// function unlockChar (unlock) {
//   charPool.push(unlock)
//   jsonfile.writeFileSync('./characters.txt', charPool)
//   console.log(unlock + ' Has joined the battle!')
//   client.action(config.channels[0], 'New Challenger Approaching! ' + fs.readFileSync('./assets/names/' + unlock + '.txt', 'utf8') + ' has joined the battle!')
//   var unlockAni = {'challenger': unlock}
//   webSockets.animation.sendUTF(JSON.stringify(unlockAni))
//   return unlock
// }

function payout (winner, bonus, message, GID) {
  // calculate pay
  let pay = calcPay(winner)
  // if pay, for some reason is NaN, set it to 0
  if (isNaN(pay)) { pay = 0 }
  // pay out all of winning team
  pay = parseInt(pay + bonus, 10)
  for (let i = 0; i < winner.team.length; i++) {
    try {
      // OLD PAYOUT - NEEDS TO BE UPDATED!!!!
      // db.run("UPDATE CurrencyUser SET Points = ((SELECT Points from CurrencyUser where Name='"+winner.team[i]+"')+"+pay+") WHERE Name ='"+winner.team[i]+"'");
    } catch (er) {
      console.log(er)
    }
  }
  // if (bonus>0){ message= message + "Bonus Sheckels earned: " + bonus}
  // record stats
  statsDB.run('UPDATE Games SET P1s=?, P2s=?,P3s=?,P4s=?,prize=? WHERE GameID = ?',
    [gameState.players[0].kills + (gameState.players[0].lives * 2),
      gameState.players[1].kills + (gameState.players[1].lives * 2),
      gameState.players[2].kills + (gameState.players[2].lives * 2),
      gameState.players[3].kills + (gameState.players[3].lives * 2),
      pay, GID])

  console.log(winner.team)
  if (winner.team.length > 0) {
    client.action(config.channels[0], 'Team [' + winner.fullName + '] has won! The winner of this game\'s sticker giveaway is... ')
    setTimeout(function () {
      client.action(config.channels[0], winner.team[getRandomInt(0, winner.team.length - 1)])
    }, 2000)
  } else {
    client.action(config.channels[0], 'Team [' + winner.fullName + '] has won! Unfortunately there were no players on this team. ')
  }
}

function calcPay (winners) {
  let baseRate = entries.length * 10
  // bonus greater for smaller teams.  = (1-% of players)+1
  let bonus = (1 - (winners.team.length / entries.length) + 1)
  // multiply the base rate by the bonus
  let pay = bonus * baseRate
  console.log('calculated payrate: ' + pay)

  return pay
}

function findTeam (username) {
  console.log('checking team 1')
  if (entries.indexOf(username) !== -1) {
    console.log('checking team 2')
    for (let i = 0; i < 4; i++) {
      if (gameState.players[i].team.indexOf(username) !== -1) {
        console.log('found it!')
        return username + ' is on team ' + gameState.players[i].fullName + '!'
      }
    }
  }
}

// stores user in the DB if user isn't already in

function storeUser (username) {
  statsDB.get('SELECT * from Users where User = \'' + username + '\' and Season = ' + gameState.season, function (err, row) {
    if (err) {
      // TODO Probably shouldn't just crash if there is an error
      throw (err)
    }
    if (row) {
      console.log('User found in table')
    } else {
      console.log('NOT FOUND! ENTER IT HERE')
      statsDB.run('INSERT INTO Users VALUES (\'' + username + '\',0,0,0,0,' + gameState.season + ')')
    }
  })
  console.log('done checkin')
}

// twitch message interface

client.on('chat', function (channel, user, message, self) {
  if (message.toLowerCase() === '!replace 03b9-0000-0297-aa32') {
    client.timeout(config.channels[0], user['username'], 86400, 'THIS LEVEL IS BANNED DON\'T YOU HECKIN\' DARE')
  }

  if (!gameState.generated) { return }
  if (gameState.suddenDeath >= 0) {
    if (message.toLowerCase() === '!' + suddenDeath[gameState.suddenDeath].toLowerCase().replace(' ', '')) {
      client.action('config.channels[0]', suddenDeathDescriptions[gameState.suddenDeath])
      console.log('got the message for SD')
    }
  }
  let msg

  if (message.toLowerCase() === '!team') {
    msg = findTeam(user['username'])
    if (msg) {
      client.action(config.channels[0], msg)
    }
  }
  for (let i = 0; i < 4; i++) {
    if (message.toLowerCase() === '!random') {
      if (entries.indexOf(user['username']) === -1) {
        entries.push(user['username'])
        let randTeam = getRandomInt(0, 3)
        gameState.players[randTeam].team.push(user['username'])
        client.action(config.channels[0], user['username'] + ' joined team ' + gameState.players[randTeam].fullName + '!')
        storeUser(user['username'])
        statsDB.run('INSERT INTO Entries values(?,?,?,?,?)', [gameState.gameID, user['username'], gameState.players[randTeam].character, 1, randTeam])
        webSockets.char.send(JSON.stringify(gameState.players))
        return
      } else {
        msg = findTeam(user['username'])
        client.action(config.channels[0], 'Already on a team! ' + msg)
        return
      }
    }
    if (!gameState.canEnter) {
      if (message.toLowerCase() === '!' + gameState.players[i].character || aliases[gameState.players[i].character].indexOf(message.toLowerCase().substr(1)) !== -1) {
        if (entries.indexOf(user['username']) === -1) {
          client.action(config.channels[0], 'Entries are closed! !random to join a team')
          return
        }
      }
    }
    if (message.toLowerCase() === '!' + gameState.players[i].character || aliases[gameState.players[i].character].indexOf(message.toLowerCase().substr(1)) !== -1) {
      if (entries.indexOf(user['username']) === -1) {
        entries.push(user['username'])
        gameState.players[i].team.push(user['username'])
        client.action(config.channels[0], user['username'] + ' joined team ' + gameState.players[i].fullName + '!')
        statsDB.run('INSERT INTO Entries values(?,?,?,?,?)', [gameState.gameID, user['username'], gameState.players[i].character, 0, i])
        storeUser(user['username'])
        webSockets.char.send(JSON.stringify(gameState.players))
        return
      } else {
        msg = findTeam(user['username'])
        client.action(config.channels[0], 'Already on a team! ' + msg)
        return
      }
    }
  }
})
