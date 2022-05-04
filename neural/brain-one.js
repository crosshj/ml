import brain from 'https://cdn.skypack.dev/brain.js';
import brainStored from './brain-one.json'  assert { type: 'json' };
let net;
let trainer;
let tOptions;
let netOptions;

const init = (args) => {
	({ tOptions, netOptions } = args);
	
	tOptions = {
		//...tOptions,
		log: false,
		errorThresh: tOptions.error * 0.01,
		iterations: tOptions.iterations*2,
	};
	// netOptions = {
	// 	//...netOptions,
	// 	inputSize: 10*10,
	// 	inputRange: 255,
	// 	hiddenLayers: [100, 100],
	// 	//activation: 'relu',
	// 	outputSize: 10*10,
	// 	learningRate: 0.03,
	// 	decayRate: 0.999,
	// };
	const net = new brain.NeuralNetworkGPU(/*netOptions*/);
	net.fromJSON(brainStored);
	const trainer = net;
	net.activate = net.run;
	//net.initialize();

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
				value: id.data[offset+1/*green channel*/] / 255
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

const render = ({ ctx, id, x, y }) => new Promise((resolve) => {
	requestAnimationFrame(() => {
		ctx.putImageData( id, x, y);
		resolve();
	});
});

const train = async (args) => {
	const { x, y, ctx, id, setter } = args;

	if(!net) ({net, trainer} = init(args));

	const GRID_SIZE = 10;
	const xmax = 10;
	const ymax = 10;

	const trainData = trainArray(id, xmax, ymax).map(x => x.value);
	
	var it=0;
	for([it] of new Array(tOptions.iterations).entries()) {
		const output = net.activate(trainData);
		imageFromNet(id, setter, xmax, ymax, output);
		await render({ ctx, id, x: x*GRID_SIZE, y: y*GRID_SIZE });

		const testResults = trainer.train([{ input: trainData, output: trainData }]);
		//const testResults = trainer.train([{ input: trainData, output: trainData }], tOptions);
		args.setError(testResults.error);
		args.setIterations(it*tOptions.iterations);

		const errorOkay = testResults.error < tOptions.errorThresh;
		const iterOkay = it < tOptions.iterations;
		if(errorOkay || !iterOkay){
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

	const trainData = trainArray(id, xmax, ymax).map(x => x.value);
	net.train([{ input: trainData, output: trainData }], {
		...tOptions,
		iterations: 1
	});
	const output = net.activate(trainData);
	return imageFromNet(id, setter, xmax, ymax, output);
};

export default {
	train,
	activate
}