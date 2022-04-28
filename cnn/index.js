import '../shared/components/container.js';
import convolve from './convolve.js';

const {Architect, Trainer} = synaptic;
const NeuralContainer = document.querySelector('neural-container');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const notes = `
overall goals:
	- better platform for NN exploration
	- explore convolutional nn's

overall todo:
	- connect convolution to ANN
	- visualize output and in-progress processes

container todo:
	- loading screens
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


const dummyFn = (filter) => {
	return async (args) => {
		if(filter==='dry-run'){
			await delay(30);
			return args.id;
		}
		// for (var i=0,len=id.data.length; i < len; i+= 4) {
		// 	id.data[i] = 0;
		// 	id.data[i+1] = id.data[i+1];
		// 	id.data[i+2] = 0;
		// 	id.data[i+3] = 255;
		// }
		//mean removal, sharpen, blur, emboss, emboss subtle, edge detect, edge detect 2
		//await delay(0);
		const newImageData = convolve(null, filter, args.readImage) || args.id;
		return newImageData;
	};
};

NeuralContainer.functions = {
	// "net-convo": dummyFn,
	// "net-reconst": dummyFn
	dryRun: dummyFn('dry-run'),
	mean: dummyFn('mean removal'),
	sharpen: dummyFn('sharpen'),
	blur: dummyFn('blur'),
	emboss: dummyFn('emboss'),
	embossSubtle: dummyFn('emboss subtle'),
	edgeDetect: dummyFn('edge detect'),
	edgeDetect2: dummyFn('edge detect 2'),
	dunno: dummyFn('dunno'),
};

// NeuralContainer.onLoad(async () => {
// 	await NeuralContainer.changeImage('frog');
// });

await NeuralContainer.ready;
//console.log('okay to go neural net')

