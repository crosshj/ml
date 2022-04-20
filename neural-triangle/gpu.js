import { GPU } from 'https://cdn.skypack.dev/gpu.js';
/*
also see: https://unpkg.com/deck.gl@latest/dist.min.js
*/
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
false && console.log(c[0])
gpu.destroy();

const width = 400;
const height = 760;
const canvas = document.createElement("canvas");
canvas.width = width;
canvas.height = height;
document.body.append(canvas)

const context = canvas
	.getContext('webgl2',
		{ premultipliedAlpha: false }
	);
const graphicGpu = new GPU({
	canvas,
	context
});
function renderFun(){
	const { width, height } = this.constants;
	const { x, y } = this.thread;
	this.color(
		Math.cos(x/67.1)/5*(y*.002),
		0,
		Math.abs(Math.cos(0.00785*x))/(.012*(y*3)),
		1
	);
};
const renderConfig = {
	constants: { width, height },
	output: [width, height],
	graphical: true
}
const krender = graphicGpu.createKernel(renderFun, renderConfig);
krender()
graphicGpu.destroy();
// component-level testing
const test = async () => {
	const { importCSS:injectStyle, consoleHelper } = await import('../../.tools/misc.mjs');
	injectStyle('../../shared.styl');
};

!window.foo && test();
