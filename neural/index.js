import Extra from './extra.js';
import AlgoOne from './algo-one.js';
import '../shared/components/container.js';
import convnetjs from 'https://cdn.skypack.dev/convnetjs';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const NeuralContainer = document.querySelector('neural-container');
const { CanvasText } = NeuralContainer;

const extra = Extra(NeuralContainer);

const notes = `
todo:
	- image error map
	- indicate rate of change in network
	
after training is done, have it activate on an image made of random noise

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

	AlgoOne({
		x, y,
		ctx,
		id,
		setter: setImageDataPixel,
		setError: extra.error.set,
		setIterations: extra.iterations.set,
		setResults: extra.results.set,
		callback: resolve
	});
});

NeuralContainer.functions = {
	neural,
};

NeuralContainer.onLoad(async () => {
	//NeuralContainer.runButton.onclick()
});
