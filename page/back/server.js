const Responsors = {};
const sendToApp = (event, data, err) => {
	chrome.runtime.sendMessage(chrome.runtime.id, {event, data, err});
};

Responsors.Init = data => {
	console.log(data);
	sendToApp('Reply', 'HolyHell!!!');
};

chrome.runtime.onMessage.addListener((data, app, cb) => {
	var cb = Responsors[data.event];
	if (!cb) return;
	cb(data.data);
});

chrome.app.runtime.onLaunched.addListener(function() {
	chrome.app.window.create('index.html', {
		id: "GamePort",
		innerBounds: {
			width: 244,
			height: 380,
			minWidth: 244,
			minHeight: 380
		}
	});
});