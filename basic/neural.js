import {NeuralNetwork} from './lib/snn.js'

const normalize = (n) => n/40;
const deNormal = (n) => Math.round((n*40).toFixed(1));

const DATA = [
	{ input: [2.0, 1.0], output: [5.0] },
	{ input: [5.0, 1.0], output: [7.0] },
	{ input: [7.0, 4.0], output: [12.0] },
	{ input: [12.0, 5.0], output: [19.0] },
];

let design = [2,20,10,1];
let options = {
	learning_rate: 0.3,
	activation: function(x){
		return (1 / (1 + Math.exp(-x)) );
	},
	derivative: function(y){
		// here the y, is already passed through activation(x).
		//Works well for the Sigmoid.
		return (y * (1-y));
	}
};
const brain = new NeuralNetwork(design, options);

const error = (prediction, trueValue) => (prediction - trueValue) ** 2

const MAX_IT = 500;
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
];

for (const i of Array(MAX_IT).keys()) {
	var errors = 0
	for (const [j, dataPoint] of DATA.entries()) {
		const {input, output} = DATA[j]
		let [prediction] = brain.predict(input.map(normalize));
		brain.train(
			input.map(normalize),
			output.map(normalize)
		);
		prediction = deNormal(prediction);
		const err = error(prediction, output);
		i > 1 && traceX[j].x.push(i);
		i > 1 && traceX[j].y.push(err);
		errors += err

		i==(MAX_IT-1) && console.log({ prediction, expected: output[0] })
	}
	const epochError = errors / DATA.length
	i==(MAX_IT-1) && console.log(`epoch ${i + 1}`)
	i==(MAX_IT-1) && console.log(`error: ${epochError}\n`);
	i > 1 && trace.x.push(i);
	i > 1 && trace.y.push(epochError);
}

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