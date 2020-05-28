var fs = require('fs')
var path = require('path')
var express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var {Lobbies, Lobby, Player} = require('./lobby');
var Game = require('./Game/Hitler');
//env.PORT = Heroku. DD_PORT = my implementation.
let port = process.env.DD_PORT || process.env.PORT || 1945;

//Get Args
let argv = process.argv;

//Command Parameters.

//Host frontend by default.
let front = true
let devMode = false

for(let i = 0; i < argv.length; i++){
  if(argv[i] == "-dev"){
    devMode = true; 
    port = 1945;
  } else if(argv[i] == "-nofront"){
    front = false;
  }
}

if(front){
//if the backend is hosting the front end files,
  app.use('/', express.static(__dirname + "/../dist"))
  app.get('/', (req,res)=>{
    res.sendFile(__dirname + "/../dist/index.html");
  })
}

//Initializing storage for all lobbies
var lobbies = new Lobbies(io, Game);
fs.readFile(__dirname + "/util/wwii.txt", 'utf8', (err, data) =>{
  if(err){
    console.error(err)
    return
  }
  lobbies.words = data.capitalize().split(" ");
})

io.of('/menu').on("connection", (socket)=>{//When we get a new connection
  console.log("[Menu]: User Connected");
  socket.on("disconnect",()=>{
    console.log("[Menu]: User disconnected");
  });
  socket.on("create lobby", (arg) =>{
    let lobby = lobbies.createLobby(devMode = devMode);
    socket.emit("lobby created",{"ID": lobby.ID});
  })
});

//___Run the server at the end___//
http.listen(port, ()=>{
  console.log(`listening on port ${port}`);
});

//Useful Functions
String.prototype.capitalize = function() {
  return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};
