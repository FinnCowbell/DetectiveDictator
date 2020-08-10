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

  prototypeModuleInfo(Player) {
    //Gives the Player class new attributes used by the module.
    Player.prototype.exampleProperty = "default";
  }

  connectNewPlayer(player) {
    return;
  }

  connectSpectator(player) {
    return;
  }

  reconnectPlayer(player) {
    return;
  }

  disconnectPlayer(player) {
    return;
  }
}

module.exports = GameModule;
