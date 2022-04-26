import canvasOps from '../canvasOps.js';
import '../pixelOps.js';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const {
	clone,
	range,
	spread,
	shrink,
	intToBitArray,
	intToOneBitInArray,
	getXBeforeBalance,
	getYBeforeBalance,
	getLeftUpDiagBalance,
	getRightUpDiagBalance,
	setImageDataPixel
} = pixelOps;

var outerStyleSheet = document.createElement('style');
outerStyleSheet.id = 'neural-container-style';
document.head.appendChild(outerStyleSheet);
outerStyleSheet.sheet.insertRule(`
	neural-container {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		right: 0;
	}
`, 0);
outerStyleSheet.sheet.insertRule(`
	body { overflow: hidden; }
`, 1);

const style = `

#bg-image {
	position: absolute;
	top: 0px;
	bottom: 0px;
	left: 0px;
	right: 0px;
	background-size: cover;
	filter: blur(10px) brightness(0.2);
	background-color: transparent;
	margin: -20px -20px -20px -20px;
	z-index: -1;
}
@media only screen and (max-width: 600px) {
	#bg-image { display: none; }
}
.container {
	height: 100vh;
	max-width: 820px;
	width: 100vw;
	margin: auto;
	background: #222;
	display: flex;
	flex-direction: column;
}
@media only screen and (min-width: 1100px) {
	.container {
		max-width: 900px;
	}
}
::slotted(images) {
	display: none;
}
.canvas-container,
.canvas-container #canvas1 {
	position: relative;
	display: flex;
}
.canvas-container canvas {
	position: absolute;
	width: 100%;
	image-rendering: pixelated;
	top:0;
	left:0;
	right:0;
	bottom: 0;
}


select {
	background-color: transparent;
	border: 0;
	outline: 0;
	appearance: none;
}
select:focus, select:active {
	border:0;
	outline:0;
}
.controls {
	background: #333333;
	color: #aaa;
	padding: .5em;
	font-size: 1.1em;
	display: flex;
	justify-content: flex-end;
}
@media only screen and (max-width: 600px) {
	.controls { font-size: 0.75em; }
}
.controls select {
	box-shadow:
		inset 0px 0px 15px 0 #0003,
		inset 0 0 1px #000d;
}
.controls > * + * {
	margin-left: 0.5em;
}
.controls select,
.controls button {
	font-size: inherit;
	color: inherit;
	background: transparent;
	border-radius: 3px;
	border: 0;
	padding: 0.1em 0.5em;
}
.controls select:hover,
.controls button:hover {
	cursor: pointer;
	user-select: none;
	background: #555;
	color: white;
	box-shadow: 0 1px 0 0 black;
}

::slotted(pre), pre {
	white-space: pre-wrap;
	padding: 2em;
	margin: 0;
}
@media only screen and (max-width: 600px) {
	::slotted(pre), pre {
		font-size: .8em;
		padding: 0.5em;
	}
}
`.trim();

const SelectOption = ({ name, value}) => `<option value="${value}">${name}</option>`

function changeImage(which) {
	if(!canvasOps[which]) return;
	const { canvas } = this;
	const dimensions = {
		x: 160,
		y: 120
	};
	return canvasOps[which].bind({ canvas, dimensions })(setImageDataPixel);
}

function ShowOverlayBlock(x,y){
	const { overlayCtx: ctx, canvasOverlay } = this;
	const {width, height} = canvasOverlay;
	if(typeof x === 'undefined'){
		ctx.clearRect(0, 0, width, height);
		return;
	}
	ctx.clearRect(0, 0, width, height);
	ctx.beginPath();
	// ctx.rect(x*10, y*10, 10, 10);
	// ctx.fillStyle = "rgba(0, 255, 195, 0.5)"
	// ctx.fill();
	ctx.strokeStyle = "rgba(0, 255, 195, 1)";
	ctx.strokeRect((x*30)-0.5, (y*30)-0.5, 31, 31);
}

function setBodyBack(image){
	const { canvas, bgImage } = this;
	const setBg = () => {
		const imageDataUri = canvas.toDataURL('image/png');
		bgImage.style.backgroundImage = `url(${imageDataUri})`;
	};
	if(!image) return setTimeout(setBg, 1);
	image.addEventListener('load', setBg);
}

// canvasOverlay.onmousemove = function(e) {
// 	const ctx = overlayCtx;
// 	const canvas = canvasOverlay;

// 	const rect = canvas.getBoundingClientRect();
// 	const scaleX = canvas.width / rect.width;
// 	const scaleY = canvas.height / rect.height;
// 	const x = Math.floor((e.clientX - rect.left) * scaleX);
// 	const y = Math.floor((e.clientY - rect.top) * scaleY);

// 	ShowOverlayBlock(
// 		Math.floor(x/30),
// 		Math.floor(y/30)
// 	);
// };

function ready(){
	const {
		imageSelector, refreshButton, runButton, inputImages, changeImage
	} = this;
	const _setBodyBack = setBodyBack.bind(this);
	const _ShowOverlayBlock = ShowOverlayBlock.bind(this);
	
	const imageOptions = inputImages.map(x => {
		return {
			name: x.name || x.getAttribute('value'),
			value: x.getAttribute('value') || x.name
		}
	});

	imageSelector.innerHTML = imageOptions //Object.keys(canvasOps)
		.sort((a,b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()) )
		.map(SelectOption)
		.join('\n');
	imageSelector.value = sessionStorage.getItem('neural-net-image') ||
		Object.keys(canvasOps)[0];
	imageSelector.onchange = () => {
		sessionStorage.setItem('neural-net-image', imageSelector.value)
		const image = changeImage(imageSelector.value);
		_setBodyBack(image);
	}
	refreshButton.onclick = () => {
		_ShowOverlayBlock();
		changeImage(imageSelector.value);
	}
	runButton.onclick = async () => {
		for(var [x] of new Array(16).entries()){
			for(var [y] of new Array(12).entries()){
				_ShowOverlayBlock(x,y);
				await delay(50)
			}
		}
	}
	imageSelector.onchange();
}


class Container extends HTMLElement {
	constructor() {
		super();
		//this.shadow = this.attachShadow({ mode: 'closed' });
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.innerHTML = `
		<style>${style}</style>
		<div class="background"><div id="bg-image"></div></div>
		<div class="container">
			<div class="canvas-container">
				<canvas id="canvas1" width="160" height="120"></canvas>
				<canvas id="canvas-overlay" width="480" height="360"></canvas>
			</div>
			<div class="controls">
				<select name="image" id="image-selector"></select>
				<button id="refresh">REFRESH</button>
				<button id="run">RUN</button>
			</div>
			<slot name="notes"></slot>
			<slot name="images"></slot>
		</div>
		`
	}
	connectedCallback() {
		this.bgImage = this.shadowRoot.querySelector('#bg-image');
		this.imageSelector = this.shadowRoot.querySelector('#image-selector');
		this.canvas = this.shadowRoot.querySelector('.container #canvas1');
		this.canvasOverlay = this.shadowRoot.querySelector('.container #canvas-overlay');
		this.refreshButton = this.shadowRoot.querySelector('#refresh');
		this.runButton = this.shadowRoot.querySelector('#run');
		this.overlayCtx = this.canvasOverlay.getContext("2d");
		this.imagesSlot = this.shadowRoot.querySelector('slot[name="images"]');
		this.notesSlot = this.shadowRoot.querySelector('slot[name="notes"]');
		this.inputImages = Array.from(this.imagesSlot.assignedElements({flatten: true})?.[0]?.children);
		
		this.changeImage = changeImage.bind(this);
		ready.bind(this)();
		this.connected = true;
		console.log('connected');
	}
	disconnectedCallback() {
		this.connected = false;
	}
	onLoad(handler){
		//handler();
		//console.log('onload');
		// add listener + optionally trigger said listener if already connected
	}
	setNotes(text){
		this.notesSlot.innerHTML = `<pre>${text.trim()}</pre>`;
	}
}
customElements.define('neural-container', Container);

export default {};
