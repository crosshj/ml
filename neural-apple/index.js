/*
http://cs.stanford.edu/people/karpathy/convnetjs/

*/
let errorDiv;
let iterDiv;

const tOptions = {
	rate: .05,
	iterations: 50,
	error: .01,
	shuffle: true,
	log: 0
};

var input = 20;
var pool = 100;
var output = 1;
var connections = 20;
var gates = 10;

const liqNetOptions = [input, pool, output, connections, gates];
const netOptions = [20, 20, 20, 1];

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

const {
	lenna,
	vader,
	random
} = canvasOps;

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


function neuralize(setter){
	const ctx = this.canvas.getContext('2d');;
	const xmax = this.dimensions.x;
	const ymax = this.dimensions.y;
	const GRID_SIZE = 10;

	var tasksArray = [];

	const allowError = 0.05;

	// const net = new Architect.Perceptron(...netOptions);
	// //const net = new Architect.Liquid(...liqNetOptions);
	// const trainer = new Trainer(net);

	range(0, xmax/GRID_SIZE).forEach((unused_x, x) => {
		range(0, ymax/GRID_SIZE).forEach((unused_y, y) => {
			tasksArray.push((callback) => {
				const id = ctx.getImageData(x*GRID_SIZE, y*GRID_SIZE, GRID_SIZE, GRID_SIZE);
				const set = trainingSetFromImageData(id, GRID_SIZE, GRID_SIZE);

				// requestAnimationFrame(() => {
				//   ctx.putImageData( id, x*GRID_SIZE, y*GRID_SIZE);
				// });

				//tOptions.iterations = 1;
				let iterations = 0;
				function train(){
					trainer.trainAsync(set, tOptions)
						.then(results => {
							//console.log(results);
							imageFromNet(id, setter, GRID_SIZE, GRID_SIZE, net);

							requestAnimationFrame(() => {
								ctx.putImageData( id, x*GRID_SIZE, y*GRID_SIZE);
								errorDiv.textContent = results.error.toFixed(4);
								iterDiv.textContent = iterations;
								if(iterations >= tOptions.iterations){
									return callback();
								}
								if(results.error < tOptions.error){
									return callback();
								}
								iterations+=1;
								train();
							 }); //req anim frame

						}); //then
					}; //train
					train();
				});// tasks array push

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

function filter(setter){
	this.canvas.style.filter = this.canvas.style.filter
		? ''
		: 'url(#myFilter)';
}

var buttons = [{
	text: 'random',
	onClick: random
},{
	text: 'lenna',
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

function ready(){
	var cv = new CanvasPlus(options);
	cv.start();
	errorDiv = ErrorDiv();
	iterDiv = IterDiv();
}

document.addEventListener('DOMContentLoaded', ready, false);

