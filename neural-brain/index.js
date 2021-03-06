//show-preview
import { appendUrls, addUrls, consoleHelper, htmlToElement, importCSS, prism } from '../shared/misc.js';
consoleHelper();

/*

this is the brain.js that Heather Arthor started, stopped, and someone else picked up

here are more libs: https://analyticsindiamag.com/top-10-javascript-machine-learning-libraries/

*/

const deps = [
	'https://unpkg.com/brain.js@2.0.0-beta.2/dist/brain-browser.js',
];

;(async () => {
	await appendUrls(deps);
	await prism('javascript', '', 'prism-preload');

	/*
	// provide optional config object (or undefined). Defaults shown.
	const config = {
		binaryThresh: 0.5,
		hiddenLayers: [3], // array of ints for the sizes of the hidden layers in the network
		activation: 'sigmoid', // supported activation types: ['sigmoid', 'relu', 'leaky-relu', 'tanh'],
		leakyReluAlpha: 0.01, // supported for activation type 'leaky-relu'
	};

	// create a simple feed forward neural network with backpropagation
	const net = new brain.NeuralNetwork(config);
	const gpunet = new brain.NeuralNetworkGPU(config);

	const trainingData = [
		{ input: [0, 0], output: [0] },
		{ input: [0, 1], output: [1] },
		{ input: [1, 0], output: [1] },
		{ input: [1, 1], output: [0] },
	];
	net.train(trainingData);
	gpunet.train(trainingData);

	const output = net.run([1, 0]); // [0.987]
	console.info(output)
	
	const gpuoutput = gpunet.run([1, 0]); // [0.987]
	console.info(gpuoutput)
	*/

	console.log('Time Series:\n')

	const net = new brain.recurrent.LSTMTimeStep({
		inputSize: 2,
		hiddenLayers: [10],
		outputSize: 2,
	});

	// Same test as previous, but combined on a single set
	const trainingDataString = `
[
  [
    [1, 5],
    [2, 4],
    [3, 3],
    [4, 2],
    [5, 1]
  ], [
    [1, 5.2],
    [2, 4],
    [3, 3],
    [4, 2],
    [5, 1],
    [8, 7],
    [10, 10],
    [2, 1]
  ]
]`;
	const trainingData = JSON.parse(trainingDataString.trim());

	console.log('Training Data:\n' + trainingDataString.trim());

	net.train(trainingData, { log: false, errorThresh: 0.09 });

	const seriesOneString = `
[
  [1, 5],
  [2, 4],
  [3, 3],
  [4, 2]
]
	`;
	const seriesOne = JSON.parse(seriesOneString.trim())
	const closeToFiveAndOne = net.run(seriesOne);

	console.log(`
Time Series input:
${seriesOneString.trim()}

Next in series output:
${closeToFiveAndOne}
(should be 5,1)
	`.trim());

	const forecastInputString = `
[
  [1, 5],
  [2, 4]
]
	`;
	const forecastInput = JSON.parse(forecastInputString.trim())
	
	const forecast = net.forecast(
		forecastInput,
		10
	);

	console.log(`
Forecast Input:
${forecastInputString.trim()}

Forecast Next 10 (should start with 3,3):
${JSON.stringify(forecast, null, 2)}
	`.trim());
})()
