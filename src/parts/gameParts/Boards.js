import React from "react";
import libBoard from "../../media/boards/liberal.png";
import Fascist56 from "../../media/boards/fascist56.png";
import Fascist78 from "../../media/boards/fascist78.png";
import Fascist910 from "../../media/boards/fascist910.png";
import libPolicy from "../../media/liberal-policy.png";
import fasPolicy from "../../media/fascist-policy.png";
//Boards don't need a state.
class LibBoard extends React.Component {
  constructor(props) {
    super(props);
    this.canvas = React.createRef();
    this.libBoard = React.createRef();
    this.policy = React.createRef();
    this.markerColor = "#2e8768";
    this.liberalText = "#89edff";
    this.markerLocations = [
      [710, 599],
      [912, 599],
      [1113, 599],
      [1315, 599],
    ];
    this.drawCenter = [85, 337];
    this.discardCenter = [1970, 337];
    this.fontType = "70px Germania";
    this.cardXs = [310, 608, 904, 1203, 1504];
    this.cardY = 155;
    this.cardWidth = 245;
    this.cardHeight = 373;
  }
  componentDidMount() {
    this.update();
  }
  update() {
    this.drawImage();
    this.updateMarker();
    this.updatePiles();
    this.updateCards();
  }
  drawImage() {
    let ctx = this.canvas.current.getContext("2d");
    ctx.drawImage(this.libBoard.current, 0, 0);
  }
  updateMarker() {
    let ctx = this.canvas.current.getContext("2d");
    let x, y;
    x = this.markerLocations[this.props.marker || 0][0];
    y = this.markerLocations[this.props.marker || 0][1];
    ctx.beginPath();
    ctx.fillStyle = this.markerColor;
    ctx.strokeStyle = this.markerColor;
    ctx.arc(x, y, 25, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();
  }
  updatePiles() {
    let ctx = this.canvas.current.getContext("2d");
    ctx.save();
    ctx.fillStyle = this.liberalText;
    ctx.strokeStyle = this.liberalText;
    ctx.font = this.fontType;
    ctx.textAlign = "center";
    ctx.translate(this.drawCenter[0], this.drawCenter[1]);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(`DRAW PILE: ${this.props.draw}`, 0, 0);
    ctx.restore();
    ctx.save();
    ctx.fillStyle = this.liberalText;
    ctx.strokeStyle = this.liberalText;
    ctx.font = this.fontType;
    ctx.textAlign = "center";
    ctx.translate(this.discardCenter[0], this.discardCenter[1]);
    ctx.rotate((3 * Math.PI) / 2);
    ctx.fillText(`DISCARD PILE: ${this.props.discard}`, 0, 0);
    ctx.restore();
  }
  updateCards() {
    let ctx = this.canvas.current.getContext("2d");
    let boardImg = this.policy.current;
    let card = 0;
    while (card < this.props.nCards) {
      ctx.drawImage(
        policyImg,
        this.cardXs[card],
        this.cardY,
        this.cardWidth,
        this.cardHeight
      );
      card++;
    }
  }
  componentDidUpdate() {
    this.update();
  }
  render() {
    return (
      <div className="liberal board">
        <canvas
          ref={this.canvas}
          className="lib-canvas"
          width={2056}
          height={678}
        ></canvas>
        <img
          ref={this.libBoard}
          onLoad={() => {
            this.update();
          }}
          src={libBoard}
          style={{ display: "none" }}
        />
        <img
          ref={this.policy}
          onLoad={() => {
            this.update();
          }}
          src={libPolicy}
          style={{ display: "none" }}
        />
      </div>
    );
  }
}

class FasBoard extends React.Component {
  constructor(props) {
    super(props);
    this.canvas = React.createRef();
    this.policy = React.createRef();
    this.board = React.createRef();
    this.cardY = 165;
    this.cardXs = [169, 466, 765, 1064, 1364, 1664];
    this.cardWidth = 245;
    this.cardHeight = 373;
  }
  componentDidMount() {
    this.update();
  }
  update() {
    this.drawImage();
    this.updateCards();
  }
  drawImage() {
    let ctx = this.canvas.current.getContext("2d");
    ctx.drawImage(this.board.current, 0, 0);
  }
  updateCards() {
    let ctx = this.canvas.current.getContext("2d");
    let policyImg = this.policy.current;
    let card = 0;
    while (card < this.props.nCards) {
      ctx.drawImage(
        policyImg,
        this.cardXs[card],
        this.cardY,
        this.cardWidth,
        this.cardHeight
      );
      card++;
    }
  }
  componentDidUpdate() {
    this.update();
  }
  render() {
    let fascistBoard;
    let gameStyle = Math.floor((this.props.nPlayers - 5) / 2);
    if (gameStyle < 1) {
      fascistBoard = Fascist56;
    } else if (gameStyle == 1) {
      fascistBoard = Fascist78;
    } else {
      fascistBoard = Fascist910;
    }
    return (
      <div className="fascist board">
        <canvas ref={this.canvas} width={2074} height={687}></canvas>
        <img
          ref={this.board}
          onLoad={() => {
            this.update();
          }}
          src={fascistBoard}
          style={{ display: "none" }}
        />
        <img
          ref={this.policy}
          onLoad={() => {
            this.update();
          }}
          src={fasPolicy}
          style={{ display: "none" }}
        />
      </div>
    );
  }
}

export { LibBoard, FasBoard };
