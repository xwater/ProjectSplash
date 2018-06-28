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
    username: 'weebbot', // bot username
    password: 'oauth:asdasdasdasdasdwqwewqeqw', // oauth token with the 'oauth:' prefix
    oauth: 'asdasdasdasdasdasdsadasdasdas' // just the oauth token
  },
  // Array of channels for your bot to join
  // Example channel #xwater
  channels: [
    '#weebbot'
  ]
}
