import React from 'react'
// import Liberal1 from '../media/Liberal1.png';
// import Liberal2 from '../media/Liberal2.png';
// import Liberal3 from '../media/Liberal3.png';
// import Liberal4 from '../media/Liberal4.png';
// import Liberal5 from '../media/Liberal5.png';
// import Liberal6 from '../media/Liberal6.png';
// import Fascist1 from '../media/Fascist1.png';
// import Fascist2 from '../media/Fascist2.png';
// import Hitler from '../media/Hitler.png';
// import DefaultPlayer from '../media/DefaultPlayer.png';
// let Liberal = [Liberal1,Liberal2,Liberal3,Liberal4,Liberal5,Liberal6];
// let Fascist = [Fascist1, Fascist2];

export default function PlayerCard(props){
  //membership and PID
  let cardIMG = "DefaultPlayer";
  if(props.membership == 0){
    cardIMG = `Liberal${(props.PID % 6) + 1}`;
  } else if(props.membership == 1){
    cardIMG = `Fascist${(props.PID % 2) + 1}`;
  } else if(props.membership == 2){
    cardIMG = 'Hitler';
  }
  return(
    <figure className="player-card">
      <img src={`./media/${cardIMG}.png`}/>
    </figure>
  )
}