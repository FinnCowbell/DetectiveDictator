export function Header(props) {
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
    lobbyID && React.createElement(
      "div",
      { className: "lobby-title" },
      React.createElement(
        "h3",
        null,
        "Lobby: ",
        this.props.lobbyID
      )
    )
  );
}

export function LoadingMessage(props) {
  return React.createElement(
    "div",
    { className: "loading-message" },
    React.createElement(
      "h3",
      { className: "loading-status" },
      "Connecting to ",
      props.lobbyID,
      "..."
    )
  );
}

export function StatusBar(props) {
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