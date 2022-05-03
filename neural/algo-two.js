let tOptions;
let netOptions;

const { architect: Architect } = neataptic;
let net;
let trainer;

const {
	clamp,
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


function getInputs(id, x, y, xmax, ymax){
	//position metrics
	const xyInputs = intToBitArray(y,8).concat(intToBitArray(x,8));
	//other metrics
	const yBefore = getYBeforeBalance(id, x, y, xmax);
	const xBefore = getXBeforeBalance(id, x, y, xmax);
	const leftUp = getLeftUpDiagBalance(id, x, y, xmax);
	const rightUp = getRightUpDiagBalance(id, x, y, xmax);
	
	const CONSTANTS = [
		0, 1
	];
	const inputs = [
		// ...CONSTANTS,
		//x,y,
		//x*y > 50,
		x > 5,
		y > 5,
		//Math.random(),
		...xyInputs,
		yBefore, xBefore, leftUp, rightUp
	];
	return inputs;
}

function trainingSetFromImageData(id, xmax, ymax){
	var results = [];
	for(var [x] of new Array(xmax).entries()){
		for(var [y] of new Array(ymax).entries()){
			const offset = xmax*y*4 + x*4;
			const output = id.data[offset + 1] / 255;
			const input = getInputs(id, x, y, xmax, ymax);
			results.push({ input, output: [output]});
		}
	}
	return results;
}

function imageFromNet(id, setter, xmax, ymax, nt){
	for(var [x] of new Array(xmax).entries()){
		for(var [y] of new Array(ymax).entries()){
		const offset = xmax*y*4 + x*4;
			var output = nt.activate(
				getInputs(id, x, y, xmax, ymax)
			)[0];
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
	const {
		x, y, ctx, set, setter, id, iterations=0, callback: cb,
		setError, setIterations, setResults
	} = args;

	const callback = () => {
		setResults({ iterations });
		cb();
	};

	imageFromNet(id, setter, GRID_SIZE, GRID_SIZE, net);
	const testResults = trainer.test(set);

	const errorOkay = testResults.error < tOptions.error;
	const iterOkay = iterations < tOptions.iterations;
	if(errorOkay || !iterOkay){
		imageFromNet(id, setter, GRID_SIZE, GRID_SIZE, net);
	}

	requestAnimationFrame(async () => {
		ctx.putImageData( id, x*GRID_SIZE, y*GRID_SIZE);

		setError(testResults.error);
		setIterations(iterations*tOptions.iterations);

		if(!iterOkay) return callback();
		if(errorOkay) return callback();

		await trainer.train(set, tOptions);
		train({ ...args, iterations: iterations+1 });
	 });
};

const NeatOneTrain = (args) => {
	tOptions = args.tOptions;
	netOptions = args.netOptions;
	net = net || new Architect.Perceptron(...netOptions);
	trainer = trainer || net;

	const set = trainingSetFromImageData(args.id, GRID_SIZE, GRID_SIZE);
	train({
		...args,
		set
	});
};

const NeatOneActivate = (args) => {
	netOptions = args.netOptions;
	net = net || new Architect.Perceptron(...netOptions);
	return imageFromNet(args.id, args.setter, GRID_SIZE, GRID_SIZE, net);
};

export default {
	train: NeatOneTrain,
	activate: NeatOneActivate
};
