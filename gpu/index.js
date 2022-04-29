import '../shared/components/container.js';
import { GPU } from 'https://cdn.skypack.dev/gpu.js';
/*
also see: https://unpkg.com/deck.gl@latest/dist.min.js
*/

const NeuralContainer = document.querySelector('neural-container');
const { CanvasText } = NeuralContainer;

const notes = `
goals/todo:
	- use compute to help with neural net (especially convolution)
	- use GPU to make cool pictures
`;
NeuralContainer.setNotes(notes.replace(/\t/g, '   '));


function _render({ canvas: mainCanvas, render: renderFun }){
	const { width, height } = mainCanvas;
	const mainContext = mainCanvas.getContext("2d");

	const canvas = new OffscreenCanvas(width, height);
	const context = canvas.getContext('webgl2',
		{ premultipliedAlpha: false }
	);
	const graphicGpu = new GPU({ canvas, context });

	const renderConfig = {
		constants: { width, height },
		output: [width, height],
		graphical: true
	}
	const krender = graphicGpu.createKernel(renderFun, renderConfig);
	krender();
	mainContext.drawImage(canvas, 0, 0);
	graphicGpu.destroy();
}

function gpuCompute({ x, y, id, readImage }){
	const gpu = new GPU();
	const multiplyMatrix = gpu.createKernel(function(a, b) {
		let sum = 0;
		for (let i = 0; i < 512; i++) {
				sum += a[this.thread.y][i] * b[i][this.thread.x];
		}
		return sum;
	}).setOutput([512, 512]);

	const a =[2] 
	const b = [200]
	const c = multiplyMatrix(a, b);
	const results = JSON.stringify(c[0], null, 2).slice(0, 100) + ' ...';
	CanvasText('multiply matrix:\n\n'+ results);
	gpu.destroy();
}

function gpuRender(){
	const { canvas } = NeuralContainer;

	function render(){
		const { width, height } = this.constants;
		const { x, y } = this.thread;
		this.color(
			Math.cos(x*0.08) * ((height-y)*.02),
			0,
			Math.abs( Math.cos(0.06*(x*y*.1))) * 0.5,
			0.8 - (Math.abs( Math.cos(0.06*(x*y))) / (.04*(y) ))
		);
	};

	_render({ canvas, render });
}

NeuralContainer.functions = {
	gpuCompute,
	gpuRender
};

NeuralContainer.onLoad(async () => {
	NeuralContainer.runButton.onclick()
});