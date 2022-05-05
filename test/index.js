import '../shared/components/container.js';
import convnetjs from 'https://cdn.skypack.dev/convnetjs';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const NeuralContainer = document.querySelector('neural-container');
const { CanvasText } = NeuralContainer;

const notes = `
goals/todo:
   - visualize network internals and in-progress processes
   - loading screens

https://alligator.io/web-components/attributes-properties/
`;
NeuralContainer.setNotes(notes.replace(/\t/g, '   '));

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

const oneStep = ({ steps, step, passes=1, pass=0 }) => {
	CanvasText(`
step: ${step+1} of ${steps}
pass: ${pass+1} of ${passes}
${pass === passes-1 ? 'done!': ''}
	`.trim());
};

const multiPass = async ({ x,y, steps, step, pass, passes }) => {
	if(x !== 0 || y !== 0) return;
	CanvasText(`
step: ${step+1} of ${steps}
pass: ${pass+1} of ${passes}
${pass === passes-1 ? 'done!': ''}
	`.trim());
	await new Promise((resolve) => setTimeout(resolve, 1000));
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
