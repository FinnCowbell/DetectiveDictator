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
   this.yourPID = this.props.yourPID;
   this.state = {
    order: [1,2,3,4,5,6],
    players: { 
      // Testing Players, for now.
      1: {PID: 1, username: "Finn", alive: true, membership: 1},
      2: {PID: 2, username: "Chris", alive: true, membership: 1},
      3: {PID: 3, username: "Max", alive: true, membership: 1},
      4: {PID: 4, username: "Liam", alive: true, membership: 0},
      5: {PID: 5, username: "Phil", alive: true, membership: 0},
      6: {PID: 6, username: "Marco", alive: true, membership: 2},
    },
    rounds: [[{
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
     }]],
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
    socket.on('new round',(arg)=>{
      let rounds = this.state.rounds;
      let newRound = arg.round;
      console.log("NEW ROUND!");
      console.log(newRound);
      this.setState({
        rounds: rounds.concat([newRound]),
      })
    })
    socket.on('new event', (arg)=>{
      console.log("NEW EVENT!");
      console.log(arg.event);
      let rounds = this.state.rounds;
      rounds[rounds.length - 1] = rounds[rounds.length - 1].concat([arg.event]);
      this.setState({
        rounds: rounds,
      })
    })

  }
  changeSelectedPlayer(PID){
    this.setState({
      selectedPlayer: PID
    });
  }
  getFullEvent(roundIndex = null, eventIndex = null){
    /*Events are sent with the changes that have occurred.
    This function compiles all changes during a round. 
    Optionally, a specific round or event can be referenced.*/
    if(roundIndex == null){
      roundIndex = this.state.rounds.length-1;
    }
    let round = this.state.rounds[roundIndex];
    if(eventIndex == null){
      eventIndex = round.length - 1;
    }
    console.log("looking at " + roundIndex + "," + eventIndex);
    console.log(this.state.rounds);
    let name = round[eventIndex].name;
    let details = {};
    for(let i = 0; i <= eventIndex; i++){
      let event = round[i].details;
      for(const change in event){
        details[change] = event[change]
      }
    }
    return {
      name: name,
      details: details
    };
  }
  render(){
    let rounds = this.state.rounds;
    let players = this.state.players;
    let yourPID = this.yourPID;
    let you = this.state.players[yourPID];
    let round = rounds[rounds.length-1];
    let event = this.getFullEvent();
    return (
      <div className="game-window">
      <StatusBar lobbyID={this.props.lobbyID} players={players} event={event}/>
      <PlayerCard PID={yourPID} membership={you ? you.membership : -1}/>
      <PlayerSidebar  order={this.state.order}
                      players={players} 
                      eventDetails={event.details}
                      selectedPlayer={this.state.selectedPlayer}
                      playersAreSelectable={this.state.playersAreSelectable}
                      changeSelectedPlayer={this.changeSelectedPlayer}
                     />
      </div>
    )
  }
}

// export default hot(Hitler) //HOT HITLER?!?!