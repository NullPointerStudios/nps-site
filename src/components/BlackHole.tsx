import React from 'react';

const starCount = 1000;
const maxOrbit = 250;
const fps = 60;

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
            expanded: true,
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

    started: boolean = false;

    startRenderLoop() {
        if (!this.started) {
            setInterval(() => {
                this.renderLoop()
            }, 1000 / fps);
            this.started = true;
        }
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
    radius: number = 150;
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
        return (new Date().getTime() - this.startTime) / 60;
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
        // Cheap but effective hack.
        if (this.expanded) {
            this.startTime -= 0;
        } else if (this.collapsed) {
            this.startTime -= 10;
        }

        this.stars.forEach(star => {
            star.update();
        });
    }
}

class Star {
    blackHole: BlackHole;
    orbitalDistance: number;
    color: string;
    speed: number = 0;
    startingRotation: number;
    currentDistance: number;
    currentPosition: Vector2;
    nextPosition: Vector2;
    currentRotation: number;

    get collapseDistance() {
        return this.blackHole.radius;
    }

    get expandedDistance() {
        return (this.orbitalDistance - this.blackHole.radius) * -3;
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

    get centerPos(): Vector2 {
        return this.blackHole.position;
    }

    get time(): number {
        return this.blackHole.time;
    }

    get targetDistance() {
        if (this.expanded) {
            return this.expandedDistance;
        } else if (this.collapsed) {
            return this.collapseDistance
        }
        return this.orbitalDistance;
    }

    constructor(blackHole: BlackHole, index: number) {
        this.blackHole = blackHole;
        this.speed = randomRange(-1, -5);

        this.orbitalDistance = randomRange(this.blackHole.radius, maxOrbit + this.blackHole.radius);
        this.currentDistance = this.orbitalDistance;

        this.color = `rgba(0, 153, 218,${1 - ((this.orbitalDistance - this.blackHole.radius) / maxOrbit)})`; // Color the star white, but make it more transparent the further out it is generated

        this.startingRotation = randomRange(0, 360);
        this.currentRotation = this.startingRotation;

        this.currentPosition = {x: this.blackHole.position.x, y: this.blackHole.position.y + this.orbitalDistance};
        this.nextPosition = this.currentPosition;

        this.move();
        this.currentPosition = this.nextPosition;
    }

    update() {
        this.move();
        this.draw();
        this.currentPosition = this.nextPosition;
    }

    move() {
        this.currentDistance = lerp(this.currentDistance, this.targetDistance, .05);
        this.currentRotation = lerp(this.currentRotation, ((this.time * this.speed) + this.startingRotation), .05);
        this.nextPosition = rotate(this.centerPos, {
            x: this.blackHole.position.x,
            y: this.blackHole.position.y + this.currentDistance
        }, this.currentRotation);
    }

    draw() {
        drawStar(this.context, this.currentPosition, this.nextPosition, this.color);
    }
}

interface Vector2 {
    x: number,
    y: number
}

function rotate(centerPosition: Vector2, startingPosition: Vector2, angle: number) {
    let radians = angle * 0.0174533,
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (startingPosition.x - centerPosition.x)) + (sin * (startingPosition.y - centerPosition.y)) + centerPosition.x,
        ny = (cos * (startingPosition.y - centerPosition.y)) - (sin * (startingPosition.x - centerPosition.x)) + centerPosition.y;
    return {x: nx, y: ny};
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

function lerp(v0: number, v1: number, t: number) {
    return v0 * (1 - t) + v1 * t
}