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
	body { overflow: hidden; }
`, 0);

const style = `
:host {
	position: absolute;
	left: 0; top: 0; bottom: 0; right: 0;
}

.hidden { display: none; }

.background,
.container {
	visibility: visible;
}
.background.loading,
.container.loading {
	visibility: hidden;
}

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
	background-color: #101010
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
	user-select: none;
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
.controls #run {
	margin-right: auto;
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

function setBodyBack(image, callback){
	const { canvas, bgImage } = this;
	const setBg = () => {
		const imageDataUri = canvas.toDataURL('image/png');
		bgImage.style.backgroundImage = `url(${imageDataUri})`;
		callback && callback();
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


function changeImage(which, callback) {
	const _setBodyBack = setBodyBack.bind(this);
	if(!canvasOps[which]) return;
	//todo: call event to put component in loading state
	sessionStorage.setItem('neural-net-image', which);
	const { canvas } = this;
	const dimensions = {
		x: 160,
		y: 120
	};
	const image = canvasOps[which].bind({ canvas, dimensions })(setImageDataPixel);
	_setBodyBack(image, callback);
	this.canvasReadOnly = undefined;
}

function cloneCanvas(oldCanvas) {
	const newCanvas = document.createElement('canvas');
	const context = newCanvas.getContext('2d');
	newCanvas.width = oldCanvas.width;
	newCanvas.height = oldCanvas.height;
	context.drawImage(oldCanvas, 0, 0);
	return newCanvas;
}

function readBlock({ x, y, xOffset=0, yOffset=0, width, height }){
	if(!this.canvasReadOnly){
		this.canvasReadOnly = cloneCanvas(this.canvas);
	}
	const ctx = this.canvasReadOnly.getContext('2d');;
	const id = ctx.getImageData(x*10+xOffset, y*10+xOffset, width, height);
	const set = [];
	return { id, set };
}
function writeBlock({x, y, width, height, imageData }){
	if(!imageData) return;
	let resolver;
	window.requestAnimationFrame(() => {
		const ctx = this.canvas.getContext('2d');
		ctx.putImageData(imageData, x*width, y*height);
		resolver();
	});
	return new Promise((resolve) => resolver = resolve);
}

async function ready(){
	const {
		refreshButton, runButton, pauseButton,
		imageSelector, inputImages, changeImage,
		functionSelector, inputFunctions, changeFunction,
		loadedHandlers, loadedCallback
	} = this;
	const _ShowOverlayBlock = ShowOverlayBlock.bind(this);
	
	const imageOptions = inputImages.map(x => {
		return {
			name: x.name || x.getAttribute('value'),
			value: x.getAttribute('value') || x.name
		}
	});
	imageSelector.innerHTML = imageOptions
		.sort((a,b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()) )
		.map(SelectOption)
		.join('\n');
	imageSelector.value = sessionStorage.getItem('neural-net-image') || imageOptions[0]?.value;
	imageSelector.onchange = () => changeImage(imageSelector.value);

	const fnOptions = inputFunctions.map(x => {
		return {
			name: x.getAttribute('name') || x.getAttribute('event'),
			value: x.getAttribute('event') || x.getAttribute('name')
		}
	});
	functionSelector.innerHTML = fnOptions
		.sort((a,b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()) )
		.map(SelectOption)
		.join('\n');
	functionSelector.value = sessionStorage.getItem('neural-net-fn') || fnOptions[0]?.value;
	functionSelector.onchange = () => changeFunction(functionSelector.value);

	refreshButton.onclick = () => {
		_ShowOverlayBlock();
		changeImage(imageSelector.value);
		runButton.classList.remove('hidden');
		pauseButton.classList.add('hidden');
		this.paused = 'canceled';
	}
	runButton.onclick = async () => {
		runButton.classList.add('hidden');
		pauseButton.classList.remove('hidden');

		if(this.paused && this.paused.resolve){
			this.paused.finally(() => {
				delete this.paused;
			});
			this.paused.resolve();
			return;
		}
		if(this.paused && !this.paused.resolve){
			delete this.paused;
		}
		const { currentFunction, functions } = this;
		if(!functions[currentFunction]){
			console.log('Function not defined: ' + currentFunction);
			return;
		}
		for(var [x] of new Array(16).entries()){
			//if(x===0) continue;
			for(var [y] of new Array(12).entries()){
				//if(y===0) continue;
				if(this.paused){
					const status = await this.paused;
					if(status === 'canceled') break;
				}
				_ShowOverlayBlock(x,y);
				const { id } = readBlock.bind(this)({
					x, y, width: 10, height: 10
				});
				const readImage = (offset) => readBlock.bind(this)({
					x, y,
					xOffset: offset.x,
					yOffset: offset.y,
					width: 10 + (offset.width || 0),
					height: 10 + (offset.height || 0),
				});
				const newImgData = await functions[currentFunction]({
					x, y, id, readImage
				});
				await writeBlock.bind(this)({
					x, y, width: 10, height: 10, imageData: newImgData
				});
			}
		}
		this.canvasReadOnly = cloneCanvas(this.canvas);
		_ShowOverlayBlock();
		runButton.classList.remove('hidden');
		pauseButton.classList.add('hidden');
	}
	pauseButton.onclick = async () => {
		let pausedResolve;
		this.paused = new Promise((resolve ) =>{ pausedResolve = resolve; });
		this.paused.resolve = pausedResolve;

		runButton.classList.remove('hidden');
		pauseButton.classList.add('hidden');
	};
	await changeFunction(functionSelector.value);
	await changeImage(imageSelector.value);
	await loadedCallback.bind(this)();
}


class Container extends HTMLElement {
	constructor() {
		super();
		//this.shadow = this.attachShadow({ mode: 'closed' });
		this.attachShadow({ mode: 'open' });

		const fontAwesome = document.createElement("link");
		fontAwesome.rel = "stylesheet";
		fontAwesome.href = "https://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css";
		document.head.appendChild(fontAwesome);

		this.shadowRoot.innerHTML = `
		<style>${style}</style>

		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">

		<div class="background loading"><div id="bg-image"></div></div>
		<div class="container loading">
			<div class="canvas-container">
				<canvas id="canvas1" width="160" height="120"></canvas>
				<canvas id="canvas-overlay" width="480" height="360"></canvas>
			</div>
			<div class="controls">
				<div id="run">
					<button id="play">
						<i class="fa fa-play"></i>
					</button>
					<button id="pause" class="hidden">
						<i class="fa fa-pause"></i>
					</button>
				</div>
				<button id="refresh">
					<i class="fa fa-refresh"></i>
				</button>
				<select name="function" id="function-selector"></select>
				<select name="image" id="image-selector"></select>
			</div>
			<slot name="notes"></slot>
			<slot name="images"></slot>
			<slot name="functions"></slot>
		</div>
		`
		this.functions = [];
		this.loadedHandlers = [];
		this.container = this.shadowRoot.querySelector('.container');
		this.background = this.shadowRoot.querySelector('.background');
		this.bgImage = this.shadowRoot.querySelector('#bg-image');
		this.canvas = this.shadowRoot.querySelector('.container #canvas1');
		this.canvasOverlay = this.shadowRoot.querySelector('.container #canvas-overlay');
		this.overlayCtx = this.canvasOverlay.getContext("2d");

		this.runButton = this.shadowRoot.querySelector('#play');
		this.pauseButton = this.shadowRoot.querySelector('#pause');
		this.refreshButton = this.shadowRoot.querySelector('#refresh');

		this.imageSelector = this.shadowRoot.querySelector('#image-selector');
		this.imagesSlot = this.shadowRoot.querySelector('slot[name="images"]');
		this.inputImages = Array.from(this.imagesSlot.assignedElements({flatten: true})?.[0]?.children);

		this.functionSelector = this.shadowRoot.querySelector('#function-selector');
		this.functionsSlot = this.shadowRoot.querySelector('slot[name="functions"]');
		this.inputFunctions = Array.from(this.functionsSlot.assignedElements({flatten: true})?.[0]?.children);

		this.notesSlot = this.shadowRoot.querySelector('slot[name="notes"]');
		
		this.changeImage = async (which) => {
			this.imageSelector.value = which;
			await new Promise((resolve) => {
				changeImage.bind(this)(which, resolve);
			})
		};
		this.changeFunction = async (which) => {
			sessionStorage.setItem('neural-net-fn', which);
			this.currentFunction = which;
		};
		this.ready = ready.bind(this)();
	}
	connectedCallback() {

	}
	disconnectedCallback() {
		this.loaded = false;
	}
	async loadedCallback(){
		const { container, background } = this;
		for(const handler of this.loadedHandlers){
			await handler.bind(this)();
		}
		this.loaded = true;
		background.classList.remove('loading');
		container.classList.remove('loading');
	}
	onLoad(handler){
		this.loadedHandlers.push(handler);
	}
	setNotes(text){
		this.notesSlot.innerHTML = `<pre>${text.trim()}</pre>`;
	}
}
customElements.define('neural-container', Container);

export default {};
