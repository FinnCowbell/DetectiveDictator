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
    order: [1,2,3,4,5,6],
    rounds: [{
      players: { 
        // Testing Players, for now.
        1: {PID: 1, username: "Finn", alive: true},
        2: {PID: 2, username: "Chris", alive: true},
        3: {PID: 3, username: "Max", alive: true},
        4: {PID: 4, username: "Liam", alive: true},
        5: {PID: 5, username: "Phil", alive: true},
        6: {PID: 6, username: "Marco", alive: true}
      },
      memberships: {
        1: 1,
        2: 0,
        3: 2,
        4: 0,
        5: 0,
        6: 0,
      },
      events: [{
        name: "pre game",
        details:{
          LibBoard: 0,
          FasBoard: 0,
          marker: 0,
          presidentPID: 1,
          chancellorPID: 3,
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
     playersAreSelectable: false,
     selectedPlayer: null,
   };
   this.changeSelectedPlayer = this.changeSelectedPlayer.bind(this);
  }
  componentDidMount(){
    let socket = this.props.socket;
    socket.on('player info', (arg)=>{
      this.setState({
        order: arg.order,
        players: arg.players
      })
    })
    socket.on('reconnect game', (arg)=>{
      console.log('reconnected!');
      this.setState({
        order: arg.order,
        rounds: arg.rounds,
      })
    })
    socket.on('new round',(arg)=>{
      let rounds = this.state.rounds;
      let newRound = arg.newRound;
      let knownMemberships = arg.memberships;
      //Put our known memberships in the round.
      newRound.memberships = knownMemberships;

      this.setState({
        rounds: rounds.concat([newRound]),
      })
    })
    socket.on('new event', (arg)=>{
      console.log("________");
      console.log("NEW EVENT!");
      console.log(arg.event);
      console.log("________");
      const rounds = this.state.rounds;
      let events = rounds[rounds.length-1].events;
      events = events.concat([arg.event]);
      rounds[rounds.length-1].events = events;
      this.setState({
        rounds: rounds,
        selectedPlayer: null,
      })
    })

  }
  changeSelectedPlayer(PID){
    this.setState({
      selectedPlayer: PID
    });
  }
  getPlayerAction(event){
    //Based on event info, constructs an 'action' for the player.
    let action = "";
    let eventName = event.name; 
    let yourPID = this.props.yourPID;
    let presidentPID = event.details.presidentPID;
    switch(eventName){
      //"your chancellor pick VS chancellor pick"
      case 'chancellor pick':
        if(yourPID == presidentPID){
          action = 'your chancellor pick'
        } else{
          action = 'chancellor pick'
        }
        break;
      //'chancellor vote' vs 'wait chancellor vote'
      //your president discard vs president discard
      case 'president discard':
        if(yourPID == presidentPID){
          action = 'your president discard'
        } else{
          action = 'president discard'
        }
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
    let memberships = round.memberships;
    let event = this.getFullEvent();
    let action = this.getPlayerAction(event);
    let yourPID = this.props.yourPID;
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
      <PlayerSidebar  order={this.state.order}
                      yourPID={yourPID}
                      event={event}
                      players={players}
                      memberships={memberships}
                      selectedPlayer={this.state.selectedPlayer}
                      playersAreSelectable={this.state.playersAreSelectable}
                      changeSelectedPlayer={this.changeSelectedPlayer}
      />
      <ActionBar      action={action}
                      socket={this.socket}
                      selectedPlayer={this.state.selectedPlayer} 
                      players={players}
        
      />
      </div>
    )
  }
}

// export default hot(Hitler) //HOT HITLER?!?!