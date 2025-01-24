import React from "react";
import libBoard from "../../media/boards/liberal.png";
import Fascist56 from "../../media/boards/fascist56.png";
import Fascist78 from "../../media/boards/fascist78.png";
import Fascist910 from "../../media/boards/fascist910.png";
import libPolicy from "../../media/liberal-policy.png";
import fasPolicy from "../../media/fascist-policy.png";

const LIB_CANVAS_WIDTH = 2056;
const LIB_CANVAS_HEIGHT = 678;

interface BoardProps {
  marker?: number;
  draw?: number;
  discard?: number;
  nCards: number;
  nPlayers: number;
}

//Boards don't need a state.
class LibBoard extends React.Component<Omit<BoardProps, "nPlayers">> {
  private canvas: React.RefObject<HTMLCanvasElement>;
  private libBoard: React.RefObject<HTMLImageElement>;
  private policy: React.RefObject<HTMLImageElement>;
  private markerColor: string;
  private liberalText: string;
  private markerLocations: number[][];
  private drawCenter: number[];
  private discardCenter: number[];
  private fontType: string;
  private cardXs: number[];
  private cardY: number;
  private cardWidth: number;
  private cardHeight: number;
  private containerRef: React.RefObject<HTMLDivElement>;

  constructor(props: BoardProps) {
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
    this.containerRef = React.createRef();
  }
  componentDidMount() {
    if (this.canvas.current != null) {
      this.canvas.current!.width = LIB_CANVAS_WIDTH;
      this.canvas.current!.height = LIB_CANVAS_HEIGHT;
    }
    this.update();
  }
  update() {
    this.drawImage();
    this.updateMarker();
    this.updatePiles();
    this.updateCards();
  }
  drawImage() {
    let ctx = this.canvas.current?.getContext("2d");
    ctx!.drawImage(this.libBoard.current!, 0, 0);
  }
  updateMarker() {
    let ctx = this.canvas.current?.getContext("2d")!;
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
    let ctx = this.canvas.current?.getContext("2d")!;
    ctx.save();
    ctx.fillStyle = this.liberalText;
    ctx.strokeStyle = this.liberalText;
    ctx.font = this.fontType;
    ctx.textAlign = "center";
    ctx.translate(this.drawCenter[0], this.drawCenter[1]);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(`DRAW: ${this.props.draw}`, 0, 0);
    ctx.restore();
    ctx.save();
    ctx.fillStyle = this.liberalText;
    ctx.strokeStyle = this.liberalText;
    ctx.font = this.fontType;
    ctx.textAlign = "center";
    ctx.translate(this.discardCenter[0], this.discardCenter[1]);
    ctx.rotate((3 * Math.PI) / 2);
    ctx.fillText(`DISCARD: ${this.props.discard}`, 0, 0);
    ctx.restore();
  }
  updateCards() {
    let ctx = this.canvas.current?.getContext("2d")!;
    let policyImg = this.policy.current!;
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

  scrollToCard(cardIndex: number) {
    if (!this.containerRef.current || !this.libBoard.current || !this.canvas.current) {
      return;
    }
    const cardX = this.cardXs[cardIndex - 1];
    const boardWidth: number = LIB_CANVAS_WIDTH;
    const percentage = cardX / boardWidth;
    const containerWidth = this.canvas.current.getBoundingClientRect().width;
    const scrollAmount = percentage * containerWidth;
    // 3. Scroll containerRef by that many pixels.
    this.containerRef.current.scroll({ left: scrollAmount });
  }

  componentDidUpdate(prevProps: Omit<BoardProps, "nPlayers">) {
    this.update();
    if (prevProps.nCards !== this.props.nCards) {
      this.scrollToCard(this.props.nCards);
    }
  }

  render() {
    return (
      <div ref={this.containerRef} className="board-container">
        <div className="liberal board">
          <canvas
            ref={this.canvas}
            className="lib-canvas"
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
      </div>
    );
  }
}


const FAS_CANVAS_WIDTH = 2074
const FAS_CANVAS_HEIGHT = 687
class FasBoard extends React.Component<BoardProps> {
  private canvas: React.RefObject<HTMLCanvasElement>;
  private policy: React.RefObject<HTMLImageElement>;
  private board: React.RefObject<HTMLImageElement>;
  private containerRef: React.RefObject<HTMLDivElement>;
  private cardY: number;
  private cardXs: number[];
  private cardWidth: number;
  private cardHeight: number;

  constructor(props: BoardProps) {
    super(props);
    this.canvas = React.createRef();
    this.policy = React.createRef();
    this.board = React.createRef();
    this.containerRef = React.createRef();
    this.cardY = 165;
    this.cardXs = [169, 466, 765, 1064, 1364, 1664];
    this.cardWidth = 245;
    this.cardHeight = 373;
  }
  componentDidMount() {
    if (this.canvas.current != null) {
      this.canvas.current!.width = FAS_CANVAS_WIDTH;
      this.canvas.current!.height = FAS_CANVAS_HEIGHT;
    }
    this.update();
  }
  update() {
    this.drawImage();
    this.updateCards();
  }
  drawImage() {
    let ctx = this.canvas.current?.getContext("2d");
    ctx?.drawImage(this.board.current!, 0, 0);
  }
  updateCards() {
    let ctx = this.canvas.current?.getContext("2d");
    let policyImg = this.policy.current!;
    let card = 0;
    while (card < this.props.nCards) {
      ctx?.drawImage(
        policyImg,
        this.cardXs[card],
        this.cardY,
        this.cardWidth,
        this.cardHeight
      );
      card++;
    }
  }

  scrollToCard(cardIndex: number) {
    if (!this.containerRef.current || !this.board.current || !this.canvas.current) {
      return;
    }
    // 1. Get the x coordinate of the current card from cardXs and turn it into a percentage of the this.board element width.
    const cardX = this.cardXs[cardIndex - 1];
    const boardWidth: number = FAS_CANVAS_WIDTH;
    const percentage = cardX / boardWidth;

    // 2. Get the size of the containerRef and multiply the percentage by the width of that element.
    const containerWidth = this.canvas.current.getBoundingClientRect().width;
    const scrollAmount = percentage * containerWidth;

    // 3. Scroll containerRef by that many pixels.
    this.containerRef.current.scroll({ left: scrollAmount });
  }
  componentDidUpdate(prevProps: BoardProps) {
    this.update();
    if (prevProps.nCards !== this.props.nCards) {
      this.scrollToCard(this.props.nCards);
    }
  }

  render() {
    let fascistBoard;
    const gameStyle = Math.floor((this.props.nPlayers - 5) / 2);
    if (gameStyle < 1) {
      fascistBoard = Fascist56;
    } else if (gameStyle == 1) {
      fascistBoard = Fascist78;
    } else {
      fascistBoard = Fascist910;
    }
    return (
      <div ref={this.containerRef} className="board-container">
        <div className="fascist board">
          <canvas ref={this.canvas}></canvas>
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
      </div>
    );
  }
}

export { LibBoard, FasBoard };
