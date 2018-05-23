// includes
const config = require('./config')
const Player = require('./main/Player')
var WebSocketServer = require('websocket').server
var http = require('http')
var fs = require('fs')
var jsonfile = require('jsonfile')
var tmi = require('tmi.js')
var sqlite3 = require('sqlite3').verbose()
var GameID = -1
var KillID = -1
var Season = 1
// generate character pools
var charpool = Object.values(jsonfile.readFileSync('./characters.txt'))
// DB connection
// var db = new sqlite3.Database("C:\\Users\\xwater\\AppData\\Roaming\\AnkhHeart\\AnkhBotR2\\Twitch\\Databases\\CurrencyDB.sqlite");
var statsDB = new sqlite3.Database('./lib/stats.db')
// global variable declarations
var players = []
var aliases = []
aliases['mario'] = ['redluigi', 'charles martinet', 'charlesmartinet', 'the great gonzales', 'thegreatgonzales', 'marty-o', 'greatgonzales']
aliases['luigi'] = ['greenmario', 'mr. l', 'dweeb', 'weegee', 'weegi', 'this character is lame', 'moistTrash']
aliases['pika'] = ['pikachu', 'pika-pika', 'yellow mouse', 'electricrat', 'electric rat']
aliases['puff'] = ['jigglypuff', 'purin', 'hungrybox', 'h-box', 'hbox', 'jiggly']
aliases['dk'] = ['donkey kong', 'donny keng', 'barb', 'harry dong', 'harambe']
aliases['falcon'] = ['captain falcon', 'captainfalcon', 'moistFalcon']
aliases['ness'] = ['backthrow boy', 'backthrow-boy']
aliases['link'] = ['hero of time', 'herooftime', 'lonk', 'ocarina of time is a great game', 'moistSheck']
aliases['samus'] = ['metroid', 'mattroid', 'shamus', 'girlrobot', 'seamus']
aliases['yoshi'] = ['greendog', 'moistCry']
aliases['fox'] = ['starfox', 'spacedog', 'lucidfoxx', 'foxmccloud', 'foxonly', 'foxonlyfinaldestination']
aliases['kirby'] = ['lilkirbs', 'vacuum', 'succ', 'sgtsucc', 'moistSucc']
aliases['ike'] = ['fightformyfriends', 'strongmarth', 'bigmarth']
aliases['sonic'] = ['sanic', 'gottagofast', '&knuckles', 'moistFast']
aliases['dedede'] = ['deedeedee', 'deedede', 'kingdedede', 'king dedede']
aliases['gaw'] = ['gameandwatch', 'game&watch', 'mrgameandwatch', 'mrgame&watch', 'game and watch', 'game & watch', 'g&w', 'gaymanwatch']
aliases['squirtle'] = ['turtle', 'squirt turtle', 'moistSquirt', 'moistGold']
aliases['mii'] = ['xwater', 'miikii', 'miiki', 'miki', 'slickmik', 'quickmik', 'trickymiki', 'gunkill', 'clutchwater', 'stickymiki']
var entries = []
var pools = []
var gameState = false
var canEnter = false
var SD = -1
var suddenDeath = ['Broke Man', 'Unstoppable', 'Pacifist', 'Champion']
var suddenDeathDescriptions = ['Broke Man is a 100 man easy Coinless run.  If he touches a single coin, the team with a remaining life wins (Red Coins Excluded)',
  'Unstoppable is a 100 man easy Deathless run.  If xwater dies, the team with a remaining stock wins.',
  'Pacifist is a run where you kill NO enemies.  If xwater murders something, the team with a remaining stock wins',
  'Champion is a 100 man easy all WR run.  If any level is completed without WR, the team with a stock reamining wins. (Autos Excluded)']

// eslint-disable-next-line new-cap
var client = new tmi.client(config)

client.connect()

// connections that need to be stored
var websockets = {}
var server = http.createServer(function (request, response) {
  // process HTTP request. Since we're writing just WebSockets server
  // we don't have to implement anything.
})
server.listen(3000, function () { })

// create the server
var wsServer = new WebSocketServer({
  httpServer: server
})

// WebSocket server
wsServer.on('request', function (request) {
  var connection = request.accept(null, request.origin)

  // This is the most important callback for us, we'll handle
  // all messages from users here.
  connection.on('message', function (message) {
    if (message.type === 'utf8') {
      // console.log(message.utf8Data);
      // console.log(Object.keys(websockets).length);
      // process WebSocket message
      if (message.utf8Data === 'animation') {
        websockets['animation'] = connection// store websocket for animation
        console.log('animation connected!')
      } else if (message.utf8Data === 'admin') {
        websockets['admin'] = connection// store websocket for admin
        console.log('admin connected!')
      } else if (message.utf8Data === 'char') {
        websockets['char'] = connection// store websocket for admin
        console.log('Char select connected!')
      } else if (message.utf8Data === 'generate') {
        if (Object.keys(websockets).length < 3) {
          connection.sendUTF(JSON.stringify('The animation is not connected'))
        } else {
          websockets['admin'].sendUTF(JSON.stringify('ready'))
          startGame()
        }
      } else if (message.utf8Data === 'start') {
        // close entry to the game
        websockets['admin'].sendUTF(JSON.stringify('gamestart'))
        canEnter = false
        client.action(config.channels[0], 'Game has begun! Only !random will join, !team to check.')
      } else {
        // choose a player to kill
        if (SD === -1) {
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
        } else if (SD >= 0) {
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
    var randomnumber = getRandomInt(0, (Object.keys(charpool).length) - 1)
    if (pools.indexOf(randomnumber) > -1) continue
    pools[pools.length] = randomnumber
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
  for (var i = 0; i < 4; i++) {
    players[i] = new Player(pools[i], charpool[pools[i]], i)
  }
  console.log(players[0].fullName + ' ' + players[1].fullName + ' ' + players[2].fullName + ' ' + players[3].fullName)
  // make entry in games table of statsDB
  statsDB.run('INSERT INTO Games (season, P1c, P2c, P3c, P4c) VALUES (' + Season + ',"' + players[0].character + '","' + players[1].character + '","' + players[2].character + '","' + players[3].character + '")')
  // grab the GameID
  statsDB.get('SELECT max(GameID) from Games', function (err, row) {
    if (err) {
      // TODO Probably shouldn't just crash if there is an error
      throw (err)
    }
    GameID = row['max(GameID)']
  })
  KillID = 0
  websockets['animation'].sendUTF(JSON.stringify(players))
  // send a "game start" message in [4] of char select screen
  var msg = JSON.parse(JSON.stringify(players))
  msg[4] = 'start'
  websockets['char'].sendUTF(JSON.stringify(msg))
  gameState = true
  canEnter = true
}

function chooseTarget (safe) {
  // array where key is random number, value is player ID of who to kill
  var targets = []
  for (var i = 0; i < 4; ++i) {
    if (i !== safe) {
      for (var j = 0; j < players[i].lives; j++) {
        targets.push(i)
      }
    }
  }
  var target = getRandomInt(0, targets.length - 1)
  console.log(target + ' ' + targets + 'targets.length = ' + targets.length + 'targets[target] = ' + targets[target])
  return targets[target]
}

function killPlayer (safe) {
  console.log(players[0].fullName + ' ' + players[1].fullName + ' ' + players[2].fullName + ' ' + players[3].fullName)
  if (!gameState) { return }
  var winChar, unlock
  // choose target, avoid self and dead targets
  var target = chooseTarget(safe)
  console.log('chosen target is ' + target)
  players[target].lives--
  // make sure to mark player as dead if they are dead
  if (players[target].lives === 0) {
    players[target].alive = false
  }
  // give the safe player the kill
  players[safe].kills++
  console.log(players[safe].character + ' just killed ' + players[target].character + '. They now have ' + players[target].lives + ' lives left.')
  // log kill
  KillID++
  statsDB.run('INSERT INTO Kills (GameID,KillID,player,target) VALUES (?,?,?,?)', [GameID, KillID, players[safe].character, players[target].character], function (err) {
    console.log(err)
  })
  // check to see if the game is over
  var done = isOver()
  // if there is a winner!

  if (done === true) {
    var winners = pickWinners()
    if (winners.length === 1) {
      unlock = Unlockables(winners[0])
      payout(winners[0], 0, '', GameID)
      endGame()
      winChar = winners[0]['character']
    } else if (winners.length === 2) {
      // sudden death here
      SD = getRandomInt(0, 3)
      client.action(config.channels[0], 'Sudden Death mode:' + suddenDeath[SD])
      client.action(config.channels[0], suddenDeathDescriptions[SD])
      winners.push('SD')
      websockets['admin'].sendUTF(JSON.stringify(winners))
    } else {
      // payout all
      for (var i = 0; i < 4; i++) {
        payout(players[i], 0, '', GameID)
      }
      endGame()
    }
  }
  // build message for animation
  var msg = JSON.parse(JSON.stringify(players))
  msg[4] = safe
  msg[5] = target
  if (winChar) { msg[6] = winChar }
  if (unlock) { msg[7] = unlock }
  console.log(JSON.stringify(msg))
  websockets['animation'].sendUTF(JSON.stringify(msg))
}

function SDwinner (winner) {
  var unlock = Unlockables(players[winner])
  payout(players[winner], (players[winner].team.length * 10), 'SUDDEN DEATH VICTORY!', GameID)
  console.log('ALERT!!@#!#!@#@!' + JSON.stringify(players[winner].character))
  var msg = JSON.parse(JSON.stringify(players))
  var winners = pickWinners()

  msg[4] = winner
  // grab both winners again, put loser position into msg[5]
  if (winners[0].pos === winner) { msg[5] = winners[1].pos } else { msg[5] = winners[0].pos }
  msg[6] = players[winner].character
  if (unlock) { msg[7] = unlock }
  websockets['animation'].sendUTF(JSON.stringify(msg))
  endGame()
}

function endGame () {
  SD = -1
  gameState = false
  GameID = -1
  KillID = -1
  websockets['admin'].sendUTF(JSON.stringify('gamedone'))
  var charmsg = JSON.parse(JSON.stringify(players))
  charmsg[4] = 'end'
  websockets['char'].sendUTF(JSON.stringify(charmsg))
}

function pickWinners () {
  var scores = []
  var topScore = 0
  // calculate top score and each player's score
  for (var i = 0; i < 4; i++) {
    scores[i] = players[i].kills + (players[i].lives * 2)
    if (scores[i] > topScore) {
      topScore = scores[i]
    }
  }
  // put all players with topscore into winner array, return.
  var winners = []
  for (var j = 0; j < 4; j++) {
    if (scores[j] === topScore) {
      winners.push(players[j])
    }
  }

  return winners
}

function isOver () {
  var alivect = 0
  for (var i = 0; i < 4; i++) {
    if (players[i].alive === true) {
      alivect++
    }
  }
  if (alivect === 1) {
    gameState = false
    return true
  }
  return false
}

function Unlockables (winner) {
  if (charpool.indexOf('sonic') === -1) {
    if (players[0].kills > 4) {
      return unlockChar('sonic')
    }
  }
  if (charpool.indexOf('gaw') === -1) {
    if (winner.lives === 2 && winner.kills === 0) {
      return unlockChar('gaw')
    }
  }
  if (charpool.indexOf('squirtle') === -1) {
    if ((winner.character === 'pika' || winner.character === 'puff') && entries.length > 99) {
      return unlockChar('squirtle')
    }
  }
  if (charpool.indexOf('mii') === -1) {
    if (winner.team.indexOf('xwater') > -1) {
      return unlockChar('mii')
    }
  }
}

function unlockChar (unlock) {
  charpool.push(unlock)
  jsonfile.writeFileSync('./characters.txt', charpool)
  console.log(unlock + ' Has joined the battle!')
  client.action(config.channels[0], 'New Challenger Approaching! ' + fs.readFileSync('./assets/names/' + unlock + '.txt', 'utf8') + ' has joined the battle!')
  var unlockAni = {'challenger': unlock}
  websockets['animation'].sendUTF(JSON.stringify(unlockAni))
  return unlock
}

function payout (winner, bonus, message, GID) {
  // calcualte pay
  var pay = calcPay(winner)
  // if pay, for some reason is NaN, set it to 0
  if (isNaN(pay)) { pay = 0 }
  // pay out all of winning team
  pay = parseInt(pay + bonus, 10)
  for (var i = 0; i < winner.team.length; i++) {
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
    [players[0].kills + (players[0].lives * 2),
      players[1].kills + (players[1].lives * 2),
      players[2].kills + (players[2].lives * 2),
      players[3].kills + (players[3].lives * 2),
      pay, GID])

  console.log(winner.team)
  client.action(config.channels[0], 'Team [' + winner.fullName + '] has won! The winner of this game\'s sticker giveaway is... ')
  setTimeout(function () {
    client.action(config.channels[0], winner.team[getRandomInt(0, winner.team.length - 1)])
  }, 2000)
}

function calcPay (winners) {
  var baseRate = entries.length * 10
  // bonus greater for smaller teams.  = (1-%ofplayers)+1
  var bonus = (1 - (winners.team.length / entries.length) + 1)
  // multiply the baserate by the bonus
  var pay = bonus * baseRate
  console.log('calculated payrate: ' + pay)

  return pay
}

function findTeam (username) {
  console.log('checking team 1')
  if (entries.indexOf(username) !== -1) {
    console.log('checking team 2')
    for (var i = 0; i < 4; i++) {
      if (players[i].team.indexOf(username) !== -1) {
        console.log('found it!')
        return username + ' is on team ' + players[i].fullName + '!'
      }
    }
  }
}

// stores user in the DB if user isnt already in

function storeUser (username) {
  statsDB.get('SELECT * from Users where User = \'' + username + '\' and Season = ' + Season, function (err, row) {
    if (err) {
      // TODO Probably shouldn't just crash if there is an error
      throw (err)
    }
    if (row) {
      console.log('User found in table')
    } else {
      console.log('NOT FOUND! ENTER IT HERE')
      statsDB.run('INSERT INTO Users VALUES (\'' + username + '\',0,0,0,0,' + Season + ')')
    }
  })
  console.log('done checkin')
}

// twitch message interface

client.on('chat', function (channel, user, message, self) {
  if (message.toLowerCase() === '!replace 03b9-0000-0297-aa32') {
    client.timeout(config.channels[0], user['username'], 86400, 'THIS LEVEL IS BANNED DON\'T YOU HECKIN\' DARE')
  }

  if (!gameState) { return }
  if (SD >= 0) {
    if (message.toLowerCase() === '!' + suddenDeath[SD].toLowerCase().replace(' ', '')) {
      client.action('config.channels[0]', suddenDeathDescriptions[SD])
      console.log('got the message for SD')
    }
  }
  var msg

  if (message.toLowerCase() === '!team') {
    msg = findTeam(user['username'])
    if (msg) {
      client.action(config.channels[0], msg)
    }
  }
  for (var i = 0; i < 4; i++) {
    if (message.toLowerCase() === '!random') {
      if (entries.indexOf(user['username']) === -1) {
        entries.push(user['username'])
        var randTeam = getRandomInt(0, 3)
        players[randTeam].team.push(user['username'])
        client.action(config.channels[0], user['username'] + ' joined team ' + players[randTeam].fullName + '!')
        storeUser(user['username'])
        statsDB.run('INSERT INTO Entries values(?,?,?,?,?)', [GameID, user['username'], players[randTeam].character, 1, randTeam])
        websockets['char'].sendUTF(JSON.stringify(players))
        return
      } else {
        msg = findTeam(user['username'])
        client.action(config.channels[0], 'Already on a team! ' + msg)
        return
      }
    }
    if (!canEnter) {
      if (message.toLowerCase() === '!' + players[i].character || aliases[players[i].character].indexOf(message.toLowerCase().substr(1)) !== -1) {
        if (entries.indexOf(user['username']) === -1) {
          client.action(config.channels[0], 'Entries are closed! !random to join a team')
          return
        }
      }
    }
    if (message.toLowerCase() === '!' + players[i].character || aliases[players[i].character].indexOf(message.toLowerCase().substr(1)) !== -1) {
      if (entries.indexOf(user['username']) === -1) {
        entries.push(user['username'])
        players[i].team.push(user['username'])
        client.action(config.channels[0], user['username'] + ' joined team ' + players[i].fullName + '!')
        statsDB.run('INSERT INTO Entries values(?,?,?,?,?)', [GameID, user['username'], players[i].character, 0, i])
        storeUser(user['username'])
        websockets['char'].sendUTF(JSON.stringify(players))
        return
      } else {
        msg = findTeam(user['username'])
        client.action(config.channels[0], 'Already on a team! ' + msg)
        return
      }
    }
  }
})
