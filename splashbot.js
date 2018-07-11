// include
const config = require('./config')
const Player = require('./main/Player')
const db = require('./main/database')
const express = require('express')
const app = express()
const socket = require('socket.io')
const server = app.listen(config.serverPort, function () {
// eslint-disable-next-line no-console
  console.debug('listening on http://localhost:' + config.serverPort)
})

app.use(express.static('public'))
app.get('/', (req, res) => { res.sendFile(__dirname + '/public/index.html')})
app.get('/characters', (req, res) => { res.sendFile(__dirname + '/public/characterSelection.html')})
app.get('/overlay', (req, res) => { res.sendFile(__dirname + '/public/overlay.html')})

const io = socket(server, {})

const tmi = require('tmi.js')

const gameState = {
  channel: config.channels[0],
  streamlabsConnected: false,
  generated: false,
  adminConnected: false,
  characterSelectionConnected: false,
  inProgress: false,
  overlayConnected: false,
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
  lineup: [],
  entries: [],
  roster: {},
  winners: [],
  unlockedCharacter: null
}

const webSockets = {
  overlay: null,
  admin: null,
  char: null
}

// generate character pools
const Roster = require('./main/roster')
let r = new Roster()
r.initCharacters().then(characters => {
  r.charPool = characters
  gameState.roster = r
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
let twitchClient = new tmi.client(config)

twitchClient.connect()

io.on('connection', (socket) => {

  socket.on('admin-connected', () => {
    webSockets.admin = socket.id
    gameState.adminConnected = true
    io.sockets.emit('gameStateUpdate', gameState)
  })

  socket.on('streamlabs-connected', () => {
    gameState.streamlabsConnected = true
    io.sockets.emit('gameStateUpdate', gameState)
  })

  socket.on('character-selection-connected', () => {
    webSockets.char = socket.id
    gameState.characterSelectionConnected = true
    socket.emit('load-characters', gameState)
    io.sockets.emit('gameStateUpdate', gameState)
  })

  socket.on('overlay-connected', () => {
    webSockets.overlay = socket.id
    gameState.overlayConnected = true
    io.sockets.emit('gameStateUpdate', gameState)
  })

  socket.on('disconnect', () => {
    if (webSockets.char === socket.id) {
      gameState.characterSelectionConnected = false
    }
    if (webSockets.admin === socket.id) {
      gameState.adminConnected = false
    }
    if (webSockets.overlay === socket.id) {
      gameState.overlayConnected = false
    }
    io.sockets.emit('gameStateUpdate', gameState)
  })

  socket.on('generate-game', () => {
    generateNewGame()
  })

  socket.on('start-game', () => {
    gameState.inProgress = true
    gameState.canEnter = false
    twitchClient.action(config.channels[0], 'Game has begun! Only !random will join, !team to check.')
    io.sockets.emit('gameStateUpdate', gameState)

  })

  socket.on('kill-player', (playerId) => {
    switch (playerId) {
      case 1:
        killPlayer(0)
        break
      case 2:
        killPlayer(1)
        break
      case 3:
        killPlayer(2)
        break
      case 4:
        killPlayer(3)
        break
    }

  })

  socket.on('sudden-death-winner', (playerId) => {
    switch (playerId) {
      case 1:
        suddenDeathWinner(0)
        break
      case 2:
        suddenDeathWinner(1)
        break
      case 3:
        suddenDeathWinner(2)
        break
      case 4:
        suddenDeathWinner(3)
        break
    }
  })

})

function findTeam (username) {
  if (gameState.entries.includes(username)) {
    for (let i = 0; i < 4; i++) {
      if (gameState.players[i].team.includes(username)) {
        return i
      }
    }
  }
  return -1
}

function leaveTeam (username) {
  let teamIndex = findTeam(username)
  if (teamIndex === -1) {
    return -1
  }

  gameState.players[teamIndex].team = gameState.players[teamIndex].team.filter(e => e !== username)
  db.deleteEntry(gameState, username)
  return teamIndex

}

function chooseLineup () {
  gameState.lineup = []
  while (gameState.lineup.length < 4) {
    let randomNumber = getRandomInt(0, (Object.keys(gameState.roster.charPool).length) - 1)

    // Check to make sure we don't have two of the same character
    let characterExists = false
    for (let i = 0; i < gameState.lineup.length; i++) {
      if (gameState.lineup[i] === gameState.roster.charPool[randomNumber]) {
        characterExists = true
      }
    }
    if (characterExists) continue

    // make sure the character is unlocked
    if (gameState.roster.charPool[randomNumber].unlocked === false) continue

    // add the character if it doesn't exist
    gameState.lineup.push(gameState.roster.charPool[randomNumber])
  }
}

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateNewGame () {
  resetGameState()
  chooseLineup()

  for (let i = 0; i < 4; i++) {
    gameState.players[i] = new Player(gameState.lineup[i], i)
  }
  // make entry in games table of statsDB
  db.createNewGame(gameState)

  // grab the GameID

  db.getGameId().then((gameId) => {
    gameState.gameID = gameId
    gameState.generated = true
    gameState.canEnter = true
    io.sockets.emit('gameStateUpdate', gameState)
  })
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
  if (!gameState.generated) { return }

  // choose target, avoid self and dead targets
  let target = chooseTarget(safe)
  if (target === null || target === undefined) return // this shouldn't happen but lets check anyways

  gameState.players[target].lives--

  // make sure to mark player as dead if they are dead
  if (gameState.players[target].lives === 0) {
    gameState.players[target].alive = false
  }

  // give the safe player the kill
  gameState.players[safe].kills++

  // log kill
  gameState.killID++
  gameState.killTargetIndex = target
  gameState.safeTargetIndex = safe

  db.addKill(gameState)

  if (!isOver()) {
    io.to(webSockets.overlay).emit('kill-player', gameState)
    // If the game is not over show the kill player animation
    // sendAnimationKillPlayer()
  } else {
    gameOver()
  }
}

function gameOver () {
  getWinners()
  if (gameState.winners.length === 1) {
    // 1 winner means no sudden death
    // unlock = Unlockables(winners[0])
    payout(gameState.winners[0], 0)
    gameState.winningTargetIndex = gameState.winners[0].pos
    checkUnlocks().then(() => {
      io.to(webSockets.char).emit('load-characters', gameState)
      endGame()
    })
  } else if (gameState.winners.length === 2) {
    // 2 people reamaining is sudden death

    // Enable sudden death
    gameState.suddenDeath = 1

    io.to(webSockets.overlay).emit('sudden-death', gameState)
    io.sockets.emit('gameStateUpdate', gameState)

    // send message to twitch chat about the rules
    twitchClient.action(config.channels[0], 'Sudden Death mode:' + suddenDeath[gameState.suddenDeath])
    twitchClient.action(config.channels[0], suddenDeathDescriptions[gameState.suddenDeath])

  }
  // else {
  //   // payout all
  //   // todo not sure how we would get here
  //   for (let i = 0; i < 4; i++) {
  //     payout(gameState.players[i], 0, '', gameState.gameID)
  //   }
// }
}

function suddenDeathWinner (winner) {
  // let unlock = Unlockables(players[winner])
  payout(gameState.players[winner], (gameState.players[winner].team.length * 10))

  // Increment thw inners kill count
  gameState.players[winner].kills += 1
  gameState.winningTargetIndex = winner

  checkUnlocks().then(() => {
    io.to(webSockets.char).emit('load-characters', gameState)
    endGame()
  })
}

function endGame () {
  io.to(webSockets.overlay).emit('game-over', gameState)

  // Update the state and send it to the client
  resetGameState()

  io.sockets.emit('gameStateUpdate', gameState)
}

function resetGameState () {
  gameState.suddenDeath = -1
  gameState.gameID = -1
  gameState.killID = -1
  gameState.safeTargetIndex = -1
  gameState.killTargetIndex = -1
  gameState.winningTargetIndex = -1
  gameState.inProgress = false
  gameState.generated = false
  gameState.canEnter = false
  gameState.ready = false
  gameState.error = false
  gameState.canEnter = false
  gameState.players = []
  gameState.entries = []
  gameState.lineup = []
  gameState.winners = []
  gameState.unlockedCharacter = null
}

function getWinners () {
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
  for (let i = 0; i < 4; i++) {
    if (gameState.players[i].score === topScore) {
      gameState.winners.push(gameState.players[i])
    }
  }
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

function payout (winner, bonus) {
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
    twitchClient.action(config.channels[0], 'Team [' + winner.character.name + '] has won! The winner of this game\'s sticker giveaway is... ')
    setTimeout(function () {
      twitchClient.action(config.channels[0], winner.team[getRandomInt(0, winner.team.length - 1)])
    }, 2000)
  } else {
    twitchClient.action(config.channels[0], 'Team [' + winner.character.name + '] has won! Unfortunately there were no players on this team. ')
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

function checkUnlocks () {
  return new Promise(resolve => {
    let winner = gameState.winners[0]
    let activePlayers = []
    for (let i = 0; i < gameState.players.length; i++) {
      activePlayers.push(gameState.players[i].character.name)
    }

    if (winner.character.name === gameState.roster.ZELDA.fullName) {
      gameState.roster.charPool.forEach(char => {
        if (char.name === gameState.roster.SHEIK.fullName) {
          if (char.unlocked === true) {
            resolve(false)
          }
          db.unlockCharacter(gameState.roster.SHEIK.fullName)
          char.unlocked = true
          gameState.unlockedCharacter = char
          resolve(char)
        }
      })
    } else if (winner.character.name === gameState.roster.SAMUS.fullName) {
      gameState.roster.charPool.forEach(char => {
        if (char.name === gameState.roster.ZERO_SUIT_SAMUS.fullName) {
          if (char.unlocked === true) {
            resolve(false)
          }
          db.unlockCharacter(gameState.roster.ZERO_SUIT_SAMUS.fullName)
          char.unlocked = true
          gameState.unlockedCharacter = char
          resolve(char)
        }
      })
    }
    else if (winner.character.name === gameState.roster.PIT.fullName) {
      gameState.roster.charPool.forEach(char => {
        if (char.name === gameState.roster.PALUTENA.fullName) {
          if (char.unlocked === true) {
            resolve(false)
          }
          db.unlockCharacter(gameState.roster.PALUTENA.fullName)
          char.unlocked = true
          gameState.unlockedCharacter = char
          resolve(char)
        }
      })
    }
    else if (winner.character.name === gameState.roster.GAME_AND_WATCH.fullName) {
      gameState.roster.charPool.forEach(char => {
        if (char.name === gameState.roster.WII_FIT_TRAINER.fullName) {
          if (char.unlocked === true) {
            resolve(false)
          }
          db.unlockCharacter(gameState.roster.WII_FIT_TRAINER.fullName)
          char.unlocked = true
          gameState.unlockedCharacter = char
          resolve(char)
        }
      })
    } else if (winner.character.name === gameState.roster.MARTH.fullName && winner.score >= 5) {
      gameState.roster.charPool.forEach(char => {
        if (char.name === gameState.roster.LUCINA.fullName) {
          if (char.unlocked === true) {
            resolve(false)
          }
          db.unlockCharacter(gameState.roster.LUCINA.fullName)
          char.unlocked = true
          gameState.unlockedCharacter = char
          resolve(char)
        }
      })

    } else if (activePlayers.includes(gameState.roster.MARIO.fullName) && activePlayers.includes(gameState.roster.LUIGI.fullName) && (activePlayers.includes(gameState.roster.YOSHI.fullName) || activePlayers.includes(gameState.roster.PEACH.fullName))) {

      gameState.roster.charPool.forEach(char => {
        if (char.name === gameState.roster.ROSALINA.fullName) {
          if (char.unlocked === true) {
            resolve(false)
          }
          db.unlockCharacter(gameState.roster.ROSALINA.fullName)
          char.unlocked = true
          gameState.unlockedCharacter = char
          resolve(char)
        }
      })
    }
    resolve(false)
  })
}

function checkPlayerAliases (message, username) {

  for (let i = 0; i < 4; i++) {
    // The user can enter
    let aliases = gameState.players[i].character.aliases
    let characterName = gameState.players[i].character.name.toLowerCase()

    if (message.toLowerCase() === ('!' + characterName) || aliases.includes(message)) {

      let teamIndex = findTeam(username)
      // If the user is not on a team
      if (teamIndex === -1) {
        // Entries are close user can only random at this point
        if (!gameState.canEnter) {
          if (!gameState.entries.includes(username)) {
            twitchClient.action(config.channels[0], 'Entries are closed! !random to join a team')
          }
          return
        }
        gameState.entries.push(username)
        gameState.players[i].team.push(username)
        twitchClient.action(config.channels[0], username + ' joined team ' + gameState.players[i].character.name + '!')
        db.storeUser(username, gameState, i)
        db.addEntry(gameState, username, i)
        io.sockets.emit('gameStateUpdate', gameState)
      } else {
        twitchClient.action(config.channels[0], 'Already on a team! ' + gameState.players[teamIndex].character.name)
      }
    }
  }
}

// function unlockChar (unlock) {
//   roster.push(unlock)
//   jsonfile.writeFileSync('./characters.txt', roster)
//   client.action(config.channels[0], 'New Challenger Approaching! ' + fs.readFileSync('./assets/names/' + unlock + '.txt', 'utf8') + ' has joined the battle!')
//   var unlockAni = {'challenger': unlock}
//   webSockets.animation.sendUTF(JSON.stringify(unlockAni))
//   return unlock
// }

// twitch message interface
twitchClient.on('chat', function (channel, user, message) {
  if (message.toLowerCase() === '!replace 03b9-0000-0297-aa32') {
    twitchClient.timeout(config.channels[0], user['username'], 86400, 'THIS LEVEL IS BANNED DON\'T YOU HECKIN\' DARE')
  }

  // game not generated just return
  if (!gameState.generated) { return }

  // sudden death command
  if (gameState.suddenDeath === 1) {
    if (message.toLowerCase() === '!' + suddenDeath[gameState.suddenDeath].toLowerCase().replace(' ', '')) {
      twitchClient.action(config.channels[0], suddenDeathDescriptions[gameState.suddenDeath])
    }
  }

  // Show current team
  if (message.toLowerCase() === '!team') {
    let teamIndex = findTeam(user.username)
    if (teamIndex !== -1) {
      let msg = user.username + ' is on team ' + gameState.players[teamIndex].character.name + '!'
      twitchClient.action(config.channels[0], msg)
    }
  }

  // Leave your current team
  if (message.toLowerCase() === '!leave') {
    if (!gameState.canEnter) {
      twitchClient.action(config.channels[0], 'Entries are closed! You can no longer leave a team.')
      return
    }
    let leaveTeamIndex = leaveTeam(user.username)
    if (leaveTeamIndex !== -1) {
      let msg = user.username + ' you have left team ' + gameState.players[leaveTeamIndex].character.name + '!'
      twitchClient.action(config.channels[0], msg)
      io.sockets.emit('gameStateUpdate', gameState)
    }
  }

  // Join random team
  if (message.toLowerCase() === '!random') {
    let teamIndex = findTeam(user.username)
    if (teamIndex === -1) {
      gameState.entries.push(user.username)
      let randTeam = getRandomInt(0, 3)
      gameState.players[randTeam].team.push(user.username)
      twitchClient.action(config.channels[0], user.username + ' joined team ' + gameState.players[randTeam].character.name + '!')
      db.storeUser(user.username, gameState, randTeam)
      db.addEntry(gameState, user.username, randTeam)
      io.sockets.emit('gameStateUpdate', gameState)
      return
    } else {
      twitchClient.action(config.channels[0], 'Already on a team! ' + gameState.players[teamIndex].character.name)
      return
    }
  }

  // check any message for an alias
  checkPlayerAliases(message, user.username)

})
