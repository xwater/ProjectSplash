// include
const config = require('./config')
const Player = require('./main/Player')
const db = require('./main/database')

const WebSocketServer = require('websocket').server

const http = require('http')
const tmi = require('tmi.js')

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
  safeTargetIndex: -1,
  winningTargetIndex: -1,
  killTargetIndex: -1,
  canEnter: false,
  players: [],
  roster: [],
  entries: [],
  charPool: []
}

const webSockets = {
  animation: null,
  admin: null,
  char: null
}

// generate character pools
let characters = require('./main/characters')
characters.init().then(characters => {
  gameState.charPool = characters
})

let suddenDeath = [
  'Broke Man',
  'Unstoppable',
  'Pacifist',
  'Champion'
]
let suddenDeathDescriptions = [
  'Broke Man is a 100 man easy Coinless run.  If he touches a single coin, the team with a remaining life wins (Red Coins Excluded)',
  'Unstoppable is a 100 man easy Deathless run.  If xwater dies, the team with a remaining stock wins.',
  'Pacifist is a run where you kill NO enemies.  If xwater murders something, the team with a remaining stock wins',
  'Champion is a 100 man easy all WR run.  If any level is completed without WR, the team with a stock reamining wins. (Autos Excluded)'
]

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
        if (webSockets.admin) {
          webSockets.admin.send(JSON.stringify(gameState))
        }

        if (gameState.overlay_connected === true && gameState.players.length >= 4) {
          sendAnimationGameStateUpdate()
        }
        console.log('OVERLAY CONNECTED!')
      }

      if (message.utf8Data === 'animation-close') {
        gameState.overlay_connected = false
        if (webSockets.admin) {
          webSockets.admin.send(JSON.stringify(gameState))
        }
        webSockets.animation = null
      }

      if (message.utf8Data === 'admin') {
        gameState.admin_connected = true
        webSockets.admin = connection// store websocket for admin
        webSockets.admin.send(JSON.stringify(gameState))
        console.log('ADMIN CONNECTED!')

        // If the character connected socket is connected and are characters are populated update the char select screen
        if (gameState.char_connected === true && gameState.players.length >= 4) {
          sendCharacterGameStateUpdate()
        }

        if (gameState.overlay_connected === true && gameState.players.length >= 4) {
          sendAnimationGameStateUpdate()
        }
      }

      if (message.utf8Data === 'admin-close') {
        gameState.admin_connected = false
        webSockets.admin = null
      }

      if (message.utf8Data === 'char') {
        gameState.char_connected = true
        webSockets.char = connection// store websocket for admin
        sendCharacterInit()

        /* send a "game start" message in [4] of char select screen */
        sendCharacterGameStateUpdate()

        // Send update to admin so we can see it connected visually
        if (webSockets.admin) {
          webSockets.admin.send(JSON.stringify(gameState))
        }
        console.log('CHARACTER SELECT CONNECTED')
      }

      if (message.utf8Data === 'char-close') {
        gameState.char_connected = false
        webSockets.char = null
        if (webSockets.admin) {
          webSockets.admin.send(JSON.stringify(gameState))
        }
      }

      if (message.utf8Data === 'generate') {
        if (gameState.overlay_connected === false) {
          gameState.error = 'Overlay is not connected'
          webSockets.admin.send(JSON.stringify(gameState))
        } else if (gameState.char_connected === false) {
          gameState.error = 'Character selection is not connected'
          webSockets.admin.send(JSON.stringify(gameState))
        } else {
          gameState.error = null
          generateNewGame()
        }
      }

      if (message.utf8Data === 'start') {
        // close entry to the game
        gameState.in_progress = true
        gameState.canEnter = false

        webSockets.admin.send(JSON.stringify(gameState))

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
          switch (message.utf8Data) {
            case '1':
              suddenDeathWinner(0)
              break
            case '2':
              suddenDeathWinner(1)
              break
            case '3':
              suddenDeathWinner(2)
              break
            case '4':
              suddenDeathWinner(3)
              break
          }
        }
      }
    }
  })
})

// selecting characters for the game
function chooseRoster () {
  gameState.roster = []
  while (gameState.roster.length < 4) {
    let randomNumber = getRandomInt(0, (Object.keys(gameState.charPool).length) - 1)
    let keys = Object.keys(gameState.charPool)

    // Check to make sure we don't have two of the same character
    let characterExists = false
    for (let i = 0; i < gameState.roster.length; i++) {
      if (gameState.roster[i] === keys[randomNumber]) {
        characterExists = true
      }
    }
    if (characterExists) continue

    // make sure the character is unlocked
    if (gameState.charPool[keys[randomNumber]].unlocked === false) continue

    // add the character if it doesn't exist
    gameState.roster.push(keys[randomNumber])
  }
}

// random int function
function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateNewGame () {
  resetGameState()
  chooseRoster()

  for (let i = 0; i < 4; i++) {
    gameState.players[i] = new Player(gameState.roster[i], gameState.charPool[gameState.roster[i]], i)
  }
  // make entry in games table of statsDB
  db.createNewGame(gameState)

  // grab the GameID

  db.getGameId().then((gameId) => {
    gameState.gameID = gameId
    gameState.generated = true
    gameState.canEnter = true

    webSockets.admin.send(JSON.stringify(gameState))

    sendAnimationGameStateUpdate()

    sendCharacterGameStateUpdate()
  })
}

function sendCharacterGameEnd () {
  if (!webSockets.char) return
  webSockets.char.send(JSON.stringify({
    type: 'gameEnd',
    gameState: gameState
  }))
}

function sendCharacterGameStateUpdate () {
  if (!webSockets.char) return
  webSockets.char.send(JSON.stringify({
    type: 'gameStateUpdate',
    gameState: gameState
  }))
}

function sendCharacterPlayers () {
  if (!webSockets.char) return
  webSockets.char.send(JSON.stringify({
    type: 'players',
    gameState: gameState
  }))
}

function sendCharacterInit () {
  if (!webSockets.char) return
  webSockets.char.send(JSON.stringify({
    type: 'init',
    gameState: gameState
  }))
}

function sendAnimationKillPlayer () {
  if (!webSockets.animation) return
  webSockets.animation.send(JSON.stringify({
    type: 'killPlayer',
    gameState: gameState
  }))
}

function sendAnimationSuddenDeath () {
  if (!webSockets.animation) return
  webSockets.animation.send(JSON.stringify({
    type: 'suddenDeath',
    gameState: gameState
  }))
}

function sendAnimationGameStateUpdate () {
  if (!webSockets.animation) return
  webSockets.animation.send(JSON.stringify({
    type: 'gameStateUpdate',
    gameState: gameState
  }))
}

function sendAnimationGameEnd () {
  webSockets.animation.send(JSON.stringify({
    type: 'gameEnd',
    gameState: gameState
  }))
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
  return targets[target]
}

function killPlayer (safe) {
  console.log(safe, 'safe target AKA winner of round')
  if (!gameState.generated) { return }
  // let winChar
  // choose target, avoid self and dead targets
  let target = chooseTarget(safe)
  if (target === null || target === undefined) return
  gameState.players[target].lives--
  // make sure to mark player as dead if they are dead
  if (gameState.players[target].lives === 0) {
    gameState.players[target].alive = false
  }
  // give the safe player the kill
  gameState.players[safe].kills++
  // log kill
  gameState.killID++
  db.addKill(gameState, safe, target)
  gameState.killTargetIndex = target
  gameState.safeTargetIndex = safe

  let done = isOver()
  // If the game is not over show the kill player animation
  if (!done) {
    sendAnimationKillPlayer()
  } else {
    gameOver()
  }
}

function gameOver () {
  let winners = pickWinners()
  if (winners.length === 1) {
    // 1 winner means no sudden death
    // unlock = Unlockables(winners[0])
    payout(winners[0], 0, '', gameState.gameID)
    gameState.winningTargetIndex = winners[0]
    endGame()
  } else if (winners.length === 2) {
    // 2 people reamaining is sudden death

    // sudden death here
    gameState.suddenDeath = 1

    sendAnimationSuddenDeath()

    // send message to twitch chat about the rules
    client.action(config.channels[0], 'Sudden Death mode:' + suddenDeath[gameState.suddenDeath])
    client.action(config.channels[0], suddenDeathDescriptions[gameState.suddenDeath])

    webSockets.admin.send(JSON.stringify({
      type: 'suddenDeath',
      gameState: gameState,
      winners: winners
    }))
  }
  // else {
  //   // payout all
  //   // todo not sure how we would get here
  //   for (let i = 0; i < 4; i++) {
  //     payout(gameState.players[i], 0, '', gameState.gameID)
  //   }
// }
}

// if (unlock) { msg[7] = unlock }

function suddenDeathWinner (winner) {
  // let unlock = Unlockables(players[winner])
  payout(gameState.players[winner], (gameState.players[winner].team.length * 10), 'SUDDEN DEATH VICTORY!', gameState.gameID)
  let winners = pickWinners()

  gameState.players[4] = winner

  // grab both winners again, put loser position into msg[5]
  if (winners[0].pos === winner) {
    gameState.players[5] = winners[1].pos
  } else {
    gameState.players[5] = winners[0].pos
  }

  gameState.players[6] = gameState.players[winner].character
  // if (unlock) { msg[7] = unlock }
  sendAnimationKillPlayer()
  endGame()
}

function endGame () {
  sendAnimationGameEnd()

  // Update the state and send it to the client
  resetGameState()

  webSockets.admin.send(JSON.stringify(gameState))
  // Update the character selection screen
  sendCharacterGameEnd()
}

function resetGameState () {
  gameState.suddenDeath = -1
  gameState.gameID = -1
  gameState.killID = -1
  gameState.safeTargetIndex = -1
  gameState.killTargetIndex = -1
  gameState.winningTargetIndex = -1
  gameState.in_progress = false
  gameState.generated = false
  gameState.canEnter = false
  gameState.ready = false
  gameState.error = false
  gameState.canEnter = false
  gameState.players = []
  gameState.entries = []
  gameState.roster = []
}

function pickWinners () {
  let topScore = 0

  // calculate each player's score
  for (let i = 0; i < 4; i++) {
    // calculate the score
    gameState.players[i].score = gameState.players[i].kills + (gameState.players[i].lives * 2)
    // Find the top score of all the contestants
    if (topScore < gameState.players[i].score) {
      topScore = gameState.players[i].score
    }
  }
  // put all players with top score into winner array, return.
  let winners = []
  for (let i = 0; i < 4; i++) {
    if (gameState.players[i].score === topScore) {
      winners.push(gameState.players[i])
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
  return aliveCount === 1
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

// zelda win  =shiek
// samus win = zero suit
// game and watch win = wii fit trainer
// 3 mario charcaters = rosalina
// > 5 points = lucian
// ike

// }

// function unlockChar (unlock) {
//   charPool.push(unlock)
//   jsonfile.writeFileSync('./characters.txt', charPool)
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
  // for (let i = 0; i < winner.team.length; i++) {
  //     // OLD PAYOUT - NEEDS TO BE UPDATED!!!!
  //     // db.run("UPDATE CurrencyUser SET Points = ((SELECT Points from CurrencyUser where Name='"+winner.team[i]+"')+"+pay+") WHERE Name ='"+winner.team[i]+"'");
  // }
  // if (bonus>0){ message= message + "Bonus Sheckels earned: " + bonus}
  db.recordStats(gameState, pay, gameState.gameID)
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
  let baseRate = gameState.entries.length * 10
  // bonus greater for smaller teams.  = (1-% of players)+1
  let bonus = (1 - (winners.team.length / gameState.entries.length) + 1)
  // multiply the base rate by the bonus
  let pay = bonus * baseRate

  return pay
}

function findTeam (username) {
  if (gameState.entries.indexOf(username) !== -1) {
    for (let i = 0; i < 4; i++) {
      if (gameState.players[i].team.indexOf(username) !== -1) {
        return username + ' is on team ' + gameState.players[i].fullName + '!'
      }
    }
  }
}

// twitch message interface

client.on('chat', function (channel, user, message, self) {
  if (message.toLowerCase() === '!replace 03b9-0000-0297-aa32') {
    client.timeout(config.channels[0], user['username'], 86400, 'THIS LEVEL IS BANNED DON\'T YOU HECKIN\' DARE')
  }

  // game not generated just return
  if (!gameState.generated) { return }

  // sudden death command
  if (gameState.suddenDeath === 1) {
    if (message.toLowerCase() === '!' + suddenDeath[gameState.suddenDeath].toLowerCase().replace(' ', '')) {
      client.action(config.channels[0], suddenDeathDescriptions[gameState.suddenDeath])
    }
  }

  // Show current team
  if (message.toLowerCase() === '!team') {
    let team = findTeam(user['username'])
    if (team) {
      client.action(config.channels[0], team)
    }
  }

  // Join random team
  if (message.toLowerCase() === '!random') {
    if (gameState.entries.indexOf(user['username']) === -1) {
      gameState.entries.push(user['username'])
      let randTeam = getRandomInt(0, 3)
      gameState.players[randTeam].team.push(user['username'])
      client.action(config.channels[0], user['username'] + ' joined team ' + gameState.players[randTeam].fullName + '!')
      db.storeUser(user['username'], gameState, randTeam)
      db.addEntry(gameState, user['username'], randTeam)
      sendCharacterPlayers()
      return
    } else {
      let team = findTeam(user['username'])
      client.action(config.channels[0], 'Already on a team! ' + team)
      return
    }
  }

  for (let i = 0; i < 4; i++) {
    // Can't enter show this message
    if (!gameState.canEnter) {
      if (gameState.entries.indexOf(user['username']) === -1) {
        client.action(config.channels[0], 'Entries are closed! !random to join a team')
        return
      }
    } else {
      // The user can enter
      let aliases = gameState.charPool[gameState.players[i].character.name].aliases
      let characterName = gameState.players[i].character.name
      if (message.toLowerCase() === ('!' + characterName) || aliases.includes(message)) {
        // If the user is not on a team
        if (gameState.entries.includes(user.username) === false) {
          gameState.entries.push(user.username)
          gameState.players[i].team.push(user.username)
          client.action(config.channels[0], user.username + ' joined team ' + gameState.players[i].fullName + '!')
          db.storeUser(user.username, gameState, i)
          db.addEntry(gameState, user.username, i)
          sendCharacterPlayers()
        } else {
          let team = findTeam(user.username)
          client.action(config.channels[0], 'Already on a team! ' + team)
        }
      }
    }
  }
})
