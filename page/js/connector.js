const GamePort = {};
const initCBs = [];

GamePort.initialized = false;
GamePort.onInit = cb => {
	if (GamePort.initialized) {
		return cb();
	}
	initCBs.push(cb);
};

const onSocketLoaded = () => {
	var responsers = new Map();

	var socket = io.connect('/');
	socket.on('__message__', msg => {
		var event = msg.event, data = msg.data, err = msg.err;
		if (!event) return;
		var cbs = responsers.get(event);
		if (!cbs || !cbs.size) return;
		for (let cb of cbs) cb(data, err, msg);
	});

	GamePort.send = function (event, data) {
		if (!socket) socket = io.connect('/');
		socket.emit('__message__', { event, data });
		return this;
	};
	GamePort.register = function (event, callback) {
		var cbs = responsers.get(event);
		if (!cbs) {
			cbs = new Set();
			responsers.set(event, cbs);
		}
		cbs.add(callback);
		return this;
	};
	GamePort.unregister = function (event, callback) {
		var cbs = responsers.get(event);
		if (!cbs) return this;
		cbs.delete(callback);
		return this;
	};

	GamePort.initialized = true;
	initCBs.forEach(cb => cb());
};
const onExtensionLoaded = () => {
	var responsers = new Map();

	chrome.runtime.onMessage.addListener(msg => {
		var event = msg.event;
		if (!event) return;
		var cbs = responsers.get(event);
		if (!cbs || !cbs.size) return;
		for (let cb of cbs) cb(msg.data, msg.err, msg);
	});

	GamePort.send = function (event, data) {
		chrome.runtime.sendMessage({event, data});
		return this;
	};
	GamePort.register = function (event, callback) {
		var cbs = responsers.get(event);
		if (!cbs) {
			cbs = new Set();
			responsers.set(event, cbs);
		}
		cbs.add(callback);
		return this;
	};
	GamePort.unregister = function (event, callback) {
		var cbs = responsers.get(event);
		if (!cbs) return this;
		cbs.delete(callback);
		return this;
	};

	setTimeout(() => {
		GamePort.initialized = true;
		initCBs.forEach(cb => cb());
	}, 0);
};

var isChromeApp = false;
try {
	if (!!chrome && !!chrome.runtime && !!chrome.runtime.id) {
		isChromeApp = true;
	}
}
catch {}

// 如果不是 Chrome App / Extension，则加载 socket.io
if (!isChromeApp) {
	let loader = document.createElement('script');
	loader.type = "text/javascript";
	loader.src = '/socket.io/socket.io.js';
	loader.onload = onSocketLoaded;
	document.body.appendChild(loader);
}
else {
	onExtensionLoaded();
}

GamePort.onInit(() => {
	GamePort.send('Init', 'Aloha Kosmos!');
});