// SYNAPTIC --------------------------------------------------------------------
const {Architect, Trainer} = synaptic;

var results = [];
const network = new Architect.Perceptron(3,5,1);
const trainer = new Trainer(network);
const clone = item => {
	return JSON.parse(JSON.stringify(item));
};
function triggerEvent(el, type){
	if ('createEvent' in document) {
		// modern browsers, IE9+
		var e = document.createEvent('HTMLEvents');
		e.initEvent(type, false, true);
		el.dispatchEvent(e);
	}
}

const train = ({color}={}, output) => {
	if (!color || !(output===0 || output===1)) return;
	results.push({
		input: [
			color.r/255,
			color.g/255,
			color.b/255
		],
		output: [output]
	});

	const trainingSet = clone(results);
	const trainingOptions = {
		rate: .1,
		error: .001,
		shuffle: true,
		log: 0//1
	};
	trainer.trainAsync(trainingSet, trainingOptions)
		.then(results => {
			//console.log('!done', results)
			triggerEvent(document.body, 'training-done');
		});

	return;
}

const predict = color => {
	const normalized = [
		color.r/255,
		color.g/255,
		color.b/255
	];
	const output = (() => {
		const out = Math.round(network.activate(normalized)[0]);
		//console.log({out})
		return isNaN(out)
			? undefined
			: out ? 'white' : 'black';
	})();
	//console.log(network.neurons().map(x => x.neuron));
	console.log(network.toJSON().neurons
		.map(x => x.activation)
		.filter((x,i) => i>2 && i<8)
		.reduce((x,all) => x+all, 0) / 5
	);
	const outputNeuron = network.toJSON().neurons[8];
	const {state, activation, bias} = outputNeuron;
	console.log("output neuron: ", JSON.stringify({state, activation, bias}));
	return {
		output,
		network: network.toJSON(),
		neurons: network.toJSON().neurons.map(x => x.activation)
	};
}

// CYCLE -----------------------------------------------------------------------
function render(state){
	const {button, div, label, input, h1, p, span} = CycleDOM;

	return div([
		// div('#desc',[
		//   span('.bold', 'synaptic.js demo'),
		//   span(' - train a neural network to recognize color contrast')
		// ]),
		div('#container', [
			div('#training-box.section', [
				div('.section-header', 'Which is easier to read?'),
				div('#swatches', [
					div(`.swatch-box${state.guess==='black'?'.guess':''}`, [
						div('#black-swatch.swatch',
							{style: colorToStyle(state.color)},
							[(!state.loading
								? p([
									span('.swatch-text', 'This'),
									span('.sub-text', 'is better')
								])
								: div('.spinner')
							)]
						)
					]),
					div(`.swatch-box${state.guess==='white'?'.guess':''}`, [
						div('#white-swatch.swatch',
							{style: colorToStyle(state.color)},
							[(!state.loading
								? p([
									span('.swatch-text', 'This'),
									span('.sub-text', 'is better')
								])
								: div('.spinner')
							)]
						)
					])
				]),
				p((state.loading ? 'Training...' : 'Use Left/Right Arrows or click one'))
			])
		])
	]);
}

const colorToStyle = (color) => ({
	backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`
});

const randomColor = () => {
	var rint = Math.floor( 0x100000000 * Math.random());
	return {
		r: rint & 255,
		g: rint >> 8 & 255,
		b: rint >> 16 & 255
	};
};

function main(sources) {
	const xs = xstream.default;
	const action$ = xs.merge(
		sources.DOM.select('#black-swatch').events('click').mapTo(0),
		sources.DOM.select('#white-swatch').events('click').mapTo(1),
		sources.Body.events('keyup').map(event => {
			if (event.keyCode===37) return 0;
			if (event.keyCode===39) return 1;
			return -1;
		}),
		sources.Body.events('training-done').map(event => 'training-done')
	);

	var state = undefined;
	const accumulator = (acc, next) => {
		if (next === -1) return state;
		if (next === undefined || next === 'training-done'){
			const color = randomColor();
			const prediction = predict(color);
			const guess = prediction.output;
			const loading = false;
			window.cy.$('#R').css({content: `R = ${color.r} (${(color.r/255).toFixed(4)})`});
			window.cy.$('#G').css({content: `G = ${color.g} (${(color.g/255).toFixed(4)})`});
			window.cy.$('#B').css({content: `B = ${color.b} (${(color.b/255).toFixed(4)})`});
			window.cy.$('edge').forEach((edge, i) => edge.css({
				'target-label': prediction.network.connections[i].weight.toFixed(2),
				fontSize: 8,
				color: 'white',
				'target-text-offset': 20
			}));
			[1,2,3,4,5].forEach(number => {
				window.cy.$('#hidden' + number).css({
					content: `${prediction.neurons[number+2].toFixed(4)}`,
					'background-color': prediction.neurons[number+2] >= 0.5 ? '#ccc' : '#fff'
				});
			});
			window.cy.$('#output').css({content: `${guess}${'\n'}${prediction.neurons[8].toFixed(4)}`});
			state = { color, guess, loading }
		}
		if (next === 0 || next === 1) {
			if (state.loading) return state;
			train(acc, next);
			state = {
				color: state.color,
				guess: state.guess,
				loading: true
			}
		}
		return state;
	};
	const initial = accumulator();

	const state$ = action$.fold(accumulator, initial);
	const vdom$ = state$.map(render);

	const driverSinks = {
		DOM: vdom$
	};

	return driverSinks;
}

function setupCycle(){
	const {run} = Cycle;
	const xs = xstream.default;
	const {makeDOMDriver} = CycleDOM;

	const drivers = {
		DOM: makeDOMDriver('#app'),
		Body: makeDOMDriver(document.body)
	};

	run(main, drivers);
}

//

function setupCytoscape(){
	var cy = cytoscape({
		container: document.getElementById('cy'),
		elements: [
			//nodes
			{ data: { id: 'B' } },
			{ data: { id: 'G' } },
			{ data: { id: 'R' } },
			{ data: { id: 'hidden1' } },
			{ data: { id: 'hidden2' } },
			{ data: { id: 'hidden3' } },
			{ data: { id: 'hidden4' } },
			{ data: { id: 'hidden5' } },
			{ data: { id: 'output' } }
		],
		style: [
			{
				selector: 'node',
				style: {
					'width': 'label',
					'height': 'label',
					'shape': 'roundrectangle',
					'content': 'data(id)',
					'border-width': 1,
					'border-color': '#ddd',
					'padding': 5,
					'text-opacity': 1,
					'text-valign': 'center',
					'text-halign': 'center',
					'background-color': '#fff'
				}
			},

			{
				selector: 'edge',
				style: {
					'width': 1,
					'target-arrow-shape': 'triangle',
					'line-color': '#ccc',
					'target-arrow-color': '#ccc',
					'curve-style': 'bezier'
				}
			}
		]
	});

	// hidden layer edges
	for (var i = 1; i <= 5; i++) {
		var source = 'hidden' + i;
		cy.add({
				data: {
						id: 'hidden-edge' + i,
						source: source,
						target: 'output'
				}
		});
	}

	//input layer edges
	['R', 'G', 'B'].forEach(item => {
		for (var k = 0; k < 5; k++) {
			cy.add({
					data: {
							id: 'input-edge' + item + '-' + (k+1),
							source: item,
							target: 'hidden' + (k+1)
					}
			});
		}
	});

	cy.layout({
		name: 'breadthfirst',
		directed: true
	});

	window.addEventListener('resize', () => {
		setTimeout(() => cy.layout({
			name: 'breadthfirst',
			directed: true
		}), 100);
	}, false);

	window.cy = cy;
}

function createDOM(){
	setupCytoscape();
	setupCycle();
}

document.addEventListener('DOMContentLoaded', createDOM, false);
