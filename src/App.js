import { hot } from "react-hot-loader/root";
import React from "react";
import io from "socket.io-client";

import Alert from "./parts/Alert.js";
import Lobby from "./Lobby.js";
import MainMenu from "./MainMenu.js";

/*The main purpose of the App react component is socket room  management.*/
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      urlVars: {},
      lobbyID: this.props.lobbyID || null,
      alertMessage: "",
      alertMessageState: 0,
    };
    this.setLobbyID = this.setLobbyID.bind(this);
    this.setAlert = this.setAlert.bind(this);
  }
  componentDidMount() {
    this.updateURLVars();
    window.onpopstate = () => this.updateURLVars();
  }

  updateURLVars() {
    let urlVars = {};
    //Stack Overflow Function :^)
    var parts = window.location.href.replace(
      /[#&]+([^=&]+)=([^&]*)/gi,
      function (m, key, value) {
        urlVars[key] = value;
      }
    );
    if (urlVars.lobby != this.state.lobbyID) {
      // Don't change the URL, because that's what we just read from!
      this.setLobbyID(urlVars.lobby, false);
    }
  }

  setLobbyID(lobbyID = null, changeURL = true) {
    /*changeURL is specified to avoid infinite looping with updateURLVars. */
    this.setState({
      lobbyID: lobbyID,
    });
    if (changeURL) {
      if (lobbyID) {
        window.location.href = "#lobby=" + lobbyID;
      } else {
        window.location.href = "#";
      }
    }
  }

  setAlert(message) {
    if (typeof message == "string" && message != null) {
      this.setState((prevState) => ({
        alertMessageState: prevState.alertMessageState + 1,
        alertMessage: message,
      }));
    }
  }

  render() {
    // let content = this.state.lobbyID ? (
    //   <Lobby
    //     socketURL={this.props.socketURL}
    //     lobbyID={this.state.lobbyID}
    //     setAlert={this.setAlert}
    //     setLobbyID={this.setLobbyID}
    //   />
    // ) : (
    //   <MainMenu socketURL={this.props.socketURL} setLobbyID={this.setLobbyID} />
    // );
    return (
      <div class="window">
        <Alert toggledState={this.state.alertMessageState}>
          {this.state.alertMessage}
        </Alert>
        {!this.state.lobbyID &&
        <MainMenu socketURL={this.props.socketURL} setLobbyID={this.setLobbyID} />
        }
        <Lobby
        socketURL={this.props.socketURL}
        lobbyID={this.state.lobbyID}
        setAlert={this.setAlert}
        setLobbyID={this.setLobbyID}
      />
      </div>
    );
  }
}

export default hot(App);
