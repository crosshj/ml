import '../shared/components/container.js';
import convnetjs from 'https://cdn.skypack.dev/convnetjs';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const NeuralContainer = document.querySelector('neural-container');
const { CanvasText } = NeuralContainer;

import canvasOps from '../shared/canvasOps.js';

const notes = `
goals/todo:
   - visualize network internals and in-progress processes
   - loading screens

https://alligator.io/web-components/attributes-properties/
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

// used to detect the behavior of readImage
const imageOverflowUL = ({x, y, id, readImage}) => {
	const pad = 3;
	const imageOffset = {
		x: pad,
		y: pad,
		width: 0,
		height: 0
	};
	const { id: src } = readImage(imageOffset);
	return src;
}
// used to detect the behavior of readImage
const imageOverflowUR = ({x, y, id, readImage}) => {
	const pad = 3;
	const imageOffset = {
		x: -pad,
		y: pad,
		width: 0,
		height: 0
	};
	const { id: src } = readImage(imageOffset);
	return src;
}
// used to detect the behavior of readImage
const imageOverflowDL = ({x, y, id, readImage}) => {
	const pad = 3;
	const imageOffset = {
		x: pad,
		y: -pad,
		width: 0,
		height: 2*pad
	};
	const { id: src } = readImage(imageOffset);
	return src;
}
// used to detect the behavior of readImage
const imageOverflowDR = ({x, y, id, readImage}) => {
	const pad = 3;
	const imageOffset = {
		x: -pad,
		y: pad,
		width: 0,
		height: 0
	};
	const { id: src } = readImage(imageOffset);
	return src;
}

const dummyFn = (filter) => {
	return async (args) => {
		if(filter==='dry-run'){
			await delay(30);
			return args.id;
		}
	};
};

const oneStep = async ({ steps, step, passes=1, pass=0 }) => {
	const stepText = `
step: ${step+1} of ${steps}
pass: ${pass+1} of ${passes}
	`.trim();
	CanvasText(stepText + '\n...');
	
	await delay(1500);
	CanvasText(stepText + '\ndone!');
};

const _multiPass = async ({ x,y, steps, step, pass, passes }) => {
	if(x !== 0 || y !== 0) return;
	CanvasText(`
step: ${step+1} of ${steps}
pass: ${pass+1} of ${passes}
${pass === passes-1 ? 'done!': ''}
	`.trim());
	await delay(1000);
};

const multiPass = async ({ x,y, steps, step, pass, passes }) => {
	const width = 160;
	const height = 120;
	const cyclic = canvasOps.cyclicParticle.bind({
		canvas: NeuralContainer.canvas,
		dimensions: {
			x: width, y: height
		}
	});
	let id;
	if(pass === 0){
		const { canvas } = NeuralContainer;
		const ctx = canvas.getContext("2d");
		id = ctx.getImageData(0, 0, width, height);
	}
	cyclic(setter, { iterations: 1, bands: 6, id });
	await delay(100);
};

NeuralContainer.functions = {
	dryRun: dummyFn('dry-run'),
	oneStep,
	multiPass,
	imageOverflowDL,
	imageOverflowDR,
	imageOverflowUL,
	imageOverflowUR,
};

NeuralContainer.onLoad(async () => {
	NeuralContainer.runButton.onclick()
});
