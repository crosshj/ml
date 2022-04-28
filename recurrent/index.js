import '../shared/components/container.js';
import convnetjs from 'https://cdn.skypack.dev/convnetjs';
import canvasTxt from 'https://cdn.skypack.dev/canvas-txt';

const NeuralContainer = document.querySelector('neural-container');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const notes = `
https://github.com/karpathy/recurrentjs

the idea here is to explore RNN's

using convnetjs now; use ^^^ in the future (?)

https://cs.stanford.edu/people/karpathy/convnetjs/

EXAMPLES:

Classification
    - predict probability class for a given input
Regression
    - predict real-valued outpus for a given input

TODO:

Convolutional Network for Images
    - https://cs.stanford.edu/people/karpathy/convnetjs/demo/cifar10.html
    - https://cs.stanford.edu/people/karpathy/convnetjs/demo/autoencoder.html
Reinforcement Learning Agent
    - https://cs.stanford.edu/people/karpathy/convnetjs/demo/rldemo.html

`;
NeuralContainer.setNotes(notes.replace(/\t/g, '   '));

const CanvasText = (text) => {
console.log(text)
	const DELAY = 0;
	setTimeout(() => {
		const { canvasOverlay: canvas } = NeuralContainer;
		const ctx = canvas.getContext("2d");
		ctx.fillStyle = "#000c";
		ctx.fillRect(0,0, canvas.width, canvas.height);
		ctx.fillStyle = "white"
		canvasTxt.fontSize = 16;
		canvasTxt.align = 'left';
		canvasTxt.vAlign = 'top';
		//canvasTxt.font = 'VT323';
		// canvasTxt.font = 'Varela';
		canvasTxt.font = 'Roboto Mono';
		//canvasTxt.font = 'Monospace';
		//canvasTxt.fontWeight = 100;
		//canvasTxt.fontVariant = 'small-caps';
		canvasTxt.drawText(ctx, text, canvasTxt.fontSize, canvasTxt.fontSize, canvas.width-2, canvas.height-8)
	},DELAY);
}

// from: https://cs.stanford.edu/people/karpathy/convnetjs/started.html
function classifier({x, y, id, readImage}){
	if(x!==15 || y!==11) return;

	const output = [];
	const net = new convnetjs.Net();
	net.makeLayers([
		// input layer of size 1x1x2 (all volumes are 3D)
		{type:'input', out_sx:1, out_sy:1, out_depth:3},

		// some fully connected layers
		{type:'fc', num_neurons:20, activation:'relu'},
		{type:'fc', num_neurons:20, activation:'relu'},

		// a softmax classifier predicting probabilities for two classes: 0,1
		{type:'softmax', num_classes:3}
	]);
	
	const volume = new convnetjs.Vol([0, 255, 0])

	output.push(`%% no train %%`);
	const probability_volume = net.forward(volume);
	output.push('probability that x is class 1: ' + probability_volume.w[1].toFixed(3) + '\n');

	const trainer = new convnetjs.Trainer(net, {
		learning_rate:0.01,
		l2_decay:0.001
	});

	const train_loops = 5;
	for(var _ of new Array(train_loops)) trainer.train(volume, 1);

	output.push(`%% train ${train_loops} times %%`);
	const probability_volume2 = net.forward(volume);
	output.push('probability that x is class 1: ' + probability_volume2.w[1].toFixed(3) + '\n');

	CanvasText(output.join('\n\n'));
}

// from: https://cs.stanford.edu/people/karpathy/convnetjs/started.html
function regression({x, y, id, readImage}){
	if(x!==15 || y!==11) return;
	const output = [];

	const net = new convnetjs.Net();
	net.makeLayers([
		{type:'input', out_sx:1, out_sy:1, out_depth:2},
		{type:'fc', num_neurons:5, activation:'sigmoid'},
		{type:'regression', num_neurons:1}
	]);

	const volume = new convnetjs.Vol([0.5, -1.3]);

	// train on this datapoint, saying [0.5, -1.3] should map to value 0.7:
	// note that in this case we are passing it a list, because in general
	// we may want to  regress multiple outputs and in this special case we 
	// used num_neurons:1 for the regression to only regress one.
	var trainer = new convnetjs.SGDTrainer(net, {
		learning_rate:0.01,
		momentum:0.0,
		batch_size:1,
		l2_decay:0.001
	});

	output.push(`%% no train %%`);
	var predicted_values = net.forward(volume);
	output.push('predicted value: ' + predicted_values.w[0].toFixed(3) + '\n')

	const train_loops = 150;
	for(var _ of new Array(train_loops)) trainer.train(volume, [0.7]);
	output.push(`%% train ${train_loops} times %%`);

	// evaluate on a datapoint. We will get a 1x1x1 Vol back, so we get the
	// actual output by looking into its 'w' field:
	var predicted_values2 = net.forward(volume);
	output.push('predicted value: ' + predicted_values2.w[0].toFixed(3) + '\n');
	
	CanvasText(output.join('\n\n'));
}


const dummyFn = (filter) => {
	return async (args) => {
		if(filter==='dry-run'){
			await delay(30);
			return args.id;
		}
	};
};

NeuralContainer.functions = {
	dryRun: dummyFn('dry-run'),
	regression,
	classifier,
};

NeuralContainer.onLoad(async () => {
	NeuralContainer.runButton.onclick()
});
