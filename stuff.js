// WebSocket server
wsServer.on('request', function (request) {
  let connection = request.accept(null, request.origin)

  // This is the most important callback for us, we'll handle
  // all messages from users here.
  connection.on('message', function (message) {
    if (message.type === 'utf8') {
      if (message.utf8Data === 'animation') {
        gameState.overlayConnected = true
        webSockets.animation = connection// store websocket for animation
        if (webSockets.admin) {
          webSockets.admin.send(JSON.stringify(gameState))
        }

        if (gameState.overlayConnected === true && gameState.players.length >= 4) {
          sendAnimationGameStateUpdate()
        }
        // console.log('OVERLAY CONNECTED!')
      }

      if (message.utf8Data === 'animation-close') {
        gameState.overlayConnected = false
        if (webSockets.admin) {
          webSockets.admin.send(JSON.stringify(gameState))
        }
        webSockets.animation = null
      }



      if (message.utf8Data === 'start') {
        // close entry to the game
        gameState.inProgress = true
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
        } else if (gameState.suddenDeath === 1) {

        }
      }
    }
  })
})