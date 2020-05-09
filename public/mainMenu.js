import { Header, StatusBar, LoadingMessage } from './modules/parts.js';
class App extends React.Component {
  constructor(props) {
    super(props);
    this.socket = this.props.io('/menu');
    this.joinLobby = this.joinLobby.bind(this);
    this.createLobby = this.createLobby.bind(this);
  }
  componentDidMount() {
    const socket = this.socket;
    socket.on("lobby created", arg => {
      this.joinLobby(arg.ID);
    });
  }
  createLobby() {
    const socket = this.socket;
    socket.emit("create lobby");
  }
  joinLobby(lobbyID) {
    window.location.href = `lobby/${lobbyID}`;
  }
  render() {
    return React.createElement(
      'div',
      null,
      React.createElement(Header, { lobbyID: null }),
      React.createElement(MainMenu, { io: this.props.io, createLobby: this.createLobby })
    );
  }
}

function MainMenu(props) {
  //When the menu is created, create its signals.
  return React.createElement(
    'div',
    { className: 'main-menu' },
    React.createElement(
      'button',
      { className: 'new-lobby', onClick: props.createLobby },
      'Create Game'
    )
  );
}

ReactDOM.render(React.createElement(App, { io: io }), document.getElementById('root'));