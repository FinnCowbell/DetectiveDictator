import React, { RefObject } from "react";

interface FireBackgroundProps {
  className: string;
  toggle: boolean;
}

interface FireBackgroundState {
  width: number;
  height: number;
  pixelDimX: number;
  pixelDimY: number;
  dissolveSpeed: number;
  pixelHistory: number[][];
  pixels: number[];
  pixelHeight: number;
  pixelWidth: number;
  maxPixels: number;
  maxFPS: number;
  prevRender: number;
  preRenderedFrame: boolean;
}

export default class FireBackground extends React.Component<FireBackgroundProps, FireBackgroundState> {
  request: number | null;
  container: RefObject<HTMLDivElement>;
  mainCanvas: RefObject<HTMLCanvasElement>;
  canvasConfig: CanvasRenderingContext2DSettings;
  offScreenCanvas: React.MutableRefObject<HTMLCanvasElement | null>;

  constructor(props: FireBackgroundProps) {
    let MAX_FPS = 30;
    super(props);
    this.request = null;
    this.container = React.createRef();
    this.mainCanvas = React.createRef();
    this.offScreenCanvas = React.createRef();
    this.initializePixels = this.initializePixels.bind(this);
    this.calculatePixels = this.calculatePixels.bind(this);
    this.paintPixels = this.paintPixels.bind(this);
    this.renderMainCanvas = this.renderMainCanvas.bind(this);
    this.animationTick = this.animationTick.bind(this);
    this.resizeCanvas = this.resizeCanvas.bind(this);
    this.state = {
      width: 0,
      height: 0,
      pixelDimX: 2,
      pixelDimY: 1,
      dissolveSpeed: 3.95,
      pixelHistory: [], //Potentially post prerendered frames to
      pixels: [],
      pixelHeight: 0,
      pixelWidth: 0,
      maxPixels: Infinity, //Arbitrary, but to keep from slowing down excessively upon zooming out.
      maxFPS: MAX_FPS, //Limits amount of anmationRequests per second
      prevRender: 0,
      preRenderedFrame: false,
    };

    this.canvasConfig = {
      alpha: true,
    };
  }

  componentDidMount() {

    this.offScreenCanvas.current = document.createElement("canvas");
    this.resizeCanvas();
    window.addEventListener("resize", this.resizeCanvas);
    this.request = window.requestAnimationFrame(this.animationTick);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.resizeCanvas);
    window.cancelAnimationFrame(this.request!);
  }

  resizeCanvas() {
    //Redefines the canvas dimensions and required columns and rows for the pixels.
    const container = this.container.current;
    let pixelWidth, pixelHeight, newWidth, newHeight, s, modifier;
    modifier = 10;
    s = this.state;
    do {
      newWidth = Math.ceil(container!.offsetWidth / modifier);
      newHeight = Math.ceil(container!.offsetHeight / modifier);
      pixelWidth = Math.ceil(newWidth / s.pixelDimX);
      pixelHeight = Math.ceil(newHeight / s.pixelDimY) + 5;
      modifier *= 1.5;
    } while (pixelHeight * pixelWidth > s.maxPixels);
    this.setState(
      {
        width: newWidth,
        height: newHeight,
        pixelWidth: pixelWidth,
        pixelHeight: pixelHeight,
        pixels: [],
      },
      this.initializePixels // Callback: should always occur.
    );
  }

  initializePixels() {
    // Based on Pixel Width, Pixel Height, and Window size, calculate the needed pixels.
    const s = this.state;
    //TODO: Extend/Shrink existing matrix of pixels so animation isn't interrupted.
    //Add 4 rows extra, for the hidden empty row + rendering row.
    let pixels = new Array(s.pixelWidth * s.pixelHeight).fill(0);
    this.setState({ pixels: pixels }, () => {
      // precalculate smoke values to fill the entire screen.
      // for (let i = 0; i < s.pixelHeight; i++) this.calculatePixels();
      // OR let it fill the screen on its own.
      this.calculatePixels();
    });
  }

  calculatePixels() {
    // Calculations borrowed (stolen) from here: http://slicker.me/javascript/fire/fire.htm
    let s = this.state;
    const pixels = s.pixels;
    let pWidth = s.pixelWidth;
    let pHeight = s.pixelHeight;
    //Randomize values for bottom row (first s.pixelWidth items in array)
    for (let i = 0; i < pWidth; i++) pixels[pWidth + i] = Math.random();
    /*
    Calculate pixels by adding pixels 1-4, from top to bottom
      _ X _
      1 2 3
      _ 4 _ 
    */
    for (let y = pHeight; y > 1; y--) {
      for (let x = 0; x < pWidth; x++) {
        pixels[y * pWidth + x] =
          (pixels[(y - 1) * pWidth + ((x - 1 + pWidth) % pWidth)] + //1
          pixels[(y - 1) * pWidth + ((x + pWidth) % pWidth)] + //2
          pixels[(y - 1) * pWidth + ((x + 1 + pWidth) % pWidth)] + //3
            pixels[(y - 2) * pWidth + ((x + pWidth) % pWidth)]) / //4
          s.dissolveSpeed;
      }
    }
    this.setState({ pixels: pixels });
  }

  paintPixels() {
    // Paint the new pixels to the hidden canvas.
    const c: HTMLCanvasElement = this.offScreenCanvas.current!;
    let s, pixelValue, color;
    s = this.state;
    let ctx: CanvasRenderingContext2D = c.getContext("2d", this.canvasConfig)!;
    ctx.imageSmoothingEnabled = false;
    if (c.width != s.width || c.height != s.height) {
      c.height = s.height;
      c.width = s.width;
    }
    ctx.clearRect(0, 0, c.width, c.height);
    for (let j = 0; j < s.pixelHeight; j++) {
      for (let i = 0; i < s.pixelWidth; i++) {
        //Draw pixels from left to right, bottom to top.
        pixelValue = s.pixels[j * s.pixelWidth + i];
        //Added *.75 to make effect less harsh
        color = `rgba(0,0,0,${pixelValue * 0.7})`;
        // color = `rgb(${pixelValue * 255},${pixelValue * 255},${
        // pixelValue * 255
        // })`;
        ctx.beginPath();
        ctx.rect(
          s.pixelDimX * i,
          s.height - s.pixelDimY - s.pixelDimY * (j - 5), //Cut off 4 bottom layers
          s.pixelDimX,
          s.pixelDimY
        );
        ctx.fillStyle = color;
        ctx.fill();
      }
    }
  }

  renderMainCanvas() {
    const mainCanvas = this.mainCanvas.current!;
    const offScreenCanvas = this.offScreenCanvas.current!;
    let ctx: CanvasRenderingContext2D= mainCanvas.getContext("2d", this.canvasConfig)!;
    ctx.imageSmoothingEnabled = false;
    let s = this.state;
    //Reset heights+widths
    // Both clears canvas AND conveniently resizes whenever neccessary.
    if (mainCanvas.width != s.width || mainCanvas.height != s.height) {
      mainCanvas.width = s.width;
      mainCanvas.height = s.height;
    } else {
      ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    }
    // Fill s.pixels with new calculations.
    //Draw Pixels.
    this.paintPixels();
    // Draw Pixels to visible canvas.
    ctx.drawImage(offScreenCanvas, 0, 0);
  }

  animationTick(timeStamp: number) {
    // Draw to the offscreen canvas, write to the main one at the end.
    // Should reduce CPU intensity of each canvas drawing.
    let s = this.state;
    // IF it's time to print a frame, do it. Otherwise, keep running.
    if (timeStamp - s.prevRender >= 1000 / s.maxFPS) {
      // Should calculating pixels be decoupled from painting + rendering?
      if (!s.preRenderedFrame) {
        //TODO: Figure out if this does anything helpful
        this.calculatePixels();
        this.paintPixels();
      }
      this.renderMainCanvas();
      this.setState({ prevRender: timeStamp, preRenderedFrame: false }, () =>{
        this.request = window.requestAnimationFrame(this.animationTick)
      }
      );
    } else {
      if (!s.preRenderedFrame) {
        this.calculatePixels();
        this.paintPixels();
      }
      this.setState({ preRenderedFrame: true }, () =>{
        this.request = window.requestAnimationFrame(this.animationTick)
      }
      );
    }
  }

  render() {
    return (
      <div
        ref={this.container}
        className={`${this.props.className} wave-background fire-bg ${this.props.toggle ? " fade" : "fade-in"}`}>
        <canvas className="fire-bg" ref={this.mainCanvas} />
        <div className="gradient"></div>
      </div>
    );
  }
}