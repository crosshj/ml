/*
for flocking followers, see: https://caza.la/synaptic/
*/


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
		pauseBtn.classList.add('hidden');

		playBtn.onclick = () => {
			pauseBtn.classList.remove('hidden');
			playBtn.classList.add('hidden');
			playFn();
		}
		pauseBtn.onclick = () => {
			playBtn.classList.remove('hidden');
			pauseBtn.classList.add('hidden');
			pauseFn();
		}
	}
}

class Board {
	element;
	width;
	height;

	constructor({ width=1024, height=1024, reckon }={}){
		this.width=width;
		this.height=height;
		this.game = game;

		const canvas = document.getElementById('board');
		canvas.width = width;
		canvas.height = height;
		this.ctx = canvas.getContext("2d");
		// this.ctx.fillStyle = "rgb(18,18,18)";
		// this.ctx.fillRect(0,0,width,height);
		this.render();
	}

	render(){
		const { ctx, width, height, game } = this;
		ctx.clearRect(0,0,width,height);
		// ctx.globalAlpha = 0.1;
		// ctx.fillStyle = "rgb(18,18,18)";
		// ctx.fillRect(0,0,width,height);
		// ctx.globalAlpha = 1;
		const { players } = game;

		const radius = width/game.width/2;

		const drawDot = (x,y,r,g,b,a=1) => {
			const rad = radius*a;
			const arcX = (x*2*radius)+radius;
			const arcY = (y*2*radius)+radius;
			ctx.beginPath();
			ctx.arc(arcX,arcY,rad,Math.PI*2,0,false);
			ctx.fillStyle = `rgba(${r},${g},${b},${1})`;
			ctx.fill();
			ctx.closePath();
			if(arcX+rad > width-1){
				ctx.beginPath();
				ctx.arc(arcX-width,arcY,rad,Math.PI*2,0,false);
				ctx.fill();
				ctx.closePath();
			}
			if(arcY+rad > height-1){
				ctx.beginPath();
				ctx.arc(arcX,arcY-height,rad,Math.PI*2,0,false);
				ctx.fill();
				ctx.closePath();
			}
			if(arcX-rad < 0){
				ctx.beginPath();
				ctx.arc(arcX+width,arcY,rad,Math.PI*2,0,false);
				ctx.fill();
				ctx.closePath();
			}
			if(arcY-rad < 0){
				ctx.beginPath();
				ctx.arc(arcX,arcY+height,rad,Math.PI*2,0,false);
				ctx.fill();
				ctx.closePath();
			}
		};

		for(const {x,y,r,g,b,history} of players) {
			for(var i in history){
				const past = history[i];
				const alpha = (i)/history.length;
				drawDot(past.x,past.y,r,g,b,alpha);
			}
			drawDot(x,y,r,g,b,1);
		}
	}
}

class Game {
	width;
	height;

	constructor({ width=128, height=128 }={}){
		this.width=width;
		this.height=height;
		this.init();
	}
	
	init(){
		const { width, height } = this;
		const maxSpeed = 0.2;
		const maxIt = 0.01*width*height;
		const players = [];
		for(var i=0; i<maxIt; i++) {
			var x = Math.floor(rando()*width);
			var y = Math.floor(rando()*height);
			var r = Math.floor(rando()*255);
			var g = Math.floor(rando()*255);
			var b = Math.floor(rando()*255);
			const speed = rando(0.5,1,"float")*maxSpeed;
			const deg = rando(0,360);
			players.push({ x,y,r,g,b, speed,deg, history: [] });
		}
		this.players = players;
	}

	reckon(){
		const { width, height, players } = this;
		for(const player of players){
			player.x += player.speed*Math.cos(player.deg);
			player.y += player.speed*Math.sin(player.deg);
			if(player.x < 0) player.x = width-1;
			if(player.y < 0) player.y = height-1;
			if(player.x >= width) player.x = 0;
			if(player.y >= height) player.y = 0;
			player.history = [
				...player.history,
				{ x: player.x, y: player.y }
			].slice(-40);
			player.deg+=rando(-0.5,0.5, "float");
		}
		return { players };
	}
}

const game = new Game();
const board = new Board({ game });
const gameLoop = () => {
	game.reckon();
	board.render();
};
const timer = Timer(gameLoop, 1);

const controls = new Controls(timer);