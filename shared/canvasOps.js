((window)=> {

	const clone = item => {
		return JSON.parse(JSON.stringify(item));
	};

	function range(from, to){
		return new Array(to).fill();
	}

	function lenna(setter){
		if (!setter) return;
		var ctx = this.canvas.getContext('2d');
		var imageObj = new Image();
		imageObj.setAttribute('crossOrigin', 'Anonymous');

		imageObj.onload = function() {
			ctx.drawImage(imageObj, 0, 0);
		};
		// imageObj.src = 'https://crosshj.com/sandbox/src/canvas/Lenna.png';
		imageObj.src = 'https://crosshj.com/sandbox/src/canvas/lenna3.png';
	}

	function vader(setter){
		if (!setter) return;
		var ctx = this.canvas.getContext('2d');
		var imageObj = new Image();
		imageObj.setAttribute('crossOrigin', 'Anonymous');

		imageObj.onload = function() {
			ctx.drawImage(imageObj, 0, 0);
		};
		// imageObj.src = 'https://crosshj.com/sandbox/src/canvas/vader.png';
		imageObj.src = 'https://crosshj.com/sandbox/src/canvas/vader2.png';
	}

	var randomImageData;
	function random(setter){
		if (!setter) return;

		var ctx = this.canvas.getContext('2d');

		// http://stackoverflow.com/a/23095731/1627873
		function randomRGB(){
			var num = Math.round(0xffffff * Math.random());
			var r = num >> 16;
			var g = num >> 8 & 255;
			var b = num & 255;
			return { r, g, b };
		}

		function randomPixel(setter, xmax, ymax){
			range(0, xmax).forEach((unused_x, x) => {
				range(0, ymax).forEach((unused_y, y) => {
					var _color = randomRGB();
					_color.r = _color.b = 0;
					//_color.r = Math.round(Math.random()) * 255;
					//_color.b = Math.round(Math.random()) * 255;

					_color.g = Math.round(Math.random() * 255);
					// _color.g += Math.round(Math.random() * 128) -64;
					setter(_color, {x, y, xmax});
				});
			});
		}

		randomImageData = randomImageData
			? randomImageData
			: ctx.createImageData(this.dimensions.x, this.dimensions.y);

		randomPixel(
			(color, pos) => { setter(randomImageData, color, pos)},
			this.dimensions.x,
			this.dimensions.y
		);

		ctx.putImageData( randomImageData, 0, 0 );
	}

	window.canvasOps = {
		lenna,
		vader,
		random
	};
})(window)