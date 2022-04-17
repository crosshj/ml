
const Timer = (fn, time) => {
	let running = false;
	let lastTime;

	function timer() {
		if(!running) return;
		window.requestAnimationFrame(timer);
		const currentTime = (new Date()).getTime();

		if (currentTime - lastTime >= time) {
			lastTime = currentTime;
			fn();
		}
	}

	return {
		pause: () => {
			running = false;
		},
		play: () => {
			lastTime = (new Date()).getTime();
			running = true;
			timer();
		}
	};
};

class Controls {
	constructor({ play, pause}={}){
		const playFn = play || (() => {});
		const pauseFn = pause || (() => {});
		const playBtn = document.getElementById('play');
		const pauseBtn = document.getElementById('pause');
		pauseBtn.classList.add('active');

		playBtn.onclick = () => {
			pauseBtn.classList.remove('active');
			playBtn.classList.add('active');
			playFn();
		}
		pauseBtn.onclick = () => {
			playBtn.classList.remove('active');
			pauseBtn.classList.add('active');
			pauseFn();
		}
	}
}

class Board {
	element;
	width;
	height;

	constructor({ width=1024, height=1024 }={}){
		this.width=width;
		this.height=height;

		const canvas = document.getElementById('board');
		canvas.width = width;
		canvas.height = height;
		this.ctx = canvas.getContext("2d");
		this.render();
	}

	render(){
		const { ctx, width, height } = this;
		ctx.clearRect(0,0,width,height);
		
		const radius = width/128/2;
		const maxIt = 0.1*128*128;
		for(var i=0; i<maxIt; i++) {
			var x = Math.floor(Math.random()*width/(2*radius))*2*radius+radius;
			var y = Math.floor(Math.random()*height/(2*radius))*2*radius+radius;
			//var radius = Math.floor(Math.random()*40)+10;

			var r = Math.floor(Math.random()*255);
			var g = Math.floor(Math.random()*255);
			var b = Math.floor(Math.random()*255);

			ctx.beginPath();
			ctx.arc(x,y,radius,Math.PI*2,0,false);
			//ctx.fillStyle = "#ccc";
			ctx.fillStyle = "rgba(" + r + "," + g + "," + b + ",1)";
			ctx.fill();
			ctx.closePath();
		}
	}
}

const board = new Board();
const timer = Timer(board.render.bind(board), 300);

const controls = new Controls(timer);