import Extra from './extra.js';
import SynOne from './algo-one.js';
import NeatOne from './algo-two.js';

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

const tOptions = {
	momentum: 0.9, //neataptic-only
	rate: .03,
	iterations: 100,
	error: .002,
	shuffle: false,
	log: 0
};
const netOptions = [22, 20, 1];

const syn1train = async (args) => new Promise((resolve) => {
	const {x, y, id, readImage} = args;
	const ctx = NeuralContainer.canvas.getContext("2d");

	if(x === 0 && y === 0) extra.results.reset();
	SynOne.train({
		tOptions, netOptions,
		x, y,
		ctx,
		id,
		setter: setImageDataPixel,
		setError: (error) => extra.error.set(error.toFixed(5)),
		setIterations: extra.iterations.set,
		setResults: extra.results.set,
		clearResults: extra.results.reset,
		callback: resolve
	});
});

const syn1activate = async (args) => {
	const {x, y, id, readImage} = args;
	const ctx = NeuralContainer.canvas.getContext("2d");

	if(x === 0 && y === 0) extra.results.reset();
	return SynOne.activate({
		tOptions, netOptions,
		x, y,
		ctx,
		id,
		setter: setImageDataPixel,
		setError: (error) => extra.error.set(error.toFixed(5)),
		setIterations: extra.iterations.set,
		setResults: extra.results.set,
		clearResults: extra.results.reset,
	});
};

const neat1train = async (args) => new Promise((resolve) => {
	const {x, y, id, readImage} = args;
	const ctx = NeuralContainer.canvas.getContext("2d");

	if(x === 0 && y === 0) extra.results.reset();
	NeatOne.train({
		tOptions, netOptions,
		x, y,
		ctx,
		id,
		setter: setImageDataPixel,
		setError: (error) => extra.error.set(error.toFixed(5)),
		setIterations: extra.iterations.set,
		setResults: extra.results.set,
		clearResults: extra.results.reset,
		callback: resolve
	});
});

const neat1activate = async (args) => {
	const {x, y, id, readImage} = args;
	const ctx = NeuralContainer.canvas.getContext("2d");

	if(x === 0 && y === 0) extra.results.reset();
	return NeatOne.activate({
		tOptions, netOptions,
		x, y,
		ctx,
		id,
		setter: setImageDataPixel,
		setError: (error) => extra.error.set(error.toFixed(5)),
		setIterations: extra.iterations.set,
		setResults: extra.results.set,
		clearResults: extra.results.reset,
	});
};

NeuralContainer.functions = {
	syn1train,
	syn1activate,
	neat1train,
	neat1activate,
};

NeuralContainer.onLoad(async () => {
	//NeuralContainer.runButton.onclick()
});
