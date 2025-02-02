var fs = require("fs");
var express = require("express");
const socketio = require("socket.io");
const cors = require("cors");
var app = express();
var http = require("http");
const server = http.createServer(app);
const corsOptions = {
  origin: ["https://secrethitler.js.org", "http://localhost:8000"],
  methods: ["GET", "POST"],
};

var io = socketio(server, {
  cors: corsOptions,
  pingTimeout: 5000,
  secure: true,
  transports: ["websocket", "polling"],
  connectionStateRecovery: {},
});

app.use(cors(corsOptions));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


var { Lobbies, Lobby, Player } = require("./lobby");
var Game = require("./Game/Hitler");
var Chat = require("./Game/ChatModule");
const LobbyModules = [Game, Chat];

//env.PORT = Heroku. DD_PORT = my implementation.
let port = process.env.DD_PORT || process.env.PORT || 1945;

//Get Args
let argv = process.argv;

//Command Parameters.

//Host frontend by default no devmode by default..
let front = true;
let devMode = false;

for (let i = 0; i < argv.length; i++) {
  if (argv[i] == "-dev") {
    devMode = true;
  } else if (argv[i] == "-nofront") {
    front = false;
  }
}

if (front) {
  //if the backend is hosting the front end files,
  app.use("/", express.static(__dirname + "/../dist"));
  app.get("/", (req, res) => {
    res.sendFile(__dirname + "/../dist/index.html");
  });
} else {
  // Example route
  app.get('/', (req, res) => {
  res.send('Server is running');
});

}

//Initializing storage for all lobbies
var lobbies = new Lobbies(io, devMode, ...LobbyModules);
fs.readFile(__dirname + "/util/lobbykey.txt", "utf8", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  lobbies.words = data.capitalize().split(" ");
});

io.of("/menu").on("connection", (socket) => {
  //When we get a new connection
  console.log("[Menu]: User Connected");
  socket.on("disconnect", () => {
    console.log("[Menu]: User disconnected");
  });
  socket.on("create lobby", (arg) => {
    let lobby = lobbies.createLobby();
    socket.emit("lobby created", { ID: lobby.ID });
  });
});

//___Run the server at the end___//
server.listen(port, () => {
  console.log(`listening on port ${port}`);
});

//Useful Functions
String.prototype.capitalize = function () {
  return this.replace(/(?:^|\s)\S/g, function (a) {
    return a.toUpperCase();
  });
};
