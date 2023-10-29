import React from "react";
import Header from "./parts/Header.js";
import SingleInputForm from "./parts/SingleInputForm";
import Loading from "./parts/Loading";

import FireBackground from "./rendering/FireBackground.js";
import { useGameContext, getLocalStorage, LOBBY_MAPPING_KEY } from "./AppContext.js";

const MainMenu = () => {
  const { socket, connected, setLobbyID } = useGameContext();

  const lobbyID = React.useMemo(() => {
    return Object.keys(getLocalStorage(LOBBY_MAPPING_KEY))?.[0]
  }, []);

  const rejoinButton = React.useCallback(() => {
    setLobbyID(lobbyID)
  }, [setLobbyID])

  const createLobby = () => socket.emit("create lobby");
  return (
    <div className="menu-window ">
      <FireBackground toggle={connected} />
      <div className="content">
        <Header lobbyID={null} />
        {connected &&
          <>
            <div className="new-lobby-div">
              <button className="new-lobby fade-in" onClick={createLobby}>
                <h4>Create Game</h4>
              </button>
              {lobbyID &&
                <button className="rejoin-lobby fade-in" onClick={rejoinButton}>
                  <h4>Rejoin {lobbyID} </h4>
                </button>
              }
            </div>
            <LobbyInput className="fade-in" />
          </>}
        {!connected &&
          <Loading />}
        <div className="background" />
      </div>
    </div>
  );
}

const LobbyInput = ({ className }) => {
  const { setLobbyID } = useGameContext();
  const joinLobby = (lobbyName) => {
    if (lobbyName != "") {
      setLobbyID(lobbyName);
    }
  }
  return (
    <div className={className + " existing-lobby"}>
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

export default MainMenu;