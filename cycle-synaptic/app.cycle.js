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