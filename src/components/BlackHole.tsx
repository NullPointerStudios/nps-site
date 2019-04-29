import React from 'react';

const holeCount = 1;
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
            <canvas id={"blackhole-canvas"}/>
        </div>
    }

    componentDidMount() {
        document.addEventListener("keydown", () => this.onEscape, false);
        this.canvas = document.getElementById("blackhole-canvas") as HTMLCanvasElement;
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
        if (this.canvas) {
            if (!this.canvas.style.width)
                this.canvas.style.width = this.canvas.width + 'px';
            if (!this.canvas.style.height)
                this.canvas.style.height = this.canvas.height + 'px';

            let scaleFactor = dpi / 96;
            this.canvas.width = Math.ceil(this.canvas.width * scaleFactor);
            this.canvas.height = Math.ceil(this.canvas.height * scaleFactor);

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

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    }

    get xPos(): number {
        return this.canvas.width / 2;
    }

    get yPos(): number {
        return this.canvas.height / 2;
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
        this.stars.forEach(star => {
            star.draw(this.time, collapsed, expanded);
        });
    }
}

class Star {
    color: string;
    orbitDistance: number;
    rotation: number = 0;
    startRotation: number;
    speed: number;
    yOrigin: number;
    x: number;
    y: number;
    trail: number = 1;
    hoverPos: number;
    collapseBonus: number;
    expansPos: number;
    prevR: number;
    prevX: number;
    prevY: number;

    get context() {
        return this.blackHole.context;
    }

    blackHole: BlackHole;

    get centerX(): number {
        return this.blackHole.xPos;
    }

    get centerY(): number {
        return this.blackHole.yPos;
    }

    get xPos(): number {
        return 0;
    }

    get yPos(): number {
        return 0;
    }

    constructor(blackHole: BlackHole, index: number) {
        this.blackHole = blackHole;

        let rands = [];
        rands.push(Math.random() * (maxOrbit / 2) + 1);
        rands.push(Math.random() * (maxOrbit / 2) + maxOrbit);
        this.orbitDistance = (rands.reduce(function (p, c) {
            return p + c;
        }, 0) / rands.length);

        this.collapseBonus = this.orbitDistance - (maxOrbit * 0.7); // This "bonus" is used to randomly place some stars outside of the blackhole on hover
        if (this.collapseBonus < 0) { // if the collapsed "bonus" is negative
            this.collapseBonus = 0; // set it to 0, this way no stars will go inside the blackhole
        }

        this.x = blackHole.xPos;
        this.y = blackHole.yPos;
        this.startRotation = (Math.floor(Math.random() * 360) + 1) * Math.PI / 180; // Starting rotation.  If not random, all stars will be generated in a single line.
        this.speed = (Math.floor(Math.random() * 2.5) + 1.5) * Math.PI / 180; // The rate at which this star will orbit
        this.yOrigin = this.y + this.orbitDistance;  // this is used to track the particles origin
        this.hoverPos = this.blackHole.yPos + (maxOrbit / 2) + this.collapseBonus;  // Where the star will go on hover of the blackhole
        this.expansPos = blackHole.yPos + (index % 100) * -10 + (Math.floor(Math.random() * 20) + 1); // Where the star will go when expansion takes place
        this.prevR = this.startRotation;
        this.prevX = this.x;
        this.prevY = this.y;

        this.color = 'rgba(255,255,255,' + (1 - ((this.orbitDistance) / 255)) + ')';
    }

    draw(time: number, collapsed: boolean, expanded: boolean) {
        if (!expanded) {
            this.rotation = this.startRotation + (time * this.speed);
            if (!collapsed) { // not hovered
                if (this.y > this.yOrigin) {
                    this.y -= 2.5;
                }
                if (this.y < this.yOrigin - 4) {
                    this.y += (this.yOrigin - this.y) / 10;
                }
            } else { // on hover
                this.trail = 1;
                if (this.y > this.hoverPos) {
                    this.y -= (this.hoverPos - this.y) / -5;
                }
                if (this.y < this.hoverPos - 4) {
                    this.y += 2.5;
                }
            }
        } else {
            this.rotation = this.startRotation + (time * (this.speed / 2));
            if (this.y > this.expansPos) {
                this.y -= Math.floor(this.expansPos - this.y) / -140;
            }
        }

        this.context.save();

        this.context.fillStyle = this.color;
        this.context.strokeStyle = this.color;
        this.context.beginPath();
        const oldPos = rotate(this.centerX, this.centerY, this.prevX, this.prevY, -this.prevR);
        this.context.moveTo(oldPos[0], oldPos[1]);
        this.context.translate(this.centerX, this.centerY);
        this.context.rotate(this.rotation);
        this.context.translate(-this.centerX, -this.centerY);
        this.context.lineTo(this.x, this.y);
        this.context.stroke();

        this.context.restore();
    }
}

function rotate(cx: number, cy: number, x: number, y: number, angle: number) {
    let radians = angle,
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
        ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
    return [nx, ny];
}