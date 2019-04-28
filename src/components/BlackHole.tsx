import React from 'react';

export class BlackHoleComponent extends React.Component {
    blackHole: BlackHole | undefined;

    render(): React.ReactElement<any, string | React.JSXElementConstructor<any>> | string | number | {} | React.ReactNodeArray | React.ReactPortal | boolean | null | undefined {
        return <div id="blackhole">
            <div className="centerHover"><span>Null Pointer Studios</span></div>
            <canvas id={"blackhole-canvas"}/>
        </div>
    }

    componentDidMount() {
        this.blackHole = new BlackHole('blackhole-canvas');
        this.blackHole.setDPI(192);
        this.blackHole.createStars(2500);
        this.blackHole.start();
    }
}

class BlackHole {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    canvasHeight: number;
    canvasWidth: number;
    maxOrbit: number = 255; // Distance from center
    centerX: number;
    centerY: number;
    startTime = new Date().getTime();
    stars: Star[] = [];
    collapsed: boolean = false;
    expanded: boolean = false;
    self: BlackHole;

    get currentTime(): number {
        return (new Date().getTime() - this.startTime) / 50;
    }

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (this.canvas.parentElement){
            this.canvas.width = this.canvas.parentElement.clientWidth;
            this.canvas.height = this.canvas.parentElement.clientHeight;
        }
        this.canvasHeight = this.canvas.height;
        this.canvasWidth = this.canvas.width;
        this.centerX = this.canvasWidth / 2;
        this.centerY = this.canvasHeight / 2;

        this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.context.globalCompositeOperation = 'multiply';

        this.context.fillStyle = 'rgba(25,25,25,1)';  // Initial clear of the canvas, to avoid an issue where it all gets too dark
        this.context.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        this.self = this;
    }

    setDPI(dpi: number) {
        // Set up CSS size if it's not set up already
        if (!this.canvas.style.width)
            this.canvas.style.width = this.canvas.width + 'px';
        if (!this.canvas.style.height)
            this.canvas.style.height = this.canvas.height + 'px';

        let scaleFactor = dpi / 96;
        this.canvas.width = Math.ceil(this.canvas.width * scaleFactor);
        this.canvas.height = Math.ceil(this.canvas.height * scaleFactor);
        this.context.scale(scaleFactor, scaleFactor);
    }

    createStar(id: number): Star {
        return new Star(this.context, id, this.centerX, this.centerY, this.maxOrbit);
    }

    createStars(count: number) {
        this.stars = [];
        for (let i = 0; i < count; i++) {
            this.stars.push(this.createStar(i));
        }
    }

    start() {
        this.loop();
    }

    stop() {

    }

    loop() {
        this.clearCanvas();
        this.stars.forEach((star: Star) => {
            star.draw(this.currentTime, this.expanded, this.collapsed);
        });

        setTimeout(() => {
            this.loop();
        }, 1000 / 60);
    }

    clearCanvas() {
        this.context.fillStyle = 'rgba(25,25,25,0.2)'; // somewhat clear the context, this way there will be trails behind the stars
        this.context.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
}

class Star {
    context: CanvasRenderingContext2D;
    color: string;
    orbital: number;
    centerX: number;
    centerY: number;
    x: number;
    y: number;
    yOrigin: number;
    speed: number;
    rotation: number;
    startRotation: number;
    collapseBonus: number;
    hoverPos: number;
    expansPos: number;
    prevR: number;
    prevX: number;
    prevY: number;
    id: number;
    trail: number = 1;

    constructor(context: CanvasRenderingContext2D, id: number, centerX: number, centerY: number, maxOrbit: number) {
        this.context = context;
        this.centerX = centerX;
        this.centerY = centerY;
        this.x = centerX;
        this.y = centerY;
        this.id = id;

        // Get a weighted random number, so that the majority of stars will form in the center of the orbit
        let rands = [];
        rands.push(Math.random() * (maxOrbit / 2) + 1);
        rands.push(Math.random() * (maxOrbit / 2) + maxOrbit);

        this.orbital = (rands.reduce(function (p, c) {
            return p + c;
        }, 0) / rands.length);

        this.yOrigin = this.y + this.orbital;  // this is used to track the particles origin
        this.speed = (Math.floor(Math.random() * 2.5) + 1.5) * Math.PI / 180; // The rate at which this star will orbit
        this.rotation = 0; // current Rotation
        this.startRotation = (Math.floor(Math.random() * 360) + 1) * Math.PI / 180; // Starting rotation.  If not random, all stars will be generated in a single line.

        this.collapseBonus = this.orbital - (maxOrbit * 0.7); // This "bonus" is used to randomly place some stars outside of the blackhole on hover
        if (this.collapseBonus < 0) { // if the collapsed "bonus" is negative
            this.collapseBonus = 0; // set it to 0, this way no stars will go inside the blackhole
        }

        this.color = 'rgba(255,255,255,' + (1 - ((this.orbital) / 255)) + ')'; // Color the star white, but make it more transparent the further out it is generated

        this.hoverPos = centerY + (maxOrbit / 2) + this.collapseBonus;  // Where the star will go on hover of the blackhole
        this.expansPos = centerY + (this.id % 100) * -10 + (Math.floor(Math.random() * 20) + 1); // Where the star will go when expansion takes place

        this.prevR = this.startRotation;
        this.prevX = this.x;
        this.prevY = this.y;
    }

    draw(time: number, expanded: boolean = false, collapsed: boolean = false) {
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


        this.prevR = this.rotation;
        this.prevX = this.x;
        this.prevY = this.y;
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
