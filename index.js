var fs = require('fs')
var path = require('path')
var express = require('express')
var app = express()
var server = require('http').createServer(app)
var io = require('socket.io')(server)
var Lobbies = require('./private/lobby');
// var cookieParser = require('cookie-parser') (for Cookies)
// var bodyParser = require('body-parser') (for Bodies)
// app.use(express.static(path.join(__dirname + "/public")))

//Useful Functions
String.prototype.capitalize = function() {
  return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

//Express logic to send necessary files to each user
app.get('/socket.io.js', function(req,res,next){
  res.sendFile(__dirname + "/node_modules/socket.io-client/dist/socket.io.js");
})
app.get('/mainMenu.js', function(req,res,next){
  res.sendFile(__dirname + "/public/menu/mainMenu.js");
});

app.get('/', function(req,res, next) {
  res.sendFile(__dirname + "/public/menu/");
  // res.sendFile(__dirname + "/public/menu/main.js");
});

//Initializing storage for all lobbies
var lobbies = new Lobbies();
fs.readFile(__dirname + "/private/util/nouns.txt", 'utf8', (err, data) =>{
  if(err){
    console.error(err)
    return
  }
  lobbies.words = data.capitalize().split("\n");
})


io.on("connection", (socket)=>{//When we get a new connection
  console.log("user connected");
  socket.on("disconnect",()=>{
    console.log("user disconnect");
  });
  socket.on("create game", (arg) =>{
    let lobby = lobbies.createLobby();
    console.log(lobby);
    socket.emit("game created",{"PID": arg.PID, "ID": lobby.ID});
  })
});
//___Run the server at the end___//
server.listen(1945);