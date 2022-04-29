const matrices3x3 = [
	{
		name: 'mean removal',
		data: [
			[-1, -1, -1],
			[-1,  9, -1],
			[-1, -1, -1]
		],
		offset: 0,
		divisor: 1.5
	}, {
		name: 'sharpen',
		data: [
			[ 0, -2,  0],
			[-2, 11, -2],
			[ 0, -2,  0]
		],
		//offset: 50,
		divisor: 3
	}, {
		name: 'blur',
		data: [
			[ 1,  2,  1],
			[ 2,  4,  2],
			[ 1,  2,  1]
		],
		offset: 0,
		divisor: 16
	}, {
		name: 'emboss',
		data: [
			[ 2,  0,  0],
			[ 0, -1,  0],
			[ 0,  0, -1]
		],
		offset: 80,
		//divisor: 0.5
	}, {
		name: 'emboss subtle',
		data: [
			[ 1,  1, -1],
			[ 1,  3, -1],
			[ 1, -1, -1]
		],
		divisor: 2.5
	}, {
		name: 'edge detect',
		data:[
			[ 1,  1,  1],
			[ 1, -7,  1],
			[ 1,  1,  1]
		],
		offset: 10,
		divisor: 1.5
	}, {
		name: 'edge detect 2',
		data: [
			[-5,  0,  0],
			[ 0,  0,  0],
			[ 0,  0,  5]
		],
		offset: 0,
		divisor: 2
	}
];
const matrices5x5 = [
	{
		name: 'dunno',
		data: [
			[ 0,  0, -1,  0,  0],
			[ 0,  0, -2,  0,  0],
			[-1, -2,  9,  0,  0],
			[ 0,  0,  0,  0,  0],
			[ 0,  0,  0,  0,  0],
		],
		//offset: -255,
		divisor: 3.75
	}
];
const kernels = [...matrices3x3, ...matrices5x5];

function applyFilter(img, kernel, divisor = 1, offset = 0, opaque = true) {
	const dim = Math.sqrt(kernel.flat().length);
	const pad = Math.floor(dim / 2);

	if (dim % 2 !== 1) {
		console.log('Cannot load kernel!');
		return;
	}
	const imageOffset = {
		x: -1*pad,
		y: -1*pad,
		width: 2*pad,
		height: 2*pad
	};

	const { id: src } = typeof img === "function"
		? img(imageOffset)
		: { id: img };

	var w = src.width-(2*pad);
	var h = src.height-(2*pad);
	var dst = new ImageData(w, h);
	var dstBuf = dst.data;
	var srcBuf = src.data;
	var rowOffset = Math.floor(kernel.length / 2);
	var colOffset = Math.floor(kernel[0].length / 2);

	for (var row = 0; row < h; row++) {
		for (var col = 0; col < w; col++) {

			const dstIndex = (row * w + col) * 4;
			const srcIndex = ((pad+row) * src.width + (pad+col)) * 4;

			for (var channel = 0; channel < 4; channel++) {
				if(channel === 3){
					dstBuf[dstIndex + channel] = 255;
					continue;
				}
				let results = 0;
				for (var kRow = 0; kRow < kernel.length; kRow++) {
					for (var kCol = 0; kCol < kernel[kRow].length; kCol++) {
						if(kernel[kRow][kCol] === 0) continue;
						const kRowOffset = (kRow - rowOffset) * src.width;
						const kColIndex = kCol - colOffset;
						const kOffset = (kRowOffset + kColIndex) * 4;
						var pixel = srcBuf[srcIndex + kOffset + channel];
						results += pixel*kernel[kRow][kCol];
					}
				}
				dstBuf[dstIndex + channel] =  results / divisor + offset;
			}
		}
	}
	return dst;
}

function convolve(id, filterName, readImage){
	const kernel = kernels.find(x => x.name === filterName);
	if(!kernel) {
		console.log('could not find filter: ' + filterName)
		return;
	}
	return applyFilter(id || readImage, kernel.data, kernel.divisor, kernel.offset, kernel.opaque);
}

export default convolve;
