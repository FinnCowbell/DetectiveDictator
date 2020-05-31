import React from 'react';
import io from 'socket.io-client'

import {LibBoard,FasBoard} from './gameParts/Boards.js'
import ActionBar from './gameParts/ActionBar.js'
import StatusBar from './gameParts/StatusBar.js'
import PlayerSidebar from './gameParts/PlayerSidebar.js'
import PlayerCard from './gameParts/PlayerCard.js'
import EndWindow from './gameParts/EndWindow.js'


export default class Hitler extends React.Component{
  constructor(props){
   super(props);
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
     //UIInfo is for visual information that doesn't impact gameplay.
     uiInfo: {}
   };
   this.clearUIInfo = this.clearUIInfo.bind(this);
   this.sendUIInfo = this.sendUIInfo.bind(this);
   this.recieveUIInfo = this.recieveUIInfo.bind(this);
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
    let event = this.getFullEvent();
    let memberships = this.state.memberships;
    //TODO: Change gameStyle retrieval.
    let gameStyle = Math.floor((order.length - 5)/ 2);
    let action = this.getPlayerAction(event);
    let yourPID = this.props.yourPID;

    let alive = false; //Assume dead until proven otherwise
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
                      sendUIInfo={this.sendUIInfo}
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
                      socket={this.props.socket}
                      yourPID={yourPID}
                      event={event}
                      uiInfo={this.state.uiInfo}
                      leaveLobby={this.props.leaveLobby}
                      players={players}
        />
      }
      {event.name == "end game" &&(
        <EndWindow
          winner={action.includes("liberal") ? 0 : 1}
          leaveLobby={this.props.leaveLobby}
          returnToLobby={()=>this.leaveLobby()}
        />
      )}
      </div>
    )
  }
}

// export default hot(Hitler) //HOT HITLER?!?!