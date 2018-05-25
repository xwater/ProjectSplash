module.exports = {
  options: {
    debug: false
  },
  connection: {
    cluster: 'aws',
    reconnect: true
  },
  identity: {
    username: '', // bot username
    password: 'oauth:', // oauth token with the 'oauth:' prefix
    oauth: '' // just the oauth token
  },
  // Array of channels for your bot to join
  // Example channel #xwater
  channels: [
    ''
  ]
}
