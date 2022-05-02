const filterDom = `
<style>
	#filter-svg {
		width: 100%;
		height: 100%;
		position: absolute;
		left: 0;
		right: 0;
	}
</style>
<svg xmlns="http://www.w3.org/2000/svg" id="filter-svg">
	<filter id="myFilter">
		<!--
		<feComponentTransfer>
			<feFuncR type="gamma" exponent="0.8" amplitude="1.2" offset="0.1" />
			<feFuncG type="gamma" exponent="0.8" amplitude="1.2" offset="0.1" />
			<feFuncB type="gamma" exponent="0.8" amplitude="1.2" offset="0.1" />
		</feComponentTransfer>
		-->
		<!--
		<feColorMatrix type="saturate" values="0.35" result="desat"/>
		-->
		<!--
		<feComponentTransfer>
			<feFuncR type="discrete" tableValues="0 0.25 0.5 0.75 1" />
			<feFuncG type="discrete" tableValues="0 0.25 0.5 0.75 1" />
			<feFuncB type="discrete" tableValues="0 0.25 0.5 0.75 1" />
		</feComponentTransfer> -->
		<!--
		<feColorMatrix type="matrix"
			values="0 0 0 0 0
							0 1 0 0 0
							0 0 0 0 0
							0 0 0 1 0"
		/>
		-->

		<!-- <feMorphology operator="dilate" radius="1"/> -->
		<!-- <feGaussianBlur in="SourceGraphic" stdDeviation="1" /> -->
		<!-- <feConvolveMatrix
			kernelMatrix="
				1 0 0
				0 0 0
				0 0 -1"
		/> -->
		<!-- <feComponentTransfer in="blur">
			<feFuncG type="linear" slope="-15" intercept="8"></feFuncG>
		</feComponentTransfer> -->

		<feGaussianBlur in="SourceGraphic" result="fi" stdDeviation=".75" edgeMode="duplicate"></feGaussianBlur>
		<!-- <feGaussianBlur in="SourceGraphic" result="fo" stdDeviation="2" edgeMode="duplicate"></feGaussianBlur>
		<feGaussianBlur in="SourceGraphic" result="fe" stdDeviation="5" edgeMode="duplicate"></feGaussianBlur> -->
		<feFlood result="fie" flood-color="black" flood-opacity="1" x="0" y="0" width="100%" height="100%" />

		<feComposite in="fi" in2="fie" operator="atop" result="mask" />

		<feComponentTransfer in="mask" result="woo">
				<feFuncR type="discrete" tableValues="0 1"/>
				<feFuncG type="discrete" tableValues="0 1"/>
				<feFuncB type="discrete" tableValues="0 1 "/>
		</feComponentTransfer>

		<feColorMatrix type="matrix"
			in="woo" result="wow"
			values="0 0 0 0 0
							0 -1 0 0 1
							0 0 0 0 0
							0 0 0 1 0"
		/>
		<feColorMatrix type="matrix"
			in="wow" result="wee"
			values="-1 0 0 0 .8
							0 -1 0 0 .1
							0 0 -1 0 .15
							0 -1 0 1 0"
		/>

		<feColorMatrix type="matrix"
			in="SourceGraphic" result="gee"
			values="0 .2 0 0 0
							0 0 0 0 0
							0 1 0 0 0
							0 0 0 1 0"
		/>

		<!-- <feComposite in2="wee" in="SourceGraphic" operator="atop"/> -->
		<feBlend id="feBland" in="gee" in2="wee" mode="screen"/>

	</filter>
</svg>
`;
class Filter {
	parent;

	constructor(){
		const container = document.createElement('div');
		container.classList.add("svg-container");
		container.style.visibility = "hidden";
		container.style.height = "0px";
		container.innerHTML = filterDom;
		this.dom = container;
	}

	toggle(target) {
		target.style.filter = target.style.filter
			? ''
			: 'url(#myFilter)';
	};

	attach(parent){
		if(this.parent) return;
		parent.append(this.dom);
		this.parent = parent;
	}
}
export default Filter;
