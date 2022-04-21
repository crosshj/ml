const delay = ms => new Promise(res => setTimeout(res, ms));

const htmlToElement = function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim(); // Never return a text node of whitespace as the result
	template.innerHTML = html;
	//also would be cool to remove indentation from all lines
	return template.content.firstChild;
}

function consoleHelper(){
	console.bak = console.log;
	console.log = (...args) => {
		const text = args[0];
		const el = document.createElement('pre');
		el.innerText = text;
		document.body.appendChild(el);
		console.bak(...args);
	};

	console.bakInfo = console.info;
	console.info = (...args) => {
		const text = args[0];
		const el = document.createElement('pre');
		el.innerText = text;
		el.className = "info";
		document.body.appendChild(el);
		console.bakInfo(...args);
	};

	console.bakError = console.error;
	console.error = (...args) => {
		const text = args[0];
		const el = document.createElement('pre');
		el.innerHTML = typeof text === 'object'
			? JSON.stringify(text, null, 2)
			: text;
		el.className = "error";
		document.body.appendChild(el);
		console.bakError(...args);
	};
}

export class Stepper {
	current = 0;
	constructor(steps, onStep){
		this.steps = steps;
		this.onStep = () => onStep(this.current, this.steps[this.current]);
		this.onStep();
		
		const keyHandler = event => ({
			ArrowLeft: this.prev,
			ArrowRight: this.next
		}[event.key]);
		document.onkeydown = (e) => keyHandler(e) && keyHandler(e)(e);
	}
	next = () => {
		if(this.current + 1 >= this.steps.length) return
		this.current++;
		this.onStep()
	}
	prev = () => {
		if(this.current - 1 < 0) return
		this.current--;
		this.onStep();
	}
}

// modded from https://www.sitepoint.com/cache-fetched-ajax-requests/
const cachedFetch = (options) => (url, fetchOpts) => {
	let expiry = 5 * 60 // 5 min default
	if (typeof options === 'number') {
		expiry = options
		options = undefined
	} else if (typeof options === 'object') {
		expiry = options.seconds || expiry
	}
	let cacheKey = url
	let cached = localStorage.getItem(cacheKey)
	let whenCached = localStorage.getItem(cacheKey + ':ts')
	if (cached !== null && whenCached !== null) {
		let age = (Date.now() - whenCached) / 1000
		if (age < expiry) {
			let response = new Response(new Blob([cached]))
			return Promise.resolve(response)
		} else {
			sessionStorage.removeItem(cacheKey)
			sessionStorage.removeItem(cacheKey + ':ts')
		}
	} 

	return fetch(url, fetchOpts)
		.then(response => {
			if (response.status !== 200) return response;
			let ct = response.headers.get('Content-Type');
			const isJson =ct && (ct.match(/application\/json/i) || ct.match(/text\//i));
			if (isJson) {
				response.clone().text()
					.then(content => {
						sessionStorage.setItem(cacheKey, content)
						sessionStorage.setItem(cacheKey+':ts', Date.now())
					});
			}
			return response
		});
}


export {
	delay,
	htmlToElement,
	consoleHelper,
	cachedFetch,
};