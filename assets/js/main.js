$(function () {
  let startBtn = $('#start')

  let overlay = $('#overlay')
  let charScreen = $('#char-screen')
  let generateBtn = $('#generate')
  let admin = $('#admin')

  const connection = new WebSocket('ws://127.0.0.1:3000')

  window.onbeforeunload = function () {
    connection.send('admin-close')
  }

  hidePlayers('')
  hidePlayers('sd')
  startBtn.hide()
  connection.onopen = function () {
    hideErrors()
    // connection is opened and ready to use
    showStatusMessage('connection ready!')
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
    const data = JSON.parse(message.data)
    // updateState(JSON.stringify(data, null, '  '))

    // Display Any Errors
    if (data.error !== null) {
      showErrors(data.error)
    } else {
      hideErrors()
    }

    // Game has been generated
    if (data.generated === true) {
      generateBtn.hide()
      if (data.in_progress === true) {
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

    if (typeof data[1] !== 'undefined' && typeof data[2] !== 'undefined') {
      // meant for sudden death scenario
      if (data[2] !== 'SD') { return }
      console.log('doing the thing')
      hidePlayers('')
      $('#p' + (data[0].pos + 1)).show()
      $('#p' + (data[1].pos + 1)).show()
    }

    if (data === 'The animation is not connected') {
      showErrors('The overlay window or character selection screen is not open. If they are open please refresh this page and the other two windows and try again.')
    }

    // socket connected messages

    if (data.overlay_connected === true) {
      overlay.show()
    } else {
      overlay.hide()
    }
    if (data.char_connected === true) {
      charScreen.show()
    } else {
      charScreen.hide()
    }

    if (data.admin_connected === true) {
      admin.show()
    } else {
      admin.hide()
    }
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

  $('#p1').click(function () {
    connection.send('1')
  })
  $('#p2').click(function () {
    connection.send('2')
  })
  $('#p3').click(function () {
    connection.send('3')
  })
  $('#p4').click(function () {
    connection.send('4')
  })
  startBtn.click(function () {
    connection.send('start')
  })
  generateBtn.click(function () {
    connection.send('generate')
  })
})

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
