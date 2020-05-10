function Header(props) {
  return React.createElement(
    "div",
    { className: "site-header" },
    React.createElement(
      "div",
      { className: "site-title" },
      React.createElement(
        "h1",
        null,
        "Detective Dictator!"
      )
    ),
    props.lobbyID && React.createElement(
      "div",
      { className: "lobby-title" },
      React.createElement(
        "h3",
        null,
        "Lobby: ",
        props.lobbyID
      )
    )
  );
}

function LoadingMessage(props) {
  return React.createElement(
    "div",
    { className: "loading-message" },
    React.createElement(
      "h3",
      { className: "loading-status" },
      "Connecting..."
    ),
    React.createElement(
      "button",
      { onClick: props.leaveLobby },
      "Return to Menu"
    )
  );
}

function StatusBar(props) {
  return React.createElement(
    "div",
    { className: "status-bar" },
    React.createElement(
      "h2",
      null,
      props.status
    )
  );
}

function PlayerList(props) {
  let yourPID = props.PID;
  let you = props.you;
  let listItems = null;
  if (props.players) {
    listItems = props.players.map(player => React.createElement(
      "li",
      { key: player.username,
        className: (player.isLeader ? "leader " : "") + (!player.connected ? "disconnected " : "") + (player.PID == yourPID ? "you " : "") },
      player.username,
      you && you.isLeader && player.PID != yourPID && React.createElement(
        "button",
        { className: "kick-button", onClick: () => props.kickPlayer(player.PID) },
        "Kick"
      )
    ));
  }
  return React.createElement(
    "div",
    { className: "player-list" },
    React.createElement(
      "h3",
      null,
      "Connected Players:"
    ),
    React.createElement(
      "ul",
      null,
      listItems
    )
  );
}

export { Header, LoadingMessage, StatusBar, PlayerList };