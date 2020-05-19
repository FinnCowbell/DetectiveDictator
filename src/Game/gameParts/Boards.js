import React from 'react'
//Boards don't need a state.
function LibBoard(props){
  return(
    <div className="liberal-board">
      <div className="card-slots">
        <div className={props.nCards > 0 ? "filled" : "empty"}>{props.nCards > 0 ? "filled" : "empty"}</div>
        <div className={props.nCards > 1 ? "filled" : "empty"}>{props.nCards > 1 ? "filled" : "empty"}</div>
        <div className={props.nCards > 2 ? "filled" : "empty"}>{props.nCards > 2 ? "filled" : "empty"}</div>
        <div className={props.nCards > 3 ? "filled" : "empty"}>{props.nCards > 3 ? "filled" : "empty"}</div>
        <div className={props.nCards > 4 ? "filled" : "empty"}>{props.nCards > 4 ? "filled" : "empty"}</div>
      </div>
      <div className="marker-slots">
        <div className={props.marker == 0 ? "filled" : "empty"}></div>
        <div className={props.marker == 1 ? "filled" : "empty"}></div>
        <div className={props.marker == 2 ? "filled" : "empty"}></div>
      </div>
    </div>
  )
}

function FasBoard(props){
  return(
    <div className="fascist-board">
      <div className="card-slots">
        <div className={props.nCards > 0 ? "filled" : "empty"}>{props.nCards > 0 ? "filled" : "empty"}</div>
        <div className={props.nCards > 1 ? "filled" : "empty"}>{props.nCards > 1 ? "filled" : "empty"}</div>
        <div className={props.nCards > 2 ? "filled" : "empty"}>{props.nCards > 2 ? "filled" : "empty"}</div>
        <div className={props.nCards > 3 ? "filled" : "empty"}>{props.nCards > 3 ? "filled" : "empty"}</div>
        <div className={props.nCards > 4 ? "filled" : "empty"}>{props.nCards > 4 ? "filled" : "empty"}</div>
        <div className={props.nCards > 5 ? "filled" : "empty"}>{props.nCards > 5 ? "filled" : "empty"}</div>
      </div>
    </div>
  )
}

export {LibBoard, FasBoard}