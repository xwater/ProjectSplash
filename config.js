module.exports = {
  serverPort: 3000,
  options: {
    debug: false
  },
  connection: {
    cluster: 'aws',
    reconnect: true
  },
  identity: {
    username: 'WEEBBOT', // bot username
    password: 'oauth:isb0LmBG3CeEfT1mJ7tvQ0J8CSvyWv', // oauth token with the 'oauth:' prefix
    oauth: 'isb0LmBG3CeEfT1mJ7tvQ0J8CSvyWv' // just the oauth token
  },
  // Array of channels for your bot to join
  // Example channel #xwater
  channels: [
    '#YOURCHANNEL'
  ]
}
