class GameModule {
  // The Default Module.
  constructor(lobby) {
    this.lobby = lobby;
    this.io = lobby.io;
    this.players = lobby.players;
    this.MIN_PLAYERS = 0;
    this.MAX_PLAYERS = Infinity;
  }
  error(msg) {
    this.lobby.error(msg);
  }
  log(msg) {
    this.lobby.log(msg);
  }

  init() {
    return;
  }

  connectNewPlayer(socket) {
    return;
  }

  connectSpectator(socket) {
    return;
  }

  reconnectPlayer(socket) {
    return;
  }

  disconnectPlayer(socket) {
    return;
  }
}

module.exports = GameModule;
