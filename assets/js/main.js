$(function () {
  var connection = new WebSocket('ws://127.0.0.1:3000')
  hidePlayers('')
  hidePlayers('sd')
  $('#start').hide()
  connection.onopen = function () {
    // connection is opened and ready to use
    $('#counter').text('connection ready!')
    connection.send('admin')
  }

  connection.onerror = function (error) {
    if (error) {
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
        $('#start').show()
        $('#generate').hide()
      }
      if (json === 'gamestart') {
        showPlayers('')
        $('#start').hide()
      } else if (json === 'gamedone') {
        hidePlayers('')
        $('#generate').show()
      }
      // meant for sudden death scenario
      else if (typeof json[1] !== 'undefined' && typeof json[2] !== 'undefined') {
        if (json[2] !== 'SD') { return }
        console.log('doing the thing')
        hidePlayers('')
        $('#p' + (json[0].pos + 1)).show()
        $('#p' + (json[1].pos + 1)).show()
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
  $('#start').click(function () {
    connection.send('start')
  })
  $('#generate').click(function () {
    connection.send('generate')
  })
})
