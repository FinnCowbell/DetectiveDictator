import React from "react";
import Header from "./parts/Header.js";
import SingleInputForm from "./parts/SingleInputForm";
import Loading from "./parts/Loading";
import io from "socket.io-client";
import FireBackground from "./rendering/FireBackground.js";

export default class MainMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      connected: false,
      delayed_connected: null,
      socket: io(this.props.socketURL + "/menu", {
        reconnection: true,
        reconnectionDelay: 500,
        reconnectionDelayMax: 2000,
        reconnectionAttempts: Infinity,
        forceNew: true,
      }),
    };
    setTimeout(()=>{this.setState({delayed_connected:false})},250);
    this.joinLobby = this.joinLobby.bind(this);
    this.createLobby = this.createLobby.bind(this);
  }
  componentDidMount() {
    const socket = this.state.socket;
    socket.on("connect", () =>{
      this.setState({connected:true});
      setTimeout(()=>{this.setState({delayed_connected:true})},1000);
    });
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
      <div className="menu-window ">
      {!this.state.delayed_connected && <FireBackground toggle={this.state.connected}/>}
        <div className="content">
          <Header lobbyID={null} />
          {this.state.connected &&
          <>
          <button className="new-lobby fade-in" onClick={this.createLobby}>
            <h4>Create Game</h4>
          </button>
          <LobbyInput className="fade-in" joinLobby={this.joinLobby} />
          </>}
          {this.state.delayed_connected === false && !this.state.connected && 
          <Loading/>}
          <div className="background" />
        </div>
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
    <div className={props.className + " existing-lobby"}>
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
