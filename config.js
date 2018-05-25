module.exports = {
  options: {
    debug: false
  },
  connection: {
    cluster: 'aws',
    reconnect: true
  },
  identity: {
    username: 'chinnbot', // bot username
    password: 'oauth:dfvhm92wcfctkt3ke55lta78ye8060', // oauth token with the 'oauth:' prefix
    oauth: 'dfvhm92wcfctkt3ke55lta78ye8060' // just the oauth token
  },
  // Array of channels for your bot to join
  // Example channel #xwater
  channels: [
    '#blackmarmalade'
  ]
}
