# Project Splash


### Requirements

* [NodeJS](https://nodejs.org/en/) v9.10.0
* [.NET FrameWork](https://www.microsoft.com/en-ca/download/confirmation.aspx?id=15354)

### Optional Requirements

* [Yarn](https://yarnpkg.com/en/)


### Getting Started

Start by setting up the ```config.js``` file. You will need to set up the following sections:

```javascript
  serverPort: 3000, //change this port if you are running something on 3000
  identity: {
    username: 'WeebBot', // bot username
    password: 'oauth:asdasdasdsadasdasdasdsadadaasdsad', // oauth token with the 'oauth:' prefix
    oauth: 'asdasdasdsadasdasdasdsadadaasdsad' // just the oauth token
  },

  // Array of channels for your bot to join
  // Example channel #xwater
  channels: [
    '#Weebbot'
  ]
```

#### How to Run

Once you have set up the config.js file we can now start the bot.

Required For first use
```bash
npm install --global --production windows-build-tools
npm install
```
----------------------------
```bash
npm run start
```
OR
```bash
node splashbot.js
```

Once one of the above commands has been run you should then open up. Open up your browser and head to localhost:3000 or whatever port you defined in your config file. Open Character Selection and Overlay and you should be able to generate a game.

#### How to Join A Team

To join a team simply type !character_name in the chat where your bot is listening.

For example if the team consists of Mario, Sonic, Jiggly Puff, and Yoshi one would simply type !mario or !jigglypuff to join that team. Once the game has started though joing teams is now disabled and users may now only join by typing !random in chat.



