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

  connectNewPlayer(player) {
    this.activateSignals(player);
  }
  reconnectPlayer(player) {
    this.activateSignals(player);
  }
  connectSpectator(player) {
    //Spectators as of now cannot send messages.
    player.socket.on("full chat request", () => {
      this.sendFullChatHistory(player);
    });
  }
  activateSignals(player) {
    let socket = player.socket;
    socket.on("chat send", (arg) => {
      let chat = {
        username: player.username,
        message: arg.message,
      };
      this.io.emit("chat incoming", chat);
      this.chats.push(chat);
    });
    socket.on("full chat request", () => {
      this.sendFullChatHistory(player);
    });
    //Despite always sending chats on reconnect, we wait for the player to send a request for the messages to avioid latency issues.
  }
  sendFullChatHistory(player) {
    let socket = player.socket;
    socket.emit("full chat history", this.chats);
  }
}

module.exports = ChatModule;
