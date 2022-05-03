import convnetjs from 'https://cdn.skypack.dev/convnetjs';
let net;
let trainer;

let tOptions;
let netOptions;

const init = (args) => {
	({ tOptions, netOptions } = args);
	const layer_defs = [
		{type:'input', out_sx:10, out_sy:10, out_depth:1},
		{type:'conv', sx:5, filters:400, stride:1, pad:0, activation:'relu'},
		//{type:'pool', sx:1, stride:2},
		// {type:'fc', num_neurons:500, activation:'tanh'},
		// {type:'fc', num_neurons:500, activation:'tanh'},
		// {type:'fc', num_neurons:100 },
		// {type:'fc', num_neurons:100, activation:'relu'},
		// {type:'fc', num_neurons:100, activation:'relu'},
		//{type:'fc', num_neurons:20, activation:'relu'},
		// {type:'fc', num_neurons:20, activation:'relu'},
		// {type:'fc', num_neurons:20, activation:'relu'},
		// {type:'fc', num_neurons:20, activation:'relu'},
		// {type:'fc', num_neurons:20, activation:'relu'},
		//{type:'fc', num_neurons:1000, activation:'relu'},
		//{type:'fc', num_neurons:5000, activation:'relu'},
		{type:'regression', num_neurons:10*10}
	];

	const net = new convnetjs.Net();
	net.makeLayers(layer_defs);

	trainer = new convnetjs.SGDTrainer(net, {
		method:'adadelta',
		learning_rate:0.01,
		batch_size:1,
		momentum: 0.9,
		//momentum:0.2,
		l2_decay:0.01
	});
	
	return { trainer, net };
};

const trainArray = (id, xmax, ymax) => {
	const array = [];
	for(var [y] of new Array(xmax).entries()){
		for(var [x] of new Array(ymax).entries()){
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

const getTrainingVolume = ({ id }) => {
	const image_channels = 1;
	const ymax = 10;
	const xmax = 10;
	const volume = new convnetjs.Vol(xmax,ymax,image_channels,Math.random());
	for(var { x, y, channel, value } of trainArray(id, xmax, ymax)){
		volume.set( y, x, channel, value);
	}
	return volume;
}

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

	const volume = getTrainingVolume(args);
	const expected = trainArray(id, xmax, ymax).map(x => x.value)

	let it;
	for([it] of new Array(tOptions.iterations).entries()) {
		trainer.train(
			volume,
			expected
		);
		const predicted_values = net.forward(volume);
		imageFromNet(id, setter, xmax, ymax, predicted_values.w);
		await render({ ctx, id, x: x*GRID_SIZE, y: y*GRID_SIZE });
		//TODO: set error
		args.setIterations(it);
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

	const volume = getTrainingVolume(args);
	const predicted_values = net.forward(volume);

	return imageFromNet(id, setter, xmax, ymax, predicted_values.w);
};

export default {
	train: ConvOneTrain,
	activate: ConvOneActivate
};
