import React from 'react'
import libBoard from '../media/boards/liberal.png';
import Fascist56 from '../media/boards/fascist56.png';
import Fascist78 from '../media/boards/fascist78.png';
import Fascist910 from '../media/boards/fascist910.png'
import libPolicy from "../media/liberal-policy.png";
import fasPolicy from "../media/fascist-policy.png";
//Boards don't need a state.
class LibBoard extends React.Component{
  constructor(props){
    super(props);
    this.markerColor = "#2e8768";
    this.liberalText = "#5fc7d8";
    this.markerLocations = [[
      710,599
    ],[
      912,599
    ],[
      1113,599
    ],[
      1315,599
    ]];
    this.drawCenter = [85,337];
    this.discardCenter = [1970,337];
    this.fontType= "70px Squada";
    this.cardXs =[312,610,906,1205,1506];
    this.cardY = 158;
    this.cardWidth = 242; 
    this.cardHeight = 371; 
  }
  componentDidMount(){
    this.update();
  }
  update(){
    this.drawImage();
    this.updateMarker();
    this.updatePiles();
    this.updateCards()
  }
  drawImage(){
    let ctx = this.refs.canvas.getContext('2d');
    ctx.drawImage(this.refs.libBoard, 0, 0);
  }
  updateMarker(){
    let ctx = this.refs.canvas.getContext('2d');
    let x,y;
    x = this.markerLocations[this.props.marker || 0][0];
    y = this.markerLocations[this.props.marker || 0][1];
    ctx.beginPath();
    ctx.fillStyle = this.markerColor;
    ctx.strokeStyle = this.markerColor;
    ctx.arc(x,y,25,0,2*Math.PI);
    ctx.stroke();
    ctx.fill();
  }
  updatePiles(){
    let ctx = this.refs.canvas.getContext('2d');
    ctx.save();
    ctx.fillStyle = this.liberalText;
    ctx.strokeStyle = this.liberalText;
    ctx.font = this.fontType;
    ctx.textAlign = "center";
    ctx.translate(this.drawCenter[0], this.drawCenter[1])
    ctx.rotate(Math.PI/2);
    ctx.fillText(`DRAW PILE: ${this.props.draw}`, 0, 0);
    ctx.restore();
    ctx.save();
    ctx.fillStyle = this.liberalText;
    ctx.strokeStyle = this.liberalText;
    ctx.font = this.fontType;
    ctx.textAlign = "center";
    ctx.translate(this.discardCenter[0],this.discardCenter[1]);
    ctx.rotate(3*Math.PI/2);
    ctx.fillText(`DISCARD PILE: ${this.props.discard}`, 0, 0);
    ctx.restore();
  }
  updateCards(){
    let ctx = this.refs.canvas.getContext('2d');
    let policyImg = this.refs.policy;
    let card = 0;
    while(card < this.props.nCards){
      ctx.drawImage(policyImg, this.cardXs[card], this.cardY, this.cardWidth, this.cardHeight);
      card++;
    }
  }
  componentDidUpdate(){
    this.update();
  }
  render(){
    return(
      <div className="liberal board">
        <canvas ref="canvas" className="lib-canvas" width={2056} height={678}></canvas>
        <img ref="libBoard" onLoad={()=>{this.update()}} src={libBoard} style={{"display": "none"}}/>
        <img ref="policy" onLoad={()=>{this.update()}} src={libPolicy} style={{"display": "none"}}/>
        {/*<div className="draw-pile">
          <h2>DRAW PILE: {props.draw}</h2>
        </div>
        <div className="discard-pile">
          <h2>DISCARD PILE: {props.discard}</h2>
        </div>
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
        </div> */}
      </div>
    )
  }
}

class FasBoard extends React.Component{
  constructor(props){
    super(props);
    this.cardY = 165;
    this.cardXs =[170,466,765,1064,1364,1664];
    this.cardWidth = 242; 
    this.cardHeight = 371; 
  }
  componentDidMount(){
    this.update();
  }
  update(){
    this.drawImage();
    this.updateCards()
  }
  drawImage(){
    let ctx = this.refs.canvas.getContext('2d');
    ctx.drawImage(this.refs.board, 0, 0);
  }
  updateCards(){
    let ctx = this.refs.canvas.getContext('2d');
    let policyImg = this.refs.policy;
    let card = 0;
    while(card < this.props.nCards){
      ctx.drawImage(policyImg, this.cardXs[card], this.cardY, this.cardWidth, this.cardHeight);
      card++;
    }
  }
  componentDidUpdate(){
    this.update();
  }
  render(){
    let fascistBoard;
    if(this.props.gameStyle < 1){
      fascistBoard = Fascist56;
    } else if(this.props.gameStyle == 1){
      fascistBoard = Fascist78;
    } else{
      fascistBoard = Fascist910;
    }
    return(
      <div className="fascist board">
        <canvas ref="canvas" width={2074} height={687}></canvas>
        <img ref="board" onLoad={()=>{this.update()}} src={fascistBoard} style={{'display': "none"}}/>
        <img ref="policy" onLoad={()=>{this.update()}} src={fasPolicy} style={{'display': "none"}}/>
      </div>
    )
  }
}

export {LibBoard, FasBoard}