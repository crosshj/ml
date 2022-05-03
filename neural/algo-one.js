let tOptions;
let netOptions;

let { Architect, Trainer } = synaptic;
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
		x*y > 50,
		//x > 5,
		//y > 5,
		Math.random(),
		...xyInputs,
		yBefore, xBefore, leftUp, rightUp
	];
	return inputs;
}

function trainingSetFromImageData(id, xmax, ymax){
	var results = [];
	// var max = 0;
	// var min = 255;
	// id.data.forEach((x,i)=>{
	// 	if(i%4-1 != 0) return;
	// 	//green
	// 	if(max < x){ max = x; }
	// 	if(min > x){ min = x; }
	// });
	for(var [x] of new Array(xmax).entries()){
		for(var [y] of new Array(ymax).entries()){
			const offset = xmax*y*4 + x*4;
			//const output = spread(id.data[offset + 1],max,min)/255;
			const output = id.data[offset + 1] / 255;
			if(Number.isNaN(output)) debugger;
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
			//greenOutput = shrink(greenOutput * 255);
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
	const out = [];
	for(const {input, output} of set){
		const result = net.activate(input)[0];
		out.push(result);
		error.push((result - output[0]) ** 2)
	}
	return {
		out,
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
	//const testResults = activateNet(set);
	const testResults = trainer.test(set, tOptions);

	const errorOkay = testResults.error < tOptions.error;
	const iterOkay = iterations < tOptions.iterations;

	requestAnimationFrame(async () => {
		ctx.putImageData( id, x*GRID_SIZE, y*GRID_SIZE);

		setError(testResults.error);
		setIterations(iterations*tOptions.iterations);

		if(!iterOkay) return callback();
		if(errorOkay) return callback();

		await trainer.trainAsync(set, tOptions);
		train({ ...args, iterations: iterations+1 });
	 });
};

const SynOneTrain = (args) => {
	tOptions = args.tOptions;
	netOptions = args.netOptions;
	net = net || new Architect.Perceptron(...netOptions);
	trainer = trainer || new Trainer(net);

	const set = trainingSetFromImageData(args.id, GRID_SIZE, GRID_SIZE);
	train({
		...args,
		set
	});
};

const SynOneActivate = (args) => {
	if(args.x === 0 && args.y === 0) args.hideResults();
	netOptions = args.netOptions;
	net = net || new Architect.Perceptron(...netOptions);
	return imageFromNet(args.id, args.setter, GRID_SIZE, GRID_SIZE, net);
};

export default {
	train: SynOneTrain,
	activate: SynOneActivate
};

