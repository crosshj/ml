import '../shared/components/container.js';
const {Architect, Trainer} = synaptic;
const NeuralContainer = document.querySelector('neural-container');

const notes = `
overall goals:
	- better platform for NN exploration
	- explore convolutional nn's

overall todo:
	- convolution layer(s) [manual at first]
	- convolution layer(s) framework later]
	- connect convolution to ANN
	- visualize output and in-progress processes

container todo:
	- better lifecycle
	- loading screens
	- better external interface
`;


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


NeuralContainer.onLoad(() => {
	//NeuralContainer.changeImage('frog');
});
NeuralContainer.setNotes(notes.replace(/\t/g, '   '));
