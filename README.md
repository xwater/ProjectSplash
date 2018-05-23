# Project Splash


### Requirements

* [NodeJS](https://nodejs.org/en/)

### Optional Requirements

* [Yarn](https://yarnpkg.com/en/)


### Getting Started

Start by setting up the ```config.js``` file. You will need to set up the following sections:

```javascript
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

```bash
npm run start
```
OR
```bash
node splashbot.js
```

Once one of the above commands has been run you should then open up. ```index.html```, ```overlay.html```, and ```char.html``` you should then see some information in the console about the websockets connecting. At this point you should be able to generate a new game.

#### How to Join A Team

To join a team simply type !character_name in the chat where your bot is listening.

For example if the team conists of Mario, Sonic, Jiggly Puff, and Yoshi one would simply type !mario or !jigglypuff to join that team. Once the game has started though joing teams is now disabled and users may now only join by typing !random in chat.



