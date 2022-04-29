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

const oneStep = () => {
	CanvasText('one step!');
};

NeuralContainer.functions = {
	dryRun: dummyFn('dry-run'),
	oneStep,
	imageOverflowDL,
	imageOverflowDR,
	imageOverflowUL,
	imageOverflowUR,
};

NeuralContainer.onLoad(async () => {
	NeuralContainer.runButton.onclick()
});
