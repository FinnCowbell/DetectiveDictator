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
     rounds: null,
     players: null,
     //These might all just be in Rounds.
     LibBoard: null,
     FasBoard: null,
     marker: null,
     presidentPID: null,
     chancellorPID: null,
     nInDiscard: null,
     nInDraw: null,
   };
  }
  componentDidMount(){
    let socket = this.props.socket;
    socket.on('game start', ()=>{
    })

  }
  render(){
    return (
      <div className="game-window">
      </div>
    )
  }
}

// export default hot(Hitler) //HOT HITLER?!?!