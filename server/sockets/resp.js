const Responsor = [];

Responsor.push({
	event: 'Init',
	callback: (data, socket, event) => {
		console.log(data);
		return;
		socket.send('RequestStarPortInfo', {
			name: global.NodeConfig.name,
			id: global.NodeConfig.node.id,
			publicPort: global.NodeConfig.node.publicPort,
			timeline: global.ContentManager.getTimeline(data)
		});
	}
});

module.exports = Responsor;