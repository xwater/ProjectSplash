let teamLength

$(function () {
  const connection = new WebSocket('ws://127.0.0.1:3000')

  window.onbeforeunload = function () {
    connection.send('char-close')
  }

  connection.onopen = function () {
    // connection is opened and ready to use
    connection.send('char')
  }

  connection.onerror = function (error) {
    if (error) {
      throw (error)
    }
    // an error occurred when sending/receiving data
  }

  connection.onmessage = function (msg) {
    const event = JSON.parse(msg.data)
    console.log(event.type)
    let game = event.gameState
    switch (event.type) {
      case 'init':
        loadCharacters(event.gameState.charPool)
        break
      case 'gameStateUpdate':
        for (let i = 0; i < game.players.length; i++) {
          $('#p' + (i + 1) + 'name').text(game.players[i]['fullName'])
          $('#p' + (i + 1) + 'pic').attr('src', './assets/icons/portraits/' + game.players[i].character.name + '/' + game.players[i].character.name + getRandomInt(1, 8) + '.png')
          $('#p' + (i + 1) + 'team').text('0')
        }
        break
      case 'players':
        for (let i = 0; i < 4; i++) {
          teamLength = game.players[i].team.length
          $('#p' + (i + 1) + 'team').text(teamLength)
        }
        break
    }
  }
})

function loadCharacters (unlockedCharacters) {
  console.log(unlockedCharacters, 'Unlocked Characters')
  let charGrid = $('#character-grid')
  let basePath = './assets/icons/select-icons/'
  for (let character in unlockedCharacters) {
    if (unlockedCharacters[character].unlocked === true) {
      let imgSrc = `<img id="${character}"src="${basePath}${character}.png"/>`
      charGrid.prepend(imgSrc)
    } else {
      let imgSrc = `<img id="${character}"src="${basePath}hidden.png"/>`
      charGrid.prepend(imgSrc)
    }
  }
}

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
