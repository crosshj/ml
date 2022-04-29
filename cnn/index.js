import '../shared/components/container.js';
import convolve from './convolve.js';

const {Architect, Trainer} = synaptic;
const NeuralContainer = document.querySelector('neural-container');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const notes = `
todo:
	- connect convolution to ANN
	- convolution stride / dims / options
		- https://machinelearningmastery.com/padding-and-stride-for-convolutional-neural-networks/
`;
NeuralContainer.setNotes(notes.replace(/\t/g, '   '));

const tOptions = {
	rate: .01,
	iterations: 500,
	error: .0005,
	shuffle: false,
	log: 0
};

var input = 20;
var pool = 100;
var output = 1;
var connections = 20;
var gates = 10;

const liqNetOptions = [input, pool, output, connections, gates];
const netOptions = [20, 21, 1];


const filter = (filter) => async (args) => 
	convolve(null, filter, args.readImage) || args.id;

NeuralContainer.functions = {
	// "net-convo": todo,
	// "net-reconst": todo
	dryRun: filter('dry-run'),
	mean: filter('mean removal'),
	sharpen: filter('sharpen'),
	blur: filter('blur'),
	emboss: filter('emboss'),
	embossSubtle: filter('emboss subtle'),
	edgeDetect: filter('edge detect'),
	edgeDetect2: filter('edge detect 2'),
	dunno: filter('dunno'),
};

NeuralContainer.onLoad(async () => {
	//await NeuralContainer.changeImage('frog');
	NeuralContainer.runButton.onclick()
});

await NeuralContainer.ready;
//console.log('okay to go neural net')

