((window)=> {
	var newWorker = function (funcObj) {
		// TODO: also should work with multiple functions and external file

		var blobURL = URL.createObjectURL(new Blob(['(',
				funcObj.toString(),
			')()'], {
			type: 'application/javascript'
		})),

		worker = new Worker(blobURL);

		URL.revokeObjectURL(blobURL);

		return worker;
	}

	//http://www.hyperlounge.net/blog/up-the-workers-2/
	//https://www.html5rocks.com/en/tutorials/workers/basics/
	//https://developers.google.com/web/updates/2011/12/Transferable-Objects-Lightning-Fast
	//http://www.hyperlounge.net/blog/up-the-workers-2/

	// TODO: use this to do the heavy lifting
	//   var w = newWorker(function () {
	//     var i = 0;

	//     function timedCount() {
	//         i = i + 1;
	//         postMessage(i);
	//         setTimeout(timedCount, 500);
	//     }

	//     timedCount();
	//   });

	//   w.onmessage = function (event) {
	//       document.getElementById("result").innerHTML = event.data;
	//   }

	const defaultCSS = (dimensions = { zoom: 1}) => `
		@media (min-width:320px) { /* smartphones, portrait iPhone, portrait 480x320 phones (Android) */ }
		@media (min-width:480px) { /* smartphones, Android phones, landscape iPhone */ }
		@media (min-width:600px) { /* portrait tablets, portrait iPad, e-readers (Nook/Kindle), landscape 800x480 phones (Android) */ }
		@media (min-width:801px) { /* tablet, landscape iPad, lo-res laptops ands desktops */ }
		@media (min-width:1025px) { /* big landscape tablets, laptops, and desktops */ }
		@media (min-width:1281px) { /* hi-res laptops and desktops */ }

		body {
			background-color: #222;
			font-family: verdana;
		}


		#canvas-container {
			display: flex;
			flex-direction: column;
		}

		#rotateMessage {
			display: none;
			color: white;
			width: 90%;
			margin: auto;
			text-align: center;
			font-size: 5em;
			color: #00BCD4;
		}

	/*
		@media screen and (orientation: portrait) and (min-height: 650px) and (max-height: 985px) {
			#canvas-container { display: none; }
			#rotateMessage { display: block; }
		}
	*/

		#canvas-container canvas {
			zoom: ${5*dimensions.zoom};
			margin: auto;
			border: 0px solid #8a8a8a;
			/* box-shadow: 1px -4px 12px 0px #d4d4d4; */
			background-color: #fefefe;
			margin-top: 5%;
			image-rendering: pixelated;
			border-radius: 0.5px;
			position: absolute;
			top: 0px;
			left: 0px;
			right: 0px;
		}

		@media screen and (max-width: 1400px) {
			#canvas-container canvas{
				zoom: ${4*dimensions.zoom};
				margin-top: 2%;
			}
		}

		@media screen and (max-width: 750px) {
			#canvas-container canvas{
				zoom: ${3*dimensions.zoom};
			}
		}

	/*
		@media screen and (max-width: 750px)
		and (orientation: landscape) and (max-height: 450px) {
			#canvas-container canvas{
				zoom: ${2.5*dimensions.zoom};
			}
		}
		*/

		@media screen and (max-width: 500px) {
			#canvas-container canvas{
				zoom: ${2*dimensions.zoom};
			}
		}

		@media screen and (max-width: 350px) {
			#canvas-container canvas{
				zoom: ${1*dimensions.zoom};
			}
		}

		#button-container {
			margin: auto;
			position: absolute;
			left: 0px;
			right: 0px;
			bottom: 15px;
			text-align: center;
		}

		button {
			border-radius: 50px;
			color: #333333;
			font-size: 20px;
			background: rgba(255, 255, 255, 0.1);
			padding: 9.5px 15px 11px 15px;
			text-decoration: none;
			border: 1px solid transparent;
			width: 42px;
			min-height: 42px;
			color: transparent;
			margin: 10px 10px;
			transition: background-color 1s, color 0s;
			overflow: hidden;
			min-width: 48px;
		}

		button:hover {
			background-color: #7eccfc;
			color: #111;
			width: auto;
			transition: color 0.5s;
		}

		:focus {
			display: inline-block;
			border: 1px solid red;
			outline: none;
			border-radius: 45px;
		}

		@media screen and (max-width: 1400px) {
			#button-container {
				margin-top: 2em;
			}
		}

		@media screen and (max-width: 750px) {
			#button-container {
				margin-top: 1em;
			}
		}

		@media screen and (max-width: 500px) {
			#button-container {
				margin-top: 1em;
			}
		}
`;

	const defaultButtons = [];

	const _default = ({ dims, parent='body' }) => ({
		css: defaultCSS(dims),
		dimensions: dims || {
			x: 160,
			y: 120
		},
		buttons: defaultButtons,
		id: 'myCanvas',
		parent
	});

	var CanvasPlus = function(options={}) {
		//TODO: validate options
		this.options = options;
		//MAYBE: wrap all buttons' onclick with throttle
	};

	CanvasPlus.prototype.start = function start() {
		const dims = this.options.dimensions;
		const parent = this.options.parent;
		const def = _default({dims, parent});
		this.styleSheet = addcss(this.options.css || def.css);
		this.dimensions = this.options.dimensions || def.dimensions;
		if (!this.options.init){
			def.buttons = [{
				text: 'random',
				onClick: throttle(() => randomPixels.call(this, setImageDataPixel))
			}];  
		}

		var buttons;
		if (def.buttons.length === 0 && this.options.buttons){
			buttons = this.options.buttons.map(button => ({
				text: button.text,
				onClick: throttle(() => button.onClick.call(this, setImageDataPixel))
			}))
		}

		this.canvas = createCanvas({
			id: this.options.id || def.id,
			dimensions: this.dimensions,
			parent: this.options.parent || def.parent,
			buttons: buttons || def.buttons
		});
		(this.options.init || randomPixels).call(this, setImageDataPixel);
	};

	CanvasPlus.prototype.stop = function stop() {
		//TODO: teardown
	};

	// dynamically append css
	function addcss(css){
		var head = document.getElementsByTagName('head')[0];
		var s = document.createElement('style');
		s.setAttribute('type', 'text/css');
		if (s.styleSheet) {     // IE
				s.styleSheet.cssText = css;
		} else {                // the world
				s.appendChild(document.createTextNode(css));
		}
		head.appendChild(s);
		return s;
	}

	function createCanvas({id, dimensions, parent, buttons}) {
		var div = document.getElementById('canvas-container') || document.createElement('div');
		div.id = 'canvas-container';

		var canvas = makeCanvas({id, dimensions, parent});
		div.appendChild(canvas);

		var buttonDiv = makeButtons({ buttons });
		div.appendChild(buttonDiv);

		if(!document.getElementById('canvas-container')){
			document.querySelector(parent).appendChild(div);
		}
		var firstButton = div.querySelectorAll('button')[0];
		if (firstButton){
			firstButton.focus();
		}

		if(document.getElementById('rotateMessage')){
			return canvas;
		}

		var rotMess = document.createElement('div');
		rotMess.id = 'rotateMessage';
		rotMess.textContent = 'Rotate your device!';
		document.querySelector(parent).appendChild(rotMess);

		return canvas;
	}


	function makeCanvas({id, dimensions}){
		var canvas = document.createElement('canvas');
		canvas.width = dimensions.x;
		canvas.height = dimensions.y;
		canvas.id = id;
		canvas.textContent = 'Your browser does not support the HTML5 canvas tag.';
		//canvas.style.filter = 'url(#myFilter)';
		return canvas;
	}

	function makeButtons({buttons = [] } = {}){
		var buttonDiv = document.getElementById('button-container') || document.createElement('div');
		buttonDiv.id = 'button-container';

		if(buttons.length === 0){
		 return buttonDiv;
		}

		var first, last;
		buttons.forEach((button,index) => {
			var el = document.createElement('button');
			el.textContent = button.text;
			el.onclick = button.onClick;
			el.tabindex = index;
			if (index === 0){
				first = el;
			}
			if (index === buttons.length - 1){
				last = el;
				el.onkeydown = function(e){
					if( e.keyCode === 9 ) {
							first.focus();
							return false;
					}
				};
			}
			buttonDiv.appendChild(el);
		});

		buttonDiv.querySelectorAll('button')[0].onkeydown = function(e){
			if( e.keyCode === 9 && e.shiftKey) {
				last.focus();
				return false;
			}
		};

		return buttonDiv;
	}

	// https://remysharp.com/2010/07/21/throttling-function-calls
	function throttle(fn, threshhold, scope) {
		threshhold || (threshhold = 250);
		var last,
				deferTimer;
		return function () {
			var context = scope || this;

			var now = +new Date,
					args = arguments;
			if (last && now < last + threshhold) {
				// hold on to it
				clearTimeout(deferTimer);
				deferTimer = setTimeout(function () {
					last = now;
					fn.apply(context, args);
				}, threshhold);
			} else {
				last = now;
				fn.apply(context, args);
			}
		};
	}

	var randomImageData;
	function randomPixels(setter){
		if (!setter) return;

		var ctx = this.canvas.getContext('2d');
		randomImageData = randomImageData
			? randomImageData
			: ctx.createImageData(this.dimensions.x, this.dimensions.y);

		setter(randomImageData, {r:255}, {x:0, y:0, xmax:1});
		requestAnimationFrame(
			() => ctx.putImageData( randomImageData, 0, 0 )
		);
	}


	// used for setting entire page at a time
	function setImageDataPixel(imageData, {r=0, g=0, b=0, a=255}, {x=0, y=0, xmax=1}){
		const ad = imageData.data;
		const rowOffset = y * 4 * xmax;
		const colOffset = x * 4;
		const offset = rowOffset + colOffset;
		ad[offset + 0]   = r;
		ad[offset + 1]   = g;
		ad[offset + 2]   = b;
		ad[offset + 3]   = a;
	}

	window.CanvasPlus = CanvasPlus;
})(window);