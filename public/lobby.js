import { Header, StatusBar, LoadingMessage } from './modules/parts.js';

class Lobby extends React.Component {
  constructor(props) {
    super(props);
    this.socket = this.props.io(`/${this.props.lobbyID}`);
    this.state = {
      PID: document.cookie,
      connected: false,
      players: null,
      name: null,
      gameInfo: null
    };
    this.leaveLobby = this.leaveLobby.bind(this);
  }
  componentDidMount() {
    const socket = this.socket;
    socket.on('lobby found', lobbyInfo => {
      this.setState({
        players: lobbyInfo.players,
        gameInfo: lobbyInfo.gameInfo,
        connected: true
      });
    });
    this.setState({
      socket: socket
    });
  }
  leaveLobby(reason) {
    window.location.replace("/");
  }
  connect(username) {
    const socket = this.socket;
    socket.emit("join lobby", {
      username: username,
      PID: this.state.PID
    });
  }
  render() {
    const lobbyID = this.props.lobbyID;
    const gameInfo = this.state.gameInfo;
    let connectionField;
    if (!lobbyID) {
      this.leaveLobby();
    }
    if (!this.state.connected) {
      return React.createElement(
        'div',
        { className: 'loading-alert' },
        React.createElement(LoadingMessage, { lobbyID: lobbyID }),
        React.createElement(
          'button',
          { onClick: this.leaveLobby },
          'Return to Menu'
        )
      );
    } else {
      if (gameInfo && !gameInfo.running) {
        connectionField = React.createElement(NewPlayerForm, { connect: username => this.connect(username) });
      } else if (gameInfo && gameInfo.running) {
        connectionField = React.createElement(ReconnectPlayerForm, null);
      }
    }
    return React.createElement(
      'div',
      null,
      React.createElement(Header, { lobbyID: lobbyID }),
      connectionField
    );
  }
}

class NewPlayerForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: ""
    };
  }
  handleChange(e) {
    this.setState({ username: event.target.value });
  }

  handleSubmit(e) {
    let username = this.state.username;
    if (username != "") {
      this.props.connect(username);
    }
  }
  render() {
    return React.createElement(
      'div',
      { 'class': 'new-player-form' },
      React.createElement(
        'form',
        null,
        React.createElement(
          'label',
          { 'for': 'username' },
          'Enter your Name:'
        ),
        React.createElement('input', { id: 'username', type: 'text', onChange: () => {
            this.handleChange();
          } })
      ),
      React.createElement(
        'button',
        { onClick: () => {
            this.handleSubmit();
          } },
        'Join'
      )
    );
  }
}

// pathname is /lobby/words/, so words are in index 2.
// If we're in root or 
const lobbyID = window.location.pathname.split("/")[2];
ReactDOM.render(React.createElement(Lobby, { io: io, lobbyID: lobbyID }), document.getElementById('root'));