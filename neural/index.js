import Extra from './extra.js';
import SynOne from './algo-one.js';
import NeatOne from './algo-two.js';
import NeatTwo from './neat-two.js';
import ConvOne from './conv-one.js';

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
does training get faster?

draw previous layers with convnetjs:
https://github.com/karpathy/convnetjs/blob/4c3358a315b4d71f31a0d532eb5d1700e9e592ee/demo/js/images-demo.js#L235
`;
NeuralContainer.setNotes(notes.replace(/\t/g, '   '));

function setter(imageData, {r=0, g=0, b=0, a=255}, {x=0, y=0, xmax=1}){
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

const wrapped = (fn) => async (args) => {
	const ctx = NeuralContainer.canvas.getContext("2d");
	if(args.x === 0 && args.y === 0){
		//NeuralContainer.refreshButton.click();
		extra.results.reset();
	}
	return fn({
		...args,
		tOptions, netOptions, ctx, setter,
		setError: (error) => extra.error.set(error.toFixed(5)),
		setIterations: extra.iterations.set,
		setResults: extra.results.set,
		clearResults: extra.results.reset,
		hideResults: extra.results.hide
	});
};
const wrappedPromise = (fn) => async (args) => new Promise(
	(resolve) => wrapped(fn)({ ...args, callback: resolve })
);

NeuralContainer.functions = {
	syn1train: wrappedPromise(SynOne.train),
	syn1activate: wrapped(SynOne.activate),
	neat1train: wrappedPromise(NeatOne.train),
	neat1activate: wrapped(NeatOne.activate),
	neat2train: wrappedPromise(NeatTwo.train),
	neat2activate: wrapped(NeatTwo.activate),
	conv1train: wrappedPromise(ConvOne.train),
	conv1activate: wrapped(ConvOne.activate)
};

NeuralContainer.onLoad(async () => {
	//NeuralContainer.runButton.onclick()
});
