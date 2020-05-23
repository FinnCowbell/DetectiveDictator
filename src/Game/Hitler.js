import React from 'react';
import io from 'socket.io-client'

import {LibBoard,FasBoard} from './gameParts/Boards.js'
import ActionBar from './gameParts/ActionBar.js'
import StatusBar from './gameParts/StatusBar.js'
import PlayerSidebar from './gameParts/PlayerSidebar.js'
import PlayerCard from './gameParts/PlayerCard.js'


export default class Hitler extends React.Component{
  constructor(props){
   super(props);
   this.socket = this.props.socket;
   this.state = {
    order: [101,102,103,104,105,106,7],
    memberships: {
      101: 1,
      102: 0,
      103: 2,
      104: 0,
      105: 1,
      106: 0,
      7: 1,
    },
    rounds: [{
      players: { 
        // Testing Players, for now.
        101: {PID: 101, username: "Karl", alive: true},
        102: {PID: 102, username: "Joseph", alive: true},
        103: {PID: 103, username: "Adolf", alive: true},
        104: {PID: 104, username: "Franklin", alive: true},
        105: {PID: 105, username: "Paul", alive: true},
        106: {PID: 106, username: "Winston", alive: true},
        7: {PID: 7, username: "Chiang", alive: true},
      },
      events: [{
        name: "pre game",
        details:{
          LibBoard: 0,
          FasBoard: 0,
          marker: 0,
          presidentPID: 101,
          chancellorPID: 103,
          previousPresidentPID: null,
          previousChancellorPID: null,
          votes: null,
          nInDiscard: null,
          nInDraw: 17,
          nInDiscard: 0,
        }
      }],
     }],
     //Logic for selecting players from the Player Sidebar
    selectedPlayer: null,
     //User Interface states.
    uiInfo: {
      voteReceived: false,
      bulletIndex: null,
      voted: {},
    }
   };
   this.changeSelectedPlayer = this.changeSelectedPlayer.bind(this);
   this.moveBullet = this.moveBullet.bind(this);
  }
  componentDidMount(){
    let socket = this.props.socket;
    socket.on('full game info', (arg)=>{
      this.setState({
        order: arg.order,
        memberships: arg.memberships,
        rounds: arg.rounds,
      })
    })
    socket.on('new round',(arg)=>{
      const rounds = this.state.rounds;
      let newRound = arg.newRound;
      //reset UI Info
      let uiInfo = {
        voteReceived: false,
        bulletIndex: null,
        voted: {},
      }
      // let knownMemberships = arg.memberships;
      // //Put our known memberships in the round.
      // newRound.memberships = knownMemberships;
      this.setState({
        rounds: rounds.concat([newRound]),
        uiInfo: uiInfo
      })
    })
    socket.on('new event', (arg)=>{
      console.log("NEW EVENT!");
      console.log(arg.event);
      const rounds = this.state.rounds;
      let events = rounds[rounds.length-1].events;
      events = events.concat([arg.event]);
      rounds[rounds.length-1].events = events;
      this.setState({
        rounds: rounds,
        selectedPlayer: null,
      })
    })
    socket.on(('end game'), (arg)=>{
      let endState = arg.endState;
      const rounds = this.state.rounds;
      this.setState({
        rounds: rounds.concat([endState]),
      })
    }); 
    //Sent by the player with the bullet.
    socket.on('new ui event', (arg)=>{
      let uiInfo = this.state.uiInfo;
      if(arg.name == 'player voted'){
        uiInfo.voted[arg.PID] = true;
        this.setState({
          uiInfo: uiInfo
        })
      } else if(arg.name == 'move bullet'){
        uiInfo.bulletIndex = arg.bulletIndex;
        this.setState({
          uiInfo: uiInfo
        })
      }
    })
  }
  componentWillUnmount(){
    delete this.socket;
  }
  changeSelectedPlayer(PID){
    this.setState({
      selectedPlayer: PID
    });
  }
  moveBullet(bulletIndex){
    this.socket.emit('move bullet', {bulletIndex: bulletIndex});
  }
  getPlayerAction(event){
    //Based on event info, constructs an 'action' for the player.
    let action = "";
    let eventName = event.name; 
    let yourPID = this.props.yourPID;
    let presidentPID = event.details.presidentPID;
    let chancellorPID = event.details.chancellorPID;
    let youArePresident = yourPID == presidentPID;
    let youAreChancellor = yourPID == chancellorPID;
    switch(eventName){
      //"your chancellor pick VS chancellor pick"
      case 'chancellor pick':
        action = youArePresident ? 'your chancellor pick' : 'chancellor pick'
        break;
      //your president discard vs president discard
      case 'president discard':
        action = youArePresident ? 'your president discard' : 'president discard'
        break;
      case 'chancellor discard':
        action = youAreChancellor ? 'your chancellor discard' : 'chancellor discard'
        break;
      case 'president peek':
        action = youArePresident ? 'your president peek' : 'president peek'
        break;
      case 'president pick':
        action = youArePresident ? 'your president pick' : 'president pick'
        break;
      case 'president kill':
        action = youArePresident ? 'your president kill' : 'president kill'
        break;
      case 'president investigate':
        action = youArePresident ? 'your president investigate' : 'president investigate'
        break;
      case 'president investigated':
        action = youArePresident ? 'your president investigated' : 'president investigated'
        break;
      case 'end game':
        action = event.details.reason;
        break;
      default: 
        action = eventName;
        break;
    }
    return action
  }
  
  getFullEvent(roundIndex = null, eventIndex = null){
    /*Events are sent with the changes that have occurred.
    This function compiles all changes during a round. 
    Optionally, a specific round or event can be referenced.*/
    let events, event, details = {};
    if(roundIndex == null){
      roundIndex = this.state.rounds.length-1;
    }
    events = this.state.rounds[roundIndex].events;
    if(eventIndex == null){
      eventIndex = events.length - 1;
    }
    //the first event is always new round.
    details = {};
    for(let i = 0; i <= eventIndex; i++){
      event = events[i].details;
      for(const change in event){
        details[change] = event[change]
      }
    }
    console.log(details);
    return {
      name: events[eventIndex].name,
      details: details
    };
  }
  render(){
    let rounds = this.state.rounds;
    let round = rounds[rounds.length-1];
    let players = round.players;
    let order = this.state.order;
    let memberships = this.state.memberships;
    let gameStyle = Math.floor((order.length - 5)/ 2);
    let event = this.getFullEvent();
    let action = this.getPlayerAction(event);
    let yourPID = this.props.yourPID;
    let alive = true;
    if(players[yourPID]){
      alive = players[yourPID].alive;
    }
    return (
      <div className="game-window">
      <StatusBar      lobbyID={this.props.lobbyID} 
                      yourPID={yourPID}
                      action={action}
                      event={event}
                      players={players}
                      memberships={memberships}
      />

      <PlayerCard PID={yourPID} memberships={memberships}/>

      <PlayerSidebar  order={order}
                      yourPID={yourPID}
                      action={action}
                      event={event}
                      players={players}
                      memberships={memberships}
                      uiInfo={this.state.uiInfo}
                      selectedPlayer={this.state.selectedPlayer}
                      changeSelectedPlayer={this.changeSelectedPlayer}
                      moveBullet={this.moveBullet}
      />
      <div className="boards">
      <LibBoard
        draw={event.details.nInDraw}
        discard={event.details.nInDiscard}
        marker={event.details.marker}
        nCards={event.details.libBoard}
        />
      <FasBoard
        nCards={event.details.fasBoard}
        gameStyle={gameStyle}
        />
      </div>
      { (alive || event.name == "end game")&&
        <ActionBar    action={action}
                      socket={this.socket}
                      event={event}
                      uiInfo={this.state.uiInfo}
                      selectedPlayer={this.state.selectedPlayer} 
                      leaveLobby={this.props.leaveLobby}
                      players={players}
        />
      }
      </div>
    )
  }
}

// export default hot(Hitler) //HOT HITLER?!?!