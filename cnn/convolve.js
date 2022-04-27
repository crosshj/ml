const matrices3x3 = [
	{
		name: 'mean removal',
		data: [
			[-1, -1, -1],
			[-1,  9, -1],
			[-1, -1, -1]
		]
	}, {
		name: 'sharpen',
		data: [
			[ 0, -2,  0],
			[-2, 11, -2],
			[ 0, -2,  0]
		]
	}, {
		name: 'blur',
		data: [
			[ 1,  2,  1],
			[ 2,  4,  2],
			[ 1,  2,  1]
		],
		//offset: -1024,
	}, {
		name: 'emboss',
		data: [
			[ 2,  0,  0],
			[ 0, -1,  0],
			[ 0,  0, -1]
		],
		offset: 127,
	}, {
		name: 'emboss subtle',
		data: [
			[ 1,  1, -1],
			[ 1,  3, -1],
			[ 1, -1, -1]
		],
	}, {
		name: 'edge detect',
		data:[
			[ 1,  1,  1],
			[ 1, -7,  1],
			[ 1,  1,  1]
		],
	}, {
		name: 'edge detect 2',
		data: [
			[-5,  0,  0],
			[ 0,  0,  0],
			[ 0,  0,  5]
		],
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
		offset: -255,
	}
];
const kernels = [...matrices3x3, ...matrices5x5];

function applyFilter(src, kernel, divisor = 1, offset = 0, opaque = true) {
	var w = src.width;
	var h = src.height;
	var dst = new ImageData(w, h);
	var dstBuf = dst.data;
	var srcBuf = src.data;
	var rowOffset = Math.floor(kernel.length / 2);
	var colOffset = Math.floor(kernel[0].length / 2);

	for (var row = 0; row < h; row++) {
		for (var col = 0; col < w; col++) {
			var result = [0, 0, 0, 0];
			for (var kRow = 0; kRow < kernel.length; kRow++) {
				for (var kCol = 0; kCol < kernel[kRow].length; kCol++) {
					var kVal = kernel[kRow][kCol]
					var pixelRow = row + kRow - rowOffset;
					var pixelCol = col + kCol - colOffset;

					if (pixelRow < 0 || pixelRow >= h ||
						pixelCol < 0 || pixelCol >= w
					) {
						continue;
					}

					var srcIndex = (pixelRow * w + pixelCol) * 4;
					for (var channel = 0; channel < 4; channel++) {
						if (opaque && channel === 3) {
							continue;
						} else {
							var pixel = srcBuf[srcIndex + channel];
							result[channel] += pixel * kVal;
						}
					}
				}
			}

			var dstIndex = (row * w + col) * 4;
			for (var channel = 0; channel < 4; channel++) {
				var val = (opaque && channel === 3)
					? 255
					: result[channel] / divisor + offset;
				dstBuf[dstIndex + channel] = val;
			}
		}
	}
	return dst;
}

function convolve(id, filterName){
	const kernel = kernels.find(x => x.name === filterName);
	if(!kernel) {
		console.log('could not find filter: ' + filterName)
		return;
	}
	return applyFilter(id, kernel.data, kernel.divisor, kernel.offset, kernel.opaque);
}

export default convolve;
