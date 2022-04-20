// SYNAPTIC --------------------------------------------------------------------
const {Architect, Trainer} = synaptic;

var results = [];
const network = new Architect.Perceptron(3,5,1);
const trainer = new Trainer(network);
const clone = item => {
	return JSON.parse(JSON.stringify(item));
};
function triggerEvent(el, type){
	if ('createEvent' in document) {
		// modern browsers, IE9+
		var e = document.createEvent('HTMLEvents');
		e.initEvent(type, false, true);
		el.dispatchEvent(e);
	}
}

const train = ({color}={}, output) => {
	if (!color || !(output===0 || output===1)) return;
	results.push({
		input: [
			color.r/255,
			color.g/255,
			color.b/255
		],
		output: [output]
	});

	const trainingSet = clone(results);
	const trainingOptions = {
		rate: .1,
		error: .001,
		shuffle: true,
		log: 0//1
	};
	trainer.trainAsync(trainingSet, trainingOptions)
		.then(results => {
			//console.log('!done', results)
			triggerEvent(document.body, 'training-done');
		});

	return;
}

const predict = color => {
	const normalized = [
		color.r/255,
		color.g/255,
		color.b/255
	];
	const output = (() => {
		const out = Math.round(network.activate(normalized)[0]);
		//console.log({out})
		return isNaN(out)
			? undefined
			: out ? 'white' : 'black';
	})();
	//console.log(network.neurons().map(x => x.neuron));
	console.log(network.toJSON().neurons
		.map(x => x.activation)
		.filter((x,i) => i>2 && i<8)
		.reduce((x,all) => x+all, 0) / 5
	);
	const outputNeuron = network.toJSON().neurons[8];
	const {state, activation, bias} = outputNeuron;
	console.log("output neuron: ", JSON.stringify({state, activation, bias}));
	return {
		output,
		network: network.toJSON(),
		neurons: network.toJSON().neurons.map(x => x.activation)
	};
}

function createDOM(){
	setupCytoscape();
	setupCycle();
}

document.addEventListener('DOMContentLoaded', createDOM, false);
