import React from 'react';
import io from 'socket.io-client'

import {LibBoard,FasBoard} from './gameParts/Boards.js'
import ActionBar from './gameParts/ActionBar.js'
import StatusBar from './gameParts/StatusBar.js'
import PlayerSidebar from './gameParts/PlayerSidebar.js'

export default class Hitler extends React.Component{
  constructor(props){
   super(props);
   this.socket = this.props.socket;
   this.you = this.props.you;
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
       name: "game start",
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
    socket.on('game starting', (arg)=>{
      socket.emit('get player info')
    })
    socket.on('player info', (arg)=>{
      this.setState({
        order: arg.order,
        players: arg.players
      })
    })
    socket.on('new round',(arg)=>{
      let rounds = this.state.rounds;
      this.setState({
        rounds: rounds.concat([[]]),
      })
    })
    socket.on('new event', (arg)=>{
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
  getDetailsAtEvent(roundIndex = null, eventIndex = null){
    //Individual changes are sent along with events each round.
    //If we have a bunch of events, we need to get the most modern details.
    if(roundIndex == null){
      roundIndex = this.state.rounds.length-1;
    }
    let round = this.state.rounds[roundIndex];
    if(eventIndex == null){
      eventIndex = round.length - 1;
    }
    let details = {}
    for(let i = 0; i <= eventIndex; i++){
      let event = round[i];
      for(const change in event){
        details[change] = event[change]
      }
    }
    return details;
  }
  render(){
    let rounds = this.state.rounds
    let round = rounds[rounds.length-1];
    let eventName = round[round.length - 1];
    let eventDetails = this.getDetailsAtEvent();
    return (
      <div className="game-window">

      <PlayerSidebar  order={this.state.order}
                      players={this.state.players} 
                      eventDetails={eventDetails}
                      selectedPlayer={this.state.selectedPlayer}
                      playersAreSelectable={this.state.playersAreSelectable}
                      changeSelectedPlayer={this.changeSelectedPlayer}
                     />
      </div>
    )
  }
}

// export default hot(Hitler) //HOT HITLER?!?!