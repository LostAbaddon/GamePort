const Responsor = [];

Responsor.push({
	event: 'Init',
	callback: (data, socket, event) => {
		console.log('>>>>', data);
		socket.send('Reply', 'HolyHell~~~');
	}
});

module.exports = Responsor;