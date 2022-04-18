import {NeuralNetwork} from './lib/snn.js'

function shuffle(array) {
	for (let i = array.length - 1; i > 0; i--) {
		let j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

const normalize = (n) => n/40;
const deNormal = (n) => Math.round((n*40).toFixed(1));

const DATA = [
	{ input: [2.0, 1.0], output: [6.0] },
	{ input: [5.0, 1.0], output: [8.0] },
	{ input: [7.0, 4.0], output: [12.0] },
	{ input: [9.0, 4.0], output: [15.0] },
	{ input: [12.0, 5.0], output: [19.0] },
];

let design = [2,10,5,1];

//https://github.com/howion/activation-functions
//https://towardsdatascience.com/activation-functions-neural-networks-1cbd9f8d91d6
let options = {
	learning_rate: 0.3,
	activation: function(x){
		return (1 / (1 + Math.exp(-x)) );
		//return Math.max(0, x); //relu
	},
	derivative: function(y){
		// here the y, is already passed through activation(x).
		//Works well for the Sigmoid.
		return (y * (1-y));

		//return y<0 ? 0 : 1; //relu
	}
};
const brain = new NeuralNetwork(design, options);

const error = (prediction, trueValue) => (prediction - trueValue) ** 2

const MAX_IT = 2500;
const trace ={
	name: 'total',
	x:[],
	y:[],
	type: 'scatter'
};
const traceX = [
	{ ...JSON.parse(JSON.stringify(trace)), name:'one' },
	{ ...JSON.parse(JSON.stringify(trace)), name:'two' },
	{ ...JSON.parse(JSON.stringify(trace)), name:'three' },
	{ ...JSON.parse(JSON.stringify(trace)), name:'four' },
	{ ...JSON.parse(JSON.stringify(trace)), name:'five' },
];

for (const i of Array(MAX_IT).keys()) {
	const LOG = i > 1 || true;
	var errors = 0
	for (const [j, dataPoint] of DATA.entries()) {
		const {input, output} = DATA[j]
		let [prediction] = brain.predict(input.map(normalize));
		brain.train(
			input.map(normalize),
			output.map(normalize)
		);
		prediction = deNormal(prediction);
		const err = output - prediction; //error(prediction, output);
		LOG && traceX[j].x.push(i);
		LOG && traceX[j].y.push(err);
		errors += err

		i==(MAX_IT-1) && console.log({ prediction, expected: output[0] })
	}
	const epochError = errors / DATA.length
	i==(MAX_IT-1) && console.log(`epoch ${i + 1}`)
	i==(MAX_IT-1) && console.log(`error: ${epochError}\n`);
	LOG && trace.x.push(i);
	LOG && trace.y.push(epochError);
}

console.log(brain.view())

const mainColor = '#999';
const colors = {
	tickcolor: mainColor,
	linecolor: mainColor,
	gridcolor: mainColor,
	tickfont: { color: mainColor },
	legend: { font: { color: mainColor } }
};
Plotly.newPlot('graph', [...traceX, trace ], {
	plot_bgcolor: "rgba(0,0,0,0)",
	paper_bgcolor: "rgba(0,0,0,0)",
	color: mainColor,
	yaxis: colors,
	xaxis: colors,
	legend: colors.legend
});