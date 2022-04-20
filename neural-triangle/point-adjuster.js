import brainJs from 'https://cdn.skypack.dev/brain.js';

/*

const config = {
  binaryThresh: 0.5,
  hiddenLayers: [3], // array of ints for the sizes of the hidden layers in the network
  activation: 'sigmoid', // supported activation types: ['sigmoid', 'relu', 'leaky-relu', 'tanh'],
  leakyReluAlpha: 0.01, // supported for activation type 'leaky-relu'
};

// create a simple feed forward neural network with backpropagation
const net = new brain.NeuralNetwork(config);

net.train([
  { input: [0, 0], output: [0] },
  { input: [0, 1], output: [1] },
  { input: [1, 0], output: [1] },
  { input: [1, 1], output: [0] },
]);

const output = net.run([1, 0]);

*/

/*
https://machinelearningmastery.com/how-to-configure-the-number-of-layers-and-nodes-in-a-neural-network/

https://stackoverflow.com/questions/3345079/estimating-the-number-of-neurons-and-number-of-layers-of-an-artificial-neural-ne
*/

class Triangle {
	points
	constructor(points){
		const canvas = new OffscreenCanvas(10, 10);
		canvas.width = 10;
		canvas.height = 10;
		const ctx = canvas.getContext('2d');
		this.ctx = ctx;
		this.canvas = canvas;
		this.erase()
		points && this.draw(points)
	}
	erase = () => {
		this.ctx.fillStyle = "white";
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		if(this.overlayCtx){
			const ctx = this.overlayCtx;
			ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
		}
	}
	draw = (points) => {
		this.erase()
		this.triangle(points)
	}
	triangle = (points) => {
		const {ctx, canvas} = this;
		ctx.fillStyle = "black";
		ctx.beginPath();
		ctx.moveTo(...points[0]);
		ctx.lineTo(...points[1]);
		ctx.lineTo(...points[2]);
		ctx.fill();
	}
	get pixels(){
		const canvasWidth = this.canvas.width;
		const canvasHeight = this.canvas.height;
		var imgData = this.ctx.getImageData(0,0,canvasWidth,canvasHeight);
		const pixels = [];
		for (var y = 0; y < canvasHeight; ++y) {
			for (var x = 0; x < canvasWidth; ++x) {
				const i = (y * canvasWidth + x) * 4;
				pixels.push([
					imgData.data[i+0],
					imgData.data[i+1],
					imgData.data[i+2],
					imgData.data[i+3],
				])
			}
		}
		return pixels;
	}
}

const diffPixels = (first, second) => {
	const firstPixels = first.pixels;
	const secondPixels = second.pixels;
	const diff = firstPixels.map((first, i) => {
		const second = secondPixels[i];
		return [0,1,2,3].map(n =>  Math.abs(first[n] - second[n]))
	});
	return diff;
}

const diffOverall = (first, second) => {
	const pixelDiffs = diffPixels(first, second)
	return pixelDiffs.reduce((sum, [r,g,b,a]) => sum + r + g + b + a, 0)
}

const pixelVariations = ([x, y]) => ([
	[x-1,y],
	[x+1,y],

	[x,y-1],
	[x,y+1],

	[x-1,y-1],
	[x+1,y+1],

	[x-1,y+1],
	[x+1,y-1],
]);	

const triangleVariations = (p1,p2,p3) => {
	const varyP1 = pixelVariations(p1)
	const varyP2 = pixelVariations(p2)
	const varyP3 = pixelVariations(p3)
	return [
		//vary just one - 1x8
		...varyP1.map(v => ([v,p2,p3])),
		...varyP2.map(v => ([p1,v,p3])),
		...varyP3.map(v => ([p1,p2,v])),

		//vary two - 8x8
		...varyP1.reduce((all, v1) => {
			return [...all, ...varyP2.map(v2 => ([v1,v2,p3]))]
		}, []),
		...varyP1.reduce((all, v1) => {
			return [...all, ...varyP3.map(v3 => ([v1,p2,v3]))]
		}, []),
		...varyP2.reduce((all, v2) => {
			return [...all, ...varyP3.map(v3 => ([p1,v2,v3]))]
		}, []),

		//vary all three - 8x8x8
		...varyP1.reduce((all, v1) => {
			return [
				...all,
				...varyP2.reduce((all2, v2) => {
					return [...all2, ...varyP3.map(v3 => ([p1,v2,v3]))]
				}, []),
			]
		},[])
	];
}

const config = {
	binaryThresh: 0.5,
	//hiddenLayers: [203,6],
	hiddenLayers: [203,100,50], // array of ints for the sizes of the hidden layers in the network
	errorThresh: 0.001,
	activation: 'leaky-relu', // ['sigmoid', 'relu', 'leaky-relu', 'tanh'],
	leakyReluAlpha: 0.01, // supported for activation type 'leaky-relu'
};

export class PointAdjuster {
	storeName = 'pointAdjustNN'

	constructor(pixels, width, height){
		this.width = width;
		this.height = height;
		this.pixels = pixels;
		this.net = new brain.NeuralNetwork(config);
		this.fromStorage();
	}
	
	initNet(){
		const input = new Array(406).fill().map(Math.random);
		const output = new Array(6).fill().map(x => 0.49999);
		this.net.train([{ input, output }])
	}

	fromStorage = () => {
		let stored = localStorage.getItem(this.storeName);
		if(!stored) {
			this.initNet();
			stored = JSON.stringify(this.net.toJSON());
		}
		const parsedNet = JSON.parse(stored);
		parsedNet.trainOpts.errorThresh = config.errorThresh;
		//parsedNet.trainOpts.learningRate = 0.05;
		//parsedNet.trainOpts.iterations = 100000;
		//parsedNet.trainOpts.reinforce = true;
		this.net.fromJSON(parsedNet);
	}
	toStorage = () => {
		localStorage.setItem(
			this.storeName,
			JSON.stringify(this.net.toJSON())
		);
	}
	clearStorage = () => {
		localStorage.removeItem(this.storeName);
	}

	normalizePixels = (pixels) => {
		return pixels.map(p => {
			return p.map(x => x/255);
		});
	}

	normalizePoints = (points) => {
		return points.map(([x, y]) => {
			return [
				(x)/this.width,
				(y)/this.height
			];
		});
	}

	denormalPoints = (normPoints) => {
		if(!Array.isArray(normPoints)) {
			normPoints = Object.entries(normPoints).map(([k,v]) => v)
		}
		const [
			x1, y1,
			x2, y2,
			x3, y3
		] = normPoints;
		const deNormX = x => Math.round(x*this.width);
		const deNormY = x => Math.round(x*this.height);
		return [
			[ deNormX(x1), deNormY(y1) ],
			[ deNormX(x2), deNormY(y2) ],
			[ deNormX(x3), deNormY(y3) ],
		];
	}

	correctPoints = (points) => {
		return points.map(([x, y]) => {
			return [
				x < 0
					? 0
					: x > this.width
						? this.width
						: x,
				y < 0
					? 0
					: y > this.height
						? this.height
						: y
			];
		});
	}

	train = (data) => {
		console.log(`training with ${data.length} data points`)
		
		const trainData = data.map(([inPoints, outPoints]) => {
			const input = [
				...this.normalizePixels(this.pixels).flat(),
				...this.normalizePoints(inPoints).flat()
			]; //10x10x4 + 3x2 = 406
			const output = this.normalizePoints(
				outPoints || this.expectation(inPoints)
			).flat() // 3x2 = 6
			return { input, output };
		})

		const results = this.net.train(trainData);
		console.log(JSON.stringify(results));
		this.toStorage();
	}

	run = (points) => {
		const input = [
			...this.normalizePixels(this.pixels).flat(),
			...this.normalizePoints(points).flat()
		]; //10x10x4 + 3x2 = 406
		const output = this.net.run(input);
		return this.denormalPoints(output)
	}

	_run = () => {
		// inputs = original pixels and current guess of points
		// output = expectation
	}
	
	step = () => {
		// set internal points to most recent guess and run
	}

	expectation = (_points) => {
		const points = this.correctPoints(_points);
		const guess = new Triangle(points);
		const guessError = diffOverall(this, guess);
		if(guessError === 0) return points;

		const guessVari = triangleVariations(...points)
		let solutions = [];
		for(let i=guessVari.length-1; i >=0; i--){
			const g = guessVari[i]
			const goesOffscreen = g.some(([x, y]) => {
				return x < 0 || x > this.width ||
					y < 0 || y > this.height;
			})
			if(goesOffscreen) continue;
			const newGuess = new Triangle(g);
			const newGuessError = diffOverall(this, newGuess);
			if(newGuessError >= guessVari) continue;
			solutions.push({ points: g, error: newGuessError });
			if(newGuessError === 0) break;
		}
		const leastError = solutions.sort((a,b) => a.error - b.error)[0];
		const guessPoints = leastError
			? leastError.points || points
			: points;
		console.log(`${leastError.error} - ${JSON.stringify(guessPoints)}`)
		return guessPoints;
	}

}

// component-level testing
const test = async () => {
	const { importCSS:injectStyle, consoleHelper } = await import('../../.tools/misc.mjs');
	injectStyle('../../shared.styl');

	consoleHelper();
	
	let logJSON = (value) => console.info(JSON.stringify(value, null, 2))
	//logJSON(pixelVariations([5,5]))
	const offset = 24;
	const groupLength = 64
	const tvariations = triangleVariations([6,6],[4,2],[2,6])
	false && console.log(
		'vary points 1 & 2' +
		'\n' +
		tvariations
			.map(x => `[${x[0]} | ${x[1]} | ${x[2]}]`)
			.slice(offset,offset+groupLength)
			.join('\n')
	)
	const length = 3*(8) + 3*(8*8) + 1*(8*8*8)
	false && console.log(`
		expected length = ${length}
		actual length = ${tvariations.length}
	`.replace(/^\t\t/gm, ''))
	
	const originalPoints = [[9,9], [5,1], [1,9]];
	const original = new Triangle(originalPoints);
	const pointAdjust = new PointAdjuster(original.pixels, 10, 10);

	let guessPoints = [[3,5],[2,1],[8,7]]

	false && console.log(
		pointAdjust.correctPoints(guessPoints)
	);
	
	const normed = [
		0.8275632858276367,
		0.9155623912811279,
		0.5735705494880676,
		0.15924766659736633,
		0.10919497162103653,
		0.7838823199272156
	];
	false && console.log(JSON.stringify(pointAdjust.denormalPoints(normed)))

	const guesses = [];
	const doneFunc = () => {
		//console.log(guesses.join('\n'))
		pointAdjust.train(guesses);
		guesses.forEach(([guessPoints, newGuess]) => {
			console.log(`
INPUT: ${JSON.stringify(newGuess)}
OUTPUT: ${JSON.stringify(pointAdjust.run(newGuess))}
			`.trim())
		})
	};

	var fps = 15;
	let iter = 0;
	const max_iter = 20;
	function draw() {
		if(iter++ > max_iter) return doneFunc()
		const newGuess = pointAdjust.expectation(guessPoints);
		if(guessPoints.toString() === newGuess.toString()) return doneFunc();
		guesses.push([guessPoints, newGuess]);
		guessPoints = newGuess;

		setTimeout(function() {
				requestAnimationFrame(draw);
				// Drawing code goes here
		}, 1000 / fps);
	}
	draw()
}
setTimeout(() => {
	window.neuralTriangle ? "" : test()
}, 1)