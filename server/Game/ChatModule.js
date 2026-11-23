let GameModule = require("./GameModule");

const MAX_MESSAGE_LENGTH = 300;
const MAX_HISTORY = 200;

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
    if (!socket) return;
    
    socket.on("chat send", (arg) => {
      let message = arg?.message;
      if (typeof message != "string" || !message.trim() || message.length > MAX_MESSAGE_LENGTH) {
        return this.error("Rejected invalid chat message.");
      }
      let chat = {
        username: player.username,
        message: message,
      };
      this.io.emit("chat incoming", chat);
      this.chats.push(chat);
      if (this.chats.length > MAX_HISTORY) {
        this.chats.shift();
      }
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
