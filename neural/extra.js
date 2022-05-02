import Filter from './filter-svg.js';

const Extra = (container) => {
	const div = document.createElement('div');
	div.id = 'extra-controls'
	div.innerHTML = `
		<style>
			#extra-controls {
				display: flex;
				flex-direction: column;
				width: 100%;
				font-family: arial;
			}
			#indicators {
				display: flex;
				flex-direction: row;
				justify-content: space-between;
				background: #2b2b2b;
				box-shadow: inset 0px 2px 6px -3px black;
			}
			#iterations > div,
			#error > div,
			#filter {
				padding: 0.5em;
			}
			#results {
				width: 300px;
				height: 200px;
				background: #222222;
				margin: auto;
				left: 0;
				right: 0;
				display: grid;
				grid-template-rows: repeat(12, 1fr);
				grid-template-columns: repeat(16, 1fr);
				grid-auto-flow: column;
				font-size: 9px;
				font-family: monospace;
				color: white;
				margin-bottom: 1em;
				margin-top: 2em;
				box-shadow: 0px 0px 10px 0px #111111;
			}
			#results > div {
				background: #333;
				text-align: center;
				display: flex;
				justify-content: center;
				align-items: center;
			}
			#filter {
				display: flex;
				margin-top: auto;
				margin-bottom: auto;
				margin-right: 0.5em;
			}
		</style>
		<div id="indicators">
			<div id="iterations"></div>
			<div id="error"></div>
			<div id="filter">
				<button>filter</button>
			</div>
		</div>
		<div id="results"></div>
	`;
	container.extend.append(div);
	return div
};
const gradient = (x, max) => {
	const r = Math.floor((x/max) * 255);
	const g = 0;
	const b = 255 - r;
	return `rgb(${r},${g},${b})`;
};
const Results = (extra) => {
	const div = extra.querySelector('#results');
	div.style.display = 'none';
	return {
		set: ({ iterations, error }) => {
			div.style.display = 'grid';
			const square = document.createElement('div');
			square.textContent = iterations;
			square.style.backgroundColor = gradient(iterations, 100);
			div.append(square);
		},
		reset: () => {
			div.style.display = 'none';
			div.innerHTML = '';
		}
	};
};

const AddExtra = (container) => {
	const extra = Extra(container);
	const results = Results(extra);

	const iterDiv = extra.querySelector('#iterations');
	iterDiv.set = (x) => iterDiv.innerHTML = '<div>iterations: ' + x + '</div>';
	iterDiv.clear = () => iterDiv.innerHTML = "";
	const errorDiv = extra.querySelector('#error');
	errorDiv.set = (x) => errorDiv.innerHTML = '<div>error: ' + x + '</div>';
	errorDiv.clear = () => iterDiv.innerHTML = "";

	const filter = new Filter();
	filter.attach(container.canvas.parentNode);
	const filterButton = extra.querySelector('#filter');
	filterButton.onclick = () => filter.toggle(container.canvas);
	
	return {
		results,
		iterations: iterDiv,
		error: errorDiv
	};
}

export default AddExtra;
