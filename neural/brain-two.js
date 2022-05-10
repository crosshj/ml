import brain from 'https://cdn.skypack.dev/brain.js';
import brainStored from './brain-two.json'  assert { type: 'json' };
let net;
let trainer;
let tOptions;
let netOptions;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const init = (args) => {
	({ tOptions, netOptions } = args);
	
	tOptions = {
		//...tOptions,
		log: false,
		errorThresh: tOptions.error,
		iterations: 1,
	};
	netOptions = {
		// //...netOptions,
		inputSize: 10*10,
		inputRange: 255,
		hiddenLayers: [75, 100, 1200, 400],
		activation: 'sigmoid',
		//activation: 'relu',
		//activation: 'leaky-relu', // supported activation types: ['sigmoid', 'relu', 'leaky-relu', 'tanh'],
		//leakyReluAlpha: 0.01, // supported for activation type 'leaky-relu'
		outputSize: 10*10,
		learningRate: 0.3,
		decayRate: 0.5,
	};
	const net = new brain.NeuralNetworkGPU(netOptions);
	//net.fromJSON(brainStored);
	const trainer = net;
	net.activate = net.run;
	net.initialize();

	return { net, trainer }
};

const trainArray = (id, xmax, ymax) => {
	const array = [];
	for(var [y] of new Array(ymax).entries()){
		for(var [x] of new Array(xmax).entries()){
			const offset = xmax*y*4 + x*4;
			array.push({
				x,
				y,
				channel: 1,
				value: id.data[offset+1/*green channel*/] / 255,
				r: id.data[offset] / 255,
				g: id.data[offset+1] / 255,
				b: id.data[offset+2] / 255,
			});
		}
	}
	return array;
};

function imageFromNet(id, setter, xmax, ymax, nt){
	for(var [x] of new Array(xmax).entries()){
		for(var [y] of new Array(ymax).entries()){
			const offset = xmax*y*4 + x*4;
			var output = nt[y*xmax + x];
			let greenOutput = 255*output;
			if(greenOutput > 255) greenOutput = 255;
			if(greenOutput < 0) greenOutput = 0;
			var _color = {
				r: 0,
				g: Math.floor(greenOutput),
				b: 0,
				a: 255
			};
			setter(id, _color, {x, y, xmax});
		}
	}
	return id;
}

function imageFromNetRGB(id, setter, xmax, ymax, nt){
	var [r,g,b] = nt;
	for(var [x] of new Array(xmax).entries()){
		for(var [y] of new Array(ymax).entries()){
			var _color = {
				r: Math.floor(r[y*xmax + x]*255),
				g: Math.floor(g[y*xmax + x]*255),
				b: Math.floor(b[y*xmax + x]*255),
				a: 255
			};
			setter(id, _color, {x, y, xmax});
		}
	}
	return id;
}

const render = ({ ctx, id, x, y }) => new Promise((resolve) => {
	requestAnimationFrame(() => {
		ctx.putImageData( id, x, y);
		resolve();
	});
});

const train = async (args) => {
	const { x, y, pass, ctx, id, setter } = args;

	if(x === 0 && y === 0 && pass > 0){
		await delay(1000);
		args.resetImage();
		await delay(1000);
	}

	if(!net) ({net, trainer} = init(args));

	const GRID_SIZE = 10;
	const xmax = 10;
	const ymax = 10;

	const trainData = trainArray(id, xmax, ymax).map(x => x.value);

	const max_iter = Math.random() > 0.95
		? 100
		: tOptions.iterations;

	var it=0;
	for([it] of new Array(1||max_iter).entries()) {
		const output = net.activate(trainData);
		imageFromNet(id, setter, xmax, ymax, output);
		await render({ ctx, id, x: x*GRID_SIZE, y: y*GRID_SIZE });

		//const testResults = trainer.train([{ input: trainData, output: trainData }]);
		const testResults = trainer.train([{ input: trainData, output: trainData }],{
			...tOptions,
			iterations: tOptions.iterations === max_iter
				? 5
				: 5
		});
		args.setError(testResults.error);
		args.setIterations(it*10);

		const errorOkay = testResults.error < tOptions.errorThresh;
		if(errorOkay){
			const output = net.activate(trainData);
			imageFromNet(id, setter, xmax, ymax, output);
			await render({ ctx, id, x: x*GRID_SIZE, y: y*GRID_SIZE });
			break;
		}

		// trainer.train([
		// 	{
		// 		input: trainData,
		// 		output: trainData
		// 	}
		// ], tOptions);
	}
	args.setResults({ iterations: it });
	args.callback();
};

const activate = (args) => {
	const { x, y, ctx, id, setter } = args;

	if(!net) ({net, trainer} = init(args));
	if(args.x === 0 && args.y === 0) args.hideResults();

	const GRID_SIZE = 10;
	const xmax = 10;
	const ymax = 10;

	const output = []
	for(let color of ["r","g","b"]){
		const trainData = trainArray(id, xmax, ymax).map(x => x[color]);
		output.push(net.activate(trainData));
	}
	return imageFromNetRGB(id, setter, xmax, ymax, output);
};

export default {
	train,
	activate
}
