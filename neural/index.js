import '../shared/components/container.js';
import convnetjs from 'https://cdn.skypack.dev/convnetjs';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const NeuralContainer = document.querySelector('neural-container');
const { CanvasText } = NeuralContainer;
const {Architect, Trainer} = synaptic;
const {
	spread,
	shrink,
	intToBitArray,
	intToOneBitInArray,
	getXBeforeBalance,
	getYBeforeBalance,
	getLeftUpDiagBalance,
	getRightUpDiagBalance
} = pixelOps;

const GRID_SIZE = 10;

const tOptions = {
	rate: .03,
	iterations: 100,
	error: .002,
	shuffle: true,
	log: 0
};
const netOptions = [20, 20, 1];


const notes = `
todo:
	- PARITY: svg filter
	- image error map
	- indicate rate of change in network

is anything really be learned here?
does enything get stored in long-term memory?
why do solid-colored blocks later in cause traning to hang?

what if after training, network could decide to not change?
	- change costed too much, won't learn this (adapt vs not)
	- change costed too much, will fork or use another fork (memory)

a nn with error set high is lossy.
if it is trained on its own output, does it reach a lossless state?
in this case, what's left of input?
does traning get faster?
`;
NeuralContainer.setNotes(notes.replace(/\t/g, '   '));

const Extra = (() => {
	const div = document.createElement('div');
	div.id = 'extra-controls'
	div.innerHTML = `
		<style>
			#extra-controls {
				display: flex;
				flex-direction: column;
				width: 100%;
				font-family: arial;
			}
			#indicators {
				display: flex;
				flex-direction: row;
				justify-content: space-between;
				background: #2b2b2b;
				box-shadow: inset 0px 2px 6px -3px black;
			}
			#iterations > div,
			#error > div {
				padding: 0.5em;
			}
			#results {
				width: 300px;
				height: 200px;
				background: #222222;
				margin: auto;
				left: 0;
				right: 0;
				display: grid;
				grid-template-rows: repeat(12, 1fr);
				grid-template-columns: repeat(16, 1fr);
				grid-auto-flow: column;
				font-size: 9px;
				font-family: monospace;
				color: white;
				margin-bottom: 1em;
				margin-top: 2em;
				box-shadow: 0px 0px 10px 0px #111111;
			}
			#results > div {
				background: #333;
				text-align: center;
				display: flex;
				justify-content: center;
				align-items: center;
			}
		</style>
		<div id="indicators">
			<div id="iterations"></div>
			<div id="error"></div>
		</div>
		<div id="results"></div>
	`;
	NeuralContainer.extend.append(div);
	return div
})();

const iterDiv = Extra.querySelector('#iterations');
iterDiv.set = (x) => iterDiv.innerHTML = '<div>iterations: ' + x + '</div>';
iterDiv.clear = () => iterDiv.innerHTML = "";
const errorDiv = Extra.querySelector('#error');
errorDiv.set = (x) => errorDiv.innerHTML = '<div>error: ' + x + '</div>';
errorDiv.clear = () => iterDiv.innerHTML = "";

const gradient = (x, max) => {
	const r = Math.floor((x/max) * 255);
	const g = 0;
	const b = 255 - r;
	return `rgb(${r},${g},${b})`;
}

const { set: setResults, reset: resetResults } = (() => {
	const div = Extra.querySelector('#results');
	div.style.display = 'none';
	return {
		set: ({ iterations, error }) => {
			div.style.display = 'grid';
			const square = document.createElement('div');
			square.textContent = iterations;
			square.style.backgroundColor = gradient(iterations, 100);
			div.append(square);
		},
		reset: () => {
			div.style.display = 'none';
			div.innerHTML = '';
		}
	};
})();

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
		if(i%4-1 != 0) return;
		//green
		if(max < x){ max = x; }
		if(min > x){ min = x; }
	});
	for(var [x] of new Array(xmax).entries()){
		for(var [y] of new Array(ymax).entries()){
			const offset = xmax*y*4 + x*4;
			results.push({
				input: getInputs(id, x, y, xmax, ymax),
				output: [
					spread(id.data[offset + 1],max,min)/255
				]
			});
		}
	}
	return results;
}

function imageFromNet(id, setter, xmax, ymax, nt){
	for(var [x] of new Array(xmax).entries()){
		for(var [y] of new Array(ymax).entries()){
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
		}
	}
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

	const callback = (results) => {
		setResults({ iterations, error: results?.error });
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

		errorDiv.set(testResults.error.toFixed(4));
		iterDiv.set(iterations);

		if(!iterOkay) return callback();
		if(errorOkay) return callback();

		await trainer.trainAsync(set, tOptions);
		train({ ...args, iterations: iterations+1 });
	 });
};

function setImageDataPixel(imageData, {r=0, g=0, b=0, a=255}, {x=0, y=0, xmax=1}){
	const ad = imageData.data;
	const rowOffset = y * 4 * xmax;
	const colOffset = x * 4;
	const offset = rowOffset + colOffset;
	ad[offset + 0]   = r;
	ad[offset + 1]   = g;
	ad[offset + 2]   = b;
	ad[offset + 3]   = a;
}

const neural = async (args) => new Promise((resolve) => {
	const {x, y, id, readImage} = args;
	const ctx = NeuralContainer.canvas.getContext("2d");

	const set = trainingSetFromImageData(id, GRID_SIZE, GRID_SIZE);
	train({
		x, y,
		ctx,
		set,
		id,
		setter: setImageDataPixel,
		callback: resolve
	});
});

NeuralContainer.functions = {
	neural,
};

NeuralContainer.onLoad(async () => {
	//NeuralContainer.runButton.onclick()
});
