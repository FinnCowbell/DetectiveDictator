var fs = require("fs");
var express = require("express");
const socketio = require("socket.io");
var app = express();
var http = require("http");
const server = http.createServer(app);
app.disable("x-powered-by");

var io = socketio(server, {
  connectionStateRecovery: {},
  cors: {
    origin: ["https://secrethitler.js.org", "http://localhost:8000"],
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
  // Every legitimate client packet is a few hundred bytes; the 1 MB default only helps abusers.
  maxHttpBufferSize: 16 * 1024,
});

// Client packets are untrusted. A handler that throws on one must not take down every lobby.
function guardHandlers(socket) {
  const on = socket.on.bind(socket);
  socket.on = (event, handler) =>
    on(event, (...args) => {
      try {
        return handler(...args);
      } catch (err) {
        console.error(`[${socket.nsp.name}] "${event}" handler failed:`, err);
      }
    });
}
// A connection listener, not middleware: recovered sockets skip middleware. new_namespace fires
// inside io.of(), so this listener runs before the lobby attaches its handlers.
io.on("new_namespace", (nsp) => nsp.on("connect", guardHandlers));

var { Lobbies } = require("./lobby");
var Game = require("./Game/Hitler");
var Chat = require("./Game/ChatModule");
const LobbyModules = [Game, Chat];

//env.PORT = Heroku. DD_PORT = my implementation.
let port = process.env.DD_PORT || process.env.PORT || 1945;
// Loopback by default so only the local reverse proxy can reach the server.
let host = process.env.DD_HOST || "127.0.0.1";

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
  app.get("/", (req, res) => {
    res.send("Server is running");
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

//Initializing storage for all lobbies
var lobbies = new Lobbies(io, devMode, ...LobbyModules);
fs.readFile(__dirname + "/util/lobbykey.txt", "utf8", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  lobbies.words = data.capitalize().split(" ");
});

const LOBBY_CREATE_COOLDOWN_MS = 2000;

io.of("/menu").on("connection", (socket) => {
  //When we get a new connection
  console.log("[Menu]: User Connected");
  let lastCreatedAt = 0;
  socket.on("disconnect", () => {
    console.log("[Menu]: User disconnected");
  });
  socket.on("create lobby", () => {
    if (Date.now() - lastCreatedAt < LOBBY_CREATE_COOLDOWN_MS) {
      return;
    }
    lastCreatedAt = Date.now();
    let lobby = lobbies.createLobby();
    if (!lobby) {
      socket.emit("alert", "The server is full right now. Try again later!");
      return;
    }
    socket.emit("lobby created", { ID: lobby.ID });
  });
});

//___Run the server at the end___//
server.listen(port, host, () => {
  console.log(`listening on ${host}:${port}`);
});

//Useful Functions
String.prototype.capitalize = function () {
  return this.replace(/(?:^|\s)\S/g, function (a) {
    return a.toUpperCase();
  });
};
