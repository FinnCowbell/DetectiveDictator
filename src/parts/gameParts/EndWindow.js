import React from "react";

export default class EndWindow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: true,
    };
    this.closeWindow = this.closeWindow.bind(this);
  }
  closeWindow() {
    this.setState({
      open: false,
    });
  }
  render() {
    const endPhrases = {
      "liberal win cards": "The Liberals Have Secured Germany.",
      "fascist win cards": "The Fascists Have Secured Germany.",
      "liberal win hitler": "Hitler Has Been Killed.",
      "fascist win hitler": "Hitler has been Elected.",
    };
    let fascistsWon = this.props.reason.includes("fascist") ? 1 : 0;
    return (
      <div
        className={`animation-overlay ${fascistsWon ? "fascist" : "liberal"} ${
          this.state.open ? "" : "hidden"
        }`}
      >
        <div className={`slidein-background`}></div>
        <div className="content">
          {/* <button className="close-window" onClick={this.closeWindow}>
            X
          </button> */}
          <h1>{endPhrases[this.props.reason]}</h1>
          <div className="buttons">
            <button onClick={this.props.joinNewLobby}>New Game</button>
            <button onClick={this.props.leaveLobby}>Quit</button>
          </div>
        </div>
      </div>
    );
  }
}
