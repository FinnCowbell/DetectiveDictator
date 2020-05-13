import {LibBoard, FasBoard, StatusBar, ActionBar, PlayerSidebar} from './modules/hitlerParts.js';
class Hitler extends React.Component{
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
export {Hitler};
