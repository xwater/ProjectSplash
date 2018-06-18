$(function () {
  const connection = new WebSocket('ws://127.0.0.1:3000')

  window.onbeforeunload = function () {
    connection.send('animation-close')
  }

  let audioToPlay = []
  const miiPrefix = ['s', 'g', 'f']
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
    const players = JSON.parse(message.data)

    // try to decode json (I assume that each message from server is json)
    try {
      console.log(players)
    } catch (e) {
      console.log(e)
      console.log('This doesn\'t look like a valid JSON: ', message.data)
    }

    // unlocking a character
    if (players[7]) {
      // $("#challenger").notify("a", {style:"challenger",autoHideDelay: 6000,autoHide: true,arrowShow: false,showAnimation: 'fadeIn',hideAnimation: 'fadeOut'});
      playGif('#challenger', 6000, './assets/gifs/misc/challenger.gif')

      audioToPlay = [
        './assets/sfx/announcer/' + players[7] + '.wav',
        './assets/sfx/' + players[7] + '/chime/' + players[7] + '1',
        './assets/sfx/misc/challenger.ogg'
      ]
      playAudio(audioToPlay)

      setTimeout(function () {
        // $("#Wanimation").notify("a", {style:""+json[7]+"1",autoHideDelay: 8000,autoHide: true,arrowShow: false,showAnimation: 'fadeIn',hideAnimation: 'fadeOut'})
        // $("#Lanimation").notify("a", {style:""+json[7]+"1",autoHideDelay: 8000,autoHide: true,arrowShow: false,showAnimation: 'fadeIn',hideAnimation: 'fadeOut'})
        playGif('#Wanimation', 8000, './assets/gifs/win/' + players[7] + '/' + players[7] + getRandomInt(1, 3) + '.gif')
        playGif('#Lanimation', 8000, './assets/gifs/win/' + players[7] + '/' + players[7] + getRandomInt(1, 3) + '.gif')
        // var announcer = new Audio('.\\sfx\\announcer\\'+json[7]+".wav");
        // announcer.volume = 0.4;
        // announcer.play();
      }, 6000)
      generateOverlay(players)
      return
    }

    // play the winning
    if (players[6]) {
      // $("#challenger").notify("a", {style:""+json[6]+"1-w",autoHideDelay: 7600,autoHide: true,arrowShow: false,showAnimation: 'fadeIn',hideAnimation: 'fadeOut'});

      playVideo(7600, './assets/gifs/victory/' + players[6] + '/' + players[6] + '.mp4')
      audioToPlay = [
        './assets/sfx/announcer/' + players[6] + '.wav',
        './assets/sfx/announcer/' + 'winner' + '.wav',
        './assets/sfx/' + players[6] + '/chime/' + players[6] + '1'
      ]
      playAudio(audioToPlay)

      setTimeout(function () {
        // $("#Wanimation").notify("a", {style:""+json[7]+"1",autoHideDelay: 8000,autoHide: true,arrowShow: false,showAnimation: 'fadeIn',hideAnimation: 'fadeOut'})
        // $("#Lanimation").notify("a", {style:""+json[7]+"1",autoHideDelay: 8000,autoHide: true,arrowShow: false,showAnimation: 'fadeIn',hideAnimation: 'fadeOut'})
        // var announcer = new Audio('.\\sfx\\announcer\\'+json[7]+".wav");
        // announcer.volume = 0.4;
        // announcer.play();
      }, 6000)
      generateOverlay(players)
      return
    }

    // regular kill scenario
    if (typeof players[4] !== 'undefined') {
      // var audio = new Audio('.\\sfx\\'+json[json[4]]["character"]+'\\taunt\\'+json[json[4]]["character"]+getRandomInt(1,5))
      console.log('./assets/sfx/' + players[players[4]]['character'] + '/taunt/' + players[players[4]]['character'] + getRandomInt(1, 5))

      if (players[6]) {
        audioToPlay = [
          './assets/sfx/announcer/' + players[6] + '.wav',
          './assets/sfx/announcer/' + 'winner' + '.wav',
          './assets/sfx/' + players[players[4]]['character'] + '/taunt/' + players[players[4]]['character'] + getRandomInt(1, 5),
          './assets/sfx/' + players[players[4]]['character'] + '/chime/' + players[players[4]]['character'] + '1'
        ]
      } else {
        audioToPlay = [
          './assets/sfx/' + players[players[4]]['character'] + '/taunt/' + players[players[4]]['character'] + getRandomInt(1, 5),
          './assets/sfx/' + players[players[4]]['character'] + '/chime/' + players[players[4]]['character'] + '1'
        ]
      }
      playAudio(audioToPlay)
      let winnerC = players[players[4]]['character']
      let loserC = players[players[5]]['character']
      if (winnerC === 'mii') {
        winnerC = miiPrefix[getRandomInt(1, 3) - 1] + 'mii'
      }
      if (loserC === 'mii') {
        loserC = miiPrefix[getRandomInt(1, 3) - 1] + 'mii'
      }
      // $("#Wanimation").notify("a", {style:""+winnerC+""+getRandomInt(1,3),autoHideDelay: 8000,autoHide: true,arrowShow: false,showAnimation: 'fadeIn',hideAnimation: 'fadeOut'})
      playGif('#Wanimation', 8000, './assets/gifs/win/' + winnerC + '/' + winnerC + getRandomInt(1, 3) + '.gif')
      // $("#Lanimation").notify("a", {style:""+loserC+"1-d",autoHideDelay: 8000,autoHide: true,arrowShow: false,showAnimation: 'fadeIn',hideAnimation: 'fadeOut'})
      playGif('#Lanimation', 8000, './assets/gifs/lose/' + loserC + '/' + loserC + '1.gif')
      console.log('#p' + (players[5] + 1))
      $('#p' + (players[5] + 1)).addClass('shakeit')
      setTimeout(function () {
        $('#p' + (players[5] + 1)).removeClass('shakeit')
      }, 2000)
    }
    generateOverlay(players)
  }
})

/*
playVideo(7600,"./gifs/victory/falcon/falcon.mp4")

setTimeout(function(){
 playVideo(7600,"./gifs/victory/fox/fox.mp4")
},10000)
*/

function playVideo (duration, path) {
  $('#video').fadeIn()
  $('#mp4src').fadeIn()
  document.getElementById('mp4src').src = path
  document.getElementById('video').load()
  document.getElementById('video').play()
  setTimeout(function () {
    $('#video').fadeOut()
    $('#mp4src').fadeOut()
  }, duration)
}

// todo play video

function playGif (DOMid, duration, path) {
  $(DOMid).find('img').attr('src', path).fadeIn()

  setTimeout(function () {
    $(DOMid).find('img').fadeOut()
  }, duration)
}

function generateOverlay (players) {
  for (let i = 0; i < players.length; i++) {
    $('#p' + (i + 1) + 'icon').attr('src', './assets/icons/live-portraits/' + players[i].character + '.png')
    lifeIcons(players[i].character, players[i].lives, (i + 1))
    $('#p' + (i + 1) + 'kills').text(players[i].kills)
    if (players[i].alive === false) {
      console.log('did the kill thing to ' + players[i].character)
    }
  }
}

function lifeIcons (character, lives, pos) {
  // remove all lives
  $('#p' + (pos) + 'lives').empty()
  // populate with the amount of lives needed
  for (let i = 0; i < lives; i++) {
    $('#p' + (pos) + 'lives').append('<img class="left life-icon" src="./assets/icons/lives/' + character + 'L.png">')
  }
}

// plays audio, arg is path of sound to play.  if multiple files, will play sequentially
function playAudio (args) {
  console.log(args)
  const audio = []
  audio[0] = new Howl({
    src: [args[0]],
    format: ['ogg', 'wav', 'mp3'],
    volume: 0.3
  })

  // if only 1 sound passed, play that one sound
  if (args.length === 1) {
    audio[0].play()
    return
  }

  // build sequential sounds to play
  for (let i = 1; i < args.length; ++i) {
    (function (cntr) {
      audio[i] = new Howl({
        src: [args[cntr]],
        format: ['ogg', 'wav', 'mp3'],
        volume: 0.5,
        onend: function () {
          audio[cntr - 1].play()
        }
      })
      console.log(i)
    })(i)
  }

  audio[args.length - 1].play()
}

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
