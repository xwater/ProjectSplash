$(function () {
  let startBtn = $('#start')

  let overlay = $('#overlay')
  let charScreen = $('#char-screen')
  let generateBtn = $('#generate')
  let admin = $('#admin')

  let p1 = $('#p1')
  let p2 = $('#p2')
  let p3 = $('#p3')
  let p4 = $('#p4')
  let duration = 8000

  const connection = new WebSocket('ws://127.0.0.1:3000')

  registerButtonClicks(connection)

  window.onbeforeunload = function () {
    connection.send('admin-close')
  }

  hidePlayers('')
  hidePlayers('sd')
  startBtn.hide()

  connection.onopen = function () {
    hideErrors()
    // connection is opened and ready to use
    connection.send('admin')
  }

  connection.onerror = function (error) {
    if (error) {
      showErrors('Web socket server is not running. Please run npm run start from the root of the directory in your console.')
      throw (error)
    }
    // an error occurred when sending/receiving data
  }

  connection.onmessage = function (message) {
    console.log(message)
    const gameState = JSON.parse(message.data)
    // updateState(JSON.stringify(data, null, '  '))

    // Display Any Errors
    if (gameState.error !== null) {
      showErrors(gameState.error)
    } else {
      hideErrors()
    }

    // Game has been generated
    if (gameState.generated === true) {
      generateBtn.hide()
      if (gameState.in_progress === true) {
        showPlayers('')
        startBtn.hide()
      } else {
        hidePlayers('')
        startBtn.show()
      }
    } else {
      generateBtn.show()
      hidePlayers('')
    }

    if (gameState.suddenDeath === 1) {
      hidePlayers('')
      $('#p' + (gameState.winners[0].pos + 1)).show() // +1 because the divs are not zero indexed
      $('#p' + (gameState.winners[1].pos + 1)).show()// +1 because the divs are not zero indexed
    }

    if (gameState === 'The animation is not connected') {
      showErrors('The overlay window or character selection screen is not open. If they are open please refresh this page and the other two windows and try again.')
    }

    // socket connected messages

    if (gameState.overlay_connected === true) {
      overlay.show()
    } else {
      overlay.hide()
    }
    if (gameState.char_connected === true) {
      charScreen.show()
    } else {
      charScreen.hide()
    }

    if (gameState.admin_connected === true) {
      admin.show()
    } else {
      admin.hide()
    }

    // All our sockets are connected
    if (gameState.overlay_connected === true && gameState.char_connected === true && gameState.admin_connected === true) {
      showStatusMessage('connection ready!')
    }
  }

  function registerButtonClicks () {
    p1.click(function () {
      connection.send('1')
    })
    p2.click(function () {
      connection.send('2')
    })
    p3.click(function () {
      connection.send('3')
    })
    p4.click(function () {
      connection.send('4')
    })
    startBtn.click(function () {
      connection.send('start')
    })
    generateBtn.click(function () {
      connection.send('generate')
    })
  }

  function hidePlayers (append) {
    $('#p1' + append).hide()
    $('#p2' + append).hide()
    $('#p3' + append).hide()
    $('#p4' + append).hide()
  }

  function showPlayers (append) {
    $('#p1' + append).show()
    $('#p2' + append).show()
    $('#p3' + append).show()
    $('#p4' + append).show()
  }

  function hideErrors () {
    let errors = $('#error')
    errors.hide()
    errors.text('')
  }

  function showErrors (errorMsg) {
    hideStatusMessage()
    let errors = $('#error')
    errors.text(errorMsg)
    errors.show()
  }

  function showStatusMessage (msg) {
    hideErrors()
    let counter = $('#counter')
    counter.text(msg)
    counter.show()
  }

  function hideStatusMessage () {
    let counter = $('#counter')
    counter.hide()
    counter.text('')
  }

  function updateState (state) {
    $('#state').text(state)
  }
})
