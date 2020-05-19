import React from 'react'
export default function PolicyPiles(props){
  return(
    <div className="policies">
      <div className="draw-pile">
        Draw: {props.draw}
      </div>
      <div className="discard-pile">
        Discard: {props.discard}
      </div>
    </div>
  )
}