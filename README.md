# DetectiveDictator

An Online Version of the Mafia-style WWII Electon Game!

## Huh?

Ok, It's the board game Secret Hitler, but in you and your friends browsers!

Whereas a website such as secrethitler.io was made to provide to a community of online Secret Hitler players, I made this version for social-distancing game lovers who want to get their friends together for a Zoom board game night!

## Features

* Multiple lobby creation for simultaneous games hosted on one server!
* A user interface that stays true to the original game art style!
* Handling client rejoins mid-game
* A fun lil' built-in chat
* Thumbs
* An anticipatory assasination bullet

## Built With

* Express
* Socketio
* React
* Sass
* Webpack
* Secret Hitler Print'n'Play ([colorized](https://drive.google.com/file/d/0B6bCrUGk_4ZgR0lqN2hBbjQ4MkU/view))
* Early Concept Art From [A Medium Article](https://medium.com/@mackenzieschubert/secret-hitler-illustration-graphic-design-435be3e3586c)

## Usage

After running `yarn run` or `npm run`,


`start-back` or `start-back-prod` will start the back.

`start-front` runs a the webpack development server.

`build-dev` or `build-prod` generate the dev or production front-end files in ./src.

IF you host the server and the static front-end in different locations: 
- In src/index.js, set `SOCKETIO_SERVER` to the IP or URL that the back-end server is hosted at.
