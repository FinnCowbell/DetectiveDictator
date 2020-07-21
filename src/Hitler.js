import React from 'react';
import io from 'socket.io-client'

import {LibBoard,FasBoard} from './parts/gameParts/Boards.js'
import ActionBar from './parts/gameParts/ActionBar.js'
import StatusBar from './parts/gameParts/StatusBar.js'
import PlayerSidebar from './parts/gameParts/PlayerSidebar.js'
import PlayerCard from './parts/gameParts/PlayerCard.js'
import EndWindow from './parts/gameParts/EndWindow.js'

export default class Hitler extends React.Component{
  constructor(props){
   super(props);
   this.state = {
    order: [101,102,103,104,105,106,107],
    memberships: {
      101: 1,
      102: 0,
      103: 2,
      104: 0,
      105: 0,
      106: 0,
      107: 0,
    },
    rounds: [{
      players: { 
        // Testing Players, for now.
        101: {PID: 101, username: "Karl", alive: true},
        102: {PID: 102, username: "Joseph", alive: true},
        103: {PID: 103, username: "Adolf", alive: false},
        104: {PID: 104, username: "Franklin", alive: true},
        105: {PID: 105, username: "Paul", alive: true},
        106: {PID: 106, username: "Winston", alive: true},
        107: {PID: 107, username: "Chiang", alive: true},
      },
      events: [{
        name: "pre game",
        details:{
          LibBoard: 4,
          FasBoard: 3,
          marker: 2,
          presidentPID: 101,
          chancellorPID: 103,
          previousPresidentPID: null,
          previousChancellorPID: null,
          votes: null,
          nInDiscard: null,
          nInDraw: 5,
          nInDiscard: 12,
        }
      }],
     }],
     //UIInfo is for visual information that doesn't impact gameplay.
     uiInfo: {
       selectedPlayer: null,
       voteReceived: false,
       voted: {},
     }
   };
   this.clearUIInfo = this.clearUIInfo.bind(this);
   this.sendUIInfo = this.sendUIInfo.bind(this);
   this.recieveUIInfo = this.recieveUIInfo.bind(this);
   this.joinNewLobby = this.joinNewLobby.bind(this);
  }
  clearUIInfo(){
    let uiInfo = {
      selectedPlayer: null,
      voteReceived: false,
      voted: {},
    }
    this.setState({
      uiInfo: uiInfo,
    });
  }
  sendUIInfo(arg){
    //arg contains arg.name and other required arg info.
    //All shared UI events pass are sent to other players.
    //The info is broadcast to all other players, but updates instantly on the player's side.
    this.props.socket.emit('send ui info', arg);
    this.recieveUIInfo(arg);
  }
  recieveUIInfo(arg){
    const uiInfo = this.state.uiInfo;
    switch(arg.name){
      case 'player voted':
        uiInfo.voted[arg.PID] = true;
        break;
      case 'select player':
        uiInfo.selectedPlayer = arg.PID;
        break;
      default:
        break;
    }
    this.setState({
      uiInfo: uiInfo
    })
  }
  joinNewLobby(){
    this.props.socket.emit('join new lobby');
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
      this.clearUIInfo();
      this.setState({
        rounds: rounds.concat([newRound]),
      })
    })
    socket.on('new event', (arg)=>{
      const rounds = this.state.rounds;
      let events = rounds[rounds.length-1].events;
      events = events.concat([arg.event]);
      rounds[rounds.length-1].events = events;
      this.clearUIInfo();
      this.setState({
        rounds: rounds,
      })
    })
    socket.on(('end game'), (arg)=>{
      let endState = arg.endState;
      const rounds = this.state.rounds;
      this.setState({
        memberships: endState.memberships,
        rounds: rounds.concat([endState]),
      })
    }); 
    //Sent by the player with the bullet.
    socket.on('ui event', (arg)=>this.recieveUIInfo(arg))
  }
  
  getPlayerAction(event){
    //Based on event info, constructs the 'action' for the specific player.
    //The action guides what shows up in the action bar, as well as the game status message.
    let action = "";
    let eventName = event.name; 
    let youArePresident = this.props.yourPID == event.details.presidentPID;
    let youAreChancellor = this.props.yourPID == event.details.chancellorPID;

    switch(eventName){
      case 'chancellor pick':
        action = youArePresident ? 'your chancellor pick' : 'chancellor pick'
        break;
      case 'president discard':
        action = youArePresident ? 'your president discard' : 'president discard'
        break;
      case 'chancellor discard':
        action = youAreChancellor ? 'your chancellor discard' : 'chancellor discard'
        break;
      case 'veto requested':
        action = youArePresident ? 'your veto requested' : 'veto requested'
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
    /*Game events are sent by the server with the changes that have occurred.
    This function compiles all changes from the a round. 
    The current round is the default. 
    Optionally, a specific round or event can be referenced.*/
    let roundEvents, event, details = {};
    if(roundIndex == null){
      roundIndex = this.state.rounds.length-1;
    }
    roundEvents = this.state.rounds[roundIndex].events;
    if(eventIndex == null){
      eventIndex = roundEvents.length - 1;
    }
    //the first event is always new round.
    details = {};
    for(let i = 0; i <= eventIndex; i++){
      event = roundEvents[i].details;
      //Remember: 'in' references the property, 'of' references the value.
      for(const change in event){
        details[change] = event[change]
      }
    }
    let fullEvent = {
      name: roundEvents[eventIndex].name,
      details: details
    }
    fullEvent['action'] = this.getPlayerAction(fullEvent);
    return fullEvent;
  }
  render(){
    let rounds = this.state.rounds;
    let round = rounds[rounds.length-1];
    let players = round.players;
    let order = this.state.order;
    let fullEvent = this.getFullEvent();
    let memberships = this.state.memberships;
    let action = this.getPlayerAction(fullEvent);
    let yourPID = this.props.yourPID;

    let aliveAndPlaying = players[yourPID] && players[yourPID].alive; 

    return (
    <div className="game-window">
      <StatusBar      
        lobbyID={this.props.lobbyID} 
        yourPID={yourPID}
        fullEvent={fullEvent}
        players={players}
        memberships={memberships}
      />
      <PlayerCard PID={yourPID} memberships={memberships}/>
      <PlayerSidebar  
        order={order}
        yourPID={yourPID}
        fullEvent={fullEvent}
        players={players}
        memberships={memberships}
        uiInfo={this.state.uiInfo}
        sendUIInfo={this.sendUIInfo}
      />
      <div className="boards">
        <LibBoard
          draw={fullEvent.details.nInDraw}
          discard={fullEvent.details.nInDiscard}
          marker={fullEvent.details.marker}
          nCards={fullEvent.details.libBoard}
          />
        <FasBoard
          nCards={fullEvent.details.fasBoard}
          nPlayers={order.length}
          />
      </div>
      { aliveAndPlaying &&
        <ActionBar    
          socket={this.props.socket}
          fullEvent={fullEvent}
          players={players}
          yourPID={yourPID}
          leaveLobby={this.props.leaveLobby}
          uiInfo={this.state.uiInfo}
        />
      }
      {fullEvent.name == "end game" &&(
        <EndWindow
          winner={fullEvent.action.includes("liberal") ? 0 : 1}
          leaveLobby={this.props.leaveLobby}
          joinNewLobby={()=>this.joinNewLobby()}
        />
      )}
      </div>
    )
  }
}
// export default hot(Hitler) //HOT HITLER?!?!