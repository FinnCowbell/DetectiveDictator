import React from 'react'

export default function PlayerCard(props){
  //membership and PID
  let cardIMG = "";
  let membership = props.memberships[props.PID];
  if(membership == 0){
    cardIMG = `Liberal${(props.PID % 6) + 1}`;
  } else if(membership == 1){
    cardIMG = `Fascist${(props.PID % 2) + 1}`;
  } else if(membership == 2){
    cardIMG = 'Hitler';
  }
  return(
    <figure className="player-card">
      {cardIMG && 
        <img src={`./media/${cardIMG}.png`}/>
      }
    </figure>
  )
}