$(function () {
  let start = $('#start')

  const connection = new WebSocket('ws://127.0.0.1:3000')
  hidePlayers('')
  hidePlayers('sd')
  start.hide()
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
    // try to decode json (I assume that each message from server is json)
    try {
      const json = JSON.parse(message.data)
      console.log(json)
      if (json === 'ready') {
        start.show()
        $('#generate').hide()
      }
      if (json === 'The animation is not connected') {
        showErrors('The overlay window or character selection screen is not open. If they are open please refresh this page and the other two windows and try again.')
      }
      if (json === 'gamestart') {
        showPlayers('')
        start.hide()
      } else if (json === 'gamedone') {
        hidePlayers('')
        $('#generate').show()
      } else if (typeof json[1] !== 'undefined' && typeof json[2] !== 'undefined') {
        // meant for sudden death scenario
        if (json[2] !== 'SD') { return }
        console.log('doing the thing')
        hidePlayers('')
        $('#p' + (json[0].pos + 1)).show()
        $('#p' + (json[1].pos + 1)).show()
      } else {
        console.log(message)
      }
    } catch (e) {
      console.log('This doesn\'t look like a valid JSON: ', message.data)
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
  start.click(function () {
    connection.send('start')
  })
  $('#generate').click(function () {
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
