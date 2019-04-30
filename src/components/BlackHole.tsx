import {Color} from 'csstype';
import React from 'react';

const starCount = 2500;
const maxOrbit = 250;

interface NPSUniverseProps {

}

interface NPSUniverseState {
  collapsed: boolean;
  expanded: boolean;
}

export class Universe extends React.Component<NPSUniverseProps, NPSUniverseState> {
  canvas: HTMLCanvasElement | undefined;
  canvasContext: CanvasRenderingContext2D | undefined;
  blackHole: BlackHole | undefined;

  constructor(props: NPSUniverseProps) {
    super(props);

    this.state = {
      collapsed: false,
      expanded: false,
    }
  }

  render(): React.ReactElement<any, string | React.JSXElementConstructor<any>> | string | number | {} | React.ReactNodeArray | React.ReactPortal | boolean | null | undefined {
    return <div id="blackhole">
      <div
        className="centerHover"
        onMouseEnter={() => this.onStartHover}
        onMouseLeave={() => this.onStopHover}
        onClick={() => this.onClick}
      >
        <span>Null Pointer Studios</span></div>
      <canvas id={'blackhole-canvas'}/>
    </div>
  }

  componentDidMount() {
    document.addEventListener('keydown', () => this.onEscape(), false);
    window.addEventListener('resize', () => this.onResize(), false);
    this.canvas = document.getElementById('blackhole-canvas') as HTMLCanvasElement;
    this.canvasContext = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.setDPI(192);
    this.createBlackHole(starCount);
    this.startRenderLoop();
  }

  onStartHover() {
    this.setState({collapsed: true});
  }

  onStopHover() {
    this.setState({collapsed: false});
  }

  onClick() {
    this.setState({expanded: true});
  }

  onEscape() {
    this.setState({expanded: false});
  }

  onResize() {
    this.setDPI(192);
  }

  createBlackHole(starCount: number) {
    this.blackHole = new BlackHole(this.canvas as HTMLCanvasElement);
    this.blackHole.createStars(starCount);
  }

  startRenderLoop() {
    this.renderLoop();
  }

  renderLoop() {
    this.clearCanvas();
    if (this.blackHole) {
      this.blackHole.draw(this.state.collapsed, this.state.expanded);
    }
    setTimeout(() => {
      this.renderLoop();
    }, 1000 / 60);
  }

  clearCanvas() {
    if (this.canvas && this.canvasContext) {
      this.canvasContext.fillStyle = 'rgba(25,25,25,0.2)'; // somewhat clear the context, this way there will be trails behind the stars
      this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  setDPI(dpi: number) {
    if (this.canvas && this.canvas.parentElement) {
      const targetWidth = this.canvas.parentElement.clientWidth;
      const targetHeight = this.canvas.parentElement.clientHeight;
      this.canvas.style.width = targetWidth + 'px';
      this.canvas.style.height = targetHeight + 'px';

      let scaleFactor = dpi / 96;
      this.canvas.width = Math.ceil(targetWidth * scaleFactor);
      this.canvas.height = Math.ceil(targetHeight * scaleFactor);

      const context = this.canvas.getContext('2d');
      if (context) {
        context.scale(scaleFactor, scaleFactor);
      }
    }
  }
}

class BlackHole {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  startTime = new Date().getTime();
  stars: Star[] = [];
  radius: number = 100;

  get position() {
    return {
      x: this.canvas.width / 4,
      y: this.canvas.height / 4
    }
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;

  }

  get time(): number {
    return (new Date().getTime() - this.startTime) / 50;
  }

  createStars(starCount: number) {
    this.stars = [];
    for (let i = 0; i < starCount; i++) {
      this.stars.push(new Star(this, i));
    }
  }

  draw(collapsed: boolean, expanded: boolean) {
    drawSphere(this.context, this.position, this.radius, 'Blue', 'Black', true);

    this.stars.forEach(star => {
      star.draw(this.time, collapsed, expanded);
    });
  }
}

class Star {
  orbitalDistance: number;
  previousRotation: number;
  previousPosition: Vector2;
  speed: number;
  color: string = 'rgba(255,255,255,1)';

  get collapseDistance() {
    return this.blackHole.radius
  }

  get context() {
    return this.blackHole.context;
  }

  blackHole: BlackHole;

  get centerPos(): Vector2 {
    return this.blackHole.position;
  }

  constructor(blackHole: BlackHole, index: number) {
    this.blackHole = blackHole;
    this.orbitalDistance = randomRange(this.blackHole.radius, maxOrbit + this.blackHole.radius);
    this.previousRotation = randomRange(0, 360);
    this.speed = randomRange(0, 10);
    this.previousPosition = {x: this.blackHole.position.x, y: this.orbitalDistance};
  }

  draw(time: number, collapsed: boolean, expanded: boolean) {
    const newPosition = rotate(this.blackHole.position, this.previousPosition, this.previousRotation + this.speed);
    const newRotation = this.previousRotation + this.speed;

    drawStar(this.context, this.previousPosition, newPosition, this.color);

    this.previousPosition = newPosition;
    this.previousRotation = newRotation;
  }
}

interface Vector2 {
  x: number,
  y: number
}

function rotate(centerPosition: Vector2, currentPosition: Vector2, angle: number) {
  let radians = angle,
    cos = Math.cos(radians),
    sin = Math.sin(radians),
    nx = (cos * (currentPosition.x - centerPosition.x)) + (sin * (currentPosition.y - centerPosition.y)) + centerPosition.x,
    ny = (cos * (currentPosition.y - centerPosition.y)) - (sin * (currentPosition.x - centerPosition.x)) + centerPosition.y;
  return {x: nx, y: ny};
}

function drawSphere(context: CanvasRenderingContext2D, position: Vector2, radius: number, strokeStyle: Color, fillStyle: Color, filled: boolean = false) {
  context.save();
  context.arc(position.x, position.y, radius, 0, 2 * Math.PI, false);

  context.strokeStyle = strokeStyle;
  context.stroke();

  if (filled) {
    context.fillStyle = fillStyle;
    context.fill();
  }

  context.restore();
}

function drawStar(context: CanvasRenderingContext2D, oldPosition: Vector2, newPosition: Vector2, strokeStyle: string) {
  context.save();

  context.beginPath();
  context.fillStyle = strokeStyle;
  context.strokeStyle = strokeStyle;

  context.moveTo(oldPosition.x, oldPosition.y);
  context.lineTo(newPosition.y, newPosition.y);
  context.closePath();
  context.stroke();

  context.restore();
}

function randomRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}