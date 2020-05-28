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

After running `yarn init` or `npm init`, you can run the following yarn/npm scripts:

Run `build` to compile the frontend and then `start` to start the server.

`build-dev` builds a development version of the frontend.

`test-front` runs the webpack development server, running on port 8080.

`test-back` runs the backend server in development mode, with nodemon enabled.
- Development mode bypasses some game restrictions: removing the limitations to the # of players and allowing players to be in office subsequent rounds.

IF you want to host the server and static frontend files on different servers: 
1. Set the environmental variables DD_SERVER and (optionally) DD_PORT to the  IP/URL of the server and the port you want to use.
    - EX: `export DD_SERVER="192.168.2.0"` 
    - Default Port: 1945

2. Run the `build-custom` script
    - EX: `yarn run build-custom`


3. Run `start-back` on the server computer. 
    - If a custom port was given, DD_PORT must be set on the server computer as well.

4. The compiled files in './dist' are compiled to connect to DD_SERVER:DD_PORT from any computer. 
