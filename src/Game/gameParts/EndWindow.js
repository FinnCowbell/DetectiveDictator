import React from 'react'

export default class EndWindow extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      open: true,
    }
    this.closeWindow = this.closeWindow.bind(this);
    this.returnToLobby = this.returnToLobby.bind(this);
  }
  closeWindow(){
    this.setState({
      open: false,
    })
  }
  returnToLobby(){
    this.closeWindow();
    this.props.returnToLobby();
  }
  render(){
    let fascistsWon = this.props.winner;
    return(
      <div className={`animation-overlay ${fascistsWon ? "fascist" : "liberal"} ${this.state.open ? "" : "hidden"}`}>
        <div className={`slidein-background`}></div>
        <div className="content">
          <button className="close-window" onClick={this.closeWindow}>X</button>
          <h1>{"The " + (fascistsWon ? "Fascists" : "Liberals") + " Have Won."}</h1>
          <div className="buttons">
            <button onClick={this.props.joinNewLobby}>New Game</button>
            <button onClick={this.props.leaveLobby}>Quit</button>
          </div>
        </div>
      </div>
    )
  }
}