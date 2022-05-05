
const clone = item => {
	return JSON.parse(JSON.stringify(item));
};

function range(from, to){
	return new Array(to).fill();
}
function randomArrayItem(arr){
	return arr[Math.floor(Math.random()*arr.length)];
}
function readPixel(id, x, y, width){
	const index = (y*width + x)*4;
	return {
		r: id.data[index],
		g: id.data[index + 1],
		b: id.data[index + 2],
		a: id.data[index + 3]
	}
}
function writePixel(id, x, y, width, pixel){
	const index = (y*width + x)*4;
	id.data[index] = pixel.r;
	id.data[index+1] = pixel.g;
	id.data[index+2] = pixel.b;
	id.data[index+3] = pixel.a;
}

function lenna(setter){
	if (!setter) return;
	var ctx = this.canvas.getContext('2d');
	var imageObj = new Image();
	imageObj.setAttribute('crossOrigin', 'Anonymous');

	imageObj.onload = function() {
		ctx.drawImage(imageObj, 0, 0);
	};
	// imageObj.src = 'https://crosshj.com/sandbox/src/canvas/Lenna.png';
	imageObj.src = 'https://crosshj.com/sandbox/src/canvas/lenna3.png';
	return imageObj;
}

function vader(setter){
	if (!setter) return;
	var ctx = this.canvas.getContext('2d');
	var imageObj = new Image();
	imageObj.setAttribute('crossOrigin', 'Anonymous');

	imageObj.onload = function() {
		ctx.drawImage(imageObj, 0, 0);
	};
	// imageObj.src = 'https://crosshj.com/sandbox/src/canvas/vader.png';
	imageObj.src = 'https://crosshj.com/sandbox/src/canvas/vader2.png';
	return imageObj;
}

function nnTest1(setter){
	if (!setter) return;
	var ctx = this.canvas.getContext('2d');
	var imageObj = new Image();
	imageObj.setAttribute('crossOrigin', 'Anonymous');

	imageObj.onload = function() {
		ctx.drawImage(imageObj, 0, 0);
	};
	imageObj.src = 'https://crosshj.com/sandbox/src/canvas/nn_test_1.png';
	return imageObj;
}

var randomImageData;
function random(setter){
	if (!setter) return;

	var ctx = this.canvas.getContext('2d');

	// http://stackoverflow.com/a/23095731/1627873
	function randomRGB(){
		var num = Math.round(0xffffff * Math.random());
		var r = num >> 16;
		var g = num >> 8 & 255;
		var b = num & 255;
		return { r, g, b };
	}

	function randomPixel(setter, xmax, ymax){
		range(0, xmax).forEach((unused_x, x) => {
			range(0, ymax).forEach((unused_y, y) => {
				var _color = randomRGB();
				_color.r = _color.b = 0;
				//_color.r = Math.round(Math.random()) * 255;
				//_color.b = Math.round(Math.random()) * 255;

				_color.g = Math.floor(Math.random() * 255);
				// _color.g = 60 + Math.floor(Math.random() * 255)%72;
				// _color.g += Math.round(Math.random() * 128) -64;
				setter(_color, {x, y, xmax});
			});
		});
	}

	randomImageData = randomImageData
		? randomImageData
		: ctx.createImageData(this.dimensions.x, this.dimensions.y);

	randomPixel(
		(color, pos) => { setter(randomImageData, color, pos)},
		this.dimensions.x,
		this.dimensions.y
	);

	ctx.putImageData( randomImageData, 0, 0 );
}

/*
todo perlin noise (clouds)
https://gist.github.com/adefossez/0646dbe9ed4005480a2407c62aac8869
https://asserttrue.blogspot.com/2011/12/perlin-noise-in-javascript_31.html
*/



/*
http://ciri.be/blog/?p=71
https://web.archive.org/web/20080807134544/http://psoup.math.wisc.edu/archive/recipe1.html
https://en.wikipedia.org/wiki/Cyclic_cellular_automaton
http://software-tecnico-libre.es/en/article-by-topic/data-analytics/complex-systems/cellular-automata/cellular-automata-winca-3
http://www.mirekw.com/ca/ca_files_formats.html
*/
function cyclicParticle(setter){
	if(!randomImageData) random.bind(this)(setter);
	const id = randomImageData;
	const bands = 3;
	const [ bandColors, max_iter] = ([
		,, //zero and one (not available)
		[
			[0, 255],
			200
		],//two,
		[
			[30, 127, 182],
			100
		],//three
		,
		,
		[
			[0, 43, 86, 129, 172, 215],
			800
		], //six
		[
			[0, 43, 86, 129, 172, 215, 223],
			1000
		], //seven
		[
			[0, 17, 58, 67, 84, 117, 134, 183],
			400
		], //eight
		,
		,
		,
		[
			[0,12+1,48+2,72+3,84+4,96+5,108+6,120+7,132+8,144+9,156+10,168+11], //twelve
			15000
		], //twelve
	][bands]);
	const width = 160;
	const height = 120;

	//console.log(bandColors.map(x=>x%bands), bandColors)
	for(var [it] of new Array(max_iter).entries()){
		const pixelsToWrite = [];
		for(var [y] of new Array(height).entries()){
			for(var [x] of new Array(width).entries()){
				const neighbors = [
					[x,                     y===0 ? height-1 : y-1],
					[x===0 ? width-1 : x-1, y                ],
					[x,                     y===height-1 ? 0 : y+1],
					[x===width-1 ? 0 : x+1, y                ],
				];
				const randNeighbor = randomArrayItem(neighbors);

				const pixel = readPixel(id, x, y, width);
				const neighborPixel = readPixel(id, randNeighbor[0],randNeighbor[1], width);
				const isSuccessor = (pixel.g % bands) === ((neighborPixel.g % bands) -1)
					|| ((pixel.g % bands === bands-1) && (neighborPixel.g % bands) === 0);
				
				if(!isSuccessor) continue;
				const writeArgs = [id, x, y, width, {
					...neighborPixel,
					g: bandColors[neighborPixel.g % bands]
				}];
				pixelsToWrite.push(writeArgs);
			}
		}
		for(var args of pixelsToWrite) writePixel(...args);
	}
	const ctx = this.canvas.getContext('2d');
	ctx.putImageData( id, 0, 0 );
	return;
}

function frog(){
	const ctx = this.canvas.getContext('2d');
	const imageObj = new Image();
	imageObj.setAttribute('crossOrigin', 'Anonymous');
	imageObj.onload = function() { ctx.drawImage(imageObj, 0, 0); };
	imageObj.src = 'https://crosshj.com/sandbox/src/canvas/frog.png';
	return imageObj;
}
function horse(){
	const ctx = this.canvas.getContext('2d');
	const imageObj = new Image();
	imageObj.setAttribute('crossOrigin', 'Anonymous');
	imageObj.onload = function() { ctx.drawImage(imageObj, 0, 0); };
	imageObj.src = 'https://crosshj.com/sandbox/src/canvas/horse.png';
	return imageObj;
}
function paint1(){
	const ctx = this.canvas.getContext('2d');
	const imageObj = new Image();
	imageObj.setAttribute('crossOrigin', 'Anonymous');
	imageObj.onload = function() { ctx.drawImage(imageObj, 0, 0); };
	imageObj.src = 'https://crosshj.com/sandbox/src/canvas/paint1.png';
	return imageObj;
}
function paint2(){
	const ctx = this.canvas.getContext('2d');
	const imageObj = new Image();
	imageObj.setAttribute('crossOrigin', 'Anonymous');
	imageObj.onload = function() { ctx.drawImage(imageObj, 0, 0); };
	imageObj.src = 'https://crosshj.com/sandbox/src/canvas/paint2.png';
	return imageObj;
}
function paint3(){
	const ctx = this.canvas.getContext('2d');
	const imageObj = new Image();
	imageObj.setAttribute('crossOrigin', 'Anonymous');
	imageObj.onload = function() { ctx.drawImage(imageObj, 0, 0); };
	imageObj.src = 'https://crosshj.com/sandbox/src/canvas/paint3.png';
	return imageObj;
}
function paint4(){
	const ctx = this.canvas.getContext('2d');
	const imageObj = new Image();
	imageObj.setAttribute('crossOrigin', 'Anonymous');
	imageObj.onload = function() { ctx.drawImage(imageObj, 0, 0); };
	imageObj.src = 'https://crosshj.com/sandbox/src/canvas/paint4.png';
	return imageObj;
}
function paint5(){
	const ctx = this.canvas.getContext('2d');
	const imageObj = new Image();
	imageObj.setAttribute('crossOrigin', 'Anonymous');
	imageObj.onload = function() { ctx.drawImage(imageObj, 0, 0); };
	imageObj.src = 'https://crosshj.com/sandbox/src/canvas/paint5.png';
	return imageObj;
}
function wave1(){
	const ctx = this.canvas.getContext('2d');
	const imageObj = new Image();
	imageObj.setAttribute('crossOrigin', 'Anonymous');
	imageObj.onload = function() { ctx.drawImage(imageObj, 0, 0); };
	imageObj.src = 'https://crosshj.com/sandbox/src/canvas/wave1.png';
	return imageObj;
}

const canvasOps = {
	frog,
	horse,
	lenna,
	nnTest1,
	paint1,
	paint2,
	paint3,
	paint4,
	paint5,
	random,
	cyclicParticle,
	vader,
	wave1
};
window.canvasOps = canvasOps;

export default canvasOps;