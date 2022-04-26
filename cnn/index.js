import canvasOps from '../shared/canvasOps.js';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const bgImage = document.querySelector('#bg-image');
const imageSelector = document.querySelector('#image-selector');
const canvas = document.querySelector('.container #canvas1');
const canvasOverlay = document.querySelector('.container #canvas-overlay');
const refreshButton = document.querySelector('#refresh');
const runButton = document.querySelector('#run');

let errorDiv;
let iterDiv;
let setResults;
let resetResults;

const overlayCtx = canvasOverlay.getContext("2d");

const tOptions = {
	rate: .01,
	iterations: 500,
	error: .0005,
	shuffle: false,
	log: 0
};

const GRID_SIZE = 10;

var input = 20;
var pool = 100;
var output = 1;
var connections = 20;
var gates = 10;

const liqNetOptions = [input, pool, output, connections, gates];
const netOptions = [20, 21, 1];

const {Architect, Trainer} = synaptic;
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


var options = {
	parent: ''
};

const SelectOption = (x) => `<option value="${x}">${x}</option>`

function changeImage(which) {
	const dimensions = {
		x: 160,
		y: 120
	};
	return canvasOps[which].bind({ canvas, dimensions })(setImageDataPixel);
}

function ShowOverlayBlock(x,y){
	const ctx = overlayCtx;
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
	imageSelector.innerHTML = Object.keys(canvasOps)
		.map(SelectOption).join('\n');
	imageSelector.value = sessionStorage.getItem('neural-net-image') ||
		Object.keys(canvasOps)[0];

	imageSelector.onchange = () => {
		sessionStorage.setItem('neural-net-image', imageSelector.value)
		const image = changeImage(imageSelector.value);
		setBodyBack(image);
	}
	refreshButton.onclick = () => {
		ShowOverlayBlock();
		changeImage(imageSelector.value);
	}
	runButton.onclick = async () => {
		for(var [x] of new Array(16).entries()){
			for(var [y] of new Array(12).entries()){
				ShowOverlayBlock(x,y);
				await delay(50)
			}
		}
	}

	imageSelector.onchange();
}

document.addEventListener('DOMContentLoaded', ready, false);

