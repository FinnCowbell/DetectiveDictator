class Hitler{
  constructor(io, players){
    this.running = false;
    this.io = io;
    this.players = players;
    this.order = []; //Order of players by PID.
    this.liberals = [];
    this.fascists = [];
    this.hitler = undefined;
    this.president = undefined;
    this.chancellor = undefined;
    this.nPlaying = 0;
    this.gameStyle = -1; // 0 is 5-6 players, 1 is 7-8, 2 is 9-10
    this.currentPlayer = 0;
    this.activateGameSignals();
  }
  init(){
    this.initPlayers();
    this.running = true;
  }
  initPlayers(){
    //Adds the alive and membership attributes to each player.
    for(player in players){
      player.alive = true;
      player.membership = -1;
      this.nPlaying++; //reCalculate player count.
      //If 0, liberal. If 1, Fascist. If 2, Hitler. -1 is unassigned/spectating (?)
      this.order.push(player);
      this.assignRoles();
    }
    this.shuffle(this.order); //Shuffle the order of players.
  }
  assignRoles(){
    // PLAYERS | 5 | 6 | 7 | 8 | 9 | 10
    // LIBERALS| 3 | 4 | 4 | 5 | 5 | 6
    // FASCISTS| 2 | 2 | 3 | 3 | 4 | 4
    this.shuffle(this.order); //Shuffles the players, so we don't know who's getting what.
    let nLiberals = Math.ceil((this.nPlaying + 1)/2);
    let nFascists = this.nPlaying - nLiberals - 1; 
    for(player in this.order){
      if(player.membership != -1)
      {
       console.log("player already assigned role!");
      } 
      else if(nLiberals > 0)
      {
      this.liberals.push(player);
      player.membership = 0;
      nLiberals--;
      } 
      else if(nFascists > 0)
      {
        this.fascists.push(player);
        player.membership = 1;
        nFascists--;
      } 
      else
      {
        if(this.hitler){ //Something went wrong. Checking things like this could be helpful later
          console.log("ERROR! Hitler already defined");
        }
        player.membership = 2;
        this.hitler = player;
      }
    }
  }
  shuffle(a){
    //For shuffling player order, roles, party Cards
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
    }
    return a;
  }
  getGameInfo(){
    let arg = {

    }
    return arg;
  }
  activateGameSignals(){

  }
}

module.exports = Hitler;