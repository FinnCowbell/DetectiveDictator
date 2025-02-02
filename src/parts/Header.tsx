import React from "react";
import getTitle from "./getTitle";
import { useSocketContext } from "../SocketContext";

const Header: React.FC = () => {
  const { lobbyID } = useSocketContext();
  const [shareSupported, setShareSupported] = React.useState(false);
  const url = React.useRef<HTMLInputElement>(null);
  const tooltip = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setShareSupported(!!navigator.share);
  }, []);

  const getLobbyURL = () => {
    return `${window.location.origin}${window.location.pathname}#lobby=${lobbyID}`;
  };

  const shareURL = () => {
    void navigator.share({
      title: `Secret Hitler Lobby ${lobbyID}`,
      url: getLobbyURL()
    }).catch(() => { });
  }

  const copyLobbyURL = () => {
    url.current!.select();
    url.current!.setSelectionRange(0, 9999);
    navigator.clipboard.writeText(url.current!.value);
    tooltip.current!.innerHTML = "Copied!";
  }

  const onShareClick = React.useCallback(() => {
    if (shareSupported) {
      void shareURL();
    } else {
      void copyLobbyURL();
    }
  }, [shareSupported]);


  const tooltipString = shareSupported ? "Invite" : "Copy URL";

  return (
    <div className="site-header">
      <div className="site-title">
        <h1>{getTitle()}</h1>
      </div>
      {lobbyID && (
        <div
          className="lobby-title"
          onMouseLeave={() => tooltip.current!.innerHTML = tooltipString}
        >
          <input
            ref={url}
            className="hidden-url"
            readOnly={true}
            value={getLobbyURL()}
          />
          <h3 className="lobby-id">
            Lobby: {lobbyID}
            <span className="tooltip" onClick={onShareClick} ref={tooltip}>{tooltipString}</span>
          </h3>
        </div>
      )}
    </div>
  );
}

export default Header;