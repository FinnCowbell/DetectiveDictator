var fs = require('fs')
var path = require('path')
var express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var {Lobbies, Lobby, Player} = require('./lobby');
var Game = require('./Game/Hitler');
const port = 1945;
// var cookieParser = require('cookie-parser') (for Cookies)
// var bodyParser = require('body-parser') (for Bodies)
// app.use(express.static(path.join(__dirname + "/public")))

//Useful Functions
String.prototype.capitalize = function() {
  return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

//Express Static File Logic
// app.use('/menu', express.static(path.join(__dirname, 'dist/Menu')));
// app.use('/lobby/:roomID/', express.static(path.join(__dirname, 'dist/Lobby')));

// app.get('/:lobby/:roomID/socket.io.js', function(req, res){
//   res.sendFile(__dirname + "/node_modules/socket.io-client/dist/socket.io.js");
// })
// app.get('/socket.io.js', function(req, res){
//   res.sendFile(__dirname + "/node_modules/socket.io-client/dist/socket.io.js");
// })

//Initializing storage for all lobbies
var lobbies = new Lobbies(io, Game);
fs.readFile(__dirname + "/util/wwii.txt", 'utf8', (err, data) =>{
  if(err){
    console.error(err)
    return
  }
  lobbies.words = data.capitalize().split("\n");
})

io.of('/menu').on("connection", (socket)=>{//When we get a new connection
  console.log("[Menu]: User Connected");
  socket.on("disconnect",()=>{
    console.log("[Menu]: User disconnected");
  });
  socket.on("create lobby", (arg) =>{
    let lobby = lobbies.createLobby(devMode = true);
    console.log(lobby);
    socket.emit("lobby created",{"ID": lobby.ID});
  })
});

//___Run the server at the end___//
http.listen(port, ()=>{
  console.log(`listening on port ${port}`);
});