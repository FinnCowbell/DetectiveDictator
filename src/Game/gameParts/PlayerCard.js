import React from 'react'

export default function PlayerCard(props){
  //membership and PID
  let cardIMG = "";
  let membership = props.memberships[props.PID];
  if(membership == 0){
    cardIMG = `liberal${(props.PID % 6) + 1}`;
  } else if(membership == 1){
    cardIMG = `fascist${(props.PID % 2) + 1}`;
  } else if(membership == 2){
    cardIMG = 'hitler';
  }
  return(
    <figure className="player-card">
      {cardIMG && 
        <img src={`./media/player-cards/${cardIMG}.png`}/>
      }
    </figure>
  )
}