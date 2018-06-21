$(function () {
  const connection = new WebSocket('ws://127.0.0.1:3000')

  window.onbeforeunload = function () {
    connection.send('animation-close')
  }

  connection.onopen = function () {
    // connection is opened and ready to use
    connection.send('animation')
  }

  connection.onerror = function (error) {
    if (error) {
      throw (error)
    }
    // an error occurred when sending/receiving data
  }
  // json[0] to json[3] are character objects.  [4] is winning char, [5] is losing char, [6] isset if game is over with winning char, [7] is set if there is a character unlock
  connection.onmessage = function (message) {
    const event = JSON.parse(message.data)
    console.log(event.type)
    // const players = JSON.parse(message.data)

    switch (event.type) {
      case 'gameStateUpdate':
        generateOverlay(event.gameState.players)
        break
      case 'killPlayer':
        killPlayer(event.gameState)
        generateOverlay(event.gameState.players)
        break
      case 'suddenDeath':
        suddenDeath(event.gameState)
        generateOverlay(event.gameState.players)
        break
      case 'gameEnd':
        gameOver(event.gameState.players[event.gameState.winningTargetIndex])
        generateOverlay(event.gameState.players)
        break
      default:
        break
    }

    // // unlocking a character
    // if (players[7]) {
    //   // $("#challenger").notify("a", {style:"challenger",autoHideDelay: 6000,autoHide: true,arrowShow: false,showAnimation: 'fadeIn',hideAnimation: 'fadeOut'});
    //   playGif('#challenger', 6000, './assets/gifs/misc/challenger.gif')
    //
    //   audioToPlay = [
    //     './assets/sfx/announcer/' + players[7] + '.wav',
    //     './assets/sfx/' + players[7] + '/chime/' + players[7] + '1',
    //     './assets/sfx/misc/challenger.ogg'
    //   ]
    //   playAudio(audioToPlay)
    //
    //   setTimeout(function () {
    //     // $("#Wanimation").notify("a", {style:""+json[7]+"1",autoHideDelay: 8000,autoHide: true,arrowShow: false,showAnimation: 'fadeIn',hideAnimation: 'fadeOut'})
    //     // $("#Lanimation").notify("a", {style:""+json[7]+"1",autoHideDelay: 8000,autoHide: true,arrowShow: false,showAnimation: 'fadeIn',hideAnimation: 'fadeOut'})
    //     playGif('#Wanimation', 8000, './assets/gifs/win/' + players[7] + '/' + players[7] + getRandomInt(1, 3) + '.gif')
    //     playGif('#Lanimation', 8000, './assets/gifs/win/' + players[7] + '/' + players[7] + getRandomInt(1, 3) + '.gif')
    //     // var announcer = new Audio('.\\sfx\\announcer\\'+json[7]+".wav");
    //     // announcer.volume = 0.4;
    //     // announcer.play();
    //   }, 6000)
    //   generateOverlay(players)
    //   return
    // }
    //
  }
})

/*
playVideo(7600,"./gifs/victory/falcon/falcon.mp4")

setTimeout(function(){
 playVideo(7600,"./gifs/victory/fox/fox.mp4")
},10000)
*/

function animateLifeContainer (safeTarget) {
  let lifeContainer = $('#p' + safeTarget + 1)
  lifeContainer.addClass('shakeit')
  setTimeout(function () {
    lifeContainer.removeClass('shakeit')
  }, 2000)
}

function killPlayer (gameState) {
  let players = gameState.players
  console.log('Winner index: ', gameState.safeTargetIndex)
  console.log('Loser index: ', gameState.killTargetIndex)

  console.log(players[gameState.safeTargetIndex].character)
  let audioToPlay = [
    players[gameState.safeTargetIndex].character.sfx.taunts[getRandomInt(0, 4)],
    players[gameState.safeTargetIndex].character.sfx.chimes[0]
  ]

  playAudio(audioToPlay)

  playGif('#Wanimation', 8000, players[gameState.safeTargetIndex].character.gifs.win[getRandomInt(0, 2)])
  playGif('#Lanimation', 8000, players[gameState.killTargetIndex].character.gifs.lose)

  animateLifeContainer(gameState.safeTargetIndex)
}

function suddenDeath (gameState) {
  // TODO add sudden death MP4
  let players = gameState.players
  console.log(players[gameState.safeTargetIndex].character)
  let roundWinnerAudio = [
    players[gameState.safeTargetIndex].character.sfx.taunts[getRandomInt(0, 4)],
    players[gameState.safeTargetIndex].character.sfx.chimes[0]
  ]

  playAudio(roundWinnerAudio)

  playGif('#Wanimation', 8000, players[gameState.safeTargetIndex].character.gifs.win[getRandomInt(0, 2)])
  playGif('#Lanimation', 8000, players[gameState.killTargetIndex].character.gifs.lose)

  animateLifeContainer(gameState.safeTargetIndex)

  setTimeout(() => {
    let suddenDeathAudio = [players[gameState.safeTargetIndex].character.sfx.suddenDeath]
    playAudio(suddenDeathAudio)
  }, 1000 * 11)
}

function gameOver (player) {
  console.log('Winner is: ', player)
  playVideo(7600, player.character.videos.victory)
  let audioToPlay = [
    player.character.sfx.announcer,
    player.character.sfx.winner,
    player.character.sfx.chimes[0]
  ]
  playAudio(audioToPlay)
}

function playVideo (duration, path) {
  let video = $('#video')
  let mp4Src = $('#mp4src')

  video.fadeIn()
  mp4Src.fadeIn()

  document.getElementById('mp4src').src = path
  document.getElementById('video').load()
  document.getElementById('video').play()

  setTimeout(function () {
    video.fadeOut()
    mp4Src.fadeOut()
  }, duration)
}

function playGif (DOMid, duration, path) {
  console.log(DOMid, 'domID')
  console.log(path, 'gif path')
  $(DOMid).find('img').attr('src', path).fadeIn()
  setTimeout(function () {
    $(DOMid).find('img').fadeOut()
  }, duration)
}

function generateOverlay (players) {
  for (let i = 0; i < 4; i++) {
    $('#p' + (i + 1) + 'icon').attr('src', './assets/icons/live-portraits/' + players[i].character.name + '.png')
    lifeIcons(players[i].character.name, players[i].lives, (i + 1))
    $('#p' + (i + 1) + 'kills').text(players[i].kills)
    if (players[i].alive === false) {
      console.log(players[i].character.name + ' has no more lives')
    }
  }
}

function lifeIcons (character, lives, pos) {
  let livesElement = $('#p' + (pos) + 'lives')
  // remove all lives
  livesElement.empty()
  // populate with the amount of lives needed
  for (let i = 0; i < lives; i++) {
    livesElement.append('<img class="left life-icon" src="./assets/icons/lives/' + character + 'L.png">')
  }
}

// plays audio, arg is path of sound to play.  if multiple files, will play sequentially
function playAudio (args) {
  console.log(args)
  let audio = []
  // build sequential sounds to play
  for (let i = 0; i < args.length; ++i) {
    (function (cntr) {
      audio[i] = new Howl({
        src: [args[cntr]],
        format: ['ogg', 'wav', 'mp3'],
        volume: 0.5,
        onend: function () {
          if (audio[cntr - 1]) {
            audio[cntr - 1].play()
          }
        }
      })
    })(i)
  }

  audio[args.length - 1].play()
}

function getRandomInt (min, max) {
  return Math.floor(Math.random() * max) + 1
}
