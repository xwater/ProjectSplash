module.exports = {
  serverPort: 8080,
  options: {
    debug: false
  },
  connection: {
    cluster: 'aws',
    reconnect: true
  },
  identity: {
    username: 'WeebBot', // bot username
    password: 'oauth:asdasdasdasdasdasdasdasdasdasdas', // oauth token with the 'oauth:' prefix
    oauth: 'asdasdasdasdasdasdasdasdasdasdas' // just the oauth token
  },
  // Array of channels for your bot to join
  // Example channel #xwater
  channels: [
    '#Weebbot'
  ]
}
