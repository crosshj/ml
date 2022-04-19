import {NeuralNetwork} from './lib/snn.js'

function shuffle(array) {
	for (let i = array.length - 1; i > 0; i--) {
		let j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

// const normalize = (n) => n/40;
// const deNormal = (n) => n*40;
// const DATA = [
// 	{ input: [2.0, 1.0], output: [6.0] },
// 	{ input: [5.0, 1.0], output: [8.0] },
// 	{ input: [7.0, 4.0], output: [12.0] },
// 	{ input: [9.0, 4.0], output: [15.0] },
// 	{ input: [12.0, 5.0], output: [19.0] },
// ];

//XOR
const normalize = (n) => n;
const deNormal = (n) => n;
const DATA = [ 
	{ input: [0, 1],output: [1] },
	{ input: [1, 0], output: [1] },
	{ input: [0, 0],output: [0] },
	{ input: [1, 1],output: [0] }
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
		//prediction = deNormal(prediction);
		const err = normalize(output) - prediction; //error(prediction, output);
		//const err = error(prediction, normalize(output))
		LOG && traceX[j].x.push(i);
		LOG && traceX[j].y.push(err);
		errors += err

		i==(MAX_IT-1) && console.log({ prediction: deNormal(prediction), expected: output[0] })
	}
	const epochError = errors / DATA.length
	i==(MAX_IT-1) && console.log(`epoch ${i + 1}`)
	i==(MAX_IT-1) && console.log(`error: ${epochError}\n`);
	LOG && trace.x.push(i);
	LOG && trace.y.push(epochError);
}

const Table = (cols, data) => {
	// const span = document.createElement('span');
	// span.textContent = label;
	// document.body.append(span);
	const table = document.createElement('table');
	table.style.border = '1px solid currentColor';
	
	const th = document.createElement('tr');
	for(var c of cols){
		const td = document.createElement('td');
		td.textContent = c;
		if(c === "weights"){
			td.setAttribute('colspan', '100%');
		}
		th.append(td);
	}
	table.append(th);
	
	for(var row of data){
		const tr = document.createElement('tr');
		tr.style.border = '1px solid currentColor'
		for(var col of row){
			const td = document.createElement('td');
			td.textContent = col.toFixed(3);
			tr.append(td);
		}
		table.append(tr);
	}
	document.body.append(table)
}

const NetworkView = (data) => {
	for(var layer of data){
		const { bias, weights } = layer;
		console.log({ bias, weights });
		let rows = [];
		for(var [i,b] of bias.entries()){
			rows.push([...b, ...weights[i],]);
		}
		Table(['bias', 'weights'],rows);
	}
}

NetworkView(brain.view());


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
	yaxis: {
		...colors,
		range: [-1, 1],
	},
	xaxis: colors,
	legend: colors.legend,
	scene: {
		aspectratio: {x: 1, y: 2, z: 1}
	}
});
