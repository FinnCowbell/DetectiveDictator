import React from "react";
import getTitle from "./getTitle";
import { useSocketContext } from "../SocketContext";

const Header: React.FC = () => {
  const { lobbyID } = useSocketContext();
  const shareSupported = navigator.share !== undefined;
  const url = React.useRef<HTMLInputElement>(null);
  const tooltip = React.useRef<HTMLDivElement>(null);

  const getLobbyURL = () => {
    return `${window.location.origin}${window.location.pathname}#lobby=${lobbyID}`;
  };

  const shareURL = () => {
    navigator.share({
      title: `Secret Hitler Lobby ${lobbyID}`,
      url: getLobbyURL()
    }).then(() => {
      tooltip.current!.innerHTML = "Shared!";
    }).catch(() => {
      tooltip.current!.innerHTML = "Copied!";
    });
  }

  const copyLobbyURL = () => {
    url.current!.select();
    url.current!.setSelectionRange(0, 9999);
    document.execCommand("copy");
    tooltip.current!.innerHTML = "Copied!";
  }
  const resetTooltip = () => {
    tooltip.current!.innerHTML = shareSupported ? "Share URL" : "Copy URL";
  }
  return (
    <div className="site-header">
      <div className="site-title">
        <h1>{getTitle()}</h1>
      </div>
      {lobbyID && (
        <div
          className="lobby-title"
          onClick={(e) => {
            shareSupported ?
              shareURL() :
              copyLobbyURL();
          }}
          onMouseOut={() => {
            resetTooltip();
          }}>
          <input
            ref={url}
            className="hidden-url"
            readOnly={true}
            value={getLobbyURL()}
          />
          <h3>
            Lobby: {lobbyID}
            <span ref={tooltip}>Copy URL</span>
          </h3>
        </div>
      )}
    </div>
  );
}

export default Header;