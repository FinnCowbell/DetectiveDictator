let GameModule = require("./GameModule");

class ChatModule extends GameModule {
  constructor(lobby) {
    super(lobby);
    this.chats = [];
  }
  init() {
    this.chats = [];
    this.io.emit("full chat history", this.chats);
  }

  connectNewPlayer(socket) {
    this.activateSignals(socket);
  }
  reconnectPlayer(socket) {
    this.activateSignals(socket);
  }
  connectSpectator(socket) {
    //Spectators as of now cannot send messages.
    socket.on("full chat request", () => {
      this.sendFullChatHistory(socket);
    });
  }
  activateSignals(socket) {
    let player = this.lobby.getPlayerBySocketID(socket.id);
    socket.on("chat send", (arg) => {
      let chat = {
        username: player.username,
        message: arg.message,
      };
      this.io.emit("chat incoming", chat);
      this.chats.push(chat);
    });
    socket.on("full chat request", () => {
      this.sendFullChatHistory(socket);
    });
    //Despite always sending chats on reconnect, we wait for the player to send a request for the messages to avioid latency issues.
  }
  sendFullChatHistory(socket) {
    socket.emit("full chat history", this.chats);
  }
}

module.exports = ChatModule;
