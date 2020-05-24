import React from 'react'

import liberal1 from '../media/player-cards/liberal1.png'
import liberal2 from '../media/player-cards/liberal2.png'
import liberal3 from '../media/player-cards/liberal3.png'
import liberal4 from '../media/player-cards/liberal4.png'
import liberal5 from '../media/player-cards/liberal5.png'
import liberal6 from '../media/player-cards/liberal6.png'
let liberalCards = [liberal1, liberal2, liberal3, liberal4, liberal5, liberal6];
const N_LIBERAL_CARDS = liberalCards.length;

import fascist1 from '../media/player-cards/fascist1.png'
import fascist2 from '../media/player-cards/fascist2.png'
let fascistCards = [fascist1, fascist2];
const N_FASCIST_CARDS = liberalCards.length;

import hitler from '../media/player-cards/hitler.png'

export default function PlayerCard(props){
  //membership and PID
  let cardIMG = "";
  let membership = props.memberships[props.PID];
  if(membership == 0){
    cardIMG = liberalCards[props.PID % N_LIBERAL_CARDS];
  } else if(membership == 1){
    cardIMG = fascistCards[props.PID % N_FASCIST_CARDS]
  } else if(membership == 2){
    cardIMG = hitler;
  }
  return(
    <figure className="player-card">
      {cardIMG && 
        <img src={cardIMG}/>
      }
    </figure>
  )
}