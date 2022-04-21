window.neuralTriangle = true; //used for testing components

import { htmlToElement, Stepper } from '../shared/misc.js';
//import { PointAdjuster } from './point-adjuster.js';

console.log('NT: deps loaded')

const notes = () => `
<pre class="notes">
Cyborg Neural Network
=====================

I want the outputs from a neural net to be instructions on how to draw something.  That is, I want to graft canvas drawing tools into a NN.

For example, neural network outputs are a set of pixel coordinates that are then used to draw a triangle.  The pixels from this triangle are what are fed into the error function for the neural network.

I am trying to work through what it means to have a 2D error. Since error must be back-propagated, the results of comparing this drawing to the original must be back-propagated through the network.

For this triangle, what points get an error and what does that error look like?

I suspect real brains work like this:
   - knows how to recognize triangles
   - knows how to create triangles
   - knows how to draw match of triangle [current exercise]

Most NN's I have seen or heard about are not organized in this way.  I'd like to see what challenges exist to doing so.

By clicking forward into the steps, we see what I would want NN to do.  Todo, I'd like to see control points overlay on these pixels.

<div class="notes-links">
	<a href="https://caza.la/synaptic/#/">synaptic</a>
	<a href="https://github.com/BrainJS/">brainjs</a>
</div>

</pre>
`

const filters = () => { return `
<svg style="display:none;">
	<filter id="blue" color-interpolation-filters="sRGB" x="0" y="0" height="100%" width="100%">
		<feColorMatrix type="matrix"
			values="
				1 0 0 0 0.0
				1 0 0 0 0.3
				1 0 0 0 0.4
				1 0 0 1 0"
			/>
	</filter>
	<filter id="red" color-interpolation-filters="sRGB" x="0" y="0" height="100%" width="100%">
		<feColorMatrix type="matrix"
			values="
				1 0 0 0 0.5
				1 0 0 0 0.1
				1 0 0 0 0.1
				1 0 0 1 0"
			/>
	</filter>
</svg>

`}
const selector = () => { return `
	<div class="selector">
		<div>
			<div class="previous button"></div>
			<div class="current"></div>
			<div class="next button"></div>
		</div>
	</div>
`}
const visuals = () => { return `
<div id="visuals">
	<div class="canvas-group">	
		<canvas id="original" width="10" height="10"></canvas>
		<canvas class="canvas-overlay" width="1000" height="1000" indicator="#0f07"></canvas>
	</div>
	<div class="canvas-group">
		<canvas id="attempt" width="10" height="10"></canvas>
		<canvas class="canvas-overlay" width="1000" height="1000" indicator="#f007"></canvas>
	</div>
	<canvas id="diff" width="10" height="10"></canvas>
</div>
<div id="labels">
	<div>INPUT</div>
	<div>DRAW</div>
	<div>ERROR</div>
</div>
`};


const body = [
	filters, visuals, selector, notes
].reduce((all, one) => `${all}${one()}`, '');
document.body.innerHTML = body;
const prevButton = document.querySelector('.selector .previous')
const nextButton = document.querySelector('.selector .next')
const currentIndicator = document.querySelector('.selector .current')
document.onclick = () => {
	document.body.classList.add('focused')
}
document.body.onblur = () => {
	document.body.classList.remove('focused')
}

// --------------------------------------------------------------
class Triangle {
	points
	constructor(id, points){
		const canvas = document.getElementById(id);
		const ctx = canvas.getContext('2d');
		this.ctx = ctx;
		this.canvas = canvas;
		this.overlay = canvas.parentNode.querySelector(':scope > .canvas-overlay')
		this.overlayCtx = this.overlay && this.overlay.getContext('2d');
		this.overlayColor = this.overlay && this.overlay.getAttribute('indicator')
		this.erase()
		points && this.draw(points)
	}
	erase = () => {
		this.ctx.fillStyle = "white";
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		if(this.overlayCtx){
			const ctx = this.overlayCtx;
			ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
		}
	}
	draw = (points) => {
		this.erase()
		this.triangle(points)
	}
	triangle = (points) => {
		const {ctx, canvas} = this;
		ctx.fillStyle = "black";
		ctx.beginPath();
		ctx.moveTo(...points[0]);
		ctx.lineTo(...points[1]);
		ctx.lineTo(...points[2]);
		ctx.fill();
		if(this.overlayCtx){
			const pointToArc = (point) => [(point[0])*100, (point[1])*100]
			const ctx = this.overlayCtx;
			ctx.fillStyle = this.overlayColor || "#f007";
			ctx.beginPath();
			ctx.arc(...pointToArc(points[0]), 50, 0, 2 * Math.PI);
			ctx.fill();
			ctx.beginPath();
			ctx.arc(...pointToArc(points[1]), 50, 0, 2 * Math.PI);
			ctx.fill();
			ctx.beginPath();
			ctx.arc(...pointToArc(points[2]), 50, 0, 2 * Math.PI);
			ctx.fill();
		}
	}
	get pixels(){
		const canvasWidth = this.canvas.width;
		const canvasHeight = this.canvas.height;
		var imgData = this.ctx.getImageData(0,0,canvasWidth,canvasHeight);
		const pixels = [];
		for (var y = 0; y < canvasHeight; ++y) {
			for (var x = 0; x < canvasWidth; ++x) {
				const i = (y * canvasWidth + x) * 4;
				pixels.push([
					imgData.data[i+0],
					imgData.data[i+1],
					imgData.data[i+2],
					imgData.data[i+3],
				])
			}
		}
		return pixels;
	}
}

class Diff {
	constructor(id, first, second){
		const canvas = document.getElementById(id);
		const ctx = canvas.getContext('2d');
		this.ctx = ctx; this.canvas = canvas;
	}
	erase = () => {
		this.ctx.fillStyle = "white";
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	}
	draw = (first, second) => {
		this.erase()
		this.diff(first, second)
	}
	diff = (first, second) => {
		const canvasWidth = this.canvas.width;
		const canvasHeight = this.canvas.height;
		var imgData = this.ctx.getImageData(0,0,canvasWidth,canvasHeight);
		const firstPixels = first.pixels;
		const secondPixels = second.pixels;
		for (var y = 0; y < canvasHeight; ++y) {
			for (var x = 0; x < canvasWidth; ++x) {
				const i = (y * canvasWidth + x);
				const [r,g,b,a] = [
					255-Math.abs(firstPixels[i][0] - secondPixels[i][0]),
					255-Math.abs(firstPixels[i][1] - secondPixels[i][1]),
					255-Math.abs(firstPixels[i][2] - secondPixels[i][2]),
					255
				]
				this.ctx.fillStyle = "rgba("+r+","+g+","+b+","+(a/255)+")";
				this.ctx.fillRect( x, y, 1, 1 );
			}
		}
	}
}

const originalPoints = [[9,9], [5,1], [1,9]]
const original = new Triangle('original', originalPoints)

//const adjuster = new PointAdjuster(original.pixels)

const steps = [
	[[8,10],[9,3],[0,5]],
	[[8,10],[8,3],[1,6]],
	[[8,10],[7,2],[1,7]],
	[[8,10],[6,1],[1,8]],
	[[9,9],[5,1],[1,8]],
	[[9,9],[5,1],[1,9]],
];


let attempt, diff;
const onStep = (number, step) => {
	nextButton.classList.add('disabled');
	prevButton.classList.add('disabled');
	currentIndicator.innerHTML = number;
	if(number > 0 && number < steps.length-1){
		nextButton.classList.remove('disabled');
		prevButton.classList.remove('disabled');
	}
	if(number === 0){
		nextButton.classList.remove('disabled');
	}
	if(number === steps.length-1){
		prevButton.classList.remove('disabled');
	}

	attempt = attempt || new Triangle('attempt')
	diff = diff || new Diff('diff')
	attempt.draw(step)
	diff.draw(original, attempt)
}
const stepper = new Stepper(steps, onStep)

nextButton.onclick = stepper.next
prevButton.onclick = stepper.prev