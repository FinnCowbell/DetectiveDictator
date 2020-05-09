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
      "Connecting to ",
      props.lobbyID,
      "..."
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

export { Header, LoadingMessage, StatusBar };