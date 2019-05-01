import {Color} from 'csstype';
import React from 'react';

const starCount = 2500;
const maxOrbit = 250;
const fps = 500;

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

    get expanded() {
        return this.state.expanded;
    }

    get collapsed() {
        return this.state.collapsed;
    }

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
                onMouseEnter={() => this.onStartHover()}
                onMouseLeave={() => this.onStopHover()}
                onClick={() => this.onClick()}
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
        this.buildUniverse();
    }

    buildUniverse() {
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
        this.buildUniverse();
    }

    createBlackHole(starCount: number) {
        this.blackHole = new BlackHole(this);
        this.blackHole.createStars(starCount);
    }

    startRenderLoop() {
        setInterval(() => {
            this.renderLoop()
        }, (60 / fps) * 100);
    }

    renderLoop() {
        this.clearCanvas();
        if (this.blackHole) {
            this.blackHole.update();
        }
    }

    clearCanvas() {
        if (this.canvas && this.canvasContext) {
            this.canvasContext.fillStyle = 'rgba(25,25,25,0.5)'; // somewhat clear the context, this way there will be trails behind the stars
            // this.canvasContext.fillStyle = 'rgba(1,1,1,1)';
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
    startTime = new Date().getTime();
    stars: Star[] = [];
    radius: number = 100;
    universe: Universe;

    get position() {
        return {
            x: this.canvas.width / 4,
            y: this.canvas.height / 4
        }
    }

    get expanded() {
        return this.universe.expanded;
    }

    get collapsed() {
        return this.universe.collapsed;
    }

    get canvas(): HTMLCanvasElement {
        return this.universe.canvas as HTMLCanvasElement;
    }

    get context(): CanvasRenderingContext2D {
        return this.universe.canvasContext as CanvasRenderingContext2D;
    }

    get time(): number {
        return (new Date().getTime() - this.startTime) / 50;
    }

    constructor(universe: Universe) {
        this.universe = universe;
    }

    createStars(starCount: number) {
        this.stars = [];
        for (let i = 0; i < starCount; i++) {
            this.stars.push(new Star(this, i));
        }
    }

    update() {
        // drawSphere(this.context, this.position, this.radius, 'Blue', 'Black', true);

        this.stars.forEach(star => {
            star.update();
        });
    }
}

class Star {
    blackHole: BlackHole;
    orbitalDistance: number;
    speed: number;
    color: string;

    currentRotation: number = 0;
    currentPosition: Vector2;

    nextPosition: Vector2;

    get collapseDistance() {
        return this.blackHole.radius
    }

    get context() {
        return this.blackHole.context;
    }

    get expanded() {
        return this.blackHole.expanded;
    }

    get collapsed() {
        return this.blackHole.collapsed;
    }

    get canvas(): HTMLCanvasElement {
        return this.blackHole.canvas;
    }

    get centerPos(): Vector2 {
        return this.blackHole.position;
    }

    constructor(blackHole: BlackHole, index: number) {
        this.blackHole = blackHole;
        this.orbitalDistance = randomRange(this.blackHole.radius, maxOrbit + this.blackHole.radius);
        this.speed = randomRange(1, 5);
        this.color = `rgba(0, 153, 218,${(this.orbitalDistance - this.blackHole.radius) / maxOrbit})`; // Color the star white, but make it more transparent the further out it is generated

        this.currentRotation = randomRange(0, 360);
        this.currentPosition = {x: this.blackHole.position.x, y: this.orbitalDistance};

        this.nextPosition = this.currentPosition;
        this.calculateNextPosition(randomRange(0, 10));
        this.currentPosition = this.nextPosition;

    }

    update() {
        this.calculateNextPosition();
        this.draw();

        this.currentPosition = this.nextPosition;
    }

    calculateNextPosition(speedOverride: number = 0) {
        if (this.collapsed) {
            this.nextPosition = rotate(this.centerPos, this.currentPosition, speedOverride || ((this.speed * 2) / fps * -1));
        } else if (this.expanded) {

        } else {
            this.nextPosition = rotate(this.centerPos, this.currentPosition, speedOverride || ((this.speed) / fps * -1));
        }

    }

    draw() {
        drawStar(this.context, this.currentPosition, this.nextPosition, this.color);
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

    context.beginPath();

    context.arc(position.x, position.y, radius, 0, 2 * Math.PI, false);

    context.strokeStyle = strokeStyle;
    context.closePath();

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
    context.lineTo(newPosition.x, newPosition.y);
    context.closePath();
    context.stroke();

    context.restore();
}

function randomRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
}