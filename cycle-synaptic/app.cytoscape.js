function setupCytoscape(){
	var cy = cytoscape({
		container: document.getElementById('cy'),
		elements: [
			//nodes
			{ data: { id: 'B' } },
			{ data: { id: 'G' } },
			{ data: { id: 'R' } },
			{ data: { id: 'hidden1' } },
			{ data: { id: 'hidden2' } },
			{ data: { id: 'hidden3' } },
			{ data: { id: 'hidden4' } },
			{ data: { id: 'hidden5' } },
			{ data: { id: 'output' } }
		],
		style: [
			{
				selector: 'node',
				style: {
					'width': 'label',
					'height': 'label',
					'shape': 'roundrectangle',
					'content': 'data(id)',
					'border-width': 1,
					'border-color': '#ddd',
					'padding': 5,
					'text-opacity': 1,
					'text-valign': 'center',
					'text-halign': 'center',
					'background-color': '#fff'
				}
			},

			{
				selector: 'edge',
				style: {
					'width': 1,
					'target-arrow-shape': 'triangle',
					'line-color': '#ccc',
					'target-arrow-color': '#ccc',
					'curve-style': 'bezier'
				}
			}
		]
	});

	// hidden layer edges
	for (var i = 1; i <= 5; i++) {
		var source = 'hidden' + i;
		cy.add({
				data: {
						id: 'hidden-edge' + i,
						source: source,
						target: 'output'
				}
		});
	}

	//input layer edges
	['R', 'G', 'B'].forEach(item => {
		for (var k = 0; k < 5; k++) {
			cy.add({
					data: {
							id: 'input-edge' + item + '-' + (k+1),
							source: item,
							target: 'hidden' + (k+1)
					}
			});
		}
	});

	cy.layout({
		name: 'breadthfirst',
		directed: true
	});

	window.addEventListener('resize', () => {
		setTimeout(() => cy.layout({
			name: 'breadthfirst',
			directed: true
		}), 100);
	}, false);

	window.cy = cy;
}

