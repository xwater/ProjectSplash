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
    password: 'oauth:asdasdasdasdasdasdasdasdasdsadsad', // oauth token with the 'oauth:' prefix
    oauth: 'asdsadsadsadasdasdasdasdasasd' // just the oauth token
  },
  // Array of channels for your bot to join
  // Example channel #xwater
  channels: [
    '#weeboo'
  ]
}
