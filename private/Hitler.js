class Hitler{
  constructor(players,nPlaying){
    this.running = false;
    this.unassignedPlayers = [];
    this.liberals = [];
    this.fascists = [];
    this.hitler = undefined;
    this.nPlaying = nPlaying;
    this.currentPlayer = 0;
  }
  startGame(){
    this.running = true;
    this.assignRoles();
  }
  assignRoles(){
    /*
    PLAYERS | 5 | 6 | 7 | 8 | 9 | 10
    LIBERALS| 3 | 4 | 4 | 5 | 5 | 6
    FASCISTS| 2 | 2 | 3 | 3 | 4 | 4 (one of which is adolf);
    */
   nliberals = Math.ceil((this.nPlaying + 1)/2);
   nFascists = Math.floor((this.nplaying - 1)/2);

  }
}

module.exports = Hitler;