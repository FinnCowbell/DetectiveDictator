import React from "react";
import Header from "./parts/Header";
import SingleInputForm from "./parts/SingleInputForm";
import Loading from "./parts/Loading";

import FireBackground from "./rendering/FireBackground";
import { useSocketContext, getLocalStorage, LOBBY_MAPPING_KEY } from "./SocketContext";

const MainMenu = () => {
  const { socket, connected, setLobbyID } = useSocketContext();

  const recentLobbyID: string | undefined = React.useMemo(() => {
    const storedLobbies = Object.keys(getLocalStorage(LOBBY_MAPPING_KEY) || {})
    if (storedLobbies.length > 0) {
      return storedLobbies[0];
    }
  }, []);

  const createLobby = () => socket?.emit("create lobby");

  return (
    <div className="menu-window ">
      <FireBackground toggle={connected} />
      <div className="content">
        <Header />
        {connected &&
          <>
            <div className="new-lobby-div">
              <button className="new-lobby fade-in" onClick={createLobby}>
                <h4>Create Game</h4>
              </button>
              {recentLobbyID &&
                <button className="rejoin-lobby fade-in" onClick={() => setLobbyID(recentLobbyID)}>
                  <h4>Rejoin {recentLobbyID} </h4>
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

const LobbyInput: React.FC<{ className: string }> = ({ className }) => {
  const { setLobbyID } = useSocketContext();
  const joinLobby = (lobbyName: string) => {
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