import React from "react";

import liberal1 from "../../media/player-cards/liberal1.png";
import liberal2 from "../../media/player-cards/liberal2.png";
import liberal3 from "../../media/player-cards/liberal3.png";
import liberal4 from "../../media/player-cards/liberal4.png";
import liberal5 from "../../media/player-cards/liberal5.png";
import liberal6 from "../../media/player-cards/liberal6.png";
let liberalCards = [liberal1, liberal2, liberal3, liberal4, liberal5, liberal6];
const N_LIBERAL_CARDS = liberalCards.length;
import fascist1 from "../../media/player-cards/red1.png";
import fascist2 from "../../media/player-cards/red2.png";
import fascist3 from "../../media/player-cards/red3.png";
import fascist4 from "../../media/player-cards/red4.png";
import hitler from "../../media/player-cards/trump.png";
let fascistCards = [fascist1, fascist2, fascist3, fascist4];
const N_FASCIST_CARDS = fascistCards.length;


export default function PlayerCard(props) {
  let you = props.you;
  let cardIMG = "";
  if (you && you.membership == 0) {
    cardIMG = liberalCards[you.PID % N_LIBERAL_CARDS];
  } else if (you && you.membership == 1) {
    cardIMG = fascistCards[you.PID % N_FASCIST_CARDS];
  } else if (you && you.membership == 2) {
    cardIMG = hitler;
  }
  return (
    <figure className="player-card">
      <img src={cardIMG} />
    </figure>
  );
}
