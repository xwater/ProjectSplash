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

  connection.onmessage = function (message) {
    const game = JSON.parse(message.data)
    if (game.generated === true) {
      for (let i = 0; i < 4; i++) {
        $('#p' + (i + 1) + 'name').text(game.players[i]['fullName'])
        $('#p' + (i + 1) + 'pic').attr('src', './assets/icons/portraits/' + game.players[i]['character'] + '/' + game.players[i]['character'] + getRandomInt(1, 8) + '.png')
        $('#p' + (i + 1) + 'team').text('0')
      }
    } else { // if game has been
      for (let i = 0; i < 4; i++) {
        teamLength = game.players[i].team.length
        $('#p' + (i + 1) + 'team').text(teamLength)
      }
    }
  }
})

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
