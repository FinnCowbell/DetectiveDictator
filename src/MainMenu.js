import React from "react";
import Header from "./parts/Header.js";
import SingleInputForm from "./parts/SingleInputForm";
import io from "socket.io-client";

export default class MainMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      socket: io(this.props.socketURL + "/menu", {
        reconnection: true,
        reconnectionDelay: 500,
        reconnectionDelayMax: 2000,
        reconnectionAttempts: Infinity,
        forceNew: true,
      }),
    };
    this.joinLobby = this.joinLobby.bind(this);
    this.createLobby = this.createLobby.bind(this);
  }
  componentDidMount() {
    const socket = this.state.socket;
    socket.on("lobby created", (arg) => {
      this.joinLobby(arg.ID);
    });
  }
  componentWillUnmount() {
    this.state.socket.close();
    this.setState({ socket: null });
  }
  createLobby() {
    const socket = this.state.socket;
    socket.emit("create lobby");
  }
  joinLobby(lobbyID) {
    this.props.setLobbyID(lobbyID);
  }
  render() {
    return (
      <div className="menu-window">
        <div className="content">
          <Header lobbyID={null} />
          <button className="new-lobby" onClick={this.createLobby}>
            <h4>Create Game</h4>
          </button>
          <LobbyInput joinLobby={this.joinLobby} />
          <div className="background" />
        </div>
        <div className="wave-background" />
      </div>
    );
  }
}

function LobbyInput(props) {
  function joinLobby(lobbyName) {
    if (lobbyName != "") {
      props.joinLobby(lobbyName);
    }
  }
  return (
    <div className="existing-lobby">
      <h4>Join an Existing Lobby</h4>
      <div>
        <SingleInputForm
          className="lobby-input"
          button="Join"
          submit={(name) => joinLobby(name)}
        />
      </div>
    </div>
  );
}
