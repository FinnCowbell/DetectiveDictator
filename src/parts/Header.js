import React from "react";
export default class Header extends React.Component {
  constructor(props) {
    super(props);
    this.url = React.createRef();
    this.tooltip = React.createRef();
  }
  getLobbyURL() {
    return `${window.location.origin}${window.location.pathname}#lobby=${this.props.lobbyID}`;
  }
  copyLobbyURL() {
    let text = this.url.current;
    let tooltip = this.tooltip.current;
    text.select();
    text.setSelectionRange(0, 9999);
    document.execCommand("copy");
    tooltip.innerHTML = "Copied!";
  }
  resetTooltip() {
    this.tooltip.current.innerHTML = "Copy URL";
  }
  render() {
    return (
      <div className="site-header">
        <div className="site-title">
          <h1>Detective Dictator!</h1>
        </div>
        {this.props.lobbyID && (
          <div
            className="lobby-title"
            onClick={(e) => {
              this.copyLobbyURL(e);
            }}
            onMouseOut={() => {
              this.resetTooltip();
            }}
          >
            <input
              ref={this.url}
              className="hidden-url"
              readOnly={true}
              value={this.getLobbyURL()}
            />
            <h3>
              Lobby: {this.props.lobbyID}
              <span ref={this.tooltip}>Copy URL</span>
            </h3>
          </div>
        )}
      </div>
    );
  }
}
