import canvasOps from '../shared/canvasOps.js';

/*
http://cs.stanford.edu/people/karpathy/convnetjs/

*/
let errorDiv;
let iterDiv;
let setResults;
let resetResults;

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
	getRightUpDiagBalance
} = pixelOps;

function getInputs(id, x, y, xmax, ymax){
	//position metrics
	const xyInputs = intToBitArray(y,8).concat(intToBitArray(x,8));
	//other metrics
	const yBefore = getYBeforeBalance(id, x, y, xmax);
	const xBefore = getXBeforeBalance(id, x, y, xmax);
	const leftUp = getLeftUpDiagBalance(id, x, y, xmax);
	const rightUp = getRightUpDiagBalance(id, x, y, xmax);

	const inputs = xyInputs.concat([yBefore, xBefore, leftUp, rightUp]);
	return inputs;
}

function trainingSetFromImageData(id, xmax, ymax){
	var results = [];
	var max = 0;
	var min = 255;
	id.data.forEach((x,i)=>{
		if(i%4-1===0){ //green
			if(max < x){ max = x; }
			if(min > x){ min = x; }
		}
	});

	range(0, xmax).forEach((unused_x, x) => {
		range(0, ymax).forEach((unused_y, y) => {
			const offset = xmax*y*4 + x*4;
			results.push({
				input: getInputs(id, x, y, xmax, ymax),
				output: [
					spread(id.data[offset + 1],max,min)/255
				]
			});

		});
	});

	return results;
}

function imageFromNet(id, setter, xmax, ymax, nt){
	range(0, xmax).forEach((unused_x, x) => {
		range(0, ymax).forEach((unused_y, y) => {
			const offset = xmax*y*4 + x*4;
			var greenOutput = nt.activate(
				getInputs(id, x, y, xmax, ymax)
			)[0];
			greenOutput = shrink(greenOutput * 255)
			var _color = {
				r: 0,
				g: greenOutput,
				b: 0,
				a: 255
			};
			setter(id, _color, {x, y, xmax});
		});
	});
	return id;
}


const net = new Architect.Perceptron(...netOptions);
//const net = new Architect.Liquid(...liqNetOptions);
const trainer = new Trainer(net);

function activateNet(set){
	const error = [];
	for(const {input, output} of set){
		const out = net.activate(input)[0];
		error.push((out - output[0]) ** 2)
	}
	return {
		error: Math.max(...error)*0.01
	};
}


function train(args){
	const { x, y, ctx, set, setter, id, iterations=0, callback: cb } = args;

	const callback = () => {
		setResults({ iterations, error: results.error });
		cb();
	};

	imageFromNet(id, setter, GRID_SIZE, GRID_SIZE, net);
	//const testResults = activateNet(set);
	const testResults = trainer.test(set, {
		...tOptions,
		error: tOptions.error*0.1
	});
	const errorOkay = testResults.error < tOptions.error;
	const iterOkay = iterations < tOptions.iterations;
	if(errorOkay || !iterOkay){
		imageFromNet(id, setter, GRID_SIZE, GRID_SIZE, net);
	}

	requestAnimationFrame(async () => {
		ctx.putImageData( id, x*GRID_SIZE, y*GRID_SIZE);

		errorDiv.textContent = testResults.error.toFixed(4);
		iterDiv.textContent = iterations;

		if(!iterOkay) return callback();
		if(errorOkay) return callback();

		await trainer.trainAsync(set, tOptions);
		train({ ...args, iterations: iterations+1 });
	 });
};

function neuralize(setter){
	resetResults();
	const ctx = this.canvas.getContext('2d');;
	const xmax = this.dimensions.x;
	const ymax = this.dimensions.y;

	var tasksArray = [];

	range(0, xmax/GRID_SIZE).forEach((unused_x, x) => {
		range(0, ymax/GRID_SIZE).forEach((unused_y, y) => {
			tasksArray.push((callback) => {
				const id = ctx.getImageData(x*GRID_SIZE, y*GRID_SIZE, GRID_SIZE, GRID_SIZE);
				const set = trainingSetFromImageData(id, GRID_SIZE, GRID_SIZE);
				train({ x, y, ctx, set, id, setter, callback });
			});
		});
	});

	var task = 0;
	var taskCallback = ()=>{
		task+=1;
		if(task >= tasksArray.length){ return; }
		tasksArray[task](taskCallback);
	};
	tasksArray[task](taskCallback);
}

function filter(){
	this.canvas.style.filter = this.canvas.style.filter
		? ''
		: 'url(#myFilter)';
}

const {
	lenna,
	vader,
	nnTest1,
	random
} = canvasOps;

var buttons = [{
	text: 'random',
	onClick: random
},{
	text: 'nntest1',
	onClick: nnTest1
},{
	text: 'lena',
	onClick: lenna
},{
	text: 'vader',
	onClick: vader
},{
	text: 'filter',
	onClick: filter
}, {
	text: 'neural',
	onClick: neuralize
}];


var options = {
	init: random,
	buttons
};

const ErrorDiv = () => {
	const div = document.createElement('div');
	div.id = "error";
	document.body.append(div);
	return div
};

const IterDiv = () => {
	const div = document.createElement('div');
	div.id = "iterations";
	document.body.append(div);
	return div
};

const ResultsDiv = () => {
	const canvasContainer = document.getElementById('canvas-container');
	const div = document.createElement('div');
	div.id = "results";
	canvasContainer.append(div);
	return {
		set: ({ iterations, error }) => {
			const square = document.createElement('div');
			square.textContent = iterations;
			div.append(square);
		},
		reset: () => {
			div.innerHTML = '';
		}
	};
};

function ready(){
	var cv = new CanvasPlus(options);
	cv.start();
	errorDiv = ErrorDiv();
	iterDiv = IterDiv();
	({ set: setResults, reset: resetResults } = ResultsDiv());
}

document.addEventListener('DOMContentLoaded', ready, false);

