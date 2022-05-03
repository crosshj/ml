import convnetjs from 'https://cdn.skypack.dev/convnetjs';
let net;
let trainer;

let tOptions;
let netOptions;

const { architect } = neataptic;

const init = (args) => {
	({ tOptions, netOptions } = args);

	const net = architect.Hopfield(100);
	const trainer = net;
	return { trainer, net };
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
				value: id.data[offset+1/*green channel*/]/255
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
			let greenOutput = 255 * output;
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

const ConvOneTrain = async (args) => {
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

		const testResults = trainer.test([{ input: trainData, output: trainData }]);
		args.setError(testResults.error);
		args.setIterations(it*tOptions.iterations);

		const errorOkay = testResults.error < tOptions.error;
		const iterOkay = it < tOptions.iterations;
		if(errorOkay || !iterOkay){
			break;
		}

		trainer.train([
			{
				input: trainData,
				output: trainData
			}
		], tOptions);
	}
	args.setResults({ iterations: it });
	args.callback();
};

const ConvOneActivate = (args) => {
	const { x, y, ctx, id, setter } = args;

	if(!net) ({net, trainer} = init(args));
	if(args.x === 0 && args.y === 0) args.hideResults();

	const GRID_SIZE = 10;
	const xmax = 10;
	const ymax = 10;

	const trainData = trainArray(id, xmax, ymax).map(x => x.value);
	const output = net.activate(trainData);
	return imageFromNet(id, setter, xmax, ymax, output);
};

export default {
	train: ConvOneTrain,
	activate: ConvOneActivate
};
