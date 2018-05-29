let teamLength
let gamestate = false
$(function () {
  const connection = new WebSocket('ws://127.0.0.1:3000')

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
    const json = JSON.parse(message.data)
    let i
    try {
      console.log(json)
    } catch (e) {
      console.log(e)
      console.log('This doesn\'t look like a valid JSON: ', message.data)
    }
    if (gamestate === false) {
      for (i = 0; i < 4; i++) {
        $('#p' + (i + 1) + 'name').text(json[i]['fullName'])
        $('#p' + (i + 1) + 'pic').attr('src', './assets/icons/portraits/' + json[i]['character'] + '/' + json[i]['character'] + getRandomInt(1, 8) + '.png')
        $('#p' + (i + 1) + 'team').text('0')
      }
    } else { // if game has been
      for (i = 0; i < 4; i++) {
        teamLength = json[i]['team'].length
        $('#p' + (i + 1) + 'team').text(teamLength)
      }
    }

    // check if game is starting or ending.  change game state accordingly
    if (json[4]) {
      if (json[4] === 'start') {
        gamestate = true
      }
      if (json[4] === 'end') {
        gamestate = false
      }
    }
  }
})

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
